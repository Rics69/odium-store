import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.admin import products as admin_products
from app.api.v1.admin import sections as admin_sections
from app.api.v1.admin import reviews as admin_reviews
from app.api.v1 import auth, home, orders, payments, products, reviews, search, telegram_webhook, users
from app.config import get_settings
from app.services.telegram import telegram_admin_user_ids_set

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
)
logging.getLogger("app.api.v1.telegram_webhook").setLevel(logging.INFO)

settings = get_settings()

app = FastAPI(title="Odium API", version="0.1.0")


@app.on_event("startup")
async def _log_telegram_setup() -> None:
    token = bool((settings.telegram_bot_token or "").strip())
    chat = (settings.telegram_admin_chat_id or "").strip()
    admins = telegram_admin_user_ids_set()
    base = (settings.public_base_url or "").strip()
    log = logging.getLogger("app.main")
    log.info("Telegram: token=%s chat_id=%s admins=%s", "да" if token else "нет", chat or "—", admins)
    webhook_url = f"{base.rstrip('/')}/v1/telegram/webhook" if base else "—"
    log.info("Telegram webhook URL (для setWebhook): %s", webhook_url)
    if "localhost" in base or "127.0.0.1" in base:
        log.warning(
            "PUBLIC_BASE_URL=localhost — Telegram НЕ доставит нажатия кнопок. "
            "Запустите ngrok http 8000 и: PUBLIC_BASE_URL=https://.... python scripts/telegram_set_webhook.py"
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_root = Path(settings.upload_dir)
upload_root.mkdir(parents=True, exist_ok=True)
(upload_root / "avatars").mkdir(exist_ok=True)
(upload_root / "products").mkdir(exist_ok=True)

app.mount("/static/avatars", StaticFiles(directory=str(upload_root / "avatars")), name="avatars")

prefix = "/v1"

app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(products.router, prefix=prefix)
app.include_router(search.router, prefix=prefix)
app.include_router(home.router, prefix=prefix)
app.include_router(orders.router, prefix=prefix)
app.include_router(reviews.router, prefix=prefix)
app.include_router(admin_products.router, prefix=prefix)
app.include_router(admin_sections.router, prefix=prefix)
app.include_router(admin_reviews.router, prefix=prefix)
app.include_router(payments.router, prefix=prefix)
app.include_router(telegram_webhook.router, prefix=prefix)


@app.get("/health")
async def health():
    return {"status": "ok"}
