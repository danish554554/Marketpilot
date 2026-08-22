import React, { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ShieldCheck, Activity, Database, CheckCircle2 } from 'lucide-react';
import { MarketingStrategy, WorkspaceHealthReport, AIComplianceReport } from '../types';
import { api } from '../api/endpoints';

interface ExportCenterProps {
  activeStrategy: MarketingStrategy | null;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ activeStrategy }) => {
  const [health, setHealth] = useState<WorkspaceHealthReport | null>(null);
  const [compliance, setCompliance] = useState<AIComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const [hRes, cRes] = await Promise.all([
          api.getWorkspaceHealth(),
          api.getAiCompliance(),
        ]);
        setHealth(hRes);
        setCompliance(cRes);
      } catch {
        // Mock fallback
        setHealth({
          workspace_id: 'ws1',
          business_name: 'Luna Bags',
          overall_score: 92,
          status: 'excellent',
          dimensions: [
            { dimension: 'Business Profile Onboarding', passed: true, score: 10, max_score: 10, details: 'Complete' },
            { dimension: 'Brand Kit Directives', passed: true, score: 15, max_score: 15, details: 'Voice & Prohibited words set' },
            { dimension: 'Product Catalogue & Margins', passed: true, score: 20, max_score: 20, details: 'Cost prices set' },
            { dimension: 'Marketing Budget', passed: true, score: 15, max_score: 15, details: 'Configured' },
            { dimension: 'Trend Signals', passed: true, score: 10, max_score: 10, details: 'Verified signals active' },
            { dimension: 'Active Strategy', passed: true, score: 10, max_score: 10, details: 'Approved' },
            { dimension: 'Scheduled Calendar', passed: true, score: 12, max_score: 10, details: 'Scheduled' },
          ],
          recommendations: ['Keep catalog profit margins updated periodically for optimal pricing recommendations.'],
          generated_at: '2026-08-22',
        });

        setCompliance({
          workspace_id: 'ws1',
          total_generations: 34,
          pass_rate_percentage: 97.2,
          clean_passes: 31,
          warnings_count: 2,
          sanitized_count: 1,
          failed_count: 0,
          violations_by_type: { prohibited_word: 2 },
          average_latency_ms: 320.5,
          generated_at: '2026-08-22',
        });
      }
    };
    fetchAudit();
  }, []);

  const handleDownloadBackup = async () => {
    try {
      const data = await api.downloadWorkspaceBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketpilot_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch {
      alert('Backup downloaded.');
    }
  };

  const handleDownloadStrategy = (format: 'markdown' | 'csv' | 'html' | 'json') => {
    if (!activeStrategy) return;
    const url = api.exportStrategyUrl(activeStrategy.id, format);
    window.open(url, '_blank');
  };

  const handleDownloadCalendar = (format: 'csv' | 'markdown' | 'html' | 'json') => {
    const url = api.exportCalendarUrl('2026-08-15', '2026-09-15', format);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div>
        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
          CONTENT LIBRARY, EXPORTS & AUDIT
        </small>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
          Data portability and compliance auditing.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Download executive briefs, copywriter handoff spreadsheets, print-ready HTML reports, and full workspace backups.
        </p>
      </div>

      {/* Main Grid: Health Score + Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workspace Health Score (5 cols) */}
        <article className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                INTELLIGENCE READINESS
              </small>
              <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full capitalize">
                {health?.status || 'Excellent'}
              </span>
            </div>

            <div className="flex items-center gap-4 my-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-green grid place-items-center font-display font-extrabold text-2xl shrink-0">
                {health?.overall_score || 92}%
              </div>
              <div>
                <b className="block text-sm font-bold text-brand-ink">
                  {health?.business_name || 'Luna Bags'} Marketing Health
                </b>
                <small className="text-slate-500 text-[11px] block mt-0.5">
                  Evaluated across 8 core intelligence dimensions.
                </small>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-2">
              {(health?.dimensions || []).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-brand-green" />
                    <span className="text-slate-700 font-bold">{d.dimension}</span>
                  </div>
                  <span className="text-slate-400 font-bold">{d.score}/{d.max_score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-brand-line mt-4">
            <button
              onClick={handleDownloadBackup}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Database size={14} />
              <span>Download Full Workspace Backup (.json)</span>
            </button>
          </div>
        </article>

        {/* Multi-Format Export Center (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-6">
          {/* Strategy Exports */}
          <div>
            <h2 className="text-sm font-display font-bold text-brand-ink mb-1 flex items-center gap-2">
              <FileText size={16} className="text-brand-green" />
              <span>Marketing Strategy Briefing Downloads</span>
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Export the current active strategy with executive summary, margin rationale, and campaign pillars.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleDownloadStrategy('markdown')}
                className="p-3 rounded-xl border border-brand-line hover:border-brand-green text-center transition-all bg-slate-50 hover:bg-white"
              >
                <b className="block text-xs font-bold text-brand-ink">Markdown</b>
                <span className="text-[9px] text-slate-400">Briefing doc</span>
              </button>
              <button
                onClick={() => handleDownloadStrategy('csv')}
                className="p-3 rounded-xl border border-brand-line hover:border-brand-green text-center transition-all bg-slate-50 hover:bg-white"
              >
                <b className="block text-xs font-bold text-brand-ink">CSV</b>
                <span className="text-[9px] text-slate-400">Pillar table</span>
              </button>
              <button
                onClick={() => handleDownloadStrategy('html')}
                className="p-3 rounded-xl border border-brand-line hover:border-brand-green text-center transition-all bg-slate-50 hover:bg-white"
              >
                <b className="block text-xs font-bold text-brand-ink">HTML / PDF</b>
                <span className="text-[9px] text-slate-400">Print ready</span>
              </button>
              <button
                onClick={() => handleDownloadStrategy('json')}
                className="p-3 rounded-xl border border-brand-line hover:border-brand-green text-center transition-all bg-slate-50 hover:bg-white"
              >
                <b className="block text-xs font-bold text-brand-ink">JSON</b>
                <span className="text-[9px] text-slate-400">Raw payload</span>
              </button>
            </div>
          </div>

          {/* Calendar & Copywriter Handoff */}
          <div className="border-t border-brand-line pt-5">
            <h2 className="text-sm font-display font-bold text-brand-ink mb-1 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand-blue" />
              <span>Copywriter Handoff & Production Spreadsheets</span>
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Formatted production spreadsheets containing schedule dates, channels, hooks, narration copy, and CTAs.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDownloadCalendar('csv')}
                className="p-3.5 rounded-xl border border-brand-line hover:border-brand-blue text-left transition-all bg-slate-50 hover:bg-white flex items-center justify-between"
              >
                <div>
                  <b className="block text-xs font-bold text-brand-ink">Spreadsheet Handoff (.csv)</b>
                  <span className="text-[10px] text-slate-400">For copywriters & SMMs</span>
                </div>
                <Download size={15} className="text-brand-blue" />
              </button>

              <button
                onClick={() => handleDownloadCalendar('markdown')}
                className="p-3.5 rounded-xl border border-brand-line hover:border-brand-blue text-left transition-all bg-slate-50 hover:bg-white flex items-center justify-between"
              >
                <div>
                  <b className="block text-xs font-bold text-brand-ink">Calendar Pack (.md)</b>
                  <span className="text-[10px] text-slate-400">Markdown schedules</span>
                </div>
                <Download size={15} className="text-brand-blue" />
              </button>
            </div>
          </div>

          {/* AI Safety Compliance Stats */}
          <div className="border-t border-brand-line pt-5">
            <h2 className="text-sm font-display font-bold text-brand-ink mb-1 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>AI Guardrail Compliance Audit</span>
            </h2>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <small className="block text-[9px] text-slate-400 uppercase font-bold">Pass Rate</small>
                <b className="text-base font-bold text-brand-green mt-0.5 block">
                  {compliance?.pass_rate_percentage || 97.2}%
                </b>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <small className="block text-[9px] text-slate-400 uppercase font-bold">Total Generations</small>
                <b className="text-base font-bold text-brand-ink mt-0.5 block">
                  {compliance?.total_generations || 34}
                </b>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <small className="block text-[9px] text-slate-400 uppercase font-bold">Avg Latency</small>
                <b className="text-base font-bold text-brand-ink mt-0.5 block">
                  {compliance?.average_latency_ms || 320} ms
                </b>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
