import io
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_user
from app.main import app
from app.schemas import DiscountType, OfferStatus, ProductPriority, ProductStatus, Role, UserProfile

client = TestClient(app)

TEST_USER_ID = uuid4()
TEST_WORKSPACE_ID = uuid4()
TEST_PRODUCT_ID = uuid4()
TEST_OFFER_ID = uuid4()

MOCK_USER = UserProfile(
    id=TEST_USER_ID,
    email="owner@example.com",
    full_name="Business Owner",
    role=Role.BUSINESS_OWNER,
)


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.clear()


# ============================================================================
# 1. Product Endpoints with Margins, Features, Pain Points & Planner Filter
# ============================================================================

def test_create_product_with_cost_price_and_margin():
    mock_db = MagicMock()
    # Mock workspace lookup
    mock_db.table().select().eq().maybe_single().execute.return_value = MagicMock(
        data={"id": str(TEST_WORKSPACE_ID)}
    )
    # Mock product insertion
    mock_db.table().insert().execute.return_value = MagicMock(
        data=[{
            "id": str(TEST_PRODUCT_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "name": "Insulated Water Bottle",
            "description": "750ml stainless steel bottle",
            "category": "Hydration",
            "sku": "BOT-750",
            "price": "50.00",
            "compare_at_price": "60.00",
            "cost_price": "20.00",
            "stock_quantity": 40,
            "track_inventory": True,
            "status": "active",
            "priority": "high",
            "images": [],
            "features": ["Double wall", "Cold for 24h"],
            "pain_points": ["Warm water on hot days"],
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }]
    )

    with patch("app.routers.products.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/products", json={
            "name": "Insulated Water Bottle",
            "description": "750ml stainless steel bottle",
            "category": "Hydration",
            "sku": "BOT-750",
            "price": 50.00,
            "cost_price": 20.00,
            "stock_quantity": 40,
            "status": "active",
            "priority": "high",
            "features": ["Double wall", "Cold for 24h"],
            "pain_points": ["Warm water on hot days"],
        })

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Insulated Water Bottle"
    assert data["cost_price"] == "20.00"
    # Verify profit margin computed as ((50 - 20) / 50 * 100) = 60.00%
    assert Decimal(str(data["profit_margin"])) == Decimal("60.00")
    assert data["features"] == ["Double wall", "Cold for 24h"]
    assert data["pain_points"] == ["Warm water on hot days"]


def test_list_available_products_for_planner():
    mock_db = MagicMock()
    # Mock workspace lookup
    mock_db.table().select().eq().maybe_single().execute.return_value = MagicMock(
        data={"id": str(TEST_WORKSPACE_ID)}
    )

    # 3 Products: 1 in-stock high margin, 1 out-of-stock (should be excluded), 1 in-stock low margin
    mock_products = [
        {
            "id": str(TEST_PRODUCT_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "name": "High Margin Bottle",
            "description": "Quality bottle",
            "category": "Drinkware",
            "price": "100.00",
            "cost_price": "20.00", # 80% margin -> high tier
            "stock_quantity": 10,
            "track_inventory": True,
            "priority": "featured",
            "features": ["Feature A"],
            "pain_points": ["Pain A"],
        },
        {
            "id": str(uuid4()),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "name": "Out of Stock Mug",
            "description": "Sold out item",
            "category": "Drinkware",
            "price": "30.00",
            "cost_price": "15.00",
            "stock_quantity": 0,
            "track_inventory": True,
            "priority": "normal",
        },
    ]

    # Active offers mocking
    mock_offers = [
        {
            "product_id": str(TEST_PRODUCT_ID),
            "title": "Flash Sale 20% Off",
        }
    ]

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"id": str(TEST_WORKSPACE_ID)}
            )
        elif table_name == "products":
            tbl.select().eq().eq().order().execute.return_value = MagicMock(
                data=mock_products
            )
        elif table_name == "offers":
            tbl.select().eq().eq().lte().gte().execute.return_value = MagicMock(
                data=mock_offers
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.products.get_service_client", return_value=mock_db):
        response = client.get("/api/v1/products/available")

    assert response.status_code == 200
    items = response.json()
    # Out of stock item should be filtered out
    assert len(items) == 1
    item = items[0]
    assert item["name"] == "High Margin Bottle"
    assert Decimal(str(item["profit_margin"])) == Decimal("80.00")
    assert item["margin_tier"] == "high"
    assert item["is_on_offer"] is True
    assert item["active_offer_title"] == "Flash Sale 20% Off"


# ============================================================================
# 2. Offers Endpoints
# ============================================================================

def test_create_and_list_offers():
    mock_db = MagicMock()
    mock_db.table().select().eq().maybe_single().execute.return_value = MagicMock(
        data={"id": str(TEST_WORKSPACE_ID)}
    )
    mock_db.table().insert().execute.return_value = MagicMock(
        data=[{
            "id": str(TEST_OFFER_ID),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "product_id": None,
            "title": "Summer Clearance 25%",
            "description": "All items discounted",
            "discount_type": "percentage",
            "discount_value": "25.00",
            "minimum_order_value": "50.00",
            "start_date": "2026-08-01",
            "end_date": "2026-08-31",
            "status": "active",
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }]
    )

    with patch("app.routers.offers.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/offers", json={
            "title": "Summer Clearance 25%",
            "description": "All items discounted",
            "discount_type": "percentage",
            "discount_value": 25.00,
            "minimum_order_value": 50.00,
            "start_date": "2026-08-01",
            "end_date": "2026-08-31",
            "status": "active",
        })

    assert response.status_code == 201
    offer = response.json()
    assert offer["title"] == "Summer Clearance 25%"
    assert offer["discount_type"] == "percentage"
    assert offer["status"] == "active"


def test_offer_date_validation_via_api():
    response = client.post("/api/v1/offers", json={
        "title": "Invalid Dates Offer",
        "discount_type": "percentage",
        "discount_value": 10.00,
        "start_date": "2026-08-31",
        "end_date": "2026-08-01", # end before start
    })
    assert response.status_code == 422


# ============================================================================
# 3. Marketing Budget Endpoints
# ============================================================================

def test_create_and_get_marketing_budget():
    mock_db = MagicMock()
    mock_db.table().select().eq().maybe_single().execute.side_effect = [
        MagicMock(data={"id": str(TEST_WORKSPACE_ID)}), # workspace lookup
        MagicMock(data=None), # existing budget check (none yet)
    ]
    mock_db.table().insert().execute.return_value = MagicMock(
        data=[{
            "id": str(uuid4()),
            "workspace_id": str(TEST_WORKSPACE_ID),
            "total_monthly_budget": "5000.00",
            "organic_percentage": "60.00",
            "paid_percentage": "40.00",
            "currency": "PKR",
            "notes": "Q3 Launch Campaign Budget",
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }]
    )

    with patch("app.routers.budget.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/budget", json={
            "total_monthly_budget": 5000.00,
            "organic_percentage": 60.00,
            "paid_percentage": 40.00,
            "currency": "pkr",
            "notes": "Q3 Launch Campaign Budget",
        })

    assert response.status_code == 201
    budget = response.json()
    assert budget["currency"] == "PKR"
    assert Decimal(str(budget["organic_percentage"])) == Decimal("60.00")
    assert Decimal(str(budget["paid_percentage"])) == Decimal("40.00")


def test_budget_percentage_split_validation_via_api():
    response = client.post("/api/v1/budget", json={
        "total_monthly_budget": 5000.00,
        "organic_percentage": 80.00,
        "paid_percentage": 30.00, # 80 + 30 = 110 != 100
        "currency": "PKR",
    })
    assert response.status_code == 422


# ============================================================================
# 4. Trend Intelligence Endpoints
# ============================================================================

TEST_TREND_ID = uuid4()


def test_list_trends_with_platform_filter():
    mock_db = MagicMock()
    mock_db.table().select().eq().eq().order().order().execute.return_value = MagicMock(
        data=[{
            "id": str(TEST_TREND_ID),
            "topic": "ASMR Unboxing Formats",
            "headline": "Microphone-close product unboxings trending",
            "summary": "ASMR videos generate 40% higher completion rates.",
            "platform": "tiktok",
            "category": "Ecommerce",
            "target_audience": "Gen Z shoppers",
            "suggested_angles": ["Sensory Satisfaction"],
            "hashtags": ["#ASMR", "#Unboxing"],
            "source_name": "TikTok Creative Center",
            "source_url": "https://ads.tiktok.com/business",
            "collection_date": "2026-08-20",
            "confidence_score": 88,
            "is_active": True,
            "created_at": "2026-08-20T00:00:00Z",
            "updated_at": "2026-08-20T00:00:00Z",
        }]
    )

    with patch("app.routers.trends.get_service_client", return_value=mock_db):
        response = client.get("/api/v1/trends?platform=tiktok")

    assert response.status_code == 200
    trends = response.json()
    assert len(trends) == 1
    assert trends[0]["topic"] == "ASMR Unboxing Formats"
    assert trends[0]["platform"] == "tiktok"
    assert trends[0]["confidence_score"] == 88


def test_match_workspace_trends():
    mock_db = MagicMock()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"industry": "Ecommerce", "target_market": "Online shoppers"}
            )
        elif table_name == "trend_signals":
            tbl.select().eq().order().execute.return_value = MagicMock(
                data=[
                    {
                        "id": str(TEST_TREND_ID),
                        "topic": "Ecommerce Micro-Offers",
                        "headline": "Flash deals under 24h",
                        "summary": "Urgency deals drive instant conversions.",
                        "platform": "instagram",
                        "category": "Ecommerce",
                        "source_name": "Meta Foresight",
                        "source_url": "https://facebook.com/business",
                        "collection_date": "2026-08-19",
                        "confidence_score": 92,
                        "is_active": True,
                        "created_at": "2026-08-19T00:00:00Z",
                        "updated_at": "2026-08-19T00:00:00Z",
                    },
                    {
                        "id": str(uuid4()),
                        "topic": "B2B SaaS Lead Magnets",
                        "headline": "Whitepaper funnels",
                        "summary": "B2B SaaS trend.",
                        "platform": "linkedin",
                        "category": "B2B SaaS",
                        "source_name": "LinkedIn Ads Report",
                        "source_url": "https://business.linkedin.com",
                        "collection_date": "2026-08-18",
                        "confidence_score": 75,
                        "is_active": True,
                        "created_at": "2026-08-18T00:00:00Z",
                        "updated_at": "2026-08-18T00:00:00Z",
                    },
                ]
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.trends.get_service_client", return_value=mock_db):
        response = client.get("/api/v1/trends/match")

    assert response.status_code == 200
    data = response.json()
    assert data["industry"] == "Ecommerce"
    assert data["total_matched"] == 1
    assert data["trends"][0]["topic"] == "Ecommerce Micro-Offers"


def test_create_trend_requires_admin():
    # Business owner should be forbidden from creating global trends
    response = client.post("/api/v1/trends", json={
        "topic": "Some Trend",
        "headline": "Headline",
        "summary": "Summary here",
        "platform": "tiktok",
        "category": "Ecommerce",
        "source_name": "Report",
        "source_url": "https://example.com/report",
        "collection_date": "2026-08-20",
        "confidence_score": 90,
    })
    assert response.status_code == 403


# ============================================================================
# 5. LLM Orchestration & Guardrails Endpoints
# ============================================================================

def test_get_structured_context_endpoint():
    mock_db = MagicMock()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(TEST_WORKSPACE_ID),
                    "business_name": "Atlas Fitness",
                    "industry": "Health & Fitness",
                    "country": "PK",
                    "currency": "PKR",
                    "marketing_goals": ["Brand Awareness", "Lead Generation"],
                }]
            )
        elif table_name == "brand_kits":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "brand_voice": ["Motivational", "High Energy"],
                    "prohibited_words": ["lazy", "give up"],
                    "approved_cta_examples": ["Start your transformation"],
                }]
            )
        elif table_name == "products":
            tbl.select().eq().eq().gt().order().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "name": "Whey Isolate Protein",
                    "description": "Premium whey protein isolate",
                    "sku": "WHEY-01",
                    "price": "8500.00",
                    "cost_price": "5000.00",
                    "stock_quantity": 40,
                    "status": "active",
                    "priority": "high",
                    "features": ["25g pure protein per scoop"],
                    "pain_points": ["Slow muscle recovery"],
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "offers":
            tbl.select().eq().eq().execute.return_value = MagicMock(data=[])
        elif table_name == "marketing_budgets":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "total_monthly_budget": "150000.00",
                    "organic_percentage": "60.00",
                    "paid_percentage": "40.00",
                    "currency": "PKR",
                    "notes": "Fitness Q3 Budget",
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "trend_signals":
            tbl.select().eq().order().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "topic": "High Protein Breakfast Hacks",
                    "headline": "Creators sharing 50g protein mornings",
                    "summary": "Protein hacks trending across TikTok and Instagram.",
                    "platform": "tiktok",
                    "category": "Health & Fitness",
                    "source_name": "TikTok Creative Center",
                    "source_url": "https://example.com/trends/protein",
                    "collection_date": "2026-08-20",
                    "confidence_score": 95,
                    "is_active": True,
                    "created_at": "2026-08-20T00:00:00Z",
                    "updated_at": "2026-08-20T00:00:00Z",
                }]
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.orchestration.get_service_client", return_value=mock_db), \
         patch("app.services.context_builder.get_service_client", return_value=mock_db):
        response = client.get("/api/v1/orchestration/context")

    assert response.status_code == 200
    ctx = response.json()
    assert ctx["business_name"] == "Atlas Fitness"
    assert len(ctx["available_products"]) == 1
    assert ctx["available_products"][0]["name"] == "Whey Isolate Protein"
    assert ctx["monthly_budget"]["total_monthly_budget"] == "150000.00"
    assert len(ctx["matched_trends"]) == 1


def test_generate_strategic_recommendations_endpoint():
    mock_db = MagicMock()
    prod_id = uuid4()
    trend_id = uuid4()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(TEST_WORKSPACE_ID),
                    "business_name": "Atlas Fitness",
                    "industry": "Health & Fitness",
                    "country": "PK",
                    "currency": "PKR",
                    "marketing_goals": ["Brand Awareness"],
                }]
            )
        elif table_name == "brand_kits":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "brand_voice": ["Motivational"],
                    "prohibited_words": ["scam"],
                    "approved_cta_examples": ["Level up your fitness today"],
                }]
            )
        elif table_name == "products":
            tbl.select().eq().eq().gt().order().execute.return_value = MagicMock(
                data=[{
                    "id": str(prod_id),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "name": "Whey Isolate Protein",
                    "description": "Premium whey protein isolate",
                    "sku": "WHEY-01",
                    "price": "8500.00",
                    "cost_price": "5000.00",
                    "stock_quantity": 40,
                    "status": "active",
                    "priority": "high",
                    "features": ["25g pure protein per scoop"],
                    "pain_points": ["Slow muscle recovery"],
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "offers":
            tbl.select().eq().eq().execute.return_value = MagicMock(data=[])
        elif table_name == "marketing_budgets":
            tbl.select().eq().limit().execute.return_value = MagicMock(data=[])
        elif table_name == "trend_signals":
            tbl.select().eq().order().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(trend_id),
                    "topic": "High Protein Breakfast Hacks",
                    "headline": "Creators sharing 50g protein mornings",
                    "summary": "Protein hacks trending across TikTok.",
                    "platform": "tiktok",
                    "category": "Health & Fitness",
                    "source_name": "TikTok Creative Center",
                    "source_url": "https://example.com/trends/protein",
                    "collection_date": "2026-08-20",
                    "confidence_score": 95,
                    "is_active": True,
                    "created_at": "2026-08-20T00:00:00Z",
                    "updated_at": "2026-08-20T00:00:00Z",
                }]
            )
        elif table_name == "ai_generation_logs":
            tbl.insert().execute.return_value = MagicMock(data=[{}])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.orchestration.get_service_client", return_value=mock_db), \
         patch("app.services.context_builder.get_service_client", return_value=mock_db), \
         patch("app.services.llm_orchestrator.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/orchestration/generate", json={
            "prompt_type": "strategy_ideation",
            "include_trends": True,
            "auto_sanitize_prohibited_words": True,
        })

    assert response.status_code == 200
    data = response.json()
    assert data["prompt_type"] == "strategy_ideation"
    assert len(data["recommendations"]) >= 1
    rec1 = data["recommendations"][0]
    assert rec1["product_name"] == "Whey Isolate Protein"
    assert rec1["rationale"]["overall_rationale"] is not None
    assert data["guardrail_evaluation"]["passed"] is True


def test_validate_marketing_content_endpoint():
    mock_db = MagicMock()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(TEST_WORKSPACE_ID),
                    "business_name": "Atlas Fitness",
                    "industry": "Health & Fitness",
                    "country": "PK",
                    "currency": "PKR",
                    "marketing_goals": ["Brand Awareness"],
                }]
            )
        elif table_name == "brand_kits":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "brand_voice": ["Motivational"],
                    "prohibited_words": ["scam", "quick fix"],
                    "approved_cta_examples": ["Get started"],
                }]
            )
        elif table_name in ("products", "offers", "marketing_budgets", "trend_signals"):
            tbl.select().eq().eq().gt().order().execute.return_value = MagicMock(data=[])
            tbl.select().eq().eq().execute.return_value = MagicMock(data=[])
            tbl.select().eq().limit().execute.return_value = MagicMock(data=[])
            tbl.select().eq().order().limit().execute.return_value = MagicMock(data=[])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.orchestration.get_service_client", return_value=mock_db), \
         patch("app.services.context_builder.get_service_client", return_value=mock_db):
        # 1. Test violation detected
        response = client.post("/api/v1/orchestration/validate", json={
            "content": "This is no quick fix or scam product, it is real results.",
            "auto_sanitize": False,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert data["passed"] is False
        assert len(data["violations"]) >= 2

        # 2. Test auto-sanitize
        response_sanitized = client.post("/api/v1/orchestration/validate", json={
            "content": "This is no quick fix or scam product, it is real results.",
            "auto_sanitize": True,
        })
        assert response_sanitized.status_code == 200
        data_sanitized = response_sanitized.json()
        assert data_sanitized["status"] == "sanitized"
        assert data_sanitized["passed"] is True
        assert "[REDACTED]" in data_sanitized["sanitized_content"]


# ============================================================================
# 6. Strategy Engine Endpoints
# ============================================================================

def test_generate_strategy_endpoint():
    mock_db = MagicMock()
    prod_id = uuid4()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(TEST_WORKSPACE_ID),
                    "business_name": "Atlas Fitness",
                    "industry": "Health & Fitness",
                    "country": "PK",
                    "currency": "PKR",
                    "marketing_goals": ["increase_product_awareness"],
                }]
            )
        elif table_name == "brand_kits":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "brand_voice": ["Motivational"],
                    "prohibited_words": ["scam"],
                    "approved_cta_examples": ["Level up your fitness today"],
                }]
            )
        elif table_name == "products":
            tbl.select().eq().eq().gt().order().execute.return_value = MagicMock(
                data=[{
                    "id": str(prod_id),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "name": "Whey Isolate Protein",
                    "description": "Pure whey protein",
                    "sku": "WHEY-01",
                    "price": "8500.00",
                    "cost_price": "5000.00",
                    "stock_quantity": 40,
                    "status": "active",
                    "priority": "high",
                    "features": ["25g pure protein per scoop"],
                    "pain_points": ["Slow recovery"],
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "offers":
            tbl.select().eq().eq().execute.return_value = MagicMock(data=[])
        elif table_name == "marketing_budgets":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "total_monthly_budget": "50000.00",
                    "organic_percentage": "60.00",
                    "paid_percentage": "40.00",
                    "currency": "PKR",
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "trend_signals":
            tbl.select().eq().order().limit().execute.return_value = MagicMock(data=[])
        elif table_name in ("marketing_strategies", "strategy_campaign_pillars"):
            tbl.insert().execute.return_value = MagicMock(data=[{}])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.strategy.get_service_client", return_value=mock_db), \
         patch("app.services.context_builder.get_service_client", return_value=mock_db), \
         patch("app.services.strategy_engine.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/strategy/generate", json={
            "timeframe": "monthly",
            "include_trends": False,
        })

    assert response.status_code == 200
    strat = response.json()
    assert strat["status"] == "draft"
    assert strat["timeframe"] == "monthly"
    assert len(strat["pillars"]) >= 2
    assert "Atlas Fitness" in strat["title"]


def test_create_and_list_marketing_strategy_endpoint():
    mock_db = MagicMock()
    strat_id = str(uuid4())

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
        elif table_name == "marketing_strategies":
            tbl.insert().execute.return_value = MagicMock(
                data=[{
                    "id": strat_id,
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "created_by": str(uuid4()),
                    "title": "Summer Campaign Strategy",
                    "timeframe": "monthly",
                    "status": "draft",
                    "executive_summary": "Summary of summer strategy.",
                    "target_audience_summary": "Active lifestyle enthusiasts.",
                    "budget_allocation_summary": {},
                    "product_priorities_summary": {},
                    "strategic_rationale": {},
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
            tbl.select().eq().order().range().execute.return_value = MagicMock(
                data=[{
                    "id": strat_id,
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "created_by": str(uuid4()),
                    "title": "Summer Campaign Strategy",
                    "timeframe": "monthly",
                    "status": "draft",
                    "executive_summary": "Summary of summer strategy.",
                    "target_audience_summary": "Active lifestyle enthusiasts.",
                    "budget_allocation_summary": {},
                    "product_priorities_summary": {},
                    "strategic_rationale": {},
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name == "strategy_campaign_pillars":
            tbl.select().eq().order().execute.return_value = MagicMock(data=[])
            tbl.insert().execute.return_value = MagicMock(data=[])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.strategy.get_service_client", return_value=mock_db):
        # 1. Create strategy
        create_res = client.post("/api/v1/strategy", json={
            "title": "Summer Campaign Strategy",
            "timeframe": "monthly",
            "executive_summary": "Summary of summer strategy.",
            "target_audience_summary": "Active lifestyle enthusiasts.",
            "pillars": [],
        })
        assert create_res.status_code == 201
        data = create_res.json()
        assert data["title"] == "Summer Campaign Strategy"

        # 2. List strategies
        list_res = client.get("/api/v1/strategy")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total_count"] == 1


# ============================================================================
# 7. Planner & Editorial Calendar Endpoints
# ============================================================================

def test_generate_batch_calendar_endpoint():
    mock_db = MagicMock()
    prod_id = uuid4()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(TEST_WORKSPACE_ID),
                    "business_name": "Atlas Fitness",
                    "industry": "Health & Fitness",
                    "country": "PK",
                    "currency": "PKR",
                    "marketing_goals": ["increase_product_awareness"],
                }]
            )
        elif table_name == "brand_kits":
            tbl.select().eq().limit().execute.return_value = MagicMock(
                data=[{
                    "id": str(uuid4()),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "brand_voice": ["Motivational"],
                    "prohibited_words": ["scam"],
                    "approved_cta_examples": ["Level up your fitness today"],
                }]
            )
        elif table_name == "products":
            tbl.select().eq().eq().gt().order().execute.return_value = MagicMock(
                data=[{
                    "id": str(prod_id),
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "name": "Whey Isolate Protein",
                    "description": "Pure whey protein",
                    "sku": "WHEY-01",
                    "price": "8500.00",
                    "cost_price": "5000.00",
                    "stock_quantity": 40,
                    "status": "active",
                    "priority": "high",
                    "features": ["25g pure protein per scoop"],
                    "pain_points": ["Slow recovery"],
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }]
            )
        elif table_name in ("offers", "marketing_budgets", "trend_signals", "marketing_strategies", "strategy_campaign_pillars"):
            tbl.select().eq().execute.return_value = MagicMock(data=[])
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data=None)
            tbl.select().eq().order().execute.return_value = MagicMock(data=[])
            tbl.select().eq().limit().execute.return_value = MagicMock(data=[])
            tbl.insert().execute.return_value = MagicMock(data=[{}])
        elif table_name == "planner_content_items":
            tbl.insert().execute.return_value = MagicMock(data=[{}])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.planner.get_service_client", return_value=mock_db), \
         patch("app.services.context_builder.get_service_client", return_value=mock_db), \
         patch("app.services.planner_service.get_service_client", return_value=mock_db), \
         patch("app.services.strategy_engine.get_service_client", return_value=mock_db):
        response = client.post("/api/v1/planner/generate-batch", json={
            "start_date": "2026-09-01",
            "end_date": "2026-09-14",
            "days_per_week": 3,
        })

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["generated_count"] >= 5
    assert len(res_data["items"]) >= 5
    first_item = res_data["items"][0]
    assert first_item["status"] == "scheduled"
    assert first_item["hook"] != ""
    assert first_item["call_to_action"] != ""


def test_get_editorial_calendar_endpoint():
    mock_db = MagicMock()
    item_id = str(uuid4())

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
        elif table_name == "planner_content_items":
            tbl.select().eq().gte().lte().order().order().execute.return_value = MagicMock(
                data=[{
                    "id": item_id,
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "created_by": str(uuid4()),
                    "title": "[INSTAGRAM] Post: Hero Spotlight",
                    "channel": "instagram",
                    "channel_type": "organic",
                    "format": "post_caption",
                    "status": "scheduled",
                    "scheduled_date": "2026-09-01",
                    "scheduled_time_slot": "morning_09_00",
                    "hook": "Stop settling for average workouts",
                    "primary_text": "Here is why Whey Isolate changes everything.",
                    "structured_content": {},
                    "call_to_action": "Level up your fitness today",
                    "strategic_rationale": "High margin focus.",
                    "created_at": "2026-08-22T00:00:00Z",
                    "updated_at": "2026-08-22T00:00:00Z",
                }]
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.planner.get_service_client", return_value=mock_db):
        response = client.get("/api/v1/planner/calendar?start_date=2026-09-01&end_date=2026-09-14")

    assert response.status_code == 200
    cal_data = response.json()
    assert cal_data["total_items"] == 1
    assert cal_data["items"][0]["channel"] == "instagram"
    assert cal_data["items"][0]["format"] == "post_caption"


# ============================================================================
# 8. Export, Reporting & Audit Endpoints
# ============================================================================

def test_export_strategy_endpoint():
    mock_db = MagicMock()
    strat_id = str(uuid4())

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
        elif table_name == "marketing_strategies":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={
                    "id": strat_id,
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "created_by": str(uuid4()),
                    "title": "Summer Campaign Strategy",
                    "timeframe": "monthly",
                    "status": "approved",
                    "executive_summary": "Summary of summer strategy.",
                    "target_audience_summary": "Active lifestyle enthusiasts.",
                    "budget_allocation_summary": {},
                    "product_priorities_summary": {},
                    "strategic_rationale": {},
                    "created_at": "2026-08-21T00:00:00Z",
                    "updated_at": "2026-08-21T00:00:00Z",
                }
            )
        elif table_name == "strategy_campaign_pillars":
            tbl.select().eq().order().execute.return_value = MagicMock(data=[])
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.reporting.get_service_client", return_value=mock_db), \
         patch("app.routers.strategy.get_service_client", return_value=mock_db):
        # 1. Export as Markdown
        res_md = client.get(f"/api/v1/export/strategy/{strat_id}?format=markdown")
        assert res_md.status_code == 200
        assert "Summer Campaign Strategy" in res_md.text

        # 2. Export as CSV
        res_csv = client.get(f"/api/v1/export/strategy/{strat_id}?format=csv")
        assert res_csv.status_code == 200
        assert "Pillar Name" in res_csv.text


def test_export_calendar_endpoint():
    mock_db = MagicMock()
    item_id = str(uuid4())

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data={"id": str(TEST_WORKSPACE_ID)})
        elif table_name == "planner_content_items":
            tbl.select().eq().gte().lte().order().order().execute.return_value = MagicMock(
                data=[{
                    "id": item_id,
                    "workspace_id": str(TEST_WORKSPACE_ID),
                    "created_by": str(uuid4()),
                    "title": "[INSTAGRAM] Post: Hero Spotlight",
                    "channel": "instagram",
                    "channel_type": "organic",
                    "format": "post_caption",
                    "status": "scheduled",
                    "scheduled_date": "2026-09-01",
                    "scheduled_time_slot": "morning_09_00",
                    "hook": "Stop settling for average workouts",
                    "primary_text": "Here is why Whey Isolate changes everything.",
                    "structured_content": {},
                    "call_to_action": "Level up your fitness today",
                    "strategic_rationale": "High margin focus.",
                    "created_at": "2026-08-22T00:00:00Z",
                    "updated_at": "2026-08-22T00:00:00Z",
                }]
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.reporting.get_service_client", return_value=mock_db):
        res_csv = client.get("/api/v1/export/calendar?start_date=2026-09-01&end_date=2026-09-14&format=csv")
        assert res_csv.status_code == 200
        assert "Stop settling for average workouts" in res_csv.text


def test_reporting_health_and_compliance_endpoints():
    mock_db = MagicMock()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"id": str(TEST_WORKSPACE_ID), "business_name": "Atlas Fitness", "industry": "Fitness", "country": "PK"}
            )
        elif table_name == "brand_kits":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data=None)
        elif table_name in ("products", "offers", "trend_signals", "marketing_strategies", "planner_content_items", "ai_generation_logs"):
            tbl.select().eq().execute.return_value = MagicMock(data=[])
            tbl.select().eq().limit().execute.return_value = MagicMock(data=[])
        elif table_name == "marketing_budgets":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(data=None)
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.routers.reporting.get_service_client", return_value=mock_db), \
         patch("app.services.reporting_service.get_service_client", return_value=mock_db):
        # 1. Health report endpoint
        res_health = client.get("/api/v1/reporting/workspace-health")
        assert res_health.status_code == 200
        h_data = res_health.json()
        assert "overall_score" in h_data
        assert h_data["business_name"] == "Atlas Fitness"

        # 2. Compliance endpoint
        res_comp = client.get("/api/v1/reporting/ai-compliance")
        assert res_comp.status_code == 200
        c_data = res_comp.json()
        assert c_data["total_generations"] == 0





