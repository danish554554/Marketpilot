from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.schemas import (
    BrandKit,
    MarginTier,
    MarketingBudget,
    MarketingObjective,
    Offer,
    OfferStatus,
    PlannerProduct,
    ProductPriority,
    ProductStatus,
    StructuredContext,
    TrendPlatform,
    TrendSignal,
)
from app.supabase_client import get_service_client


def build_structured_context(workspace_id: UUID) -> StructuredContext:
    """
    Compiles the complete business intelligence context for a workspace,
    including workspace details, brand kit, active in-stock products with margins,
    active offers, marketing budget, and matching trend signals.
    """
    client = get_service_client()
    today = date.today().isoformat()

    # 1. Fetch Workspace
    try:
        ws_res = client.table("business_workspaces").select("*").eq("id", str(workspace_id)).limit(1).execute()
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to query workspace data: {exc.message}",
        ) from exc

    if not ws_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )
    ws = ws_res.data[0]

    # 2. Fetch Brand Kit
    try:
        bk_res = client.table("brand_kits").select("*").eq("workspace_id", str(workspace_id)).limit(1).execute()
        bk = bk_res.data[0] if bk_res.data else {}
    except Exception:
        bk = {}

    brand_voice = bk.get("brand_voice") or []
    prohibited_words = bk.get("prohibited_words") or []
    approved_ctas = bk.get("approved_cta_examples") or []

    # 3. Fetch Active Offers
    active_offers: list[Offer] = []
    try:
        offers_res = client.table("offers").select("*").eq("workspace_id", str(workspace_id)).eq("status", "active").execute()
        raw_offers = offers_res.data or []
        for o in raw_offers:
            # check date validity
            s_date = o.get("start_date")
            e_date = o.get("end_date")
            if s_date and s_date > today:
                continue
            if e_date and e_date < today:
                continue
            active_offers.append(Offer(**o))
    except Exception:
        pass

    # 4. Fetch Products (Active and In-Stock only)
    available_products: list[PlannerProduct] = []
    try:
        prod_res = (
            client.table("products")
            .select("*")
            .eq("workspace_id", str(workspace_id))
            .eq("status", "active")
            .gt("stock_quantity", 0)
            .order("priority", desc=False)
            .execute()
        )
        raw_products = prod_res.data or []
        for p in raw_products:
            from decimal import Decimal as D
            price = D(str(p["price"])) if p.get("price") else None
            cost = D(str(p["cost_price"])) if p.get("cost_price") else None
            margin = round((price - cost) / price * 100, 2) if price and cost and price > 0 else None
            margin_tier = None
            if margin is not None:
                if margin < 30:
                    margin_tier = MarginTier.LOW
                elif margin < 60:
                    margin_tier = MarginTier.MEDIUM
                else:
                    margin_tier = MarginTier.HIGH

            p_id = p.get("id")
            matching_offers = [
                o for o in active_offers
                if o.applicable_product_ids is None or len(o.applicable_product_ids) == 0 or (p_id and UUID(str(p_id)) in o.applicable_product_ids)
            ]
            active_offer_title = matching_offers[0].title if matching_offers else None

            planner_prod = PlannerProduct(
                id=UUID(str(p["id"])),
                name=p["name"],
                description=p.get("description", ""),
                category=p.get("category"),
                price=p["price"],
                cost_price=p.get("cost_price"),
                profit_margin=margin,
                margin_tier=margin_tier,
                stock_quantity=p.get("stock_quantity", 0),
                priority=p.get("priority", ProductPriority.NORMAL),
                features=p.get("features") or [],
                pain_points=p.get("pain_points") or [],
                is_on_offer=active_offer_title is not None,
                active_offer_title=active_offer_title,
            )
            available_products.append(planner_prod)
    except Exception:
        pass

    # 5. Fetch Marketing Budget
    monthly_budget: MarketingBudget | None = None
    try:
        budget_res = client.table("marketing_budgets").select("*").eq("workspace_id", str(workspace_id)).limit(1).execute()
        if budget_res.data:
            monthly_budget = MarketingBudget(**budget_res.data[0])
    except Exception:
        pass

    # 6. Fetch Matched Trends
    matched_trends: list[TrendSignal] = []
    try:
        industry = ws.get("industry", "").strip()
        trends_res = client.table("trend_signals").select("*").eq("is_active", True).order("confidence_score", desc=True).limit(20).execute()
        raw_trends = trends_res.data or []
        
        industry_lower = industry.lower()
        for t in raw_trends:
            cat = (t.get("category") or "").lower()
            topic = (t.get("topic") or "").lower()
            platform = (t.get("platform") or "").lower()
            
            # Match if industry matches category/topic or platform is general
            if platform == "general" or industry_lower in cat or cat in industry_lower or industry_lower in topic:
                matched_trends.append(TrendSignal(**t))
                if len(matched_trends) >= 5:
                    break
        
        # If no direct matches, include top general/highest-confidence trends
        if len(matched_trends) < 3 and raw_trends:
            for t in raw_trends:
                t_obj = TrendSignal(**t)
                if t_obj not in matched_trends:
                    matched_trends.append(t_obj)
                    if len(matched_trends) >= 5:
                        break
    except Exception:
        pass

    # Assemble and return StructuredContext
    raw_goals = ws.get("marketing_goals") or []
    goals: list[MarketingObjective] = []
    for g in raw_goals:
        try:
            goals.append(MarketingObjective(g))
        except Exception:
            pass
    if not goals:
        goals = [MarketingObjective.INCREASE_PRODUCT_AWARENESS]

    return StructuredContext(
        workspace_id=UUID(ws["id"]),
        business_name=ws.get("business_name", "Business"),
        industry=ws.get("industry", "General"),
        country=ws.get("country", "US"),
        currency=ws.get("currency", "USD"),
        marketing_goals=goals,
        brand_voice=brand_voice,
        prohibited_words=prohibited_words,
        approved_ctas=approved_ctas,
        available_products=available_products,
        active_offers=active_offers,
        monthly_budget=monthly_budget,
        matched_trends=matched_trends,
    )
