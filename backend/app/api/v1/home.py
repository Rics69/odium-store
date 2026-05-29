from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import HomepageSection, Product, SectionProduct
from app.api.v1.products import review_stats_map, to_card

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/sections")
async def home_sections(db: AsyncSession = Depends(get_db)):
    sec_stmt = select(HomepageSection).order_by(HomepageSection.sort_order)
    rows = await db.execute(sec_stmt)
    sections = rows.scalars().all()

    blocks: list[tuple] = []
    all_ids: list = []
    for s in sections:
        stmt = (
            select(Product)
            .join(SectionProduct, SectionProduct.product_id == Product.id)
            .where(SectionProduct.section_id == s.id)
            .where(Product.is_published.is_(True))
            .where(Product.is_active.is_(True))
            .order_by(SectionProduct.sort_order)
            .options(selectinload(Product.images))
        )
        prod_rows = await db.execute(stmt)
        products = prod_rows.scalars().unique().all()
        if not products:
            continue
        blocks.append((s, products))
        all_ids.extend(p.id for p in products)

    stats = await review_stats_map(db, list(dict.fromkeys(all_ids)))

    result = []
    for s, products in blocks:
        result.append(
            {
                "id": str(s.id),
                "title": s.title,
                "slug": s.slug,
                "sort_order": s.sort_order,
                "products": [to_card(p, stats) for p in products],
            }
        )
    return {"sections": result}
