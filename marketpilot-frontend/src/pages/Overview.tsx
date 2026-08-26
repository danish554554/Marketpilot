import React from 'react';
import {
  Package,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ChevronDown
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Intro Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            SATURDAY, 22 AUGUST 2026
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Good morning, {businessName || 'Sarah'} <em className="not-italic text-brand-green">✦</em>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your best marketing opportunities and high-margin inventory are ready for review.
          </p>
        </div>
        <button className="self-start sm:self-auto bg-white border border-brand-line text-slate-600 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-slate-50">
          <span>This week: 18–24 Aug</span>
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

      {/* Two Column: Today's Priority & Trend Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Priority Card (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          {heroProduct ? (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                    TODAY'S STRATEGIC PRIORITY
                  </small>
                  <h2 className="text-lg font-display font-bold text-brand-ink mt-0.5">
                    Make the {heroProduct.name} your hero product.
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
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Recommended Product</span>
                  <h3 className="text-sm font-bold text-brand-ink truncate">{heroProduct.name}</h3>
                  <small className="text-[10px] text-emerald-700 font-bold block">
                    ● In stock · {heroProduct.stock_quantity || 100} units · {heroProduct.profit_margin || '65'}% margin
                  </small>
                </div>
              </div>

              {/* AI Grounded Reason */}
              <div className="bg-[#f5f8f7] border border-[#e4eae8] rounded-xl p-3.5 flex gap-2.5 my-3">
                <Sparkles size={16} className="text-brand-green shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-brand-ink font-bold block mb-0.5">Why this product today?</strong>
                  <p className="text-slate-600 m-0">
                    High stock velocity, high profit margin tier, and addresses customer pain points ({heroProduct.pain_points?.[0] || 'daily customer friction'}) aligned with emerging trend signals.
                  </p>
                </div>
              </div>

              {/* Organic vs Paid split breakdown */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="border-l-2 border-brand-green pl-2.5 py-0.5">
                  <small className="text-[8px] font-extrabold text-brand-green tracking-wider uppercase block">
                    ORGANIC FOCUS
                  </small>
                  <b className="text-xs text-brand-ink block my-0.5">Instagram Reel & Carousel</b>
                  <span className="text-[10px] text-slate-400 truncate block">“Problem-solution routine breakdown”</span>
                </div>
                <div className="border-l-2 border-brand-blue pl-2.5 py-0.5">
                  <small className="text-[8px] font-extrabold text-brand-blue tracking-wider uppercase block">
                    PAID ACQUISITION
                  </small>
                  <b className="text-xs text-brand-ink block my-0.5">Meta & TikTok Ad</b>
                  <span className="text-[10px] text-slate-400 truncate block">Direct response conversion angle</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <Package size={32} className="mx-auto text-slate-300" />
              <h3 className="font-bold text-sm text-brand-ink">No Products in Inventory Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your catalog products with retail & cost prices to let the AI strategist calculate profit margins and viral hooks.
              </p>
              <button
                onClick={() => onNavigate('products')}
                className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-emerald-700 transition-all"
              >
                + Add Your First Product
              </button>
            </div>
          )}

          <footer className="pt-3 border-t border-brand-line flex items-center justify-between mt-2">
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1"
            >
              <span>View full strategy rationale</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="bg-brand-green text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-green-dark"
            >
              Open Studio
            </button>
          </footer>
        </article>

        {/* Trend Intelligence List (5 cols) */}
        <article className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  TREND INTELLIGENCE
                </small>
                <h2 className="text-lg font-display font-bold text-brand-ink">Signals worth using</h2>
              </div>
              <button
                onClick={() => onNavigate('trends')}
                className="text-xs text-brand-green font-bold hover:underline"
              >
                View all ({trends.length}) →
              </button>
            </div>

            {trends.length > 0 ? (
              <div className="space-y-2.5 divide-y divide-slate-100">
                {trends.slice(0, 3).map((t, idx) => (
                  <div
                    key={t.id || idx}
                    onClick={() => onNavigate('trends')}
                    className="pt-2 flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                  >
                    <i className="not-italic w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center text-xs font-extrabold shrink-0">
                      ↗
                    </i>
                    <div className="min-w-0 flex-1">
                      <b className="text-xs text-brand-ink block truncate">{t.topic}</b>
                      <span className="text-[10px] text-slate-400 block">{t.source_name} · {t.confidence_score}% confidence</span>
                    </div>
                    <em className="not-italic text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                      High
                    </em>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No trend signals ingested yet.</p>
                <button
                  onClick={() => onNavigate('trends')}
                  className="text-xs text-brand-green font-bold hover:underline"
                >
                  ⚡ Click to ingest live Google & Reddit trends
                </button>
              </div>
            )}
          </div>

          <p className="text-[10px] bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-100 mt-4 m-0">
            ✓ All signals verify source evidence and confidence score before injection into AI plans.
          </p>
        </article>
      </div>

      {/* Content Calendar Row */}
      <article className="bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              CONTENT CALENDAR
            </small>
            <h2 className="text-lg font-display font-bold text-brand-ink">This week’s plan</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-full bg-brand-green not-italic"></i> Organic
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-full bg-brand-blue not-italic"></i> Paid
            </span>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-extrabold text-brand-green hover:underline ml-2"
            >
              Open calendar →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">MON <b>18</b></span>
            <p className="p-2 rounded-md text-[10px] font-bold mt-2 bg-slate-50 text-slate-400 border border-dashed border-slate-200 text-center">
              No plan
            </p>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">TUE <b>19</b></span>
            <div className="p-2 rounded-lg text-[10px] font-bold mt-2 bg-brand-pale text-brand-green leading-snug">
              <small className="block text-[7px] font-extrabold tracking-wider uppercase">ORGANIC · REEL</small>
              {heroProduct?.name || 'Hero Showcase Reel'}
              <em className="block not-italic text-[8px] font-normal opacity-80 mt-1">Awareness</em>
            </div>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">WED <b>20</b></span>
            <div className="p-2 rounded-lg text-[10px] font-bold mt-2 bg-brand-blue-pale text-brand-blue leading-snug">
              <small className="block text-[7px] font-extrabold tracking-wider uppercase">PAID · META</small>
              Direct Acquisition
              <em className="block not-italic text-[8px] font-normal opacity-80 mt-1">Conversion</em>
            </div>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block flex items-center gap-1">
              THU <b className="bg-brand-green text-white w-4 h-4 rounded-full text-[10px] grid place-items-center">21</b>
            </span>
            <div className="p-2 rounded-lg text-[10px] font-bold mt-2 bg-brand-pale text-brand-green leading-snug">
              <small className="block text-[7px] font-extrabold tracking-wider uppercase">ORGANIC · TIKTOK</small>
              What fits inside?
              <em className="block not-italic text-[8px] font-normal opacity-80 mt-1">Consideration</em>
            </div>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">FRI <b>22</b></span>
            <div className="p-2 rounded-lg text-[10px] font-bold mt-2 bg-brand-pale text-brand-green leading-snug">
              <small className="block text-[7px] font-extrabold tracking-wider uppercase">ORGANIC · STORY</small>
              Customer review
              <em className="block not-italic text-[8px] font-normal opacity-80 mt-1">Trust</em>
            </div>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">SAT <b>23</b></span>
            <div className="p-2 rounded-lg text-[10px] font-bold mt-2 bg-brand-blue-pale text-brand-blue leading-snug">
              <small className="block text-[7px] font-extrabold tracking-wider uppercase">PAID · META</small>
              VIP Retargeting
              <em className="block not-italic text-[8px] font-normal opacity-80 mt-1">Conversion</em>
            </div>
          </div>

          <div className="border-l border-brand-line pl-2 min-h-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 block">SUN <b>24</b></span>
            <p className="p-2 rounded-md text-[10px] font-bold mt-2 bg-slate-50 text-slate-400 border border-dashed border-slate-200 text-center">
              No plan
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};
