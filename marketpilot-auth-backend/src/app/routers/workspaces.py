from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentUser, require_roles
from app.schemas import Role, Workspace, WorkspaceCreateRequest, WorkspaceUpdateRequest
from app.supabase_client import get_service_client

router = APIRouter(prefix="/workspaces", tags=["Business Workspaces"])
OwnerOrAdministrator = Depends(require_roles(Role.BUSINESS_OWNER, Role.ADMINISTRATOR))
Administrator = Depends(require_roles(Role.ADMINISTRATOR))


def _storage_error(exc: Exception) -> HTTPException:
    """Return a safe, actionable message when the workspace database is unavailable."""
    error_text = str(exc).lower()
    if "business_workspaces" in error_text and ("does not exist" in error_text or "42p01" in error_text):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business workspace storage is not configured. Run the Module 2 Supabase migration before using this endpoint.",
        )
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Business workspace storage is temporarily unavailable. Please try again later.",
    )


def _serialize_workspace(item: dict) -> Workspace:
    return Workspace.model_validate(item)


def _find_for_owner(owner_id: str) -> dict | None:
    try:
        result = get_service_client().table("business_workspaces").select("*").eq("owner_id", owner_id).maybe_single().execute()
        return None if result is None else result.data
    except Exception as exc:
        raise _storage_error(exc) from exc


def _get_by_id_or_404(workspace_id: UUID) -> dict:
    try:
        result = get_service_client().table("business_workspaces").select("*").eq("id", str(workspace_id)).maybe_single().execute()
    except Exception as exc:
        raise _storage_error(exc) from exc
    if result is None or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business workspace not found.")
    return result.data


@router.post("", response_model=Workspace, status_code=status.HTTP_201_CREATED, dependencies=[OwnerOrAdministrator])
def create_workspace(payload: WorkspaceCreateRequest, current_user: CurrentUser) -> Workspace:
    if _find_for_owner(str(current_user.id)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This account already has a business workspace. Version 1 allows one workspace per account.")
    values = payload.model_dump(mode="json")
    values["owner_id"] = str(current_user.id)
    try:
        result = get_service_client().table("business_workspaces").insert(values).execute()
        return _serialize_workspace(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        if "business_workspaces_owner_id_key" in str(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This account already has a business workspace.") from exc
        raise _storage_error(exc) from exc


@router.get("/me", response_model=Workspace, dependencies=[OwnerOrAdministrator])
def get_my_workspace(current_user: CurrentUser) -> Workspace:
    workspace = _find_for_owner(str(current_user.id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No business workspace exists for this account.")
    return _serialize_workspace(workspace)


@router.patch("/me", response_model=Workspace, dependencies=[OwnerOrAdministrator])
def update_my_workspace(payload: WorkspaceUpdateRequest, current_user: CurrentUser) -> Workspace:
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return get_my_workspace(current_user)
    try:
        result = get_service_client().table("business_workspaces").update(changes).eq("owner_id", str(current_user.id)).execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No business workspace exists for this account.")
        return _serialize_workspace(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("", response_model=list[Workspace], dependencies=[Administrator])
def list_workspaces() -> list[Workspace]:
    try:
        result = get_service_client().table("business_workspaces").select("*").order("created_at", desc=True).execute()
        return [_serialize_workspace(item) for item in result.data]
    except Exception as exc:
        raise _storage_error(exc) from exc


@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(workspace_id: UUID, current_user: CurrentUser) -> Workspace:
    workspace = _get_by_id_or_404(workspace_id)
    if workspace["owner_id"] != str(current_user.id) and current_user.role != Role.ADMINISTRATOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this workspace.")
    return _serialize_workspace(workspace)
