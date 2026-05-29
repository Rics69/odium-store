import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class FulfillmentType(str, enum.Enum):
    manual = "manual"
    automated = "automated"


class ProductType(str, enum.Enum):
    standard = "standard"
    steam_topup = "steam_topup"


class OrderStatus(str, enum.Enum):
    pending_payment = "pending_payment"
    paid = "paid"
    processing = "processing"
    fulfilled = "fulfilled"
    cancelled = "cancelled"


class InputFieldType(str, enum.Enum):
    text = "text"
    email = "email"
    password = "password"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    role: Mapped[UserRole] = mapped_column(default=UserRole.user)

    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    old_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    fulfillment: Mapped[FulfillmentType] = mapped_column(default=FulfillmentType.automated)
    product_type: Mapped[ProductType] = mapped_column(default=ProductType.standard)
    steam_commission_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=20)
    steam_usd_to_rub: Mapped[float] = mapped_column(Numeric(12, 4), default=92)
    steam_kzt_to_rub: Mapped[float] = mapped_column(Numeric(12, 6), default=0.2)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    purchase_count: Mapped[int] = mapped_column(Integer, default=0)

    instruction_title: Mapped[str] = mapped_column(String(400), default="")
    instruction_body: Mapped[str] = mapped_column(Text, default="")
    faq_sections: Mapped[list] = mapped_column(JSONB, nullable=False)
    pricing_variants: Mapped[list] = mapped_column(JSONB, nullable=False)
    post_payment_fields: Mapped[list] = mapped_column(JSONB, nullable=False)

    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    input_fields: Mapped[list["ProductInputField"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductInputField.sort_order",
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product")
    sections: Mapped[list["SectionProduct"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    url: Mapped[str] = mapped_column(String(2048))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship(back_populates="images")


class ProductInputField(Base):
    __tablename__ = "product_input_fields"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    field_key: Mapped[str] = mapped_column(String(80))
    label: Mapped[str] = mapped_column(String(200))
    field_type: Mapped[InputFieldType] = mapped_column(default=InputFieldType.text)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    placeholder: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship(back_populates="input_fields")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[OrderStatus] = mapped_column(default=OrderStatus.paid)
    price_at_purchase: Mapped[float] = mapped_column(Numeric(12, 2))
    variant_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    steam_deposit_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    steam_deposit_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    post_payment_snapshot: Mapped[list] = mapped_column(JSONB, nullable=False)
    post_payment_submitted: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user: Mapped["User"] = relationship(back_populates="orders")
    product: Mapped["Product"] = relationship(back_populates="orders")
    field_values: Mapped[list["OrderInputValue"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderInputValue(Base):
    __tablename__ = "order_input_values"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    field_key: Mapped[str] = mapped_column(String(80))
    value: Mapped[str] = mapped_column(Text)

    order: Mapped["Order"] = relationship(back_populates="field_values")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )
    rating: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="reviews")
    product: Mapped["Product"] = relationship(back_populates="reviews")


class HomepageSection(Base):
    __tablename__ = "homepage_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    products: Mapped[list["SectionProduct"]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )


class SectionProduct(Base):
    __tablename__ = "section_products"

    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("homepage_sections.id", ondelete="CASCADE"), primary_key=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    section: Mapped["HomepageSection"] = relationship(back_populates="products")
    product: Mapped["Product"] = relationship(back_populates="sections")
