"""Человекочитаемые подписи к OrderStatus на витрине и в ЛК."""

from app.models import FulfillmentType, OrderStatus


def order_status_display(status: OrderStatus, fulfillment_manual: bool) -> str:
    match status:
        case OrderStatus.cancelled:
            return "Отменено"
        case OrderStatus.fulfilled:
            return "Готово"
        case OrderStatus.processing:
            return "Выполняется"
        case OrderStatus.pending_payment:
            return "Ожидает оплаты"
        case OrderStatus.paid:
            return "Выполняется" if fulfillment_manual else "Готово"
        case _:  # pragma: no cover
            return str(status.value)
