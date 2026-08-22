import React from 'react';
import { FileText, ArrowRight, DollarSign } from 'lucide-react';
import { MarketingStrategy } from '../types';

interface BriefsProps {
  activeStrategy: MarketingStrategy | null;
  onNavigate: (page: string) => void;
}

export const Briefs: React.FC<BriefsProps> = ({ activeStrategy, onNavigate }) => {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div>
        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
          CAMPAIGN BRIEFS
        </small>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
          Plan paid & organic campaigns with clarity.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Campaign briefs include audience hypotheses, budget guidance, creative angles, and ad copy. They never launch ads automatically.
        </p>
      </div>

      {activeStrategy ? (
        <div className="space-y-6">
          {/* Executive Overview Card */}
          <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-brand-line pb-4 mb-4">
              <div>
                <small className="text-[9px] font-extrabold text-brand-green uppercase tracking-wider">
                  ACTIVE STRATEGY BRIEF
                </small>
                <h2 className="text-lg font-display font-bold text-brand-ink mt-0.5">
                  {activeStrategy.title}
                </h2>
              </div>
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full capitalize">
                {activeStrategy.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase mb-1">
                  Executive Summary
                </h3>
                <p className="text-slate-600 leading-relaxed m-0">
                  {activeStrategy.executive_summary}
                </p>
              </div>

              <div>
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase mb-1">
                  Target Audience Summary
                </h3>
                <p className="text-slate-600 leading-relaxed m-0">
                  {activeStrategy.target_audience_summary}
                </p>
              </div>
            </div>
          </article>

          {/* Pillars List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(activeStrategy.pillars || []).map((p, i) => (
              <article
                key={p.id || i}
                className="bg-white border border-brand-line rounded-2xl p-5 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.platform} · {p.channel_type}
                    </span>
                    <span className="text-xs font-bold text-brand-green">Pillar {i + 1}</span>
                  </div>

                  <h3 className="text-sm font-bold text-brand-ink mb-1">{p.pillar_name}</h3>
                  <p className="text-xs text-slate-600 mb-3">{p.creative_angle}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1.5">
                    <div>
                      <strong className="text-slate-700">Strategic Rationale:</strong>
                      <p className="text-slate-500 m-0 mt-0.5">{p.rationale}</p>
                    </div>
                    <div className="pt-1.5">
                      <strong className="text-slate-700">Hook Concept:</strong>
                      <p className="text-slate-500 italic m-0 mt-0.5">“{p.hook_ideas?.[0] || 'Hook idea'}”</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-line mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Effort: {p.estimated_effort}</span>
                  <button
                    onClick={() => onNavigate('studio')}
                    className="text-brand-green font-extrabold hover:underline"
                  >
                    Open Copy in Studio →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand-line rounded-2xl p-12 text-center max-w-[500px] mx-auto shadow-card space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-pale text-brand-green grid place-items-center mx-auto text-xl font-bold">
            <FileText size={22} />
          </div>
          <h2 className="text-lg font-display font-bold text-brand-ink">No Active Campaign Brief</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate a marketing strategy in the AI Planner to view grounded campaign briefs and channel breakdowns.
          </p>
          <button
            onClick={() => onNavigate('planner')}
            className="bg-brand-green text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:bg-brand-green-dark"
          >
            Go to AI Planner
          </button>
        </div>
      )}
    </div>
  );
};
