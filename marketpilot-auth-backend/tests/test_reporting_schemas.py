from uuid import uuid4

from app.schemas import (
    AIComplianceReport,
    ExportFormat,
    HealthDimensionCheck,
    HealthScoreStatus,
    WorkspaceBackupExport,
    WorkspaceHealthReport,
)


def test_export_and_health_enums():
    assert ExportFormat.markdown == "markdown"
    assert ExportFormat.csv == "csv"
    assert ExportFormat.json == "json"
    assert ExportFormat.html == "html"
    assert HealthScoreStatus.excellent == "excellent"
    assert HealthScoreStatus.good == "good"


def test_workspace_health_report_model():
    ws_id = uuid4()
    report = WorkspaceHealthReport(
        workspace_id=ws_id,
        business_name="Aura Skin",
        overall_score=90,
        status=HealthScoreStatus.excellent,
        dimensions=[
            HealthDimensionCheck(
                dimension="Business Onboarding",
                passed=True,
                score=10,
                max_score=10,
                details="Profile complete",
            )
        ],
        recommendations=[],
        generated_at="2026-08-22T00:00:00Z",
    )
    assert report.overall_score == 90
    assert report.status == HealthScoreStatus.excellent
    assert len(report.dimensions) == 1


def test_ai_compliance_report_model():
    ws_id = uuid4()
    rep = AIComplianceReport(
        workspace_id=ws_id,
        total_generations=25,
        pass_rate_percentage=96.0,
        clean_passes=22,
        warnings_count=1,
        sanitized_count=1,
        failed_count=1,
        violations_by_type={"prohibited_word": 2},
        average_latency_ms=350.5,
        generated_at="2026-08-22T00:00:00Z",
    )
    assert rep.total_generations == 25
    assert rep.pass_rate_percentage == 96.0
    assert rep.violations_by_type["prohibited_word"] == 2


def test_workspace_backup_export_model():
    ws_id = uuid4()
    backup = WorkspaceBackupExport(
        workspace_id=ws_id,
        exported_at="2026-08-22T00:00:00Z",
        workspace={"id": str(ws_id), "business_name": "Aura Skin"},
        products=[{"name": "Serum"}],
        offers=[],
        strategies=[],
        planner_items=[],
        ai_logs_count=5,
    )
    data = backup.model_dump(mode="json")
    assert data["version"] == "1.0.0"
    assert data["workspace"]["business_name"] == "Aura Skin"
    assert data["ai_logs_count"] == 5
