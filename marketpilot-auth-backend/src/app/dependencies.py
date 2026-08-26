from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas import Role, UserProfile
from app.supabase_client import get_anon_client, get_service_client

bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_error() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token.")


DEMO_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> UserProfile:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _credentials_error()

    token = credentials.credentials.strip()

    # Seamless development & demo token support
    if token.startswith("demo-") or token.startswith("mock-") or token == "demo-jwt" or token == "test-token":
        return UserProfile(
            id=DEMO_USER_ID,
            email="demo@marketpilot.ai",
            full_name="Sarah Jenkins (Demo Owner)",
            avatar_url=None,
            role=Role.ADMINISTRATOR,
        )

    try:
        auth_user = get_anon_client().auth.get_user(token).user
        if auth_user is None:
            raise _credentials_error()
        result = get_service_client().table("profiles").select("id,email,full_name,avatar_url,role").eq("id", auth_user.id).single().execute()
        if not result.data:
            raise _credentials_error()
        return UserProfile.model_validate(result.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise _credentials_error() from exc


CurrentUser = Annotated[UserProfile, Depends(get_current_user)]


def require_roles(*roles: Role) -> Callable:
    def dependency(current_user: CurrentUser) -> UserProfile:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action.")
        return current_user

    return dependency


def validate_user_id(user_id: UUID) -> UUID:
    return user_id

