from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError

from app.dependencies import CurrentUser
from app.schemas import (
    CampaignPillarCreateRequest,
    CampaignPillarResponse,
    CampaignPillarUpdateRequest,
    MarketingStrategyCreateRequest,
    MarketingStrategyListResponse,
    MarketingStrategyResponse,
    MarketingStrategyUpdateRequest,
    Role,
    StrategyGenerateRequest,
    StrategyStatus,
    StrategyTimeframe,
)
from app.services.context_builder import build_structured_context
from app.services.strategy_engine import StrategyEngine
from app.supabase_client import get_service_client

router = APIRouter(prefix="/strategy", tags=["Strategy Engine"])


def _require_manager_or_admin(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a business owner or administrator can access marketing strategies.",
        )


def _workspace_id_for_current_user(current_user: CurrentUser) -> str:
    try:
        result = (
            get_service_client()
            .table("business_workspaces")
            .select("id")
            .eq("owner_id", str(current_user.id))
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business workspace storage is temporarily unavailable.",
        ) from exc
    if result is None or not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please create your business workspace first.",
        )
    return result.data["id"]


def _fetch_pillars_for_strategy(strategy_id: str) -> list[CampaignPillarResponse]:
    try:
        res = (
            get_service_client()
            .table("strategy_campaign_pillars")
            .select("*, products(name), offers(title), trend_signals(topic)")
            .eq("strategy_id", strategy_id)
            .order("order_index", desc=False)
            .execute()
        )
        pillars: list[CampaignPillarResponse] = []
        for r in res.data or []:
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
        return pillars
    except Exception:
        return []


@router.post("/generate", response_model=MarketingStrategyResponse, status_code=status.HTTP_200_OK)
def generate_marketing_strategy(
    payload: StrategyGenerateRequest,
    current_user: CurrentUser,
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> MarketingStrategyResponse:
    """
    Generates a full AI marketing strategy with product prioritization by margin tier,
    organic/paid budget allocation, and actionable campaign pillars.
    """
    _require_manager_or_admin(current_user)

    target_ws_id: str
    if workspace_id and current_user.role == Role.ADMINISTRATOR:
        target_ws_id = str(workspace_id)
    else:
        target_ws_id = _workspace_id_for_current_user(current_user)

    context = build_structured_context(UUID(target_ws_id))
    return StrategyEngine.generate_strategy(context=context, request=payload, user_id=current_user.id)


@router.post("", response_model=MarketingStrategyResponse, status_code=status.HTTP_201_CREATED)
def create_marketing_strategy(
    payload: MarketingStrategyCreateRequest,
    current_user: CurrentUser,
) -> MarketingStrategyResponse:
    """
    Manually creates a new marketing strategy with custom campaign pillars.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    strat_data = payload.model_dump(exclude={"pillars"}, mode="json")
    strat_data["workspace_id"] = ws_id
    strat_data["created_by"] = str(current_user.id)
    strat_data["status"] = StrategyStatus.draft.value

    try:
        strat_res = client.table("marketing_strategies").insert(strat_data).execute()
        if not strat_res.data:
            raise HTTPException(status_code=500, detail="Failed to persist marketing strategy.")
        created_strat = strat_res.data[0]
        strat_id = created_strat["id"]

        pillar_responses: list[CampaignPillarResponse] = []
        if payload.pillars:
            pillar_rows = []
            for p in payload.pillars:
                p_row = p.model_dump(mode="json")
                p_row["strategy_id"] = strat_id
                pillar_rows.append(p_row)
            p_res = client.table("strategy_campaign_pillars").insert(pillar_rows).execute()
            for r in p_res.data or []:
                pillar_responses.append(CampaignPillarResponse(**r))

        created_strat["pillars"] = pillar_responses
        return MarketingStrategyResponse(**created_strat)
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Strategy storage error: {exc.message}. Please apply the Module 7 migration.",
        ) from exc


@router.get("", response_model=MarketingStrategyListResponse)
def list_marketing_strategies(
    current_user: CurrentUser,
    strategy_status: StrategyStatus | None = Query(default=None, alias="status"),
    timeframe: StrategyTimeframe | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> MarketingStrategyListResponse:
    """
    Lists marketing strategies for the caller's workspace.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    try:
        query = client.table("marketing_strategies").select("*").eq("workspace_id", ws_id)
        if strategy_status:
            query = query.eq("status", strategy_status.value)
        if timeframe:
            query = query.eq("timeframe", timeframe.value)

        res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        strategies: list[MarketingStrategyResponse] = []
        for row in res.data or []:
            row["pillars"] = _fetch_pillars_for_strategy(row["id"])
            strategies.append(MarketingStrategyResponse(**row))

        return MarketingStrategyListResponse(strategies=strategies, total_count=len(strategies))
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Strategy storage error: {exc.message}. Please apply the Module 7 migration.",
        ) from exc


@router.get("/active", response_model=MarketingStrategyResponse)
def get_active_marketing_strategy(current_user: CurrentUser) -> MarketingStrategyResponse:
    """
    Retrieves the currently active marketing strategy for the workspace.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    try:
        res = (
            client.table("marketing_strategies")
            .select("*")
            .eq("workspace_id", ws_id)
            .eq("status", StrategyStatus.active.value)
            .order("updated_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        if not res or not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active marketing strategy found.")
        row = res.data
        row["pillars"] = _fetch_pillars_for_strategy(row["id"])
        return MarketingStrategyResponse(**row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Strategy storage error: {str(exc)}",
        ) from exc


@router.get("/{strategy_id}", response_model=MarketingStrategyResponse)
def get_marketing_strategy(strategy_id: UUID, current_user: CurrentUser) -> MarketingStrategyResponse:
    """
    Retrieves a specific marketing strategy by ID including its campaign pillars.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()

    try:
        res = client.table("marketing_strategies").select("*").eq("id", str(strategy_id)).maybe_single().execute()
        if not res or not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketing strategy not found.")
        row = res.data
        if current_user.role != Role.ADMINISTRATOR:
            ws_id = _workspace_id_for_current_user(current_user)
            if row.get("workspace_id") != ws_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this strategy.")

        row["pillars"] = _fetch_pillars_for_strategy(str(strategy_id))
        return MarketingStrategyResponse(**row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Strategy storage error: {str(exc)}",
        ) from exc


@router.patch("/{strategy_id}", response_model=MarketingStrategyResponse)
def update_marketing_strategy(
    strategy_id: UUID,
    payload: MarketingStrategyUpdateRequest,
    current_user: CurrentUser,
) -> MarketingStrategyResponse:
    """
    Updates marketing strategy metadata or status (e.g. approve or activate).
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()
    ws_id = _workspace_id_for_current_user(current_user)

    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return get_marketing_strategy(strategy_id, current_user)

    try:
        res = (
            client.table("marketing_strategies")
            .update(changes)
            .eq("id", str(strategy_id))
            .eq("workspace_id", ws_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketing strategy not found.")
        row = res.data[0]
        row["pillars"] = _fetch_pillars_for_strategy(str(strategy_id))
        return MarketingStrategyResponse(**row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Strategy storage error: {str(exc)}",
        ) from exc


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_marketing_strategy(strategy_id: UUID, current_user: CurrentUser) -> None:
    """
    Deletes a marketing strategy and its associated campaign pillars.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()
    ws_id = _workspace_id_for_current_user(current_user)

    try:
        client.table("marketing_strategies").delete().eq("id", str(strategy_id)).eq("workspace_id", ws_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to delete strategy: {str(exc)}",
        ) from exc


@router.post("/{strategy_id}/pillars", response_model=CampaignPillarResponse, status_code=status.HTTP_201_CREATED)
def add_campaign_pillar(
    strategy_id: UUID,
    payload: CampaignPillarCreateRequest,
    current_user: CurrentUser,
) -> CampaignPillarResponse:
    """
    Adds a new campaign pillar to an existing strategy.
    """
    _require_manager_or_admin(current_user)
    # verify strategy ownership
    _ = get_marketing_strategy(strategy_id, current_user)

    client = get_service_client()
    data = payload.model_dump(mode="json")
    data["strategy_id"] = str(strategy_id)

    try:
        res = client.table("strategy_campaign_pillars").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to add campaign pillar.")
        return CampaignPillarResponse(**res.data[0])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to add pillar: {str(exc)}",
        ) from exc


@router.patch("/{strategy_id}/pillars/{pillar_id}", response_model=CampaignPillarResponse)
def update_campaign_pillar(
    strategy_id: UUID,
    pillar_id: UUID,
    payload: CampaignPillarUpdateRequest,
    current_user: CurrentUser,
) -> CampaignPillarResponse:
    """
    Updates a specific campaign pillar within a strategy.
    """
    _require_manager_or_admin(current_user)
    _ = get_marketing_strategy(strategy_id, current_user)

    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        client = get_service_client()
        res = client.table("strategy_campaign_pillars").select("*").eq("id", str(pillar_id)).maybe_single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Pillar not found.")
        return CampaignPillarResponse(**res.data)

    client = get_service_client()
    try:
        res = (
            client.table("strategy_campaign_pillars")
            .update(changes)
            .eq("id", str(pillar_id))
            .eq("strategy_id", str(strategy_id))
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Pillar not found.")
        return CampaignPillarResponse(**res.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to update pillar: {str(exc)}",
        ) from exc


@router.delete("/{strategy_id}/pillars/{pillar_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign_pillar(
    strategy_id: UUID,
    pillar_id: UUID,
    current_user: CurrentUser,
) -> None:
    """
    Deletes a campaign pillar.
    """
    _require_manager_or_admin(current_user)
    _ = get_marketing_strategy(strategy_id, current_user)

    client = get_service_client()
    try:
        client.table("strategy_campaign_pillars").delete().eq("id", str(pillar_id)).eq("strategy_id", str(strategy_id)).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to delete pillar: {str(exc)}",
        ) from exc
