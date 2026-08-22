from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import require_roles
from app.schemas import Role, RoleUpdateRequest, UserProfile
from app.supabase_client import get_service_client

router = APIRouter(prefix="/admin", tags=["Administration"])
Administrator = Depends(require_roles(Role.ADMINISTRATOR))


@router.get("/users", response_model=list[UserProfile], dependencies=[Administrator])
def list_users() -> list[UserProfile]:
    result = get_service_client().table("profiles").select("id,email,full_name,avatar_url,role").order("created_at", desc=True).execute()
    return [UserProfile.model_validate(item) for item in result.data]


@router.patch("/users/{user_id}/role", response_model=UserProfile, dependencies=[Administrator])
def update_role(user_id: UUID, payload: RoleUpdateRequest) -> UserProfile:
    try:
        result = get_service_client().table("profiles").update({"role": payload.role.value}).eq("id", str(user_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return UserProfile.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to change user role.") from exc
