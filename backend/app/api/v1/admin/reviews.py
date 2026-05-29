from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import Review, User

router = APIRouter(prefix="/admin/reviews", tags=["admin-reviews"])


@router.delete("/{review_id}")
async def admin_delete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        rid = UUID(review_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    rev = await db.get(Review, rid)
    if not rev:
        raise HTTPException(404, "Not found")
    await db.delete(rev)
    await db.commit()
    return {"ok": True}
