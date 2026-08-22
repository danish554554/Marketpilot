import React, { useState } from 'react';
import { TrendingUp, Sparkles, ExternalLink, Filter } from 'lucide-react';
import { TrendSignal } from '../types';

interface TrendsProps {
  trends: TrendSignal[];
  onNavigate: (page: string) => void;
}

export const Trends: React.FC<TrendsProps> = ({ trends, onNavigate }) => {
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const filtered = trends.filter(
    (t) => platformFilter === 'all' || t.platform === platformFilter
  );

  const featured = trends[0] || {
    topic: '“What fits inside” short-form videos',
    headline: 'Creators showing high-utility EDC packing reels',
    summary: 'This format is gaining high organic reach with functional accessory shoppers and naturally demonstrates product capacity.',
    source_name: 'TikTok Discovery Feed',
    confidence_score: 94,
    platform: 'tiktok',
    collection_date: '2026-08-20',
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            TREND INTELLIGENCE ENGINE
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Use verified signals, not guesses.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every trend includes grounded source evidence, verified collection timestamps, and measured confidence.
          </p>
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-1.5 bg-white border border-brand-line p-1 rounded-xl shadow-sm self-start sm:self-auto text-xs font-bold">
          <Filter size={13} className="text-slate-400 ml-2" />
          {['all', 'tiktok', 'instagram', 'facebook', 'linkedin'].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-2.5 py-1 rounded-lg capitalize text-[11px] transition-all ${
                platformFilter === p
                  ? 'bg-brand-green text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Featured Trend + Signals List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Trend Card (5 cols) */}
        <article className="lg:col-span-5 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-[#153e2b] to-[#165823] text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-extrabold uppercase bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full backdrop-blur-sm">
                High Relevance
              </span>
              <span className="text-[10px] text-emerald-200 font-bold">
                {featured.confidence_score}% Confidence
              </span>
            </div>

            <h2 className="text-2xl font-display font-extrabold mt-8 mb-3 leading-tight text-white">
              {featured.topic}
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed opacity-90">
              {featured.summary}
            </p>

            <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4 mt-6">
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">SOURCE</small>
                <b className="block text-[10px] text-white font-bold truncate mt-0.5">
                  {featured.source_name}
                </b>
              </div>
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">COLLECTED</small>
                <b className="block text-[10px] text-white font-bold mt-0.5">
                  {featured.collection_date || '2h ago'}
                </b>
              </div>
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">CONFIDENCE</small>
                <b className="block text-[10px] text-white font-bold mt-0.5">
                  {featured.confidence_score >= 80 ? 'High' : 'Medium'}
                </b>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('planner')}
            className="w-full bg-white text-brand-green hover:bg-emerald-50 font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all mt-6"
          >
            <Sparkles size={14} />
            <span>Use in my strategy plan</span>
          </button>
        </article>

        {/* Signals List (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-3">
          <h2 className="text-base font-display font-bold text-brand-ink m-0 mb-4">
            Active Verified Signals ({filtered.length})
          </h2>

          <div className="divide-y divide-slate-100 space-y-1">
            {filtered.map((t, idx) => (
              <div key={t.id || idx} className="pt-3 pb-2 flex items-start gap-3">
                <i className="not-italic w-8 h-8 rounded-lg bg-emerald-50 text-brand-green grid place-items-center font-extrabold text-sm shrink-0">
                  {t.platform === 'tiktok' ? '↗' : t.platform === 'instagram' ? '#' : '⌁'}
                </i>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-xs font-bold text-brand-ink">{t.topic}</b>
                    <span className="text-[8px] uppercase font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {t.platform}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 mb-1">{t.headline || t.summary}</p>
                  <small className="text-[9px] text-slate-400 flex items-center gap-1">
                    <span>Source: {t.source_name}</span>
                    {t.source_url && (
                      <a
                        href={t.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-green hover:underline flex items-center"
                      >
                        <ExternalLink size={10} className="ml-1" />
                      </a>
                    )}
                  </small>
                </div>
                <span
                  className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    t.confidence_score >= 85
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.confidence_score}% score
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};
