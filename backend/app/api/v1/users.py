from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import get_settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import UserMeUpdate, UserPublic

router = APIRouter(prefix="/users", tags=["users"])


def user_public(u: User) -> UserPublic:
    return UserPublic(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        avatar_url=u.avatar_url,
        role=u.role.value,
    )


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)):
    return user_public(user)


@router.put("/me", response_model=UserPublic)
async def update_me(
    body: UserMeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.display_name is not None:
        user.display_name = body.display_name
    await db.commit()
    await db.refresh(user)
    return user_public(user)


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    settings = get_settings()
    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(400, "Unsupported image type")
    uid = str(user.id)
    upload_root = Path(settings.upload_dir) / "avatars"
    upload_root.mkdir(parents=True, exist_ok=True)
    name = f"{uid}{ext}"
    path = upload_root / name
    content = await file.read()
    if len(content) > 3 * 1024 * 1024:
        raise HTTPException(400, "File too large")
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    public = f"{settings.public_base_url}/static/avatars/{name}"
    user.avatar_url = public
    await db.commit()
    await db.refresh(user)
    return user_public(user)
