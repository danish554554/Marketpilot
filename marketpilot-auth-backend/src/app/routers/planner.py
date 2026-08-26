from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError

from app.dependencies import CurrentUser
from app.schemas import (
    BatchGenerateContentRequest,
    BatchGenerateContentResponse,
    CampaignChannel,
    ContentFormat,
    ContentStatus,
    EditorialCalendarResponse,
    PlannerContentItemCreateRequest,
    PlannerContentItemResponse,
    PlannerContentItemUpdateRequest,
    Role,
)
from app.services.context_builder import build_structured_context
from app.services.planner_service import PlannerService
from app.supabase_client import get_service_client

router = APIRouter(prefix="/planner", tags=["Planner & Editorial Calendar"])


def _require_manager_or_admin(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a business owner or administrator can access the marketing planner.",
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


def _format_item_row(r: dict) -> PlannerContentItemResponse:
    prod = r.pop("products", None)
    off = r.pop("offers", None)
    trend = r.pop("trend_signals", None)
    strat = r.pop("marketing_strategies", None)
    pil = r.pop("strategy_campaign_pillars", None)

    if prod and isinstance(prod, dict):
        r["product_name"] = prod.get("name")
    if off and isinstance(off, dict):
        r["offer_title"] = off.get("title")
    if trend and isinstance(trend, dict):
        r["trend_topic"] = trend.get("topic")
    if strat and isinstance(strat, dict):
        r["strategy_title"] = strat.get("title")
    if pil and isinstance(pil, dict):
        r["pillar_name"] = pil.get("pillar_name")

    return PlannerContentItemResponse(**r)


@router.post("/generate-batch", response_model=BatchGenerateContentResponse, status_code=status.HTTP_200_OK)
def generate_batch_calendar(
    payload: BatchGenerateContentRequest,
    current_user: CurrentUser,
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> BatchGenerateContentResponse:
    """
    Batch generates a complete, scheduled editorial marketing calendar and copywriting package
    grounded against the workspace Brand Kit, product catalogue, offers, and strategy pillars.
    """
    _require_manager_or_admin(current_user)

    target_ws_id: str
    if workspace_id and current_user.role == Role.ADMINISTRATOR:
        target_ws_id = str(workspace_id)
    else:
        target_ws_id = _workspace_id_for_current_user(current_user)

    context = build_structured_context(UUID(target_ws_id))
    return PlannerService.batch_generate_calendar(context=context, request=payload, user_id=current_user.id)


@router.get("/calendar", response_model=EditorialCalendarResponse)
def get_editorial_calendar(
    current_user: CurrentUser,
    start_date: date = Query(description="Start date for calendar view"),
    end_date: date = Query(description="End date for calendar view"),
    channel: CampaignChannel | None = None,
    content_status: ContentStatus | None = Query(default=None, alias="status"),
) -> EditorialCalendarResponse:
    """
    Retrieves the scheduled editorial calendar items within a given date range.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    try:
        query = (
            client.table("planner_content_items")
            .select("*, products(name), offers(title), trend_signals(topic), marketing_strategies(title), strategy_campaign_pillars(pillar_name)")
            .eq("workspace_id", ws_id)
            .gte("scheduled_date", str(start_date))
            .lte("scheduled_date", str(end_date))
        )
        if channel:
            query = query.eq("channel", channel.value)
        if content_status:
            query = query.eq("status", content_status.value)

        res = query.order("scheduled_date", desc=False).order("scheduled_time_slot").execute()
        items = [_format_item_row(r) for r in (res.data or [])]

        return EditorialCalendarResponse(
            start_date=start_date,
            end_date=end_date,
            total_items=len(items),
            items=items,
        )
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Planner storage error: {exc.message}. Please apply the Module 8 migration.",
        ) from exc


@router.post("/items", response_model=PlannerContentItemResponse, status_code=status.HTTP_201_CREATED)
def create_planner_item(
    payload: PlannerContentItemCreateRequest,
    current_user: CurrentUser,
) -> PlannerContentItemResponse:
    """
    Manually creates and schedules a single content item on the marketing calendar.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    item_data = payload.model_dump(mode="json")
    item_data["workspace_id"] = ws_id
    item_data["created_by"] = str(current_user.id)

    try:
        res = client.table("planner_content_items").insert(item_data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create planner content item.")
        return PlannerContentItemResponse(**res.data[0])
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Planner storage error: {exc.message}. Please apply the Module 8 migration.",
        ) from exc


@router.get("/items", response_model=list[PlannerContentItemResponse])
def list_planner_items(
    current_user: CurrentUser,
    channel: CampaignChannel | None = None,
    content_format: ContentFormat | None = Query(default=None, alias="format"),
    content_status: ContentStatus | None = Query(default=None, alias="status"),
    strategy_id: UUID | None = None,
    pillar_id: UUID | None = None,
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[PlannerContentItemResponse]:
    """
    Lists scheduled marketing content items with pagination and filters.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    try:
        query = (
            client.table("planner_content_items")
            .select("*, products(name), offers(title), trend_signals(topic), marketing_strategies(title), strategy_campaign_pillars(pillar_name)")
            .eq("workspace_id", ws_id)
        )
        if channel:
            query = query.eq("channel", channel.value)
        if content_format:
            query = query.eq("format", content_format.value)
        if content_status:
            query = query.eq("status", content_status.value)
        if strategy_id:
            query = query.eq("strategy_id", str(strategy_id))
        if pillar_id:
            query = query.eq("pillar_id", str(pillar_id))

        res = query.order("scheduled_date", desc=False).range(offset, offset + limit - 1).execute()
        return [_format_item_row(r) for r in (res.data or [])]
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Planner storage error: {exc.message}. Please apply the Module 8 migration.",
        ) from exc


@router.get("/items/{item_id}", response_model=PlannerContentItemResponse)
def get_planner_item(item_id: UUID, current_user: CurrentUser) -> PlannerContentItemResponse:
    """
    Retrieves the complete details of a scheduled content item.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()

    try:
        res = (
            client.table("planner_content_items")
            .select("*, products(name), offers(title), trend_signals(topic), marketing_strategies(title), strategy_campaign_pillars(pillar_name)")
            .eq("id", str(item_id))
            .maybe_single()
            .execute()
        )
        if not res or not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found.")
        row = res.data
        if current_user.role != Role.ADMINISTRATOR:
            ws_id = _workspace_id_for_current_user(current_user)
            if row.get("workspace_id") != ws_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        return _format_item_row(row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Planner storage error: {str(exc)}",
        ) from exc


@router.patch("/items/{item_id}", response_model=PlannerContentItemResponse)
def update_planner_item(
    item_id: UUID,
    payload: PlannerContentItemUpdateRequest,
    current_user: CurrentUser,
) -> PlannerContentItemResponse:
    """
    Updates copy, scheduled date, channel, or status (e.g. mark as published) for a content item.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()
    ws_id = _workspace_id_for_current_user(current_user)

    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return get_planner_item(item_id, current_user)

    try:
        res = (
            client.table("planner_content_items")
            .update(changes)
            .eq("id", str(item_id))
            .eq("workspace_id", ws_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found.")
        return get_planner_item(item_id, current_user)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Planner storage error: {str(exc)}",
        ) from exc


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planner_item(item_id: UUID, current_user: CurrentUser) -> None:
    """
    Deletes a scheduled content item from the calendar.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()
    ws_id = _workspace_id_for_current_user(current_user)

    try:
        client.table("planner_content_items").delete().eq("id", str(item_id)).eq("workspace_id", ws_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to delete planner item: {str(exc)}",
        ) from exc


@router.post("/generate-copy", response_model=CopyGenerationResponse, status_code=status.HTTP_200_OK)
def generate_copy(
    payload: CopyGenerationRequest,
    current_user: CurrentUser,
) -> CopyGenerationResponse:
    """
    Generates rich, product-grounded marketing copy and video scripts using Google Gemini 3.6 Flash.
    """
    from app.services.gemini_service import GeminiService

    result = GeminiService.generate_content_copy(
        product_name=payload.product_name,
        product_description=payload.product_description,
        product_features=payload.product_features,
        product_pain_points=payload.product_pain_points,
        channel=payload.channel,
        format_type=payload.format,
        trend_topic=payload.trend_topic,
        hook_idea=payload.hook_idea,
        custom_instructions=payload.custom_instructions,
    )

    return CopyGenerationResponse(
        hook=result["hook"],
        caption=result["caption"],
        call_to_action=result["call_to_action"],
        hashtags=result["hashtags"],
        channel=payload.channel,
        format=payload.format,
        ai_model_used=GeminiService.get_model_name(),
    )
