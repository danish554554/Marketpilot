from decimal import Decimal
from uuid import uuid4

from app.schemas import (
    GuardrailStatus,
    GuardrailViolationType,
    MarginTier,
    MarketingObjective,
    PlannerProduct,
    ProductPriority,
    ProductStatus,
    RecommendationRationale,
    StrategicRecommendation,
    StructuredContext,
    TrendPlatform,
    TrendSignal,
)
from app.services.guardrails import GuardrailsEngine


def _dummy_context() -> StructuredContext:
    prod_id = uuid4()
    trend_id = uuid4()
    return StructuredContext(
        workspace_id=uuid4(),
        business_name="Glow Skincare",
        industry="Cosmetics",
        country="US",
        currency="USD",
        marketing_goals=[MarketingObjective.INCREASE_PRODUCT_AWARENESS],
        brand_voice=["Empowering", "Scientific", "Approachable"],
        prohibited_words=["miracle cure", "cheat code", "free money"],
        approved_ctas=["Shop now", "Discover your glow"],
        available_products=[
            PlannerProduct(
                id=prod_id,
                name="Hydra Glow Serum",
                description="Deeply hydrating face serum",
                category="Skincare",
                price=Decimal("45.00"),
                cost_price=Decimal("12.00"),
                profit_margin=Decimal("73.33"),
                margin_tier=MarginTier.HIGH,
                stock_quantity=50,
                priority=ProductPriority.HIGH,
                features=["Hyaluronic Acid 2%", "Vitamin B5"],
                pain_points=["Dry flaky skin", "Dull texture"],
                is_on_offer=False,
                active_offer_title=None,
            )
        ],
        active_offers=[],
        monthly_budget=None,
        matched_trends=[
            TrendSignal(
                id=trend_id,
                topic="Glass Skin Routine",
                headline="Minimalist glass skin routines surge on TikTok",
                summary="Consumers seek multi-benefit hydration serums.",
                platform=TrendPlatform.TIKTOK,
                category="Beauty",
                source_name="Beauty Trend Report",
                source_url="https://example.com/trends/glass-skin",
                collection_date="2026-08-01",
                confidence_score=92,
                is_active=True,
                created_at="2026-08-01T00:00:00Z",
                updated_at="2026-08-01T00:00:00Z",
            )
        ],
    )


def test_sanitize_prohibited_words():
    raw_text = "This serum is a miracle cure for dry skin! It is like a cheat code for beauty."
    prohibited = ["miracle cure", "cheat code"]
    sanitized, detected = GuardrailsEngine.sanitize_prohibited_words(raw_text, prohibited)
    assert "[REDACTED]" in sanitized
    assert "miracle cure" not in sanitized.lower()
    assert "cheat code" not in sanitized.lower()
    assert "miracle cure" in detected
    assert "cheat code" in detected


def test_evaluate_text_content_passes_clean_text():
    ctx = _dummy_context()
    clean_text = "Our Hydra Glow Serum deeply hydrates your skin with clean ingredients."
    res = GuardrailsEngine.evaluate_text_content(clean_text, prohibited_words=ctx.prohibited_words)
    assert res.passed is True
    assert res.status == GuardrailStatus.passed
    assert len(res.violations) == 0


def test_evaluate_text_content_flags_prohibited_words():
    ctx = _dummy_context()
    bad_text = "Get free money with our miracle cure bundle!"
    res = GuardrailsEngine.evaluate_text_content(bad_text, prohibited_words=ctx.prohibited_words, auto_sanitize=False)
    assert res.passed is False
    assert res.status == GuardrailStatus.failed
    assert any(v.violation_type == GuardrailViolationType.prohibited_word for v in res.violations)


def test_evaluate_text_content_auto_sanitizes():
    ctx = _dummy_context()
    bad_text = "Get free money and look great!"
    res = GuardrailsEngine.evaluate_text_content(bad_text, prohibited_words=ctx.prohibited_words, auto_sanitize=True)
    assert res.passed is True
    assert res.status == GuardrailStatus.sanitized
    assert "[REDACTED]" in (res.sanitized_content or "")


def test_evaluate_recommendation_with_valid_product_and_trend():
    ctx = _dummy_context()
    valid_prod = ctx.available_products[0]
    valid_trend = ctx.matched_trends[0]

    rec = StrategicRecommendation(
        headline=f"Hydrate with {valid_prod.name}",
        angle="Focus on glass skin minimalism",
        target_audience="Beauty enthusiasts",
        product_id=valid_prod.id,
        trend_signal_id=valid_trend.id,
        platform="instagram",
        channel_type="organic",
        objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        call_to_action="Discover your glow",
        content_format="carousel",
        content_body=f"Say goodbye to dry skin with {valid_prod.name}.",
        rationale=RecommendationRationale(
            overall_rationale="High margin hero product aligned with glass skin trend.",
        ),
    )

    evaluated_rec, violations = GuardrailsEngine.evaluate_recommendation(rec, ctx, auto_sanitize=True)
    assert len([v for v in violations if v.severity == "error"]) == 0
    assert evaluated_rec.product_name == "Hydra Glow Serum"
    assert evaluated_rec.trend_topic == "Glass Skin Routine"


def test_evaluate_recommendation_flags_hallucinated_product():
    ctx = _dummy_context()
    fake_prod_id = uuid4()

    rec = StrategicRecommendation(
        headline="Try Our Imaginary Cream",
        angle="Anti-aging revolution",
        target_audience="Adults 30+",
        product_id=fake_prod_id,
        platform="tiktok",
        channel_type="paid",
        objective=MarketingObjective.INCREASE_SALES,
        call_to_action="Shop now",
        content_format="short-form-script",
        content_body="The best cream you will ever try.",
        rationale=RecommendationRationale(overall_rationale="Drive sales."),
    )

    evaluated_rec, violations = GuardrailsEngine.evaluate_recommendation(rec, ctx, auto_sanitize=True)
    assert any(v.violation_type == GuardrailViolationType.hallucinated_product for v in violations)
    assert "hallucinated_or_unstocked_product" in evaluated_rec.guardrail_flags


def test_evaluate_recommendation_flags_ungrounded_trend():
    ctx = _dummy_context()
    valid_prod = ctx.available_products[0]
    fake_trend_id = uuid4()

    rec = StrategicRecommendation(
        headline=f"Hydrate with {valid_prod.name}",
        angle="Trending topic",
        target_audience="Youth",
        product_id=valid_prod.id,
        trend_signal_id=fake_trend_id,
        platform="tiktok",
        channel_type="organic",
        objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        call_to_action="Shop now",
        content_format="caption",
        content_body="Trending now.",
        rationale=RecommendationRationale(overall_rationale="Follow current hype."),
    )

    evaluated_rec, violations = GuardrailsEngine.evaluate_recommendation(rec, ctx, auto_sanitize=True)
    assert any(v.violation_type == GuardrailViolationType.ungrounded_trend for v in violations)
    assert "unverified_trend_signal" in evaluated_rec.guardrail_flags
