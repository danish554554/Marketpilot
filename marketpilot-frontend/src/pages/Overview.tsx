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
  const heroProduct = products.find((p) => p.margin_tier === 'high') || products[0] || {
    name: 'Luna Everyday Bag',
    stock_quantity: 450,
    profit_margin: '68.5',
    pain_points: ['Unorganized daily carry'],
  };

  const topTrend = trends[0] || {
    topic: '“What fits inside” short-form videos',
    source_name: 'TikTok discovery feed',
    confidence_score: 94,
    platform: 'tiktok',
  };

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
            {products.length || 24}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            <strong className="text-brand-green">+3</strong> added this month
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CalendarIcon size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Upcoming content</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">12</b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            <strong className="text-brand-green">8</strong> needs review
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <TrendingUp size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Trend signals found</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {trends.length || 7}
          </b>
          <small className="text-[10px] text-slate-400 font-bold block mt-1">
            <strong className="text-brand-green">3</strong> high relevance
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-4 relative shadow-card">
          <i className="not-italic absolute right-3.5 top-3.5 w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CheckCircle size={15} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-3 mb-1">Plans awaiting approval</span>
          <b className="block font-display font-extrabold text-2xl text-brand-ink">
            {activeStrategy ? 1 : 3}
          </b>
          <small className="text-[10px] text-emerald-700 font-bold block mt-1">
            Due today
          </small>
        </article>
      </div>

      {/* Two Column: Today's Priority & Trend Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Priority Card (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-card flex flex-col justify-between">
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
                92% match
              </span>
            </div>

            {/* Product info banner */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 my-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#4c3529] to-[#9c7962] text-[#eee3d6] flex flex-col items-center justify-center font-display font-extrabold text-[9px] leading-tight text-center">
                <span>HERO</span>
                <small className="text-[7px] font-sans opacity-80">item</small>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Recommended Product</span>
                <h3 className="text-sm font-bold text-brand-ink m-0">{heroProduct.name}</h3>
                <small className="text-[10px] text-emerald-700 font-bold">
                  ● In stock · {heroProduct.stock_quantity || 450} units · {heroProduct.profit_margin || '68'}% margin
                </small>
              </div>
            </div>

            {/* AI Grounded Reason */}
            <div className="bg-[#f5f8f7] border border-[#e4eae8] rounded-xl p-3.5 flex gap-2.5 my-3">
              <Sparkles size={16} className="text-brand-green shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-brand-ink font-bold block mb-0.5">Why this product today?</strong>
                <p className="text-slate-600 m-0">
                  High stock velocity, high profit margin tier, and addresses customer pain points ({heroProduct.pain_points?.[0] || 'daily friction'}) aligned with emerging trend signals.
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
                <span className="text-[10px] text-slate-400 truncate block">“Everything I carry in one routine”</span>
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
                View all →
              </button>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100">
              <div className="pt-2 flex items-center gap-2.5">
                <i className="not-italic w-7 h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center text-xs font-extrabold">
                  ↗
                </i>
                <div className="min-w-0 flex-1">
                  <b className="text-xs text-brand-ink block truncate">{topTrend.topic}</b>
                  <span className="text-[10px] text-slate-400 block">{topTrend.source_name} · 94% confidence</span>
                </div>
                <em className="not-italic text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  High
                </em>
              </div>

              <div className="pt-2.5 flex items-center gap-2.5">
                <i className="not-italic w-7 h-7 rounded-lg bg-blue-50 text-brand-blue grid place-items-center text-xs font-extrabold">
                  #
                </i>
                <div className="min-w-0 flex-1">
                  <b className="text-xs text-brand-ink block truncate">Back-to-routine packing hacks</b>
                  <span className="text-[10px] text-slate-400 block">Instagram · collected 5h ago</span>
                </div>
                <em className="not-italic text-[8px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Medium
                </em>
              </div>

              <div className="pt-2.5 flex items-center gap-2.5">
                <i className="not-italic w-7 h-7 rounded-lg bg-purple-50 text-purple-700 grid place-items-center text-xs font-extrabold">
                  ⌁
                </i>
                <div className="min-w-0 flex-1">
                  <b className="text-xs text-brand-ink block truncate">Functional product comparisons</b>
                  <span className="text-[10px] text-slate-400 block">Meta Creative Center · today</span>
                </div>
                <em className="not-italic text-[8px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Medium
                </em>
              </div>
            </div>
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
              {heroProduct.name}
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
