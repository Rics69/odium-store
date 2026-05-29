from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://odium:odium@localhost:5432/odium"
    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    refresh_token_expire_minutes: int = 60 * 24 * 30

    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    upload_dir: str = "uploads"
    public_base_url: str = "http://localhost:8000"

    telegram_bot_token: str = ""
    """Токен BotFather. Пусто — уведомления в Telegram отключены."""

    telegram_admin_chat_id: str = ""
    """Chat ID (личка или группа), куда слать уведомления о заказах."""

    telegram_admin_user_ids: str = ""
    """Telegram user id админов через запятую — кто может жать «Выполнено/Отменить» в боте."""

    telegram_webhook_secret: str = ""
    """Если задан, заголовок вебхука X-Telegram-Bot-Api-Secret-Token должен совпадать."""


@lru_cache
def get_settings() -> Settings:
    return Settings()
