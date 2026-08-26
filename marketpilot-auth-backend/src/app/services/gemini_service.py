import json
import logging
from typing import Any
from uuid import UUID, uuid4

from app.config import get_settings
from app.schemas import (
    CampaignChannel,
    CampaignPillarResponse,
    MarketingObjective,
    OrchestrationGenerateRequest,
    PlannerProduct,
    RecommendationRationale,
    StrategicRecommendation,
    StructuredContext,
    TrendSignal,
)

logger = logging.getLogger("marketpilot.gemini")


class GeminiService:
    """
    Google Gemini AI Service integrating the official google-genai SDK.
    Provides structured AI generation with robust error handling and fallback mechanisms.
    """

    @classmethod
    def get_client(cls) -> Any:
        """
        Instantiates and returns the Google GenAI Client if API key is configured.
        """
        settings = get_settings()
        api_key = settings.gemini_api_key
        if not api_key or not api_key.strip():
            return None

        try:
            from google import genai
            return genai.Client(api_key=api_key.strip())
        except Exception as exc:
            logger.warning(f"Failed to initialize Google GenAI client: {exc}")
            return None

    @classmethod
    def is_available(cls) -> bool:
        """
        Returns True if Gemini API key is configured and client can be initialized.
        """
        settings = get_settings()
        return bool(settings.gemini_api_key and settings.gemini_api_key.strip())

    @classmethod
    def get_model_name(cls) -> str:
        settings = get_settings()
        return settings.gemini_model or "gemini-2.5-flash"

    @classmethod
    def generate_recommendations(
        cls,
        context: StructuredContext,
        request: OrchestrationGenerateRequest,
        system_instruction: str,
        user_prompt_str: str,
    ) -> list[StrategicRecommendation] | None:
        """
        Calls Google Gemini API with system instructions and grounded prompt to generate
        rich, creative, margin-aware marketing recommendations conforming to StrategicRecommendation schema.
        Returns None if Gemini is unavailable or errors out, prompting fallback.
        """
        client = cls.get_client()
        if not client:
            return None

        model_name = cls.get_model_name()

        json_schema_prompt = (
            f"{user_prompt_str}\n\n"
            "Generate an array of 2 to 4 structured marketing recommendations in pure JSON format conforming to this schema:\n"
            "[\n"
            "  {\n"
            "    \"headline\": \"string\",\n"
            "    \"angle\": \"string\",\n"
            "    \"target_audience\": \"string\",\n"
            "    \"product_id\": \"UUID string of in-stock product or null\",\n"
            "    \"product_name\": \"exact product name or null\",\n"
            "    \"offer_id\": \"UUID string or null\",\n"
            "    \"offer_title\": \"offer title or null\",\n"
            "    \"trend_signal_id\": \"UUID string or null\",\n"
            "    \"trend_topic\": \"trend topic or null\",\n"
            "    \"platform\": \"instagram | tiktok | facebook | linkedin | email | whatsapp\",\n"
            "    \"channel_type\": \"organic | paid\",\n"
            "    \"objective\": \"increase_product_awareness | drive_sales | boost_engagement | customer_retention | clearance_velocity\",\n"
            "    \"call_to_action\": \"string\",\n"
            "    \"content_format\": \"post_caption | carousel_slides | short_video_script | email_newsletter | direct_message\",\n"
            "    \"content_body\": \"rich, ready-to-publish creative copy\",\n"
            "    \"rationale\": {\n"
            "      \"margin_justification\": \"string explaining margin advantage\",\n"
            "      \"inventory_justification\": \"string explaining stock buffer\",\n"
            "      \"budget_justification\": \"string or null\",\n"
            "      \"trend_justification\": \"string or null\",\n"
            "      \"overall_rationale\": \"summary of why this recommendation wins\"\n"
            "    }\n"
            "  }\n"
            "]"
        )

        try:
            from google.genai import types

            response = client.models.generate_content(
                model=model_name,
                contents=json_schema_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

            if not response or not response.text:
                return None

            raw_json = json.loads(response.text)
            if not isinstance(raw_json, list):
                if isinstance(raw_json, dict) and "recommendations" in raw_json:
                    raw_json = raw_json["recommendations"]
                else:
                    return None

            recs: list[StrategicRecommendation] = []
            for item in raw_json:
                rec_id = uuid4()
                prod_id = UUID(item["product_id"]) if item.get("product_id") else None
                offer_id = UUID(item["offer_id"]) if item.get("offer_id") else None
                trend_id = UUID(item["trend_signal_id"]) if item.get("trend_signal_id") else None

                objective_str = item.get("objective", "increase_product_awareness")
                try:
                    objective = MarketingObjective(objective_str)
                except ValueError:
                    objective = MarketingObjective.INCREASE_PRODUCT_AWARENESS

                rat_dict = item.get("rationale") or {}
                rationale = RecommendationRationale(
                    margin_justification=rat_dict.get("margin_justification"),
                    inventory_justification=rat_dict.get("inventory_justification"),
                    budget_justification=rat_dict.get("budget_justification"),
                    trend_justification=rat_dict.get("trend_justification"),
                    overall_rationale=rat_dict.get("overall_rationale", "Grounded recommendation generated by Gemini AI."),
                )

                rec = StrategicRecommendation(
                    id=rec_id,
                    headline=item.get("headline", "AI Campaign Strategy"),
                    angle=item.get("angle", "Grounded strategic angle"),
                    target_audience=item.get("target_audience", "Target market segment"),
                    product_id=prod_id,
                    product_name=item.get("product_name"),
                    offer_id=offer_id,
                    offer_title=item.get("offer_title"),
                    trend_signal_id=trend_id,
                    trend_topic=item.get("trend_topic"),
                    platform=item.get("platform", "instagram"),
                    channel_type=item.get("channel_type", "organic"),
                    objective=objective,
                    call_to_action=item.get("call_to_action", context.approved_ctas[0] if context.approved_ctas else "Shop now"),
                    content_format=item.get("content_format", "post_caption"),
                    content_body=item.get("content_body", ""),
                    rationale=rationale,
                    guardrail_flags=[],
                )
                recs.append(rec)

            return recs if recs else None

        except Exception as exc:
            logger.warning(f"Gemini generation error: {exc}. Falling back to deterministic engine.")
            return None

    @classmethod
    def generate_strategy_pillars(
        cls,
        context: StructuredContext,
        timeframe: str,
        primary_goal: str,
        hero_product: PlannerProduct | None,
        trends: list[TrendSignal],
    ) -> list[dict[str, Any]] | None:
        """
        Generates 4 nuanced, creative campaign pillars using Gemini AI.
        """
        client = cls.get_client()
        if not client:
            return None

        model_name = cls.get_model_name()

        system_instruction = (
            "You are MarketPilot AI, an elite marketing strategy director. "
            "Formulate 4 distinct campaign pillars for a high-performing e-commerce brand based strictly on product data, margins, and brand voice. "
            "Pillar 1: Hero Education / Organic Demonstration.\n"
            "Pillar 2: Direct-Response Paid Acquisition.\n"
            "Pillar 3: Trend Velocity / Viral Social Proof.\n"
            "Pillar 4: VIP Retention / Lifetime Value.\n"
            "Output pure JSON array of 4 objects."
        )

        prompt_data = {
            "business_name": context.business_name,
            "brand_voice": context.brand_voice,
            "prohibited_words": context.prohibited_words,
            "approved_ctas": context.approved_ctas,
            "timeframe": timeframe,
            "primary_goal": primary_goal,
            "hero_product": {
                "name": hero_product.name if hero_product else "Hero Catalogue Item",
                "price": str(hero_product.price) if hero_product else "40.00",
                "profit_margin": str(hero_product.profit_margin) if hero_product else "70.0",
                "features": hero_product.features if hero_product else [],
                "pain_points": hero_product.pain_points if hero_product else [],
            } if hero_product else None,
            "trends": [
                {"topic": t.topic, "headline": t.headline, "platform": t.platform.value}
                for t in trends[:3]
            ],
        }

        user_prompt = (
            f"{json.dumps(prompt_data, indent=2)}\n\n"
            "Generate JSON array with schema:\n"
            "[\n"
            "  {\n"
            "    \"pillar_name\": \"string\",\n"
            "    \"objective\": \"string\",\n"
            "    \"channel_type\": \"organic | paid\",\n"
            "    \"platform\": \"tiktok | instagram | facebook | email\",\n"
            "    \"product_name\": \"string\",\n"
            "    \"creative_angle\": \"string\",\n"
            "    \"hook_ideas\": [\"string\", \"string\"],\n"
            "    \"suggested_ctas\": [\"string\"],\n"
            "    \"content_formats\": [\"string\"],\n"
            "    \"estimated_effort\": \"low | medium | high\",\n"
            "    \"rationale\": \"string\"\n"
            "  }\n"
            "]"
        )

        try:
            from google.genai import types

            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

            if not response or not response.text:
                return None

            raw_json = json.loads(response.text)
            if isinstance(raw_json, list) and len(raw_json) >= 4:
                return raw_json
            return None
        except Exception as exc:
            logger.warning(f"Gemini strategy generation error: {exc}")
            return None
