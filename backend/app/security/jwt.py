from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt

from app.config import get_settings


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> tuple[UUID, str]:
    settings = get_settings()
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = data.get("sub")
        if not sub:
            raise ValueError("missing sub")
        return UUID(sub), str(data.get("role", "user"))
    except (JWTError, ValueError) as e:
        raise ValueError("invalid token") from e
