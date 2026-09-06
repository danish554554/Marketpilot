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
        target_country: str | None = "Pakistan",
        target_language: str | None = "Urdu",
    ) -> dict[str, str]:
        """
        Uses Google Gemini to generate highly persuasive, channel-tailored marketing copy
        accurately referencing the specific product, its real features, and target pain points.
        For video scripts, voiceover lines are natively localized into the target market's language.
        """
        client = cls.get_client()
        model_name = cls.get_model_name()

        country = target_country or "Pakistan"
        lang = target_language or ("Urdu" if "pakistan" in country.lower() else "English")

        system_instruction = (
            "You are an elite direct-response e-commerce copywriter and viral video scriptwriter. "
            "Write production-ready, highly engaging, conversion-optimized marketing copy. "
            "IMPORTANT: Strictly speak about the specific product given in the prompt, its real features, and the problems it solves. "
            "Do NOT confuse it with unrelated products. "
            f"TARGET MARKET & LANGUAGE CONTEXT: Target Country is {country}, Spoken Language is {lang}. "
            "FOR VIDEO SCRIPTS (TikTok / Reels / Shorts): All spoken Voiceover lines and the opening Hook MUST be written in the target country's natural colloquial language (e.g. for Pakistan, write conversational Spoken Roman Urdu so creators can read it fluently on camera, along with native Urdu script). Visual directions, scene timings, and camera cues remain in English. "
            "Output pure JSON with exactly 4 keys: 'hook', 'caption', 'call_to_action', 'hashtags'."
        )

        user_prompt = (
            f"PRODUCT DETAILS:\n"
            f"- Product Name: {product_name}\n"
            f"- Description: {product_description or 'High-quality e-commerce product'}\n"
            f"- Key Features: {', '.join(product_features) if product_features else 'Premium quality & durable design'}\n"
            f"- Pain Points It Solves: {', '.join(product_pain_points) if product_pain_points else 'Daily consumer friction'}\n\n"
            f"CAMPAIGN GOAL & FORMAT:\n"
            f"- Target Market Country: {country}\n"
            f"- Spoken Local Language: {lang}\n"
            f"- Channel: {channel} (e.g. tiktok, instagram, paid ad, email, whatsapp)\n"
            f"- Format: {format_type}\n"
            f"- Live Trend / Angle: {trend_topic or 'Problem-Solution demonstration'}\n"
            f"- Optional Hook Seed: {hook_idea or 'None'}\n"
            f"- Custom Notes: {custom_instructions or 'Focus on fast benefits and high clarity'}\n\n"
            "INSTRUCTIONS FOR FORMAT:\n"
            f"- If format is 'script' or 'tiktok': Write a complete timestamped short-form video script with [HOOK - 0:00 to 0:03], [DEMO & BENEFIT - 0:03 to 0:10], and [CALL TO ACTION - 0:10 to 0:15]. All Voiceover lines MUST be in {lang} (for Pakistan, write Roman Urdu and Urdu script so the creator speaks natural Urdu on camera). Visual & camera cues remain in English.\n"
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

        if format_type in ("script", "short_video_script") or channel == "tiktok":
            if "pakistan" in country.lower() or "urdu" in lang.lower():
                h = hook_idea or "Peach fuzz ke upar foundation lagana band karein — pehle yeh 30-sec trick dekhein!"
                c = (
                    f"[HOOK - 0:00 to 0:03]\n"
                    f"Visual: Split-screen close-up showing cakey foundation over peach fuzz vs. smooth skin glide.\n"
                    f"Voiceover (Roman Urdu): \"Peach fuzz ke upar foundation lagana band karein! Pehle yeh 30-second ki trick dekhein.\"\n"
                    f"Voiceover (اردو): \"پیچ فز کے اوپر فاؤنڈیشن لگانا بند کریں! پہلے یہ ۳۰ سیکنڈ کی ٹرک دیکھیں۔\"\n\n"
                    f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                    f"Visual: Presenter effortlessly gliding {product_name} across cheek, highlighting {first_feat}.\n"
                    f"Voiceover (Roman Urdu): \"Purane aur naakara tareeqon pe waqt zaya karna chhod dein. Yeh {product_name} sirf chand seconds mein bina dard ke makhan jaisi smooth skin deta hai.\"\n"
                    f"Voiceover (اردو): \"پرانے اور ناکارہ طریقوں پر وقت ضائع کرنا چھوڑ دیں۔ یہ {product_name} صرف چند سیکنڈز میں بنا درد کے مکھن جیسی ہموار جلد دیتا ہے۔\"\n\n"
                    f"[CALL TO ACTION - 0:10 to 0:15]\n"
                    f"Visual: Clean, glowing finished look with {product_name} in hand.\n"
                    f"Voiceover (Roman Urdu): \"Toh bas abhi ready ho jayein! Neeche diye gaye link par click karein aur launch sale mein poora 20% OFF hasil karein!\"\n"
                    f"Voiceover (اردو): \"تو بس ابھی ریڈی ہو جائیں! نیچے دیے گئے لنک پر کلک کریں اور لانچ سیل میں پورا ۲۰٪ رعایت حاصل کریں!\""
                )
                cta = "Neeche link par click karein aur 20% discount hasil karein"
                tags = f"#{product_name.replace(' ', '')} #BeautyHacksPK #SkincareUrdu #ViralFindsPK"
            else:
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

    @classmethod
    def generate_localized_voiceover(
        cls,
        english_script: str,
        target_country: str = "Pakistan",
        target_language: str = "Urdu",
        speaker_style: str = "energetic_conversational",
    ) -> dict:
        """
        Translates and naturally adapts an English marketing script into a native-sounding,
        colloquial voice-over for the target market (e.g. natural Pakistani Urdu for TikTok/Reels).
        Does NOT do a stiff word-for-word translation; sounds like an authentic local creator.
        """
        client = cls.get_client()
        is_pakistan = "pakistan" in target_country.lower() or "urdu" in target_language.lower()

        if client:
            try:
                system_instruction = (
                    f"You are an award-winning bilingual commercial voiceover director and direct-response copywriter specialized in {target_country} e-commerce markets.\n"
                    f"You adapt English promotional and educational scripts into natural, high-converting spoken voice-overs in {target_language}.\n\n"
                    "CRITICAL RULES:\n"
                    "1. DO NOT produce literal, robotic machine translations.\n"
                    "2. Use natural, conversational colloquial phrasing that native speakers actually use on TikTok, Instagram Reels, and YouTube Shorts.\n"
                    f"{'3. For Pakistan/Urdu: Provide the authentic Urdu script AND a clear Roman Urdu version (English letters) so creators can read and record with ease.' if is_pakistan else ''}\n"
                    "4. Maintain the emotional hooks, dynamic pacing, and compelling call to action.\n"
                    "5. Output strictly a single valid JSON object."
                )

                prompt = (
                    f"Target Country: {target_country}\n"
                    f"Target Voice-Over Language: {target_language}\n"
                    f"Delivery Style: {speaker_style}\n\n"
                    f"Original English Video Script:\n\"\"\"\n{english_script}\n\"\"\"\n\n"
                    "Produce a JSON response with the following exact keys:\n"
                    "{\n"
                    f'  "target_country": "{target_country}",\n'
                    f'  "target_language": "{target_language}",\n'
                    '  "localized_voiceover_script": "<Voiceover in native script/language>",\n'
                    '  "phonetic_or_roman_script": "<Roman Urdu or phonetic pronunciation guide>",\n'
                    '  "cultural_notes": "<Brief note explaining why this phrasing resonates with the local market>",\n'
                    '  "suggested_audio_pacing": "energetic 130 WPM with punchy 3-second hook",\n'
                    '  "word_count": <integer>,\n'
                    '  "estimated_duration_seconds": <integer>\n'
                    "}"
                )

                from google.genai import types
                response = client.models.generate_content(
                    model=cls.get_model_name(),
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        response_mime_type="application/json",
                    ),
                )
                if response.text:
                    parsed = json.loads(response.text.strip())
                    return {
                        "target_country": parsed.get("target_country", target_country),
                        "target_language": parsed.get("target_language", target_language),
                        "localized_voiceover_script": parsed.get("localized_voiceover_script", ""),
                        "phonetic_or_roman_script": parsed.get("phonetic_or_roman_script", ""),
                        "cultural_notes": parsed.get("cultural_notes", f"Tailored specifically for {target_country} social audience."),
                        "suggested_audio_pacing": parsed.get("suggested_audio_pacing", "dynamic 30-second pacing"),
                        "word_count": int(parsed.get("word_count", 65)),
                        "estimated_duration_seconds": int(parsed.get("estimated_duration_seconds", 25)),
                    }
            except Exception as exc:
                logger.warning(f"Gemini voice-over generation failed: {exc}. Falling back to deterministic localization.")

        # Deterministic High-Quality Fallback for Pakistan / Urdu
        if is_pakistan:
            urdu_native = (
                "کیا آپ بھی روزانہ کے بے مقصد جھنجھٹ سے پریشان ہیں؟\n"
                "اب وقت ہے ایک سمارٹ حل کا! پیش ہے ہمارا نیا ہیرو پروڈکٹ جو آپ کے وقت اور پیسے دونوں کی بچت کرتا ہے۔\n"
                "صرف چند سیکنڈز میں بہترین نتائج، بغیر کسی پریشانی کے۔\n"
                "ابھی نیچے دیے گئے لنک پر کلک کریں اور حاصل کریں کیش آن ڈلیوری کی سہولت کے ساتھ خصوصی ڈسکاؤنٹ!"
            )
            roman_urdu = (
                "Kya aap bhi rozana ke is jhanjhat se tang aa chuke hain?\n"
                "Ab waqt hai ek smart hal ka! Pesh hai hamara naya hero product jo aapka time aur paisa dono bachata hai.\n"
                "Sirf chand seconds mein behtareen results, bina kisi tension ke.\n"
                "Abhi neeche diye gaye link par click karein aur Cash on Delivery ke sath exclusive discount hasil karein!"
            )
            cultural = "Uses familiar Pakistani e-commerce triggers: Cash on Delivery (COD) assurance, time/money savings, and direct conversational tone."
        else:
            urdu_native = f"Looking for the best way to elevate your routine? Check out this essential solution that saves time and delivers flawless results every single day. Order yours now while stock lasts!"
            roman_urdu = None
            cultural = f"Adapted for {target_country} online consumers."

        words = len((roman_urdu or urdu_native).split())
        est_sec = max(15, int(words / 2.4))

        return {
            "target_country": target_country,
            "target_language": target_language,
            "localized_voiceover_script": urdu_native,
            "phonetic_or_roman_script": roman_urdu,
            "cultural_notes": cultural,
            "suggested_audio_pacing": "Energetic commercial pace (approx 135 WPM)",
            "word_count": words,
            "estimated_duration_seconds": est_sec,
        }

