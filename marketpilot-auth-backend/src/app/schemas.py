from datetime import date
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator, model_validator


class Role(StrEnum):
    BUSINESS_OWNER = "business_owner"
    TEAM_MEMBER = "team_member"
    ADMINISTRATOR = "administrator"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordResetEmailRequest(BaseModel):
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    new_password: str = Field(min_length=10, max_length=128)


class LogoutRequest(BaseModel):
    access_token: str = Field(min_length=1)
    refresh_token: str = Field(min_length=1)


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=2048)


class RoleUpdateRequest(BaseModel):
    role: Role


class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    role: Role


class AuthSession(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int | None = None
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserProfile
    session: AuthSession | None = None
    message: str


class MessageResponse(BaseModel):
    message: str


class MarketingObjective(StrEnum):
    INCREASE_SALES = "increase_sales"
    INCREASE_ENGAGEMENT = "increase_engagement"
    INCREASE_PRODUCT_AWARENESS = "increase_product_awareness"
    GENERATE_WHATSAPP_ENQUIRIES = "generate_whatsapp_enquiries"
    INTRODUCE_NEW_PRODUCT = "introduce_new_product"
    PROMOTE_AN_OFFER = "promote_an_offer"
    CLEAR_EXISTING_STOCK = "clear_existing_stock"


class WorkspaceCreateRequest(BaseModel):
    business_name: str = Field(min_length=1, max_length=160)
    industry: str = Field(min_length=1, max_length=100)
    website: HttpUrl | None = None
    country: str = Field(min_length=2, max_length=2, description="ISO 3166-1 alpha-2 country code, e.g. PK")
    currency: str = Field(min_length=3, max_length=3, description="ISO 4217 currency code, e.g. PKR")
    target_market: str = Field(min_length=1, max_length=160)
    business_description: str = Field(min_length=1, max_length=3000)
    marketing_objectives: list[MarketingObjective] = Field(min_length=1, max_length=7)

    @field_validator("business_name", "industry", "target_market", "business_description")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        if not value.isalpha():
            raise ValueError("Country must be a two-letter ISO country code.")
        return value.upper()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        if not value.isalpha():
            raise ValueError("Currency must be a three-letter ISO currency code.")
        return value.upper()


class WorkspaceUpdateRequest(BaseModel):
    business_name: str | None = Field(default=None, min_length=1, max_length=160)
    industry: str | None = Field(default=None, min_length=1, max_length=100)
    website: HttpUrl | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    target_market: str | None = Field(default=None, min_length=1, max_length=160)
    business_description: str | None = Field(default=None, min_length=1, max_length=3000)
    marketing_objectives: list[MarketingObjective] | None = Field(default=None, min_length=1, max_length=7)

    @field_validator("business_name", "industry", "target_market", "business_description")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("country")
    @classmethod
    def normalize_optional_country(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.isalpha():
            raise ValueError("Country must be a two-letter ISO country code.")
        return value.upper()

    @field_validator("currency")
    @classmethod
    def normalize_optional_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.isalpha():
            raise ValueError("Currency must be a three-letter ISO currency code.")
        return value.upper()


class Workspace(BaseModel):
    id: UUID
    owner_id: UUID
    business_name: str
    industry: str
    website: str | None = None
    country: str
    currency: str
    target_market: str
    business_description: str
    marketing_objectives: list[MarketingObjective]


# Module 3 — Brand Kit. This is the durable brand context used by future AI modules.
class BrandKitCreateRequest(BaseModel):
    brand_voice: str = Field(min_length=2, max_length=100)
    preferred_language: str = Field(min_length=2, max_length=50)
    target_audience: str = Field(min_length=2, max_length=1000)
    content_style: str = Field(min_length=2, max_length=100)
    brand_tone: list[str] = Field(min_length=1, max_length=8)
    primary_colors: list[str] = Field(min_length=1, max_length=5)
    secondary_colors: list[str] = Field(default_factory=list, max_length=5)
    fonts: list[str] = Field(default_factory=list, max_length=4)
    preferred_ctas: list[str] = Field(default_factory=list, max_length=12)
    prohibited_words: list[str] = Field(default_factory=list, max_length=30)
    approved_caption_examples: list[str] = Field(default_factory=list, max_length=10)
    logo_url: HttpUrl | None = None

    @field_validator("brand_voice", "preferred_language", "target_audience", "content_style")
    @classmethod
    def required_brand_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("primary_colors", "secondary_colors")
    @classmethod
    def validate_hex_colors(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        for color in values:
            color = color.strip().upper()
            if len(color) != 7 or not color.startswith("#") or any(char not in "0123456789ABCDEF" for char in color[1:]):
                raise ValueError("Colors must use six-digit hex format, for example #1A73E8.")
            normalized.append(color)
        if len(set(normalized)) != len(normalized):
            raise ValueError("Colors cannot be repeated.")
        return normalized

    @field_validator("brand_tone", "fonts", "preferred_ctas", "prohibited_words", "approved_caption_examples")
    @classmethod
    def normalize_brand_lists(cls, values: list[str]) -> list[str]:
        normalized = [value.strip() for value in values]
        if any(not value for value in normalized):
            raise ValueError("List values cannot be blank.")
        return normalized


class BrandKitUpdateRequest(BaseModel):
    brand_voice: str | None = Field(default=None, min_length=2, max_length=100)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=50)
    target_audience: str | None = Field(default=None, min_length=2, max_length=1000)
    content_style: str | None = Field(default=None, min_length=2, max_length=100)
    brand_tone: list[str] | None = Field(default=None, min_length=1, max_length=8)
    primary_colors: list[str] | None = Field(default=None, min_length=1, max_length=5)
    secondary_colors: list[str] | None = Field(default=None, max_length=5)
    fonts: list[str] | None = Field(default=None, max_length=4)
    preferred_ctas: list[str] | None = Field(default=None, max_length=12)
    prohibited_words: list[str] | None = Field(default=None, max_length=30)
    approved_caption_examples: list[str] | None = Field(default=None, max_length=10)
    logo_url: HttpUrl | None = None

    _required_brand_text = field_validator("brand_voice", "preferred_language", "target_audience", "content_style")(BrandKitCreateRequest.required_brand_text.__func__)
    _validate_hex_colors = field_validator("primary_colors", "secondary_colors")(BrandKitCreateRequest.validate_hex_colors.__func__)
    _normalize_brand_lists = field_validator("brand_tone", "fonts", "preferred_ctas", "prohibited_words", "approved_caption_examples")(BrandKitCreateRequest.normalize_brand_lists.__func__)


class BrandKit(BaseModel):
    id: UUID
    workspace_id: UUID
    brand_voice: str
    preferred_language: str
    target_audience: str
    content_style: str
    brand_tone: list[str]
    primary_colors: list[str]
    secondary_colors: list[str]
    fonts: list[str]
    preferred_ctas: list[str]
    prohibited_words: list[str]
    approved_caption_examples: list[str]
    logo_url: str | None = None
    created_at: str
    updated_at: str


# Module 4 — Product Catalogue.
class ProductStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ProductPriority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    FEATURED = "featured"


class ProductImage(BaseModel):
    url: HttpUrl
    alt_text: str | None = Field(default=None, max_length=200)
    position: int = Field(default=0, ge=0, le=50)


class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=2, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    sku: str | None = Field(default=None, max_length=100)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    cost_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0, le=10_000_000)
    track_inventory: bool = True
    status: ProductStatus = ProductStatus.DRAFT
    priority: ProductPriority = ProductPriority.NORMAL
    images: list[ProductImage] = Field(default_factory=list, max_length=10)
    features: list[str] = Field(default_factory=list, max_length=10)
    pain_points: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("name", "description", "category", "sku")
    @classmethod
    def normalize_product_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("images")
    @classmethod
    def validate_image_positions(cls, images: list[ProductImage]) -> list[ProductImage]:
        positions = [image.position for image in images]
        if len(set(positions)) != len(positions):
            raise ValueError("Each product image must have a unique position.")
        return sorted(images, key=lambda image: image.position)

    @field_validator("features", "pain_points")
    @classmethod
    def normalize_string_lists(cls, values: list[str]) -> list[str]:
        normalized = [v.strip() for v in values]
        if any(not v for v in normalized):
            raise ValueError("List values cannot be blank.")
        return normalized


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, min_length=2, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    sku: str | None = Field(default=None, max_length=100)
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    cost_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    stock_quantity: int | None = Field(default=None, ge=0, le=10_000_000)
    track_inventory: bool | None = None
    status: ProductStatus | None = None
    priority: ProductPriority | None = None
    images: list[ProductImage] | None = Field(default=None, max_length=10)
    features: list[str] | None = Field(default=None, max_length=10)
    pain_points: list[str] | None = Field(default=None, max_length=10)

    _normalize_product_text = field_validator("name", "description", "category", "sku")(ProductCreateRequest.normalize_product_text.__func__)
    _validate_image_positions = field_validator("images")(ProductCreateRequest.validate_image_positions.__func__)
    _normalize_string_lists = field_validator("features", "pain_points")(ProductCreateRequest.normalize_string_lists.__func__)


class Product(ProductCreateRequest):
    id: UUID
    workspace_id: UUID
    profit_margin: Decimal | None = None
    created_at: str
    updated_at: str

    @model_validator(mode="before")
    @classmethod
    def compute_profit_margin(cls, data: dict) -> dict:
        """Compute profit margin as ((price - cost_price) / price * 100) when both values are available."""
        if isinstance(data, dict):
            price = data.get("price")
            cost = data.get("cost_price")
            if price is not None and cost is not None:
                try:
                    price_d = Decimal(str(price))
                    cost_d = Decimal(str(cost))
                    if price_d > 0:
                        data["profit_margin"] = round((price_d - cost_d) / price_d * 100, 2)
                except (ValueError, ArithmeticError):
                    pass
        return data


class CsvDuplicateStrategy(StrEnum):
    SKIP = "skip"
    REJECT = "reject"


class ProductImportRowError(BaseModel):
    row: int
    message: str


class ProductCsvImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: list[ProductImportRowError] = Field(default_factory=list)
    message: str


# Module 4 — Offers and Promotions.
class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    BUY_X_GET_Y = "buy_x_get_y"
    FREE_SHIPPING = "free_shipping"


class OfferStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class OfferCreateRequest(BaseModel):
    product_id: UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    discount_type: DiscountType
    discount_value: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    minimum_order_value: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    start_date: date
    end_date: date
    status: OfferStatus = OfferStatus.DRAFT

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be blank.")
        return value

    @field_validator("description")
    @classmethod
    def description_not_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Description cannot be blank.")
        return value

    @model_validator(mode="after")
    def end_after_start(self) -> "OfferCreateRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date.")
        return self


class OfferUpdateRequest(BaseModel):
    product_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    discount_type: DiscountType | None = None
    discount_value: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    minimum_order_value: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    start_date: date | None = None
    end_date: date | None = None
    status: OfferStatus | None = None

    _title_not_blank = field_validator("title")(OfferCreateRequest.title_not_blank.__func__)
    _description_not_blank = field_validator("description")(OfferCreateRequest.description_not_blank.__func__)


class Offer(BaseModel):
    id: UUID
    workspace_id: UUID
    product_id: UUID | None = None
    title: str
    description: str | None = None
    discount_type: DiscountType
    discount_value: Decimal
    minimum_order_value: Decimal | None = None
    start_date: date
    end_date: date
    status: OfferStatus
    created_at: str
    updated_at: str


# Module 4 — Marketing Budget.
class MarketingBudgetCreateRequest(BaseModel):
    total_monthly_budget: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    organic_percentage: Decimal = Field(default=Decimal("70.00"), ge=0, le=100, max_digits=5, decimal_places=2)
    paid_percentage: Decimal = Field(default=Decimal("30.00"), ge=0, le=100, max_digits=5, decimal_places=2)
    currency: str = Field(min_length=3, max_length=3, description="ISO 4217 currency code, e.g. PKR")
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        if not value.isalpha():
            raise ValueError("Currency must be a three-letter ISO currency code.")
        return value.upper()

    @model_validator(mode="after")
    def percentages_must_equal_100(self) -> "MarketingBudgetCreateRequest":
        total = self.organic_percentage + self.paid_percentage
        if total != Decimal("100.00"):
            raise ValueError(f"organic_percentage and paid_percentage must sum to 100. Current sum: {total}")
        return self


class MarketingBudgetUpdateRequest(BaseModel):
    total_monthly_budget: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    organic_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    paid_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=2000)

    _normalize_currency = field_validator("currency")(MarketingBudgetCreateRequest.normalize_currency.__func__)


class MarketingBudget(BaseModel):
    id: UUID
    workspace_id: UUID
    total_monthly_budget: Decimal
    organic_percentage: Decimal
    paid_percentage: Decimal
    currency: str
    notes: str | None = None
    created_at: str
    updated_at: str


# Planner-ready product view — used by Modules 6–7 for AI context.
class MarginTier(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PlannerProduct(BaseModel):
    id: UUID
    name: str
    description: str
    category: str | None = None
    price: Decimal
    cost_price: Decimal | None = None
    profit_margin: Decimal | None = None
    margin_tier: MarginTier | None = None
    stock_quantity: int
    priority: ProductPriority
    features: list[str] = Field(default_factory=list)
    pain_points: list[str] = Field(default_factory=list)
    is_on_offer: bool = False
    active_offer_title: str | None = None


# Module 5 — Trend Intelligence Engine.
class TrendPlatform(StrEnum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    LINKEDIN = "linkedin"
    X = "x"
    YOUTUBE = "youtube"
    GOOGLE_TRENDS = "google_trends"
    GENERAL = "general"


class TrendSignalCreateRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    headline: str = Field(min_length=2, max_length=500)
    summary: str = Field(min_length=5, max_length=3000)
    platform: TrendPlatform = TrendPlatform.GENERAL
    category: str = Field(min_length=2, max_length=100)
    target_audience: str | None = Field(default=None, max_length=500)
    suggested_angles: list[str] = Field(default_factory=list, max_length=5)
    hashtags: list[str] = Field(default_factory=list, max_length=15)
    source_name: str = Field(min_length=2, max_length=150)
    source_url: HttpUrl
    collection_date: date
    confidence_score: int = Field(ge=1, le=100, description="Confidence score from 1 to 100%")
    is_active: bool = True

    @field_validator("topic", "headline", "summary", "category", "source_name")
    @classmethod
    def validate_non_blank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be blank.")
        return value

    @field_validator("suggested_angles", "hashtags")
    @classmethod
    def normalize_trend_lists(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        for item in values:
            item = item.strip()
            if not item:
                raise ValueError("List items cannot be blank.")
            normalized.append(item)
        return normalized

    @field_validator("collection_date")
    @classmethod
    def validate_collection_date_not_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("collection_date cannot be in the future. Trends must represent verified evidence.")
        return value


class TrendSignalUpdateRequest(BaseModel):
    topic: str | None = Field(default=None, min_length=2, max_length=200)
    headline: str | None = Field(default=None, min_length=2, max_length=500)
    summary: str | None = Field(default=None, min_length=5, max_length=3000)
    platform: TrendPlatform | None = None
    category: str | None = Field(default=None, min_length=2, max_length=100)
    target_audience: str | None = Field(default=None, max_length=500)
    suggested_angles: list[str] | None = Field(default=None, max_length=5)
    hashtags: list[str] | None = Field(default=None, max_length=15)
    source_name: str | None = Field(default=None, min_length=2, max_length=150)
    source_url: HttpUrl | None = None
    collection_date: date | None = None
    confidence_score: int | None = Field(default=None, ge=1, le=100)
    is_active: bool | None = None

    _validate_non_blank_text = field_validator("topic", "headline", "summary", "category", "source_name")(TrendSignalCreateRequest.validate_non_blank_text.__func__)
    _normalize_trend_lists = field_validator("suggested_angles", "hashtags")(TrendSignalCreateRequest.normalize_trend_lists.__func__)
    _validate_collection_date_not_future = field_validator("collection_date")(TrendSignalCreateRequest.validate_collection_date_not_future.__func__)


class TrendSignal(BaseModel):
    id: UUID
    topic: str
    headline: str
    summary: str
    platform: TrendPlatform
    category: str
    target_audience: str | None = None
    suggested_angles: list[str] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    source_name: str
    source_url: str
    collection_date: date
    confidence_score: int
    is_active: bool
    created_at: str
    updated_at: str
    freshness_days: int | None = None

    @model_validator(mode="before")
    @classmethod
    def calculate_freshness(cls, data: dict) -> dict:
        if isinstance(data, dict):
            c_date = data.get("collection_date")
            if c_date:
                try:
                    if isinstance(c_date, str):
                        c_date_obj = date.fromisoformat(c_date[:10])
                    elif isinstance(c_date, date):
                        c_date_obj = c_date
                    else:
                        c_date_obj = None
                    if c_date_obj:
                        data["freshness_days"] = max(0, (date.today() - c_date_obj).days)
                except Exception:
                    pass
        return data


class TrendMatchResponse(BaseModel):
    industry: str
    total_matched: int
    trends: list[TrendSignal]


class TrendIngestRequest(BaseModel):
    geo: str = "US"
    category_hint: str | None = None
    subreddits: list[str] | None = None
    limit_per_source: int = Field(default=6, ge=1, le=20)


class TrendIngestResponse(BaseModel):
    ingested_count: int
    skipped_count: int
    model_used: str
    signals: list[TrendSignal]



# ==========================================
# Module 6: LLM Orchestration & Guardrails
# ==========================================

class GuardrailStatus(StrEnum):
    passed = "passed"
    warnings = "warnings"
    failed = "failed"
    sanitized = "sanitized"


class PromptType(StrEnum):
    strategy_ideation = "strategy_ideation"
    product_campaign = "product_campaign"
    trend_alignment = "trend_alignment"
    custom = "custom"


class GuardrailViolationType(StrEnum):
    prohibited_word = "prohibited_word"
    hallucinated_product = "hallucinated_product"
    out_of_stock_product = "out_of_stock_product"
    price_mismatch = "price_mismatch"
    ungrounded_trend = "ungrounded_trend"
    brand_voice_drift = "brand_voice_drift"
    budget_overflow = "budget_overflow"


class GuardrailViolation(BaseModel):
    violation_type: GuardrailViolationType
    severity: str = "error"  # "error" | "warning"
    offending_text: str
    description: str
    suggested_fix: str | None = None


class RecommendationRationale(BaseModel):
    margin_justification: str | None = None
    inventory_justification: str | None = None
    budget_justification: str | None = None
    trend_justification: str | None = None
    overall_rationale: str


class StrategicRecommendation(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    headline: str
    angle: str
    target_audience: str
    product_id: UUID | None = None
    product_name: str | None = None
    offer_id: UUID | None = None
    offer_title: str | None = None
    trend_signal_id: UUID | None = None
    trend_topic: str | None = None
    platform: str = "instagram"
    channel_type: str = "organic"  # "organic" | "paid"
    objective: MarketingObjective = MarketingObjective.INCREASE_PRODUCT_AWARENESS
    call_to_action: str
    content_format: str = "caption"  # "carousel", "short-form-script", "caption", "email", "thought-leadership"
    content_body: str
    rationale: RecommendationRationale
    guardrail_flags: list[str] = Field(default_factory=list)


class StructuredContext(BaseModel):
    workspace_id: UUID
    business_name: str
    industry: str
    country: str
    currency: str
    marketing_goals: list[MarketingObjective]
    brand_voice: list[str]
    prohibited_words: list[str]
    approved_ctas: list[str]
    available_products: list[PlannerProduct]
    active_offers: list[Offer]
    monthly_budget: MarketingBudget | None = None
    matched_trends: list[TrendSignal] = Field(default_factory=list)


class OrchestrationGenerateRequest(BaseModel):
    prompt_type: PromptType = PromptType.strategy_ideation
    custom_instructions: str | None = Field(default=None, max_length=2000)
    focus_product_ids: list[UUID] | None = None
    include_trends: bool = True
    channel_preference: str | None = Field(default=None, pattern="^(organic|paid|mixed)$")
    auto_sanitize_prohibited_words: bool = True


class GuardrailEvaluationResult(BaseModel):
    status: GuardrailStatus
    violations: list[GuardrailViolation] = Field(default_factory=list)
    passed: bool
    sanitized_content: str | None = None


class OrchestrationGenerateResponse(BaseModel):
    log_id: UUID
    prompt_type: PromptType
    context_summary: dict
    recommendations: list[StrategicRecommendation]
    guardrail_evaluation: GuardrailEvaluationResult
    execution_latency_ms: int
    model_name: str
    created_at: str


class GuardrailValidationRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    focus_product_ids: list[UUID] | None = None
    trend_signal_ids: list[UUID] | None = None
    auto_sanitize: bool = False


class GuardrailValidationResponse(BaseModel):
    status: GuardrailStatus
    passed: bool
    violations: list[GuardrailViolation]
    sanitized_content: str | None = None


class AIGenerationLog(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    prompt_type: PromptType
    context_summary: dict
    raw_prompt: str | None = None
    raw_output: str | None = None
    structured_output: list[StrategicRecommendation] | dict | None = None
    guardrail_status: GuardrailStatus
    guardrail_violations: list[GuardrailViolation]
    execution_latency_ms: int
    model_name: str
    created_at: str


# ==========================================
# Module 7: Strategy Engine
# ==========================================

class StrategyStatus(StrEnum):
    draft = "draft"
    approved = "approved"
    active = "active"
    archived = "archived"


class CampaignChannel(StrEnum):
    instagram = "instagram"
    tiktok = "tiktok"
    facebook = "facebook"
    linkedin = "linkedin"
    x = "x"
    youtube = "youtube"
    email = "email"
    whatsapp = "whatsapp"
    general = "general"


class StrategyTimeframe(StrEnum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"


class CampaignPillarCreateRequest(BaseModel):
    pillar_name: str = Field(min_length=2, max_length=150)
    objective: MarketingObjective = MarketingObjective.INCREASE_PRODUCT_AWARENESS
    channel_type: str = Field(default="organic", pattern="^(organic|paid)$")
    platform: CampaignChannel = CampaignChannel.instagram
    focus_product_id: UUID | None = None
    offer_id: UUID | None = None
    trend_signal_id: UUID | None = None
    creative_angle: str = Field(min_length=5, max_length=500)
    hook_ideas: list[str] = Field(default_factory=list, max_length=10)
    suggested_ctas: list[str] = Field(default_factory=list, max_length=5)
    content_formats: list[str] = Field(default_factory=list, max_length=10)
    estimated_effort: str = Field(default="medium", pattern="^(low|medium|high)$")
    rationale: str = Field(min_length=5, max_length=2000)
    order_index: int = 0


class CampaignPillarUpdateRequest(BaseModel):
    pillar_name: str | None = Field(default=None, min_length=2, max_length=150)
    objective: MarketingObjective | None = None
    channel_type: str | None = Field(default=None, pattern="^(organic|paid)$")
    platform: CampaignChannel | None = None
    focus_product_id: UUID | None = None
    offer_id: UUID | None = None
    trend_signal_id: UUID | None = None
    creative_angle: str | None = Field(default=None, min_length=5, max_length=500)
    hook_ideas: list[str] | None = Field(default=None, max_length=10)
    suggested_ctas: list[str] | None = Field(default=None, max_length=5)
    content_formats: list[str] | None = Field(default=None, max_length=10)
    estimated_effort: str | None = Field(default=None, pattern="^(low|medium|high)$")
    rationale: str | None = Field(default=None, min_length=5, max_length=2000)
    order_index: int | None = None


class CampaignPillarResponse(BaseModel):
    id: UUID
    strategy_id: UUID
    pillar_name: str
    objective: MarketingObjective
    channel_type: str
    platform: CampaignChannel
    focus_product_id: UUID | None = None
    product_name: str | None = None
    offer_id: UUID | None = None
    offer_title: str | None = None
    trend_signal_id: UUID | None = None
    trend_topic: str | None = None
    creative_angle: str
    hook_ideas: list[str] = Field(default_factory=list)
    suggested_ctas: list[str] = Field(default_factory=list)
    content_formats: list[str] = Field(default_factory=list)
    estimated_effort: str = "medium"
    rationale: str
    order_index: int = 0
    created_at: str
    updated_at: str


class BudgetAllocationBreakdown(BaseModel):
    total_budget: Decimal | None = None
    currency: str = "USD"
    organic_budget: Decimal | None = None
    paid_budget: Decimal | None = None
    organic_percentage: Decimal = Decimal("60.00")
    paid_percentage: Decimal = Decimal("40.00")
    channel_spend_recommendations: dict[str, Decimal] = Field(default_factory=dict)


class ProductPriorityBreakdown(BaseModel):
    hero_products: list[dict] = Field(default_factory=list)
    high_margin_drivers: list[dict] = Field(default_factory=list)
    clearance_or_offer_items: list[dict] = Field(default_factory=list)


class StrategyGenerateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    timeframe: StrategyTimeframe = StrategyTimeframe.monthly
    primary_goal: MarketingObjective | None = None
    focus_product_ids: list[UUID] | None = None
    target_channels: list[CampaignChannel] | None = None
    include_trends: bool = True
    custom_instructions: str | None = Field(default=None, max_length=2000)


class MarketingStrategyCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    timeframe: StrategyTimeframe = StrategyTimeframe.monthly
    executive_summary: str = Field(min_length=10, max_length=5000)
    target_audience_summary: str = Field(min_length=5, max_length=3000)
    budget_allocation_summary: BudgetAllocationBreakdown | dict = Field(default_factory=dict)
    product_priorities_summary: ProductPriorityBreakdown | dict = Field(default_factory=dict)
    strategic_rationale: dict | str = Field(default_factory=dict)
    pillars: list[CampaignPillarCreateRequest] = Field(default_factory=list)


class MarketingStrategyUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    timeframe: StrategyTimeframe | None = None
    status: StrategyStatus | None = None
    executive_summary: str | None = Field(default=None, min_length=10, max_length=5000)
    target_audience_summary: str | None = Field(default=None, min_length=5, max_length=3000)
    budget_allocation_summary: dict | None = None
    product_priorities_summary: dict | None = None
    strategic_rationale: dict | str | None = None


class MarketingStrategyResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    title: str
    timeframe: StrategyTimeframe
    status: StrategyStatus
    executive_summary: str
    target_audience_summary: str
    budget_allocation_summary: dict
    product_priorities_summary: dict
    strategic_rationale: dict | str
    generation_log_id: UUID | None = None
    pillars: list[CampaignPillarResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class MarketingStrategyListResponse(BaseModel):
    strategies: list[MarketingStrategyResponse]
    total_count: int


# ==========================================
# Module 8: Planner & Editorial Calendar
# ==========================================

class ContentStatus(StrEnum):
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    archived = "archived"


class ContentFormat(StrEnum):
    post_caption = "post_caption"
    carousel_slides = "carousel_slides"
    short_video_script = "short_video_script"
    email_newsletter = "email_newsletter"
    direct_message = "direct_message"


class CarouselSlideItem(BaseModel):
    slide_number: int = Field(ge=1, le=15)
    header: str = Field(min_length=1, max_length=150)
    body: str = Field(min_length=1, max_length=600)
    visual_direction_note: str | None = Field(default=None, max_length=300)


class ScriptSceneItem(BaseModel):
    scene_number: int = Field(ge=1, le=20)
    timing_seconds: int = Field(ge=1, le=120)
    visual_direction_note: str = Field(min_length=1, max_length=300)
    spoken_narration: str = Field(min_length=1, max_length=600)
    onscreen_text: str | None = Field(default=None, max_length=150)


class StructuredContentPayload(BaseModel):
    carousel_slides: list[CarouselSlideItem] = Field(default_factory=list)
    script_scenes: list[ScriptSceneItem] = Field(default_factory=list)
    email_preview_text: str | None = None
    email_subject_lines: list[str] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)


class PlannerContentItemCreateRequest(BaseModel):
    strategy_id: UUID | None = None
    pillar_id: UUID | None = None
    focus_product_id: UUID | None = None
    offer_id: UUID | None = None
    trend_signal_id: UUID | None = None
    title: str = Field(min_length=2, max_length=200)
    channel: CampaignChannel = CampaignChannel.instagram
    channel_type: str = Field(default="organic", pattern="^(organic|paid)$")
    format: ContentFormat = ContentFormat.post_caption
    status: ContentStatus = ContentStatus.scheduled
    scheduled_date: date
    scheduled_time_slot: str = Field(default="morning_09_00", max_length=50)
    hook: str = Field(min_length=2, max_length=500)
    primary_text: str = Field(min_length=5, max_length=8000)
    structured_content: dict = Field(default_factory=dict)
    call_to_action: str = Field(min_length=2, max_length=300)
    strategic_rationale: str = Field(default="", max_length=2000)


class PlannerContentItemUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    channel: CampaignChannel | None = None
    channel_type: str | None = Field(default=None, pattern="^(organic|paid)$")
    format: ContentFormat | None = None
    status: ContentStatus | None = None
    scheduled_date: date | None = None
    scheduled_time_slot: str | None = Field(default=None, max_length=50)
    hook: str | None = Field(default=None, min_length=2, max_length=500)
    primary_text: str | None = Field(default=None, min_length=5, max_length=8000)
    structured_content: dict | None = None
    call_to_action: str | None = Field(default=None, min_length=2, max_length=300)
    strategic_rationale: str | None = Field(default=None, max_length=2000)
    focus_product_id: UUID | None = None
    offer_id: UUID | None = None
    trend_signal_id: UUID | None = None


class PlannerContentItemResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    strategy_id: UUID | None = None
    strategy_title: str | None = None
    pillar_id: UUID | None = None
    pillar_name: str | None = None
    focus_product_id: UUID | None = None
    product_name: str | None = None
    offer_id: UUID | None = None
    offer_title: str | None = None
    trend_signal_id: UUID | None = None
    trend_topic: str | None = None
    title: str
    channel: CampaignChannel
    channel_type: str
    format: ContentFormat
    status: ContentStatus
    scheduled_date: date
    scheduled_time_slot: str
    hook: str
    primary_text: str
    structured_content: dict = Field(default_factory=dict)
    call_to_action: str
    strategic_rationale: str
    created_at: str
    updated_at: str


class BatchGenerateContentRequest(BaseModel):
    strategy_id: UUID | None = None
    start_date: date
    end_date: date
    target_channels: list[CampaignChannel] | None = None
    days_per_week: int = Field(default=3, ge=1, le=7)
    formats_preference: list[ContentFormat] | None = None


class BatchGenerateContentResponse(BaseModel):
    generated_count: int
    start_date: date
    end_date: date
    items: list[PlannerContentItemResponse]


class EditorialCalendarResponse(BaseModel):
    start_date: date
    end_date: date
    total_items: int
    items: list[PlannerContentItemResponse]


# ==========================================
# Module 9: Export, Reporting & Audit System
# ==========================================

class ExportFormat(StrEnum):
    markdown = "markdown"
    csv = "csv"
    json = "json"
    html = "html"


class HealthScoreStatus(StrEnum):
    excellent = "excellent"
    good = "good"
    needs_attention = "needs_attention"
    incomplete = "incomplete"


class HealthDimensionCheck(BaseModel):
    dimension: str
    passed: bool
    score: int
    max_score: int
    details: str


class WorkspaceHealthReport(BaseModel):
    workspace_id: UUID
    business_name: str
    overall_score: int
    status: HealthScoreStatus
    dimensions: list[HealthDimensionCheck]
    recommendations: list[str]
    generated_at: str


class AIComplianceReport(BaseModel):
    workspace_id: UUID
    total_generations: int
    pass_rate_percentage: float
    clean_passes: int
    warnings_count: int
    sanitized_count: int
    failed_count: int
    violations_by_type: dict[str, int]
    average_latency_ms: float
    generated_at: str


class WorkspaceBackupExport(BaseModel):
    workspace_id: UUID
    exported_at: str
    version: str = "1.0.0"
    workspace: dict
    brand_kit: dict | None = None
    products: list[dict] = Field(default_factory=list)
    offers: list[dict] = Field(default_factory=list)
    budget: dict | None = None
    strategies: list[dict] = Field(default_factory=list)
    planner_items: list[dict] = Field(default_factory=list)
    ai_logs_count: int = 0





