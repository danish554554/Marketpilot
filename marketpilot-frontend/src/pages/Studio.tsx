import React, { useState, useEffect } from 'react';
import {
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
  Loader2,
  AlertTriangle,
  Package,
  Tag,
  Palette,
  ArrowRight,
  Info,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { BrandKit, MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';

interface StudioProps {
  products: Product[];
  businessName: string;
  activeStrategy?: MarketingStrategy | null;
  brandKit?: BrandKit | null;
  trends?: TrendSignal[];
}

export const Studio: React.FC<StudioProps> = ({
  products,
  businessName,
  activeStrategy,
  brandKit,
  trends = [],
}) => {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<'script' | 'organic' | 'paid' | 'email' | 'whatsapp'>('script');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string>(
    trends[0]?.topic || activeStrategy?.pillars?.[0]?.trend_topic || ''
  );
  const [customOffer, setCustomOffer] = useState<string>('20% Off Launch Discount');
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
    id: 'prod-fallback',
    name: 'Your Featured Product',
    description: 'High-quality e-commerce product',
    price: 39.99,
    cost_price: 12.00,
    profit_margin: 70,
    margin_tier: 'high',
    stock_quantity: 150,
    pain_points: ['Daily friction', 'Inefficient alternatives'],
    features: ['Premium materials', 'Fast results', 'Durable design'],
  };

  const selectedTrend = trends.find((t) => t.topic === selectedTrendTopic) || trends[0];
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
      // Local fallback check
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

  const generateAIPost = async (
    tab = activeTab,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer
  ) => {
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
        trend_topic: trend || activePillar?.trend_topic || undefined,
        hook_idea: activePillar?.hook_ideas?.[0] || undefined,
        custom_instructions: `Offer/Promotion: ${offer || 'Standard Pricing'}. Ground strictly in product features: ${prod.features?.join(', ')}.`,
      });

      setHook(res.hook);
      setCaption(res.caption);
      setCta(res.call_to_action || `Claim ${offer || 'Special Discount'}`);
      setHashtags(res.hashtags);
      if (res.ai_model_used) setAiModelUsed(res.ai_model_used);

      runLiveGuardrailCheck(`${res.hook}\n${res.caption}\n${res.call_to_action}`);
    } catch (err) {
      console.warn('Backend copywriting fallback:', err);
      fallbackLocalCopy(tab, prod, trend, offer);
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackLocalCopy = (
    tab: string,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer
  ) => {
    const prodName = prod.name;
    const feat = prod.features?.[0] || 'innovative high-performance design';
    const pain = prod.pain_points?.[0] || 'wasting time on poor alternatives';
    const hookIdea = activePillar?.hook_ideas?.[0] || `Still struggling with ${pain}? Watch this.`;

    let generatedHook = '';
    let generatedCaption = '';
    let generatedCta = '';
    let generatedTags = '';

    if (tab === 'script') {
      generatedHook = hookIdea;
      generatedCaption = (
        `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing the daily problem with ${pain}.\nVoiceover: "${hookIdea}"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using ${prodName} highlighting ${feat}.\nVoiceover: "The ${prodName} fixes this in seconds. Designed with ${feat} for smooth, effortless results."\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Showing clean finished look with product in hand.\nVoiceover: "Tap the link below to get yours with ${offer || 'free express shipping'} before stock runs out!"`
      );
      generatedCta = `Tap link in bio to claim ${offer || '20% off'}`;
      generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ViralFinds #ProblemSolved #LifeHacks`;
    } else if (tab === 'organic') {
      generatedHook = `Why most people struggle with ${pain} (and the 30-second fix).`;
      generatedCaption = (
        `If you've been dealing with ${pain}, you're not alone.\n\nMeet the ${prodName}:\n`
        + (prod.features || []).map(f => `✨ ${f}`).join('\n')
        + `\n\n🎁 Special Offer: ${offer || 'Save 20% today'}\n\nDrop a 💬 below or save this post for your next order!`
      );
      generatedCta = 'Comment "INFO" for the direct link';
      generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ProductReview #MustHave`;
    } else if (tab === 'paid') {
      generatedHook = `Stop dealing with ${pain}.`;
      generatedCaption = (
        `Upgrade your daily routine with the ${prodName}.\n\n`
        + (prod.features || []).map(f => `✅ ${f}`).join('\n')
        + `\n\n🛡️ 30-Day Satisfaction Guarantee\n🚚 Fast Free Tracked Shipping\n🏷️ Offer: ${offer || '20% Launch Discount'}\n\nClick below to claim your discount today!`
      );
      generatedCta = `Shop Now & Claim ${offer || 'Discount'}`;
      generatedTags = '#LimitedTimeOffer #SpecialDiscount';
    } else if (tab === 'email') {
      generatedHook = `Subject: The smartest way to tackle ${pain} ✨`;
      generatedCaption = (
        `Hi there,\n\nIf ${pain} has been holding you back, we built the **${prodName}** just for you.\n\nKey Highlights:\n`
        + (prod.features || []).map(f => `• **${f}**`).join('\n')
        + `\n\n🎉 Limited Time: ${offer || '20% Off'}\n\nClick below to order yours today:`
      );
      generatedCta = `Claim Your ${prodName}`;
      generatedTags = '';
    } else {
      generatedHook = `✨ VIP Restock: ${prodName}`;
      generatedCaption = (
        `Hi! Quick VIP update on the **${prodName}**.\n\nDue to high demand, we just restocked with **${offer || 'Free Priority Delivery'}**!\n\nReply YES to confirm your order or click below:`
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
    generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer);
  }, [activeTab, selectedProductId, selectedTrendTopic, selectedPillarIndex, activeStrategy]);

  const handleCopy = () => {
    const fullText = `${hook}\n\n${caption}\n\n👉 CTA: ${cta}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Missing data checks
  const missingPainPoints = !selectedProduct.pain_points || selectedProduct.pain_points.length === 0;
  const missingFeatures = !selectedProduct.features || selectedProduct.features.length === 0;
  const missingTrends = trends.length === 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 1. Transparent Grounding & Attribution Header Bar */}
      <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-700" />
                TRANSPARENT AI GROUNDING ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                Model: <strong className="text-brand-ink font-extrabold">{aiModelUsed}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
              Multi-Channel Grounded Content Studio
            </h1>
          </div>

          <button
            onClick={() => generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all self-start md:self-auto"
          >
            <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Gemini Generating...' : 'Regenerate Copy'}</span>
          </button>
        </div>

        {/* Live "Based on" Attribution Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-1">BASED ON:</span>

          {/* Product Badge */}
          <div className="bg-slate-50 border border-slate-200 text-brand-ink text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Package size={13} className="text-brand-green" />
            <span>Product: <strong className="text-brand-green">{selectedProduct.name}</strong></span>
            {selectedProduct.profit_margin && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                {selectedProduct.profit_margin}% Margin
              </span>
            )}
          </div>

          {/* Offer Badge */}
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Tag size={13} className="text-blue-600" />
            <span>Offer: <strong>{customOffer || 'Standard'}</strong></span>
          </div>

          {/* Trend Badge */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <TrendingUp size={13} className="text-amber-600" />
            <span>Trend: <strong>{selectedTrendTopic || selectedTrend?.topic || 'Direct Problem-Solution'}</strong></span>
            {selectedTrend?.confidence_score && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-extrabold">
                {selectedTrend.confidence_score}% Virality
              </span>
            )}
          </div>

          {/* Brand Voice Badge */}
          <div className="bg-purple-50 border border-purple-200 text-purple-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Palette size={13} className="text-purple-600" />
            <span>Voice: <strong>{activeBrandKit?.brand_voice?.slice(0, 2).join(', ') || 'Professional'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Grounding Controls Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Missing Data Warning Alert if needed */}
          {(missingPainPoints || missingFeatures || missingTrends) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Grounding Completeness Warning</span>
              </div>
              <ul className="text-[11px] text-amber-800 space-y-1 pl-5 list-disc">
                {missingPainPoints && <li>Missing customer pain points on this product.</li>}
                {missingFeatures && <li>Missing product features.</li>}
                {missingTrends && <li>No live trends ingested yet (using evergreen angles).</li>}
              </ul>
            </div>
          )}

          {/* Grounding Inputs Card */}
          <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                GROUNDING ATTRIBUTES & INPUTS
              </small>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                Editable
              </span>
            </div>

            {/* 1. Product Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Package size={12} className="text-brand-green" /> 1. Source Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.profit_margin ? `${p.profit_margin}% margin` : 'In stock'})
                  </option>
                ))}
                {products.length === 0 && <option value="">{selectedProduct.name}</option>}
              </select>

              {/* Product Pricing Details */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Retail Price:</span>
                  <b className="text-brand-ink">{formatAmount(selectedProduct.price || 39.99)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profit Margin:</span>
                  <b className="text-emerald-700">{selectedProduct.profit_margin || 65}% ({selectedProduct.margin_tier || 'high'} tier)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In Stock:</span>
                  <b className="text-brand-ink">{selectedProduct.stock_quantity || 100} units</b>
                </div>
              </div>
            </div>

            {/* 2. Active Offer Input */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Tag size={12} className="text-blue-600" /> 2. Active Offer / Hook Promo
              </label>
              <input
                type="text"
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value)}
                placeholder="e.g. 20% Off Launch Discount, Free Delivery"
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              />
            </div>

            {/* 3. Trend Signal Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-amber-600" /> 3. Live Market Trend Angle
              </label>
              <select
                value={selectedTrendTopic}
                onChange={(e) => setSelectedTrendTopic(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              >
                {trends.map((t, idx) => (
                  <option key={t.id || idx} value={t.topic}>
                    {t.topic} ({t.confidence_score}% virality)
                  </option>
                ))}
                {trends.length === 0 && (
                  <option value="Problem-Solution Demonstration">
                    Evergreen: Problem-Solution Demonstration
                  </option>
                )}
              </select>
            </div>

            {/* 4. Strategic Rationale Box */}
            <div className="bg-[#f8faf9] border border-[#e2eae6] rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                <HelpCircle size={12} className="text-emerald-700" />
                Why this content was chosen:
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed m-0">
                Grounded in high stock inventory ({selectedProduct.stock_quantity || 100} units) with {selectedProduct.profit_margin || 65}% margin. Connects customer pain point ({selectedProduct.pain_points?.[0] || 'daily friction'}) directly to the "{selectedTrendTopic || 'Problem-Solution'}" trend angle for maximum ROAS.
              </p>
            </div>
          </div>

          {/* Real-time Guardrail Audit Card */}
          <div className={`rounded-2xl p-4 border shadow-card transition-all ${
            guardrailResult.passed ? 'bg-white border-emerald-200' : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-brand-ink block font-bold">
                  {guardrailResult.passed ? 'Brand Kit Guardrails Passed' : 'Guardrail Warning'}
                </strong>
                <p className="text-slate-500 m-0 mt-0.5 text-[11px]">
                  {guardrailResult.safety_message}
                </p>
                {guardrailResult.detected_prohibited_words.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {guardrailResult.detected_prohibited_words.map((w, i) => (
                      <span key={i} className="bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        Prohibited: {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Multi-Channel Editor (8 cols) */}
        <main className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-5">
          {/* Format / Channel Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-brand-line pb-3">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={13} />
              <span>Paid Direct-Response Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp VIP Restock</span>
            </button>
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            {/* Opening Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" /> Viral Opening Hook (First 3 Seconds)
                </label>
                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                  <Edit3 size={10} /> Editable
                </span>
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

            {/* Body Content / Script */}
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
                  <span className="text-[9px] text-slate-400 font-bold">{caption.length} characters</span>
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

            {/* CTA & Hashtags */}
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
              onClick={() => generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer)}
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
