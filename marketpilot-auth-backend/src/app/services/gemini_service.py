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

    @classmethod
    def synthesize_trend_signals(
        cls,
        raw_signals: list[dict],
        category_hint: str | None = None,
    ) -> list[dict] | None:
        """
        Takes raw scraped/RSS trends (titles, summaries, URLs) and uses Google Gemini
        to synthesize them into verified, structured TrendSignal records with confidence
        scores, suggested marketing angles, target audience, and hashtags.
        """
        client = cls.get_client()
        if not client:
            return None

        model_name = cls.get_model_name()
        system_instruction = (
            "You are MarketPilot Trend Intelligence Engine. "
            "Analyze the provided raw viral/market trend signals. "
            "For each raw signal, normalize and enrich it with:\n"
            "1. topic: concise 3-7 word catchy trend title.\n"
            "2. headline: 1-sentence executive summary of the consumer/market behavior.\n"
            "3. summary: 2-3 sentence explanation of why this trend is moving and how brands can leverage it.\n"
            "4. platform: 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'x' | 'youtube' | 'google_trends' | 'general'\n"
            "5. category: specific e-commerce category (e.g. 'Beauty', 'Fashion', 'Tech', 'Ecommerce', 'Health', 'Home', 'Retail').\n"
            "6. target_audience: description of the primary consumer demographic.\n"
            "7. suggested_angles: array of 2-3 actionable marketing/content hook angles.\n"
            "8. hashtags: array of 2-5 relevant hashtags starting with #.\n"
            "9. confidence_score: integer between 70 and 99 representing trend virality/confidence.\n"
            "10. source_name: original source name.\n"
            "11. source_url: original source URL or verified fallback URL.\n"
            "Output pure JSON array."
        )

        user_prompt = (
            f"Category Focus: {category_hint or 'E-commerce & Retail'}\n"
            f"Raw Ingested Signals:\n{json.dumps(raw_signals, indent=2)}\n\n"
            "Generate JSON array matching schema:\n"
            "[\n"
            "  {\n"
            "    \"topic\": \"string\",\n"
            "    \"headline\": \"string\",\n"
            "    \"summary\": \"string\",\n"
            "    \"platform\": \"tiktok | instagram | google_trends | general\",\n"
            "    \"category\": \"string\",\n"
            "    \"target_audience\": \"string\",\n"
            "    \"suggested_angles\": [\"string\", \"string\"],\n"
            "    \"hashtags\": [\"#trend1\", \"#trend2\"],\n"
            "    \"confidence_score\": 85,\n"
            "    \"source_name\": \"string\",\n"
            "    \"source_url\": \"https://...\"\n"
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
                    temperature=0.4,
                ),
            )

            if not response or not response.text:
                return None

            data = json.loads(response.text)
            if isinstance(data, list) and len(data) > 0:
                return data
            return None
        except Exception as exc:
            logger.warning(f"Gemini trend synthesis error: {exc}")
            return None

    @classmethod
    def generate_content_copy(
        cls,
        product_name: str,
        product_description: str | None,
        product_features: list[str],
        product_pain_points: list[str],
        channel: str,
        format_type: str,
        trend_topic: str | None = None,
        hook_idea: str | None = None,
        custom_instructions: str | None = None,
    ) -> dict[str, str]:
        """
        Uses Google Gemini to generate highly persuasive, channel-tailored marketing copy
        accurately referencing the specific product, its real features, and target pain points.
        """
        client = cls.get_client()
        model_name = cls.get_model_name()

        system_instruction = (
            "You are an elite direct-response e-commerce copywriter and viral video scriptwriter. "
            "Write production-ready, highly engaging, conversion-optimized marketing copy. "
            "IMPORTANT: Strictly speak about the specific product given in the prompt, its real features, and the problems it solves. "
            "Do NOT confuse it with unrelated products. "
            "Output pure JSON with exactly 4 keys: 'hook', 'caption', 'call_to_action', 'hashtags'."
        )

        user_prompt = (
            f"PRODUCT DETAILS:\n"
            f"- Product Name: {product_name}\n"
            f"- Description: {product_description or 'High-quality e-commerce product'}\n"
            f"- Key Features: {', '.join(product_features) if product_features else 'Premium quality & durable design'}\n"
            f"- Pain Points It Solves: {', '.join(product_pain_points) if product_pain_points else 'Daily consumer friction'}\n\n"
            f"CAMPAIGN GOAL & FORMAT:\n"
            f"- Channel: {channel} (e.g. tiktok, instagram, paid ad, email, whatsapp)\n"
            f"- Format: {format_type}\n"
            f"- Live Trend / Angle: {trend_topic or 'Problem-Solution demonstration'}\n"
            f"- Optional Hook Seed: {hook_idea or 'None'}\n"
            f"- Custom Notes: {custom_instructions or 'Focus on fast benefits and high clarity'}\n\n"
            "INSTRUCTIONS FOR FORMAT:\n"
            "- If format is 'script' or 'tiktok': Write a complete timestamped short-form video script with [HOOK - 0:00 to 0:03], [DEMO & BENEFIT - 0:03 to 0:10], and [CALL TO ACTION - 0:10 to 0:15] with visual & voiceover cues.\n"
            "- If format is 'organic' or 'instagram': Write an educational carousel/reel caption highlighting why traditional alternatives fail and how this product solves it, with clean bullet points and engagement question.\n"
            "- If format is 'paid': Write a high-urgency direct-response ad copy with strong hook, comparison against costly alternatives, risk-reversal guarantee, and compelling discount CTA.\n"
            "- If format is 'email': Write a complete newsletter with Subject Line, story-driven intro, product benefits, and clear CTA button text.\n"
            "- If format is 'whatsapp': Write a friendly, conversational 1-click VIP restock / flash sale broadcast message.\n\n"
            "Return JSON matching:\n"
            "{\n"
            "  \"hook\": \"string\",\n"
            "  \"caption\": \"string\",\n"
            "  \"call_to_action\": \"string\",\n"
            "  \"hashtags\": \"#Hashtag1 #Hashtag2 ...\"\n"
            "}"
        )

        if client:
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
                if response and response.text:
                    parsed = json.loads(response.text)
                    if isinstance(parsed, dict) and "hook" in parsed and "caption" in parsed:
                        return {
                            "hook": parsed.get("hook", ""),
                            "caption": parsed.get("caption", ""),
                            "call_to_action": parsed.get("call_to_action", "Shop now"),
                            "hashtags": parsed.get("hashtags", ""),
                        }
            except Exception as exc:
                logger.warning(f"Gemini copy generation API error: {exc}")

        # Intelligent Product-Aware Fallback
        first_feat = product_features[0] if product_features else "innovative design"
        first_pain = product_pain_points[0] if product_pain_points else "daily frustration"

        if format_type == "script" or channel == "tiktok":
            h = hook_idea or f"Still struggling with {first_pain}? Stop and watch this."
            c = (
                f"[HOOK - 0:00 to 0:03]\n"
                f"Visual: Close-up demonstrating the daily problem with {first_pain}.\n"
                f"Voiceover: \"{h}\"\n\n"
                f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                f"Visual: Presenter using {product_name} showcasing {first_feat}.\n"
                f"Voiceover: \"The {product_name} fixes this in seconds. Built with {first_feat} so you get effortless results every time.\"\n\n"
                f"[CALL TO ACTION - 0:10 to 0:15]\n"
                f"Visual: Finished result with product box in hand.\n"
                f"Voiceover: \"Tap the link below to get yours with special launch pricing before stock runs out!\""
            )
            cta = "Tap link in bio to get 20% off"
            tags = f"#{product_name.replace(' ', '')} #ViralFinds #ProblemSolved #LifeHacks"
        elif format_type == "paid":
            h = f"Why struggle with {first_pain} when you can have this?"
            c = (
                f"If you're tired of dealing with {first_pain}, it's time for an upgrade.\n\n"
                f"Meet the **{product_name}**:\n"
                + "\n".join([f"✨ {f}" for f in product_features[:4]])
                + f"\n\n✅ 30-Day Money Back Guarantee\n✅ Fast Tracked Shipping\n\nClick below to claim your exclusive discount today!"
            )
            cta = "Shop Now & Claim Discount"
            tags = "#SpecialOffer #MustHave #TrendingProduct"
        elif format_type == "email":
            h = f"Subject: The smarter way to handle {first_pain} ✨"
            c = (
                f"Hi there,\n\n"
                f"If {first_pain} has been slowing you down, we have great news.\n\n"
                f"We created the **{product_name}** specifically to make your daily routine effortless.\n\n"
                f"Key Highlights:\n"
                + "\n".join([f"• **{f}**" for f in product_features[:3]])
                + f"\n\nClick below to order yours and take advantage of our limited-time offer:"
            )
            cta = "Explore the Collection & Save"
            tags = ""
        elif format_type == "whatsapp":
            h = f"✨ VIP Update: {product_name} is in stock!"
            c = (
                f"Hi! Quick update on the **{product_name}**.\n\n"
                f"Due to high demand, we just restocked our latest batch featuring {first_feat}.\n\n"
                f"Reply to this message with **ORDER** to reserve yours with free priority shipping!"
            )
            cta = "Order via WhatsApp"
            tags = ""
        else:  # organic / instagram
            h = f"The 3-step routine change for {first_pain}."
            c = (
                f"Most people think dealing with {first_pain} is just unavoidable.\n\n"
                f"Here is what actually works: Introducing the {product_name}.\n\n"
                + "\n".join([f"🔹 {f}" for f in product_features[:4]])
                + f"\n\nSave this post for later or share with a friend who needs this!"
            )
            cta = "Drop a 💬 below for the direct link"
            tags = f"#{product_name.replace(' ', '')} #RoutineUpgrade #ProductDiscovery"

        return {
            "hook": h,
            "caption": c,
            "call_to_action": cta,
            "hashtags": tags,
        }

