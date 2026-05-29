import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.db.session import get_db
from app.models import Order, OrderStatus
from app.schemas.order_status import order_status_display
from app.services.telegram import (
    parse_order_callback_data,
    telegram_admin_user_ids_set,
    telegram_answer_callback,
    telegram_edit_message_text,
    telegram_edit_reply_markup,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])


def _coerce_order_status(order: Order) -> OrderStatus:
    s = order.status
    if isinstance(s, OrderStatus):
        return s
    try:
        return OrderStatus(str(s))
    except ValueError:
        logger.warning("order %s: неизвестный status %r", order.id, s)
        return OrderStatus.paid


def _update_kind(body: dict) -> str:
    if body.get("callback_query"):
        return "callback_query"
    if body.get("message"):
        return "message"
    if body.get("edited_message"):
        return "edited_message"
    return "other"


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    secret = (settings.telegram_webhook_secret or "").strip()
    client = request.client.host if request.client else "?"

    if secret:
        hdr = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if hdr != secret:
            logger.warning(
                "telegram webhook: 403 — неверный secret (client=%s, hdr=%r)",
                client,
                hdr,
            )
            raise HTTPException(status_code=403, detail="Invalid webhook secret")

    try:
        body = await request.json()
    except Exception:
        logger.warning("telegram webhook: 400 — не JSON (client=%s)", client)
        raise HTTPException(status_code=400, detail="Bad JSON")

    kind = _update_kind(body)
    update_id = body.get("update_id")
    logger.info(
        "telegram webhook: получен update_id=%s kind=%s client=%s",
        update_id,
        kind,
        client,
    )

    cq = body.get("callback_query")
    if cq and isinstance(cq, dict):
        try:
            await _handle_callback_query(cq, db)
        except Exception:
            logger.error("telegram callback error:\n%s", traceback.format_exc())
            try:
                cq_id = str(cq.get("id") or "")
                if cq_id:
                    await telegram_answer_callback(cq_id, "Ошибка сервера, см. лог backend")
            except Exception:
                logger.exception("telegram: не удалось answerCallback после ошибки")
    elif kind != "other":
        logger.info("telegram webhook: update без callback_query (kind=%s)", kind)

    return {"ok": True}


async def _handle_callback_query(cq: dict, db: AsyncSession) -> None:
    cq_id = str(cq.get("id") or "")
    raw_data = cq.get("data")
    if isinstance(raw_data, (bytes, bytearray)):
        data = raw_data.decode()
    else:
        data = str(raw_data or "")

    frm = cq.get("from") or {}
    tg_raw = frm.get("id")
    username = frm.get("username")
    try:
        tg_uid = int(tg_raw) if tg_raw is not None else None
    except (TypeError, ValueError):
        tg_uid = None

    logger.info(
        "telegram callback: START data=%r tg_id=%s @%s cq_id=%s",
        data,
        tg_raw,
        username,
        cq_id,
    )

    admins = telegram_admin_user_ids_set()
    logger.info("telegram callback: admins=%s", sorted(admins) if admins else "[]")

    if not admins:
        logger.warning("telegram callback: TELEGRAM_ADMIN_USER_IDS пустой")
        await telegram_answer_callback(cq_id, "Сервер не настроен (нет TELEGRAM_ADMIN_USER_IDS)")
        return
    if tg_uid is None or tg_uid not in admins:
        logger.warning(
            "telegram callback: отклонён tg_id=%r (нужен один из %s)",
            tg_raw,
            admins,
        )
        await telegram_answer_callback(cq_id, "Нет прав")
        return

    parsed = parse_order_callback_data(data)
    if not parsed:
        logger.warning("telegram callback: плохой callback_data=%r len=%s", data, len(data))
        await telegram_answer_callback(cq_id, "Неверные данные")
        return

    action, oid = parsed
    action_label = "Выполнено" if action == "d" else "Отменить"
    logger.info("telegram callback: action=%s order_id=%s", action_label, oid)

    msg = cq.get("message") or {}
    chat = msg.get("chat") or {}
    chat_id = chat.get("id")
    mid = msg.get("message_id")

    stmt = (
        select(Order)
        .where(Order.id == oid)
        .options(selectinload(Order.product), selectinload(Order.user))
    )
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        logger.warning("telegram callback: заказ %s не найден в БД", oid)
        await telegram_answer_callback(cq_id, "Заказ не найден")
        return

    async def clear_kb() -> None:
        if chat_id is not None and mid is not None:
            await telegram_edit_reply_markup(chat_id, mid, None)

    st = _coerce_order_status(order)
    logger.info(
        "telegram callback: заказ %s текущий status=%s product=%s",
        oid,
        st.value,
        order.product.title if order.product else "?",
    )

    if st in (OrderStatus.fulfilled, OrderStatus.cancelled):
        logger.info("telegram callback: заказ %s уже закрыт (%s)", oid, st.value)
        await telegram_answer_callback(cq_id, "Заказ уже закрыт")
        await clear_kb()
        return

    prod = order.product
    manual = prod.fulfillment.value == "manual"

    if action == "d":
        order.status = OrderStatus.fulfilled
        db.add(order)
        await db.commit()
        await db.refresh(order)
        logger.info(
            "telegram callback: OK заказ %s → fulfilled (проверка в БД: %s)",
            oid,
            order.status.value,
        )
        await telegram_answer_callback(cq_id, "Отмечено: готово")
        await clear_kb()
        if chat_id is not None and mid is not None:
            original = str(msg.get("text") or "")
            label = order_status_display(OrderStatus.fulfilled, manual)
            await telegram_edit_message_text(
                chat_id,
                mid,
                original + f"\n\n✅ {label}",
            )
        return

    if action == "c":
        order.status = OrderStatus.cancelled
        db.add(order)
        await db.commit()
        await db.refresh(order)
        logger.info(
            "telegram callback: OK заказ %s → cancelled (проверка в БД: %s)",
            oid,
            order.status.value,
        )
        await telegram_answer_callback(cq_id, "Заказ отменён")
        await clear_kb()
        if chat_id is not None and mid is not None:
            original = str(msg.get("text") or "")
            label = order_status_display(OrderStatus.cancelled, manual)
            await telegram_edit_message_text(
                chat_id,
                mid,
                original + f"\n\n❌ {label}",
            )
        return

    logger.warning("telegram callback: неизвестное действие %r", action)
    await telegram_answer_callback(cq_id, "Неизвестное действие")
