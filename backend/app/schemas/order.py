from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.product import ProductPostPaymentField


class OrderFieldValue(BaseModel):
    field_key: str = Field(max_length=80)
    value: str = Field(max_length=10000)


class OrderCreateRequest(BaseModel):
    product_slug: str
    fields: list[OrderFieldValue] = []
    variant_label: str | None = Field(default=None, max_length=200)
    steam_deposit_amount: Decimal | None = Field(default=None, gt=0)
    steam_deposit_currency: str | None = Field(default=None, pattern="^(rub|kzt|usd)$")


class OrderRead(BaseModel):
    id: str
    product_id: str
    product_title: str
    product_slug: str
    status: str
    status_display: str = ""
    price_at_purchase: Decimal
    variant_label: str | None = None

    model_config = {"from_attributes": False}


class PostPaymentSubmitRequest(BaseModel):
    values: dict[str, str] = Field(default_factory=dict)


class PostPaymentSubmitResponse(BaseModel):
    ok: bool = True


class OrderSuccessRead(BaseModel):
    """Данные для страницы успеха."""

    id: str
    product_title: str
    status: str = ""
    status_display: str = ""
    post_payment_fields: list[ProductPostPaymentField] = Field(default_factory=list)
    post_payment_already_submitted: bool = False


class OrderRepeatFieldValue(BaseModel):
    field_key: str
    value: str


class OrderRepeatData(BaseModel):
    """Данные для повтора заказа (открытие модалки подтверждения на фронте)."""

    product_slug: str
    product_title: str
    product_type: str
    product_is_available: bool
    variant_label: str | None = None
    steam_deposit_amount: Decimal | None = None
    steam_deposit_currency: str | None = None
    fields: list[OrderRepeatFieldValue] = Field(default_factory=list)
    estimated_price: Decimal
