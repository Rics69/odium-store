from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Product
from app.api.v1.products import review_stats_map, to_card

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_products(
    q: str = Query("", min_length=1, max_length=200),
    limit: int = Query(24, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q.strip()}%"
    stmt = (
        select(Product)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
        .where(Product.title.ilike(pattern))
        .order_by(Product.title)
        .limit(limit)
        .options(selectinload(Product.images))
    )
    rows = await db.execute(stmt)
    items = rows.scalars().unique().all()
    stats = await review_stats_map(db, [p.id for p in items])
    return {"items": [to_card(p, stats) for p in items]}
