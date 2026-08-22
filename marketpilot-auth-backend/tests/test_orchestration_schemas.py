from uuid import uuid4

from app.schemas import (
    AIGenerationLog,
    GuardrailEvaluationResult,
    GuardrailStatus,
    GuardrailViolation,
    GuardrailViolationType,
    MarketingObjective,
    OrchestrationGenerateRequest,
    OrchestrationGenerateResponse,
    PromptType,
    RecommendationRationale,
    StrategicRecommendation,
    StructuredContext,
)


def test_guardrail_violation_model():
    v = GuardrailViolation(
        violation_type=GuardrailViolationType.prohibited_word,
        severity="error",
        offending_text="guaranteed miracles",
        description="Content contains prohibited brand word.",
        suggested_fix="Replace with approved wording.",
    )
    assert v.violation_type == GuardrailViolationType.prohibited_word
    assert v.severity == "error"
    assert v.offending_text == "guaranteed miracles"


def test_recommendation_rationale():
    r = RecommendationRationale(
        margin_justification="65% profit margin",
        inventory_justification="120 in stock",
        overall_rationale="High margin product targeted at seasonal demand.",
    )
    assert r.margin_justification == "65% profit margin"
    assert "High margin" in r.overall_rationale


def test_strategic_recommendation_serialization():
    rec = StrategicRecommendation(
        headline="Elevate Your Daily Ritual",
        angle="Focus on premium ingredients and organic sustainability",
        target_audience="Eco-conscious young professionals",
        platform="instagram",
        channel_type="organic",
        objective=MarketingObjective.INCREASE_PRODUCT_AWARENESS,
        call_to_action="Explore the collection today",
        content_format="carousel",
        content_body="Slide 1: Clean formula. Slide 2: Clinically tested results.",
        rationale=RecommendationRationale(
            overall_rationale="Drives organic awareness with strong credibility.",
        ),
    )
    data = rec.model_dump(mode="json")
    assert data["headline"] == "Elevate Your Daily Ritual"
    assert data["channel_type"] == "organic"
    assert data["objective"] == "increase_product_awareness"
    assert "id" in data


def test_orchestration_request_defaults():
    req = OrchestrationGenerateRequest()
    assert req.prompt_type == PromptType.strategy_ideation
    assert req.include_trends is True
    assert req.auto_sanitize_prohibited_words is True
    assert req.channel_preference is None


def test_guardrail_evaluation_result():
    res = GuardrailEvaluationResult(
        status=GuardrailStatus.passed,
        violations=[],
        passed=True,
    )
    assert res.status == GuardrailStatus.passed
    assert res.passed is True
    assert len(res.violations) == 0


def test_ai_generation_log_schema():
    log_id = uuid4()
    ws_id = uuid4()
    u_id = uuid4()
    log = AIGenerationLog(
        id=log_id,
        workspace_id=ws_id,
        user_id=u_id,
        prompt_type=PromptType.strategy_ideation,
        context_summary={"product_count": 5},
        guardrail_status=GuardrailStatus.passed,
        guardrail_violations=[],
        execution_latency_ms=250,
        model_name="marketpilot-v1-engine",
        created_at="2026-08-21T12:00:00Z",
    )
    assert log.id == log_id
    assert log.guardrail_status == GuardrailStatus.passed
    assert log.execution_latency_ms == 250
