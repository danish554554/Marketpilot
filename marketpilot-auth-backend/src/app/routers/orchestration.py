from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError

from app.dependencies import CurrentUser
from app.schemas import (
    AIGenerationLog,
    GuardrailValidationRequest,
    GuardrailValidationResponse,
    OrchestrationGenerateRequest,
    OrchestrationGenerateResponse,
    Role,
    StructuredContext,
)
from app.services.context_builder import build_structured_context
from app.services.guardrails import GuardrailsEngine
from app.services.llm_orchestrator import LLMOrchestrator
from app.supabase_client import get_service_client

router = APIRouter(prefix="/orchestration", tags=["LLM Orchestration & Guardrails"])


def _require_manager_or_admin(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a business owner or administrator can access orchestration features.",
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


@router.get("/context", response_model=StructuredContext)
def get_structured_context(
    current_user: CurrentUser,
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> StructuredContext:
    """
    Returns the assembled, validated business intelligence context for the caller's workspace,
    ready for LLM prompt ingestion.
    """
    _require_manager_or_admin(current_user)

    target_ws_id: str
    if workspace_id and current_user.role == Role.ADMINISTRATOR:
        target_ws_id = str(workspace_id)
    else:
        target_ws_id = _workspace_id_for_current_user(current_user)

    return build_structured_context(UUID(target_ws_id))


@router.post("/generate", response_model=OrchestrationGenerateResponse, status_code=status.HTTP_200_OK)
def generate_strategic_recommendations(
    payload: OrchestrationGenerateRequest,
    current_user: CurrentUser,
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> OrchestrationGenerateResponse:
    """
    Executes the LLM orchestration pipeline:
    1. Compiles structured business intelligence context (Workspace, Brand Kit, In-Stock Products, Offers, Budget, Trends).
    2. Assembles grounded prompts with strict guardrail constraints.
    3. Generates structured recommendations with rationale traceability.
    4. Evaluates output against guardrails (prohibited words, product grounding, out-of-stock prevention, trend verification).
    5. Saves audit generation log and returns structured output.
    """
    _require_manager_or_admin(current_user)

    target_ws_id: str
    if workspace_id and current_user.role == Role.ADMINISTRATOR:
        target_ws_id = str(workspace_id)
    else:
        target_ws_id = _workspace_id_for_current_user(current_user)

    context = build_structured_context(UUID(target_ws_id))
    return LLMOrchestrator.execute(context=context, request=payload, user_id=current_user.id)


@router.post("/validate", response_model=GuardrailValidationResponse)
def validate_marketing_content(
    payload: GuardrailValidationRequest,
    current_user: CurrentUser,
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> GuardrailValidationResponse:
    """
    Standalone guardrail evaluation endpoint. Evaluates any arbitrary marketing text against
    the workspace Brand Kit prohibited words, product inventory, and trend validity.
    """
    _require_manager_or_admin(current_user)

    target_ws_id: str
    if workspace_id and current_user.role == Role.ADMINISTRATOR:
        target_ws_id = str(workspace_id)
    else:
        target_ws_id = _workspace_id_for_current_user(current_user)

    context = build_structured_context(UUID(target_ws_id))
    evaluation = GuardrailsEngine.evaluate_text_content(
        text=payload.content,
        prohibited_words=context.prohibited_words,
        allowed_products=context.available_products,
        allowed_trends=context.matched_trends,
        auto_sanitize=payload.auto_sanitize,
    )

    return GuardrailValidationResponse(
        status=evaluation.status,
        passed=evaluation.passed,
        violations=evaluation.violations,
        sanitized_content=evaluation.sanitized_content,
    )


@router.get("/logs", response_model=list[AIGenerationLog])
def list_generation_logs(
    current_user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    workspace_id: UUID | None = Query(default=None, description="Optional target workspace ID for administrators"),
) -> list[AIGenerationLog]:
    """
    Retrieves the audit trail of AI generation logs and guardrail evaluations for the workspace.
    """
    _require_manager_or_admin(current_user)

    client = get_service_client()
    try:
        query = client.table("ai_generation_logs").select("*")
        if current_user.role != Role.ADMINISTRATOR or not workspace_id:
            ws_id = _workspace_id_for_current_user(current_user)
            query = query.eq("workspace_id", ws_id)
        else:
            query = query.eq("workspace_id", str(workspace_id))

        res = query.order("created_at", desc=True).limit(limit).execute()
        return [AIGenerationLog(**row) for row in (res.data or [])]
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Audit log storage error: {exc.message}. Please apply the Module 6 migration.",
        ) from exc
    except Exception as exc:
        return []


@router.get("/logs/{log_id}", response_model=AIGenerationLog)
def get_generation_log(
    log_id: UUID,
    current_user: CurrentUser,
) -> AIGenerationLog:
    """
    Retrieves a specific AI generation log by ID.
    """
    _require_manager_or_admin(current_user)

    client = get_service_client()
    try:
        res = client.table("ai_generation_logs").select("*").eq("id", str(log_id)).maybe_single().execute()
        if not res or not res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation log entry not found.")
        row = res.data
        if current_user.role != Role.ADMINISTRATOR:
            ws_id = _workspace_id_for_current_user(current_user)
            if row.get("workspace_id") != ws_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this generation log.")
        return AIGenerationLog(**row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Audit log storage error: {str(exc)}",
        ) from exc
