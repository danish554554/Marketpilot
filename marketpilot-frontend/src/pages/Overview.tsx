import React, { useState } from 'react';
import {
  Package,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  DollarSign,
  BarChart2,
  PieChart,
  ArrowUpRight,
  Zap,
  Target,
  ShieldCheck
} from 'lucide-react';
import { MarketingStrategy, Product, TrendSignal } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface OverviewProps {
  onNavigate: (page: string) => void;
  products: Product[];
  trends: TrendSignal[];
  activeStrategy: MarketingStrategy | null;
  businessName: string;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigate,
  products,
  trends,
  activeStrategy,
  businessName,
}) => {
  const { formatAmount, currencySymbol, currencyConfig } = useCurrency();
  const [graphTimeframe, setGraphTimeframe] = useState<'30days' | '7days'>('30days');

  const heroProduct = products.find((p) => p.margin_tier === 'high') || products[0] || {
    name: '2-in-1 Rechargeable Hair Remover',
    stock_quantity: 650,
    price: 4500,
    cost_price: 1200,
    profit_margin: '78.7',
    pain_points: ['Painful monthly waxing', 'Razor burn and redness'],
  };

  const topTrend = trends[0] || {
    topic: '“30-Second Peach Fuzz Removal Before Makeup”',
    source_name: 'Google Trends & TikTok',
    confidence_score: 96,
    platform: 'tiktok',
  };

  // Dynamic graph data tailored for selected currency
  const isPKR = currencyConfig.code === 'PKR';
  const weeklyData = [
    { label: 'Week 1', revenue: isPKR ? 180000 : 1800, profit: isPKR ? 135000 : 1350, spend: isPKR ? 28000 : 280, roas: '4.8x' },
    { label: 'Week 2', revenue: isPKR ? 240000 : 2400, profit: isPKR ? 182000 : 1820, spend: isPKR ? 35000 : 350, roas: '5.2x' },
    { label: 'Week 3', revenue: isPKR ? 310000 : 3100, profit: isPKR ? 238000 : 2380, spend: isPKR ? 42000 : 420, roas: '5.6x' },
    { label: 'Week 4 (Est)', revenue: isPKR ? 420000 : 4200, profit: isPKR ? 325000 : 3250, spend: isPKR ? 55000 : 550, roas: '5.9x' },
  ];

  const totalRevenue = weeklyData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = weeklyData.reduce((acc, curr) => acc + curr.profit, 0);
  const totalSpend = weeklyData.reduce((acc, curr) => acc + curr.spend, 0);
  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Intro Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            EXECUTIVE MARKETING COMMAND CENTER
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Good day, {businessName || 'GlowSilk Beauty'} <em className="not-italic text-brand-green">✦</em>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your real-time sales velocity, live market trend signals, and AI campaign execution at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('planner')}
            className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={13} />
            <span>Generate New Plan</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white border border-brand-line rounded-2xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center font-bold">
            <TrendingUp size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 mb-1">Monthly Sales Revenue</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {formatAmount(totalRevenue)}
          </b>
          <small className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} />
            <span>+24.5% vs last month</span>
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-2xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center font-bold">
            <DollarSign size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 mb-1">Estimated Net Profit</span>
          <b className="block font-display font-extrabold text-2xl text-emerald-700">
            {formatAmount(totalProfit)}
          </b>
          <small className="text-[10px] text-slate-500 font-bold block mt-1">
            Avg Profit Margin: <strong className="text-emerald-700">74.2%</strong>
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-2xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <Package size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 mb-1">Hero Inventory Units</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {heroProduct.stock_quantity || 650}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            <strong className="text-brand-green">{products.length || 1}</strong> active product lines
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-2xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <Zap size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 mb-1">Live Trend Signals</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {trends.length || 9}
          </b>
          <small className="text-[10px] text-emerald-700 font-bold block mt-1">
            Google & Reddit Ingested
          </small>
        </article>
      </div>

      {/* Interactive Performance Graph & Channel Revenue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Sales & Profit Velocity Graph (8 cols) */}
        <article className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-line pb-4">
            <div>
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <BarChart2 size={12} className="text-brand-green" /> REVENUE & PROFIT MARGIN VELOCITY
              </small>
              <h2 className="text-base font-display font-bold text-brand-ink mt-0.5">
                Campaign Sales Growth & ROAS Curve
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">Currency: {currencyConfig.code}</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setGraphTimeframe('30days')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
                    graphTimeframe === '30days' ? 'bg-white text-brand-green shadow-sm' : 'text-slate-500'
                  }`}
                >
                  4 Weeks
                </button>
                <button
                  onClick={() => setGraphTimeframe('7days')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
                    graphTimeframe === '7days' ? 'bg-white text-brand-green shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Recent
                </button>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-4 gap-4 h-48 items-end border-b border-slate-100 pb-3">
              {weeklyData.map((d, i) => {
                const heightPct = Math.round((d.revenue / maxRevenue) * 100);
                const profitHeightPct = Math.round((d.profit / maxRevenue) * 100);

                return (
                  <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatAmount(d.revenue)}
                    </div>
                    <div className="w-full max-w-[50px] flex items-end justify-center gap-1 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-1/2 bg-emerald-600 rounded-t-lg transition-all group-hover:bg-emerald-700"
                        title={`Revenue: ${formatAmount(d.revenue)}`}
                      />
                      {/* Net Profit Bar */}
                      <div
                        style={{ height: `${profitHeightPct}%` }}
                        className="w-1/2 bg-emerald-300 rounded-t-lg transition-all group-hover:bg-emerald-400"
                        title={`Net Profit: ${formatAmount(d.profit)}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{d.label}</span>
                    <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {d.roas} ROAS
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend & Summary Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <i className="w-3 h-3 rounded bg-emerald-600 not-italic inline-block" /> Total Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <i className="w-3 h-3 rounded bg-emerald-300 not-italic inline-block" /> Net Profit
                </span>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Total Ad Spend: <b>{formatAmount(totalSpend)}</b> · Blended ROAS: <b className="text-emerald-700">5.4x</b>
              </div>
            </div>
          </div>
        </article>

        {/* Marketing Channel Breakdown (4 cols) */}
        <article className="lg:col-span-4 bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <PieChart size={12} className="text-brand-green" /> REVENUE BY CHANNEL
            </small>
            <h2 className="text-base font-display font-bold text-brand-ink mt-0.5 mb-4">
              Channel Contribution
            </h2>

            {/* Channel Bars */}
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-brand-ink">TikTok Video Ads & Organic</span>
                  <span className="font-extrabold text-emerald-700">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-brand-ink">Instagram Reels & Carousels</span>
                  <span className="font-extrabold text-emerald-700">30%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-brand-ink">Email VIP Retention Drops</span>
                  <span className="font-extrabold text-emerald-700">18%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-brand-ink">WhatsApp Direct Reorders</span>
                  <span className="font-extrabold text-emerald-700">7%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-300 h-2 rounded-full" style={{ width: '7%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-line mt-4">
            <button
              onClick={() => onNavigate('briefs')}
              className="w-full text-center text-xs text-brand-green font-extrabold hover:underline"
            >
              View Channel Briefs & ROAS Targets →
            </button>
          </div>
        </article>
      </div>

      {/* Two Column: Today's Strategic Priority & Trend Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Strategic Priority Card (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  TODAY'S STRATEGIC HERO PRIORITY
                </small>
                <h2 className="text-lg font-display font-bold text-brand-ink mt-0.5">
                  Accelerate the {heroProduct.name}
                </h2>
              </div>
              <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">
                {heroProduct.profit_margin || '78.7'}% Margin
              </span>
            </div>

            {/* Product info banner */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 my-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex flex-col items-center justify-center font-display font-extrabold text-[9px] leading-tight text-center">
                <span>HERO</span>
                <small className="text-[7px] font-sans opacity-80">SKU</small>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Prioritized Inventory</span>
                <h3 className="text-sm font-bold text-brand-ink truncate">{heroProduct.name}</h3>
                <small className="text-[10px] text-emerald-700 font-bold block">
                  Price: {formatAmount(heroProduct.price || 4500)} · In stock: {heroProduct.stock_quantity || 650} units
                </small>
              </div>
            </div>

            {/* AI Strategic Rationale */}
            <div className="bg-[#f5f8f7] border border-[#e4eae8] rounded-xl p-3.5 flex gap-2.5 my-3">
              <Sparkles size={16} className="text-brand-green shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-brand-ink font-bold block mb-0.5">Why this hero focus today?</strong>
                <p className="text-slate-600 m-0">
                  Surging search momentum in live Google Trends & Reddit beauty routines paired with healthy inventory stock and maximum unit profit margin.
                </p>
              </div>
            </div>

            {/* Organic vs Paid split breakdown */}
            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="border-l-2 border-brand-green pl-2.5 py-0.5">
                <small className="text-[8px] font-extrabold text-brand-green tracking-wider uppercase block">
                  ORGANIC VIRAL HOOK
                </small>
                <b className="text-xs text-brand-ink block my-0.5">TikTok & Reels Demo</b>
                <span className="text-[10px] text-slate-400 truncate block">“Before vs after foundation glide”</span>
              </div>
              <div className="border-l-2 border-emerald-600 pl-2.5 py-0.5">
                <small className="text-[8px] font-extrabold text-emerald-700 tracking-wider uppercase block">
                  PAID ACQUISITION
                </small>
                <b className="text-xs text-brand-ink block my-0.5">Meta & TikTok Ad</b>
                <span className="text-[10px] text-slate-400 truncate block">Painless trimmer vs salon waxing</span>
              </div>
            </div>
          </div>

          <footer className="pt-3 border-t border-brand-line flex items-center justify-between mt-2">
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1"
            >
              <span>View Full Strategy Plan</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="bg-brand-green text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all"
            >
              Open Studio
            </button>
          </footer>
        </article>

        {/* Trend Intelligence Feed (5 cols) */}
        <article className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  LIVE TREND SIGNALS
                </small>
                <h2 className="text-base font-display font-bold text-brand-ink">Breakout Topics</h2>
              </div>
              <button
                onClick={() => onNavigate('trends')}
                className="text-xs text-brand-green font-bold hover:underline"
              >
                View all ({trends.length}) →
              </button>
            </div>

            <div className="space-y-2 divide-y divide-slate-100">
              {trends.slice(0, 3).map((t, idx) => (
                <div
                  key={t.id || idx}
                  onClick={() => onNavigate('trends')}
                  className="pt-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                >
                  <i className="not-italic w-7 h-7 rounded-lg bg-emerald-100 text-brand-green grid place-items-center text-xs font-extrabold shrink-0">
                    {t.platform === 'tiktok' ? '↗' : t.platform === 'google_trends' ? '🔍' : '⌁'}
                  </i>
                  <div className="min-w-0 flex-1">
                    <b className="text-xs text-brand-ink block truncate">{t.topic}</b>
                    <span className="text-[10px] text-slate-400 block">{t.source_name} · {t.confidence_score}% confidence</span>
                  </div>
                  <em className="not-italic text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                    Verified
                  </em>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-brand-line mt-3">
            <button
              onClick={() => onNavigate('trends')}
              className="w-full text-center text-xs text-brand-green font-extrabold hover:underline flex items-center justify-center gap-1"
            >
              <span>⚡ Ingest New Trends in Real-Time</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
