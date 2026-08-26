import json
from datetime import date
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from app.config import get_settings
from app.schemas import (
    MarginTier,
    MarketingObjective,
    OrchestrationGenerateRequest,
    PlannerProduct,
    ProductPriority,
    PromptType,
    StrategyGenerateRequest,
    StrategyTimeframe,
    StructuredContext,
    TrendPlatform,
    TrendSignal,
)
from app.services.gemini_service import GeminiService
from app.services.llm_orchestrator import LLMOrchestrator
from app.services.strategy_engine import StrategyEngine


@pytest.fixture
def mock_structured_context():
    prod_id = uuid4()
    trend_id = uuid4()
    return StructuredContext(
        workspace_id=uuid4(),
        business_name="GlowSilk Beauty",
        industry="Personal Care & Beauty",
        country="US",
        currency="USD",
        marketing_goals=[MarketingObjective.INCREASE_PRODUCT_AWARENESS],
        brand_voice=["Empowering", "Gentle", "Clean"],
        prohibited_words=["painful waxing", "cheap plastic"],
        approved_ctas=["Get painless smooth skin", "Shop the 2-in-1 remover"],
        available_products=[
            PlannerProduct(
                id=prod_id,
                name="2-in-1 Rechargeable Hair Remover",
                sku="GLOW-2IN1-PRO",
                description="Precision 2-in-1 rechargeable hair remover and eyebrow trimmer.",
                price=39.99,
                cost_price=8.50,
                profit_margin=78.7,
                margin_tier=MarginTier.HIGH,
                stock_quantity=650,
                status="active",
                priority=ProductPriority.HIGH,
                features=["Precision dual-head blades", "USB fast rechargeable"],
                pain_points=["Painful waxing", "Razor burns"],
            )
        ],
        active_offers=[],
        monthly_budget=None,
        matched_trends=[
            TrendSignal(
                id=trend_id,
                topic="30-Second Peach Fuzz Removal Before Makeup",
                headline="Viral smooth base routine demos surge on TikTok",
                summary="High-engagement short-form videos",
                platform=TrendPlatform.TIKTOK,
                category="Beauty",
                source_name="TikTok Discovery",
                source_url="https://tiktok.com",
                collection_date=date.today(),
                confidence_score=96,
                suggested_angles=["The secret to non-cakey foundation"],
                is_active=True,
                created_at="2026-08-26T12:00:00Z",
                updated_at="2026-08-26T12:00:00Z",
            )
        ],
    )


def test_gemini_service_availability_toggle():
    with patch.object(get_settings(), "gemini_api_key", None):
        assert not GeminiService.is_available()
        assert GeminiService.get_client() is None

    with patch.object(get_settings(), "gemini_api_key", "test-key-12345"):
        assert GeminiService.is_available()


def test_gemini_service_fallback_when_unconfigured(mock_structured_context):
    req = OrchestrationGenerateRequest(
        prompt_type=PromptType.strategy_ideation,
        include_trends=True,
    )

    with patch.object(get_settings(), "gemini_api_key", None):
        res = GeminiService.generate_recommendations(
            context=mock_structured_context,
            request=req,
            system_instruction="System prompt",
            user_prompt_str="User prompt",
        )
        assert res is None


def test_gemini_service_mock_successful_generation(mock_structured_context):
    req = OrchestrationGenerateRequest(
        prompt_type=PromptType.strategy_ideation,
        include_trends=True,
    )

    prod = mock_structured_context.available_products[0]
    trend = mock_structured_context.matched_trends[0]

    mock_gemini_response_data = [
        {
            "headline": "Flawless Foundation in 30 Seconds",
            "angle": "Close-up peach fuzz removal routine",
            "target_audience": "Women seeking painless grooming",
            "product_id": str(prod.id),
            "product_name": prod.name,
            "offer_id": None,
            "offer_title": None,
            "trend_signal_id": str(trend.id),
            "trend_topic": trend.topic,
            "platform": "tiktok",
            "channel_type": "organic",
            "objective": "increase_product_awareness",
            "call_to_action": "Get painless smooth skin",
            "content_format": "short_video_script",
            "content_body": "Why your makeup looks cakey and how the 2-in-1 remover fixes it.",
            "rationale": {
                "margin_justification": "78.7% margin supports organic scaling.",
                "inventory_justification": "650 units in stock.",
                "overall_rationale": "Captures viral discovery traffic.",
            },
        }
    ]

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_gemini_response_data)
    mock_client.models.generate_content.return_value = mock_response

    with patch.object(GeminiService, "get_client", return_value=mock_client):
        with patch.object(GeminiService, "is_available", return_value=True):
            recs = GeminiService.generate_recommendations(
                context=mock_structured_context,
                request=req,
                system_instruction="System prompt",
                user_prompt_str="User prompt",
            )

            assert recs is not None
            assert len(recs) == 1
            assert recs[0].product_name == "2-in-1 Rechargeable Hair Remover"
            assert recs[0].headline == "Flawless Foundation in 30 Seconds"
            assert recs[0].rationale.margin_justification == "78.7% margin supports organic scaling."


def test_llm_orchestrator_execution_with_gemini_fallback(mock_structured_context):
    req = OrchestrationGenerateRequest(
        prompt_type=PromptType.strategy_ideation,
        include_trends=True,
    )
    user_id = uuid4()

    # When Gemini is unavailable, orchestrator succeeds with deterministic fallback
    with patch.object(GeminiService, "is_available", return_value=False):
        response = LLMOrchestrator.execute(mock_structured_context, req, user_id)
        assert response is not None
        assert len(response.recommendations) >= 1
        assert response.model_name == LLMOrchestrator.FALLBACK_MODEL_NAME


def test_strategy_engine_with_gemini_pillars(mock_structured_context):
    strat_req = StrategyGenerateRequest(
        timeframe=StrategyTimeframe.weekly,
        primary_goal=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        include_trends=True,
    )
    user_id = uuid4()

    mock_pillars = [
        {
            "pillar_name": "Pillar 1: Viral Demo",
            "objective": "increase_product_awareness",
            "channel_type": "organic",
            "platform": "tiktok",
            "product_name": "2-in-1 Rechargeable Hair Remover",
            "creative_angle": "Macro peach fuzz removal",
            "hook_ideas": ["Stop using razors on your face"],
            "suggested_ctas": ["Get painless smooth skin"],
            "content_formats": ["short_video_script"],
            "estimated_effort": "medium",
            "rationale": "High margin beauty product demo.",
        },
        {
            "pillar_name": "Pillar 2: Direct-Response Ad",
            "objective": "drive_sales",
            "channel_type": "paid",
            "platform": "facebook",
            "product_name": "2-in-1 Rechargeable Hair Remover",
            "creative_angle": "Waxing cost comparison",
            "hook_ideas": ["Save $800 a year on salon waxing"],
            "suggested_ctas": ["Shop the 2-in-1 remover"],
            "content_formats": ["comparison_ad"],
            "estimated_effort": "high",
            "rationale": "Direct conversion angle.",
        },
        {
            "pillar_name": "Pillar 3: Eyebrow Detailing Hack",
            "objective": "boost_engagement",
            "channel_type": "organic",
            "platform": "instagram",
            "product_name": "2-in-1 Rechargeable Hair Remover",
            "creative_angle": "Shaping eyebrows without tweezers",
            "hook_ideas": ["Shape brows in 45 seconds"],
            "suggested_ctas": ["Save for later"],
            "content_formats": ["carousel_slides"],
            "estimated_effort": "medium",
            "rationale": "Dual-head versatility.",
        },
        {
            "pillar_name": "Pillar 4: VIP Glow Club",
            "objective": "customer_retention",
            "channel_type": "organic",
            "platform": "email",
            "product_name": "2-in-1 Rechargeable Hair Remover",
            "creative_angle": "Dermatologist maintenance guide",
            "hook_ideas": ["3 tips to prevent irritation"],
            "suggested_ctas": ["Read the guide"],
            "content_formats": ["email_newsletter"],
            "estimated_effort": "low",
            "rationale": "Builds customer loyalty.",
        },
    ]

    with patch.object(GeminiService, "is_available", return_value=True):
        with patch.object(GeminiService, "generate_strategy_pillars", return_value=mock_pillars):
            with patch("app.services.strategy_engine.build_structured_context", return_value=mock_structured_context):
                with patch("app.services.strategy_engine.get_service_client") as mock_client:
                    mock_table = MagicMock()
                    mock_table.insert.return_value.execute.return_value = MagicMock()
                    mock_client.return_value.table.return_value = mock_table

                    strat = StrategyEngine.generate_strategy(mock_structured_context, strat_req, user_id)
                    assert strat is not None
                    assert len(strat.pillars) == 4
                    assert strat.pillars[0].pillar_name == "Pillar 1: Viral Demo"
                    assert strat.pillars[1].pillar_name == "Pillar 2: Direct-Response Ad"
