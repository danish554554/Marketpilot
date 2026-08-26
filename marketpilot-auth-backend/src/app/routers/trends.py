from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, require_roles
from app.schemas import (
    Role,
    TrendIngestRequest,
    TrendIngestResponse,
    TrendMatchResponse,
    TrendPlatform,
    TrendSignal,
    TrendSignalCreateRequest,
    TrendSignalUpdateRequest,
)
from app.services.trend_ingest_service import TrendIngestService
from app.supabase_client import get_service_client

router = APIRouter(prefix="/trends", tags=["Trend Intelligence"])
Administrator = Depends(require_roles(Role.ADMINISTRATOR))


def _storage_error(exc: Exception) -> HTTPException:
    error_text = str(exc).lower()
    if "trend_signals" in error_text and ("does not exist" in error_text or "42p01" in error_text):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trend intelligence storage is not configured. Run the Module 5 migration before using this endpoint.",
        )
    return HTTPException(status_code=503, detail="Trend intelligence storage is temporarily unavailable. Please try again later.")


def _trend_or_404(trend_id: UUID) -> dict:
    try:
        result = get_service_client().table("trend_signals").select("*").eq("id", str(trend_id)).maybe_single().execute()
    except Exception as exc:
        raise _storage_error(exc) from exc
    if result is None or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend signal not found.")
    return result.data


@router.get("", response_model=list[TrendSignal])
def list_trends(
    current_user: CurrentUser,
    platform: TrendPlatform | None = None,
    category: str | None = Query(default=None, min_length=1, max_length=100),
    min_confidence: int | None = Query(default=None, ge=1, le=100),
    max_age_days: int | None = Query(default=None, ge=1, le=365),
    is_active: bool = True,
) -> list[TrendSignal]:
    """Search and filter verified trend signals with freshness and confidence controls."""
    try:
        query = get_service_client().table("trend_signals").select("*").eq("is_active", is_active)
        if platform is not None:
            query = query.eq("platform", platform.value)
        if category is not None:
            query = query.ilike("category", f"%{category.strip()}%")
        if min_confidence is not None:
            query = query.gte("confidence_score", min_confidence)
        if max_age_days is not None:
            oldest_date = (date.today() - timedelta(days=max_age_days)).isoformat()
            query = query.gte("collection_date", oldest_date)

        result = query.order("collection_date", desc=True).order("confidence_score", desc=True).execute()
        return [TrendSignal.model_validate(row) for row in (result.data or [])]
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("/match", response_model=TrendMatchResponse)
def match_workspace_trends(current_user: CurrentUser) -> TrendMatchResponse:
    """Automatically retrieve active trend signals tailored to the caller's business workspace."""
    try:
        workspace_res = get_service_client().table("business_workspaces").select("industry,target_market").eq("owner_id", str(current_user.id)).maybe_single().execute()
        if not workspace_res or not workspace_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No business workspace found for your account. Create a workspace first to match trends.",
            )
        industry = workspace_res.data.get("industry", "").strip()

        # Query trends matching industry or general trends
        result = (
            get_service_client()
            .table("trend_signals")
            .select("*")
            .eq("is_active", True)
            .order("confidence_score", desc=True)
            .execute()
        )
        all_trends = result.data or []
        # Filter for industry matches or general trends
        matched_rows: list[dict] = []
        for row in all_trends:
            cat = (row.get("category") or "").lower()
            if industry.lower() in cat or cat in industry.lower() or row.get("platform") == "general" or cat == "general":
                matched_rows.append(row)

        trends_list = [TrendSignal.model_validate(row) for row in matched_rows]
        return TrendMatchResponse(
            industry=industry,
            total_matched=len(trends_list),
            trends=trends_list,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.post("/ingest", response_model=TrendIngestResponse)
def ingest_live_market_trends(
    current_user: CurrentUser,
    payload: TrendIngestRequest | None = None,
) -> TrendIngestResponse:
    """
    Automated real trend-data ingestion:
    Fetches trending signals from free Google Trends RSS & Reddit feeds,
    enriches them with Google Gemini AI, deduplicates, and saves them to the database.
    """
    req = payload or TrendIngestRequest()
    category_hint = req.category_hint

    # Default category to workspace industry if unspecified
    if not category_hint:
        try:
            workspace_res = get_service_client().table("business_workspaces").select("industry").eq("owner_id", str(current_user.id)).maybe_single().execute()
            if workspace_res and workspace_res.data:
                category_hint = workspace_res.data.get("industry")
        except Exception:
            pass

    try:
        result = TrendIngestService.ingest_live_trends(
            geo=req.geo,
            category_hint=category_hint,
            subreddits=req.subreddits,
            limit_per_source=req.limit_per_source,
        )
        return TrendIngestResponse.model_validate(result)
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("/{trend_id}", response_model=TrendSignal)
def get_trend(trend_id: UUID, current_user: CurrentUser) -> TrendSignal:
    """Retrieve full details of a specific trend signal."""
    data = _trend_or_404(trend_id)
    return TrendSignal.model_validate(data)


@router.post("", response_model=TrendSignal, status_code=status.HTTP_201_CREATED, dependencies=[Administrator])
def create_trend(payload: TrendSignalCreateRequest) -> TrendSignal:
    """Administrator-only: Ingest a verified trend signal with grounded evidence."""
    values = payload.model_dump(mode="json")
    try:
        result = get_service_client().table("trend_signals").insert(values).execute()
        return TrendSignal.model_validate(result.data[0])
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.patch("/{trend_id}", response_model=TrendSignal, dependencies=[Administrator])
def update_trend(trend_id: UUID, payload: TrendSignalUpdateRequest) -> TrendSignal:
    """Administrator-only: Update a trend signal."""
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return TrendSignal.model_validate(_trend_or_404(trend_id))
    try:
        result = get_service_client().table("trend_signals").update(changes).eq("id", str(trend_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Trend signal not found.")
        return TrendSignal.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.delete("/{trend_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Administrator])
def delete_trend(trend_id: UUID) -> None:
    """Administrator-only: Delete a trend signal."""
    try:
        result = get_service_client().table("trend_signals").delete().eq("id", str(trend_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Trend signal not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc
