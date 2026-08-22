from decimal import Decimal
from uuid import uuid4

from app.schemas import (
    BudgetAllocationBreakdown,
    CampaignChannel,
    CampaignPillarCreateRequest,
    CampaignPillarResponse,
    MarketingObjective,
    MarketingStrategyCreateRequest,
    MarketingStrategyResponse,
    ProductPriorityBreakdown,
    StrategyGenerateRequest,
    StrategyStatus,
    StrategyTimeframe,
)


def test_strategy_status_and_channel_enums():
    assert StrategyStatus.draft == "draft"
    assert StrategyStatus.active == "active"
    assert CampaignChannel.instagram == "instagram"
    assert CampaignChannel.tiktok == "tiktok"
    assert StrategyTimeframe.monthly == "monthly"


def test_campaign_pillar_create_model():
    pillar = CampaignPillarCreateRequest(
        pillar_name="Hero Product Launch",
        objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        channel_type="organic",
        platform=CampaignChannel.instagram,
        creative_angle="Focus on premium benefits",
        hook_ideas=["Hook 1", "Hook 2"],
        suggested_ctas=["Shop now"],
        content_formats=["carousel"],
        estimated_effort="medium",
        rationale="High margin product targeted at organic reach.",
    )
    assert pillar.pillar_name == "Hero Product Launch"
    assert pillar.channel_type == "organic"
    assert pillar.platform == CampaignChannel.instagram


def test_budget_allocation_breakdown():
    b = BudgetAllocationBreakdown(
        total_budget=Decimal("10000.00"),
        currency="USD",
        organic_budget=Decimal("6000.00"),
        paid_budget=Decimal("4000.00"),
        organic_percentage=Decimal("60.00"),
        paid_percentage=Decimal("40.00"),
        channel_spend_recommendations={"instagram": Decimal("2000.00"), "tiktok": Decimal("2000.00")},
    )
    assert b.total_budget == Decimal("10000.00")
    assert b.organic_budget == Decimal("6000.00")
    assert b.channel_spend_recommendations["instagram"] == Decimal("2000.00")


def test_marketing_strategy_response_serialization():
    strat_id = uuid4()
    ws_id = uuid4()
    u_id = uuid4()
    pil_id = uuid4()

    res = MarketingStrategyResponse(
        id=strat_id,
        workspace_id=ws_id,
        created_by=u_id,
        title="Q3 Growth Strategy",
        timeframe=StrategyTimeframe.monthly,
        status=StrategyStatus.draft,
        executive_summary="Summary of strategy.",
        target_audience_summary="Target audience.",
        budget_allocation_summary={"total": 5000},
        product_priorities_summary={"heroes": []},
        strategic_rationale={"rationale": "High margin focus."},
        pillars=[
            CampaignPillarResponse(
                id=pil_id,
                strategy_id=strat_id,
                pillar_name="Pillar 1",
                objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
                channel_type="organic",
                platform=CampaignChannel.instagram,
                creative_angle="Angle 1",
                hook_ideas=["Hook 1"],
                suggested_ctas=["CTA 1"],
                content_formats=["reel"],
                estimated_effort="low",
                rationale="Rationale 1",
                order_index=1,
                created_at="2026-08-21T00:00:00Z",
                updated_at="2026-08-21T00:00:00Z",
            )
        ],
        created_at="2026-08-21T00:00:00Z",
        updated_at="2026-08-21T00:00:00Z",
    )
    data = res.model_dump(mode="json")
    assert data["title"] == "Q3 Growth Strategy"
    assert len(data["pillars"]) == 1
    assert data["pillars"][0]["platform"] == "instagram"
