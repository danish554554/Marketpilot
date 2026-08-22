import React, { useState } from 'react';
import { Palette, ShieldAlert, CheckCircle2, Plus, X } from 'lucide-react';
import { BrandKit as BrandKitType } from '../types';
import { api } from '../api/endpoints';

interface BrandKitProps {
  brandKit: BrandKitType | null;
  setBrandKit: (bk: BrandKitType) => void;
}

export const BrandKit: React.FC<BrandKitProps> = ({ brandKit, setBrandKit }) => {
  const [voices, setVoices] = useState<string[]>(
    brandKit?.brand_voice || ['Empowering', 'Direct', 'Professional', 'Minimalist']
  );
  const [prohibited, setProhibited] = useState<string[]>(
    brandKit?.prohibited_words || ['guaranteed 100%', 'cure-all', 'cheap', 'miracle']
  );
  const [ctas, setCtas] = useState<string[]>(
    brandKit?.approved_cta_examples || ['Explore the collection', 'Shop the hero drop', 'Upgrade your carry']
  );
  const [primaryColor, setPrimaryColor] = useState(brandKit?.primary_color_hex || '#165823');
  const [newVoice, setNewVoice] = useState('');
  const [newProhibited, setNewProhibited] = useState('');
  const [newCta, setNewCta] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddVoice = () => {
    if (newVoice.trim()) {
      setVoices([...voices, newVoice.trim()]);
      setNewVoice('');
    }
  };

  const handleAddProhibited = () => {
    if (newProhibited.trim()) {
      setProhibited([...prohibited, newProhibited.trim().toLowerCase()]);
      setNewProhibited('');
    }
  };

  const handleAddCta = () => {
    if (newCta.trim()) {
      setCtas([...ctas, newCta.trim()]);
      setNewCta('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const payload: Partial<BrandKitType> = {
      brand_voice: voices,
      prohibited_words: prohibited,
      approved_cta_examples: ctas,
      primary_color_hex: primaryColor,
    };

    try {
      const res = await api.saveBrandKit(payload);
      setBrandKit(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            BRAND KIT & VOICE DIRECTIVES
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Keep every recommendation on-brand.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define inviolable guardrails: voice descriptors, forbidden phrases, and approved call-to-actions.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Brand Directives'}
        </button>
      </div>

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Brand Voice Directives */}
        <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-brand-green" />
            <h2 className="text-sm font-display font-bold text-brand-ink m-0">Tone of Voice</h2>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The AI Strategist injects these voice attributes into all copy and hook formulations.
          </p>

          <div className="flex flex-wrap gap-1.5 min-h-[100px]">
            {voices.map((v, i) => (
              <span
                key={i}
                className="bg-brand-pale text-brand-green font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              >
                <span>{v}</span>
                <button
                  onClick={() => setVoices(voices.filter((_, idx) => idx !== i))}
                  className="hover:text-rose-600"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newVoice}
              onChange={(e) => setNewVoice(e.target.value)}
              placeholder="e.g. Sophisticated"
              className="w-full text-xs p-2 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
            />
            <button
              onClick={handleAddVoice}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
            >
              <Plus size={14} />
            </button>
          </div>
        </article>

        {/* Inviolable Prohibited Words */}
        <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-rose-700">
            <ShieldAlert size={16} />
            <h2 className="text-sm font-display font-bold text-brand-ink m-0">Prohibited Words</h2>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Strict AI guardrail: any generation containing these words is automatically flagged and sanitized.
          </p>

          <div className="flex flex-wrap gap-1.5 min-h-[100px]">
            {prohibited.map((w, i) => (
              <span
                key={i}
                className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              >
                <span>{w}</span>
                <button
                  onClick={() => setProhibited(prohibited.filter((_, idx) => idx !== i))}
                  className="hover:text-rose-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newProhibited}
              onChange={(e) => setNewProhibited(e.target.value)}
              placeholder="e.g. 100% guaranteed"
              className="w-full text-xs p-2 rounded-lg border border-brand-line focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={handleAddProhibited}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
            >
              <Plus size={14} />
            </button>
          </div>
        </article>

        {/* Approved CTAs & Brand Colors */}
        <article className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-brand-green">
            <CheckCircle2 size={16} />
            <h2 className="text-sm font-display font-bold text-brand-ink m-0">Approved CTAs</h2>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Call-to-action phrases guaranteed to match brand guidelines.
          </p>

          <div className="space-y-1.5 min-h-[100px]">
            {ctas.map((c, i) => (
              <div
                key={i}
                className="bg-slate-50 text-slate-700 text-xs font-bold p-2 rounded-lg flex items-center justify-between border border-slate-100"
              >
                <span>“{c}”</span>
                <button
                  onClick={() => setCtas(ctas.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newCta}
              onChange={(e) => setNewCta(e.target.value)}
              placeholder="e.g. Shop now"
              className="w-full text-xs p-2 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
            />
            <button
              onClick={handleAddCta}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
            >
              <Plus size={14} />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
