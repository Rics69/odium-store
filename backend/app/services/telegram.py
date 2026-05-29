"""Уведомления в Telegram (Bot API)."""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from app.config import get_settings
from app.services.steam_pricing import STEAM_CURRENCY_LABELS

logger = logging.getLogger(__name__)


def _parse_admin_user_ids(raw: str) -> set[int]:
    out: set[int] = set()
    for part in (raw or "").split(","):
        part = part.strip().strip('"').strip("'").strip()
        if part.isdigit():
            out.add(int(part))
    return out


def telegram_admin_user_ids_set() -> set[int]:
    return _parse_admin_user_ids(get_settings().telegram_admin_user_ids)


def _one_line(s: str, max_len: int = 800) -> str:
    t = (s or "").replace("\r", " ").replace("\n", " ").strip()
    if len(t) > max_len:
        return t[: max_len - 1] + "…"
    return t


def order_inline_keyboard(order_id: uuid.UUID, show_actions: bool) -> dict | None:
    if not show_actions:
        return None
    h = order_id.hex
    return {
        "inline_keyboard": [
            [
                {"text": "✅ Выполнено", "callback_data": f"d{h}"},
                {"text": "❌ Отменить", "callback_data": f"c{h}"},
            ]
        ]
    }


def parse_order_callback_data(data: str) -> tuple[str, uuid.UUID] | None:
    if not data or len(data) != 33:
        return None
    action = data[0]
    if action not in ("d", "c"):
        return None
    try:
        return action, uuid.UUID(hex=data[1:33])
    except ValueError:
        return None


async def telegram_call(method: str, payload: dict) -> dict | None:
    token = (get_settings().telegram_bot_token or "").strip()
    if not token:
        logger.debug("telegram: пропуск %s — нет токена", method)
        return None
    import httpx

    url = f"https://api.telegram.org/bot{token}/{method}"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            return r.json()
    except Exception:
        logger.exception("telegram: метод %s не удался", method)
        return None


async def telegram_send_message(
    text: str,
    reply_markup: dict | None = None,
) -> dict | None:
    chat = (get_settings().telegram_admin_chat_id or "").strip()
    if not chat:
        logger.warning("telegram: нет telegram_admin_chat_id")
        return None
    payload: dict = {"chat_id": chat, "text": text}
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    return await telegram_call("sendMessage", payload)


async def telegram_answer_callback(callback_query_id: str, text: str | None = None) -> None:
    body: dict = {"callback_query_id": callback_query_id}
    if text:
        body["text"] = text
    await telegram_call("answerCallbackQuery", body)


async def telegram_edit_reply_markup(
    chat_id: int | str, message_id: int, reply_markup: dict | None = None
) -> None:
    payload: dict = {"chat_id": chat_id, "message_id": message_id}
    if reply_markup is None:
        payload["reply_markup"] = {"inline_keyboard": []}
    else:
        payload["reply_markup"] = reply_markup
    await telegram_call("editMessageReplyMarkup", payload)


def format_new_order_message(
    *,
    order_id: uuid.UUID,
    product_title: str,
    fulfillment_label: str,
    user_email: str,
    user_name: str,
    price: Decimal,
    variant_label: str | None,
    pre_fields: list[tuple[str, str]],
    steam_deposit_amount: Decimal | None = None,
    steam_deposit_currency: str | None = None,
) -> str:
    lines = [
        "🛒 Новый заказ",
        f"ID заказа: {order_id}",
        f"Товар: {_one_line(product_title, 400)}",
        f"Выдача: {fulfillment_label}",
        f"Клиент: {_one_line(user_email, 200)} ({_one_line(user_name, 120)})",
    ]
    if steam_deposit_amount is not None and steam_deposit_currency:
        sym = STEAM_CURRENCY_LABELS.get(steam_deposit_currency.lower(), steam_deposit_currency)
        lines.append(f"Сумма пополнения (без комиссии): {steam_deposit_amount} {sym}")
        lines.append(f"Оплачено (с комиссией): {price} ₽")
    else:
        lines.append(f"Сумма: {price} ₽")
    if variant_label and variant_label.strip():
        lines.append(f"Тариф: {_one_line(variant_label, 200)}")
    if pre_fields:
        lines.append("")
        lines.append("Данные при оформлении:")
        for label, val in pre_fields:
            lines.append(f"• {_one_line(label, 120)}: {_one_line(val, 500)}")
    return "\n".join(lines)


async def telegram_edit_message_text(
    chat_id: int | str, message_id: int, text: str
) -> None:
    await telegram_call(
        "editMessageText",
        {"chat_id": chat_id, "message_id": message_id, "text": text},
    )


async def notify_new_order_telegram(
    *,
    order_id: uuid.UUID,
    product_title: str,
    fulfillment_manual: bool,
    user_email: str,
    user_display_name: str,
    price: Decimal,
    variant_label: str | None,
    pre_fields: list[tuple[str, str]],
    show_action_buttons: bool,
    steam_deposit_amount: Decimal | None = None,
    steam_deposit_currency: str | None = None,
) -> None:
    ful = "Ручная" if fulfillment_manual else "Авто"
    text = format_new_order_message(
        order_id=order_id,
        product_title=product_title,
        fulfillment_label=ful,
        user_email=user_email,
        user_name=user_display_name,
        price=price,
        variant_label=variant_label,
        pre_fields=pre_fields,
        steam_deposit_amount=steam_deposit_amount,
        steam_deposit_currency=steam_deposit_currency,
    )
    kb = order_inline_keyboard(order_id, show_actions=show_action_buttons)
    await telegram_send_message(text, reply_markup=kb)


def format_post_payment_message(
    *,
    order_id: uuid.UUID,
    product_title: str,
    user_email: str,
    fields: list[tuple[str, str]],
) -> str:
    lines = [
        "📝 Данные после оплаты",
        f"ID заказа: {order_id}",
        f"Товар: {_one_line(product_title, 400)}",
        f"Клиент: {_one_line(user_email, 200)}",
        "",
        "Поля:",
    ]
    for label, val in fields:
        lines.append(f"• {_one_line(label, 120)}: {_one_line(val, 500)}")
    return "\n".join(lines)


async def notify_post_payment_submitted(
    *,
    order_id: uuid.UUID,
    product_title: str,
    user_email: str,
    fields: list[tuple[str, str]],
) -> None:
    text = format_post_payment_message(
        order_id=order_id,
        product_title=product_title,
        user_email=user_email,
        fields=fields,
    )
    await telegram_send_message(text, reply_markup=None)
