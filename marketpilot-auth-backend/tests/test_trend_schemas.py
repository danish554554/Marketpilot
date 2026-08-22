from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.schemas import TrendPlatform, TrendSignal, TrendSignalCreateRequest, TrendSignalUpdateRequest


def valid_trend() -> dict:
    return {
        "topic": "  POV Problem-Solution Audio Hooks  ",
        "headline": "  Short-form video creators using relatable problem statements in first 3 seconds  ",
        "summary": "  Audience retention increases by 35% when the product solution is introduced within 5 seconds.  ",
        "platform": TrendPlatform.TIKTOK,
        "category": "  Ecommerce  ",
        "target_audience": "Online shoppers aged 18-34",
        "suggested_angles": ["  Before vs After  ", "Common Frustration Callout"],
        "hashtags": ["  #TikTokMadeMeBuyIt  ", "#LifeHack"],
        "source_name": "  TikTok Creative Center Insights  ",
        "source_url": "https://ads.tiktok.com/business/creativecenter",
        "collection_date": date.today(),
        "confidence_score": 85,
        "is_active": True,
    }


def test_trend_normalizes_text_and_lists() -> None:
    trend = TrendSignalCreateRequest(**valid_trend())
    assert trend.topic == "POV Problem-Solution Audio Hooks"
    assert trend.headline == "Short-form video creators using relatable problem statements in first 3 seconds"
    assert trend.category == "Ecommerce"
    assert trend.suggested_angles == ["Before vs After", "Common Frustration Callout"]
    assert trend.hashtags == ["#TikTokMadeMeBuyIt", "#LifeHack"]
    assert trend.confidence_score == 85


def test_trend_rejects_future_collection_date() -> None:
    data = valid_trend()
    data["collection_date"] = date.today() + timedelta(days=2)
    with pytest.raises(ValidationError, match="cannot be in the future"):
        TrendSignalCreateRequest(**data)


@pytest.mark.parametrize("score", [0, 101, -5])
def test_trend_rejects_invalid_confidence_score(score: int) -> None:
    data = valid_trend()
    data["confidence_score"] = score
    with pytest.raises(ValidationError):
        TrendSignalCreateRequest(**data)


@pytest.mark.parametrize("field,value", [("topic", "   "), ("headline", " "), ("summary", "  "), ("source_name", "")])
def test_trend_rejects_blank_required_fields(field: str, value: str) -> None:
    data = valid_trend()
    data[field] = value
    with pytest.raises(ValidationError):
        TrendSignalCreateRequest(**data)


def test_trend_rejects_invalid_url() -> None:
    data = valid_trend()
    data["source_url"] = "not-a-url"
    with pytest.raises(ValidationError):
        TrendSignalCreateRequest(**data)


def test_trend_update_accepts_partial_modifications() -> None:
    update = TrendSignalUpdateRequest(confidence_score=92, is_active=False)
    dumped = update.model_dump(exclude_unset=True)
    assert dumped["confidence_score"] == 92
    assert dumped["is_active"] is False


def test_trend_freshness_calculation() -> None:
    ten_days_ago = date.today() - timedelta(days=10)
    raw = {
        "id": "e3b0c442-98fc-1c14-9afb-4c22b1000001",
        "topic": "UGC Review Formats",
        "headline": "Raw camera testimonials gaining higher engagement",
        "summary": "Authentic testimonial videos outperform high-production studio ads.",
        "platform": "instagram",
        "category": "Beauty & Skincare",
        "source_name": "Meta Foresight Report",
        "source_url": "https://facebook.com/business/insights",
        "collection_date": ten_days_ago.isoformat(),
        "confidence_score": 90,
        "is_active": True,
        "created_at": "2026-08-01T00:00:00Z",
        "updated_at": "2026-08-01T00:00:00Z",
    }
    signal = TrendSignal.model_validate(raw)
    assert signal.freshness_days == 10
