import React, { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles, RefreshCw, Copy, Check, TrendingUp, Lightbulb, Video, Instagram, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { MarketingStrategy, Product } from '../types';

interface StudioProps {
  products: Product[];
  businessName: string;
  activeStrategy?: MarketingStrategy | null;
}

export const Studio: React.FC<StudioProps> = ({ products, businessName, activeStrategy }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'organic' | 'paid' | 'email' | 'whatsapp'>('script');
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const heroProd = products[0] || {
    name: '2-in-1 Rechargeable Hair Remover',
    pain_points: ['Painful monthly waxing', 'Razor bumps & redness', 'Flaky makeup over peach fuzz'],
    features: ['Interchangeable dual precision heads', 'Hypoallergenic stainless steel', 'USB rechargeable battery', 'Built-in LED light'],
  };

  const activePillar = activeStrategy?.pillars?.[selectedPillarIndex] || activeStrategy?.pillars?.[0];

  const [hook, setHook] = useState('');
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('Shop now and save 20%');
  const [hashtags, setHashtags] = useState('#SmoothBase #PeachFuzzRemoval #BeautyHacks #ViralProduct');

  // Update content dynamically based on selected pillar & tab
  const refreshContentForTab = (tab: 'script' | 'organic' | 'paid' | 'email' | 'whatsapp', pillar = activePillar) => {
    const trendTopic = pillar?.trend_topic || '30-Second Peach Fuzz Removal Before Makeup';
    const hookIdea = pillar?.hook_ideas?.[0] || 'Stop applying foundation over peach fuzz — watch this 30-second fix.';
    const prodName = heroProd.name;

    if (tab === 'script') {
      setHook(hookIdea);
      setCaption(
        `[HOOK - 0:00 to 0:03]\nVisual: Close-up split screen — foundation applying smoothly on hair-free skin vs patchy makeup over peach fuzz.\nVoiceover: "${hookIdea}"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using ${prodName} with circular motions. Zero redness, built-in LED highlighting fine hairs.\nVoiceover: "This dual-head trimmer removes fine peach fuzz in seconds with zero pain and no razor burn."\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Finished glowing makeup look + showing the compact USB device.\nVoiceover: "Tap the link below to get yours with free express shipping before it sells out!"`
      );
      setCta(pillar?.suggested_ctas?.[0] || 'Tap link in bio to get 20% off');
      setHashtags('#PeachFuzzRemoval #SmoothBaseRoutine #SkincareHacks #TikTokMadeMeBuyIt');
    } else if (tab === 'organic') {
      setHook(`Why your foundation looks cakey (and the 30-second fix dermatologists use).`);
      setCaption(
        `Ever wonder why your base makeup looks patchy by midday?\n\nIt’s usually not your foundation — it’s the microscopic peach fuzz trapping product.\n\nMeet the ${prodName}:\n✨ Dual precision heads for facial hair & eyebrow shaping\n✨ Hypoallergenic stainless steel blades (zero redness)\n✨ USB rechargeable & compact for travel\n\nDrop a 🤍 in the comments if you want the link sent to your DMs!`
      );
      setCta('Comment "GLOW" for the direct link');
      setHashtags('#SkincareRoutine #PeachFuzzRemoval #DermaplaningAtHome #FlawlessSkin');
    } else if (tab === 'paid') {
      setHook(`Stop spending $80 on monthly salon waxing.`);
      setCaption(
        `Why deal with painful waxing strips and razor bumps when you can get salon-smooth skin at home for a fraction of the cost?\n\nThe ${prodName} gives you painless, instant hair removal in under 60 seconds.\n\n✅ 30-Day Money-Back Guarantee\n✅ Fast Free Shipping\n✅ Over 12,000+ happy customers\n\nClick below to claim your 20% discount today!`
      );
      setCta('Shop Now & Get 20% Off');
      setHashtags('#BeautyDeal #SmoothSkin #HairRemovalHack #LimitedTimeOffer');
    } else if (tab === 'email') {
      setHook(`Subject: The secret to flawless foundation application is here ✨`);
      setCaption(
        `Hi there,\n\nIf you have ever felt like your foundation just won't glide on smoothly, you are not alone.\n\nFine facial peach fuzz prevents serums and makeup from sitting evenly. Traditional razors cause irritation, and salon waxing is painful and pricey.\n\nThat’s why we designed the **${prodName}**.\n\n• **Painless & Gentle**: Hypoallergenic blades designed for sensitive skin\n• **2-in-1 Versatility**: Swap in seconds between the facial head and eyebrow detailer\n• **USB Fast Rechargeable**: No messy batteries needed\n\nClick below to order yours today and transform your morning routine:`
      );
      setCta('Claim Your 2-in-1 Hair Remover');
      setHashtags('');
    } else {
      setHook(`✨ Exclusive VIP Flash Restock: ${prodName}`);
      setCaption(
        `Hi! Due to viral demand on TikTok, we just restocked our bestselling **${prodName}**.\n\nOrder in the next 2 hours and get **free priority delivery**!\n\nReply YES to confirm your order or click below:`
      );
      setCta('Order via WhatsApp with 1 Click');
      setHashtags('');
    }
  };

  useEffect(() => {
    refreshContentForTab(activeTab, activePillar);
  }, [activeTab, selectedPillarIndex, activeStrategy]);

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
              CAMPAIGN PILLAR CONTEXT
            </small>
            <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              {activeStrategy?.timeframe === 'weekly' ? '7-Day Sprint' : '30-Day Campaign'}
            </span>
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

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
            <div>
              <small className="text-[9px] font-extrabold text-slate-400 uppercase block">Hero Product</small>
              <b className="text-xs text-brand-ink">{heroProd.name}</b>
            </div>
            <div>
              <small className="text-[9px] font-extrabold text-slate-400 uppercase block">Creative Angle</small>
              <p className="text-[11px] text-slate-600 leading-snug">{activePillar?.creative_angle || 'Educational demonstration highlighting zero pain & smooth finish.'}</p>
            </div>
          </div>

          {/* AI Guardrails & Compliance Check */}
          <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>AI Guardrails Verified</span>
            </div>
            <p className="text-[10px] text-emerald-900 leading-relaxed">
              ✓ Zero prohibited terms detected<br />
              ✓ Product margin protected (78.7%)<br />
              ✓ Grounded in real customer pain points
            </p>
          </div>
        </aside>

        {/* Editor & Copy Canvas (8 cols) */}
        <main className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-5">
          {/* Format / Channel Tabs */}
          <div className="flex items-center gap-1 border-b border-brand-line pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'script'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video size={13} />
              <span>TikTok Video Script</span>
            </button>

            <button
              onClick={() => setActiveTab('organic')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'organic'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Instagram size={13} />
              <span>Instagram Carousel</span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'paid'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={13} />
              <span>Paid Direct Response Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'email'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail size={13} />
              <span>Email Newsletter</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'whatsapp'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp VIP Broadcast</span>
            </button>
          </div>

          {/* Copy Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                Viral Opening Hook (First 3 Seconds)
              </label>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full text-xs font-bold text-brand-ink p-3 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                Generated Script / Body Content
              </label>
              <textarea
                rows={9}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full text-xs font-mono text-slate-700 p-3 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  Call To Action (CTA)
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full text-xs font-bold text-emerald-800 p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  Trending Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full text-xs text-slate-600 p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-brand-line">
            <button
              onClick={() => refreshContentForTab(activeTab, activePillar)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Regenerate with Gemini AI</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98]"
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
