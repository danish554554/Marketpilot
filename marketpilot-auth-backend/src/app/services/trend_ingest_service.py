from datetime import date
import logging
from typing import Any
import xml.etree.ElementTree as ET

import httpx
from pydantic import HttpUrl

from app.schemas import TrendPlatform, TrendSignal, TrendSignalCreateRequest
from app.services.gemini_service import GeminiService
from app.supabase_client import get_service_client

logger = logging.getLogger("marketpilot.trend_ingest")


class TrendIngestService:
    """
    Automated real trend-data ingestion pipeline leveraging free public feeds:
    - Google Trends Public Daily RSS Feeds
    - Reddit Trending Community JSON Feeds
    - Google Gemini AI Synthesis and Structured Categorization
    """

    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MarketPilot/1.0"

    @classmethod
    def fetch_google_trends(cls, geo: str = "US", limit: int = 8) -> list[dict]:
        """
        Fetches live trending search queries from Google Trends public RSS feed.
        No API key required.
        """
        url = f"https://trends.google.com/trending/rss?geo={geo.upper()}"
        headers = {"User-Agent": cls.USER_AGENT}
        trends: list[dict] = []

        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.warning(f"Google Trends RSS returned status {resp.status_code}")
                    return []

                root = ET.fromstring(resp.content)
                channel = root.find("channel")
                if channel is None:
                    return []

                items = channel.findall("item")[:limit]
                for item in items:
                    title_elem = item.find("title")
                    link_elem = item.find("link")
                    desc_elem = item.find("description")

                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else "https://trends.google.com"
                    desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""

                    if title:
                        trends.append({
                            "title": title,
                            "summary": desc or f"Surging breakout search query in Google Trends for {geo.upper()}.",
                            "source_name": "Google Trends Live",
                            "source_url": link,
                            "platform": "google_trends",
                        })
        except Exception as exc:
            logger.warning(f"Failed to fetch Google Trends RSS: {exc}")

        return trends

    @classmethod
    def fetch_reddit_trends(cls, subreddit: str = "TikTokTrends", limit: int = 8) -> list[dict]:
        """
        Fetches trending discussions and consumer behaviors from public Reddit feeds (JSON or RSS).
        No API key required.
        """
        headers = {"User-Agent": "MarketPilot/1.0 (by /u/MarketPilotAI)"}
        trends: list[dict] = []

        # Try JSON feed first
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
            with httpx.Client(timeout=8.0, follow_redirects=True) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    children = data.get("data", {}).get("children", [])
                    for child in children:
                        post = child.get("data", {})
                        if post.get("stickied"):
                            continue

                        title = post.get("title", "").strip()
                        selftext = (post.get("selftext") or "").strip()
                        permalink = post.get("permalink", "")
                        full_url = f"https://reddit.com{permalink}" if permalink else "https://reddit.com"
                        score = post.get("score", 0)

                        if title:
                            trends.append({
                                "title": title,
                                "summary": selftext[:400] if selftext else f"High engagement discussion ({score} upvotes) trending on Reddit r/{subreddit}.",
                                "source_name": f"Reddit r/{subreddit}",
                                "source_url": full_url,
                                "platform": "tiktok" if "tiktok" in subreddit.lower() else "general",
                            })
                    if trends:
                        return trends
        except Exception:
            pass

        # Fallback to Reddit RSS feed
        try:
            rss_url = f"https://www.reddit.com/r/{subreddit}/.rss"
            with httpx.Client(timeout=8.0, follow_redirects=True) as client:
                resp = client.get(rss_url, headers=headers)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.content)
                    # Atom feed entries
                    entries = root.findall("{http://www.w3.org/2005/Atom}entry")[:limit]
                    for entry in entries:
                        title_el = entry.find("{http://www.w3.org/2005/Atom}title")
                        link_el = entry.find("{http://www.w3.org/2005/Atom}link")
                        title = title_el.text.strip() if title_el is not None and title_el.text else ""
                        link = link_el.attrib.get("href", "https://reddit.com") if link_el is not None else "https://reddit.com"
                        if title:
                            trends.append({
                                "title": title,
                                "summary": f"Trending community discussion in r/{subreddit}.",
                                "source_name": f"Reddit r/{subreddit}",
                                "source_url": link,
                                "platform": "tiktok" if "tiktok" in subreddit.lower() else "general",
                            })
        except Exception as exc:
            logger.debug(f"Failed to fetch Reddit RSS for r/{subreddit}: {exc}")

        return trends

    @classmethod
    def synthesize_and_validate(
        cls,
        raw_signals: list[dict],
        category_hint: str | None = None,
    ) -> list[TrendSignalCreateRequest]:
        """
        Uses Google Gemini AI (with deterministic fallback) to structure raw signals
        into validated TrendSignalCreateRequest objects.
        """
        if not raw_signals:
            return []

        # Attempt Gemini AI structured enrichment
        if GeminiService.is_available():
            gemini_results = GeminiService.synthesize_trend_signals(raw_signals, category_hint=category_hint)
            if gemini_results:
                validated_signals: list[TrendSignalCreateRequest] = []
                for item in gemini_results:
                    try:
                        # Ensure valid platform enum
                        plat_str = item.get("platform", "general").lower()
                        try:
                            plat_enum = TrendPlatform(plat_str)
                        except ValueError:
                            plat_enum = TrendPlatform.GENERAL

                        req = TrendSignalCreateRequest(
                            topic=item.get("topic", "Market Trend Signal"),
                            headline=item.get("headline", "Surging consumer momentum detected across digital channels."),
                            summary=item.get("summary", "High engagement trend relevant to modern e-commerce brands."),
                            platform=plat_enum,
                            category=item.get("category", category_hint or "Ecommerce"),
                            target_audience=item.get("target_audience", "Digital consumers and online shoppers."),
                            suggested_angles=item.get("suggested_angles", ["Before vs After transformation", "Problem-Solution hook"]),
                            hashtags=item.get("hashtags", ["#TrendAlert", "#Viral"]),
                            source_name=item.get("source_name", "Web Intelligence"),
                            source_url=item.get("source_url", "https://google.com"),
                            collection_date=date.today(),
                            confidence_score=int(item.get("confidence_score", 85)),
                            is_active=True,
                        )
                        validated_signals.append(req)
                    except Exception as parse_err:
                        logger.debug(f"Skipping malformed Gemini trend signal: {parse_err}")

                if validated_signals:
                    return validated_signals

        # Deterministic fallback enrichment if Gemini is unavailable
        fallback_signals: list[TrendSignalCreateRequest] = []
        for raw in raw_signals:
            try:
                topic = raw.get("title", "Market Trend")[:80].strip()
                summary = (raw.get("summary") or "Grounded market signal captured from live web feeds.")[:500].strip()
                source_name = raw.get("source_name", "Live Discovery Feed")[:100]
                source_url = raw.get("source_url", "https://trends.google.com")
                plat = TrendPlatform.GOOGLE_TRENDS if "google" in raw.get("platform", "") else (
                    TrendPlatform.TIKTOK if "tiktok" in raw.get("platform", "") else TrendPlatform.GENERAL
                )

                cat = category_hint or "Ecommerce"
                angles = [
                    f"Why shoppers are talking about {topic[:30]}",
                    f"How our brand solves {topic[:30]}",
                ]
                tags = ["#MarketTrends", f"#{cat.replace(' ', '')}", "#Viral"]

                req = TrendSignalCreateRequest(
                    topic=topic,
                    headline=f"Surging consumer momentum around '{topic}' in {cat}",
                    summary=summary,
                    platform=plat,
                    category=cat,
                    target_audience="Digital consumers and decision-makers looking for top quality products.",
                    suggested_angles=angles,
                    hashtags=tags,
                    source_name=source_name,
                    source_url=source_url,
                    collection_date=date.today(),
                    confidence_score=88,
                    is_active=True,
                )
                fallback_signals.append(req)
            except Exception as e:
                logger.debug(f"Skipping invalid raw trend: {e}")

        return fallback_signals

    @classmethod
    def ingest_live_trends(
        cls,
        geo: str = "US",
        category_hint: str | None = None,
        subreddits: list[str] | None = None,
        limit_per_source: int = 6,
    ) -> dict[str, Any]:
        """
        Executes end-to-end trend data ingestion:
        1. Fetches from free Google Trends RSS and Reddit feeds
        2. Normalizes & enriches using Google Gemini AI
        3. Deduplicates against existing database signals
        4. Persists new records to Supabase
        """
        raw_trends: list[dict] = []

        # 1. Fetch from Google Trends
        google_trends = cls.fetch_google_trends(geo=geo, limit=limit_per_source)
        raw_trends.extend(google_trends)

        # 2. Fetch from Reddit Communities
        target_subs = subreddits or ["TikTokTrends", "Ecommerce"]
        for sub in target_subs:
            reddit_trends = cls.fetch_reddit_trends(subreddit=sub, limit=limit_per_source)
            raw_trends.extend(reddit_trends)

        if not raw_trends:
            return {"ingested_count": 0, "skipped_count": 0, "signals": []}

        # 3. Enrich & validate
        structured_signals = cls.synthesize_and_validate(raw_trends, category_hint=category_hint)

        # 4. Deduplicate and persist in Supabase
        client = get_service_client()
        ingested: list[TrendSignal] = []
        skipped_count = 0

        # Query existing topics to prevent duplicates
        existing_topics: set[str] = set()
        try:
            existing_res = client.table("trend_signals").select("topic").execute()
            if existing_res and existing_res.data:
                existing_topics = {row["topic"].strip().lower() for row in existing_res.data if row.get("topic")}
        except Exception:
            pass

        for signal_req in structured_signals:
            if signal_req.topic.strip().lower() in existing_topics:
                skipped_count += 1
                continue

            try:
                row_data = signal_req.model_dump(mode="json")
                res = client.table("trend_signals").insert(row_data).execute()
                if res and res.data:
                    created_signal = TrendSignal.model_validate(res.data[0])
                    ingested.append(created_signal)
                    existing_topics.add(signal_req.topic.strip().lower())
            except Exception as insert_err:
                logger.warning(f"Could not persist trend signal '{signal_req.topic}': {insert_err}")
                skipped_count += 1

        return {
            "ingested_count": len(ingested),
            "skipped_count": skipped_count,
            "signals": ingested,
            "model_used": GeminiService.get_model_name() if GeminiService.is_available() else "marketpilot-deterministic-v1",
        }
