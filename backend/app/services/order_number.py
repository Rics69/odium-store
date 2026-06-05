"""Генерация человекочитаемого номера заказа."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def next_order_number(db: AsyncSession) -> str:
    result = await db.execute(text("SELECT nextval('order_number_seq')"))
    return str(result.scalar_one())
