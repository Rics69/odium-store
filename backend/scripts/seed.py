"""
Usage (from backend/):
  PYTHONPATH=. python scripts/seed.py
"""
import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select

from app.db.session import async_session_maker
from app.models import (
    FulfillmentType,
    HomepageSection,
    InputFieldType,
    Product,
    ProductImage,
    ProductInputField,
    SectionProduct,
    User,
    UserRole,
)
from app.security.password import hash_password
from app.utils.slug import slugify


async def main() -> None:
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@odium.local")
    admin_password = os.environ.get("ADMIN_PASSWORD", "adminadmin")
    async with async_session_maker() as session:
        r = await session.execute(select(User).where(User.email == admin_email))
        if r.scalar_one_or_none():
            print("Admin exists, skipping user seed")
        else:
            u = User(
                email=admin_email,
                password_hash=hash_password(admin_password),
                display_name="Admin",
                role=UserRole.admin,
            )
            session.add(u)
            await session.commit()
            print(f"Created admin {admin_email} / {admin_password}")

    async with async_session_maker() as session:
        p = (await session.execute(select(Product).limit(1))).scalar_one_or_none()
        if p:
            print("Products exist, skipping demo catalog")
            return
        demo_id = uuid.uuid4()
        prod = Product(
            id=demo_id,
            slug="demo-spotify-1m",
            title="Spotify Premium — 1 месяц",
            description="Демонстрационная позиция каталога. Оплата пока отключена.",
            price=299,
            old_price=399,
            fulfillment=FulfillmentType.manual,
            is_published=True,
            is_active=True,
            purchase_count=42,
            instruction_title="После оплаты",
            instruction_body=(
                "Укажите данные аккаунта в форме заказа. Поддержка свяжется в Telegram после проверки.\n\n"
                "На странице успеха есть поля, заданные для этого товара (например пароль аккаунта) — они "
                "видны только вам в браузере."
            ),
            post_payment_fields=[
                {
                    "field_key": "account_password",
                    "label": "Пароль от аккаунта сервиса",
                    "field_type": "password",
                    "required": False,
                    "placeholder": "Если требуется по инструкции",
                    "sort_order": 0,
                },
            ],
            faq_sections=[
                {
                    "title": "Это официальная подписка?",
                    "content": "Учебная карточка каталога. Уточняйте детали у поддержки.",
                }
            ],
            pricing_variants=[
                {"label": "1 месяц", "price": 299, "old_price": 399},
                {"label": "6 месяцев", "price": 1499, "old_price": None},
                {"label": "12 месяцев", "price": 2499, "old_price": 2799},
            ],
        )
        session.add(prod)
        await session.flush()
        session.add(
            ProductImage(
                product_id=demo_id,
                url="/logo-odium.svg",
                sort_order=0,
            )
        )
        session.add(
            ProductInputField(
                product_id=demo_id,
                field_key="login_email",
                label="Почта аккаунта",
                field_type=InputFieldType.email,
                required=True,
                placeholder="user@mail.com",
                sort_order=0,
            )
        )
        sec = HomepageSection(
            title="Лучшие товары",
            slug="best",
            sort_order=0,
        )
        session.add(sec)
        await session.flush()
        session.add(
            SectionProduct(section_id=sec.id, product_id=demo_id, sort_order=0)
        )
        sec_new = HomepageSection(
            title="Новинки",
            slug="new",
            sort_order=1,
        )
        session.add(sec_new)
        await session.flush()
        session.add(
            SectionProduct(section_id=sec_new.id, product_id=demo_id, sort_order=0)
        )
        await session.commit()
        print("Seeded demo product and homepage section")


if __name__ == "__main__":
    asyncio.run(main())
