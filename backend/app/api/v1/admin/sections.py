from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import HomepageSection, Product, SectionProduct, User
from app.schemas.product import SectionCreate, SectionProductsUpdate

router = APIRouter(prefix="/admin/sections", tags=["admin-sections"])


@router.get("")
async def list_sections(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(HomepageSection).order_by(HomepageSection.sort_order)
    rows = await db.execute(stmt)
    sections = rows.scalars().all()
    return {
        "sections": [
            {"id": str(s.id), "title": s.title, "slug": s.slug, "sort_order": s.sort_order}
            for s in sections
        ]
    }


@router.post("")
async def create_section(
    body: SectionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    exists = await db.execute(select(HomepageSection).where(HomepageSection.slug == body.slug))
    if exists.scalar_one_or_none():
        raise HTTPException(400, "Slug exists")
    sort_order_val = body.sort_order
    if sort_order_val is None:
        mx = await db.scalar(select(func.max(HomepageSection.sort_order)))
        sort_order_val = int(mx) + 1 if mx is not None else 0
    sec = HomepageSection(title=body.title, slug=body.slug, sort_order=sort_order_val)
    db.add(sec)
    await db.commit()
    await db.refresh(sec)
    return {"id": str(sec.id)}


@router.put("/{section_id}/products")
async def set_section_products(
    section_id: str,
    body: SectionProductsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        sid = UUID(section_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    sec = await db.get(HomepageSection, sid)
    if not sec:
        raise HTTPException(404, "Not found")
    await db.execute(delete(SectionProduct).where(SectionProduct.section_id == sid))
    for i, pid_s in enumerate(body.product_ids):
        try:
            pid = UUID(pid_s)
        except ValueError:
            continue
        if await db.get(Product, pid):
            db.add(SectionProduct(section_id=sid, product_id=pid, sort_order=i))
    await db.commit()
    return {"ok": True}


@router.delete("/{section_id}")
async def delete_section(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        sid = UUID(section_id)
    except ValueError:
        raise HTTPException(400, "Invalid id")
    sec = await db.get(HomepageSection, sid)
    if not sec:
        raise HTTPException(404, "Not found")
    await db.delete(sec)
    await db.commit()
    return {"ok": True}
