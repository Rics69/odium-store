from uuid import UUID

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import (
    FulfillmentType,
    HomepageSection,
    InputFieldType,
    Product,
    ProductImage,
    ProductInputField,
    ProductType,
    SectionProduct,
    User,
)
from app.schemas.product import (
    AccordionSection,
    PricingVariant,
    ProductCreate,
    ProductDetail,
    ProductInputFieldCreate,
    ProductUpdate,
)
from app.api.v1.products import review_stats_map, to_detail
from app.utils.slug import slugify

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


def _accordion_db_payload(entries: list[AccordionSection]) -> list[dict]:
    return [
        {"title": s.title.strip(), "content": s.content.strip()}
        for s in entries
        if s.title.strip() or s.content.strip()
    ]


def _variants_db_payload(variants: list[PricingVariant]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for v in variants:
        label = v.label.strip()
        if not label:
            raise HTTPException(400, "У каждого тарифа должно быть название.")
        if label in seen:
            raise HTTPException(400, "Названия тарифов не должны повторяться.")
        seen.add(label)
        if v.price <= 0:
            raise HTTPException(400, f"Цена тарифа «{label}» должна быть положительной.")
        out.append(
            {
                "label": label,
                "price": float(v.price),
                "old_price": float(v.old_price) if v.old_price is not None else None,
            }
        )
    return out


def _post_payment_db_payload(entries: list[ProductInputFieldCreate]) -> list[dict]:
    keys: set[str] = set()
    out: list[dict] = []
    for f in entries:
        k = f.field_key.strip()
        lab = f.label.strip()
        if not k and not lab and not (f.placeholder or "").strip():
            continue
        if not k:
            raise HTTPException(
                400,
                "У каждого поля «после оплаты» должен быть ключ (латиница, например account_password).",
            )
        if not re.match(r"^[a-z0-9_]+$", k):
            raise HTTPException(
                400,
                f"Некорректный ключ «{k}»: только a–z, цифры и _.",
            )
        if k in keys:
            raise HTTPException(400, f"Ключ «{k}» в полях после оплаты повторяется.")
        keys.add(k)
        if not lab:
            raise HTTPException(400, f"У поля «{k}» должна быть подпись.")
        out.append(
            {
                "field_key": k,
                "label": lab,
                "field_type": f.field_type,
                "required": f.required,
                "placeholder": f.placeholder,
                "sort_order": len(out),
            }
        )
    return out


async def replace_product_homepage_sections(
    db: AsyncSession, product_id: UUID, section_slugs: list[str]
) -> None:
    await db.execute(delete(SectionProduct).where(SectionProduct.product_id == product_id))
    for i, slug in enumerate(section_slugs):
        r = await db.execute(select(HomepageSection).where(HomepageSection.slug == slug))
        sec = r.scalar_one_or_none()
        if sec is None:
            raise HTTPException(400, f"Неизвестная секция главной: {slug}")
        db.add(SectionProduct(section_id=sec.id, product_id=product_id, sort_order=i))


def _product_load_options():
    return (
        selectinload(Product.images),
        selectinload(Product.input_fields),
        selectinload(Product.sections).selectinload(SectionProduct.section),
    )


@router.get("", response_model=list[ProductDetail])
async def admin_list(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = (
        select(Product)
        .order_by(Product.is_active.desc(), Product.title)
        .options(*_product_load_options())
    )
    rows = await db.execute(stmt)
    products = rows.scalars().unique().all()
    stats = await review_stats_map(db, [p.id for p in products])
    return [to_detail(p, stats) for p in products]


@router.post("", response_model=ProductDetail)
async def admin_create(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    slug = body.slug or slugify(body.title)
    exists = await db.execute(select(Product).where(Product.slug == slug))
    if exists.scalar_one_or_none():
        raise HTTPException(400, "Slug already exists")

    prod = Product(
        slug=slug,
        title=body.title,
        description=body.description,
        price=body.price,
        old_price=body.old_price,
        product_type=ProductType(body.product_type),
        steam_commission_percent=body.steam_commission_percent,
        steam_usd_to_rub=body.steam_usd_to_rub,
        steam_kzt_to_rub=body.steam_kzt_to_rub,
        fulfillment=FulfillmentType(body.fulfillment),
        is_published=body.is_published,
        is_active=body.is_active,
        instruction_title=body.instruction_title.strip(),
        instruction_body=body.instruction_body.strip(),
        faq_sections=_accordion_db_payload(body.faq_sections),
        pricing_variants=_variants_db_payload(body.pricing_variants),
        post_payment_fields=_post_payment_db_payload(body.post_payment_fields),
    )
    db.add(prod)
    await db.flush()

    for i, url in enumerate(body.image_urls):
        db.add(ProductImage(product_id=prod.id, url=url, sort_order=i))

    for f in body.input_fields:
        db.add(
            ProductInputField(
                product_id=prod.id,
                field_key=f.field_key,
                label=f.label,
                field_type=InputFieldType(f.field_type),
                required=f.required,
                placeholder=f.placeholder,
                sort_order=f.sort_order,
            )
        )
    await replace_product_homepage_sections(db, prod.id, body.homepage_section_slugs)
    await db.commit()
    stmt = (
        select(Product)
        .where(Product.id == prod.id)
        .options(*_product_load_options())
    )
    p = (await db.execute(stmt)).scalar_one()
    stats = await review_stats_map(db, [p.id])
    return to_detail(p, stats)


@router.get("/{product_id}", response_model=ProductDetail)
async def admin_get(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        pid = UUID(product_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    stmt = (
        select(Product)
        .where(Product.id == pid)
        .options(*_product_load_options())
    )
    p = (await db.execute(stmt)).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Not found")
    stats = await review_stats_map(db, [p.id])
    return to_detail(p, stats)


@router.put("/{product_id}", response_model=ProductDetail)
async def admin_update(
    product_id: str,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        pid = UUID(product_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    stmt = (
        select(Product)
        .where(Product.id == pid)
        .options(*_product_load_options())
    )
    p = (await db.execute(stmt)).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Not found")

    if body.title is not None:
        p.title = body.title
    if body.description is not None:
        p.description = body.description
    if body.price is not None:
        p.price = body.price
    if body.old_price is not None:
        p.old_price = body.old_price
    if body.fulfillment is not None:
        p.fulfillment = FulfillmentType(body.fulfillment)
    if body.product_type is not None:
        p.product_type = ProductType(body.product_type)
    if body.steam_commission_percent is not None:
        p.steam_commission_percent = body.steam_commission_percent
    if body.steam_usd_to_rub is not None:
        p.steam_usd_to_rub = body.steam_usd_to_rub
    if body.steam_kzt_to_rub is not None:
        p.steam_kzt_to_rub = body.steam_kzt_to_rub
    if body.is_published is not None:
        p.is_published = body.is_published
    if body.is_active is not None:
        p.is_active = body.is_active
    if body.slug is not None:
        other = await db.execute(
            select(Product).where(Product.slug == body.slug, Product.id != p.id)
        )
        if other.scalar_one_or_none():
            raise HTTPException(400, "Slug taken")
        p.slug = body.slug

    if body.image_urls is not None:
        await db.execute(delete(ProductImage).where(ProductImage.product_id == p.id))
        for i, url in enumerate(body.image_urls):
            db.add(ProductImage(product_id=p.id, url=url, sort_order=i))

    if body.input_fields is not None:
        await db.execute(delete(ProductInputField).where(ProductInputField.product_id == p.id))
        for f in body.input_fields:
            db.add(
                ProductInputField(
                    product_id=p.id,
                    field_key=f.field_key,
                    label=f.label,
                    field_type=InputFieldType(f.field_type),
                    required=f.required,
                    placeholder=f.placeholder,
                    sort_order=f.sort_order,
                )
            )

    if body.homepage_section_slugs is not None:
        await replace_product_homepage_sections(db, p.id, body.homepage_section_slugs)

    if body.instruction_title is not None:
        p.instruction_title = body.instruction_title.strip()
    if body.instruction_body is not None:
        p.instruction_body = body.instruction_body.strip()
    if body.faq_sections is not None:
        p.faq_sections = _accordion_db_payload(body.faq_sections)
    if body.pricing_variants is not None:
        p.pricing_variants = _variants_db_payload(body.pricing_variants)
    if body.post_payment_fields is not None:
        p.post_payment_fields = _post_payment_db_payload(body.post_payment_fields)

    await db.commit()
    stmt = (
        select(Product)
        .where(Product.id == pid)
        .options(*_product_load_options())
    )
    p2 = (await db.execute(stmt)).scalar_one()
    stats = await review_stats_map(db, [p2.id])
    return to_detail(p2, stats)


@router.delete("/{product_id}")
async def admin_delete(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        pid = UUID(product_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    p = await db.get(Product, pid)
    if not p:
        raise HTTPException(404, "Not found")
    p.is_active = False
    p.is_published = False
    await db.commit()
    return {"ok": True}
