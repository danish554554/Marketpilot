import React from 'react';
import {
  Package,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Video,
  Instagram,
  PlusCircle,
  Zap,
  Target
} from 'lucide-react';
import { MarketingStrategy, Product, TrendSignal } from '../types';

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
  const heroProduct = products.find((p) => p.margin_tier === 'high') || products[0];
  const topTrend = trends[0];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Intro Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1">
            <Zap size={11} className="text-brand-green" /> {todayFormatted}
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Good morning, {businessName || 'Store Owner'} <em className="not-italic text-brand-green">✦</em>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your AI Marketing Copilot has analyzed your products, profit margins, and viral trends for today.
          </p>
        </div>
        <button
          onClick={() => onNavigate('planner')}
          className="self-start sm:self-auto bg-white border border-brand-line text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-slate-50"
        >
          <Sparkles size={13} className="text-brand-green" />
          <span>Active Strategy Plan</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <Package size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Active products</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {products.length}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            {products.length > 0 ? (
              <><strong className="text-brand-green">+{products.length}</strong> in inventory</>
            ) : (
              <span className="text-slate-400">0 added yet</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CalendarIcon size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Upcoming content</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {activeStrategy?.pillars ? activeStrategy.pillars.length : 0}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            {activeStrategy?.pillars ? (
              <><strong className="text-brand-green">{activeStrategy.pillars.length}</strong> scheduled drops</>
            ) : (
              <span className="text-slate-400">0 scheduled</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <TrendingUp size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Trend signals found</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {trends.length}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            {trends.length > 0 ? (
              <><strong className="text-brand-green">{trends.filter(t => t.confidence_score >= 90).length}</strong> high relevance</>
            ) : (
              <span className="text-slate-400">Ready to ingest</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CheckCircle size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Plans awaiting approval</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {activeStrategy ? 1 : 0}
          </b>
          <small className="text-[10px] text-emerald-700 font-bold block mt-1">
            {activeStrategy ? 'Active strategy' : 'None pending'}
          </small>
        </article>
      </div>

      {/* Two Column: Today's Action Center & Trend Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Recommended Post (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          {heroProduct ? (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <small className="text-[9px] font-extrabold tracking-wider text-emerald-700 uppercase flex items-center gap-1.5">
                    <Sparkles size={12} className="text-brand-green" />
                    WHAT TO POST TODAY · AI COPILOT RECOMMENDATION
                  </small>
                  <h2 className="text-lg font-display font-bold text-brand-ink mt-0.5">
                    Publish a TikTok Video & Instagram Reel for {heroProduct.name}.
                  </h2>
                </div>
                <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">
                  {heroProduct.profit_margin ? `${heroProduct.profit_margin}% margin` : 'Hero SKU'}
                </span>
              </div>

              {/* Product info banner */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 my-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex flex-col items-center justify-center font-display font-extrabold text-[9px] leading-tight text-center">
                  <span>HERO</span>
                  <small className="text-[7px] font-sans opacity-80">item</small>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Target Product</span>
                  <h3 className="text-sm font-bold text-brand-ink truncate">{heroProduct.name}</h3>
                  <small className="text-[10px] text-emerald-700 font-bold block">
                    ● In stock · {heroProduct.stock_quantity || 100} units · {heroProduct.profit_margin || '65'}% margin tier
                  </small>
                </div>
              </div>

              {/* AI Grounded Reason */}
              <div className="bg-[#f5f8f7] border border-[#e4eae8] rounded-xl p-3.5 flex gap-2.5 my-3">
                <Sparkles size={16} className="text-brand-green shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-brand-ink font-bold block mb-0.5">Why this content today?</strong>
                  <p className="text-slate-600 m-0">
                    High margin profitability tier combined with top consumer pain point: <em>"{heroProduct.pain_points?.[0] || 'daily routine frustration'}"</em>. Direct problem-solution hooks deliver the highest conversion rate today.
                  </p>
                </div>
              </div>

              {/* Today's Recommended Channels */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="border-l-2 border-brand-green pl-2.5 py-1 bg-emerald-50/40 rounded-r-lg">
                  <small className="text-[8px] font-extrabold text-brand-green tracking-wider uppercase flex items-center gap-1">
                    <Video size={10} /> TIKTOK VIDEO HOOK
                  </small>
                  <b className="text-xs text-brand-ink block my-0.5">3-Second Problem Split-Screen</b>
                  <span className="text-[10px] text-slate-500 truncate block">“Watch this 30-sec demo fix”</span>
                </div>
                <div className="border-l-2 border-brand-blue pl-2.5 py-1 bg-blue-50/40 rounded-r-lg">
                  <small className="text-[8px] font-extrabold text-brand-blue tracking-wider uppercase flex items-center gap-1">
                    <Instagram size={10} /> INSTAGRAM CAROUSEL
                  </small>
                  <b className="text-xs text-brand-ink block my-0.5">3 Routine Mistakes Breakdown</b>
                  <span className="text-[10px] text-slate-500 truncate block">Educate & drive DM sales</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <Package size={36} className="mx-auto text-emerald-600" />
              <h3 className="font-bold text-base text-brand-ink">👋 Welcome! Let's Add Your First Product</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your product with retail & cost price. MarketPilot AI will calculate your margins and tell you exactly what viral video scripts and carousel posts to publish every day!
              </p>
              <button
                onClick={() => onNavigate('products')}
                className="bg-brand-green text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle size={14} />
                <span>+ Add Your First Product</span>
              </button>
            </div>
          )}

          <footer className="pt-3 border-t border-brand-line flex items-center justify-between mt-2">
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-extrabold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Manage Products</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>⚡ Generate & Copy in Studio</span>
            </button>
          </footer>
        </article>

        {/* Trend Intelligence List (5 cols) */}
        <article className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  ACTIVE MARKET SIGNALS
                </small>
                <h2 className="text-base font-display font-bold text-brand-ink">
                  Viral Trends Matching Products
                </h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Live Ingest
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {trends.slice(0, 3).map((trend, i) => (
                <div key={trend.id || i} className="py-3 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] grid place-items-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-brand-ink truncate">{trend.topic}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{trend.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {trend.confidence_score}% Confidence
                      </span>
                      <span className="text-[9px] text-slate-400 capitalize">{trend.platform}</span>
                    </div>
                  </div>
                </div>
              ))}

              {trends.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Click "Trend Intelligence" to ingest live market signals.
                </div>
              )}
            </div>
          </div>

          <footer className="pt-3 border-t border-brand-line flex items-center justify-between mt-2">
            <button
              onClick={() => onNavigate('trends')}
              className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1"
            >
              <span>Explore all {trends.length} signals</span>
              <ArrowRight size={13} />
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
};
