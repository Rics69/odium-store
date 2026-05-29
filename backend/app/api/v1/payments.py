from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import FulfillmentType, Order, OrderStatus

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    order_id = body.get("order_id") if isinstance(body, dict) else None
    if not order_id:
        raise HTTPException(400, "order_id required")
    try:
        oid = UUID(str(order_id))
    except ValueError:
        raise HTTPException(400, "invalid order_id")
    stmt = select(Order).where(Order.id == oid).options(selectinload(Order.product))
    row = await db.execute(stmt)
    order = row.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.product.fulfillment == FulfillmentType.manual:
        order.status = OrderStatus.processing
    else:
        order.status = OrderStatus.fulfilled
    await db.commit()
    return {"ok": True, "order_id": str(order.id), "status": order.status.value}
