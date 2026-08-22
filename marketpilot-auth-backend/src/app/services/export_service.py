import csv
import io
import json
from datetime import date
from uuid import UUID

from app.schemas import (
    MarketingStrategyResponse,
    PlannerContentItemResponse,
    WorkspaceBackupExport,
)
from app.supabase_client import get_service_client


class ExportService:
    """
    Export Engine for MarketPilot AI (Version 1).
    Produces structured Markdown, CSV spreadsheets, clean print-ready HTML, and JSON backups.
    """

    # =========================================================================
    # Strategy Exports
    # =========================================================================

    @classmethod
    def export_strategy_markdown(cls, strategy: MarketingStrategyResponse) -> str:
        lines = [
            f"# {strategy.title}",
            "",
            f"**Timeframe**: {strategy.timeframe.value.capitalize()} | **Status**: {strategy.status.value.upper()} | **Generated**: {strategy.created_at[:10]}",
            "",
            "## Executive Summary",
            strategy.executive_summary,
            "",
            "## Target Audience",
            strategy.target_audience_summary,
            "",
            "## Budget Allocation",
        ]
        b = strategy.budget_allocation_summary
        if b:
            total = b.get("total_budget", "0")
            currency = b.get("currency", "USD")
            org_pct = b.get("organic_percentage", 60)
            paid_pct = b.get("paid_percentage", 40)
            lines.append(f"- **Total Monthly Budget**: {total} {currency}")
            lines.append(f"- **Organic / Paid Split**: {org_pct}% Organic / {paid_pct}% Paid")
            if b.get("channel_spend_recommendations"):
                lines.append("- **Recommended Channel Spend**:")
                for ch, amt in b.get("channel_spend_recommendations", {}).items():
                    lines.append(f"  - {ch.capitalize()}: {amt} {currency}")
        else:
            lines.append("No specific budget allocated.")

        lines.extend([
            "",
            "## Strategic Campaign Pillars",
            "",
        ])
        for idx, p in enumerate(strategy.pillars, start=1):
            lines.extend([
                f"### Pillar {idx}: {p.pillar_name}",
                f"- **Platform**: {p.platform.value.capitalize()} ({p.channel_type.capitalize()})",
                f"- **Objective**: {p.objective.value}",
                f"- **Focus Product**: {p.product_name or 'Catalogue General'}",
                f"- **Creative Angle**: {p.creative_angle}",
                f"- **Call to Action**: {', '.join(p.suggested_ctas) if p.suggested_ctas else 'Standard CTA'}",
                f"- **Content Formats**: {', '.join(p.content_formats)}",
                f"- **Estimated Effort**: {p.estimated_effort.capitalize()}",
                f"- **Strategic Rationale**: {p.rationale}",
                "- **Hook Ideas**:",
            ])
            for h in p.hook_ideas:
                lines.append(f"  * {h}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def export_strategy_csv(cls, strategy: MarketingStrategyResponse) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Order",
            "Pillar Name",
            "Platform",
            "Channel Type",
            "Objective",
            "Focus Product",
            "Offer",
            "Trend Topic",
            "Creative Angle",
            "Hooks",
            "Suggested CTAs",
            "Formats",
            "Effort",
            "Rationale",
        ])
        for idx, p in enumerate(strategy.pillars, start=1):
            writer.writerow([
                idx,
                p.pillar_name,
                p.platform.value,
                p.channel_type,
                p.objective.value,
                p.product_name or "",
                p.offer_title or "",
                p.trend_topic or "",
                p.creative_angle,
                " | ".join(p.hook_ideas),
                " | ".join(p.suggested_ctas),
                " | ".join(p.content_formats),
                p.estimated_effort,
                p.rationale,
            ])
        return output.getvalue()

    @classmethod
    def export_strategy_html(cls, strategy: MarketingStrategyResponse) -> str:
        pillars_html = ""
        for idx, p in enumerate(strategy.pillars, start=1):
            hooks_html = "".join([f"<li>{h}</li>" for h in p.hook_ideas])
            pillars_html += f"""
            <div class="card">
                <h3>Pillar {idx}: {p.pillar_name}</h3>
                <p><strong>Platform:</strong> {p.platform.value.capitalize()} ({p.channel_type.capitalize()}) &nbsp;|&nbsp; <strong>Objective:</strong> {p.objective.value}</p>
                <p><strong>Focus Product:</strong> {p.product_name or 'General Catalogue'} &nbsp;|&nbsp; <strong>Effort:</strong> {p.estimated_effort.capitalize()}</p>
                <p><strong>Creative Angle:</strong> {p.creative_angle}</p>
                <p><strong>Call to Action:</strong> {', '.join(p.suggested_ctas)}</p>
                <p><strong>Strategic Rationale:</strong> {p.rationale}</p>
                <strong>Hook Concepts:</strong>
                <ul>{hooks_html}</ul>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{strategy.title}</title>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }}
    h1 {{ color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
    h2 {{ color: #1e293b; margin-top: 28px; }}
    h3 {{ color: #2563eb; margin-top: 0; }}
    .badge {{ display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }}
    .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }}
    @media print {{ body {{ max-width: 100%; margin: 0; }} .card {{ page-break-inside: avoid; }} }}
</style>
</head>
<body>
    <span class="badge">{strategy.status.value.upper()}</span>
    <h1>{strategy.title}</h1>
    <p><em>Timeframe: {strategy.timeframe.value.capitalize()} | Generated: {strategy.created_at[:10]}</em></p>
    
    <h2>Executive Summary</h2>
    <p>{strategy.executive_summary}</p>
    
    <h2>Target Audience</h2>
    <p>{strategy.target_audience_summary}</p>
    
    <h2>Campaign Pillars</h2>
    {pillars_html}
</body>
</html>"""
        return html

    # =========================================================================
    # Calendar & Copywriter Handoff Exports
    # =========================================================================

    @classmethod
    def export_calendar_csv(cls, items: list[PlannerContentItemResponse]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Scheduled Date",
            "Time Slot",
            "Channel",
            "Channel Type",
            "Format",
            "Status",
            "Title",
            "Hook",
            "Primary Copy / Script Narration",
            "Call to Action",
            "Focus Product",
            "Offer",
            "Trend Topic",
            "Strategic Rationale",
        ])
        for it in items:
            writer.writerow([
                str(it.scheduled_date),
                it.scheduled_time_slot,
                it.channel.value,
                it.channel_type,
                it.format.value,
                it.status.value,
                it.title,
                it.hook,
                it.primary_text,
                it.call_to_action,
                it.product_name or "",
                it.offer_title or "",
                it.trend_topic or "",
                it.strategic_rationale,
            ])
        return output.getvalue()

    @classmethod
    def export_calendar_markdown(
        cls,
        items: list[PlannerContentItemResponse],
        start_date: date,
        end_date: date,
    ) -> str:
        lines = [
            f"# Editorial Marketing Calendar & Copywriter Handoff",
            f"**Schedule Window**: {start_date} to {end_date} | **Total Items**: {len(items)}",
            "",
            "---",
            "",
        ]
        for it in items:
            lines.extend([
                f"## 📅 {it.scheduled_date} [{it.scheduled_time_slot}] — {it.title}",
                f"- **Channel**: `{it.channel.value.upper()}` ({it.channel_type.capitalize()})",
                f"- **Format**: `{it.format.value}` | **Status**: `{it.status.value}`",
                f"- **Focus Product**: {it.product_name or 'General'}",
                f"- **Call to Action**: {it.call_to_action}",
                f"- **Strategic Rationale**: {it.strategic_rationale}",
                "",
                "### 🎯 Hook / Headline",
                f"> {it.hook}",
                "",
                "### 📝 Full Production Copy",
                "```text",
                it.primary_text,
                "```",
                "",
                "---",
                "",
            ])
        return "\n".join(lines)

    @classmethod
    def export_calendar_html(
        cls,
        items: list[PlannerContentItemResponse],
        start_date: date,
        end_date: date,
    ) -> str:
        items_html = ""
        for it in items:
            items_html += f"""
            <div class="content-item">
                <div class="meta-header">
                    <span class="date-badge">{it.scheduled_date} &bull; {it.scheduled_time_slot}</span>
                    <span class="channel-badge">{it.channel.value.upper()}</span>
                    <span class="format-badge">{it.format.value}</span>
                </div>
                <h3>{it.title}</h3>
                <p><strong>Hook:</strong> {it.hook}</p>
                <div class="copy-box"><pre>{it.primary_text}</pre></div>
                <p><strong>CTA:</strong> <code>{it.call_to_action}</code> &nbsp;|&nbsp; <strong>Product:</strong> {it.product_name or 'General'}</p>
            </div>
            """

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Editorial Marketing Calendar ({start_date} to {end_date})</title>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #0f172a; max-width: 950px; margin: 30px auto; padding: 0 20px; }}
    h1 {{ color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }}
    .meta-header {{ margin-bottom: 12px; }}
    .date-badge {{ font-weight: 700; color: #1e40af; margin-right: 8px; }}
    .channel-badge {{ background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-right: 6px; }}
    .format-badge {{ background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }}
    .content-item {{ background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
    .copy-box {{ background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px; border-radius: 4px; margin: 10px 0; }}
    pre {{ white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit; }}
    @media print {{ body {{ max-width: 100%; margin: 0; }} .content-item {{ page-break-inside: avoid; }} }}
</style>
</head>
<body>
    <h1>Editorial Marketing Calendar & Copywriter Handoff</h1>
    <p>Schedule window: <strong>{start_date}</strong> to <strong>{end_date}</strong> &bull; Total content items: <strong>{len(items)}</strong></p>
    {items_html}
</body>
</html>"""

    # =========================================================================
    # Full Workspace Backup Export
    # =========================================================================

    @classmethod
    def export_workspace_backup(cls, workspace_id: UUID) -> WorkspaceBackupExport:
        client = get_service_client()
        ws_str = str(workspace_id)
        now_str = "2026-08-22T10:30:00Z"

        ws_res = client.table("business_workspaces").select("*").eq("id", ws_str).maybe_single().execute()
        ws_data = ws_res.data or {}

        bk_res = client.table("brand_kits").select("*").eq("workspace_id", ws_str).maybe_single().execute()
        bk_data = bk_res.data if bk_res else None

        prod_res = client.table("products").select("*").eq("workspace_id", ws_str).execute()
        offer_res = client.table("offers").select("*").eq("workspace_id", ws_str).execute()
        budg_res = client.table("marketing_budgets").select("*").eq("workspace_id", ws_str).maybe_single().execute()
        strat_res = client.table("marketing_strategies").select("*").eq("workspace_id", ws_str).execute()
        plan_res = client.table("planner_content_items").select("*").eq("workspace_id", ws_str).execute()
        logs_res = client.table("ai_generation_logs").select("id").eq("workspace_id", ws_str).execute()

        return WorkspaceBackupExport(
            workspace_id=workspace_id,
            exported_at=now_str,
            version="1.0.0",
            workspace=ws_data,
            brand_kit=bk_data,
            products=prod_res.data or [],
            offers=offer_res.data or [],
            budget=budg_res.data if budg_res else None,
            strategies=strat_res.data or [],
            planner_items=plan_res.data or [],
            ai_logs_count=len(logs_res.data or []),
        )
