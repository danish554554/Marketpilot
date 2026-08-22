from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import HTMLResponse, PlainTextResponse

from app.dependencies import CurrentUser
from app.routers.planner import _format_item_row
from app.routers.strategy import _fetch_pillars_for_strategy
from app.schemas import (
    AIComplianceReport,
    ExportFormat,
    MarketingStrategyResponse,
    PlannerContentItemResponse,
    Role,
    WorkspaceBackupExport,
    WorkspaceHealthReport,
)
from app.services.export_service import ExportService
from app.services.reporting_service import ReportingService
from app.supabase_client import get_service_client

router = APIRouter(tags=["Export, Reporting & Audit System"])


def _require_manager_or_admin(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a business owner or administrator can access export and reporting services.",
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


# ============================================================================
# Strategy Exports
# ============================================================================

@router.get("/export/strategy/{strategy_id}")
def export_marketing_strategy(
    strategy_id: UUID,
    current_user: CurrentUser,
    export_format: ExportFormat = Query(default=ExportFormat.markdown, alias="format"),
) -> Response:
    """
    Exports a marketing strategy and its campaign pillars in Markdown, CSV, HTML, or JSON.
    """
    _require_manager_or_admin(current_user)
    client = get_service_client()
    ws_id = _workspace_id_for_current_user(current_user)

    res = client.table("marketing_strategies").select("*").eq("id", str(strategy_id)).maybe_single().execute()
    if not res or not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketing strategy not found.")
    row = res.data
    if current_user.role != Role.ADMINISTRATOR and row.get("workspace_id") != ws_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this strategy.")

    row["pillars"] = _fetch_pillars_for_strategy(str(strategy_id))
    strategy_model = MarketingStrategyResponse(**row)

    if export_format == ExportFormat.markdown:
        content = ExportService.export_strategy_markdown(strategy_model)
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="strategy_{strategy_id}.md"'},
        )
    elif export_format == ExportFormat.csv:
        content = ExportService.export_strategy_csv(strategy_model)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="strategy_{strategy_id}.csv"'},
        )
    elif export_format == ExportFormat.html:
        content = ExportService.export_strategy_html(strategy_model)
        return HTMLResponse(content=content)
    else:
        return Response(
            content=strategy_model.model_dump_json(indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="strategy_{strategy_id}.json"'},
        )


# ============================================================================
# Calendar / Copywriter Handoff Exports
# ============================================================================

@router.get("/export/calendar")
def export_editorial_calendar(
    current_user: CurrentUser,
    start_date: date = Query(description="Start date of scheduled window"),
    end_date: date = Query(description="End date of scheduled window"),
    export_format: ExportFormat = Query(default=ExportFormat.csv, alias="format"),
) -> Response:
    """
    Exports scheduled editorial marketing calendar as a copywriter handoff sheet in CSV, Markdown, HTML, or JSON.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    client = get_service_client()

    query = (
        client.table("planner_content_items")
        .select("*, products(name), offers(title), trend_signals(topic), marketing_strategies(title), strategy_campaign_pillars(pillar_name)")
        .eq("workspace_id", ws_id)
        .gte("scheduled_date", str(start_date))
        .lte("scheduled_date", str(end_date))
        .order("scheduled_date")
        .order("scheduled_time_slot")
    )
    res = query.execute()
    items = [_format_item_row(r) for r in (res.data or [])]

    if export_format == ExportFormat.csv:
        content = ExportService.export_calendar_csv(items)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="calendar_handoff_{start_date}_{end_date}.csv"'},
        )
    elif export_format == ExportFormat.markdown:
        content = ExportService.export_calendar_markdown(items, start_date, end_date)
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="calendar_handoff_{start_date}_{end_date}.md"'},
        )
    elif export_format == ExportFormat.html:
        content = ExportService.export_calendar_html(items, start_date, end_date)
        return HTMLResponse(content=content)
    else:
        import json
        return Response(
            content=json.dumps([it.model_dump(mode="json") for it in items], indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="calendar_{start_date}_{end_date}.json"'},
        )


# ============================================================================
# Full Workspace Backup Export
# ============================================================================

@router.get("/export/workspace-backup", response_model=WorkspaceBackupExport)
def export_workspace_backup(current_user: CurrentUser) -> WorkspaceBackupExport:
    """
    Exports a comprehensive JSON backup of all workspace intelligence across all modules.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    return ExportService.export_workspace_backup(UUID(ws_id))


# ============================================================================
# Intelligence Health & Audit Reporting
# ============================================================================

@router.get("/reporting/workspace-health", response_model=WorkspaceHealthReport)
def get_workspace_health_report(current_user: CurrentUser) -> WorkspaceHealthReport:
    """
    Calculates the real-time Marketing Intelligence Readiness and Health score (0–100%)
    across 8 core dimensions with tailored improvement recommendations.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    return ReportingService.calculate_workspace_health(UUID(ws_id))


@router.get("/reporting/ai-compliance", response_model=AIComplianceReport)
def get_ai_compliance_report(current_user: CurrentUser) -> AIComplianceReport:
    """
    Retrieves aggregated AI guardrail safety statistics, violation frequency, and execution latency.
    """
    _require_manager_or_admin(current_user)
    ws_id = _workspace_id_for_current_user(current_user)
    return ReportingService.calculate_ai_compliance(UUID(ws_id))
