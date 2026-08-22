from datetime import date as date_type
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUser
from app.schemas import Offer, OfferCreateRequest, OfferStatus, OfferUpdateRequest, Role
from app.supabase_client import get_service_client

router = APIRouter(prefix="/offers", tags=["Offers and Promotions"])


def _require_manager(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a business owner can manage offers.")


def _current_workspace_id(current_user: CurrentUser) -> str:
    try:
        result = get_service_client().table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Business workspace storage is temporarily unavailable.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Create your business workspace before managing offers.")
    return result.data["id"]


def _offer_or_404(offer_id: UUID, workspace_id: str) -> dict:
    try:
        result = get_service_client().table("offers").select("*").eq("id", str(offer_id)).eq("workspace_id", workspace_id).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Offer storage is temporarily unavailable. Run the offers migration first.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Offer not found.")
    return result.data


def _storage_error(exc: Exception) -> HTTPException:
    error_text = str(exc).lower()
    if "offers" in error_text and ("does not exist" in error_text or "42p01" in error_text):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Offer storage is not configured. Run the Module 4 offers migration before using this endpoint.",
        )
    return HTTPException(status_code=503, detail="Offer storage is temporarily unavailable. Please try again later.")


@router.post("", response_model=Offer, status_code=status.HTTP_201_CREATED)
def create_offer(payload: OfferCreateRequest, current_user: CurrentUser) -> Offer:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    # Verify the product belongs to this workspace if a product_id is provided.
    if payload.product_id is not None:
        try:
            product_result = get_service_client().table("products").select("id").eq("id", str(payload.product_id)).eq("workspace_id", workspace_id).maybe_single().execute()
            if product_result is None or not product_result.data:
                raise HTTPException(status_code=404, detail="Product not found in this workspace.")
        except HTTPException:
            raise
        except Exception as exc:
            raise _storage_error(exc) from exc
    values = payload.model_dump(mode="json")
    values["workspace_id"] = workspace_id
    try:
        result = get_service_client().table("offers").insert(values).execute()
        return Offer.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("", response_model=list[Offer])
def list_offers(
    current_user: CurrentUser,
    offer_status: OfferStatus | None = Query(default=None, alias="status"),
    product_id: UUID | None = None,
) -> list[Offer]:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        query = get_service_client().table("offers").select("*").eq("workspace_id", workspace_id)
        if offer_status is not None:
            query = query.eq("status", offer_status.value)
        if product_id is not None:
            query = query.eq("product_id", str(product_id))
        result = query.order("created_at", desc=True).execute()
        return [Offer.model_validate(row) for row in result.data]
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("/active", response_model=list[Offer])
def list_active_offers(current_user: CurrentUser) -> list[Offer]:
    """Return only offers that are active and whose date range covers today."""
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        today = date_type.today().isoformat()
        result = (
            get_service_client()
            .table("offers")
            .select("*")
            .eq("workspace_id", workspace_id)
            .eq("status", "active")
            .lte("start_date", today)
            .gte("end_date", today)
            .order("created_at", desc=True)
            .execute()
        )
        return [Offer.model_validate(row) for row in result.data]
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("/{offer_id}", response_model=Offer)
def get_offer(offer_id: UUID, current_user: CurrentUser) -> Offer:
    _require_manager(current_user)
    data = _offer_or_404(offer_id, _current_workspace_id(current_user))
    return Offer.model_validate(data)


@router.patch("/{offer_id}", response_model=Offer)
def update_offer(offer_id: UUID, payload: OfferUpdateRequest, current_user: CurrentUser) -> Offer:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return Offer.model_validate(_offer_or_404(offer_id, workspace_id))
    try:
        result = get_service_client().table("offers").update(changes).eq("id", str(offer_id)).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Offer not found.")
        return Offer.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer(offer_id: UUID, current_user: CurrentUser) -> None:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        result = get_service_client().table("offers").delete().eq("id", str(offer_id)).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Offer not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc
