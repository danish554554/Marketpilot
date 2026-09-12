import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, Plus, Clock, CheckCircle, TrendingUp, ArrowRight, Video, Instagram, Mail, MessageSquare, CheckSquare, Square, CheckCircle2, AlertCircle, Package, Tag, Layers } from 'lucide-react';
import { MarketingStrategy, PlannerContentItem, Product } from '../types';
import { api } from '../api/endpoints';

interface CalendarProps {
  onNavigate: (page: string, productId?: string) => void;
  activeStrategy?: MarketingStrategy | null;
  products?: Product[];
}

export const Calendar: React.FC<CalendarProps> = ({ onNavigate, activeStrategy, products = [] }) => {
  const [items, setItems] = useState<PlannerContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: newStatus as any } : it))
    );

    try {
      await api.updateCalendarItemStatus(itemId, newStatus);
    } catch (err: any) {
      console.warn('Status update API note (mock or offline):', err);
      // Even if network mock, local state remains updated for smooth user experience
    }
  };

  const generateFromActiveStrategy = (customAdditions: PlannerContentItem[] = []) => {
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
          product_name: p.product_name || (products.length > 0 ? products[idx % products.length].name : 'Hero Product'),
          focus_product_id: p.focus_product_id || (products.length > 0 ? products[idx % products.length].id : undefined),
          strategic_rationale: p.rationale || 'Grounded strategy alignment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      setItems([...customAdditions, ...scheduledPillars]);
    } else {
      const prodA = products[0]?.name || '2-in-1 Rechargeable Hair Remover';
      const prodB = products.length > 1 ? products[1]?.name : 'Facial Skincare Kit';

      setItems([
        ...customAdditions,
        {
          id: '1',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: `[TIKTOK] Short Video: 30-Sec ${prodA} Routine`,
          channel: 'tiktok',
          channel_type: 'organic',
          format: 'short_video_script',
          status: 'scheduled',
          scheduled_date: '2026-08-27',
          scheduled_time_slot: 'morning_09_00',
          hook: `Stop applying foundation over peach fuzz — watch this 30-sec ${prodA} prep`,
          primary_text: 'Close-up split screen showing smooth foundation glide over skin vs patchy makeup.',
          structured_content: {},
          call_to_action: `Get the ${prodA} with 20% off`,
          product_name: prodA,
          focus_product_id: products[0]?.id,
          strategic_rationale: 'Trend alignment with live viral search momentum',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
        {
          id: '2',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: `[INSTAGRAM] Paid Ad: ${prodB} Problem vs Fix`,
          channel: 'instagram',
          channel_type: 'paid',
          format: 'post_caption',
          status: 'scheduled',
          scheduled_date: '2026-08-29',
          scheduled_time_slot: 'evening_18_00',
          hook: `Why pay hundreds every month for salon visits when you can do this at home with ${prodB}?`,
          primary_text: 'Direct-response cost comparison highlighting verified results and 30-day guarantee.',
          structured_content: {},
          call_to_action: `Shop ${prodB} today`,
          product_name: prodB,
          focus_product_id: products[1]?.id || products[0]?.id,
          strategic_rationale: 'Paid customer acquisition',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
        {
          id: '3',
          workspace_id: 'ws1',
          created_by: 'u1',
          title: `[EMAIL] VIP Glow Club: ${prodA} Maintenance Guide`,
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
          product_name: prodA,
          focus_product_id: products[0]?.id,
          strategic_rationale: 'Customer retention & LTV maximization',
          created_at: '2026-08-26',
          updated_at: '2026-08-26',
        },
      ]);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    const userEmail = localStorage.getItem('marketpilot_email') || 'sarah@glowsilk.com';
    const customItemsRaw = localStorage.getItem(`marketpilot_custom_calendar_${userEmail}`);
    let customItems: PlannerContentItem[] = [];
    if (customItemsRaw) {
      try {
        customItems = JSON.parse(customItemsRaw);
      } catch {}
    }

    try {
      const res = await api.getCalendar('2026-08-15', '2026-09-15');
      if (res && res.length > 0) {
        setItems([...customItems, ...res]);
      } else {
        generateFromActiveStrategy(customItems);
      }
    } catch {
      generateFromActiveStrategy(customItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [activeStrategy]);

  const handleBatchGenerate = async () => {
    setLoading(true);
    try {
      const generated = await api.batchGenerateCalendar({
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        days_per_week: 4,
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

  const filteredItems = items.filter((i) => {
    const matchesChannel = channelFilter === 'all' || i.channel === channelFilter;
    const matchesProduct =
      productFilter === 'all' ||
      (i.product_name && i.product_name.toLowerCase().includes(productFilter.toLowerCase())) ||
      i.focus_product_id === productFilter;
    return matchesChannel && matchesProduct;
  });

  // Catalog Distribution Balance Calculation
  const productDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) => {
      const name = it.product_name || 'General Catalog';
      counts[name] = (counts[name] || 0) + 1;
    });
    const total = items.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [items]);

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

      {/* Production Progress Bar */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="bg-white border border-brand-line p-4 rounded-2xl shadow-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 grid place-items-center font-bold text-xs">
                {Math.round(
                  (items.filter((i) => i.status === 'created' || i.status === 'published').length /
                    (items.length || 1)) *
                    100
                )}%
              </div>
              <div>
                <small className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  PRODUCTION WORKFLOW VELOCITY
                </small>
                <b className="text-xs text-brand-ink">
                  {items.filter((i) => i.status === 'created' || i.status === 'published').length} of {items.length} Posts Ready to Publish
                </b>
              </div>
            </div>

            <div className="w-44 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (items.filter((i) => i.status === 'created' || i.status === 'published').length /
                      (items.length || 1)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Multi-Product Organic Coverage Balance Meter */}
          {items.length > 0 && (
            <div className="bg-white border border-brand-line p-3.5 rounded-2xl shadow-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-brand-green" />
                  <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Catalog Multi-Product Organic Balance Meter
                  </strong>
                </div>
                <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ✓ Non-Fatiguing Distribution
                </span>
              </div>

              {/* Progress Distribution Bar */}
              <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden bg-slate-100">
                {productDistribution.map((pd, i) => {
                  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                  return (
                    <div
                      key={pd.name}
                      style={{ width: `${pd.pct}%` }}
                      className={`h-full ${colors[i % colors.length]}`}
                      title={`${pd.name}: ${pd.pct}% of posts (${pd.count})`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {productDistribution.map((pd, i) => {
                  const dotColors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                  return (
                    <div key={pd.name} className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                      <span className="font-bold truncate max-w-[130px]">{pd.name}:</span>
                      <span>{pd.pct}% ({pd.count} posts)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Schedule Canvas */}
      <article className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-card space-y-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-brand-line pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <b className="text-sm font-display font-bold text-brand-ink">Upcoming Publishing Queue</b>
              <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredItems.length} Scheduled Drops
              </span>
            </div>
          </div>

          {/* Dual Filter Toolbar: Product Filter + Channel Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Product Filter */}
            <div className="flex flex-wrap items-center gap-1 text-xs font-bold bg-slate-50 p-1 rounded-xl border border-slate-100 max-w-full overflow-x-auto">
              <span className="text-slate-400 text-[10px] uppercase font-extrabold ml-1 mr-1 flex items-center gap-1">
                <Package size={11} /> Product:
              </span>
              <button
                type="button"
                onClick={() => setProductFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                  productFilter === 'all'
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Products ({items.length})
              </button>
              {products.map((p) => {
                const count = items.filter(
                  (it) => it.product_name?.toLowerCase().includes(p.name.toLowerCase()) || it.focus_product_id === p.id
                ).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductFilter(p.name)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
                      productFilter === p.name
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{p.name}</span>
                    <span className="text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Channel Filter */}
            <div className="flex flex-wrap items-center gap-1 text-xs font-bold bg-slate-50 p-1 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-extrabold ml-1 mr-1">Channel:</span>
              {['all', 'tiktok', 'instagram', 'email', 'whatsapp'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannelFilter(c)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-[10px] transition-all cursor-pointer ${
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
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredItems.map((item) => {
            const isCreated = item.status === 'created' || item.status === 'published';
            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-sm ${
                  isCreated
                    ? 'bg-emerald-50/40 border-emerald-300 border-l-4 border-l-emerald-500'
                    : 'bg-slate-50 border-slate-200/90 hover:border-emerald-400/80'
                }`}
              >
                <div>
                  {/* Top Bar: Checkbox + Date Slot + Channel */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      onClick={() => handleStatusChange(item.id, isCreated ? 'scheduled' : 'created')}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-all px-2 py-1 rounded-lg ${
                        isCreated
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700'
                      }`}
                      title={isCreated ? 'Mark as Scheduled' : 'Mark as Created'}
                    >
                      {isCreated ? <CheckSquare size={13} /> : <Square size={13} />}
                      <span className="text-[10px]">{isCreated ? 'Created' : 'Mark Created'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock size={10} />
                        {item.scheduled_date}
                      </span>
                      <span className="text-[8px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        {item.channel}
                      </span>
                    </div>
                  </div>

                  {/* Product Badge */}
                  {item.product_name && (
                    <div className="mb-2 bg-blue-50 border border-blue-200/80 rounded-md px-2 py-1 flex items-center justify-between text-[10px] text-blue-900 font-bold">
                      <span className="flex items-center gap-1 truncate">
                        <span>🧴</span>
                        <span className="truncate">{item.product_name}</span>
                      </span>
                      <span className="text-[8px] bg-white text-blue-700 font-extrabold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                        {item.channel_type || 'organic'}
                      </span>
                    </div>
                  )}

                  {/* Lifecycle Status Dropdown */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                    <select
                      value={item.status || 'scheduled'}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border cursor-pointer focus:outline-none ${
                        item.status === 'created'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'published'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : item.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="scheduled">📅 Scheduled</option>
                      <option value="in_progress">⏳ In Progress</option>
                      <option value="created">✅ Created</option>
                      <option value="published">🚀 Published</option>
                    </select>
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
                    onClick={() => onNavigate('studio', item.focus_product_id)}
                    className="text-brand-green font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Edit in Studio</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
};
