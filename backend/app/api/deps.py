from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User, UserRole
from app.security.jwt import decode_token


async def get_token(
    authorization: str | None = Header(default=None),
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return access_token


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str | None, Depends(get_token)],
) -> User | None:
    if not token:
        return None
    try:
        user_id, _role = decode_token(token)
    except ValueError:
        return None
    row = await db.execute(select(User).where(User.id == user_id))
    return row.scalar_one_or_none()


async def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


async def require_admin(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user
