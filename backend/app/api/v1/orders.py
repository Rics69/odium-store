from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.v1.products import _post_payment_fields_from_db
from app.db.session import get_db
from app.models import (
    FulfillmentType,
    Order,
    OrderInputValue,
    OrderStatus,
    Product,
    ProductInputField,
    ProductType,
    User,
)
from app.services.steam_pricing import calc_steam_checkout
from app.schemas.order import (
    OrderCreateRequest,
    OrderRead,
    OrderRepeatData,
    OrderRepeatFieldValue,
    OrderSuccessRead,
    PostPaymentSubmitRequest,
    PostPaymentSubmitResponse,
)
from app.schemas.order_status import order_status_display
from app.services.telegram import notify_new_order_telegram, notify_post_payment_submitted

router = APIRouter(tags=["orders"])


def _post_payment_snapshot_from_product(product: Product) -> list[dict]:
    raw = getattr(product, "post_payment_fields", None)
    if not isinstance(raw, list):
        return []
    buckets: list[dict] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        fk = str(row.get("field_key") or "").strip()
        if not fk:
            continue
        buckets.append(
            {
                "field_key": fk,
                "label": str(row.get("label") or ""),
                "field_type": str(row.get("field_type") or "text"),
                "required": bool(row.get("required", True)),
                "placeholder": row.get("placeholder"),
                "sort_order": int(row.get("sort_order", 0)),
            }
        )
    buckets.sort(key=lambda d: d["sort_order"])
    return [{**d, "sort_order": i} for i, d in enumerate(buckets)]


def _manual_fulfillment(product: Product) -> bool:
    return product.fulfillment == FulfillmentType.manual


def _order_read(o: Order) -> OrderRead:
    prod = o.product
    manual = prod.fulfillment == FulfillmentType.manual
    return OrderRead(
        id=str(o.id),
        product_id=str(o.product_id),
        product_title=prod.title,
        product_slug=prod.slug,
        status=o.status.value,
        status_display=order_status_display(o.status, manual),
        price_at_purchase=Decimal(str(o.price_at_purchase)),
        variant_label=o.variant_label,
    )


@router.post("/orders", response_model=OrderRead)
async def create_order(
    body: OrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .where(Product.slug == body.product_slug)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
        .options(selectinload(Product.input_fields))
    )
    row = await db.execute(stmt)
    product = row.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    is_steam = product.product_type == ProductType.steam_topup
    steam_deposit_amount: Decimal | None = None
    steam_deposit_currency: str | None = None
    variant_label_stored: str | None = None

    if is_steam:
        if body.steam_deposit_amount is None or not body.steam_deposit_currency:
            raise HTTPException(400, "Укажите сумму и способ пополнения Steam")
        steam_deposit_amount, price, variant_label_stored = calc_steam_checkout(
            deposit_amount=Decimal(str(body.steam_deposit_amount)),
            currency=body.steam_deposit_currency,
            commission_percent=Decimal(str(product.steam_commission_percent)),
            usd_to_rub=Decimal(str(product.steam_usd_to_rub)),
            kzt_to_rub=Decimal(str(product.steam_kzt_to_rub)),
        )
        steam_deposit_currency = body.steam_deposit_currency.strip().lower()
    else:
        raw_pv = getattr(product, "pricing_variants", None) or []
        if not isinstance(raw_pv, list):
            raw_pv = []

        if len(raw_pv) > 0:
            if not body.variant_label or not str(body.variant_label).strip():
                raise HTTPException(400, "Выберите тариф")
            chosen = str(body.variant_label).strip()
            row_match: dict | None = None
            for pv in raw_pv:
                if isinstance(pv, dict) and str(pv.get("label") or "").strip() == chosen:
                    row_match = pv
                    break
            if row_match is None:
                raise HTTPException(400, "Неизвестный тариф")
            price = Decimal(str(row_match["price"]))
            variant_label_stored = chosen
        else:
            price = Decimal(str(product.price))

    by_key: dict[str, ProductInputField] = {f.field_key: f for f in product.input_fields}
    values_map = {fv.field_key: fv.value for fv in body.fields}

    for key, field in by_key.items():
        if field.required and (key not in values_map or not values_map[key].strip()):
            raise HTTPException(400, f"Field required: {field.label}")
    for key in values_map:
        if key not in by_key:
            raise HTTPException(400, f"Unknown field: {key}")

    initial_status = (
        OrderStatus.processing
        if _manual_fulfillment(product)
        else OrderStatus.fulfilled
    )

    order = Order(
        user_id=user.id,
        product_id=product.id,
        status=initial_status,
        price_at_purchase=price,
        variant_label=variant_label_stored,
        steam_deposit_amount=steam_deposit_amount,
        steam_deposit_currency=steam_deposit_currency,
        post_payment_snapshot=_post_payment_snapshot_from_product(product),
    )
    db.add(order)
    await db.flush()

    for key, val in values_map.items():
        db.add(
            OrderInputValue(
                order_id=order.id,
                field_key=key,
                value=val,
            )
        )
    product.purchase_count += 1
    await db.commit()

    stmt2 = (
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.product))
    )
    order2 = (await db.execute(stmt2)).scalar_one()

    pre_fields: list[tuple[str, str]] = []
    for f in sorted(product.input_fields, key=lambda x: x.sort_order):
        if f.field_key in values_map:
            pre_fields.append((f.label, values_map[f.field_key]))

    await notify_new_order_telegram(
        order_id=order2.id,
        product_title=product.title,
        fulfillment_manual=_manual_fulfillment(product),
        user_email=user.email,
        user_display_name=user.display_name,
        price=price,
        variant_label=variant_label_stored,
        pre_fields=pre_fields,
        show_action_buttons=(initial_status == OrderStatus.processing),
        steam_deposit_amount=steam_deposit_amount,
        steam_deposit_currency=steam_deposit_currency,
    )

    return _order_read(order2)


@router.get("/orders/{order_id}", response_model=OrderSuccessRead)
async def get_order_for_success_page(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        oid = UUID(order_id)
    except ValueError:
        raise HTTPException(400, "Invalid order id")
    stmt = (
        select(Order)
        .where(Order.id == oid)
        .options(selectinload(Order.product))
    )
    row = await db.execute(stmt)
    order = row.scalar_one_or_none()
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Not found")
    raw = order.post_payment_snapshot if isinstance(order.post_payment_snapshot, list) else []
    fields = _post_payment_fields_from_db(raw)
    submitted = order.post_payment_submitted is not None
    manual = order.product.fulfillment == FulfillmentType.manual
    return OrderSuccessRead(
        id=str(order.id),
        product_title=order.product.title,
        status=order.status.value,
        status_display=order_status_display(order.status, manual),
        post_payment_fields=fields,
        post_payment_already_submitted=submitted,
    )


@router.post("/orders/{order_id}/post-payment", response_model=PostPaymentSubmitResponse)
async def submit_post_payment_fields(
    order_id: str,
    body: PostPaymentSubmitRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        oid = UUID(order_id)
    except ValueError:
        raise HTTPException(400, "Invalid order id")
    stmt = (
        select(Order)
        .where(Order.id == oid)
        .options(selectinload(Order.product))
    )
    row = await db.execute(stmt)
    order = row.scalar_one_or_none()
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Not found")

    if order.post_payment_submitted is not None:
        raise HTTPException(400, "Данные уже отправлены")

    snap = (
        order.post_payment_snapshot if isinstance(order.post_payment_snapshot, list) else []
    )
    meta_by_key: dict[str, dict] = {}
    for row in snap:
        if isinstance(row, dict):
            fk = str(row.get("field_key") or "").strip()
            if fk:
                meta_by_key[fk] = row

    if not meta_by_key:
        raise HTTPException(400, "Нет полей после оплаты для этого заказа")

    vals_raw = dict(body.values or {})
    unknown_keys = set(vals_raw.keys()) - set(meta_by_key.keys())
    if unknown_keys:
        raise HTTPException(400, "Неизвестные поля")

    norm: dict[str, str] = {}
    for fk, meta in meta_by_key.items():
        lab = str(meta.get("label") or fk)
        req = bool(meta.get("required", True))
        raw_v = vals_raw.get(fk, "")
        v = raw_v.strip() if isinstance(raw_v, str) else str(raw_v).strip()
        if req and not v:
            raise HTTPException(400, f"Заполните поле: {lab}")
        norm[fk] = v

    order.post_payment_submitted = {"values": norm}
    db.add(order)
    await db.commit()

    sorted_keys = sorted(
        meta_by_key.keys(),
        key=lambda k: (int(meta_by_key[k].get("sort_order", 0)), str(k)),
    )
    telegram_rows = [(str(meta_by_key[fk].get("label") or fk), norm[fk]) for fk in sorted_keys]

    await notify_post_payment_submitted(
        order_id=order.id,
        product_title=order.product.title,
        user_email=user.email,
        fields=telegram_rows,
    )

    return PostPaymentSubmitResponse()


@router.get("/orders/{order_id}/repeat-data", response_model=OrderRepeatData)
async def get_order_repeat_data(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Данные для повторного оформления заказа.

    Возвращает product_slug, тариф/сумму для Steam и значения полей ввода —
    их фронт показывает в модалке подтверждения и затем дублирует в POST /orders.
    """
    try:
        oid = UUID(order_id)
    except ValueError:
        raise HTTPException(400, "Invalid order id")
    stmt = (
        select(Order)
        .where(Order.id == oid)
        .options(
            selectinload(Order.product).selectinload(Product.input_fields),
            selectinload(Order.field_values),
        )
    )
    row = await db.execute(stmt)
    order = row.scalar_one_or_none()
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Not found")

    product = order.product

    is_steam = product.product_type == ProductType.steam_topup
    steam_amount: Decimal | None = (
        Decimal(str(order.steam_deposit_amount))
        if order.steam_deposit_amount is not None
        else None
    )
    steam_currency: str | None = order.steam_deposit_currency

    estimated_price = Decimal(str(order.price_at_purchase))
    if is_steam and steam_amount is not None and steam_currency:
        try:
            _, recalculated, _ = calc_steam_checkout(
                deposit_amount=steam_amount,
                currency=steam_currency,
                commission_percent=Decimal(str(product.steam_commission_percent)),
                usd_to_rub=Decimal(str(product.steam_usd_to_rub)),
                kzt_to_rub=Decimal(str(product.steam_kzt_to_rub)),
            )
            estimated_price = recalculated
        except HTTPException:
            pass
    else:
        raw_pv = getattr(product, "pricing_variants", None) or []
        if isinstance(raw_pv, list) and raw_pv:
            target = order.variant_label or ""
            for pv in raw_pv:
                if isinstance(pv, dict) and str(pv.get("label") or "").strip() == target.strip():
                    estimated_price = Decimal(str(pv["price"]))
                    break
        else:
            estimated_price = Decimal(str(product.price))

    fields = [
        OrderRepeatFieldValue(field_key=fv.field_key, value=fv.value)
        for fv in sorted(order.field_values, key=lambda v: v.field_key)
    ]

    return OrderRepeatData(
        product_slug=product.slug,
        product_title=product.title,
        product_type=product.product_type.value
        if hasattr(product.product_type, "value")
        else str(product.product_type),
        product_is_available=bool(product.is_published and product.is_active),
        variant_label=order.variant_label,
        steam_deposit_amount=steam_amount,
        steam_deposit_currency=steam_currency,
        fields=fields,
        estimated_price=estimated_price,
    )


@router.get("/users/me/orders", response_model=list[OrderRead])
async def my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.id.desc())
        .options(selectinload(Order.product))
    )
    rows = await db.execute(stmt)
    orders_list = rows.scalars().unique().all()
    return [_order_read(o) for o in orders_list]
