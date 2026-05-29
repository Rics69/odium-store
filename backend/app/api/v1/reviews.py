from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Order, OrderStatus, Product, Review, User
from app.constants.review_tags import REVIEW_TAG_OPTIONS
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(tags=["reviews"])


@router.get("/products/{slug}/reviews", response_model=list[ReviewRead])
async def list_reviews(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Product)
        .where(Product.slug == slug)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
    )
    pr = (await db.execute(stmt)).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "Product not found")
    rstmt = (
        select(Review)
        .where(Review.product_id == pr.id)
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
    )
    rows = await db.execute(rstmt)
    reviews = rows.scalars().all()
    out: list[ReviewRead] = []
    for r in reviews:
        created = r.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        raw_tags = r.tags if isinstance(r.tags, list) else []
        tags = [str(t) for t in raw_tags if str(t).strip()]
        out.append(
            ReviewRead(
                id=str(r.id),
                rating=r.rating,
                text=r.text,
                tags=tags,
                created_at=created.isoformat(),
                display_name=r.user.display_name,
                avatar_url=r.user.avatar_url,
            )
        )
    return out


@router.post("/products/{slug}/reviews", response_model=ReviewRead)
async def create_review(
    slug: str,
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .where(Product.slug == slug)
        .where(Product.is_published.is_(True))
        .where(Product.is_active.is_(True))
    )
    pr = (await db.execute(stmt)).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "Product not found")

    exist = await db.execute(
        select(Review).where(Review.user_id == user.id, Review.product_id == pr.id)
    )
    if exist.scalar_one_or_none():
        raise HTTPException(409, "Review already exists")

    ord_stmt = (
        select(Order)
        .where(
            Order.user_id == user.id,
            Order.product_id == pr.id,
            Order.status == OrderStatus.fulfilled,
        )
        .order_by(Order.id.desc())
        .limit(1)
    )
    order = (await db.execute(ord_stmt)).scalars().first()
    if not order:
        raise HTTPException(403, "Purchase required to leave a review")

    allowed = set(REVIEW_TAG_OPTIONS)
    tags = [t for t in body.tags if t in allowed]
    text = body.text.strip()
    if not text and not tags:
        raise HTTPException(400, "Выберите плашки или напишите отзыв")

    rev = Review(
        user_id=user.id,
        product_id=pr.id,
        order_id=order.id,
        rating=body.rating,
        text=text,
        tags=tags,
    )
    db.add(rev)
    await db.commit()
    await db.refresh(rev)
    await db.refresh(user)

    created = rev.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return ReviewRead(
        id=str(rev.id),
        rating=rev.rating,
        text=rev.text,
        tags=tags,
        created_at=created.isoformat(),
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )
