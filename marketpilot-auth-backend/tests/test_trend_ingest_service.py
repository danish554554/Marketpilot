from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from app.schemas import TrendPlatform, TrendSignalCreateRequest
from app.services.gemini_service import GeminiService
from app.services.trend_ingest_service import TrendIngestService


MOCK_GOOGLE_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Daily Search Trends</title>
    <item>
      <title>Painless Facial Hair Remover</title>
      <link>https://news.google.com/articles/12345</link>
      <description>Viral trending beauty search query in United States with 200K+ searches.</description>
      <pubDate>Wed, 26 Aug 2026 12:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>"""

MOCK_REDDIT_JSON = {
    "data": {
        "children": [
            {
                "data": {
                    "title": "Why is everyone on TikTok talking about 30-second peach fuzz removal?",
                    "selftext": "I tried the rechargeable hair remover and foundation applies 10x smoother.",
                    "permalink": "/r/TikTokTrends/comments/abc1234/viral_routine",
                    "score": 1420,
                    "stickied": False,
                }
            }
        ]
    }
}


def test_fetch_google_trends_parsing():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = MOCK_GOOGLE_RSS.encode("utf-8")

    with patch("httpx.Client.get", return_value=mock_resp):
        trends = TrendIngestService.fetch_google_trends(geo="US", limit=5)
        assert len(trends) == 1
        assert trends[0]["title"] == "Painless Facial Hair Remover"
        assert trends[0]["platform"] == "google_trends"
        assert "200K+" in trends[0]["summary"]


def test_fetch_reddit_trends_parsing():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = MOCK_REDDIT_JSON

    with patch("httpx.Client.get", return_value=mock_resp):
        trends = TrendIngestService.fetch_reddit_trends(subreddit="TikTokTrends", limit=5)
        assert len(trends) == 1
        assert "peach fuzz removal" in trends[0]["title"]
        assert trends[0]["platform"] == "tiktok"
        assert "rechargeable hair remover" in trends[0]["summary"]


def test_synthesize_and_validate_with_gemini():
    raw_signals = [
        {
            "title": "30-Second Peach Fuzz Removal Routine",
            "summary": "Viral TikTok beauty hack with millions of views.",
            "source_name": "TikTok Discovery",
            "source_url": "https://tiktok.com",
            "platform": "tiktok",
        }
    ]

    mock_gemini_signals = [
        {
            "topic": "30-Second Peach Fuzz Removal",
            "headline": "Short-form beauty routines emphasize effortless prep before makeup.",
            "summary": "Creators demonstrate close-up smooth base application without razor irritation.",
            "platform": "tiktok",
            "category": "Beauty",
            "target_audience": "Women seeking quick, painless facial grooming.",
            "suggested_angles": ["The secret to smooth foundation", "Stop razor irritation today"],
            "hashtags": ["#PeachFuzzRemoval", "#SmoothSkin", "#BeautyHacks"],
            "confidence_score": 95,
            "source_name": "TikTok Discovery",
            "source_url": "https://tiktok.com",
        }
    ]

    with patch.object(GeminiService, "is_available", return_value=True):
        with patch.object(GeminiService, "synthesize_trend_signals", return_value=mock_gemini_signals):
            validated = TrendIngestService.synthesize_and_validate(raw_signals, category_hint="Beauty")
            assert len(validated) == 1
            assert isinstance(validated[0], TrendSignalCreateRequest)
            assert validated[0].topic == "30-Second Peach Fuzz Removal"
            assert validated[0].platform == TrendPlatform.TIKTOK
            assert validated[0].confidence_score == 95


def test_synthesize_and_validate_fallback():
    raw_signals = [
        {
            "title": "Ergonomic Desk Accessories",
            "summary": "Remote workers investing in posture correction gadgets.",
            "source_name": "Reddit r/Ecommerce",
            "source_url": "https://reddit.com",
            "platform": "general",
        }
    ]

    # When Gemini is offline, deterministic fallback structures valid TrendSignalCreateRequest
    with patch.object(GeminiService, "is_available", return_value=False):
        validated = TrendIngestService.synthesize_and_validate(raw_signals, category_hint="Office & Work")
        assert len(validated) == 1
        assert isinstance(validated[0], TrendSignalCreateRequest)
        assert validated[0].topic == "Ergonomic Desk Accessories"
        assert validated[0].category == "Office & Work"
        assert validated[0].confidence_score == 88


def test_ingest_live_trends_deduplication():
    raw_mock = [
        {"title": "Existing Topic", "summary": "Already in database", "source_name": "Src", "source_url": "https://a.com", "platform": "general"},
        {"title": "Fresh New Topic", "summary": "Brand new signal", "source_name": "Src", "source_url": "https://b.com", "platform": "tiktok"},
    ]

    with patch.object(TrendIngestService, "fetch_google_trends", return_value=raw_mock):
        with patch.object(TrendIngestService, "fetch_reddit_trends", return_value=[]):
            with patch.object(GeminiService, "is_available", return_value=False):
                with patch("app.services.trend_ingest_service.get_service_client") as mock_client:
                    # Mock existing table with "Existing Topic"
                    mock_select_table = MagicMock()
                    mock_select_table.execute.return_value.data = [{"topic": "existing topic"}]
                    
                    mock_insert_table = MagicMock()
                    mock_insert_table.execute.return_value.data = [{
                        "id": str(uuid4()),
                        "topic": "Fresh New Topic",
                        "headline": "Surging consumer momentum around Fresh New Topic",
                        "summary": "Brand new signal",
                        "platform": "tiktok",
                        "category": "Ecommerce",
                        "target_audience": "Consumers",
                        "suggested_angles": ["Hook 1"],
                        "hashtags": ["#New"],
                        "source_name": "Src",
                        "source_url": "https://b.com",
                        "collection_date": "2026-08-26",
                        "confidence_score": 88,
                        "is_active": True,
                        "created_at": "2026-08-26T12:00:00Z",
                        "updated_at": "2026-08-26T12:00:00Z",
                    }]

                    def table_router(name):
                        t = MagicMock()
                        t.select.return_value = mock_select_table
                        t.insert.return_value = mock_insert_table
                        return t

                    mock_client.return_value.table.side_effect = table_router

                    res = TrendIngestService.ingest_live_trends(geo="US", category_hint="Ecommerce")
                    assert res["ingested_count"] == 1
                    assert res["skipped_count"] == 1
                    assert len(res["signals"]) == 1
                    assert res["signals"][0].topic == "Fresh New Topic"
