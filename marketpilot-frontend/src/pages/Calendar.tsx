import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, Plus, Clock, CheckCircle, TrendingUp, ArrowRight, Video, Instagram, Mail, MessageSquare } from 'lucide-react';
import { MarketingStrategy, PlannerContentItem } from '../types';
import { api } from '../api/endpoints';

interface CalendarProps {
  onNavigate: (page: string) => void;
  activeStrategy?: MarketingStrategy | null;
}

export const Calendar: React.FC<CalendarProps> = ({ onNavigate, activeStrategy }) => {
  const [items, setItems] = useState<PlannerContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendar('2026-08-15', '2026-09-15');
      if (res && res.length > 0) {
        setItems(res);
      } else {
        generateFromActiveStrategy();
      }
    } catch {
      generateFromActiveStrategy();
    } finally {
      setLoading(false);
    }
  };

  const generateFromActiveStrategy = () => {
    if (activeStrategy?.pillars && activeStrategy.pillars.length > 0) {
      const scheduledPillars: PlannerContentItem[] = activeStrategy.pillars.map((p, idx) => {
        const daysAhead = (idx * 2) + 1;
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const dateStr = d.toISOString().split('T')[0];

        return {
          id: p.id || `cal-${idx}`,
          workspace_id: 'ws1',
          created_by: 'u1',
          title: `[${p.platform.toUpperCase()}] ${p.pillar_name}`,
          channel: p.platform as any,
          channel_type: p.channel_type as any,
          format: p.content_formats?.[0] as any || 'post_caption',
          status: 'scheduled',
          scheduled_date: dateStr,
          scheduled_time_slot: idx % 2 === 0 ? 'morning_09_00' : 'evening_18_00',
          hook: p.hook_ideas?.[0] || 'Viral hook for daily routine',
          primary_text: p.creative_angle || 'Educational demonstration highlighting zero pain & smooth finish.',
          structured_content: {},
          call_to_action: p.suggested_ctas?.[0] || 'Shop now',
          strategic_rationale: p.rationale || 'Grounded strategy alignment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      setItems(scheduledPillars);
    } else {
      setItems([
        {
          id: '1',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[TIKTOK] Short Video: 30-Sec Peach Fuzz Routine',
          channel: 'tiktok',
          channel_type: 'organic',
          format: 'short_video_script',
          status: 'scheduled',
          scheduled_date: '2026-08-27',
          scheduled_time_slot: 'morning_09_00',
          hook: 'Stop applying foundation over peach fuzz — watch this 30-sec prep',
          primary_text: 'Close-up split screen showing foundation glide over hair-free skin vs patchy makeup.',
          structured_content: {},
          call_to_action: 'Get the smooth base tool with 20% off',
          strategic_rationale: 'Trend alignment with live viral search momentum',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
        {
          id: '2',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[INSTAGRAM] Paid Ad: Painless Trimmer vs Waxing',
          channel: 'instagram',
          channel_type: 'paid',
          format: 'post_caption',
          status: 'scheduled',
          scheduled_date: '2026-08-29',
          scheduled_time_slot: 'evening_18_00',
          hook: 'Why pay $80 every month for salon waxing when you can do this in 1 minute?',
          primary_text: 'Direct-response cost comparison highlighting 78.7% margin and 30-day guarantee.',
          structured_content: {},
          call_to_action: 'Shop the 2-in-1 Hair Remover today',
          strategic_rationale: 'Paid customer acquisition',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
        {
          id: '3',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[EMAIL] VIP Glow Club: Skincare Maintenance Tips',
          channel: 'email',
          channel_type: 'organic',
          format: 'email_newsletter',
          status: 'scheduled',
          scheduled_date: '2026-08-31',
          scheduled_time_slot: 'morning_09_00',
          hook: '3 dermatologist tips to prevent breakouts after facial grooming',
          primary_text: 'Hygiene and blade care guide with replacement head flash bundle.',
          structured_content: {},
          call_to_action: 'Read the Glow Guide & Save 15%',
          strategic_rationale: 'Customer retention & LTV maximization',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
      ]);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [activeStrategy]);

  const handleBatchGenerate = async () => {
    setLoading(true);
    try {
      const generated = await api.generateBatchCalendar({
        start_date: '2026-08-26',
        end_date: '2026-09-15',
        days_per_week: 3,
      });
      if (generated && generated.length > 0) {
        setItems(generated);
      } else {
        generateFromActiveStrategy();
      }
    } catch {
      generateFromActiveStrategy();
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (i) => channelFilter === 'all' || i.channel === channelFilter
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title & Grounded Strategy Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <CalendarIcon size={12} className="text-brand-green" />
            EDITORIAL MARKETING SCHEDULE & TIMING
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Publish with Consistency & Clear Purpose
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every day is linked to your AI strategy pillars, live trend hooks, and optimal posting times.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleBatchGenerate}
            disabled={loading}
            className="bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Sparkles size={13} />
            <span>{loading ? 'Auto-scheduling...' : '✦ Sync AI Strategy to Calendar'}</span>
          </button>
        </div>
      </div>

      {/* Active Campaign Link Banner */}
      {activeStrategy && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white grid place-items-center font-bold text-xs">
              ✓
            </div>
            <div>
              <small className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                CONNECTED STRATEGY BLUEPRINT
              </small>
              <b className="text-xs text-emerald-950">{activeStrategy.title}</b>
            </div>
          </div>
          <button
            onClick={() => onNavigate('studio')}
            className="text-xs text-emerald-800 font-extrabold hover:underline flex items-center gap-1"
          >
            <span>Open Studio to copy scripts</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Main Schedule Canvas */}
      <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-line pb-4">
          <div className="flex items-center gap-3">
            <b className="text-sm font-display font-bold text-brand-ink">Upcoming Publishing Queue</b>
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredItems.length} Scheduled Content Drops
            </span>
          </div>

          {/* Filter Channel */}
          <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 p-1 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold ml-1 mr-1">Filter:</span>
            {['all', 'tiktok', 'instagram', 'email', 'whatsapp'].map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={`px-2.5 py-1 rounded-lg capitalize text-[10px] transition-all ${
                  channelFilter === c
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400/80 transition-all hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock size={10} />
                    {item.scheduled_date} · {item.scheduled_time_slot.replace('_', ' ').replace('morning 09 00', '09:00 AM').replace('evening 18 00', '06:00 PM')}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                    {item.channel} · {item.channel_type}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-brand-ink mb-1.5 line-clamp-1">{item.title}</h3>
                
                <blockquote className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70 italic my-2.5 leading-snug">
                  “{item.hook}”
                </blockquote>

                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed m-0">
                  {item.primary_text}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 mt-3 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold truncate max-w-[140px]">
                  CTA: {item.call_to_action}
                </span>
                <button
                  onClick={() => onNavigate('studio')}
                  className="text-brand-green font-extrabold hover:underline flex items-center gap-0.5"
                >
                  <span>Edit in Studio</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};
