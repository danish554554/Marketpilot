from decimal import Decimal
from uuid import uuid4

from app.schemas import (
    CampaignChannel,
    MarginTier,
    MarketingBudget,
    MarketingObjective,
    PlannerProduct,
    ProductPriority,
    ProductStatus,
    StrategyGenerateRequest,
    StrategyStatus,
    StrategyTimeframe,
    StructuredContext,
    TrendPlatform,
    TrendSignal,
)
from app.services.strategy_engine import StrategyEngine


def _dummy_context() -> StructuredContext:
    p1 = uuid4()
    p2 = uuid4()
    t1 = uuid4()

    return StructuredContext(
        workspace_id=uuid4(),
        business_name="FitPro Gear",
        industry="Fitness",
        country="US",
        currency="USD",
        marketing_goals=[MarketingObjective.INCREASE_SALES],
        brand_voice=["Dynamic", "Direct"],
        prohibited_words=["scam", "cheat code"],
        approved_ctas=["Gear up now"],
        available_products=[
            PlannerProduct(
                id=p1,
                name="Power Lifting Belt",
                description="Heavy duty leather lifting belt",
                category="Accessories",
                price=Decimal("80.00"),
                cost_price=Decimal("20.00"),
                profit_margin=Decimal("75.00"),
                margin_tier=MarginTier.HIGH,
                stock_quantity=100,
                priority=ProductPriority.HIGH,
                features=["10mm Genuine Leather", "Steel Lever Buckle"],
                pain_points=["Lower back strain during heavy squats"],
                is_on_offer=False,
                active_offer_title=None,
            ),
            PlannerProduct(
                id=p2,
                name="Liquid Grip Chalk",
                description="Fast-drying liquid chalk for athletes",
                category="Accessories",
                price=Decimal("15.00"),
                cost_price=Decimal("4.00"),
                profit_margin=Decimal("73.33"),
                margin_tier=MarginTier.HIGH,
                stock_quantity=10,
                priority=ProductPriority.NORMAL,
                features=["Zero mess formula"],
                pain_points=["Slippery hands on barbells"],
                is_on_offer=True,
                active_offer_title="Buy 2 Get 1 Free",
            ),
        ],
        active_offers=[],
        monthly_budget=MarketingBudget(
            id=uuid4(),
            workspace_id=uuid4(),
            total_monthly_budget=Decimal("5000.00"),
            organic_percentage=Decimal("60.00"),
            paid_percentage=Decimal("40.00"),
            currency="USD",
            notes="Q3 Ad Budget",
            created_at="2026-08-21T00:00:00Z",
            updated_at="2026-08-21T00:00:00Z",
        ),
        matched_trends=[
            TrendSignal(
                id=t1,
                topic="Home Gym Setups",
                headline="Garage gym setups trending across TikTok",
                summary="Home lifting spaces on the rise.",
                platform=TrendPlatform.TIKTOK,
                category="Fitness",
                source_name="TikTok Trends",
                source_url="https://example.com/trends/gym",
                collection_date="2026-08-01",
                confidence_score=90,
                is_active=True,
                created_at="2026-08-01T00:00:00Z",
                updated_at="2026-08-01T00:00:00Z",
            )
        ],
    )


def test_prioritize_products():
    ctx = _dummy_context()
    breakdown = StrategyEngine.prioritize_products(ctx.available_products)
    assert len(breakdown.hero_products) >= 1
    assert breakdown.hero_products[0]["name"] == "Power Lifting Belt"
    # Low stock or on-offer product placed in clearance/offer items
    assert len(breakdown.clearance_or_offer_items) >= 1
    assert breakdown.clearance_or_offer_items[0]["name"] == "Liquid Grip Chalk"


def test_calculate_budget_breakdown():
    ctx = _dummy_context()
    b = StrategyEngine.calculate_budget_breakdown(
        ctx,
        target_channels=[CampaignChannel.instagram, CampaignChannel.tiktok],
    )
    assert b.total_budget == Decimal("5000.00")
    assert b.organic_budget == Decimal("3000.00")  # 60% of 5000
    assert b.paid_budget == Decimal("2000.00")     # 40% of 5000
    assert b.channel_spend_recommendations["instagram"] == Decimal("1000.00")
    assert b.channel_spend_recommendations["tiktok"] == Decimal("1000.00")


def test_generate_strategy_pillars_and_structure():
    ctx = _dummy_context()
    req = StrategyGenerateRequest(
        timeframe=StrategyTimeframe.monthly,
        include_trends=True,
    )
    res = StrategyEngine.generate_strategy(context=ctx, request=req, user_id=uuid4())
    assert res.status == StrategyStatus.draft
    assert len(res.pillars) >= 3
    # Check pillar 1 focuses on hero product
    p1 = res.pillars[0]
    assert p1.product_name == "Power Lifting Belt"
    assert p1.channel_type == "organic"
    # Check pillar 2 has paid direct response
    p2 = res.pillars[1]
    assert p2.channel_type == "paid"
    # Check trend pillar
    p3 = res.pillars[2]
    assert p3.trend_topic == "Home Gym Setups"
