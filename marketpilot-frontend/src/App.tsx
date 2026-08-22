import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GeneratePlanModal } from './components/GeneratePlanModal';
import { AuthModal } from './components/AuthModal';
import { Overview } from './pages/Overview';
import { Planner } from './pages/Planner';
import { Trends } from './pages/Trends';
import { Calendar } from './pages/Calendar';
import { Studio } from './pages/Studio';
import { Products } from './pages/Products';
import { BrandKit } from './pages/BrandKit';
import { Briefs } from './pages/Briefs';
import { ExportCenter } from './pages/ExportCenter';
import { BrandKit as BrandKitType, MarketingStrategy, Product, TrendSignal } from './types';
import { api } from './api/endpoints';
import { getAuthToken } from './api/client';

export function App() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [businessName, setBusinessName] = useState('GlowSilk Beauty');
  const [userEmail, setUserEmail] = useState<string>('sarah@glowsilk.com');
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAuthToken()));

  const [products, setProducts] = useState<Product[]>([]);
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<MarketingStrategy | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKitType | null>(null);

  // Initial Data Fetching from FastAPI backend
  useEffect(() => {
    const initData = async () => {
      try {
        const [wsRes, prodRes, trendRes, stratRes, bkRes] = await Promise.allSettled([
          api.getWorkspaceMe(),
          api.getProducts(),
          api.getTrends(),
          api.getActiveStrategy(),
          api.getBrandKit(),
        ]);

        if (wsRes.status === 'fulfilled' && wsRes.value?.business_name) {
          setBusinessName(wsRes.value.business_name);
        }

        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value) && prodRes.value.length > 0) {
          setProducts(prodRes.value);
        } else {
          // Fallback configured specifically for 2-in-1 Rechargeable Hair Remover
          setProducts([
            {
              id: 'p1',
              workspace_id: 'ws1',
              name: '2-in-1 Rechargeable Hair Remover',
              description: 'Painless dual-head USB rechargeable facial fuzz and eyebrow precision trimmer designed for sensitive skin.',
              sku: 'GLOW-2IN1-PRO',
              price: 39.99,
              cost_price: 8.50,
              profit_margin: '78.7',
              margin_tier: 'high',
              stock_quantity: 650,
              status: 'active',
              priority: 'high',
              features: [
                'Interchangeable precision heads: facial peach fuzz & eyebrow detailing',
                'Hypoallergenic stainless steel blades (zero redness or razor burn)',
                'USB fast rechargeable battery (60 min continuous runtime)',
                'Discreet lipstick-sized portable design with built-in LED light'
              ],
              pain_points: [
                'Painful and expensive monthly salon waxing',
                'Razor bumps and cuts from traditional disposable razors',
                'Blunt dermaplaning blades irritating sensitive skin',
                'Flaky makeup application caused by unaddressed peach fuzz'
              ],
              created_at: '2026-08-22',
              updated_at: '2026-08-22',
            }
          ]);
        }

        if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value) && trendRes.value.length > 0) {
          setTrends(trendRes.value);
        } else {
          // Fallback trend signals matched to beauty & female grooming
          setTrends([
            {
              id: 't1',
              topic: '“30-Second Peach Fuzz Removal Before Makeup”',
              headline: 'Viral "Smooth Base" Routine Demos Surge on TikTok & Reels',
              summary: 'Short-form videos showing close-up before & after makeup gliding smoothly over hair-free skin are driving massive conversion.',
              platform: 'tiktok',
              category: 'Beauty & Skincare',
              source_name: 'TikTok Beauty Discover Feed',
              source_url: 'https://tiktok.com',
              collection_date: '2026-08-22',
              confidence_score: 96,
              suggested_angles: ['The secret to non-cakey foundation', 'Zero pain hair removal in 30 seconds'],
              is_active: true,
              created_at: '2026-08-22',
              updated_at: '2026-08-22',
            },
            {
              id: 't2',
              topic: 'Painless Home Dermaplaning vs Salon Waxing',
              headline: 'Cost-of-Living Beauty Swaps Trend on Instagram',
              summary: 'Creators comparing $100 salon waxing to reusable rechargeable electric trimmers with zero pain.',
              platform: 'instagram',
              category: 'Grooming & Wellness',
              source_name: 'Instagram Explore Insights',
              source_url: 'https://instagram.com',
              collection_date: '2026-08-22',
              confidence_score: 91,
              suggested_angles: ['Why I stopped waxing my upper lip', 'Salon results at home without the pain'],
              is_active: true,
              created_at: '2026-08-22',
              updated_at: '2026-08-22',
            },
            {
              id: 't3',
              topic: 'Eyebrow Shaping Hacks for Busy Mornings',
              headline: 'Quick Micro-Trimming Demos on Meta Reels',
              summary: 'Micro-precision attachment demos showing effortless eyebrow arches without tweezing tears.',
              platform: 'facebook',
              category: 'Beauty Tips',
              source_name: 'Meta Ads Creative Center',
              source_url: 'https://facebook.com',
              collection_date: '2026-08-22',
              confidence_score: 89,
              suggested_angles: ['Shape your brows in 60 seconds without tweezers'],
              is_active: true,
              created_at: '2026-08-22',
              updated_at: '2026-08-22',
            }
          ]);
        }

        if (stratRes.status === 'fulfilled' && stratRes.value) {
          setActiveStrategy(stratRes.value);
        }

        if (bkRes.status === 'fulfilled' && bkRes.value) {
          setBrandKit(bkRes.value);
        } else {
          setBrandKit({
            id: 'bk1',
            workspace_id: 'ws1',
            brand_voice: ['Gentle & Reassuring', 'Empowering', 'Relatable', 'Clean & Aesthetic'],
            prohibited_words: ['painful waxing', 'miracle cure', 'ugly body hair', 'shameful', 'cheap plastic'],
            approved_cta_examples: [
              'Get painless smooth skin today',
              'Shop the 2-in-1 Precision Remover',
              'Upgrade your glow routine with 15% off'
            ],
            primary_color_hex: '#e11d48',
            created_at: '2026-08-22',
            updated_at: '2026-08-22',
          });
        }

        if (stratRes.status === 'fulfilled' && stratRes.value) {
          setActiveStrategy(stratRes.value);
        }

        if (bkRes.status === 'fulfilled' && bkRes.value) {
          setBrandKit(bkRes.value);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    initData();
  }, []);

  const handleLaunchPlan = async (timeframe: 'weekly' | 'monthly') => {
    setIsGenerating(true);
    try {
      const generated = await api.generateStrategy({
        timeframe,
        primary_goal: 'increase_product_awareness',
        include_trends: true,
      });
      setActiveStrategy(generated);
    } catch (err) {
      // Create rich instant strategy if unauthenticated or offline
      const fallbackStrategy: MarketingStrategy = {
        id: 'strat-' + Date.now(),
        workspace_id: 'ws1',
        created_by: 'u1',
        title: `${timeframe === 'weekly' ? '7-Day Viral Growth Campaign' : '30-Day Omnichannel Scale Strategy'}: 2-in-1 Rechargeable Hair Remover`,
        timeframe,
        status: 'approved',
        executive_summary: 'Targeted direct-to-consumer beauty marketing campaign prioritizing our high-margin hero 2-in-1 Rechargeable Hair Remover (78.7% margin) across viral TikTok before-and-after peach fuzz demos and high-converting Meta acquisition ads.',
        target_audience_summary: 'Women aged 18–45 seeking painless, fast, irritation-free facial hair and eyebrow precision styling without recurring salon waxing costs.',
        budget_allocation_summary: {
          total_budget: 8000,
          currency: 'USD',
          organic_percentage: 60,
          paid_percentage: 40,
          channel_spend_recommendations: { tiktok: 2000, instagram: 1200 },
        },
        product_priorities_summary: {
          hero_products: [{ name: '2-in-1 Rechargeable Hair Remover', margin_tier: 'high', stock_quantity: 650 }],
        },
        strategic_rationale: 'High profit margin ($39.99 vs $8.50 cost = 78.7% margin), strong stock velocity (650 units), and addresses primary pain points of razor burns and waxing costs.',
        pillars: [
          {
            id: 'p-1',
            strategy_id: 'strat-1',
            pillar_name: 'Painless 30-Second Peach Fuzz Routine',
            objective: 'Increase Product Awareness',
            channel_type: 'organic',
            platform: 'tiktok',
            product_name: '2-in-1 Rechargeable Hair Remover',
            creative_angle: 'Macro close-up: effortless makeup gliding over smooth, fuzz-free skin',
            hook_ideas: [
              'Why your foundation looks cakey (and the 30-second fix)',
              'Stop using disposable razors on your face — do this instead'
            ],
            suggested_ctas: ['Get painless smooth skin today'],
            content_formats: ['short_video_script', 'carousel_slides'],
            estimated_effort: 'medium',
            rationale: 'Demonstrates physical transformation and makeup enhancement.',
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            strategy_id: 'strat-1',
            pillar_name: 'Direct-Response Pain Comparison Ad',
            objective: 'Drive Sales & Conversions',
            channel_type: 'paid',
            platform: 'facebook',
            product_name: '2-in-1 Rechargeable Hair Remover',
            creative_angle: 'Cost-of-living comparison: $80 monthly waxing vs $39.99 lifetime device',
            hook_ideas: [
              'Tired of redness and razor burns after shaving?',
              'Save $800 a year on salon waxing with this painless device'
            ],
            suggested_ctas: ['Shop the 2-in-1 Precision Remover with 15% off'],
            content_formats: ['short_video_script', 'post_caption'],
            estimated_effort: 'low',
            rationale: 'Direct response pain vs solution framing maximizes paid ROAS on our 78.7% margin.',
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-3',
            strategy_id: 'strat-1',
            pillar_name: 'Micro-Eyebrow Detailing & Shaping Hack',
            objective: 'Boost Social Engagement',
            channel_type: 'organic',
            platform: 'instagram',
            trend_topic: '“Eyebrow Shaping Hacks for Busy Mornings”',
            creative_angle: 'Swapping to precision eyebrow head for effortless micro-trimming without tweezers',
            hook_ideas: [
              'How I shape my brows in 45 seconds without plucking tears',
              'The eyebrow attachment you didn’t know you needed'
            ],
            suggested_ctas: ['Upgrade your beauty routine'],
            content_formats: ['carousel_slides', 'post_caption'],
            estimated_effort: 'medium',
            rationale: 'Showcases the 2-in-1 dual-head versatility of the device.',
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'p-4',
            strategy_id: 'strat-1',
            pillar_name: 'VIP Glow Club & Maintenance Tips',
            objective: 'Customer Retention & LTV',
            channel_type: 'organic',
            platform: 'email',
            product_name: '2-in-1 Rechargeable Hair Remover',
            creative_angle: 'Skincare prep and cleaning guide to keep blades sharp for 12+ months',
            hook_ideas: [
              '3 dermatologist tips to prevent breakouts after facial grooming',
              'VIP exclusive: Replacement precision head drop'
            ],
            suggested_ctas: ['Read the Glow Guide'],
            content_formats: ['email_newsletter', 'direct_message'],
            estimated_effort: 'low',
            rationale: 'Builds brand loyalty and trust among skincare enthusiasts.',
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
      setIsGenerating(false);
      setGenerateModalOpen(false);
      setActivePage('planner');
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-canvas text-brand-ink">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        businessName={businessName}
      />

      {/* Main Content Canvas */}
      <div className="flex-1 flex flex-col md:ml-[255px] min-w-0">
        <Header
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenGenerateModal={() => setGenerateModalOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
        />

        <main className="flex-1 p-5 md:p-10 overflow-y-auto">
          {activePage === 'overview' && (
            <Overview
              onNavigate={setActivePage}
              products={products}
              trends={trends}
              activeStrategy={activeStrategy}
              businessName={businessName}
            />
          )}

          {activePage === 'planner' && (
            <Planner
              products={products}
              trends={trends}
              activeStrategy={activeStrategy}
              setActiveStrategy={setActiveStrategy}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'trends' && (
            <Trends trends={trends} onNavigate={setActivePage} />
          )}

          {activePage === 'calendar' && (
            <Calendar onNavigate={setActivePage} />
          )}

          {activePage === 'studio' && (
            <Studio products={products} businessName={businessName} />
          )}

          {activePage === 'products' && (
            <Products products={products} setProducts={setProducts} />
          )}

          {activePage === 'brand' && (
            <BrandKit brandKit={brandKit} setBrandKit={setBrandKit} />
          )}

          {activePage === 'briefs' && (
            <Briefs activeStrategy={activeStrategy} onNavigate={setActivePage} />
          )}

          {activePage === 'performance' && (
            <div className="space-y-6 max-w-[1400px] mx-auto">
              <div>
                <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                  MANUAL PERFORMANCE TRACKING
                </small>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
                  Learn from what you publish.
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter organic and paid results manually to enrich future AI recommendations.
                </p>
              </div>
              <div className="bg-white border border-brand-line rounded-2xl p-8 shadow-card text-center max-w-[500px] mx-auto space-y-3">
                <div className="w-12 h-12 rounded-xl bg-brand-pale text-brand-green grid place-items-center mx-auto text-xl font-bold">
                  ↗
                </div>
                <h2 className="text-lg font-display font-bold text-brand-ink">+18% Profile Visits</h2>
                <p className="text-xs text-slate-500">
                  Organic reel posts targeting “What fits inside” showed the highest save rate this week.
                </p>
                <button
                  onClick={() => setActivePage('studio')}
                  className="bg-brand-green text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:bg-brand-green-dark"
                >
                  Create More Content
                </button>
              </div>
            </div>
          )}

          {activePage === 'library' && (
            <ExportCenter activeStrategy={activeStrategy} />
          )}
        </main>
      </div>

      {/* Modals */}
      <GeneratePlanModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={handleLaunchPlan}
        isGenerating={isGenerating}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(email) => {
          setUserEmail(email);
          setIsLoggedIn(true);
        }}
      />
    </div>
  );
}

export default App;
