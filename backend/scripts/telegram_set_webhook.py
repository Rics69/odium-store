#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings


def main() -> None:
    s = get_settings()
    token = (s.telegram_bot_token or "").strip()
    if not token:
        print("Ошибка: TELEGRAM_BOT_TOKEN не задан в .env")
        sys.exit(1)

    base = (os.environ.get("PUBLIC_BASE_URL") or s.public_base_url or "").strip().rstrip("/")
    if not base or "localhost" in base or "127.0.0.1" in base:
        print(
            "Ошибка: PUBLIC_BASE_URL должен быть публичным HTTPS (не localhost).\n"
            "Пример: PUBLIC_BASE_URL=https://abc123.ngrok-free.app python scripts/telegram_set_webhook.py"
        )
        sys.exit(1)

    url = f"{base}/v1/telegram/webhook"
    secret = (s.telegram_webhook_secret or "").strip()

    payload: dict = {"url": url, "allowed_updates": ["callback_query", "message"]}
    if secret:
        payload["secret_token"] = secret

    api = f"https://api.telegram.org/bot{token}/setWebhook"
    req = urllib.request.Request(
        api,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP ошибка:", e.read().decode())
        sys.exit(1)

    print("setWebhook:", json.dumps(data, ensure_ascii=False, indent=2))
    if not data.get("ok"):
        sys.exit(1)

    info_req = urllib.request.Request(f"https://api.telegram.org/bot{token}/getWebhookInfo")
    with urllib.request.urlopen(info_req, timeout=30) as resp:
        info = json.loads(resp.read().decode())
    print("\ngetWebhookInfo:", json.dumps(info, ensure_ascii=False, indent=2))
    print(f"\nВебхук: {url}")
    if secret:
        print(f"Secret: {secret} (заголовок X-Telegram-Bot-Api-Secret-Token)")
    print("\nНажмите «Выполнено» в боте и смотрите логи uvicorn.")


if __name__ == "__main__":
    main()
