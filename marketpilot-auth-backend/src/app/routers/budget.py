from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser
from app.schemas import MarketingBudget, MarketingBudgetCreateRequest, MarketingBudgetUpdateRequest, Role
from app.supabase_client import get_service_client

router = APIRouter(prefix="/budget", tags=["Marketing Budget"])


def _require_manager(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a business owner can manage the marketing budget.")


def _current_workspace_id(current_user: CurrentUser) -> str:
    try:
        result = get_service_client().table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Business workspace storage is temporarily unavailable.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Create your business workspace before setting a marketing budget.")
    return result.data["id"]


def _budget_for_workspace(workspace_id: str) -> MarketingBudget:
    try:
        result = get_service_client().table("marketing_budgets").select("*").eq("workspace_id", workspace_id).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Marketing budget storage is temporarily unavailable. Run the budget migration first.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="No marketing budget has been set for this workspace.")
    return MarketingBudget.model_validate(result.data)


def _storage_error(exc: Exception) -> HTTPException:
    error_text = str(exc).lower()
    if "marketing_budgets" in error_text and ("does not exist" in error_text or "42p01" in error_text):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Marketing budget storage is not configured. Run the Module 4 budget migration before using this endpoint.",
        )
    return HTTPException(status_code=503, detail="Marketing budget storage is temporarily unavailable. Please try again later.")


@router.post("", response_model=MarketingBudget, status_code=status.HTTP_201_CREATED)
def create_budget(payload: MarketingBudgetCreateRequest, current_user: CurrentUser) -> MarketingBudget:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        existing = get_service_client().table("marketing_budgets").select("id").eq("workspace_id", workspace_id).maybe_single().execute()
        if existing and existing.data:
            raise HTTPException(status_code=409, detail="This workspace already has a marketing budget. Use PATCH to update it.")
        values = payload.model_dump(mode="json")
        values["workspace_id"] = workspace_id
        result = get_service_client().table("marketing_budgets").insert(values).execute()
        return MarketingBudget.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        if "marketing_budgets_workspace_id_key" in str(exc):
            raise HTTPException(status_code=409, detail="This workspace already has a marketing budget.") from exc
        raise _storage_error(exc) from exc


@router.get("/me", response_model=MarketingBudget)
def get_my_budget(current_user: CurrentUser) -> MarketingBudget:
    _require_manager(current_user)
    return _budget_for_workspace(_current_workspace_id(current_user))


@router.patch("/me", response_model=MarketingBudget)
def update_my_budget(payload: MarketingBudgetUpdateRequest, current_user: CurrentUser) -> MarketingBudget:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return _budget_for_workspace(workspace_id)
    # If only one percentage is being updated, we need to validate the sum.
    # Fetch current values to check the constraint.
    if ("organic_percentage" in changes) != ("paid_percentage" in changes):
        current = _budget_for_workspace(workspace_id)
        from decimal import Decimal
        organic = Decimal(str(changes.get("organic_percentage", current.organic_percentage)))
        paid = Decimal(str(changes.get("paid_percentage", current.paid_percentage)))
        if organic + paid != Decimal("100.00"):
            raise HTTPException(
                status_code=422,
                detail=f"organic_percentage and paid_percentage must sum to 100. "
                       f"With this change the sum would be {organic + paid}. "
                       f"Send both percentages together.",
            )
    try:
        result = get_service_client().table("marketing_budgets").update(changes).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="No marketing budget has been set for this workspace.")
        return MarketingBudget.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc
