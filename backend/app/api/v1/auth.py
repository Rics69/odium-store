from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserPublic
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def user_public(u: User) -> UserPublic:
    return UserPublic(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        avatar_url=u.avatar_url,
        role=u.role.value,
    )


@router.post("/register", response_model=LoginResponse)
async def register(data: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(User.email == data.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        role=UserRole.user,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(str(user.id), user.role.value)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return LoginResponse(access_token=token, user=user_public(user))


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id), user.role.value)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return LoginResponse(access_token=token, user=user_public(user))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}
