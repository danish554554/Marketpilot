from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.schemas import (
    BudgetAllocationBreakdown,
    CampaignChannel,
    CampaignPillarCreateRequest,
    CampaignPillarResponse,
    MarginTier,
    MarketingObjective,
    MarketingStrategyCreateRequest,
    MarketingStrategyResponse,
    MarketingStrategyUpdateRequest,
    PlannerProduct,
    ProductPriority,
    ProductPriorityBreakdown,
    StrategyGenerateRequest,
    StrategyStatus,
    StrategyTimeframe,
    StructuredContext,
    TrendSignal,
)
from app.services.context_builder import build_structured_context
from app.services.gemini_service import GeminiService
from app.services.guardrails import GuardrailsEngine
from app.supabase_client import get_service_client


class StrategyEngine:
    """
    Core Strategy Engine that analyzes business context, prioritizes inventory by margin,
    allocates organic/paid budgets, and generates multi-channel marketing pillars.
    """

    @classmethod
    def prioritize_products(
        cls,
        products: list[PlannerProduct],
        focus_ids: list[UUID] | None = None,
    ) -> ProductPriorityBreakdown:
        """
        Categorizes available in-stock products into:
        - Hero products (High margin + High priority)
        - High-margin revenue drivers (>60% margin)
        - Clearance / Promotion items (On offer or low stock requiring velocity)
        """
        filtered = [p for p in products if not focus_ids or p.id in focus_ids]
        if not filtered:
            filtered = products

        hero_prods = []
        high_margin_prods = []
        clearance_prods = []

        for p in filtered:
            prod_dict = {
                "id": str(p.id),
                "name": p.name,
                "price": str(p.price),
                "cost_price": str(p.cost_price) if p.cost_price else None,
                "profit_margin": str(p.profit_margin) if p.profit_margin else None,
                "margin_tier": p.margin_tier.value if p.margin_tier else "medium",
                "stock_quantity": p.stock_quantity,
                "priority": p.priority.value,
                "is_on_offer": p.is_on_offer,
                "active_offer": p.active_offer_title,
            }
            if p.margin_tier == MarginTier.HIGH and p.priority == ProductPriority.HIGH:
                hero_prods.append(prod_dict)
            elif p.margin_tier == MarginTier.HIGH:
                high_margin_prods.append(prod_dict)

            if p.is_on_offer or p.stock_quantity < 20:
                clearance_prods.append(prod_dict)

        # Ensure hero list has at least one entry if products exist
        if not hero_prods and filtered:
            hero_prods.append({
                "id": str(filtered[0].id),
                "name": filtered[0].name,
                "price": str(filtered[0].price),
                "margin_tier": filtered[0].margin_tier.value if filtered[0].margin_tier else "medium",
                "stock_quantity": filtered[0].stock_quantity,
            })

        return ProductPriorityBreakdown(
            hero_products=hero_prods,
            high_margin_drivers=high_margin_prods,
            clearance_or_offer_items=clearance_prods,
        )

    @classmethod
    def calculate_budget_breakdown(
        cls,
        context: StructuredContext,
        target_channels: list[CampaignChannel] | None = None,
    ) -> BudgetAllocationBreakdown:
        """
        Calculates exact organic and paid budget allocations and recommends
        per-channel spending according to workspace budget settings.
        """
        mb = context.monthly_budget
        if not mb:
            return BudgetAllocationBreakdown(
                total_budget=Decimal("0.00"),
                currency=context.currency,
                organic_budget=Decimal("0.00"),
                paid_budget=Decimal("0.00"),
                organic_percentage=Decimal("60.00"),
                paid_percentage=Decimal("40.00"),
                channel_spend_recommendations={},
            )

        total = mb.total_monthly_budget
        org_pct = mb.organic_percentage
        paid_pct = mb.paid_percentage
        organic_amount = round(total * (org_pct / Decimal("100.00")), 2)
        paid_amount = round(total * (paid_pct / Decimal("100.00")), 2)

        # Calculate recommended paid spend distribution
        channels = target_channels or [CampaignChannel.instagram, CampaignChannel.tiktok, CampaignChannel.facebook]
        channel_recs: dict[str, Decimal] = {}
        if paid_amount > 0 and channels:
            equal_share = round(paid_amount / len(channels), 2)
            for ch in channels:
                channel_recs[ch.value] = equal_share

        return BudgetAllocationBreakdown(
            total_budget=total,
            currency=mb.currency,
            organic_budget=organic_amount,
            paid_budget=paid_amount,
            organic_percentage=org_pct,
            paid_percentage=paid_pct,
            channel_spend_recommendations=channel_recs,
        )

    @classmethod
    def generate_strategy(
        cls,
        context: StructuredContext,
        request: StrategyGenerateRequest,
        user_id: UUID,
    ) -> MarketingStrategyResponse:
        """
        Synthesizes the business intelligence into a structured marketing strategy
        with multiple actionable campaign pillars.
        """
        prods = context.available_products
        filtered_prods = [p for p in prods if not request.focus_product_ids or p.id in request.focus_product_ids]
        if not filtered_prods:
            filtered_prods = prods

        prod_priorities = cls.prioritize_products(prods, request.focus_product_ids)
        budget_breakdown = cls.calculate_budget_breakdown(context, request.target_channels)
        
        timeframe_label = request.timeframe.value.capitalize()
        strategy_title = request.title or f"{context.business_name} {timeframe_label} Growth & Acquisition Strategy"
        primary_goal = request.primary_goal or (context.marketing_goals[0] if context.marketing_goals else MarketingObjective.INCREASE_PRODUCT_AWARENESS)
        cta = context.approved_ctas[0] if context.approved_ctas else "Shop now and transform your routine"

        # Executive Summary
        exec_summary = (
            f"Comprehensive {request.timeframe.value} marketing strategy for {context.business_name} in the {context.industry} sector. "
            f"Engineered to maximize profit margins, drive customer acquisition, and scale brand equity across organic and paid channels. "
            f"Prioritizes {len(prod_priorities.hero_products)} hero product lines and integrates {len(context.matched_trends)} verified trend signals."
        )

        # Target Audience Summary
        target_audience = (
            f"High-intent consumers in {context.country} actively seeking premium {context.industry} solutions with an emphasis on quality and reliability. "
            f"Key demographic: Decision-makers and conscious shoppers valuing verified product outcomes."
        )

        # Generate Pillars
        pillars: list[CampaignPillarResponse] = []
        now_str = "2026-08-21T12:00:00Z"
        strategy_id = uuid4()
        hero_p = filtered_prods[0] if filtered_prods else None
        trend1 = context.matched_trends[0] if (request.include_trends and context.matched_trends) else None

        # Attempt Gemini AI dynamic strategy generation
        gemini_pillars_raw = None
        if GeminiService.is_available():
            gemini_pillars_raw = GeminiService.generate_strategy_pillars(
                context=context,
                timeframe=request.timeframe.value,
                primary_goal=primary_goal.value,
                hero_product=hero_p,
                trends=context.matched_trends if request.include_trends else [],
            )

        if gemini_pillars_raw and len(gemini_pillars_raw) >= 4:
            for idx, gp in enumerate(gemini_pillars_raw[:4]):
                obj_val = gp.get("objective", primary_goal.value)
                try:
                    obj_enum = MarketingObjective(obj_val)
                except ValueError:
                    obj_enum = primary_goal

                plat_val = gp.get("platform", "instagram")
                try:
                    plat_enum = CampaignChannel(plat_val)
                except ValueError:
                    plat_enum = CampaignChannel.instagram

                pil = CampaignPillarResponse(
                    id=uuid4(),
                    strategy_id=strategy_id,
                    pillar_name=gp.get("pillar_name", f"Pillar {idx + 1}"),
                    objective=obj_enum,
                    channel_type=gp.get("channel_type", "organic"),
                    platform=plat_enum,
                    focus_product_id=hero_p.id if hero_p else None,
                    product_name=gp.get("product_name", hero_p.name if hero_p else None),
                    offer_id=context.active_offers[0].id if context.active_offers else None,
                    offer_title=context.active_offers[0].title if context.active_offers else None,
                    trend_signal_id=trend1.id if (trend1 and idx == 2) else None,
                    trend_topic=trend1.topic if (trend1 and idx == 2) else None,
                    creative_angle=gp.get("creative_angle", "AI-optimized creative angle"),
                    hook_ideas=gp.get("hook_ideas", ["Engaging hook idea"]),
                    suggested_ctas=gp.get("suggested_ctas", [cta]),
                    content_formats=gp.get("content_formats", ["post_caption"]),
                    estimated_effort=gp.get("estimated_effort", "medium"),
                    rationale=gp.get("rationale", "Generated by Google Gemini AI."),
                    order_index=idx + 1,
                    created_at=now_str,
                    updated_at=now_str,
                )
                pillars.append(pil)
        else:
            # Deterministic fallback pillars
            # Pillar 1: Hero Product Organic Awareness & Education
            if hero_p:
                p1_angle = f"Position {hero_p.name} as the category standard through educational storytelling and feature spotlighting."
                p1_hooks = [
                    f"Why everyone in {context.industry} is talking about {hero_p.name}",
                    f"3 mistakes you are making with your daily routine (and how {hero_p.name} fixes them)",
                    f"The real reason {hero_p.name} sells out so fast",
                ]
                p1 = CampaignPillarResponse(
                    id=uuid4(),
                    strategy_id=strategy_id,
                    pillar_name=f"Hero Spotlight: {hero_p.name} Educational Funnel",
                    objective=primary_goal,
                    channel_type="organic",
                    platform=CampaignChannel.instagram,
                    focus_product_id=hero_p.id,
                    product_name=hero_p.name,
                    offer_id=None,
                    trend_signal_id=trend1.id if trend1 else None,
                    trend_topic=trend1.topic if trend1 else None,
                    creative_angle=p1_angle,
                    hook_ideas=p1_hooks,
                    suggested_ctas=[cta, "Save this post for later"],
                    content_formats=["carousel", "educational_reel", "story_poll"],
                    estimated_effort="medium",
                    rationale=f"Hero product with {hero_p.profit_margin or 60}% margin and {hero_p.stock_quantity} available units. Builds organic authority without ad spend.",
                    order_index=1,
                    created_at=now_str,
                    updated_at=now_str,
                )
                pillars.append(p1)

            # Pillar 2: Paid Direct-Response & Conversion Booster
            second_p = filtered_prods[1] if len(filtered_prods) > 1 else hero_p
            offer1 = context.active_offers[0] if context.active_offers else None
            if second_p:
                p2_angle = f"High-converting direct response addressing customer pain point: '{second_p.pain_points[0] if second_p.pain_points else 'daily hassle'}'."
                p2_hooks = [
                    f"Tired of dealing with {second_p.pain_points[0] if second_p.pain_points else 'subpar alternatives'}?",
                    f"Watch what happens when you switch to {second_p.name}",
                    f"Limited stock remaining: Get yours before it's gone",
                ]
                p2 = CampaignPillarResponse(
                    id=uuid4(),
                    strategy_id=strategy_id,
                    pillar_name=f"Direct Response: {second_p.name} Acquisition Engine",
                    objective=MarketingObjective.INCREASE_SALES,
                    channel_type="paid" if (budget_breakdown.paid_budget and budget_breakdown.paid_budget > 0) else "organic",
                    platform=CampaignChannel.tiktok,
                    focus_product_id=second_p.id,
                    product_name=second_p.name,
                    offer_id=offer1.id if offer1 else None,
                    offer_title=offer1.title if offer1 else None,
                    trend_signal_id=None,
                    creative_angle=p2_angle,
                    hook_ideas=p2_hooks,
                    suggested_ctas=[cta, "Claim exclusive pricing today"],
                    content_formats=["short_form_ugc_script", "comparison_ad", "retargeting_card"],
                    estimated_effort="high",
                    rationale=f"Targets conversion-ready prospects using targeted paid budget allocation ({budget_breakdown.paid_percentage}% of total budget).",
                    order_index=2,
                    created_at=now_str,
                    updated_at=now_str,
                )
                pillars.append(p2)

            # Pillar 3: Trend Momentum & Community Engagement
            trend_pillar = context.matched_trends[1] if len(context.matched_trends) > 1 else (context.matched_trends[0] if context.matched_trends else None)
            if trend_pillar and request.include_trends:
                p3_angle = f"Ride the cultural momentum of '{trend_pillar.topic}' ({trend_pillar.confidence_score}% confidence score)."
                p3_hooks = trend_pillar.suggested_angles or [
                    f"The new trend transforming {context.industry} in 2026",
                    f"How {context.business_name} is adopting {trend_pillar.topic}",
                ]
                p3 = CampaignPillarResponse(
                    id=uuid4(),
                    strategy_id=strategy_id,
                    pillar_name=f"Trend Velocity: {trend_pillar.topic}",
                    objective=MarketingObjective.INCREASE_ENGAGEMENT,
                    channel_type="organic",
                    platform=CampaignChannel.tiktok if trend_pillar.platform.value == "tiktok" else CampaignChannel.instagram,
                    focus_product_id=hero_p.id if hero_p else None,
                    product_name=hero_p.name if hero_p else None,
                    offer_id=None,
                    trend_signal_id=trend_pillar.id,
                    trend_topic=trend_pillar.topic,
                    creative_angle=p3_angle,
                    hook_ideas=p3_hooks,
                    suggested_ctas=[cta, "Comment your thoughts below"],
                    content_formats=["viral_sound_short", "trend_breakdown", "behind_the_scenes"],
                    estimated_effort="medium",
                    rationale=f"Leverages verified market trend '{trend_pillar.topic}' from {trend_pillar.source_name} to capture low-cost algorithmic reach.",
                    order_index=3,
                    created_at=now_str,
                    updated_at=now_str,
                )
                pillars.append(p3)

            # Pillar 4: Retention, Loyalty & VIP Cross-Sell
            p4 = CampaignPillarResponse(
                id=uuid4(),
                strategy_id=strategy_id,
                pillar_name="Customer Retention & VIP Community Engagement",
                objective=MarketingObjective.INCREASE_SALES,
                channel_type="organic",
                platform=CampaignChannel.whatsapp if context.country == "PK" else CampaignChannel.email,
                focus_product_id=None,
                offer_id=offer1.id if offer1 else None,
                offer_title=offer1.title if offer1 else None,
                trend_signal_id=None,
                creative_angle=f"Nurture existing customer relationships with exclusive updates, early access, and tailored {context.industry} guides.",
                hook_ideas=[
                    "A special thank you for being a valued client",
                    "Early access: New arrivals before anyone else",
                ],
                suggested_ctas=["Join VIP list", "Reply to chat with our team"],
                content_formats=["newsletter_broadcast", "direct_broadcast_message"],
                estimated_effort="low",
                rationale="Maximizes customer lifetime value (LTV) and drives repeat purchases with minimal acquisition friction.",
                order_index=4,
                created_at=now_str,
                updated_at=now_str,
            )
            pillars.append(p4)

        # Sanitize any prohibited words across all pillars
        for pil in pillars:
            pil.creative_angle, _ = GuardrailsEngine.sanitize_prohibited_words(pil.creative_angle, context.prohibited_words)
            pil.rationale, _ = GuardrailsEngine.sanitize_prohibited_words(pil.rationale, context.prohibited_words)
            pil.hook_ideas = [GuardrailsEngine.sanitize_prohibited_words(h, context.prohibited_words)[0] for h in pil.hook_ideas]

        strategic_rationale = {
            "inventory_strategy": f"Allocated marketing effort toward {len(prod_priorities.hero_products)} hero high-margin items to optimize gross profit.",
            "budget_strategy": f"Maintained strict financial discipline with {budget_breakdown.organic_percentage}% organic / {budget_breakdown.paid_percentage}% paid split.",
            "trend_strategy": f"Integrated {len(context.matched_trends)} verified trend signals for maximum cultural resonance.",
            "channel_strategy": "Multi-touchpoint distribution covering top-of-funnel discovery, mid-funnel proof, and bottom-of-funnel conversion.",
        }

        # Persist Strategy and Pillars into Supabase
        client = get_service_client()
        try:
            strat_row = {
                "id": str(strategy_id),
                "workspace_id": str(context.workspace_id),
                "created_by": str(user_id),
                "title": strategy_title,
                "timeframe": request.timeframe.value,
                "status": StrategyStatus.draft.value,
                "executive_summary": exec_summary,
                "target_audience_summary": target_audience,
                "budget_allocation_summary": budget_breakdown.model_dump(mode="json"),
                "product_priorities_summary": prod_priorities.model_dump(mode="json"),
                "strategic_rationale": strategic_rationale,
            }
            client.table("marketing_strategies").insert(strat_row).execute()

            pillar_rows = []
            for pil in pillars:
                pillar_rows.append({
                    "id": str(pil.id),
                    "strategy_id": str(strategy_id),
                    "pillar_name": pil.pillar_name,
                    "objective": pil.objective.value,
                    "channel_type": pil.channel_type,
                    "platform": pil.platform.value,
                    "focus_product_id": str(pil.focus_product_id) if pil.focus_product_id else None,
                    "offer_id": str(pil.offer_id) if pil.offer_id else None,
                    "trend_signal_id": str(pil.trend_signal_id) if pil.trend_signal_id else None,
                    "creative_angle": pil.creative_angle,
                    "hook_ideas": pil.hook_ideas,
                    "suggested_ctas": pil.suggested_ctas,
                    "content_formats": pil.content_formats,
                    "estimated_effort": pil.estimated_effort,
                    "rationale": pil.rationale,
                    "order_index": pil.order_index,
                })
            if pillar_rows:
                client.table("strategy_campaign_pillars").insert(pillar_rows).execute()
        except Exception:
            pass

        return MarketingStrategyResponse(
            id=strategy_id,
            workspace_id=context.workspace_id,
            created_by=user_id,
            title=strategy_title,
            timeframe=request.timeframe,
            status=StrategyStatus.draft,
            executive_summary=exec_summary,
            target_audience_summary=target_audience,
            budget_allocation_summary=budget_breakdown.model_dump(mode="json"),
            product_priorities_summary=prod_priorities.model_dump(mode="json"),
            strategic_rationale=strategic_rationale,
            pillars=pillars,
            created_at=now_str,
            updated_at=now_str,
        )
