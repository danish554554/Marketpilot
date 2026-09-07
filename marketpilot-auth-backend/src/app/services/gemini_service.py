import json
import logging
import random
import re
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
        return settings.gemini_model or "gemini-3.6-flash"

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
    def _synthesize_grounded_copy(
        cls,
        product_name: str,
        product_description: str | None = None,
        product_features: list[str] | None = None,
        product_pain_points: list[str] | None = None,
        channel: str = "tiktok",
        format_type: str = "script",
        trend_topic: str | None = None,
        hook_idea: str | None = None,
        custom_instructions: str | None = None,
        target_country: str | None = "Pakistan",
        target_language: str | None = "Urdu",
        variation_seed: int = 0,
    ) -> dict[str, str]:
        country = target_country or "Pakistan"
        lang = target_language or ("Urdu" if "pakistan" in country.lower() else "English")
        is_urdu = "pakistan" in country.lower() or "urdu" in lang.lower()

        features = product_features or []
        pains = product_pain_points or []
        feat_1 = features[0] if len(features) > 0 else "high-performance quality"
        feat_2 = features[1] if len(features) > 1 else "effortless daily results"
        pain_1 = pains[0] if len(pains) > 0 else "daily hassle"
        pain_2 = pains[1] if len(pains) > 1 else "wasting time on ineffective alternatives"

        offer = "20% OFF Launch Discount"
        if custom_instructions:
            m = re.search(r"Offer/Promotion:\s*([^.]+)", custom_instructions)
            if m:
                offer = m.group(1).strip()

        name_lower = product_name.lower()
        if any(k in name_lower for k in ["hair", "dryer", "brush", "curler", "straightener", "shampoo", "blowout"]):
            category = "hair"
        elif any(k in name_lower for k in ["skin", "serum", "cream", "face", "glow", "acne", "cleanser", "lotion", "fuzz", "derma", "moisturizer"]):
            category = "skincare"
        elif any(k in name_lower for k in ["earbud", "headphone", "watch", "charger", "speaker", "cable", "tech", "smart", "phone", "gadget", "power"]):
            category = "electronics"
        elif any(k in name_lower for k in ["shoe", "sneaker", "heel", "wallet", "bag", "backpack", "jacket", "shirt", "dress", "watch", "leather", "belt"]):
            category = "fashion"
        elif any(k in name_lower for k in ["kitchen", "knife", "chopper", "blender", "bottle", "cleaner", "mop", "lamp", "organizer", "cook"]):
            category = "home"
        else:
            category = "general"

        angle = variation_seed % 4

        if format_type in ("script", "short_video_script") or channel == "tiktok":
            if is_urdu:
                if category == "hair":
                    angles = [
                        (
                            f"Frizzy aur unmanageable baalon se tang aa chuke hain? Pehle yeh 30-second hack dekhein!",
                            f"[HOOK - 0:00 to 0:03]\n"
                            f"Visual: Close-up showing damp, frizzy tangled hair vs. smooth salon blowout transition.\n"
                            f"Voiceover (Roman Urdu): \"Har subah baalon ko dry aur style karne mein ghanton zaya karna chhod dein! Pehle yeh 30-second trick dekhein.\"\n"
                            f"Voiceover (اردو): \"ہر صبح بالوں کو ڈرائی اور اسٹائل کرنے میں گھنٹوں ضائع کرنا چھوڑ دیں! پہلے یہ ۳۰ سیکنڈ ہیک دیکھیں۔\"\n\n"
                            f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                            f"Visual: Presenter effortlessly gliding {product_name} through hair, showing instant shine and volume ({feat_1}).\n"
                            f"Voiceover (Roman Urdu): \"Purane bhari dryers aur multiple brushes ka jhanjhat khatam! Yeh {product_name} baalon ko sukhata bhi hai aur {feat_1} ke sath salon jaisa volumized blowout deta hai sirf chand minutes mein bina kisi heat damage ke!\"\n"
                            f"Voiceover (اردو): \"پرانے بھاری ڈرائرز کا جھنجھٹ ختم! یہ {product_name} بالوں کو سکھاتا بھی ہے اور سیلون جیسا باؤنسی بلو آؤٹ دیتا ہے بغیر کسی نقصان کے!\"\n\n"
                            f"[CALL TO ACTION - 0:10 to 0:15]\n"
                            f"Visual: Smiling presenter showing silky, styled hair holding {product_name}.\n"
                            f"Voiceover (Roman Urdu): \"Salon ke hazaron rupay bachayein! Neeche diye gaye link par click karein aur launch sale mein poora {offer} hasil karein!\"\n"
                            f"Voiceover (اردو): \"سیلون کے ہزاروں روپے بچائیں! نیچے دیے گئے لنک پر کلک کریں اور لانچ سیل میں پورا {offer} حاصل کریں!\"",
                            f"Neeche diye gaye link par click karein aur {offer} hasil karein",
                            f"#{product_name.replace(' ', '')} #HairHacksPK #SalonAtHome #HairStylingUrdu #BeautyPK"
                        ),
                        (
                            f"Salon ke mehnge blowouts par paise zaya karna band karein!",
                            f"[HOOK - 0:00 to 0:03]\n"
                            f"Visual: Split-screen comparing expensive salon receipt vs. doing it at home with {product_name}.\n"
                            f"Voiceover (Roman Urdu): \"Kiya aap bhi har event ke liye salon ke hazaron rupay kharch karte hain? Yeh video aapke bohot paise bachane wali hai!\"\n"
                            f"Voiceover (اردو): \"کیا آپ بھی ہر ایونٹ کے لیے سیلون کے ہزاروں روپے خرچ کرتے ہیں؟ یہ ویڈیو آپ کے بہت پیسے بچانے والی ہے!\"\n\n"
                            f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                            f"Visual: Demonstrating {feat_2} on damp hair, instantly creating smooth silky finish.\n"
                            f"Voiceover (Roman Urdu): \"Is {product_name} ka advanced airflow aur {feat_1} frizzy baalon ko instantly tame karta hai aur deta hai super smooth finish bina kisi salon appointment ke.\"\n"
                            f"Voiceover (اردو): \"اس {product_name} کا جدید ایئر فلو الجھے بالوں کو فوری چمکدار بناتا ہے اور دیتا ہے سیلون جیسی فنشنگ۔\"\n\n"
                            f"[CALL TO ACTION - 0:10 to 0:15]\n"
                            f"Visual: Final gorgeous hair flip holding {product_name} box with Cash on Delivery banner.\n"
                            f"Voiceover (Roman Urdu): \"Stock limited hai! Abhi order karein aur Cash on Delivery ke sath {offer} hasil karein!\"\n"
                            f"Voiceover (اردو): \"اسٹاک محدود ہے! ابھی آرڈر کریں اور کیش آن ڈلیوری کے ساتھ خصوصی رعایت حاصل کریں!\"",
                            f"Order Now with Cash on Delivery & Claim {offer}",
                            f"#{product_name.replace(' ', '')} #BlowoutHacks #PakistaniBeauties #TrendingPK #GlowHair"
                        ),
                        (
                            f"The 1-step styling secret TikTok doesn't want you to miss!",
                            f"[HOOK - 0:00 to 0:03]\n"
                            f"Visual: Fast-paced side-by-side: half head styled in 2 minutes vs messy half.\n"
                            f"Voiceover (Roman Urdu): \"Agar aapke paas subah tayyar hone ke liye sirf 5 minute hotay hain, toh yeh device aapki life badal dega!\"\n"
                            f"Voiceover (اردو): \"اگر آپ کے پاس صبح تیار ہونے کے لیے صرف ۵ منٹ ہوتے ہیں تو یہ ڈیوائس آپ کی زندگی بدل دے گا!\"\n\n"
                            f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                            f"Visual: Rotating close-up of {product_name} styling damp curls into sleek waves effortlessly.\n"
                            f"Voiceover (Roman Urdu): \"Yeh ek hi waqt mein sukhata bhi hai aur professional style bhi karta hai. {feat_1} ke sath baal rehte hain bilkul soft aur shiny.\"\n"
                            f"Voiceover (اردو): \"یہ ایک ہی وقت میں سکھاتا بھی ہے اور پروفیشنل اسٹائل بھی کرتا ہے، بغیر وقت ضائع کیے۔\"\n\n"
                            f"[CALL TO ACTION - 0:10 to 0:15]\n"
                            f"Visual: Presenter flashing big smile with product in hand.\n"
                            f"Voiceover (Roman Urdu): \"Toh der kis baat ki? Bio mein diye gaye link se abhi order karein aur flat {offer} hasil karein!\"\n"
                            f"Voiceover (اردو): \"تو دیر کس بات کی؟ بائیو میں دیے گئے لنک سے ابھی آرڈر کریں اور خصوصی ڈسکاؤنٹ پائیں۔\"",
                            f"Bio link par click karein aur {offer} hasil karein",
                            f"#{product_name.replace(' ', '')} #ViralGadgetsPK #HairCareRoutine #PakistanTrends"
                        ),
                        (
                            f"Kharab aur damaged baalon ka sabse aasan aur safe solution!",
                            f"[HOOK - 0:00 to 0:03]\n"
                            f"Visual: Shocked face pointing at burning flat iron vs. gentle styling with {product_name}.\n"
                            f"Voiceover (Roman Urdu): \"High heat se baal jalana band karein! Yeh smart device dekhein jo heat damage ke baghair kaam karta hai.\"\n"
                            f"Voiceover (اردو): \"زیادہ گرمی سے بال جلانا بند کریں! یہ اسمارٹ ڈیوائس دیکھیں جو بالوں کو خراب کیے بغیر اسٹائل کرتا ہے۔\"\n\n"
                            f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                            f"Visual: Smooth brush strokes gliding down showing heat-control technology and {feat_2}.\n"
                            f"Voiceover (Roman Urdu): \"Iska intelligent heat distribution system aur {feat_1} aapke baalon ki natural moisture ko lock karta hai.\"\n"
                            f"Voiceover (اردو): \"اس کا جدید سسٹم بالوں کی قدرتی چمک کو برقرار رکھتا ہے اور دیتا ہے شاندار لک۔\"\n\n"
                            f"[CALL TO ACTION - 0:10 to 0:15]\n"
                            f"Visual: Gorgeous final look with verified customer review popup.\n"
                            f"Voiceover (Roman Urdu): \"Launch sale sirf is hafte ke liye hai! Abhi shop karein aur Cash on Delivery pay karein!\"\n"
                            f"Voiceover (اردو): \"لانچ سیل صرف اس ہفتے کے لیے ہے! ابھی شاپ کریں اور ڈسکاؤنٹ حاصل کریں۔\"",
                            f"Shop Now with COD & Claim {offer}",
                            f"#{product_name.replace(' ', '')} #HealthyHairPK #StyleHacks #MustHave"
                        ),
                    ]
                elif category == "skincare":
                    angles = [
                        (
                            f"Dull aur dehydrated skin se pareshan hain? Watch this 10-second glow hack!",
                            f"[HOOK - 0:00 to 0:03]\nVisual: Split-screen close-up of tired skin vs. glowing dewy skin.\nVoiceover (Roman Urdu): \"Mehnge treatments par paise zaya karna band karein! Pehle yeh natural skin routine dekhein.\"\nVoiceover (اردو): \"مہنگے ٹریٹمنٹس پر پیسے ضائع کرنا بند کریں! پہلے یہ قدرتی اسکن روٹین دیکھیں۔\"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Dropper applying {product_name} onto cheek and gently massaging, absorbing instantly.\nVoiceover (Roman Urdu): \"Yeh {product_name} {feat_1} ke sath skin ko deeply hydrate aur brighten karta hai bina kisi chipchipahat ke.\"\nVoiceover (اردو): \"یہ {product_name} جلد کو گہرائی سے ہائیڈریٹ اور روشن بناتا ہے بغیر کسی چپچپاہٹ کے۔\"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Glowing finished look with product bottle in hand.\nVoiceover (Roman Urdu): \"Apni skin ko de glow! Abhi link par click karein aur launch sale mein poora {offer} hasil karein!\"\nVoiceover (اردو): \"اپنی جلد کو دیں چمک! ابھی لنک پر کلک کریں اور خصوصی رعایت حاصل کریں!\"",
                            f"Order Now & Claim {offer}",
                            f"#{product_name.replace(' ', '')} #SkincareUrdu #GlowRoutine #BeautyHacksPK"
                        ),
                        (
                            f"Dark spots aur blemishes ka sabse fast aur effective solution!",
                            f"[HOOK - 0:00 to 0:03]\nVisual: Mirror reflection showing confidence with clear glowing skin.\nVoiceover (Roman Urdu): \"Agar aapki skin bhi dull lagti hai, toh yeh formula aapke liye game-changer hai!\"\nVoiceover (اردو): \"اگر آپ کی جلد بھی بے رونق لگتی ہے تو یہ فارمولا آپ کے لیے گیم چینجر ہے!\"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Clean application showing {feat_1} and lightweight texture.\nVoiceover (Roman Urdu): \"Sirf chand dino mein visible farq dekhein! Yeh skin barrier ko repair karta hai aur natural radiance wapas lata hai.\"\nVoiceover (اردو): \"صرف چند دنوں میں واضح فرق دیکھیں! یہ جلد کو تروتازہ بناتا ہے۔\"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Bottle display with Cash on Delivery banner.\nVoiceover (Roman Urdu): \"Limited stock! Neeche diye gaye link par click karein aur Cash on Delivery ke sath order karein!\"\nVoiceover (اردو): \"محدود اسٹاک! ابھی نیچے دیے گئے لنک سے آرڈر کریں اور خصوصی ڈسکاؤنٹ پائیں!\"",
                            f"Shop Now with Cash on Delivery & {offer}",
                            f"#{product_name.replace(' ', '')} #ClearSkinPK #DailySkincare #TrendingBeauty"
                        ),
                    ]
                elif category == "electronics":
                    angles = [
                        (
                            f"Kharab battery aur tangled wires se tang aa chuke hain? Upgrade now!",
                            f"[HOOK - 0:00 to 0:03]\nVisual: Frustrated reaction to low battery / tangled cables vs sleek {product_name} unboxing.\nVoiceover (Roman Urdu): \"Sastay aur nakara gadgets par paise zaya karna band karein!\"\nVoiceover (اردو): \"سستے اور ناکارہ گیجٹس پر پیسے ضائع کرنا بند کریں!\"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Close-up macro shot showcasing {feat_1} and premium durable build.\nVoiceover (Roman Urdu): \"Yeh {product_name} deta hai {feat_1} aur {feat_2} ke sath crystal clear performance aur lambi battery life.\"\nVoiceover (اردو): \"یہ {product_name} دیتا ہے شاندار پرفارمنس اور بہترین بیٹری لائف۔\"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Sleek hand carry with warranty card and launch discount badge.\nVoiceover (Roman Urdu): \"Abhi link par click karein aur launch offer mein {offer} hasil karein!\"\nVoiceover (اردو): \"ابھی لنک پر کلک کریں اور لانچ آفر میں خصوصی رعایت حاصل کریں!\"",
                            f"Order Now & Claim {offer}",
                            f"#{product_name.replace(' ', '')} #TechGadgetsPK #SmartLife #BestGadgets2026"
                        ),
                    ]
                else:  # general or other categories
                    angles = [
                        (
                            f"Stop struggling with {pain_1}! Watch this 30-second fix.",
                            f"[HOOK - 0:00 to 0:03]\nVisual: Demonstration of common frustration with {pain_1}.\nVoiceover (Roman Urdu): \"Agar aap bhi roz roz {pain_1} se tang hain, toh yeh 30-second video zaroor dekhein!\"\nVoiceover (اردو): \"اگر آپ بھی روز روز اس مسئلے سے تنگ ہیں تو یہ ویڈیو ضرور دیکھیں!\"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using {product_name} showcasing {feat_1}.\nVoiceover (Roman Urdu): \"Purane aur thakane wale tareeqon ko chhod dein. Yeh {product_name} {feat_1} ke sath aapka time aur paisa dono bachata hai.\"\nVoiceover (اردو): \"پرانے طریقوں کو چھوڑیں۔ یہ {product_name} آپ کے وقت اور پیسے دونوں کی بچت کرتا ہے۔\"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Clean finished result holding {product_name} with delivery badge.\nVoiceover (Roman Urdu): \"Stock tezi se khatam ho raha hai! Abhi link par click karein aur launch sale mein {offer} hasil karein!\"\nVoiceover (اردو): \"اسٹاک تیزی سے ختم ہو رہا ہے! ابھی نیچے دیے گئے لنک پر کلک کریں اور {offer} حاصل کریں!\"",
                            f"Click Link to Order with {offer}",
                            f"#{product_name.replace(' ', '')} #ViralFindsPK #ProblemSolved #TrendingNow"
                        ),
                        (
                            f"Why everyone is upgrading to the {product_name} this month!",
                            f"[HOOK - 0:00 to 0:03]\nVisual: Quick unboxing reaction with excited expression.\nVoiceover (Roman Urdu): \"Mujhe samajh aa gaya ke har koi is {product_name} ki baat kyun kar raha hai!\"\nVoiceover (اردو): \"مجھے سمجھ آ گیا کہ ہر کوئی اس پروڈکٹ کی اتنی تعریف کیوں کر رہا ہے!\"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Demonstrating {feat_1} and {feat_2} in action.\nVoiceover (Roman Urdu): \"Iska sleek design aur {feat_1} har roz ke kaam ko behad asaan bana deta hai.\"\nVoiceover (اردو): \"اس کا شاندار ڈیزائن روزمرہ کی روٹین کو بہت آسان بنا دیتا ہے۔\"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Presenter giving thumbs up holding product box.\nVoiceover (Roman Urdu): \"Cash on Delivery available hai! Abhi order karein aur flat {offer} hasil karein!\"\nVoiceover (اردو): \"کیش آن ڈلیوری دستیاب ہے! ابھی آرڈر کریں اور رعایت پائیں!\"",
                            f"Order with Cash on Delivery & {offer}",
                            f"#{product_name.replace(' ', '')} #MustHavePK #LifeHacks #SpecialOffer"
                        ),
                    ]

                sel = angles[angle % len(angles)]
                return {"hook": sel[0], "caption": sel[1], "call_to_action": sel[2], "hashtags": sel[3]}
            else:  # International English
                return {
                    "hook": f"Still dealing with {pain_1}? Stop and watch this.",
                    "caption": (
                        f"[HOOK - 0:00 to 0:03]\n"
                        f"Visual: Close-up demonstrating the daily problem with {pain_1}.\n"
                        f"Voiceover: \"Tired of {pain_1}? Here is the 10-second fix.\"\n\n"
                        f"[DEMO & BENEFIT - 0:03 to 0:10]\n"
                        f"Visual: Presenter using {product_name} highlighting {feat_1}.\n"
                        f"Voiceover: \"The {product_name} was engineered to eliminate {pain_1}. With its {feat_1} and {feat_2}, you get effortless professional results every time.\"\n\n"
                        f"[CALL TO ACTION - 0:10 to 0:15]\n"
                        f"Visual: Clean finished result holding {product_name}.\n"
                        f"Voiceover: \"Tap the link below to get yours with {offer} before stock runs out!\""
                    ),
                    "call_to_action": f"Tap link to claim {offer}",
                    "hashtags": f"#{product_name.replace(' ', '')} #ProblemSolved #LifeUpgrade"
                }
        elif format_type == "paid":
            return {
                "hook": f"Stop struggling with {pain_1}. The {product_name} is here.",
                "caption": (
                    f"Tired of dealing with {pain_1}?\n\n"
                    f"Upgrade your daily routine with the **{product_name}**.\n\n"
                    f"✅ Built with {feat_1}\n✅ Delivers {feat_2}\n✅ Fast Tracked Shipping (COD Available)\n\n"
                    f"🏷️ Limited Time Launch Promo: **{offer}**\n\nClick below to claim yours before stock runs out!"
                ),
                "call_to_action": f"Shop Now & Claim {offer}",
                "hashtags": f"#{product_name.replace(' ', '')} #DirectResponse #SpecialOffer"
            }
        elif format_type == "email":
            return {
                "hook": f"Subject: The smartest way to handle {pain_1} ✨",
                "caption": (
                    f"Hi there,\n\n"
                    f"If {pain_1} has been slowing you down, we have great news.\n\n"
                    f"We created the **{product_name}** specifically to make your routine effortless.\n\n"
                    f"Key Highlights:\n• {feat_1}\n• {feat_2}\n\n"
                    f"Take advantage of our exclusive offer: **{offer}**.\n\nClick below to order yours today:"
                ),
                "call_to_action": f"Explore {product_name} & Save",
                "hashtags": ""
            }
        elif format_type == "whatsapp":
            return {
                "hook": f"✨ VIP Update: {product_name} is in stock!",
                "caption": (
                    f"Hi! Quick VIP update on the **{product_name}**.\n\n"
                    f"Due to high demand, our latest restock featuring {feat_1} is going fast!\n\n"
                    f"🎁 VIP Offer: **{offer}** + Free Express Delivery.\n\nReply to this message with **ORDER** to reserve yours now!"
                ),
                "call_to_action": "Order via WhatsApp with 1 Click",
                "hashtags": ""
            }
        else:  # organic
            return {
                "hook": f"The 3-step routine change for {pain_1}.",
                "caption": (
                    f"Most people think dealing with {pain_1} is unavoidable.\n\n"
                    f"Here is what actually works: Introducing the **{product_name}**.\n\n"
                    f"✨ {feat_1}\n✨ {feat_2}\n\n"
                    f"🎁 Special Offer: {offer}\n\nDrop a 💬 below or save this post for later!"
                ),
                "call_to_action": "Comment INFO for the direct link",
                "hashtags": f"#{product_name.replace(' ', '')} #MustHave #ProductReview"
            }

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
        variation_seed: int = 0,
    ) -> dict[str, str]:
        """
        Uses Google Gemini to generate highly persuasive, channel-tailored marketing copy
        accurately referencing the specific product, its real features, and target pain points.
        For video scripts, voiceover lines are natively localized into the target market's language.
        Supports variation_seed to generate diverse hooks and angles on regeneration.
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
            f"- Variation / Angle Index: #{variation_seed} (Generate a distinctly fresh hook and creative angle different from previous variations)\n"
            f"- Optional Hook Seed: {hook_idea or 'None'}\n"
            f"- Custom Notes: {custom_instructions or 'Focus on fast benefits and high clarity'}\n\n"
            f"INSTRUCTIONS FOR FORMAT:\n"
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
                dynamic_temp = min(1.0, 0.7 + (variation_seed % 5) * 0.06)
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=dynamic_temp,
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

        # Intelligent Product-Aware & Multi-Angle Synthesis Fallback
        return cls._synthesize_grounded_copy(
            product_name=product_name,
            product_description=product_description,
            product_features=product_features,
            product_pain_points=product_pain_points,
            channel=channel,
            format_type=format_type,
            trend_topic=trend_topic,
            hook_idea=hook_idea,
            custom_instructions=custom_instructions,
            target_country=country,
            target_language=lang,
            variation_seed=variation_seed,
        )

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

