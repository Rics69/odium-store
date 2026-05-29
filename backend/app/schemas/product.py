from decimal import Decimal

from pydantic import BaseModel, Field


class ProductImageRead(BaseModel):
    id: str
    url: str
    sort_order: int

    model_config = {"from_attributes": True}


class ProductInputFieldRead(BaseModel):
    id: str
    field_key: str
    label: str
    field_type: str
    required: bool
    placeholder: str | None
    sort_order: int

    model_config = {"from_attributes": True}


class AccordionSection(BaseModel):
    """Пункт FAQ (аккордеон на странице товара)."""

    title: str = Field(default="", max_length=320)
    content: str = Field(default="", max_length=16000)


class PricingVariant(BaseModel):
    label: str = Field(default="", max_length=200)
    price: Decimal
    old_price: Decimal | None = None


class ProductPostPaymentField(BaseModel):
    """Поля на странице после оплаты (шаблон с товара; значения пользователь вводит только на клиенте)."""

    field_key: str
    label: str
    field_type: str
    required: bool = True
    placeholder: str | None = None
    sort_order: int = 0


class ProductCard(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    price: Decimal
    old_price: Decimal | None
    fulfillment: str
    purchase_count: int
    review_count: int = 0
    average_rating: float | None = None
    images: list[ProductImageRead]


class ProductDetail(ProductCard):
    product_type: str = "standard"
    steam_commission_percent: Decimal = Decimal("20")
    steam_usd_to_rub: Decimal = Decimal("92")
    steam_kzt_to_rub: Decimal = Decimal("0.2")
    input_fields: list[ProductInputFieldRead]
    is_published: bool
    is_active: bool = True
    homepage_section_slugs: list[str] = Field(default_factory=list)
    instruction_title: str = ""
    instruction_body: str = ""
    faq_sections: list[AccordionSection] = Field(default_factory=list)
    pricing_variants: list[PricingVariant] = Field(default_factory=list)
    post_payment_fields: list[ProductPostPaymentField] = Field(default_factory=list)


class ProductInputFieldCreate(BaseModel):
    field_key: str = Field(max_length=80)
    label: str = Field(max_length=200)
    field_type: str = Field(pattern="^(text|email|password)$")
    required: bool = True
    placeholder: str | None = None
    sort_order: int = 0


class ProductCreate(BaseModel):
    title: str = Field(max_length=300)
    slug: str | None = None
    description: str = ""
    price: Decimal
    old_price: Decimal | None = None
    product_type: str = Field(default="standard", pattern="^(standard|steam_topup)$")
    steam_commission_percent: Decimal = Field(default=Decimal("20"), ge=0, le=100)
    steam_usd_to_rub: Decimal = Field(default=Decimal("92"), gt=0)
    steam_kzt_to_rub: Decimal = Field(default=Decimal("0.2"), gt=0)
    fulfillment: str = Field(pattern="^(manual|automated)$")
    is_published: bool = False
    is_active: bool = True
    image_urls: list[str] = []
    input_fields: list[ProductInputFieldCreate] = []
    homepage_section_slugs: list[str] = Field(default_factory=list)
    instruction_title: str = Field(default="", max_length=400)
    instruction_body: str = Field(default="", max_length=32000)
    faq_sections: list[AccordionSection] = Field(default_factory=list)
    pricing_variants: list[PricingVariant] = Field(default_factory=list)
    post_payment_fields: list[ProductInputFieldCreate] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    slug: str | None = Field(default=None, max_length=200)
    description: str | None = None
    price: Decimal | None = None
    old_price: Decimal | None = None
    product_type: str | None = Field(default=None, pattern="^(standard|steam_topup)$")
    steam_commission_percent: Decimal | None = Field(default=None, ge=0, le=100)
    steam_usd_to_rub: Decimal | None = Field(default=None, gt=0)
    steam_kzt_to_rub: Decimal | None = Field(default=None, gt=0)
    fulfillment: str | None = Field(default=None, pattern="^(manual|automated)$")
    is_published: bool | None = None
    is_active: bool | None = None
    image_urls: list[str] | None = None
    input_fields: list[ProductInputFieldCreate] | None = None
    homepage_section_slugs: list[str] | None = None
    instruction_title: str | None = Field(default=None, max_length=400)
    instruction_body: str | None = Field(default=None, max_length=32000)
    faq_sections: list[AccordionSection] | None = None
    pricing_variants: list[PricingVariant] | None = None
    post_payment_fields: list[ProductInputFieldCreate] | None = None


class HomepageSectionRead(BaseModel):
    id: str
    title: str
    slug: str
    sort_order: int
    products: list[ProductCard]


class SectionCreate(BaseModel):
    title: str = Field(max_length=200)
    slug: str = Field(max_length=80)
    sort_order: int | None = Field(
        default=None,
        description="Если не указано — блок добавится в конец главной (после существующих).",
    )


class SectionProductsUpdate(BaseModel):
    product_ids: list[str]
