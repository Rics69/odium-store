from pydantic import BaseModel, Field, field_validator


def _normalize_email(v: str) -> str:
    s = v.strip().lower()
    if "@" not in s:
        raise ValueError("Некорректный email")
    local, _, domain = s.partition("@")
    if not local or not domain or "." not in domain:
        raise ValueError("Некорректный email")
    return s


class RegisterRequest(BaseModel):
    """Без EmailStr: адреса вида name@host.local (локальная зона) режет email-validator → 422."""
    email: str = Field(..., max_length=320)
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=120)

    @field_validator("email")
    @classmethod
    def email_ok(cls, v: str) -> str:
        return _normalize_email(v)


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=320)
    password: str

    @field_validator("email")
    @classmethod
    def email_ok(cls, v: str) -> str:
        return _normalize_email(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None
    role: str

    model_config = {"from_attributes": True}


class UserMeUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
