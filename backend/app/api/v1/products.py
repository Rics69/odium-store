from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models import HomepageSection, Product, ProductType, Review, SectionProduct, User, UserRole
from app.schemas.product import (
    AccordionSection,
    PricingVariant,
    ProductCard,
    ProductDetail,
    ProductImageRead,
    ProductInputFieldRead,
    ProductPostPaymentField,
)

router = APIRouter(prefix="/products", tags=["products"])


async def review_stats_map(
    db: AsyncSession, ids: list[UUID]
) -> dict[UUID, tuple[int, float | None]]:
    if not ids:
        return {}
    stmt = (
        select(Review.product_id, func.count(Review.id), func.avg(Review.rating))
        .where(Review.product_id.in_(ids))
        .group_by(Review.product_id)
    )
    rows = await db.execute(stmt)
    out: dict[UUID, tuple[int, float | None]] = {}
    for pid, cnt, avg in rows.all():
        avg_f = round(float(avg), 2) if avg is not None else None
        out[pid] = (int(cnt), avg_f)
    return out


def _images(p: Product) -> list[ProductImageRead]:
    return [
        ProductImageRead(id=str(im.id), url=im.url, sort_order=im.sort_order)
        for im in sorted(p.images, key=lambda x: x.sort_order)
    ]


def _fields(p: Product) -> list[ProductInputFieldRead]:
    return [
        ProductInputFieldRead(
            id=str(f.id),
            field_key=f.field_key,
            label=f.label,
            field_type=f.field_type.value,
            required=f.required,
            placeholder=f.placeholder,
            sort_order=f.sort_order,
        )
        for f in sorted(p.input_fields, key=lambda x: x.sort_order)
    ]


def _homepage_section_slugs(p: Product) -> list[str]:
    links = getattr(p, "sections", None) or []
    triples: list[tuple[int, int, str]] = []
    for sp in links:
        sec = getattr(sp, "section", None)
        if sec is None:
            continue
        triples.append((sec.sort_order, sp.sort_order, sec.slug))
    triples.sort(key=lambda t: (t[0], t[1]))
    return [t[2] for t in triples]


def _raw_json_list(val) -> list:
    return val if isinstance(val, list) else []


def _listing_prices(product: Product) -> tuple[Decimal, Decimal | None]:
    pv = _raw_json_list(getattr(product, "pricing_variants", None))
    if pv:
        row = pv[0]
        if isinstance(row, dict) and str(row.get("label") or "").strip():
            op = row.get("old_price")
            return Decimal(str(row["price"])), (
                Decimal(str(op)) if op is not None else None
            )
    op_db = product.old_price
    return Decimal(str(product.price)), Decimal(str(op_db)) if op_db is not None else None


def _accordion_sections_from_db(rows: list) -> list[AccordionSection]:
    out: list[AccordionSection] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title") or "").strip()
        content = str(row.get("content") or "").strip()
        if title or content:
            out.append(AccordionSection(title=title, content=content))
    return out


def _pricing_variants_from_db(rows: list) -> list[PricingVariant]:
    out: list[PricingVariant] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        label = str(row.get("label") or "").strip()
        if not label:
            continue
        try:
            price = Decimal(str(row["price"]))
            op_raw = row.get("old_price")
            out.append(
                PricingVariant(
                    label=label,
                    price=price,
                    old_price=(
                        Decimal(str(op_raw))
                        if op_raw is not None
                        else None
                    ),
                )
            )
        except (ArithmeticError, TypeError, KeyError):
            continue
    return out


def _post_payment_fields_from_db(rows: list) -> list[ProductPostPaymentField]:
    parsed: list[ProductPostPaymentField] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        fk = str(row.get("field_key") or "").strip()
        if not fk:
            continue
        try:
            parsed.append(
                ProductPostPaymentField(
                    field_key=fk,
                    label=str(row.get("label") or ""),
                    field_type=str(row.get("field_type") or "text"),
                    required=bool(row.get("required", True)),
                    placeholder=row.get("placeholder"),
                    sort_order=int(row.get("sort_order", 0)),
                )
            )
        except (TypeError, ValueError):
            continue
    parsed.sort(key=lambda x: x.sort_order)
    return parsed


def to_card(
    p: Product,
    stats_map: dict[UUID, tuple[int, float | None]] | None = None,
) -> ProductCard:
    rc, avg = (0, None)
    if stats_map is not None and p.id in stats_map:
        rc, avg = stats_map[p.id]
    px, ox = _listing_prices(p)
    return ProductCard(
        id=str(p.id),
        slug=p.slug,
        title=p.title,
        description=p.description[:500] if len(p.description) > 500 else p.description,
        price=px,
        old_price=ox,
        fulfillment=p.fulfillment.value,
        purchase_count=p.purchase_count,
        review_count=rc,
        average_rating=avg,
        images=_images(p),
    )


def to_detail(
    p: Product,
    stats_map: dict[UUID, tuple[int, float | None]] | None = None,
) -> ProductDetail:
    card = to_card(p, stats_map)
    faq = _accordion_sections_from_db(_raw_json_list(getattr(p, "faq_sections", None)))
    pvars = _pricing_variants_from_db(_raw_json_list(getattr(p, "pricing_variants", None)))
    pp = _post_payment_fields_from_db(_raw_json_list(getattr(p, "post_payment_fields", None)))
    return ProductDetail(
        **card.model_dump(exclude={"description"}),
        description=p.description,
        product_type=p.product_type.value,
        steam_commission_percent=Decimal(str(p.steam_commission_percent)),
        steam_usd_to_rub=Decimal(str(p.steam_usd_to_rub)),
        steam_kzt_to_rub=Decimal(str(p.steam_kzt_to_rub)),
        input_fields=_fields(p),
        is_published=p.is_published,
        is_active=p.is_active,
        homepage_section_slugs=_homepage_section_slugs(p),
        instruction_title=getattr(p, "instruction_title", "") or "",
        instruction_body=getattr(p, "instruction_body", "") or "",
        faq_sections=faq,
        pricing_variants=pvars,
        post_payment_fields=pp,
    )


def _product_stmt(slug: str, admin_preview: bool):
    q = select(Product).where(Product.slug == slug)
    if not admin_preview:
        q = q.where(Product.is_published.is_(True)).where(Product.is_active.is_(True))
    return q.options(
        selectinload(Product.images),
        selectinload(Product.input_fields),
        selectinload(Product.sections).selectinload(SectionProduct.section),
    )


@router.get("", response_model=list[ProductCard])
async def list_products(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
):
    stmt = (
        select(Product)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
        .order_by(Product.title)
        .offset(skip)
        .limit(limit)
        .options(selectinload(Product.images))
    )
    rows = await db.execute(stmt)
    products = rows.scalars().unique().all()
    stats = await review_stats_map(db, [p.id for p in products])
    return [to_card(p, stats) for p in products]


@router.get("/{slug}", response_model=ProductDetail)
async def get_product(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
):
    admin_preview = bool(current and current.role == UserRole.admin)
    stmt = _product_stmt(slug, admin_preview=admin_preview)
    row = await db.execute(stmt)
    product = row.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Not found")
    stats = await review_stats_map(db, [product.id])
    return to_detail(product, stats)


@router.get("/{slug}/recommended", response_model=list[ProductCard])
async def product_recommended(
    slug: str,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(8, ge=1, le=24),
):
    """Рекомендации из секции «Лучшие товары» (slug best), без текущего товара."""
    sec_row = await db.execute(select(HomepageSection).where(HomepageSection.slug == "best"))
    section = sec_row.scalar_one_or_none()
    if not section:
        return []

    stmt = (
        select(Product)
        .join(SectionProduct, SectionProduct.product_id == Product.id)
        .where(SectionProduct.section_id == section.id)
        .where(Product.slug != slug)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
        .order_by(SectionProduct.sort_order)
        .limit(limit)
        .options(selectinload(Product.images))
    )
    rows = await db.execute(stmt)
    products = rows.scalars().unique().all()
    stats = await review_stats_map(db, [p.id for p in products])
    return [to_card(p, stats) for p in products]
