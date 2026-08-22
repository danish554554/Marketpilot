from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.schemas import (
    BatchGenerateContentRequest,
    CampaignChannel,
    CampaignPillarResponse,
    ContentFormat,
    MarginTier,
    MarketingObjective,
    PlannerProduct,
    ProductPriority,
    StructuredContext,
)
from app.services.planner_service import PlannerService


def _dummy_context() -> StructuredContext:
    p1 = uuid4()
    return StructuredContext(
        workspace_id=uuid4(),
        business_name="Aura Skin",
        industry="Skincare",
        country="US",
        currency="USD",
        marketing_goals=[MarketingObjective.INCREASE_SALES],
        brand_voice=["Empowering", "Direct"],
        prohibited_words=["miracle cure", "cheat code"],
        approved_ctas=["Shop now and transform your routine"],
        available_products=[
            PlannerProduct(
                id=p1,
                name="Hyaluronic Glow Serum",
                description="2% Pure Hyaluronic Acid Face Serum",
                category="Skincare",
                price=Decimal("45.00"),
                cost_price=Decimal("10.00"),
                profit_margin=Decimal("77.78"),
                margin_tier=MarginTier.HIGH,
                stock_quantity=80,
                priority=ProductPriority.HIGH,
                features=["Deep 24h hydration", "Ultra-lightweight formula"],
                pain_points=["Dry flaky winter skin"],
                is_on_offer=False,
                active_offer_title=None,
            )
        ],
        active_offers=[],
        monthly_budget=None,
        matched_trends=[],
    )


def test_calculate_schedule_dates():
    start = date(2026, 9, 1)  # Tuesday
    end = date(2026, 9, 14)   # 2 weeks later

    # 3 days a week -> Mon, Wed, Fri
    dates = PlannerService.calculate_schedule_dates(start, end, days_per_week=3)
    assert len(dates) >= 5
    for d in dates:
        assert d.weekday() in {0, 2, 4}

    # 7 days a week -> daily
    daily_dates = PlannerService.calculate_schedule_dates(start, end, days_per_week=7)
    assert len(daily_dates) == 14


def test_generate_copy_carousel_slides():
    ctx = _dummy_context()
    pillar = CampaignPillarResponse(
        id=uuid4(),
        strategy_id=uuid4(),
        pillar_name="Hero Education",
        objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        channel_type="organic",
        platform=CampaignChannel.instagram,
        focus_product_id=ctx.available_products[0].id,
        product_name=ctx.available_products[0].name,
        creative_angle="Framework for skin hydration",
        hook_ideas=["Hook 1"],
        suggested_ctas=["Shop now"],
        content_formats=["carousel"],
        estimated_effort="medium",
        rationale="Hero product educational focus",
        order_index=1,
        created_at="2026-08-22T00:00:00Z",
        updated_at="2026-08-22T00:00:00Z",
    )

    hook, primary_text, structured, cta, rationale = PlannerService.generate_copy_for_format(
        format_type=ContentFormat.carousel_slides,
        channel=CampaignChannel.instagram,
        channel_type="organic",
        pillar=pillar,
        context=ctx,
    )
    assert "Hyaluronic Glow Serum" in hook
    assert "carousel_slides" in structured
    assert len(structured["carousel_slides"]) == 5
    assert structured["carousel_slides"][0]["slide_number"] == 1


def test_generate_copy_short_video_script():
    ctx = _dummy_context()
    pillar = CampaignPillarResponse(
        id=uuid4(),
        strategy_id=uuid4(),
        pillar_name="Direct Response",
        objective=MarketingObjective.INCREASE_SALES,
        channel_type="paid",
        platform=CampaignChannel.tiktok,
        focus_product_id=ctx.available_products[0].id,
        product_name=ctx.available_products[0].name,
        creative_angle="Pain point breakdown",
        hook_ideas=["Hook 1"],
        suggested_ctas=["Shop now"],
        content_formats=["short_video_script"],
        estimated_effort="high",
        rationale="Paid conversion",
        order_index=2,
        created_at="2026-08-22T00:00:00Z",
        updated_at="2026-08-22T00:00:00Z",
    )

    hook, primary_text, structured, cta, rationale = PlannerService.generate_copy_for_format(
        format_type=ContentFormat.short_video_script,
        channel=CampaignChannel.tiktok,
        channel_type="paid",
        pillar=pillar,
        context=ctx,
    )
    assert "Dry flaky winter skin" in hook or "Hyaluronic Glow Serum" in primary_text
    assert "script_scenes" in structured
    assert len(structured["script_scenes"]) >= 3
    assert structured["total_runtime_seconds"] > 0


def test_generate_copy_email_newsletter():
    ctx = _dummy_context()
    pillar = CampaignPillarResponse(
        id=uuid4(),
        strategy_id=uuid4(),
        pillar_name="Retention & VIP",
        objective=MarketingObjective.INCREASE_SALES,
        channel_type="organic",
        platform=CampaignChannel.email,
        focus_product_id=ctx.available_products[0].id,
        product_name=ctx.available_products[0].name,
        creative_angle="VIP update",
        hook_ideas=["VIP Hook"],
        suggested_ctas=["Shop now and transform your routine"],
        content_formats=["email_newsletter"],
        estimated_effort="low",
        rationale="Email LTV expansion",
        order_index=3,
        created_at="2026-08-22T00:00:00Z",
        updated_at="2026-08-22T00:00:00Z",
    )

    hook, primary_text, structured, cta, rationale = PlannerService.generate_copy_for_format(
        format_type=ContentFormat.email_newsletter,
        channel=CampaignChannel.email,
        channel_type="organic",
        pillar=pillar,
        context=ctx,
    )
    assert "email_subject_lines" in structured
    assert len(structured["email_subject_lines"]) >= 2
    assert "Aura Skin" in primary_text
