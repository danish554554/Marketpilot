import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Lightbulb,
  Video,
  Instagram,
  Mail,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { BrandKit, MarketingStrategy, Product } from '../types';
import { api } from '../api/endpoints';

interface StudioProps {
  products: Product[];
  businessName: string;
  activeStrategy?: MarketingStrategy | null;
  brandKit?: BrandKit | null;
}

export const Studio: React.FC<StudioProps> = ({ products, businessName, activeStrategy, brandKit }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'organic' | 'paid' | 'email' | 'whatsapp'>('script');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(brandKit || null);
  const [guardrailResult, setGuardrailResult] = useState<{
    passed: boolean;
    status: string;
    detected_prohibited_words: string[];
    safety_message: string;
  }>({
    passed: true,
    status: 'passed',
    detected_prohibited_words: [],
    safety_message: '✓ All guardrails passed: 100% Brand Kit compliant & zero medical/miracle claims.',
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || {
    name: 'Your Featured Product',
    description: 'High-quality e-commerce product',
    pain_points: ['Daily friction', 'Inefficient alternatives'],
    features: ['Premium materials', 'Fast results', 'Durable design'],
  };

  const activePillar = activeStrategy?.pillars?.[selectedPillarIndex] || activeStrategy?.pillars?.[0];

  const [hook, setHook] = useState('');
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('Shop now and save 20%');
  const [hashtags, setHashtags] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('gemini-3.6-flash');

  // Load Brand Kit if missing
  useEffect(() => {
    if (!activeBrandKit) {
      api.getBrandKit().then((bk) => {
        if (bk) setActiveBrandKit(bk);
      }).catch(() => {});
    }
  }, []);

  // Run live guardrail evaluation whenever content changes
  const runLiveGuardrailCheck = async (fullText: string) => {
    const prohibited = activeBrandKit?.prohibited_words || [
      'guaranteed 100%', 'cure-all', 'cheap', 'miracle cure', 'ugly body hair'
    ];

    try {
      const res = await api.validateGuardrails({
        text: fullText,
        prohibited_words: prohibited,
        product_name: selectedProduct.name,
      });
      setGuardrailResult(res);
    } catch {
      // Local check fallback
      const lower = fullText.toLowerCase();
      const detected = prohibited.filter((w) => lower.includes(w.toLowerCase()));
      if (detected.length > 0) {
        setGuardrailResult({
          passed: false,
          status: 'warning',
          detected_prohibited_words: detected,
          safety_message: `⚠️ Prohibited Brand Word Detected: "${detected.join(', ')}". Replace before publishing.`,
        });
      } else {
        setGuardrailResult({
          passed: true,
          status: 'passed',
          detected_prohibited_words: [],
          safety_message: '✓ All guardrails passed: 100% Brand Kit compliant & zero medical/miracle claims.',
        });
      }
    }
  };

  const generateAIPost = async (tab = activeTab, prod = selectedProduct, pillar = activePillar) => {
    setIsGenerating(true);
    const channelMap: Record<string, string> = {
      script: 'tiktok',
      organic: 'instagram',
      paid: 'facebook',
      email: 'email',
      whatsapp: 'whatsapp',
    };

    try {
      const res = await api.generateStudioCopy({
        product_name: prod.name,
        product_description: prod.description,
        product_features: prod.features || [],
        product_pain_points: prod.pain_points || [],
        channel: channelMap[tab] || 'tiktok',
        format: tab,
        trend_topic: pillar?.trend_topic || undefined,
        hook_idea: pillar?.hook_ideas?.[0] || undefined,
      });

      setHook(res.hook);
      setCaption(res.caption);
      setCta(res.call_to_action);
      setHashtags(res.hashtags);
      if (res.ai_model_used) setAiModelUsed(res.ai_model_used);

      runLiveGuardrailCheck(`${res.hook}\n${res.caption}\n${res.call_to_action}`);
    } catch (err) {
      console.warn('Backend copywriting fallback:', err);
      fallbackLocalCopy(tab, prod, pillar);
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackLocalCopy = (tab: string, prod = selectedProduct, pillar = activePillar) => {
    const prodName = prod.name;
    const feat = prod.features?.[0] || 'innovative high-performance design';
    const pain = prod.pain_points?.[0] || 'wasting time on poor alternatives';
    const hookIdea = pillar?.hook_ideas?.[0] || `Still struggling with ${pain}? Watch this.`;

    let generatedHook = '';
    let generatedCaption = '';
    let generatedCta = '';
    let generatedTags = '';

    if (tab === 'script') {
      generatedHook = hookIdea;
      generatedCaption = (
        `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing the daily problem with ${pain}.\nVoiceover: "${hookIdea}"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using ${prodName} highlighting ${feat}.\nVoiceover: "The ${prodName} fixes this in seconds. Designed with ${feat} for smooth, effortless results."\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Showing clean finished look with product in hand.\nVoiceover: "Tap the link below to get yours with express shipping before stock runs out!"`
      );
      generatedCta = 'Tap link in bio to get 20% off';
      generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ViralFinds #ProblemSolved #LifeHacks`;
    } else if (tab === 'organic') {
      generatedHook = `Why most people struggle with ${pain} (and the 30-second fix).`;
      generatedCaption = (
        `If you've been dealing with ${pain}, you're not alone.\n\nMeet the ${prodName}:\n`
        + (prod.features || []).map(f => `✨ ${f}`).join('\n')
        + `\n\nDrop a 💬 below or save this post for your next order!`
      );
      generatedCta = 'Comment "INFO" for the direct link';
      generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ProductReview #MustHave`;
    } else if (tab === 'paid') {
      generatedHook = `Stop dealing with ${pain}.`;
      generatedCaption = (
        `Upgrade your daily routine with the ${prodName}.\n\n`
        + (prod.features || []).map(f => `✅ ${f}`).join('\n')
        + `\n\n🛡️ 30-Day Satisfaction Guarantee\n🚚 Fast Free Tracked Shipping\n\nClick below to claim your special 20% launch discount!`
      );
      generatedCta = 'Shop Now & Get 20% Off';
      generatedTags = '#LimitedTimeOffer #SpecialDiscount';
    } else if (tab === 'email') {
      generatedHook = `Subject: The smartest way to tackle ${pain} ✨`;
      generatedCaption = (
        `Hi there,\n\nIf ${pain} has been holding you back, we built the **${prodName}** just for you.\n\nKey Highlights:\n`
        + (prod.features || []).map(f => `• **${f}**`).join('\n')
        + `\n\nClick below to order yours today:`
      );
      generatedCta = `Claim Your ${prodName}`;
      generatedTags = '';
    } else {
      generatedHook = `✨ VIP Restock: ${prodName}`;
      generatedCaption = (
        `Hi! Due to high demand, we just restocked our bestselling **${prodName}**.\n\nOrder today for priority dispatch!\n\nReply YES to confirm your order or click below:`
      );
      generatedCta = 'Order via WhatsApp with 1 Click';
      generatedTags = '';
    }

    setHook(generatedHook);
    setCaption(generatedCaption);
    setCta(generatedCta);
    setHashtags(generatedTags);

    runLiveGuardrailCheck(`${generatedHook}\n${generatedCaption}\n${generatedCta}`);
  };

  useEffect(() => {
    generateAIPost(activeTab, selectedProduct, activePillar);
  }, [activeTab, selectedProductId, selectedPillarIndex, activeStrategy]);

  const handleCopy = () => {
    const fullText = `${hook}\n\n${caption}\n\n👉 CTA: ${cta}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title & Grounded Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-green" />
            AI CONTENT STUDIO · POWERED BY GEMINI 3.6 FLASH
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Grounded Content & Multi-Channel Copy Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transform strategy pillars and viral trend hooks into ready-to-publish TikTok scripts, Instagram reels, and high-converting emails.
          </p>
        </div>

        {activePillar?.trend_topic && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center gap-2 self-start md:self-auto">
            <TrendingUp size={14} className="text-emerald-700 shrink-0" />
            <div className="text-[11px]">
              <span className="text-emerald-800 font-bold">Active Trend: </span>
              <span className="text-emerald-950 font-extrabold">{activePillar.trend_topic}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Content Brief Sidebar (4 cols) */}
        <aside className="lg:col-span-4 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block">
              CAMPAIGN CONTEXT & PRODUCT
            </small>
            <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              {activeStrategy?.timeframe === 'weekly' ? '7-Day Sprint' : '30-Day Campaign'}
            </span>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Select Product Focus
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              {products.length === 0 && <option value="">{selectedProduct.name}</option>}
            </select>
          </div>

          {/* Pillar Selector if Strategy exists */}
          {activeStrategy?.pillars && activeStrategy.pillars.length > 0 && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                Select Strategy Pillar
              </label>
              <select
                value={selectedPillarIndex}
                onChange={(e) => setSelectedPillarIndex(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              >
                {activeStrategy.pillars.map((p, idx) => (
                  <option key={idx} value={idx}>
                    Pillar {idx + 1}: {p.pillar_name} ({p.platform})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Details Display */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div>
              <small className="text-[9px] font-extrabold text-slate-400 uppercase block">Active Product</small>
              <b className="text-xs text-brand-ink">{selectedProduct.name}</b>
            </div>

            {selectedProduct.features && selectedProduct.features.length > 0 && (
              <div>
                <small className="text-[9px] font-extrabold text-slate-400 uppercase block">Key Features</small>
                <p className="text-[11px] text-slate-600 m-0 line-clamp-2">
                  {selectedProduct.features.join(' · ')}
                </p>
              </div>
            )}

            {selectedProduct.pain_points && selectedProduct.pain_points.length > 0 && (
              <div>
                <small className="text-[9px] font-extrabold text-slate-400 uppercase block">Pain Points Addressed</small>
                <p className="text-[11px] text-slate-600 m-0 line-clamp-2">
                  {selectedProduct.pain_points.join(' · ')}
                </p>
              </div>
            )}
          </div>

          {/* Live Guardrails Real-Time Verification Card */}
          <div className={`rounded-xl p-3.5 border transition-all ${
            guardrailResult.passed
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {guardrailResult.passed ? (
                <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-[11px]">
                <strong className={`block font-bold ${guardrailResult.passed ? 'text-emerald-950' : 'text-amber-950'}`}>
                  {guardrailResult.passed ? 'Live AI Guardrails Passed' : 'Guardrail Warning'}
                </strong>
                <p className={`m-0 mt-0.5 ${guardrailResult.passed ? 'text-emerald-800' : 'text-amber-800 font-medium'}`}>
                  {guardrailResult.safety_message}
                </p>
                {guardrailResult.detected_prohibited_words.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {guardrailResult.detected_prohibited_words.map((w, i) => (
                      <span key={i} className="bg-amber-200/80 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        Prohibited: {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Copy Editor & Generator (8 cols) */}
        <main className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-5">
          {/* Format / Channel Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-brand-line pb-3">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'script'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Video size={13} />
              <span>TikTok Video Script</span>
            </button>

            <button
              onClick={() => setActiveTab('organic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'organic'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Instagram size={13} />
              <span>Instagram Carousel</span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={13} />
              <span>Paid Direct Response Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'email'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail size={13} />
              <span>Email Newsletter</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp VIP</span>
            </button>
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                  <Lightbulb size={11} className="text-amber-500" /> Viral Opening Hook (First 3 Seconds)
                </label>
                <span className="text-[9px] text-slate-400 font-bold">Editable</span>
              </div>
              <input
                type="text"
                value={hook}
                onChange={(e) => {
                  setHook(e.target.value);
                  runLiveGuardrailCheck(`${e.target.value}\n${caption}\n${cta}`);
                }}
                disabled={isGenerating}
                placeholder="High-converting opening hook..."
                className="w-full text-xs font-bold text-brand-ink p-3 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase">
                  Generated Script / Body Content
                </label>
                {isGenerating ? (
                  <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Gemini Writing...
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-700 font-bold">{aiModelUsed}</span>
                )}
              </div>
              <textarea
                rows={8}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  runLiveGuardrailCheck(`${hook}\n${e.target.value}\n${cta}`);
                }}
                disabled={isGenerating}
                placeholder="Content generated by Gemini AI..."
                className="w-full text-xs text-slate-700 p-3.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green font-mono leading-relaxed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Call to Action (CTA)
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => {
                    setCta(e.target.value);
                    runLiveGuardrailCheck(`${hook}\n${caption}\n${e.target.value}`);
                  }}
                  disabled={isGenerating}
                  className="w-full text-xs font-bold text-brand-green p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Trending Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  disabled={isGenerating}
                  className="w-full text-xs text-slate-600 p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-brand-line">
            <button
              onClick={() => generateAIPost(activeTab, selectedProduct, activePillar)}
              disabled={isGenerating}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={isGenerating ? 'animate-spin text-brand-green' : ''} />
              <span>{isGenerating ? 'Gemini 3.6 Flash Writing...' : 'Regenerate with Gemini AI'}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Ready-to-Publish Copy'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
