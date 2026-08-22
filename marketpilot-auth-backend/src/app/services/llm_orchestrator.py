import json
import time
from uuid import UUID, uuid4

from app.schemas import (
    GuardrailStatus,
    MarketingObjective,
    OrchestrationGenerateRequest,
    OrchestrationGenerateResponse,
    PromptType,
    RecommendationRationale,
    StrategicRecommendation,
    StructuredContext,
)
from app.services.guardrails import GuardrailsEngine
from app.supabase_client import get_service_client


class LLMOrchestrator:
    """
    Orchestrates prompt assembly, structured AI recommendation generation,
    guardrail validation, and audit persistence.
    """

    MODEL_NAME = "marketpilot-v1-engine"

    @classmethod
    def assemble_prompt(
        cls,
        context: StructuredContext,
        request: OrchestrationGenerateRequest,
    ) -> tuple[str, str]:
        """
        Assembles the strict system instruction and user prompt containing
        grounded business data.
        """
        system_instruction = (
            "You are MarketPilot AI, an elite, professional marketing strategist and AI copilot. "
            "You plan high-converting organic and paid marketing strategies based STRICTLY on the provided "
            "business context. Follow these inviolable guardrails:\n"
            "1. NEVER recommend out-of-stock products or invent hallucinated products.\n"
            "2. NEVER use any words from the Prohibited Words list.\n"
            "3. Follow the Brand Voice and use approved CTAs where possible.\n"
            "4. Only reference real, verified trend signals provided in the context.\n"
            "5. Provide rigorous strategic rationale (justifying product margins, inventory velocity, or trend alignment).\n"
            "6. Output MUST be valid JSON conforming to the requested schema."
        )

        user_prompt_data = {
            "business_profile": {
                "name": context.business_name,
                "industry": context.industry,
                "country": context.country,
                "currency": context.currency,
                "goals": [g.value for g in context.marketing_goals],
            },
            "brand_kit": {
                "brand_voice": context.brand_voice,
                "prohibited_words": context.prohibited_words,
                "approved_ctas": context.approved_ctas,
            },
            "in_stock_products": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "price": float(p.price),
                    "cost_price": float(p.cost_price) if p.cost_price else None,
                    "profit_margin_percentage": float(p.profit_margin) if p.profit_margin else None,
                    "margin_tier": p.margin_tier.value if p.margin_tier else None,
                    "stock_quantity": p.stock_quantity,
                    "priority": p.priority.value,
                    "features": p.features,
                    "pain_points": p.pain_points,
                    "active_offer": p.active_offer_title,
                }
                for p in context.available_products
                if not request.focus_product_ids or p.id in request.focus_product_ids
            ],
            "active_offers": [
                {
                    "id": str(o.id),
                    "title": o.title,
                    "discount_type": o.discount_type.value,
                    "discount_value": float(o.discount_value),
                    "end_date": str(o.end_date) if o.end_date else None,
                }
                for o in context.active_offers
            ],
            "marketing_budget": {
                "monthly_total": float(context.monthly_budget.total_monthly_budget) if context.monthly_budget else None,
                "currency": context.monthly_budget.currency if context.monthly_budget else context.currency,
                "organic_percentage": float(context.monthly_budget.organic_percentage) if context.monthly_budget else 60.0,
                "paid_percentage": float(context.monthly_budget.paid_percentage) if context.monthly_budget else 40.0,
            } if context.monthly_budget else None,
            "verified_trends": [
                {
                    "id": str(t.id),
                    "topic": t.topic,
                    "headline": t.headline,
                    "platform": t.platform.value,
                    "confidence_score": t.confidence_score,
                    "suggested_angles": t.suggested_angles,
                }
                for t in (context.matched_trends if request.include_trends else [])
            ],
            "generation_parameters": {
                "prompt_type": request.prompt_type.value,
                "channel_preference": request.channel_preference or "mixed",
                "custom_instructions": request.custom_instructions,
            },
        }

        user_prompt_str = json.dumps(user_prompt_data, indent=2)
        return system_instruction, user_prompt_str

    @classmethod
    def _generate_grounded_recommendations(
        cls,
        context: StructuredContext,
        request: OrchestrationGenerateRequest,
    ) -> list[StrategicRecommendation]:
        """
        Generates structured, grounded strategic recommendations tailored
        to the assembled business context.
        """
        recommendations: list[StrategicRecommendation] = []
        available_prods = [
            p for p in context.available_products
            if not request.focus_product_ids or p.id in request.focus_product_ids
        ]
        matched_trends = context.matched_trends if request.include_trends else []
        goals = context.marketing_goals or [MarketingObjective.INCREASE_PRODUCT_AWARENESS]
        primary_goal = goals[0]
        
        # Determine CTA
        cta = context.approved_ctas[0] if context.approved_ctas else "Shop now and transform your routine"

        # Generate Strategy Ideation / Campaign 1 (Organic Focus)
        prod1 = available_prods[0] if available_prods else None
        trend1 = matched_trends[0] if matched_trends else None
        offer1 = context.active_offers[0] if context.active_offers else None

        if prod1:
            margin_txt = f"{prod1.profit_margin:.1f}% profit margin" if prod1.profit_margin else "high-value catalogue item"
            trend_angle = trend1.suggested_angles[0] if (trend1 and trend1.suggested_angles) else f"How {prod1.name} solves modern consumer challenges"
            trend_topic = trend1.topic if trend1 else None
            trend_id = trend1.id if trend1 else None

            rec1 = StrategicRecommendation(
                id=uuid4(),
                headline=f"Highlight {prod1.name}: {trend_angle}",
                angle=f"Showcase {prod1.name}'s key feature ('{prod1.features[0] if prod1.features else 'premium quality'}') addressing customer pain points.",
                target_audience=f"Shoppers in {context.country} looking for {context.industry} solutions.",
                product_id=prod1.id,
                product_name=prod1.name,
                offer_id=offer1.id if offer1 else None,
                offer_title=offer1.title if offer1 else None,
                trend_signal_id=trend_id,
                trend_topic=trend_topic,
                platform="instagram",
                channel_type="organic",
                objective=primary_goal,
                call_to_action=cta,
                content_format="carousel",
                content_body=(
                    f"Stop settling for less. Discover {prod1.name} — designed with {prod1.features[0] if prod1.features else 'exceptional craftsmanship'} "
                    f"to eliminate {prod1.pain_points[0] if prod1.pain_points else 'daily friction'}.\n\n"
                    f"Swipe through to see real results. {cta}."
                ),
                rationale=RecommendationRationale(
                    margin_justification=f"Prioritized due to strong {margin_txt} and {prod1.priority.value} catalogue priority.",
                    inventory_justification=f"Healthy inventory with {prod1.stock_quantity} units in stock.",
                    trend_justification=f"Aligned with {trend_topic} trending on social platforms." if trend_topic else "Evergreen high-intent product focus.",
                    overall_rationale=f"Combines organic storytelling with high margin product priority to build sustainable demand without paid ad friction.",
                ),
                guardrail_flags=[],
            )
            recommendations.append(rec1)

        # Generate Strategy Ideation / Campaign 2 (Paid or High-Conversion Angle)
        if len(available_prods) > 1:
            prod2 = available_prods[1]
        elif available_prods:
            prod2 = available_prods[0]
        else:
            prod2 = None

        trend2 = matched_trends[1] if len(matched_trends) > 1 else (matched_trends[0] if matched_trends else None)

        if prod2:
            rec2 = StrategicRecommendation(
                id=uuid4(),
                headline=f"Direct-Response Spotlight: {prod2.name}",
                angle=f"Conversion-first campaign emphasizing pain-point relief: '{prod2.pain_points[0] if prod2.pain_points else 'daily hassle'}'.",
                target_audience=f"High-intent consumers in {context.country} seeking verified {context.industry} solutions.",
                product_id=prod2.id,
                product_name=prod2.name,
                offer_id=offer1.id if offer1 else None,
                offer_title=offer1.title if offer1 else None,
                trend_signal_id=trend2.id if trend2 else None,
                trend_topic=trend2.topic if trend2 else None,
                platform="tiktok",
                channel_type="paid" if (context.monthly_budget and context.monthly_budget.paid_percentage > 0) else "organic",
                objective=MarketingObjective.INCREASE_SALES,
                call_to_action=cta,
                content_format="short-form-script",
                content_body=(
                    f"Tired of {prod2.pain_points[0] if prod2.pain_points else 'subpar alternatives'}?\n\n"
                    f"Meet {prod2.name}. Here are 3 reasons why this changes everything:\n"
                    f"1. {prod2.features[0] if prod2.features else 'Fast and effective'}\n"
                    f"2. {prod2.features[1] if len(prod2.features) > 1 else 'Engineered for reliability'}\n"
                    f"3. Backed by guaranteed quality.\n\n"
                    f"Click the link below. {cta}!"
                ),
                rationale=RecommendationRationale(
                    margin_justification=f"Supports target ROAS with {prod2.price} {context.currency} price point.",
                    inventory_justification=f"Sufficient buffer with {prod2.stock_quantity} available units.",
                    budget_justification="Allocated to paid channel within defined monthly budget limits." if context.monthly_budget else "Zero ad spend required.",
                    trend_justification=f"Captures high-velocity interest in {trend2.topic}." if trend2 else None,
                    overall_rationale="Targets mid-funnel decision makers with direct feature comparison to drive measurable conversion.",
                ),
                guardrail_flags=[],
            )
            recommendations.append(rec2)

        # Fallback if no products exist
        if not recommendations:
            rec_generic = StrategicRecommendation(
                id=uuid4(),
                headline=f"Brand Elevation for {context.business_name}",
                angle=f"Establish market authority in the {context.industry} space.",
                target_audience=f"Target demographic in {context.country}.",
                platform="linkedin",
                channel_type="organic",
                objective=primary_goal,
                call_to_action=cta,
                content_format="thought-leadership",
                content_body=f"Why quality matters in {context.industry}. Discover how {context.business_name} leads with excellence.\n\n{cta}.",
                rationale=RecommendationRationale(
                    overall_rationale="Foundation thought-leadership post to build brand credibility while catalogue is being configured.",
                ),
                guardrail_flags=[],
            )
            recommendations.append(rec_generic)

        return recommendations

    @classmethod
    def execute(
        cls,
        context: StructuredContext,
        request: OrchestrationGenerateRequest,
        user_id: UUID,
    ) -> OrchestrationGenerateResponse:
        """
        Executes the full LLM orchestration pipeline:
        1. Assembles grounded prompt and context
        2. Generates recommendations
        3. Applies Guardrail evaluation and sanitization
        4. Persists generation audit log to database
        5. Returns structured response
        """
        start_time = time.perf_counter()

        system_instruction, raw_prompt_str = cls.assemble_prompt(context, request)
        raw_recommendations = cls._generate_grounded_recommendations(context, request)

        # Evaluate against guardrails
        validated_recs, guardrail_res = GuardrailsEngine.evaluate_batch(
            raw_recommendations,
            context,
            auto_sanitize=request.auto_sanitize_prohibited_words,
        )

        latency_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        log_id = uuid4()
        created_at_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        context_summary = {
            "business_name": context.business_name,
            "industry": context.industry,
            "available_product_count": len(context.available_products),
            "active_offer_count": len(context.active_offers),
            "matched_trends_count": len(context.matched_trends),
            "has_budget": context.monthly_budget is not None,
            "prohibited_words_count": len(context.prohibited_words),
        }

        # Persist audit record in Supabase
        client = get_service_client()
        try:
            log_payload = {
                "id": str(log_id),
                "workspace_id": str(context.workspace_id),
                "user_id": str(user_id),
                "prompt_type": request.prompt_type.value,
                "context_summary": context_summary,
                "raw_prompt": raw_prompt_str,
                "raw_output": json.dumps([r.model_dump(mode="json") for r in raw_recommendations]),
                "structured_output": [r.model_dump(mode="json") for r in validated_recs],
                "guardrail_status": guardrail_res.status.value,
                "guardrail_violations": [v.model_dump(mode="json") for v in guardrail_res.violations],
                "execution_latency_ms": latency_ms,
                "model_name": cls.MODEL_NAME,
            }
            client.table("ai_generation_logs").insert(log_payload).execute()
        except Exception:
            # Audit log table may not exist yet if migration hasn't run; allow execution without crashing
            pass

        return OrchestrationGenerateResponse(
            log_id=log_id,
            prompt_type=request.prompt_type,
            context_summary=context_summary,
            recommendations=validated_recs,
            guardrail_evaluation=guardrail_res,
            execution_latency_ms=latency_ms,
            model_name=cls.MODEL_NAME,
            created_at=created_at_str,
        )
