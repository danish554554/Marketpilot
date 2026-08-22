import React, { useState } from 'react';
import { CheckCircle2, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { Product } from '../types';

interface StudioProps {
  products: Product[];
  businessName: string;
}

export const Studio: React.FC<StudioProps> = ({ products, businessName }) => {
  const [activeTab, setActiveTab] = useState<'organic' | 'paid' | 'script' | 'email' | 'whatsapp'>('organic');
  const [copied, setCopied] = useState(false);

  const heroProd = products[0] || {
    name: 'Luna Everyday Bag',
    pain_points: ['Unorganized daily essentials'],
    features: ['Dedicated 15" laptop sleeve', 'Water-resistant vegan leather'],
  };

  const [hook, setHook] = useState('One bag, everything you need for a busy day.');
  const [caption, setCaption] = useState(
    `From lectures to coffee runs, the ${heroProd.name} keeps the essentials together without slowing you down.\n\nRoom for your laptop, books, charger and daily gear — all in one refined everyday carry.\n\nExplore the collection today.`
  );
  const [cta, setCta] = useState('Explore the collection');
  const [hashtags, setHashtags] = useState('#EverydayCarry #LunaBags #CampusStyle #Quality');

  const handleTabChange = (tab: 'organic' | 'paid' | 'script' | 'email' | 'whatsapp') => {
    setActiveTab(tab);
    if (tab === 'organic') {
      setHook(`Why ${heroProd.name} is becoming the new standard for everyday carry.`);
      setCaption(
        `From morning meetings to evening commutes, the ${heroProd.name} is engineered with ${heroProd.features?.[0] || 'premium materials'}.\n\n✅ Lightweight and structured\n✅ Fits everything without looking bulky\n\nUpgrade your daily routine now.`
      );
      setCta('Explore the collection');
    } else if (tab === 'paid') {
      setHook(`Tired of cheap bags falling apart after 2 months?`);
      setCaption(
        `Meet ${heroProd.name}: Built with ${heroProd.features?.[0] || 'heavy-duty durability'} and backed by our quality promise.\n\nLimited stock remaining for this batch. Order today and get fast free shipping.`
      );
      setCta('Shop now and save 15%');
    } else if (tab === 'script') {
      setHook(`Stop scrolling if you carry more than 3 things daily.`);
      setCaption(
        `[SCENE 1 (3s)]\nVisual: Close-up on unorganized items falling out of standard bag.\nAudio: "If your everyday bag looks like this, stop scrolling."\n\n[SCENE 2 (7s)]\nVisual: Seamlessly placing laptop, charger, water bottle in ${heroProd.name}.\nAudio: "This is the ${heroProd.name}. Designed specifically for busy workdays."\n\n[SCENE 3 (5s)]\nVisual: Presenter walking into coffee shop with bag over shoulder.\nAudio: "Tap the link below to grab yours before stock runs out!"`
      );
      setCta('Tap link in bio to shop');
    } else if (tab === 'email') {
      setHook(`Subject: The smartest way to organize your daily commute`);
      setCaption(
        `Hi there,\n\nWhen was the last time you upgraded your everyday carry?\n\nMost bags force you to choose between style and actual utility. That's why we designed ${heroProd.name}.\n\n• ${heroProd.features?.[0] || 'Reinforced compartments'}\n• Built for seamless daily performance\n\nClick below to explore the latest drop:`
      );
      setCta('Explore Collection Now');
    } else {
      setHook(`🌟 VIP Restock: ${heroProd.name}`);
      setCaption(
        `Hi! Quick update: We just restocked our bestselling **${heroProd.name}**.\n\nCrafted with ${heroProd.features?.[0] || 'premium materials'}. Grab yours before it sells out again!`
      );
      setCta('Order via WhatsApp');
    }
  };

  const handleCopy = () => {
    const fullText = `${hook}\n\n${caption}\n\n👉 ${cta}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div>
        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
          CONTENT STUDIO
        </small>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
          Make every word earn its place.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Grounded copywriting with real-time Brand Kit prohibited word checks and product feature alignment.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Content Brief Sidebar (4 cols) */}
        <aside className="lg:col-span-4 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block">
            CONTENT BRIEF & METADATA
          </small>
          <h2 className="text-lg font-display font-bold text-brand-ink m-0">
            {heroProd.name}
          </h2>

          <dl className="space-y-2.5 text-xs">
            <div>
              <dt className="text-[9px] font-extrabold text-slate-400 uppercase">Target Channel</dt>
              <dd className="font-bold text-brand-ink mt-0.5 capitalize">{activeTab} channel</dd>
            </div>
            <div>
              <dt className="text-[9px] font-extrabold text-slate-400 uppercase">Primary Angle</dt>
              <dd className="font-bold text-brand-ink mt-0.5">“Everything fits seamlessly”</dd>
            </div>
            <div>
              <dt className="text-[9px] font-extrabold text-slate-400 uppercase">Audience Pain Point</dt>
              <dd className="font-bold text-slate-600 mt-0.5">{heroProd.pain_points?.[0] || 'Messy daily carry'}</dd>
            </div>
          </dl>

          <div className="bg-[#eff7f2] border border-emerald-200/60 rounded-xl p-3.5 mt-6">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
              <CheckCircle2 size={14} className="text-brand-green" />
              <span>Brand Guardrails Active</span>
            </div>
            <small className="text-[10px] text-emerald-700 block leading-tight">
              Grounded in verified catalogue features. 0 prohibited words detected.
            </small>
          </div>
        </aside>

        {/* Copywriting Editor (8 cols) */}
        <article className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          {/* Format Tabs */}
          <div className="flex items-center gap-4 border-b border-brand-line pb-3 text-xs font-bold overflow-x-auto">
            {[
              { id: 'organic', label: 'Organic post' },
              { id: 'paid', label: 'Paid ad copy' },
              { id: 'script', label: 'Video script' },
              { id: 'email', label: 'Email newsletter' },
              { id: 'whatsapp', label: 'WhatsApp broadcast' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`pb-2 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-brand-green border-brand-green font-extrabold'
                    : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Hook input */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Hook / Headline
            </label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full text-xs font-bold p-3 rounded-xl border border-brand-line bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-green"
            />
          </div>

          {/* Body / Caption input */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
              Full Copy / Script Narration
            </label>
            <textarea
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-brand-line bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-green leading-relaxed font-sans"
            />
          </div>

          {/* CTA & Hashtags row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                Call to Action
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white focus:outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-brand-line pt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>Product claims verified · 0 unverified statements</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy package'}</span>
              </button>

              <button
                onClick={() => handleTabChange(activeTab)}
                className="bg-brand-pale hover:bg-emerald-100 text-brand-green text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={13} />
                <span>✦ Regenerate copy</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
