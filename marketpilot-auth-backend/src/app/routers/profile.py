from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser
from app.schemas import ProfileUpdateRequest, UserProfile
from app.supabase_client import get_service_client

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfile)
def get_profile(current_user: CurrentUser) -> UserProfile:
    return current_user


@router.patch("", response_model=UserProfile)
def update_profile(payload: ProfileUpdateRequest, current_user: CurrentUser) -> UserProfile:
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return current_user
    try:
        result = get_service_client().table("profiles").update(changes).eq("id", str(current_user.id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found.")
        return UserProfile.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to update profile.") from exc
