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
import { useAuth } from './context/AuthContext';

export function App() {
  const { user, updateBusinessName, isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const businessName = user?.businessName || localStorage.getItem('marketpilot_biz') || 'GlowSilk Beauty';
  const userEmail = user?.email || localStorage.getItem('marketpilot_email') || 'sarah@glowsilk.com';
  const isLoggedIn = isAuthenticated || Boolean(getAuthToken());

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
          updateBusinessName(wsRes.value.business_name);
        }

        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
          setProducts(prodRes.value);
        } else {
          setProducts([]);
        }

        if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value)) {
          setTrends(trendRes.value);
        } else {
          setTrends([]);
        }

        if (stratRes.status === 'fulfilled' && stratRes.value) {
          setActiveStrategy(stratRes.value);
        } else {
          setActiveStrategy(null);
        }

        if (bkRes.status === 'fulfilled' && bkRes.value) {
          setBrandKit(bkRes.value);
        } else {
          setBrandKit({
            id: 'bk-default',
            workspace_id: 'ws-default',
            brand_voice: ['Authentic', 'Engaging', 'Professional', 'Value-Driven'],
            prohibited_words: ['guaranteed 100%', 'miracle', 'cure-all', 'cheap knockoff'],
            approved_cta_examples: [
              'Explore the collection with 20% off',
              'Shop the hero drop today',
              'Claim your exclusive discount',
            ],
            primary_color_hex: '#165823',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Backend unavailable, using clean dynamic context.');
      }
    };

    initData();
  }, []);

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col md:flex-row text-brand-ink antialiased">
      {/* Dynamic Workspace-Aware Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        businessName={businessName}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[255px] flex flex-col min-w-0">
        {/* Dynamic Workspace-Aware Top Header */}
        <Header
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenGenerateModal={() => setGenerateModalOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-5 md:p-10 max-w-[1600px] w-full mx-auto">
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
            <Trends trends={trends} setTrends={setTrends} onNavigate={setActivePage} />
          )}

          {activePage === 'calendar' && (
            <Calendar onNavigate={setActivePage} activeStrategy={activeStrategy} />
          )}

          {activePage === 'studio' && (
            <Studio products={products} businessName={businessName} activeStrategy={activeStrategy} brandKit={brandKit} />
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

      {/* Strategy Generator Modal */}
      <GeneratePlanModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={async (timeframe) => {
          setIsGenerating(true);
          try {
            const plan = await api.generateStrategy({ timeframe, include_trends: true });
            setActiveStrategy(plan);
            setActivePage('planner');
            setGenerateModalOpen(false);
          } catch (e) {
            console.error('Plan generation failed:', e);
          } finally {
            setIsGenerating(false);
          }
        }}
        isGenerating={isGenerating}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          const savedBiz = localStorage.getItem('marketpilot_biz');
          if (savedBiz) updateBusinessName(savedBiz);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
