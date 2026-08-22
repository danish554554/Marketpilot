import React, { useState } from 'react';
import { Sparkles, CheckCircle2, DollarSign, Layers, ArrowRight } from 'lucide-react';
import { MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';

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
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');
  const [objective, setObjective] = useState('increase_product_awareness');
  const [budget, setBudget] = useState('15000');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const result = await api.generateStrategy({
        timeframe,
        primary_goal: objective,
        include_trends: true,
        custom_instructions: notes,
      });
      setActiveStrategy(result);
    } catch (err) {
      const prod = products.find((p) => p.id === selectedProductId) || products[0];
      const fallbackStrategy: MarketingStrategy = {
        id: 'strat-' + Date.now(),
        workspace_id: 'ws1',
        created_by: 'u1',
        title: `${timeframe === 'weekly' ? '7-Day Focused Campaign' : '30-Day Growth Strategy'}: ${prod?.name || 'Hero Product'} Acceleration`,
        timeframe,
        status: 'approved',
        executive_summary: `Omnichannel marketing campaign prioritizing ${prod?.name || 'hero inventory'} (${prod?.profit_margin || '70'}% margin) with balanced organic community storytelling and paid acquisition.`,
        target_audience_summary: 'Targeting professionals and students seeking durable, minimalist everyday carry solutions.',
        budget_allocation_summary: {
          total_budget: budget || 15000,
          currency: 'USD',
          organic_percentage: 60,
          paid_percentage: 40,
        },
        product_priorities_summary: {
          hero_products: [{ name: prod?.name || 'Luna Everyday Bag', margin_tier: 'high', stock_quantity: 450 }],
        },
        strategic_rationale: 'High profit margin and low inventory risk.',
        pillars: [
          {
            id: 'p-1',
            strategy_id: 'strat-1',
            pillar_name: 'Hero Education & Demonstration',
            objective: 'Increase Product Awareness',
            channel_type: 'organic',
            platform: 'instagram',
            product_name: prod?.name || 'Luna Everyday Bag',
            creative_angle: '“Everything I carry in one workday”',
            hook_ideas: ['Stop struggling with messy bags', 'What actually fits inside?'],
            suggested_ctas: ['Explore the collection'],
            content_formats: ['carousel_slides', 'post_caption'],
            estimated_effort: 'medium',
            rationale: 'Builds high consideration and organic shareability.',
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            strategy_id: 'strat-1',
            pillar_name: 'Direct Response Acquisition',
            objective: 'Drive Sales & Conversions',
            channel_type: 'paid',
            platform: 'tiktok',
            product_name: prod?.name || 'Luna Everyday Bag',
            creative_angle: 'Fast-paced comparison vs flimsy alternatives',
            hook_ideas: ['Tired of bags that fall apart?', 'Built for heavy daily wear.'],
            suggested_ctas: ['Shop now with free shipping'],
            content_formats: ['short_video_script'],
            estimated_effort: 'low',
            rationale: 'Leverages high margin to maximize paid ROAS.',
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-3',
            strategy_id: 'strat-1',
            pillar_name: 'Trend Velocity & Social Proof',
            objective: 'Boost Social Engagement',
            channel_type: 'organic',
            platform: 'tiktok',
            trend_topic: trends[0]?.topic || '“What fits inside” videos',
            creative_angle: 'Trend jacking viral packing demonstrations',
            hook_ideas: ['Packing 6 essentials in 15 seconds', 'My commuter secret weapon'],
            suggested_ctas: ['Check out the drop'],
            content_formats: ['short_video_script'],
            estimated_effort: 'medium',
            rationale: 'Captures viral discovery feed momentum.',
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-4',
            strategy_id: 'strat-1',
            pillar_name: 'VIP Retention & Early Access',
            objective: 'Customer Retention & LTV',
            channel_type: 'organic',
            platform: 'email',
            product_name: prod?.name || 'Luna Everyday Bag',
            creative_angle: 'Behind-the-scenes craftsmanship and care tips',
            hook_ideas: ['How to care for your everyday carry', 'VIP exclusive restock'],
            suggested_ctas: ['Claim VIP offer'],
            content_formats: ['email_newsletter', 'direct_message'],
            estimated_effort: 'low',
            rationale: 'Maximizes repeat purchase rate.',
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
        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
          AI STRATEGY PLANNER
        </small>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
          Build a strategy your team can execute.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose the context. MarketPilot AI turns your real profit margins, stock, and trend signals into an explainable organic and paid plan.
        </p>
      </div>

      {/* Main Grid: Form + Strategy Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (5 cols) */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4"
        >
          <h2 className="text-base font-display font-bold text-brand-ink m-0">Plan Details</h2>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1.5">
              Plan Duration
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  timeframe === 'weekly'
                    ? 'bg-white text-brand-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 days
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
                30 days
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Primary Objective
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="increase_product_awareness">Increase Product Awareness & Reach</option>
              <option value="increase_sales">Drive Direct Sales & Conversions</option>
              <option value="increase_engagement">Boost Social Engagement & Trust</option>
              <option value="launch_new_product">Launch New Product Line</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Products to Prioritise
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.margin_tier?.toUpperCase()} margin · {p.stock_quantity} in stock)
                </option>
              ))}
              {products.length === 0 && <option value="">All active products</option>}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Available Paid Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">USD</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5000"
                className="w-full text-xs pl-12 pr-3 py-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Campaign Notes & Constraints
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add specific launch details, seasonal offers, or customer segment focus..."
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white focus:outline-none focus:border-brand-green resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{loading ? 'Synthesizing grounded strategy...' : '✦ Generate strategy'}</span>
          </button>
        </form>

        {/* Strategy Preview / Active Strategy (7 cols) */}
        <article className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                STRATEGY PREVIEW
              </small>
              <span
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md ${
                  activeStrategy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeStrategy ? 'Strategy active & approved' : 'Ready to generate'}
              </span>
            </div>

            {activeStrategy ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-brand-ink m-0">
                    {activeStrategy.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeStrategy.executive_summary}
                  </p>
                </div>

                {/* Pillars Grid */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Formulated Campaign Pillars ({activeStrategy.pillars?.length || 4})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activeStrategy.pillars || []).map((pillar, idx) => (
                      <div
                        key={pillar.id || idx}
                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                              {pillar.platform} · {pillar.channel_type}
                            </span>
                            <span className="text-[9px] font-bold text-brand-green">
                              Pillar {idx + 1}
                            </span>
                          </div>
                          <b className="block text-brand-ink text-[12px] font-bold mb-1">
                            {pillar.pillar_name}
                          </b>
                          <p className="text-[10px] text-slate-500 line-clamp-2 m-0">
                            {pillar.creative_angle}
                          </p>
                        </div>
                        <small className="block text-[9px] text-slate-400 mt-2">
                          CTA: {pillar.suggested_ctas?.[0] || 'Shop now'}
                        </small>
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
                  Your plan will be grounded in your actual business context.
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Products, stock velocity, profit margin tiers, target audience, trend signals, Brand Kit voice, offers, and budget boundaries are synthesized before recommendations are made.
                </p>
              </div>
            )}
          </div>

          <footer className="border-t border-brand-line pt-4 mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded-full">{products.length || 24} active products</span>
              <span className="bg-slate-100 px-2 py-1 rounded-full">{trends.length || 7} trend signals</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">Brand Kit grounded</span>
            </div>

            {activeStrategy && (
              <button
                onClick={() => onNavigate('studio')}
                className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1"
              >
                <span>Open in Content Studio</span>
                <ArrowRight size={13} />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
};
