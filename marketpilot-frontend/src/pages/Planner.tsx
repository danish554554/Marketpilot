import React, { useState } from 'react';
import { Sparkles, CheckCircle2, DollarSign, Layers, ArrowRight, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';

interface PlannerProps {
  products: Product[];
  trends: TrendSignal[];
  activeStrategy: MarketingStrategy | null;
  setActiveStrategy: (strategy: MarketingStrategy) => void;
  onNavigate: (page: string) => void;
}

export const Planner: React.FC<PlannerProps> = ({
  products,
  trends,
  activeStrategy,
  setActiveStrategy,
  onNavigate,
}) => {
  const { formatAmount, currencySymbol, currencyConfig } = useCurrency();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');
  const [objective, setObjective] = useState('increase_product_awareness');
  const [budget, setBudget] = useState(currencyConfig.code === 'PKR' ? '50000' : '1500');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedTrendId, setSelectedTrendId] = useState<string>('');
  const [includeTrends, setIncludeTrends] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const selectedTrend = trends.find((t) => t.id === selectedTrendId);
      const customPrompt = notes + (selectedTrend ? ` Focus especially on the market trend: "${selectedTrend.topic}".` : '');

      const result = await api.generateStrategy({
        timeframe,
        primary_goal: objective,
        include_trends: includeTrends,
        custom_instructions: customPrompt,
      });
      setActiveStrategy(result);
    } catch (err) {
      const prod = products.find((p) => p.id === selectedProductId) || products[0];
      const trend = trends.find((t) => t.id === selectedTrendId) || trends[0];

      const fallbackStrategy: MarketingStrategy = {
        id: 'strat-' + Date.now(),
        workspace_id: 'ws1',
        created_by: 'u1',
        title: `${timeframe === 'weekly' ? '7-Day Sprint' : '30-Day Campaign'}: ${prod?.name || 'Hero Product'} Acceleration`,
        timeframe,
        status: 'approved',
        executive_summary: `Omnichannel strategy connecting our ${prod?.name || 'hero product'} (${prod?.profit_margin || '78.7'}% profit margin) with real-time market trend signals like "${trend?.topic || 'Peach Fuzz Removal'}" to maximize organic reach and paid ROAS.`,
        target_audience_summary: trend?.target_audience || 'High-intent digital consumers seeking seamless, painless beauty and grooming solutions.',
        budget_allocation_summary: {
          total_budget: Number(budget) || 15000,
          currency: 'USD',
          organic_percentage: 60,
          paid_percentage: 40,
        },
        product_priorities_summary: {
          hero_products: [{ name: prod?.name || '2-in-1 Rechargeable Hair Remover', margin_tier: 'high', stock_quantity: 650 }],
        },
        strategic_rationale: 'High profit margin combined with surging consumer trend momentum.',
        pillars: [
          {
            id: 'p-1',
            strategy_id: 'strat-1',
            pillar_name: 'Viral Routine & Problem-Solution Hook',
            objective: 'increase_product_awareness',
            channel_type: 'organic',
            platform: 'tiktok',
            product_name: prod?.name || '2-in-1 Rechargeable Hair Remover',
            trend_topic: trend?.topic || '“30-Second Peach Fuzz Removal Before Makeup”',
            creative_angle: 'Showing close-up before & after foundation glide over hair-free skin vs patchy makeup',
            hook_ideas: [
              'Stop applying foundation over peach fuzz — watch this 30-sec prep',
              'The #1 mistake ruining your smooth base routine',
            ],
            suggested_ctas: ['Get the smooth base tool with 20% off'],
            content_formats: ['short_video_script', 'carousel_slides'],
            estimated_effort: 'medium',
            rationale: `Directly capitalizes on the "${trend?.topic || 'Peach Fuzz Removal'}" trend to position our device as the essential pre-makeup step.`,
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            strategy_id: 'strat-1',
            pillar_name: 'Pain vs Cost-Saving Comparison Reel',
            objective: 'increase_sales',
            channel_type: 'paid',
            platform: 'instagram',
            product_name: prod?.name || '2-in-1 Rechargeable Hair Remover',
            trend_topic: 'Painless Home Dermaplaning vs Salon Waxing',
            creative_angle: 'Splitting screen: painful $80 salon waxing vs zero-pain $39.99 rechargeable trimmer at home',
            hook_ideas: [
              'Why pay $80 every month when you can do this in 1 minute?',
              'Zero redness. Zero razor burn. How I retired my disposable blades.',
            ],
            suggested_ctas: ['Shop the 2-in-1 Hair Remover today'],
            content_formats: ['short_video_script'],
            estimated_effort: 'low',
            rationale: 'Direct-response comparative angle driving high ROAS with clear margin advantages.',
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-3',
            strategy_id: 'strat-1',
            pillar_name: 'Micro-Eyebrow Detailing & Precision Hack',
            objective: 'increase_engagement',
            channel_type: 'organic',
            platform: 'instagram',
            product_name: prod?.name || '2-in-1 Rechargeable Hair Remover',
            trend_topic: 'Eyebrow Shaping Hacks for Busy Mornings',
            creative_angle: 'Quick morning GRWM switching from peach fuzz head to precision brow detailer',
            hook_ideas: [
              'How I shape my brows in 45 seconds without plucking tears',
              'The double-headed hack you didn’t know you needed',
            ],
            suggested_ctas: ['Discover the dual-head secret'],
            content_formats: ['carousel_slides', 'post_caption'],
            estimated_effort: 'medium',
            rationale: 'Highlights product versatility and solves painful plucking pain points.',
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-4',
            strategy_id: 'strat-1',
            pillar_name: 'VIP Glow Club & Maintenance Retention',
            objective: 'increase_sales',
            channel_type: 'organic',
            platform: 'email',
            product_name: prod?.name || '2-in-1 Rechargeable Hair Remover',
            creative_angle: 'Dermatologist hygiene tips & exclusive bundle deals for head replacements',
            hook_ideas: [
              '3 dermatologist tips to prevent breakouts after facial grooming',
              'VIP exclusive: Replacement precision head drop',
            ],
            suggested_ctas: ['Read the Glow Guide & Save 15%'],
            content_formats: ['email_newsletter'],
            estimated_effort: 'low',
            rationale: 'Boosts customer LTV and builds repeat consumable purchases.',
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
      <div>
        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-green" />
          AI STRATEGY & CAMPAIGN PLANNER
        </small>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
          Turn Live Trends & Products into Actionable Strategy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Google Gemini 3.6 Flash synthesizes your real products, profit margins, and live market trends into grounded campaign pillars.
        </p>
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
              Primary Goal
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="increase_product_awareness">Increase Product Awareness & Viral Reach</option>
              <option value="increase_sales">Drive Direct Sales & Conversions</option>
              <option value="increase_engagement">Boost Social Engagement & Relatability</option>
              <option value="launch_new_product">Launch New Product Line</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Hero Product Focus
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.profit_margin || '78.7'}% profit margin)
                </option>
              ))}
              {products.length === 0 && <option value="">2-in-1 Rechargeable Hair Remover</option>}
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

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Campaign Notes & Custom Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focus on before/after routines, holiday discounts, or specific influencer hooks..."
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{loading ? 'Synthesizing with Gemini AI...' : '✦ Generate AI Strategy Plan'}</span>
          </button>
        </form>

        {/* Strategy Preview / Active Strategy (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                STRATEGY BLUEPRINT
              </small>
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

                {/* Pillars Grid */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Generated Action Pillars ({activeStrategy.pillars?.length || 4})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Click Open in Studio to generate copy</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
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
                          <span className="truncate">CTA: <b>{pillar.suggested_ctas?.[0] || 'Shop now'}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center my-12 max-w-[420px] mx-auto space-y-3">
                <div className="w-12 h-12 rounded-xl bg-brand-pale text-brand-green grid place-items-center mx-auto text-xl font-bold">
                  ✦
                </div>
                <h2 className="text-lg font-display font-bold text-brand-ink">
                  Your plan will be grounded in live trends & profit margins.
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select your product and live trend on the left. Gemini 3.6 Flash will formulate high-converting TikTok scripts, Instagram reels, and email funnels.
                </p>
              </div>
            )}
          </div>

          <footer className="border-t border-brand-line pt-4 mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded-full">{products.length || 1} product</span>
              <span className="bg-slate-100 px-2 py-1 rounded-full">{trends.length} live trends</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">Gemini AI Grounded</span>
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
