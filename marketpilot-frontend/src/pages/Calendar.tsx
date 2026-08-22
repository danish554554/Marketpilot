import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, Plus, Clock, CheckCircle } from 'lucide-react';
import { PlannerContentItem } from '../types';
import { api } from '../api/endpoints';

interface CalendarProps {
  onNavigate: (page: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<PlannerContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendar('2026-08-15', '2026-09-15');
      setItems(res);
    } catch {
      // Fallback demo items if backend offline
      setItems([
        {
          id: '1',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[INSTAGRAM] Reel: Hero Bag Demonstration',
          channel: 'instagram',
          channel_type: 'organic',
          format: 'post_caption',
          status: 'scheduled',
          scheduled_date: '2026-08-19',
          scheduled_time_slot: 'morning_09_00',
          hook: 'One bag, everything you need for a busy day.',
          primary_text: 'From lectures to coffee runs, the Luna Everyday Bag keeps essentials together.',
          structured_content: {},
          call_to_action: 'Explore collection',
          strategic_rationale: 'Organic awareness',
          created_at: '2026-08-22',
          updated_at: '2026-08-22',
        },
        {
          id: '2',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[TIKTOK] Short Video: What Fits Inside?',
          channel: 'tiktok',
          channel_type: 'organic',
          format: 'short_video_script',
          status: 'scheduled',
          scheduled_date: '2026-08-21',
          scheduled_time_slot: 'evening_18_00',
          hook: 'Stop struggling with messy bags: 4-step framework',
          primary_text: 'Scene 1: Close-up on unorganized items...',
          structured_content: {},
          call_to_action: 'Shop now',
          strategic_rationale: 'Trend alignment',
          created_at: '2026-08-22',
          updated_at: '2026-08-22',
        },
        {
          id: '3',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: '[EMAIL] Weekly VIP Briefing: Product Spotlight',
          channel: 'email',
          channel_type: 'organic',
          format: 'email_newsletter',
          status: 'scheduled',
          scheduled_date: '2026-08-24',
          scheduled_time_slot: 'morning_09_00',
          hook: 'The smartest way to tackle your daily carry',
          primary_text: 'Hi there, discover why Luna Everyday Bag is our highest rated...',
          structured_content: {},
          call_to_action: 'Shop VIP offer',
          strategic_rationale: 'Retention LTV',
          created_at: '2026-08-22',
          updated_at: '2026-08-22',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const handleBatchGenerate = async () => {
    setLoading(true);
    try {
      const generated = await api.generateBatchCalendar({
        start_date: '2026-08-22',
        end_date: '2026-09-12',
        days_per_week: 3,
      });
      setItems(generated);
    } catch {
      fetchCalendar();
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (i) => channelFilter === 'all' || i.channel === channelFilter
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            EDITORIAL MARKETING CALENDAR
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Every day has a clear purpose.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production-ready marketing schedules with balanced organic reach and paid acquisition cadence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleBatchGenerate}
            disabled={loading}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{loading ? 'Scheduling...' : '✦ Batch generate calendar'}</span>
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-line pb-4">
          <div className="flex items-center gap-3">
            <b className="text-sm font-display font-bold text-brand-ink">August — September 2026</b>
            <span className="text-xs text-slate-400">({filteredItems.length} scheduled items)</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 text-[11px] mr-1">Filter Channel:</span>
            {['all', 'instagram', 'tiktok', 'email', 'whatsapp'].map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={`px-2.5 py-1 rounded-lg capitalize text-[10px] transition-all ${
                  channelFilter === c
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-brand-green/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9px] font-extrabold text-brand-green bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} />
                    {item.scheduled_date} · {item.scheduled_time_slot.replace('_', ' ')}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    {item.channel}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-brand-ink mb-1.5 line-clamp-1">{item.title}</h3>
                <blockquote className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 italic my-2">
                  “{item.hook}”
                </blockquote>

                <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed m-0">
                  {item.primary_text}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 mt-3 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold truncate max-w-[150px]">
                  CTA: {item.call_to_action}
                </span>
                <button
                  onClick={() => onNavigate('studio')}
                  className="text-brand-green font-extrabold hover:underline"
                >
                  Edit in Studio →
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};
