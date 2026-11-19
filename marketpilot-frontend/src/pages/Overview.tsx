import React, { useState, useEffect } from 'react';
import {
  Package,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Video,
  Instagram,
  PlusCircle,
  Zap,
  Target,
  Palette,
  DollarSign,
  Flame,
  Check,
  RefreshCw,
  Boxes,
  Truck,
  ShieldCheck,
  Play,
  Layers,
  ShoppingBag,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { BrandKit, MarketingStrategy, Product, TrendSignal } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getIndustryProfile, isTechIndustry } from '../utils/industry';

interface OverviewProps {
  onNavigate: (page: string, productId?: string) => void;
  products: Product[];
  trends: TrendSignal[];
  activeStrategy: MarketingStrategy | null;
  businessName: string;
  brandKit?: BrandKit | null;
  selectedProductId?: string;
  onSelectProduct?: (productId: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigate,
  products,
  trends,
  activeStrategy,
  businessName,
  brandKit,
  selectedProductId,
  onSelectProduct,
}) => {
  const [checklistOpen, setChecklistOpen] = useState(true);
  const { targetCountry, industry } = useAuth();
  const { formatAmount } = useCurrency();
  const activeProfile = getIndustryProfile(industry);

  // Deterministic daily rotation seed: every day of the month highlights a different product!
  const today = new Date();
  const daySeed = today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate();

  const getInitialIndex = () => {
    if (!products || products.length === 0) return 0;
    if (selectedProductId) {
      const idx = products.findIndex((p) => p.id === selectedProductId);
      if (idx !== -1) return idx;
    }
    return daySeed % products.length;
  };

  const [activeProductIdx, setActiveProductIdx] = useState<number>(getInitialIndex);
  const [activeFunnelTier, setActiveFunnelTier] = useState<'tofu' | 'mofu' | 'bofu'>('mofu');

  // Synchronize when selectedProductId updates from elsewhere
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const idx = products.findIndex((p) => p.id === selectedProductId);
      if (idx !== -1 && idx !== activeProductIdx) {
        setActiveProductIdx(idx);
      }
    }
  }, [selectedProductId, products]);

  const handleNextProduct = () => {
    if (products.length <= 1) return;
    const nextIdx = (activeProductIdx + 1) % products.length;
    setActiveProductIdx(nextIdx);
    onSelectProduct?.(products[nextIdx].id);
  };

  const handlePrevProduct = () => {
    if (products.length <= 1) return;
    const prevIdx = (activeProductIdx - 1 + products.length) % products.length;
    setActiveProductIdx(prevIdx);
    onSelectProduct?.(products[prevIdx].id);
  };

  const handleShuffleProduct = () => {
    if (products.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * products.length);
    if (nextIdx === activeProductIdx) {
      nextIdx = (activeProductIdx + 1) % products.length;
    }
    setActiveProductIdx(nextIdx);
    onSelectProduct?.(products[nextIdx].id);
  };

  const handleSelectProduct = (prodId: string) => {
    const idx = products.findIndex((p) => p.id === prodId);
    if (idx !== -1) {
      setActiveProductIdx(idx);
      onSelectProduct?.(prodId);
    }
  };

  const heroProduct = products[activeProductIdx] || products[0];
  const isTech = isTechIndustry(industry) || heroProduct?.category === 'tech' || heroProduct?.category === 'saas' || heroProduct?.category === 'gaas';
  const isUrduMarket = targetCountry?.toLowerCase() === 'pakistan';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  // 5-Step Guided Onboarding Journey State
  const steps = [
    {
      id: 1,
      title: 'Create Workspace',
      desc: `Workspace “${businessName || 'My Store'}” is active and ready.`,
      completed: true,
      actionText: 'View Settings',
      page: 'overview',
    },
    {
      id: 2,
      title: 'Add Brand Kit',
      desc: brandKit?.brand_voice?.length
        ? `${brandKit.brand_voice.length} voice traits & guardrails configured.`
        : 'Set your brand tone and prohibited words to guard AI copy.',
      completed: Boolean(brandKit?.brand_voice && brandKit.brand_voice.length > 0),
      actionText: 'Configure Brand Kit',
      page: 'brand',
    },
    {
      id: 3,
      title: 'Add / Import Products',
      desc: products.length > 0
        ? `${products.length} product${products.length > 1 ? 's' : ''} in inventory with profit margins calculated.`
        : 'Add your catalogue items with retail and cost prices.',
      completed: products.length > 0,
      actionText: '+ Add Products',
      page: 'products',
    },
    {
      id: 4,
      title: 'Set Budget & Offers',
      desc: activeStrategy?.budget_allocation_summary?.organic_percentage
        ? `Allocated: Organic (${activeStrategy.budget_allocation_summary.organic_percentage}%) / Paid (${activeStrategy.budget_allocation_summary.paid_percentage}%).`
        : 'Define monthly ad spend and promotional discounts.',
      completed: Boolean(activeStrategy?.budget_allocation_summary || activeStrategy?.pillars?.some(p => p.channel_type === 'paid')),
      actionText: 'Set Budget & Strategy',
      page: 'planner',
    },
    {
      id: 5,
      title: 'Generate First Plan',
      desc: activeStrategy
        ? `Active strategy “${activeStrategy.title || '4-Week Strategy'}” with ${activeStrategy.pillars?.length || 0} scheduled drops.`
        : 'Use Gemini 3.6 Flash to create your 4-week multi-channel plan.',
      completed: Boolean(activeStrategy),
      actionText: '⚡ Generate Plan',
      page: 'planner',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleLaunchStudio = (tier: 'tofu' | 'mofu' | 'bofu' = activeFunnelTier) => {
    try {
      localStorage.setItem('marketpilot_studio_funnel_tier', tier);
    } catch {}
    if (heroProduct) {
      onSelectProduct?.(heroProduct.id);
      onNavigate('studio', heroProduct.id);
    } else {
      onNavigate('studio');
    }
  };

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
            Your AI Marketing Copilot has analyzed your products, profit margins, and viral daily content funnels for today.
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

      {/* 5-Step Guided Onboarding Progress Checklist */}
      <section className="bg-white border border-brand-line rounded-2xl p-4 sm:p-5 md:p-6 shadow-card space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-700" />
                ONBOARDING ROADMAP
              </span>
              <span className="text-xs font-extrabold text-brand-ink">
                {completedCount} of {steps.length} Steps Completed ({progressPercent}%)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-display font-bold text-brand-ink mt-1">
              Setup Your AI Marketing Engine
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Mini Progress Bar */}
            <div className="w-32 sm:w-44 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-green h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              onClick={() => setChecklistOpen(!checklistOpen)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <span>{checklistOpen ? 'Collapse' : 'Expand'}</span>
              {checklistOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {checklistOpen && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  step.completed
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-slate-50/60 border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      step.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Step {step.id}
                    </span>
                    {step.completed ? (
                      <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-300 shrink-0" />
                    )}
                  </div>
                  <h3 className={`text-xs font-bold ${step.completed ? 'text-emerald-950' : 'text-brand-ink'}`}>
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/50">
                  <button
                    onClick={() => onNavigate(step.page)}
                    className={`text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                      step.completed
                        ? 'text-emerald-800 hover:text-emerald-950'
                        : 'text-brand-green hover:underline'
                    }`}
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <article className="bg-white border border-brand-line rounded-xl p-3 sm:p-4 relative shadow-card overflow-hidden">
          <i className="not-italic absolute right-2.5 sm:right-3.5 top-2.5 sm:top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <Package size={14} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 sm:mt-3 mb-1 truncate pr-6">Active products</span>
          <b className="block font-display font-extrabold text-xl sm:text-2xl text-brand-ink">
            {products.length}
          </b>
          <small className="text-[9px] sm:text-[10px] text-slate-400 font-bold block mt-1 truncate">
            {products.length > 0 ? (
              <><strong className="text-brand-green">+{products.length}</strong> in inventory</>
            ) : (
              <span className="text-slate-400">0 added yet</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-3 sm:p-4 relative shadow-card overflow-hidden">
          <i className="not-italic absolute right-2.5 sm:right-3.5 top-2.5 sm:top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CalendarIcon size={14} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 sm:mt-3 mb-1 truncate pr-6">Upcoming content</span>
          <b className="block font-display font-extrabold text-xl sm:text-2xl text-brand-ink">
            {activeStrategy?.pillars ? activeStrategy.pillars.length : 0}
          </b>
          <small className="text-[9px] sm:text-[10px] text-slate-400 font-bold block mt-1 truncate">
            {activeStrategy?.pillars ? (
              <><strong className="text-brand-green">{activeStrategy.pillars.length}</strong> scheduled drops</>
            ) : (
              <span className="text-slate-400">0 scheduled</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-3 sm:p-4 relative shadow-card overflow-hidden">
          <i className="not-italic absolute right-2.5 sm:right-3.5 top-2.5 sm:top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <TrendingUp size={14} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 sm:mt-3 mb-1 truncate pr-6">Trend signals</span>
          <b className="block font-display font-extrabold text-xl sm:text-2xl text-brand-ink">
            {trends.length}
          </b>
          <small className="text-[9px] sm:text-[10px] text-slate-400 font-bold block mt-1 truncate">
            {trends.length > 0 ? (
              <><strong className="text-brand-green">{trends.filter(t => t.confidence_score >= 90).length}</strong> high relevance</>
            ) : (
              <span className="text-slate-400">Ready to ingest</span>
            )}
          </small>
        </article>

        <article className="bg-white border border-brand-line rounded-xl p-3 sm:p-4 relative shadow-card overflow-hidden">
          <i className="not-italic absolute right-2.5 sm:right-3.5 top-2.5 sm:top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-brand-green grid place-items-center">
            <CheckCircle size={14} />
          </i>
          <span className="block text-slate-400 text-[10px] font-bold mt-2 sm:mt-3 mb-1 truncate pr-6">Plans review</span>
          <b className="block font-display font-extrabold text-xl sm:text-2xl text-brand-ink">
            {activeStrategy ? 1 : 0}
          </b>
          <small className="text-[9px] sm:text-[10px] text-emerald-700 font-bold block mt-1 truncate">
            {activeStrategy ? 'Active strategy' : 'None pending'}
          </small>
        </article>
      </div>

      {/* Two Column: Today's Action Center & Trend Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Recommended Post (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-4 sm:p-5 md:p-6 shadow-card flex flex-col justify-between overflow-hidden">
          {heroProduct ? (
            <div className="space-y-4">
              {/* Product Header & Dynamic Rotation Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <small className="text-[9px] font-extrabold tracking-wider text-emerald-700 uppercase flex items-center gap-1.5">
                      <Sparkles size={12} className="text-brand-green shrink-0" />
                      <span>DAILY AI FUNNEL COPILOT</span>
                    </small>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      Item {activeProductIdx + 1} of {products.length}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                      isTech
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isTech ? '💻 SaaS / Tech' : `${activeProfile.icon || '🛍️'} ${activeProfile.label}`}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-display font-bold text-brand-ink mt-1 break-words">
                    Today's Content Funnel for: <span className="text-emerald-800">{heroProduct.name}</span>
                  </h2>
                </div>

                {/* Carousel / Switcher Controls */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                  <button
                    onClick={handlePrevProduct}
                    disabled={products.length <= 1}
                    className="p-1.5 rounded-lg border border-brand-line bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-all shadow-2xs"
                    title="Previous Product"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={handleShuffleProduct}
                    disabled={products.length <= 1}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-line bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    title="Shuffle Daily Focus Product"
                  >
                    <RefreshCw size={12} className="text-brand-green" />
                    <span>Shuffle</span>
                  </button>
                  <button
                    onClick={handleNextProduct}
                    disabled={products.length <= 1}
                    className="p-1.5 rounded-lg border border-brand-line bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-all shadow-2xs"
                    title="Next Product"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Quick Product Jump Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase shrink-0">Select Product:</span>
                <select
                  value={heroProduct.id}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="flex-1 text-xs font-bold bg-white border border-brand-line rounded-lg px-2.5 py-1.5 text-brand-ink focus:outline-none focus:border-brand-green shadow-2xs truncate"
                >
                  {products.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      #{idx + 1}: {p.name} ({p.profit_margin ? `${p.profit_margin}% margin` : formatAmount(p.price)})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <span className="text-[10px] font-bold text-slate-500">
                    {formatAmount(heroProduct.price)}
                  </span>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {heroProduct.profit_margin ? `${heroProduct.profit_margin}% margin` : 'Active'}
                  </span>
                </div>
              </div>

              {/* 3-Tier Daily Content Funnel Tabs (From Business Video Strategy) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-brand-green" />
                    <small className="text-[10px] font-extrabold text-brand-ink uppercase tracking-wider">
                      The 3-Video Daily Content Formula
                    </small>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    Strategy: 5–6 Daily Drops across 3 Tiers
                  </span>
                </div>

                {/* Tier Switcher Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFunnelTier('tofu')}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                      activeFunnelTier === 'tofu'
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                        Tier 1 · TOFU
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">2/day</span>
                    </div>
                    <strong className="text-xs font-bold text-brand-ink block truncate">
                      🎣 Relatable Story Hook
                    </strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      Viral watch-time & profile clicks
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFunnelTier('mofu')}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                      activeFunnelTier === 'mofu'
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Tier 2 · MOFU
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">2–3/day</span>
                    </div>
                    <strong className="text-xs font-bold text-brand-ink block truncate">
                      ⚡ Direct Solution Demo
                    </strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      "Seedhe CTA" problem fix
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFunnelTier('bofu')}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                      activeFunnelTier === 'bofu'
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                        Tier 3 · BOFU
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">1/day</span>
                    </div>
                    <strong className="text-xs font-bold text-brand-ink block truncate">
                      📦 Trust & Social Proof
                    </strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      "Stock unboxing & reviews" closes sales
                    </span>
                  </button>
                </div>

                {/* Active Funnel Tier Content Preview */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#fafcfb] space-y-2.5">
                  {activeFunnelTier === 'tofu' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase flex items-center gap-1">
                          <Flame size={12} className="text-amber-600" /> TOP OF FUNNEL (ORGANIC DISCOVERY)
                        </span>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          Algorithm Hook · No Hard Sell
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Angle Concept (From Podcast Strategy):</strong> Casual daily life / behind-the-scenes hustle (e.g., <em>"Dukaan jaldi mein kholi"</em> or relatable morning chaos). Hooks viewer attention and drives profile visits (<em>"banda profile kholta hai"</em>).
                      </p>
                      <div className="bg-white border border-amber-200/80 rounded-lg p-2.5 text-xs">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Today's Hook Line:</span>
                        <p className="text-brand-ink font-semibold italic">
                          {isUrduMarket
                            ? isTech
                              ? `“Jab client bole '10 minute mein deliver kardo' aur manual kaam mein 4 ghante lagte hain... Pehle yeh hack dekhein!”`
                              : `“Dukaan jaldi mein kholi aur subah subah yeh ho gaya... Har kisi ki rozana ki pareshani!”`
                            : isTech
                              ? `“POV: You just spent 3 hours copying data manually before realizing this exists...”`
                              : `“Behind the scenes of our morning rush: When one simple mistake costs you 2 hours!”`}
                        </p>
                      </div>
                    </>
                  )}

                  {activeFunnelTier === 'mofu' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase flex items-center gap-1">
                          <Zap size={12} className="text-brand-green" /> MIDDLE OF FUNNEL (CORE DEMO & OFFER)
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                          Seedhe-Seedhe Call To Action
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Angle Concept (From Podcast Strategy):</strong> Direct problem-solution connection: <em>"Agar aapke paas yeh problem hai, toh hamare paas yeh solution aa gaya."</em> 30-sec live feature demonstration solving <em>"{heroProduct.pain_points?.[0] || 'daily manual friction'}"</em> followed by clear order link.
                      </p>
                      <div className="bg-white border border-emerald-200/80 rounded-lg p-2.5 text-xs">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Today's Demo Hook & CTA:</span>
                        <p className="text-brand-ink font-semibold italic">
                          {isUrduMarket
                            ? `“Purane tareeqon par paise zaya karna band karein! Yeh ${heroProduct.name} ${heroProduct.features?.[0] || 'advanced feature'} ke sath instant result deta hai — abhi bio link se Cash on Delivery par order karein!”`
                            : `“Stop wasting hours on ${heroProduct.pain_points?.[0] || 'outdated methods'}. Here is how ${heroProduct.name} solves it in 30 seconds with 20% launch discount!”`}
                        </p>
                      </div>
                    </>
                  )}

                  {activeFunnelTier === 'bofu' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-blue-800 uppercase flex items-center gap-1">
                          <ShieldCheck size={12} className="text-blue-600" /> BOTTOM OF FUNNEL (TRUST & SOCIAL PROOF)
                        </span>
                        <span className="text-[9px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                          "Bora Khul Raha Hai" · Stock & Social Proof
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Angle Concept (From Podcast Strategy):</strong> Stock unboxing, live customer review proof, dispatch verification, and quality inspection. Eradicates customer skepticism and establishes authentic business credibility (<em>"Yeh ek genuine business seller hai"</em>).
                      </p>
                      <div className="bg-white border border-blue-200/80 rounded-lg p-2.5 text-xs">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Today's Proof Script Angle:</span>
                        <p className="text-brand-ink font-semibold italic">
                          {isUrduMarket
                            ? isTech
                              ? `“Live dashboard proof: Dekhein kaise ek user ne real client ka 2 ghante ka kaam sirf 5 minute mein complete kiya!”`
                              : `“Naya stock unboxing & dispatch! Aaj ke 50+ parcels pack ho rahe hain — Cash on Delivery & 7 days check warranty ke sath!”`
                            : isTech
                              ? `“Behind our live dashboard: Exactly how 500+ active users run this workflow daily with zero errors.”`
                              : `“Warehouse dispatch day! Packing orders live with proof of delivery and verified quality guarantee.”`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Explainer Strategy Pill */}
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-950">
                <Sparkles size={14} className="text-brand-green shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Why this 3-tier formula works:</strong> Relying on 1 boring product ad burns budget. High-performing stores publish <strong>5–6 short videos a day</strong>: 2 Relatable Hooks (drive profile visits), 3 Direct Solution Demos (present the offer), and 1 Social Proof / Unboxing video (closes sales).
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 sm:py-10 text-center space-y-3">
              <Package size={36} className="mx-auto text-emerald-600" />
              <h3 className="font-bold text-base text-brand-ink">👋 Welcome! Let's Add Your First Product</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your product or SaaS tool. MarketPilot AI will calculate your margins and dynamically schedule your daily 3-tier content funnels!
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

          <footer className="pt-3 border-t border-brand-line flex flex-col sm:flex-row gap-2.5 sm:gap-0 sm:items-center sm:justify-between mt-3">
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-extrabold text-slate-500 hover:text-slate-900 flex items-center gap-1 self-start"
            >
              <span>Manage All {products.length} Products</span>
              <ArrowRight size={13} />
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleLaunchStudio(activeFunnelTier)}
                className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto text-center"
              >
                <Sparkles size={13} />
                <span>⚡ Generate Tier Script in Studio</span>
              </button>
            </div>
          </footer>
        </article>

        {/* Trend Intelligence List (5 cols) */}
        <article className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-4 sm:p-5 md:p-6 shadow-card flex flex-col justify-between overflow-hidden">
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
                <div key={trend.id || i} className="py-3 flex items-start gap-3 min-w-0">
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
