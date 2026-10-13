import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, Lightbulb, Briefcase, CheckSquare } from 'lucide-react';
import { MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import {
  PRESET_INDUSTRIES,
  OTHER_INDUSTRY_OPTION,
  MARKETING_CHANNEL_FORMATS,
  getIndustryProfile,
} from '../utils/industry';

interface PlannerProps {
  products: Product[];
  trends: TrendSignal[];
  activeStrategy: MarketingStrategy | null;
  setActiveStrategy: (strategy: MarketingStrategy) => void;
  onNavigate: (page: string, productId?: string) => void;
  selectedProductId?: string;
  onSelectProduct?: (productId: string) => void;
}

export const Planner: React.FC<PlannerProps> = ({
  products,
  trends,
  activeStrategy,
  setActiveStrategy,
  onNavigate,
  selectedProductId: externalProductId,
  onSelectProduct,
}) => {
  const { currencySymbol, currencyConfig } = useCurrency();
  const { industry, setIndustry } = useAuth();

  const activeProfile = getIndustryProfile(industry);
  const isPresetIndustry = PRESET_INDUSTRIES.some(
    (p) => p.id.toLowerCase() === industry.toLowerCase()
  );

  const [industryDropdownValue, setIndustryDropdownValue] = useState<string>(
    isPresetIndustry ? activeProfile.id : OTHER_INDUSTRY_OPTION
  );
  const [customIndustryText, setCustomIndustryText] = useState<string>(
    isPresetIndustry ? '' : industry
  );

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');
  const [campaignMode, setCampaignMode] = useState<'single' | 'balanced'>('balanced');
  const [promoMode, setPromoMode] = useState<'hybrid' | 'organic' | 'paid'>(
    activeProfile.defaultPromoMode
  );
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    activeProfile.recommendedChannels
  );
  const [objective, setObjective] = useState('increase_product_awareness');
  const [budget, setBudget] = useState(currencyConfig.code === 'PKR' ? '50000' : '1500');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    externalProductId || products[0]?.id || ''
  );
  const [selectedTrendId, setSelectedTrendId] = useState<string>('');
  const [includeTrends] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalProductId) {
      setSelectedProductId(externalProductId);
    }
  }, [externalProductId]);

  // Sync when global industry changes from Header
  useEffect(() => {
    const prof = getIndustryProfile(industry);
    const presetMatch = PRESET_INDUSTRIES.some(
      (p) => p.id.toLowerCase() === industry.toLowerCase()
    );
    setIndustryDropdownValue(presetMatch ? prof.id : OTHER_INDUSTRY_OPTION);
    if (!presetMatch) {
      setCustomIndustryText(industry);
    }
    setSelectedChannels(prof.recommendedChannels);
    setPromoMode(prof.defaultPromoMode);
  }, [industry]);

  const handleIndustryDropdownChange = (val: string) => {
    setIndustryDropdownValue(val);
    if (val !== OTHER_INDUSTRY_OPTION) {
      setIndustry(val);
      const prof = getIndustryProfile(val);
      setSelectedChannels(prof.recommendedChannels);
      setPromoMode(prof.defaultPromoMode);
    }
  };

  const handleCustomIndustryApply = (val: string) => {
    setCustomIndustryText(val);
    if (val.trim()) {
      setIndustry(val.trim());
      const prof = getIndustryProfile(val.trim());
      setSelectedChannels(prof.recommendedChannels);
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) => {
      if (prev.includes(channelId)) {
        return prev.length > 1 ? prev.filter((c) => c !== channelId) : prev;
      }
      return [...prev, channelId];
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const chosenChannelObjects = MARKETING_CHANNEL_FORMATS.filter((c) =>
      selectedChannels.includes(c.id)
    );
    const channelNamesList = chosenChannelObjects.map((c) => c.label).join(', ');
    const promoDescription =
      promoMode === 'organic'
        ? '100% Organic Content & Community Growth ($0 Paid Ads)'
        : promoMode === 'paid'
        ? '100% Paid Acquisition & Performance Ads'
        : `Hybrid Organic + Paid Growth (${activeProfile.organicRatio}% Organic / ${activeProfile.paidRatio}% Paid)`;

    try {
      const selectedTrend = trends.find((t) => t.id === selectedTrendId);
      const customPrompt = [
        `Business Industry: ${activeProfile.label}.`,
        `Promotion Mode: ${promoDescription}.`,
        `Required Channels & Formats: ${channelNamesList}.`,
        selectedTrend ? `Focus especially on the market trend: "${selectedTrend.topic}".` : '',
        notes,
      ]
        .filter(Boolean)
        .join(' ');

      const result = await api.generateStrategy({
        timeframe,
        primary_goal: objective,
        include_trends: includeTrends,
        custom_instructions: customPrompt,
      });
      setActiveStrategy(result);
    } catch (err) {
      const prod1 = products.find((p) => p.id === selectedProductId) || products[0];
      const prod2 =
        products.length > 1
          ? products[1].id === prod1?.id
            ? products[0]
            : products[1]
          : prod1;
      const trend = trends.find((t) => t.id === selectedTrendId) || trends[0];
      const isBalanced = campaignMode === 'balanced' && products.length > 1;
      const isSaaS =
        activeProfile.id.toLowerCase().includes('saas') ||
        activeProfile.id.toLowerCase().includes('tech');

      const ch1 = chosenChannelObjects[0] || MARKETING_CHANNEL_FORMATS[0];
      const ch2 = chosenChannelObjects[1] || chosenChannelObjects[0] || MARKETING_CHANNEL_FORMATS[2];
      const ch3 = chosenChannelObjects[2] || chosenChannelObjects[0] || MARKETING_CHANNEL_FORMATS[1];
      const ch4 = chosenChannelObjects[3] || chosenChannelObjects[0] || MARKETING_CHANNEL_FORMATS[6];

      const orgPct = promoMode === 'organic' ? 100 : promoMode === 'paid' ? 0 : activeProfile.organicRatio;
      const paidPct = promoMode === 'organic' ? 0 : promoMode === 'paid' ? 100 : activeProfile.paidRatio;

      const fallbackStrategy: MarketingStrategy = {
        id: 'strat-' + Date.now(),
        workspace_id: 'ws1',
        created_by: 'u1',
        title: `${timeframe === 'weekly' ? '7-Day Sprint' : '30-Day Campaign'}: ${activeProfile.label} (${
          promoMode === 'organic' ? 'Organic Growth' : promoMode === 'paid' ? 'Paid Scale' : 'Organic + Paid Hybrid'
        })`,
        timeframe,
        status: 'approved',
        executive_summary: `${activeProfile.icon} Tailored ${activeProfile.label} strategy (${promoDescription}) across ${channelNamesList}. ${activeProfile.growthPlaybook} Prioritizes ${
          prod1?.name || activeProfile.offeringSingular
        } to solve customer pain points and maximize ROI.`,
        target_audience_summary: activeProfile.audienceSummary,
        budget_allocation_summary: {
          total_budget: promoMode === 'organic' ? 0 : Number(budget) || 15000,
          currency: currencyConfig.code,
          organic_percentage: orgPct,
          paid_percentage: paidPct,
        },
        product_priorities_summary: {
          hero_products: products.map((p) => ({
            name: p.name,
            margin_tier: p.margin_tier || 'high',
            stock_quantity: p.stock_quantity,
          })),
        },
        strategic_rationale: activeProfile.growthPlaybook,
        pillars: [
          {
            id: 'p-1',
            strategy_id: 'strat-1',
            pillar_name: isSaaS
              ? `Founder Thought Leadership & ${prod1?.name || 'SaaS'} Authority (${ch1.shortLabel})`
              : `Hero Spotlight: ${prod1?.name || activeProfile.offeringSingular} (${ch1.shortLabel})`,
            objective: 'increase_product_awareness',
            channel_type: promoMode === 'paid' ? 'paid' : 'organic',
            platform: ch1.platform,
            focus_product_id: prod1?.id,
            product_name: prod1?.name || activeProfile.offeringSingular,
            trend_topic: trend?.topic || `${activeProfile.label} Industry Shift`,
            creative_angle: isSaaS
              ? `Break down the hidden cost of ${prod1?.pain_points?.[0] || 'manual workflows'} and show how ${prod1?.name || 'our platform'} automates it in 60 seconds`
              : `Educational storytelling highlighting how ${prod1?.name || activeProfile.offeringSingular} solves ${prod1?.pain_points?.[0] || 'daily friction'} in ${activeProfile.label}`,
            hook_ideas: isSaaS
              ? [
                  `We talked to 50+ teams in ${activeProfile.label}. Everyone had the same bottleneck: ${prod1?.pain_points?.[0] || 'manual work'}.`,
                  `Stop paying for 5 अलग tools when 1 autonomous workflow does this:`,
                  `How to save 12+ hours/week using ${prod1?.name || 'our SaaS'} (Step-by-Step)`,
                ]
              : [
                  `Stop ignoring ${prod1?.pain_points?.[0] || 'this common mistake'} — watch this 30-sec fix`,
                  `The #1 secret in ${activeProfile.label} nobody talks about`,
                  `Why everyone is switching to ${prod1?.name || 'our signature solution'}`,
                ],
            suggested_ctas: [
              isSaaS
                ? `Start your free trial of ${prod1?.name || 'MarketPilot'}`
                : prod1
                ? `Order / Book ${prod1.name} today`
                : 'Claim 20% Launch Offer',
            ],
            content_formats: [ch1.shortLabel],
            estimated_effort: 'medium',
            rationale: `Executes on ${ch1.label} to build high-trust ${promoMode === 'paid' ? 'paid reach' : 'organic authority'} in ${activeProfile.label}.`,
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            strategy_id: 'strat-1',
            pillar_name: isSaaS
              ? `Product Demo & Walkthrough (${ch2.shortLabel})`
              : isBalanced
              ? `Direct Response: ${prod2?.name} Acquisition (${ch2.shortLabel})`
              : `Before/After Proof & Comparison (${ch2.shortLabel})`,
            objective: 'increase_sales',
            channel_type: promoMode === 'organic' ? 'organic' : 'paid',
            platform: ch2.platform,
            focus_product_id: isBalanced ? prod2?.id : prod1?.id,
            product_name: (isBalanced ? prod2?.name : prod1?.name) || activeProfile.offeringSingular,
            trend_topic: isSaaS ? 'Live Screen-Share Demo' : 'Direct-Response Comparison',
            creative_angle: `Visual proof demonstrating '${(isBalanced ? prod2 : prod1)?.features?.[0] || 'instant results'}' on ${ch2.label}`,
            hook_ideas: [
              `Watch what happens in 30 seconds when you use ${(isBalanced ? prod2 : prod1)?.name || 'this'}`,
              `Old way vs. The ${activeProfile.label} Smart Way (Side-by-Side Comparison)`,
              `Tired of ${(isBalanced ? prod2 : prod1)?.pain_points?.[0] || 'overpaying'}? Try this instead`,
            ],
            suggested_ctas: [
              isSaaS
                ? 'Book a 15-Min Live Demo / Start Free'
                : `Claim ${(isBalanced ? prod2 : prod1)?.name || 'Exclusive Offer'} Today`,
            ],
            content_formats: [ch2.shortLabel],
            estimated_effort: 'low',
            rationale: `Drives high-intent conversions via ${ch2.label} (${promoMode === 'organic' ? 'Organic' : 'Paid'} funnel).`,
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-3',
            strategy_id: 'strat-1',
            pillar_name: `Community & Trend Velocity: ${trend?.topic || activeProfile.label} (${ch3.shortLabel})`,
            objective: 'increase_engagement',
            channel_type: promoMode === 'paid' ? 'paid' : 'organic',
            platform: ch3.platform,
            focus_product_id: prod1?.id,
            product_name: prod1?.name || activeProfile.offeringSingular,
            trend_topic: trend?.topic || `${activeProfile.label} Viral Angle`,
            creative_angle: `Connect '${trend?.topic || 'current market conversation'}' directly to ${prod1?.name || activeProfile.offeringSingular} on ${ch3.label}`,
            hook_ideas: [
              `3 things changing ${activeProfile.label} right now (and how to stay ahead)`,
              `Behind the scenes: How we deliver ${prod1?.features?.[0] || 'top results'} every day`,
            ],
            suggested_ctas: ['Comment "GUIDE" below and we will send the link'],
            content_formats: [ch3.shortLabel],
            estimated_effort: 'medium',
            rationale: `Captures algorithmic reach and social proof on ${ch3.label}.`,
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-4',
            strategy_id: 'strat-1',
            pillar_name: isSaaS
              ? `Trial Onboarding & Case Study Conversion (${ch4.shortLabel})`
              : `VIP Retention, Referral & Repeat Closing (${ch4.shortLabel})`,
            objective: 'increase_sales',
            channel_type: promoMode === 'paid' ? 'paid' : 'organic',
            platform: ch4.platform,
            focus_product_id: isBalanced ? prod2?.id : prod1?.id,
            product_name: isBalanced
              ? `${prod1?.name} + ${prod2?.name}`
              : prod1?.name || activeProfile.offeringSingular,
            creative_angle: isSaaS
              ? `Turn free signups and warm prospects into annual subscribers with ROI case studies via ${ch4.label}`
              : `Nurture leads and existing customers with VIP offers and fast closing via ${ch4.label}`,
            hook_ideas: [
              isSaaS
                ? `Case Study: How a client cut costs by 42% in 14 days with ${prod1?.name || 'our platform'}`
                : `VIP Exclusive: Priority access + bonus gift for our community`,
              `Quick question: Are you still dealing with ${prod1?.pain_points?.[0] || 'this'}?`,
            ],
            suggested_ctas: [isSaaS ? 'Upgrade to Pro / Claim Annual Discount' : 'Reply VIP to claim your offer'],
            content_formats: [ch4.shortLabel],
            estimated_effort: 'low',
            rationale: `Maximizes customer lifetime value (LTV) and closes warm leads on ${ch4.label}.`,
            order_index: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveStrategy(fallbackStrategy);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-green" />
            MULTI-INDUSTRY AI STRATEGY & CAMPAIGN PLANNER
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Organic + Paid Strategy for {activeProfile.icon} {activeProfile.label}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeProfile.growthPlaybook}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Strategy Configuration Form (5 cols) */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-brand-ink">Strategy Parameters</h2>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              Gemini 3.6 Flash
            </span>
          </div>

          {/* 1. Industry / Business Category Selector */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Briefcase size={11} className="text-brand-green" />
                Business Industry / Branch
              </span>
              <span className="text-[9px] text-brand-green font-bold">Auto-sets channels</span>
            </label>
            <select
              value={industryDropdownValue}
              onChange={(e) => handleIndustryDropdownChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white font-bold text-brand-ink focus:outline-none focus:border-brand-green"
            >
              {PRESET_INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.icon} {ind.label}
                </option>
              ))}
              <option value={OTHER_INDUSTRY_OPTION}>➕ Other (Specify Custom Industry...)</option>
            </select>

            {industryDropdownValue === OTHER_INDUSTRY_OPTION && (
              <div>
                <input
                  type="text"
                  value={customIndustryText}
                  onChange={(e) => handleCustomIndustryApply(e.target.value)}
                  placeholder="Type your industry (e.g. Solar Energy, Salon, Real Estate, Gym)..."
                  className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>
            )}
          </div>

          {/* 2. Promotion Mode: Organic + Paid vs Organic Only vs Paid Only */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Promotion Strategy Mode (Organic vs. Paid)
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPromoMode('hybrid')}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  promoMode === 'hybrid'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚡ Organic + Paid
              </button>
              <button
                type="button"
                onClick={() => setPromoMode('organic')}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  promoMode === 'organic'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🌱 Organic Only
              </button>
              <button
                type="button"
                onClick={() => setPromoMode('paid')}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  promoMode === 'paid'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎯 Paid Ads Only
              </button>
            </div>
          </div>

          {/* 3. Target Channels & Formats (LinkedIn, FB Simple Post, Reels, YouTube, etc.) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                <CheckSquare size={11} className="text-brand-green" /> Target Channels & Content Formats
              </label>
              <button
                type="button"
                onClick={() => setSelectedChannels(activeProfile.recommendedChannels)}
                className="text-[9px] text-brand-green font-extrabold hover:underline"
              >
                Reset to Recommended
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {MARKETING_CHANNEL_FORMATS.map((ch) => {
                const checked = selectedChannels.includes(ch.id);
                const isRecommended = activeProfile.recommendedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    title={ch.description}
                    className={`text-left px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                      checked
                        ? 'bg-emerald-50/90 border-brand-green text-brand-ink shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ch.badgeColor }}
                      />
                      <span className="truncate">{ch.shortLabel}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {isRecommended && (
                        <span className="text-[8px] bg-white border border-slate-200 text-slate-500 px-1 rounded">
                          Rec
                        </span>
                      )}
                      <span className={`text-xs ${checked ? 'text-brand-green font-black' : 'text-slate-300'}`}>
                        {checked ? '✓' : '+'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Timeframe Duration
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  timeframe === 'weekly'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Days Sprint
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  timeframe === 'monthly'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Days Campaign
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              {activeProfile.offeringPlural} Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-2.5">
              <button
                type="button"
                onClick={() => setCampaignMode('balanced')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  campaignMode === 'balanced'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Balanced Multi-{activeProfile.offeringSingular.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => setCampaignMode('single')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  campaignMode === 'single'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Single {activeProfile.offeringSingular.split(' ')[0]} Focus
              </button>
            </div>

            {campaignMode === 'single' ? (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Flagship Focus {activeProfile.offeringSingular}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    onSelectProduct?.(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.profit_margin || '70'}% margin)
                    </option>
                  ))}
                  {products.length === 0 && <option value="">Flagship {activeProfile.offeringSingular}</option>}
                </select>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <span className="text-base">{activeProfile.icon}</span>
                <div className="text-[11px] leading-snug">
                  <strong>Multi-Offering Growth:</strong> Rotates content across your{' '}
                  <strong>{products.length} {activeProfile.offeringPlural.toLowerCase()}</strong>.
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Primary Goal
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="increase_product_awareness">Increase Brand Awareness & Organic Reach</option>
              <option value="increase_sales">Drive Direct Sales, Signups & Conversions</option>
              <option value="increase_engagement">Boost Community Engagement & Authority</option>
              <option value="launch_new_product">Launch New {activeProfile.offeringSingular}</option>
            </select>
          </div>

          {/* Live Trend Selection / Auto-match */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                <TrendingUp size={11} className="text-brand-green" /> Incorporate Live Trend
              </label>
              <span className="text-[9px] text-emerald-600 font-bold">{trends.length} active signals</span>
            </div>
            <select
              value={selectedTrendId}
              onChange={(e) => setSelectedTrendId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="">⚡ Auto-match best live trends ({trends.length} available)</option>
              {trends.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.topic} ({t.platform} · {t.confidence_score}% confidence)
                </option>
              ))}
            </select>
          </div>

          {promoMode !== 'organic' && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                Paid Acquisition Budget ({currencyConfig.code})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={currencyConfig.code === 'PKR' ? '50000' : '1500'}
                  className="w-full text-xs pl-10 pr-3 py-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Campaign Notes & Custom Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`e.g., Focus on ${activeProfile.label} case studies, free trial signups, local delivery, or seasonal offers...`}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>
              {loading
                ? 'Synthesizing with Gemini AI...'
                : `✦ Generate ${activeProfile.label} Strategy`}
            </span>
          </button>
        </form>

        {/* Strategy Preview / Active Strategy (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  STRATEGY BLUEPRINT
                </small>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-brand-ink">
                  {activeProfile.icon} {activeProfile.label}
                </span>
              </div>
              <span
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md ${
                  activeStrategy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeStrategy ? '✓ AI Strategy Active' : 'Ready to generate'}
              </span>
            </div>

            {activeStrategy ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-display font-extrabold text-brand-ink m-0">
                    {activeStrategy.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {activeStrategy.executive_summary}
                  </p>
                </div>

                {/* Selected Channels Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-1">
                    Active Channels:
                  </span>
                  {selectedChannels.map((chId) => {
                    const ch = MARKETING_CHANNEL_FORMATS.find((c) => c.id === chId);
                    if (!ch) return null;
                    return (
                      <span
                        key={ch.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: ch.badgeColor }}
                      >
                        {ch.shortLabel}
                      </span>
                    );
                  })}
                </div>

                {/* Pillars Grid */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Generated Action Pillars ({activeStrategy.pillars?.length || 4})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Click Write in Studio to craft copy
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                    {(activeStrategy.pillars || []).map((pillar, idx) => (
                      <div
                        key={pillar.id || idx}
                        className="bg-slate-50 border border-slate-200/90 hover:border-emerald-300 rounded-xl p-3.5 text-xs flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                              {pillar.platform} · {pillar.channel_type}
                            </span>
                            <span className="text-[9px] font-extrabold text-brand-green">
                              Pillar {idx + 1}
                            </span>
                          </div>

                          {/* Product / Offering Chip */}
                          {pillar.product_name && (
                            <div className="mb-2 bg-blue-50/80 border border-blue-200/70 rounded-md px-2 py-1 flex items-center justify-between text-[10px] text-blue-900 font-bold">
                              <span className="flex items-center gap-1 truncate">
                                <span>{activeProfile.icon}</span>
                                <span className="truncate">{pillar.product_name}</span>
                              </span>
                              <span className="text-[8px] bg-white text-blue-700 font-extrabold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                {pillar.channel_type}
                              </span>
                            </div>
                          )}

                          <b className="block text-brand-ink text-[12px] font-bold mb-1 leading-snug">
                            {pillar.pillar_name}
                          </b>

                          {/* Grounded Trend Tag */}
                          {pillar.trend_topic && (
                            <div className="mb-2 bg-emerald-100/70 border border-emerald-200/60 rounded-md px-2 py-1 flex items-center gap-1 text-[10px] text-emerald-900 font-semibold">
                              <TrendingUp size={11} className="text-emerald-700 shrink-0" />
                              <span className="truncate">Trend: {pillar.trend_topic}</span>
                            </div>
                          )}

                          <p className="text-[11px] text-slate-600 leading-snug mb-2">
                            <b>Angle:</b> {pillar.creative_angle}
                          </p>

                          {/* Viral Hook Ideas */}
                          {pillar.hook_ideas && pillar.hook_ideas.length > 0 && (
                            <div className="bg-white rounded-lg p-2 border border-slate-100 mb-2">
                              <small className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                                <Lightbulb size={10} className="text-amber-500" /> Hook Ideas
                              </small>
                              <ul className="text-[10px] text-slate-600 space-y-0.5 pl-3 list-disc">
                                {pillar.hook_ideas.map((hook, i) => (
                                  <li key={i}>{hook}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-200/60 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500">
                          <span className="truncate">
                            CTA: <b>{pillar.suggested_ctas?.[0] || 'Learn more'}</b>
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigate('studio', pillar.focus_product_id)}
                            className="text-brand-green font-extrabold hover:underline flex items-center gap-0.5 text-[10px]"
                          >
                            <span>Write in Studio</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center my-12 max-w-[460px] mx-auto space-y-3">
                <div className="w-12 h-12 rounded-xl bg-brand-pale text-brand-green grid place-items-center mx-auto text-xl font-bold">
                  {activeProfile.icon}
                </div>
                <h2 className="text-lg font-display font-bold text-brand-ink">
                  Ready to build your {activeProfile.label} Growth Blueprint
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {activeProfile.growthPlaybook} Select your promotion mode (<b>Organic + Paid</b>, <b>Organic Only</b>, or <b>Paid Only</b>) and channels on the left, then click Generate.
                </p>
              </div>
            )}
          </div>

          <footer className="border-t border-brand-line pt-4 mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded-full">
                {products.length || 1} {activeProfile.offeringSingular.toLowerCase()}
              </span>
              <span className="bg-slate-100 px-2 py-1 rounded-full">
                {selectedChannels.length} channels selected
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">
                {promoMode === 'hybrid' ? 'Organic + Paid' : promoMode === 'organic' ? 'Organic Only' : 'Paid Only'}
              </span>
            </div>

            {activeStrategy && (
              <button
                onClick={() => onNavigate('studio')}
                className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                <span>Generate Full Content in Studio</span>
                <ArrowRight size={13} />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
};
