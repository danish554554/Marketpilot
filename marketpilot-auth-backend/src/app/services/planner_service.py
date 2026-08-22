from datetime import date, timedelta
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.schemas import (
    BatchGenerateContentRequest,
    BatchGenerateContentResponse,
    CampaignChannel,
    CampaignPillarResponse,
    CarouselSlideItem,
    ContentFormat,
    ContentStatus,
    MarketingStrategyResponse,
    PlannerContentItemResponse,
    ScriptSceneItem,
    StrategyGenerateRequest,
    StrategyTimeframe,
    StructuredContentPayload,
    StructuredContext,
)
from app.services.context_builder import build_structured_context
from app.services.guardrails import GuardrailsEngine
from app.services.strategy_engine import StrategyEngine
from app.supabase_client import get_service_client


class PlannerService:
    """
    Core Planner and Copywriting Engine for MarketPilot AI (Version 1).
    Generates text-first editorial calendars and batch copywriting across channels.
    """

    @classmethod
    def calculate_schedule_dates(
        cls,
        start_date: date,
        end_date: date,
        days_per_week: int = 3,
    ) -> list[date]:
        """
        Calculates evenly distributed publishing dates between start_date and end_date.
        """
        if end_date < start_date:
            raise ValueError("end_date must be on or after start_date.")

        total_days = (end_date - start_date).days + 1
        if total_days <= 0:
            return [start_date]

        # Determine target publishing weekdays based on days_per_week
        if days_per_week >= 7:
            target_weekdays = set(range(7))  # Mon-Sun
        elif days_per_week == 5:
            target_weekdays = {0, 1, 2, 3, 4}  # Mon-Fri
        elif days_per_week == 4:
            target_weekdays = {0, 1, 3, 4}     # Mon, Tue, Thu, Fri
        elif days_per_week == 3:
            target_weekdays = {0, 2, 4}        # Mon, Wed, Fri
        elif days_per_week == 2:
            target_weekdays = {1, 3}           # Tue, Thu
        else:
            target_weekdays = {0}              # Mon only

        scheduled_dates: list[date] = []
        current = start_date
        while current <= end_date:
            if current.weekday() in target_weekdays:
                scheduled_dates.append(current)
            current += timedelta(days=1)

        # Fallback if no matching weekdays in short interval
        if not scheduled_dates:
            scheduled_dates = [start_date]

        return scheduled_dates

    @classmethod
    def generate_copy_for_format(
        cls,
        format_type: ContentFormat,
        channel: CampaignChannel,
        channel_type: str,
        pillar: CampaignPillarResponse,
        context: StructuredContext,
    ) -> tuple[str, str, dict, str, str]:
        """
        Produces production-ready marketing copy, hooks, structured content (slides/scenes),
        CTA, and strategic rationale based on the requested format.
        Returns: (hook, primary_text, structured_content_dict, cta, strategic_rationale)
        """
        prod_name = pillar.product_name or (context.available_products[0].name if context.available_products else "our signature solution")
        pain_point = "frustrating daily friction and slow results"
        features_list = ["Premium verified quality", "Fast and measurable outcome", "Engineered for maximum reliability"]
        if pillar.focus_product_id:
            matching = [p for p in context.available_products if p.id == pillar.focus_product_id]
            if matching:
                if matching[0].pain_points:
                    pain_point = matching[0].pain_points[0]
                if matching[0].features:
                    features_list = matching[0].features

        brand_cta = pillar.suggested_ctas[0] if pillar.suggested_ctas else (context.approved_ctas[0] if context.approved_ctas else "Shop now")
        brand_voice_lead = context.brand_voice[0] if context.brand_voice else "Strategic"

        # 1. Multi-Slide Carousel Text
        if format_type == ContentFormat.carousel_slides:
            hook = f"Stop struggling with {pain_point}: The 4-step framework with {prod_name}"
            slides = [
                CarouselSlideItem(
                    slide_number=1,
                    header=f"The Truth About {pain_point}",
                    body=f"Most people think solving {pain_point} requires endless trial and error. Here is why the standard approach fails.",
                    visual_direction_note="Bold headline text over high-contrast dark card.",
                ),
                CarouselSlideItem(
                    slide_number=2,
                    header="The Root Cause",
                    body=f"When you rely on outdated solutions, you waste time and money. True results require {features_list[0] if features_list else 'precision'}.",
                    visual_direction_note="Split comparison layout highlighting common mistake vs smart fix.",
                ),
                CarouselSlideItem(
                    slide_number=3,
                    header=f"How {prod_name} Changes The Game",
                    body=f"Engineered with {', '.join(features_list[:2])}. It directly targets {pain_point} without compromise.",
                    visual_direction_note="Feature callout cards with clean iconography.",
                ),
                CarouselSlideItem(
                    slide_number=4,
                    header="The Measurable Impact",
                    body=f"Consistent adoption delivers peak performance and peace of mind from day one.",
                    visual_direction_note="Data bullet points and proof metrics.",
                ),
                CarouselSlideItem(
                    slide_number=5,
                    header=f"Ready to level up with {context.business_name}?",
                    body=f"{brand_cta}. Save this carousel to revisit the full framework.",
                    visual_direction_note="Strong closing CTA card with save/share bookmark icons.",
                ),
            ]
            primary_text = f"Swipe through to discover how to eliminate {pain_point} once and for all with {prod_name}.\n\n" + "\n".join([f"Slide {s.slide_number}: {s.header} — {s.body}" for s in slides])
            structured_content = {"carousel_slides": [s.model_dump() for s in slides], "hashtags": [f"#{context.industry.replace(' ', '')}", f"#{prod_name.replace(' ', '')}", "#MarketingStrategy", "#Growth"]}
            rationale = f"Carousel format maximizes organic dwell time and save rate on {channel.value} for {pillar.pillar_name}."
            return hook, primary_text, structured_content, brand_cta, rationale

        # 2. Short-Form Video Script
        elif format_type == ContentFormat.short_video_script:
            hook = f"If you're still dealing with {pain_point}, you need to hear this."
            scenes = [
                ScriptSceneItem(
                    scene_number=1,
                    timing_seconds=3,
                    visual_direction_note="Direct-to-camera hook shot with subtle zoom effect.",
                    spoken_narration=f"If you're still struggling with {pain_point}, stop scrolling right now.",
                    onscreen_text=f"Stop ignoring {pain_point} 🛑",
                ),
                ScriptSceneItem(
                    scene_number=2,
                    timing_seconds=8,
                    visual_direction_note="Demonstrate product in action or close-up problem breakdown.",
                    spoken_narration=f"The reason standard fixes fail is because they don't give you {features_list[0] if features_list else 'the right foundation'}.",
                    onscreen_text="Why traditional fixes fail ❌",
                ),
                ScriptSceneItem(
                    scene_number=3,
                    timing_seconds=12,
                    visual_direction_note="Feature demonstration highlighting unique selling proposition.",
                    spoken_narration=f"That's exactly why {prod_name} was designed with {features_list[-1] if features_list else 'premium materials'}.",
                    onscreen_text=f"The {prod_name} difference ✨",
                ),
                ScriptSceneItem(
                    scene_number=4,
                    timing_seconds=7,
                    visual_direction_note="Presenter smiling, holding product or pointing to link/sticker.",
                    spoken_narration=f"Click the link to get yours today. {brand_cta}!",
                    onscreen_text=f"{brand_cta} 🔗",
                ),
            ]
            primary_text = f"SCRIPT NARRATION ({sum(s.timing_seconds for s in scenes)}s total):\n\n" + "\n\n".join([f"[Scene {s.scene_number} ({s.timing_seconds}s)]\nVisual: {s.visual_direction_note}\nAudio: \"{s.spoken_narration}\"\nOverlay: {s.onscreen_text}" for s in scenes])
            structured_content = {"script_scenes": [s.model_dump() for s in scenes], "total_runtime_seconds": sum(s.timing_seconds for s in scenes)}
            rationale = f"Short-form video script engineered for high retention on {channel.value} algorithm."
            return hook, primary_text, structured_content, brand_cta, rationale

        # 3. Email Newsletter
        elif format_type == ContentFormat.email_newsletter:
            hook = f"The smartest way to tackle {pain_point} this week"
            subject_lines = [
                f"How to solve {pain_point} (without the headache)",
                f"Inside {context.business_name}: Why {prod_name} is selling out",
                f"Your weekly {context.industry} briefing + VIP update",
            ]
            preview_text = f"Discover why {prod_name} is transforming how people handle {pain_point}."
            primary_text = (
                f"Hi there,\n\n"
                f"When was the last time you took a close look at how you handle {pain_point}?\n\n"
                f"For most people in {context.industry}, it feels like an unavoidable part of the process. "
                f"But at {context.business_name}, we believe in smarter, higher-leverage solutions.\n\n"
                f"That's why we engineered **{prod_name}**.\n\n"
                f"Here is what makes it different:\n"
                f"• {features_list[0] if features_list else 'Unmatched build quality'}\n"
                f"• {features_list[1] if len(features_list) > 1 else 'Rapid and reliable performance'}\n"
                f"• Built with your daily routine in mind\n\n"
                f"If you're ready to experience the upgrade for yourself:\n\n"
                f"👉 [{brand_cta}]\n\n"
                f"Best regards,\n"
                f"The {context.business_name} Team"
            )
            structured_content = {
                "email_subject_lines": subject_lines,
                "email_preview_text": preview_text,
                "cta_button_text": brand_cta,
            }
            rationale = f"Email newsletter drives high-LTV direct response and customer retention for {pillar.pillar_name}."
            return hook, primary_text, structured_content, brand_cta, rationale

        # 4. Direct Broadcast Message (WhatsApp / SMS)
        elif format_type == ContentFormat.direct_message:
            hook = f"🌟 Exclusive update from {context.business_name}: {prod_name}"
            primary_text = (
                f"Hi! Hope your week is off to a great start. ✨\n\n"
                f"Quick update: We just restocked **{prod_name}**, our highest-rated solution for {pain_point}.\n\n"
                f"Key highlight: {features_list[0] if features_list else 'Engineered for top results'}.\n\n"
                f"🔥 {brand_cta} before units run out! Reply directly to this message if you have any questions."
            )
            structured_content = {"channel_optimized": "whatsapp_broadcast"}
            rationale = f"Punchy, conversational broadcast maximizing immediate open rates on WhatsApp/SMS."
            return hook, primary_text, structured_content, brand_cta, rationale

        # 5. Standard Social Post & Caption (Default)
        else:
            hook = f"Why {prod_name} is becoming the new standard in {context.industry}."
            primary_text = (
                f"{hook}\n\n"
                f"If you've been dealing with {pain_point}, you already know how difficult it is to find a solution that genuinely works.\n\n"
                f"Here is what sets {prod_name} apart:\n"
                f"✅ {features_list[0] if features_list else 'Precision performance'}\n"
                f"✅ {features_list[1] if len(features_list) > 1 else 'Reliable everyday use'}\n"
                f"✅ Backed by {context.business_name}'s quality commitment\n\n"
                f"{brand_cta}! 👇\n\n"
                f"#{context.industry.replace(' ', '')} #{prod_name.replace(' ', '')} #Innovation #Quality"
            )
            structured_content = {"hashtags": [f"#{context.industry.replace(' ', '')}", f"#{prod_name.replace(' ', '')}", "#Quality"]}
            rationale = f"High-converting organic social post caption tailored to {channel.value} audience."
            return hook, primary_text, structured_content, brand_cta, rationale

    @classmethod
    def batch_generate_calendar(
        cls,
        context: StructuredContext,
        request: BatchGenerateContentRequest,
        user_id: UUID,
    ) -> BatchGenerateContentResponse:
        """
        Batch generates a complete editorial calendar and copywriting package.
        """
        # Fetch or generate active strategy pillars
        client = get_service_client()
        strategy_id = request.strategy_id
        strategy_title = f"{context.business_name} Marketing Strategy"
        pillars: list[CampaignPillarResponse] = []

        if strategy_id:
            try:
                s_res = client.table("marketing_strategies").select("*").eq("id", str(strategy_id)).maybe_single().execute()
                if s_res and s_res.data:
                    strategy_title = s_res.data.get("title", strategy_title)
                p_res = client.table("strategy_campaign_pillars").select("*, products(name), offers(title), trend_signals(topic)").eq("strategy_id", str(strategy_id)).order("order_index").execute()
                for r in p_res.data or []:
                    prod = r.pop("products", None)
                    off = r.pop("offers", None)
                    trend = r.pop("trend_signals", None)
                    if prod and isinstance(prod, dict):
                        r["product_name"] = prod.get("name")
                    if off and isinstance(off, dict):
                        r["offer_title"] = off.get("title")
                    if trend and isinstance(trend, dict):
                        r["trend_topic"] = trend.get("topic")
                    pillars.append(CampaignPillarResponse(**r))
            except Exception:
                pass

        # If no strategy pillars found, synthesize on the fly via StrategyEngine
        if not pillars:
            strat_res = StrategyEngine.generate_strategy(
                context=context,
                request=StrategyGenerateRequest(timeframe=StrategyTimeframe.monthly),
                user_id=user_id,
            )
            strategy_id = strat_res.id
            strategy_title = strat_res.title
            pillars = strat_res.pillars

        # Calculate scheduled calendar dates
        schedule_dates = cls.calculate_schedule_dates(
            start_date=request.start_date,
            end_date=request.end_date,
            days_per_week=request.days_per_week,
        )

        channels = request.target_channels or [CampaignChannel.instagram, CampaignChannel.tiktok, CampaignChannel.facebook, CampaignChannel.email]
        format_preferences = request.formats_preference or [
            ContentFormat.post_caption,
            ContentFormat.carousel_slides,
            ContentFormat.short_video_script,
            ContentFormat.email_newsletter,
        ]

        now_str = "2026-08-22T10:00:00Z"
        generated_items: list[PlannerContentItemResponse] = []
        rows_to_insert: list[dict] = []

        for idx, sched_date in enumerate(schedule_dates):
            # Rotate through pillars, channels, and formats
            pillar = pillars[idx % len(pillars)]
            channel = channels[idx % len(channels)]
            fmt = format_preferences[idx % len(format_preferences)]
            time_slot = "morning_09_00" if idx % 2 == 0 else "evening_18_00"

            hook, primary_text, structured_dict, cta, rationale = cls.generate_copy_for_format(
                format_type=fmt,
                channel=channel,
                channel_type=pillar.channel_type,
                pillar=pillar,
                context=context,
            )

            # Apply Guardrails: Sanitize any Brand Kit prohibited words
            hook, _ = GuardrailsEngine.sanitize_prohibited_words(hook, context.prohibited_words)
            primary_text, _ = GuardrailsEngine.sanitize_prohibited_words(primary_text, context.prohibited_words)
            cta, _ = GuardrailsEngine.sanitize_prohibited_words(cta, context.prohibited_words)

            item_id = uuid4()
            item_title = f"[{channel.value.upper()}] {fmt.value.replace('_', ' ').title()}: {pillar.pillar_name}"

            item_response = PlannerContentItemResponse(
                id=item_id,
                workspace_id=context.workspace_id,
                created_by=user_id,
                strategy_id=strategy_id,
                strategy_title=strategy_title,
                pillar_id=pillar.id,
                pillar_name=pillar.pillar_name,
                focus_product_id=pillar.focus_product_id,
                product_name=pillar.product_name,
                offer_id=pillar.offer_id,
                offer_title=pillar.offer_title,
                trend_signal_id=pillar.trend_signal_id,
                trend_topic=pillar.trend_topic,
                title=item_title,
                channel=channel,
                channel_type=pillar.channel_type,
                format=fmt,
                status=ContentStatus.scheduled,
                scheduled_date=sched_date,
                scheduled_time_slot=time_slot,
                hook=hook,
                primary_text=primary_text,
                structured_content=structured_dict,
                call_to_action=cta,
                strategic_rationale=rationale,
                created_at=now_str,
                updated_at=now_str,
            )
            generated_items.append(item_response)

            rows_to_insert.append({
                "id": str(item_id),
                "workspace_id": str(context.workspace_id),
                "created_by": str(user_id),
                "strategy_id": str(strategy_id) if strategy_id else None,
                "pillar_id": str(pillar.id) if pillar.id else None,
                "focus_product_id": str(pillar.focus_product_id) if pillar.focus_product_id else None,
                "offer_id": str(pillar.offer_id) if pillar.offer_id else None,
                "trend_signal_id": str(pillar.trend_signal_id) if pillar.trend_signal_id else None,
                "title": item_title,
                "channel": channel.value,
                "channel_type": pillar.channel_type,
                "format": fmt.value,
                "status": ContentStatus.scheduled.value,
                "scheduled_date": str(sched_date),
                "scheduled_time_slot": time_slot,
                "hook": hook,
                "primary_text": primary_text,
                "structured_content": structured_dict,
                "call_to_action": cta,
                "strategic_rationale": rationale,
            })

        # Bulk insert into Supabase
        if rows_to_insert:
            try:
                client.table("planner_content_items").insert(rows_to_insert).execute()
            except Exception:
                pass

        return BatchGenerateContentResponse(
            generated_count=len(generated_items),
            start_date=request.start_date,
            end_date=request.end_date,
            items=generated_items,
        )
