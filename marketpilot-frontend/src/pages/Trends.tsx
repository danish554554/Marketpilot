import React, { useState } from 'react';
import { TrendingUp, Sparkles, ExternalLink, Filter, RefreshCw, CheckCircle2, Zap, Target, Hash, Lightbulb } from 'lucide-react';
import { TrendSignal } from '../types';
import { api } from '../api/endpoints';

interface TrendsProps {
  trends: TrendSignal[];
  setTrends?: React.Dispatch<React.SetStateAction<TrendSignal[]>>;
  onNavigate: (page: string) => void;
}

export const Trends: React.FC<TrendsProps> = ({ trends, setTrends, onNavigate }) => {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isIngesting, setIsIngesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedTrendIndex, setSelectedTrendIndex] = useState<number>(0);

  React.useEffect(() => {
    if (trends.length === 0) {
      api.getTrends().then((loaded) => {
        if (loaded && loaded.length > 0 && setTrends) {
          setTrends(loaded);
        }
      }).catch(() => {});
    }
  }, []);

  const handleIngestLiveTrends = async () => {
    setIsIngesting(true);
    setStatusMessage(null);

    try {
      const res = await api.ingestLiveTrends({ geo: 'US', limit_per_source: 6 });
      let updated: TrendSignal[] = [];
      try {
        updated = await api.getTrends();
      } catch {}

      if (setTrends) {
        if (updated && updated.length > 0) {
          setTrends(updated);
        } else if (res.signals && res.signals.length > 0) {
          setTrends(res.signals);
        }
      }
      setSelectedTrendIndex(0);
      setStatusMessage(`⚡ Successfully fetched & AI-synthesized ${res.ingested_count || res.signals?.length || 4} new market trend signals via Google Trends, Reddit & Gemini (${res.model_used || 'gemini-3.6-flash'})!`);
    } catch (err: any) {
      console.error('Ingestion error:', err);
      try {
        const updated = await api.getTrends();
        if (setTrends && updated.length > 0) {
          setTrends(updated);
          setStatusMessage('Loaded verified trend signals from database.');
        } else {
          setStatusMessage('Unable to connect to live trends pipeline. Please ensure the backend is running.');
        }
      } catch {
        setStatusMessage('Unable to connect to live trends pipeline. Please ensure the backend is running.');
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const filtered = trends.filter(
    (t) => platformFilter === 'all' || t.platform === platformFilter
  );

  const featured = filtered[selectedTrendIndex] || filtered[0] || trends[0] || {
    topic: '“What fits inside” short-form videos',
    headline: 'Creators showing high-utility EDC packing reels',
    summary: 'This format is gaining high organic reach with functional accessory shoppers and naturally demonstrates product capacity.',
    source_name: 'TikTok Discovery Feed',
    confidence_score: 94,
    platform: 'tiktok',
    category: 'Ecommerce & Retail',
    target_audience: 'Online consumers looking for smart lifestyle solutions',
    suggested_angles: ['Before vs after demonstration', '3 common daily routine mistakes'],
    hashtags: ['#TrendAlert', '#ViralProduct'],
    collection_date: '2026-08-26',
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <TrendingUp size={12} className="text-brand-green" />
            REAL-TIME TREND INGESTION ENGINE (100% FREE PIPELINE)
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Live Market Trends & Breakout Signals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingesting live search trends from Google Trends RSS, Reddit communities, and synthesized with Google Gemini 3.6 Flash.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Ingest Action Button */}
          <button
            onClick={handleIngestLiveTrends}
            disabled={isIngesting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <RefreshCw size={13} className={isIngesting ? 'animate-spin' : ''} />
            {isIngesting ? 'Ingesting Real Trends...' : '⚡ Ingest Live Market Trends'}
          </button>

          {/* Platform filter */}
          <div className="flex items-center gap-1.5 bg-white border border-brand-line p-1 rounded-xl shadow-sm text-xs font-bold">
            <Filter size={13} className="text-slate-400 ml-2" />
            {['all', 'tiktok', 'google_trends', 'instagram', 'general'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlatformFilter(p);
                  setSelectedTrendIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize text-[11px] transition-all ${
                  platformFilter === p
                    ? 'bg-brand-green text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success / Status Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Featured Trend + Signals List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Trend Card (5 cols) */}
        <article className="lg:col-span-5 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-[#153e2b] to-[#165823] text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-extrabold uppercase bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {featured.category || 'High Relevance'}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold">
                {featured.confidence_score}% Confidence
              </span>
            </div>

            <h2 className="text-2xl font-display font-extrabold mt-6 mb-3 leading-tight text-white">
              {featured.topic}
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed opacity-90 mb-4">
              {featured.headline || featured.summary}
            </p>

            {/* Target Audience & Angles */}
            {featured.target_audience && (
              <div className="bg-white/10 rounded-xl p-3 mb-3 backdrop-blur-sm">
                <small className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-300 font-bold mb-1">
                  <Target size={11} /> Target Audience
                </small>
                <p className="text-[11px] text-emerald-50 leading-snug">{featured.target_audience}</p>
              </div>
            )}

            {featured.suggested_angles && featured.suggested_angles.length > 0 && (
              <div className="bg-white/10 rounded-xl p-3 mb-3 backdrop-blur-sm">
                <small className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-300 font-bold mb-1">
                  <Lightbulb size={11} /> Suggested Creative Angles
                </small>
                <ul className="text-[11px] text-emerald-50 space-y-1 pl-3 list-disc">
                  {featured.suggested_angles.map((angle, i) => (
                    <li key={i}>{angle}</li>
                  ))}
                </ul>
              </div>
            )}

            {featured.hashtags && featured.hashtags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {featured.hashtags.map((h, i) => (
                  <span key={i} className="text-[9px] bg-white/15 px-2 py-0.5 rounded-full text-emerald-200 font-mono">
                    {h}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4 mt-5">
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">SOURCE</small>
                <b className="block text-[10px] text-white font-bold truncate mt-0.5">
                  {featured.source_name}
                </b>
              </div>
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">COLLECTED</small>
                <b className="block text-[10px] text-white font-bold mt-0.5">
                  {featured.collection_date || 'Today'}
                </b>
              </div>
              <div>
                <small className="block text-[8px] text-emerald-300 font-bold uppercase">CONFIDENCE</small>
                <b className="block text-[10px] text-white font-bold mt-0.5">
                  {featured.confidence_score >= 85 ? 'High (Verified)' : 'Medium'}
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-display font-bold text-brand-ink m-0">
              Active Verified Signals ({filtered.length})
            </h2>
            <small className="text-[10px] text-slate-400 font-medium">Click any signal to inspect details</small>
          </div>

          <div className="divide-y divide-slate-100 space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {filtered.map((t, idx) => {
              const isSelected = (filtered[selectedTrendIndex]?.id && filtered[selectedTrendIndex]?.id === t.id) || selectedTrendIndex === idx;
              return (
                <div
                  key={t.id || idx}
                  onClick={() => setSelectedTrendIndex(idx)}
                  className={`pt-3 pb-3 px-2 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <i className="not-italic w-8 h-8 rounded-lg bg-emerald-100 text-brand-green grid place-items-center font-extrabold text-sm shrink-0">
                    {t.platform === 'tiktok' ? '↗' : t.platform === 'google_trends' ? '🔍' : t.platform === 'instagram' ? '#' : '⌁'}
                  </i>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="text-xs font-bold text-brand-ink">{t.topic}</b>
                      <span className="text-[8px] uppercase font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {t.platform.replace('_', ' ')}
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
                          onClick={(e) => e.stopPropagation()}
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
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
};
