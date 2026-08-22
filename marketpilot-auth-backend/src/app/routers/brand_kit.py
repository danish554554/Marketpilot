from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser
from app.schemas import BrandKit, BrandKitCreateRequest, BrandKitUpdateRequest, Role
from app.supabase_client import get_service_client

router = APIRouter(prefix="/brand-kit", tags=["Brand Kit"])


def _require_manager(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a business owner can manage the Brand Kit.")


def _workspace_id_for_current_user(current_user: CurrentUser) -> str:
    try:
        result = get_service_client().table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Business workspace storage is temporarily unavailable.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Create your business workspace before creating a Brand Kit.")
    return result.data["id"]


def _brand_kit_for_workspace(workspace_id: str) -> BrandKit:
    try:
        result = get_service_client().table("brand_kits").select("*").eq("workspace_id", workspace_id).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Brand Kit storage is temporarily unavailable. Run the Module 3 migration first.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="No Brand Kit exists for this workspace.")
    return BrandKit.model_validate(result.data)


@router.post("", response_model=BrandKit, status_code=status.HTTP_201_CREATED)
def create_brand_kit(payload: BrandKitCreateRequest, current_user: CurrentUser) -> BrandKit:
    _require_manager(current_user)
    workspace_id = _workspace_id_for_current_user(current_user)
    try:
        existing = get_service_client().table("brand_kits").select("id").eq("workspace_id", workspace_id).maybe_single().execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="This workspace already has a Brand Kit. Use PATCH to update it.")
        values = payload.model_dump(mode="json")
        values["workspace_id"] = workspace_id
        result = get_service_client().table("brand_kits").insert(values).execute()
        return BrandKit.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        if "brand_kits_workspace_id_key" in str(exc):
            raise HTTPException(status_code=409, detail="This workspace already has a Brand Kit.") from exc
        raise HTTPException(status_code=503, detail="Brand Kit storage is temporarily unavailable. Run the Module 3 migration first.") from exc


@router.get("/me", response_model=BrandKit)
def get_my_brand_kit(current_user: CurrentUser) -> BrandKit:
    _require_manager(current_user)
    return _brand_kit_for_workspace(_workspace_id_for_current_user(current_user))


@router.patch("/me", response_model=BrandKit)
def update_my_brand_kit(payload: BrandKitUpdateRequest, current_user: CurrentUser) -> BrandKit:
    _require_manager(current_user)
    workspace_id = _workspace_id_for_current_user(current_user)
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return _brand_kit_for_workspace(workspace_id)
    try:
        result = get_service_client().table("brand_kits").update(changes).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="No Brand Kit exists for this workspace.")
        return BrandKit.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Brand Kit storage is temporarily unavailable. Run the Module 3 migration first.") from exc
