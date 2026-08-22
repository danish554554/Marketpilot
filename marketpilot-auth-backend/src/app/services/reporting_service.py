from uuid import UUID

from app.schemas import (
    AIComplianceReport,
    HealthDimensionCheck,
    HealthScoreStatus,
    WorkspaceHealthReport,
)
from app.supabase_client import get_service_client


class ReportingService:
    """
    Reporting and Health Audit Engine for MarketPilot AI (Version 1).
    Evaluates workspace intelligence completeness and AI guardrail safety metrics.
    """

    @classmethod
    def calculate_workspace_health(cls, workspace_id: UUID) -> WorkspaceHealthReport:
        client = get_service_client()
        ws_str = str(workspace_id)
        now_str = "2026-08-22T10:30:00Z"

        # 1. Fetch workspace
        ws_res = client.table("business_workspaces").select("*").eq("id", ws_str).maybe_single().execute()
        ws = ws_res.data if ws_res else None
        business_name = ws.get("business_name", "My Business") if ws else "My Business"

        # 2. Fetch brand kit
        bk_res = client.table("brand_kits").select("*").eq("workspace_id", ws_str).maybe_single().execute()
        bk = bk_res.data if bk_res else None

        # 3. Fetch products
        prod_res = client.table("products").select("id, status, stock_quantity, cost_price, price").eq("workspace_id", ws_str).execute()
        prods = prod_res.data or []

        # 4. Fetch offers
        offer_res = client.table("offers").select("id, status").eq("workspace_id", ws_str).execute()
        offers = offer_res.data or []

        # 5. Fetch budget
        budg_res = client.table("marketing_budgets").select("*").eq("workspace_id", ws_str).maybe_single().execute()
        budg = budg_res.data if budg_res else None

        # 6. Fetch trends
        trend_res = client.table("trend_signals").select("id").eq("is_active", True).limit(5).execute()
        trends = trend_res.data or []

        # 7. Fetch active strategy
        strat_res = client.table("marketing_strategies").select("id, status").eq("workspace_id", ws_str).execute()
        strats = strat_res.data or []
        active_strats = [s for s in strats if s.get("status") in ("approved", "active")]

        # 8. Fetch scheduled planner items
        plan_res = client.table("planner_content_items").select("id, status").eq("workspace_id", ws_str).execute()
        plan_items = plan_res.data or []

        # Evaluate 8 Dimensions
        dimensions: list[HealthDimensionCheck] = []
        recommendations: list[str] = []

        # D1: Onboarding
        d1_passed = ws is not None and bool(ws.get("industry")) and bool(ws.get("country"))
        d1_score = 10 if d1_passed else 0
        dimensions.append(HealthDimensionCheck(
            dimension="Business Profile Onboarding",
            passed=d1_passed,
            score=d1_score,
            max_score=10,
            details=f"Industry: {ws.get('industry', 'N/A') if ws else 'Missing'}, Country: {ws.get('country', 'N/A') if ws else 'Missing'}",
        ))
        if not d1_passed:
            recommendations.append("Complete your business profile with industry, country, and marketing goals.")

        # D2: Brand Kit
        d2_passed = bk is not None and len(bk.get("brand_voice", [])) > 0 and len(bk.get("approved_cta_examples", [])) > 0
        d2_score = 15 if d2_passed else (8 if bk else 0)
        dimensions.append(HealthDimensionCheck(
            dimension="Brand Kit & Voice Directives",
            passed=d2_passed,
            score=d2_score,
            max_score=15,
            details=f"Voice descriptors: {len(bk.get('brand_voice', [])) if bk else 0}, Prohibited words: {len(bk.get('prohibited_words', [])) if bk else 0}",
        ))
        if not d2_passed:
            recommendations.append("Configure Brand Kit voice directives, prohibited words, and approved CTAs.")

        # D3: Product Catalogue & Margins
        in_stock_prods = [p for p in prods if p.get("status") == "active" and (p.get("stock_quantity") or 0) > 0]
        with_cost = [p for p in in_stock_prods if p.get("cost_price") is not None]
        d3_passed = len(in_stock_prods) >= 1 and len(with_cost) >= 1
        d3_score = 20 if (len(in_stock_prods) >= 3 and len(with_cost) >= 3) else (12 if d3_passed else 0)
        dimensions.append(HealthDimensionCheck(
            dimension="Product Catalogue & Margins",
            passed=d3_passed,
            score=d3_score,
            max_score=20,
            details=f"{len(in_stock_prods)} in-stock products ({len(with_cost)} with cost prices for profit margin calculations)",
        ))
        if not d3_passed:
            recommendations.append("Add active products with cost prices so the AI strategist can prioritize high-margin inventory.")

        # D4: Promotional Offers
        active_offers = [o for o in offers if o.get("status") == "active"]
        d4_passed = len(active_offers) >= 1
        d4_score = 10 if d4_passed else 4
        dimensions.append(HealthDimensionCheck(
            dimension="Promotions & Active Offers",
            passed=d4_passed,
            score=d4_score,
            max_score=10,
            details=f"{len(active_offers)} active promotional offers configured",
        ))
        if not d4_passed:
            recommendations.append("Create at least one promotional offer or seasonal discount.")

        # D5: Marketing Budget Allocation
        d5_passed = budg is not None and float(budg.get("total_monthly_budget", 0)) > 0
        d5_score = 15 if d5_passed else 0
        dimensions.append(HealthDimensionCheck(
            dimension="Marketing Budget Allocation",
            passed=d5_passed,
            score=d5_score,
            max_score=15,
            details=f"Budget: {budg.get('total_monthly_budget', '0') if budg else '0'} {budg.get('currency', 'USD') if budg else ''} ({budg.get('organic_percentage', 60) if budg else 60}% organic / {budg.get('paid_percentage', 40) if budg else 40}% paid)",
        ))
        if not d5_passed:
            recommendations.append("Set your monthly marketing budget and organic vs. paid split in Asset Library.")

        # D6: Trend Signals
        d6_passed = len(trends) >= 1
        d6_score = 10 if d6_passed else 5
        dimensions.append(HealthDimensionCheck(
            dimension="Market Trend Intelligence",
            passed=d6_passed,
            score=d6_score,
            max_score=10,
            details=f"{len(trends)} verified trend signals available for grounding",
        ))

        # D7: Active Strategy
        d7_passed = len(active_strats) >= 1
        d7_score = 10 if d7_passed else (5 if len(strats) >= 1 else 0)
        dimensions.append(HealthDimensionCheck(
            dimension="Marketing Strategy & Pillars",
            passed=d7_passed,
            score=d7_score,
            max_score=10,
            details=f"{len(strats)} total strategies ({len(active_strats)} active/approved)",
        ))
        if not d7_passed:
            recommendations.append("Generate and activate a marketing strategy using the Strategy Engine.")

        # D8: Scheduled Calendar
        d8_passed = len(plan_items) >= 3
        d8_score = 10 if d8_passed else (5 if len(plan_items) >= 1 else 0)
        dimensions.append(HealthDimensionCheck(
            dimension="Editorial Content Calendar",
            passed=d8_passed,
            score=d8_score,
            max_score=10,
            details=f"{len(plan_items)} scheduled content items in editorial calendar",
        ))
        if not d8_passed:
            recommendations.append("Batch generate a scheduled editorial calendar for the upcoming month.")

        total_score = sum(d.score for d in dimensions)
        if total_score >= 85:
            overall_status = HealthScoreStatus.excellent
        elif total_score >= 65:
            overall_status = HealthScoreStatus.good
        elif total_score >= 40:
            overall_status = HealthScoreStatus.needs_attention
        else:
            overall_status = HealthScoreStatus.incomplete

        return WorkspaceHealthReport(
            workspace_id=workspace_id,
            business_name=business_name,
            overall_score=total_score,
            status=overall_status,
            dimensions=dimensions,
            recommendations=recommendations,
            generated_at=now_str,
        )

    @classmethod
    def calculate_ai_compliance(cls, workspace_id: UUID) -> AIComplianceReport:
        client = get_service_client()
        ws_str = str(workspace_id)
        now_str = "2026-08-22T10:30:00Z"

        logs_res = client.table("ai_generation_logs").select("*").eq("workspace_id", ws_str).execute()
        logs = logs_res.data or []

        total = len(logs)
        if total == 0:
            return AIComplianceReport(
                workspace_id=workspace_id,
                total_generations=0,
                pass_rate_percentage=100.0,
                clean_passes=0,
                warnings_count=0,
                sanitized_count=0,
                failed_count=0,
                violations_by_type={},
                average_latency_ms=0.0,
                generated_at=now_str,
            )

        clean_passes = 0
        warnings = 0
        sanitized = 0
        failed = 0
        violations_map: dict[str, int] = {}
        total_latency = 0

        for log in logs:
            st = log.get("guardrail_status", "passed")
            if st == "passed":
                clean_passes += 1
            elif st == "warnings":
                warnings += 1
            elif st == "sanitized":
                sanitized += 1
            elif st == "failed":
                failed += 1

            total_latency += log.get("execution_latency_ms", 0)

            for v in log.get("guardrail_violations", []):
                v_type = v.get("violation_type", "other")
                violations_map[v_type] = violations_map.get(v_type, 0) + 1

        pass_rate = round(((clean_passes + warnings + sanitized) / total) * 100, 2)
        avg_latency = round(total_latency / total, 2)

        return AIComplianceReport(
            workspace_id=workspace_id,
            total_generations=total,
            pass_rate_percentage=pass_rate,
            clean_passes=clean_passes,
            warnings_count=warnings,
            sanitized_count=sanitized,
            failed_count=failed,
            violations_by_type=violations_map,
            average_latency_ms=avg_latency,
            generated_at=now_str,
        )
