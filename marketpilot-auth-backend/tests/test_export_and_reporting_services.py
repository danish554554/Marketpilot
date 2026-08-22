from datetime import date
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.schemas import (
    CampaignChannel,
    CampaignPillarResponse,
    ContentFormat,
    ContentStatus,
    MarketingObjective,
    MarketingStrategyResponse,
    PlannerContentItemResponse,
    StrategyStatus,
    StrategyTimeframe,
)
from app.services.export_service import ExportService
from app.services.reporting_service import ReportingService


def _dummy_strategy() -> MarketingStrategyResponse:
    s_id = uuid4()
    ws_id = uuid4()
    u_id = uuid4()

    return MarketingStrategyResponse(
        id=s_id,
        workspace_id=ws_id,
        created_by=u_id,
        title="Q3 Brand Scale Strategy",
        timeframe=StrategyTimeframe.monthly,
        status=StrategyStatus.approved,
        executive_summary="Executive summary for scaling the brand.",
        target_audience_summary="Targeting fitness enthusiasts in US.",
        budget_allocation_summary={
            "total_budget": "5000.00",
            "currency": "USD",
            "organic_percentage": 60,
            "paid_percentage": 40,
            "channel_spend_recommendations": {"instagram": "1000.00", "tiktok": "1000.00"},
        },
        product_priorities_summary={"hero_products": [{"name": "Lifting Belt"}]},
        strategic_rationale={"inventory": "Focus on high margin belt."},
        pillars=[
            CampaignPillarResponse(
                id=uuid4(),
                strategy_id=s_id,
                pillar_name="Hero Education",
                objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
                channel_type="organic",
                platform=CampaignChannel.instagram,
                product_name="Lifting Belt",
                creative_angle="Story of why standard belts fail",
                hook_ideas=["Hook 1", "Hook 2"],
                suggested_ctas=["Shop now"],
                content_formats=["carousel"],
                estimated_effort="medium",
                rationale="Organic authority builder",
                order_index=1,
                created_at="2026-08-22T00:00:00Z",
                updated_at="2026-08-22T00:00:00Z",
            )
        ],
        created_at="2026-08-22T00:00:00Z",
        updated_at="2026-08-22T00:00:00Z",
    )


def _dummy_calendar_items() -> list[PlannerContentItemResponse]:
    return [
        PlannerContentItemResponse(
            id=uuid4(),
            workspace_id=uuid4(),
            created_by=uuid4(),
            title="[INSTAGRAM] Post: Hero Spotlight",
            channel=CampaignChannel.instagram,
            channel_type="organic",
            format=ContentFormat.post_caption,
            status=ContentStatus.scheduled,
            scheduled_date=date(2026, 9, 1),
            scheduled_time_slot="morning_09_00",
            hook="Stop struggling with weak workouts",
            primary_text="Here is why our Lifting Belt transforms your lifts.",
            structured_content={},
            call_to_action="Shop now",
            strategic_rationale="High margin hero item.",
            created_at="2026-08-22T00:00:00Z",
            updated_at="2026-08-22T00:00:00Z",
        )
    ]


def test_export_strategy_formats():
    strat = _dummy_strategy()

    # 1. Markdown
    md = ExportService.export_strategy_markdown(strat)
    assert "# Q3 Brand Scale Strategy" in md
    assert "Hero Education" in md
    assert "5000.00 USD" in md

    # 2. CSV
    csv_str = ExportService.export_strategy_csv(strat)
    assert "Pillar Name,Platform" in csv_str or "Pillar Name" in csv_str
    assert "Hero Education" in csv_str

    # 3. HTML
    html = ExportService.export_strategy_html(strat)
    assert "<!DOCTYPE html>" in html
    assert "Q3 Brand Scale Strategy" in html


def test_export_calendar_formats():
    items = _dummy_calendar_items()

    # 1. CSV
    csv_str = ExportService.export_calendar_csv(items)
    assert "Scheduled Date,Time Slot,Channel" in csv_str
    assert "2026-09-01" in csv_str
    assert "Stop struggling with weak workouts" in csv_str

    # 2. Markdown
    md = ExportService.export_calendar_markdown(items, date(2026, 9, 1), date(2026, 9, 14))
    assert "# Editorial Marketing Calendar" in md
    assert "2026-09-01" in md

    # 3. HTML
    html = ExportService.export_calendar_html(items, date(2026, 9, 1), date(2026, 9, 14))
    assert "<!DOCTYPE html>" in html
    assert "INSTAGRAM" in html


def test_reporting_service_health_and_compliance():
    mock_db = MagicMock()
    ws_id = uuid4()

    def mock_table_handler(table_name):
        tbl = MagicMock()
        if table_name == "business_workspaces":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"id": str(ws_id), "business_name": "Titan Gym", "industry": "Fitness", "country": "US"}
            )
        elif table_name == "brand_kits":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"brand_voice": ["Motivational"], "approved_cta_examples": ["Join today"]}
            )
        elif table_name == "products":
            tbl.select().eq().execute.return_value = MagicMock(
                data=[
                    {"id": str(uuid4()), "status": "active", "stock_quantity": 50, "cost_price": "20.00", "price": "80.00"},
                    {"id": str(uuid4()), "status": "active", "stock_quantity": 30, "cost_price": "10.00", "price": "40.00"},
                    {"id": str(uuid4()), "status": "active", "stock_quantity": 25, "cost_price": "5.00", "price": "25.00"},
                ]
            )
        elif table_name == "offers":
            tbl.select().eq().execute.return_value = MagicMock(data=[{"id": str(uuid4()), "status": "active"}])
        elif table_name == "marketing_budgets":
            tbl.select().eq().maybe_single().execute.return_value = MagicMock(
                data={"total_monthly_budget": "5000.00", "currency": "USD", "organic_percentage": 60, "paid_percentage": 40}
            )
        elif table_name == "trend_signals":
            tbl.select().eq().limit().execute.return_value = MagicMock(data=[{"id": str(uuid4())}])
        elif table_name == "marketing_strategies":
            tbl.select().eq().execute.return_value = MagicMock(data=[{"id": str(uuid4()), "status": "active"}])
        elif table_name == "planner_content_items":
            tbl.select().eq().execute.return_value = MagicMock(data=[{"id": str(uuid4()), "status": "scheduled"} for _ in range(4)])
        elif table_name == "ai_generation_logs":
            tbl.select().eq().execute.return_value = MagicMock(
                data=[
                    {"guardrail_status": "passed", "execution_latency_ms": 250, "guardrail_violations": []},
                    {"guardrail_status": "sanitized", "execution_latency_ms": 300, "guardrail_violations": [{"violation_type": "prohibited_word"}]},
                ]
            )
        return tbl

    mock_db.table.side_effect = mock_table_handler

    with patch("app.services.reporting_service.get_service_client", return_value=mock_db):
        # 1. Health report
        health = ReportingService.calculate_workspace_health(ws_id)
        assert health.overall_score >= 85
        assert health.status == "excellent"

        # 2. Compliance report
        compliance = ReportingService.calculate_ai_compliance(ws_id)
        assert compliance.total_generations == 2
        assert compliance.pass_rate_percentage == 100.0
        assert compliance.violations_by_type["prohibited_word"] == 1
