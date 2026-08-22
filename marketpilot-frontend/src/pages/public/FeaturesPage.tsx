import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import {
  Zap, TrendingUp, Package, PenTool, Calendar, Shield,
  Activity, Download, HeartPulse, ArrowRight, Check, Sparkles,
  Layers, Lock, Sliders, Play, Eye, FileText, CheckCircle2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   CUSTOM VECTOR AI UI ILLUSTRATIONS FOR EACH FEATURE MODULE
───────────────────────────────────────────────────────────── */

// 1. Strategy Engine Vector
function StrategyEngineVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line shadow-soft p-5 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-brand-line pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-navy">AI Strategy Formulation</span>
        </div>
        <span className="bg-brand-pale text-brand-green text-[10px] font-black px-2.5 py-1 rounded-full">
          78.7% Hero Margin
        </span>
      </div>
      <div className="space-y-2.5">
        {[
          { name: 'Pillar 1: Painless 30-Sec Routine', type: 'Organic • TikTok', pct: '60%', color: 'bg-emerald-500' },
          { name: 'Pillar 2: Direct-Response Pain Ad', type: 'Paid • Meta Ads', pct: '40%', color: 'bg-blue-500' },
          { name: 'Pillar 3: Micro-Eyebrow Detailing', type: 'Organic • Instagram', pct: '85%', color: 'bg-purple-500' },
          { name: 'Pillar 4: VIP Glow Club Care', type: 'Retention • Email', pct: '95%', color: 'bg-amber-500' },
        ].map((p, idx) => (
          <div key={idx} className="bg-brand-canvas rounded-xl p-2.5 border border-brand-line/60">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-brand-ink text-[11px]">{p.name}</span>
              <span className="text-[10px] font-semibold text-brand-muted">{p.type}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full ${p.color} rounded-full`} style={{ width: p.pct }}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between text-[11px]">
        <span className="text-brand-muted">Budget Math Split</span>
        <div className="flex items-center gap-3 font-extrabold text-brand-ink">
          <span className="text-emerald-700">60% Organic</span>
          <span>•</span>
          <span className="text-blue-700">40% Paid</span>
        </div>
      </div>
    </div>
  );
}

// 2. Trend Radar Vector
function TrendRadarVector() {
  return (
    <div className="w-full bg-[#0d1527] rounded-2xl border border-slate-700/60 p-5 text-white relative overflow-hidden shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">Live Social Signals</span>
        </div>
        <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Radar Active
        </span>
      </div>
      {/* Radar Signal Feed */}
      <div className="space-y-3">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-cyan-200 text-[11px]">“30-Sec Peach Fuzz Routine”</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">96% Conf</span>
          </div>
          <p className="text-[10px] text-slate-400">TikTok Discovery • Verified URL indexed</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-cyan-200 text-[11px]">Painless Dermaplaning vs Salon Wax</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">91% Conf</span>
          </div>
          <p className="text-[10px] text-slate-400">Instagram Reels • High Save Velocity</p>
        </div>
      </div>
      {/* Animated Waveform */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 h-5">
          <div className="w-1 bg-cyan-400 h-3 rounded-full animate-bounce"></div>
          <div className="w-1 bg-cyan-400 h-5 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 bg-cyan-400 h-2 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 bg-cyan-400 h-4 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-1 bg-cyan-400 h-5 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Matched to: 2-in-1 Trimmer</span>
      </div>
    </div>
  );
}

// 3. Product Intelligence Vector
function ProductIntelligenceVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SKU: GLOW-2IN1-PRO</span>
          <h4 className="text-sm font-display font-extrabold text-brand-ink">2-in-1 Rechargeable Remover</h4>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg">
          HERO STATUS
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-brand-canvas p-2.5 rounded-xl border border-brand-line/60">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Retail Price</p>
          <p className="text-sm font-extrabold text-brand-ink">$39.99</p>
        </div>
        <div className="bg-brand-canvas p-2.5 rounded-xl border border-brand-line/60">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Cost Price</p>
          <p className="text-sm font-extrabold text-slate-600">$8.50</p>
        </div>
        <div className="bg-brand-pale p-2.5 rounded-xl border border-brand-green/20">
          <p className="text-[9px] text-brand-green uppercase font-bold">Margin %</p>
          <p className="text-sm font-extrabold text-brand-green">78.7%</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Stock Velocity</span>
          <span className="font-bold text-emerald-700">650 Units (Optimal)</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Primary Pain Point</span>
          <span className="font-bold text-slate-700">Razor Burns & Wax Costs</span>
        </div>
      </div>
    </div>
  );
}

// 4. Content Studio Vector
function ContentStudioVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 border-b border-brand-line pb-3 mb-3 text-[11px] font-bold overflow-x-auto">
        <span className="bg-brand-green text-white px-3 py-1 rounded-lg">Video Script</span>
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">Carousel</span>
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">Paid Ad</span>
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">Email</span>
      </div>
      {/* Script Timeline */}
      <div className="space-y-2.5">
        <div className="border border-brand-line/80 rounded-xl p-3 bg-brand-canvas/60">
          <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
            <span className="text-emerald-700">SCENE 1 (0:00 - 0:03) • HOOK</span>
            <span className="text-slate-400 font-mono">3.0s</span>
          </div>
          <p className="text-xs text-brand-ink font-semibold">“Why your foundation is looking cakey (and the 30-second fix).”</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Camera: Macro close-up applying foundation smoothly over skin.</p>
        </div>
        <div className="border border-brand-line/80 rounded-xl p-3 bg-brand-canvas/60">
          <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
            <span className="text-blue-700">SCENE 2 (0:03 - 0:15) • SOLUTION</span>
            <span className="text-slate-400 font-mono">12.0s</span>
          </div>
          <p className="text-xs text-brand-ink font-semibold">“Dual hypoallergenic trimmer heads gently glide with zero redness.”</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <CheckCircle2 size={12} /> Fact-checked against catalogue
        </span>
        <span className="bg-brand-pale text-brand-green px-2 py-0.5 rounded font-bold">5 Formats Ready</span>
      </div>
    </div>
  );
}

// 5. Editorial Calendar Vector
function EditorialCalendarVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 border-b border-brand-line pb-3">
        <span className="text-xs font-display font-extrabold text-brand-ink">Weekly Content Matrix</span>
        <span className="bg-brand-pale text-brand-green text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
          Auto-Cadence
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
        <div className="bg-brand-canvas rounded-xl p-2 border border-brand-line/60">
          <span className="text-[9px] font-bold text-slate-400 block mb-1">MON</span>
          <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded py-1 mb-1">TikTok Reel</div>
          <span className="text-[9px] text-slate-500">09:00 AM</span>
        </div>
        <div className="bg-brand-canvas rounded-xl p-2 border border-brand-line/60">
          <span className="text-[9px] font-bold text-slate-400 block mb-1">WED</span>
          <div className="bg-blue-100 text-blue-800 text-[10px] font-bold rounded py-1 mb-1">Meta Ad</div>
          <span className="text-[9px] text-slate-500">11:30 AM</span>
        </div>
        <div className="bg-brand-canvas rounded-xl p-2 border border-brand-line/60">
          <span className="text-[9px] font-bold text-slate-400 block mb-1">FRI</span>
          <div className="bg-purple-100 text-purple-800 text-[10px] font-bold rounded py-1 mb-1">IG Carousel</div>
          <span className="text-[9px] text-slate-500">03:00 PM</span>
        </div>
        <div className="bg-brand-canvas rounded-xl p-2 border border-brand-line/60">
          <span className="text-[9px] font-bold text-slate-400 block mb-1">SUN</span>
          <div className="bg-amber-100 text-amber-800 text-[10px] font-bold rounded py-1 mb-1">VIP Email</div>
          <span className="text-[9px] text-slate-500">06:00 PM</span>
        </div>
      </div>
      <div className="bg-brand-pale rounded-xl p-2.5 flex items-center justify-between text-[11px] text-brand-green font-bold">
        <span>✦ Batch Generation</span>
        <span>7 Days Queued →</span>
      </div>
    </div>
  );
}

// 6. Brand Kit Vector
function BrandKitVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 border-b border-brand-line pb-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-brand-green" />
          <span className="text-xs font-display font-extrabold text-brand-ink">Inviolable Guardrails</span>
        </div>
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Rules Enforced
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Brand Tone Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {['Empowering', 'Gentle', 'Relatable', 'Clean'].map((t) => (
              <span key={t} className="bg-brand-canvas border border-brand-line text-brand-ink text-[10px] font-bold px-2.5 py-1 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block mb-1.5">Blocked Prohibited Words</span>
          <div className="flex flex-wrap gap-1.5">
            {['✕ painful waxing', '✕ cheap plastic', '✕ miracle cure'].map((w) => (
              <span key={w} className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-lg line-through">
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="pt-2 border-t border-brand-line flex items-center justify-between text-[10px] text-emerald-700 font-bold">
          <span>✓ Approved CTA: “Get painless smooth skin”</span>
        </div>
      </div>
    </div>
  );
}

// 7. Performance Vector
function PerformanceVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-display font-extrabold text-brand-ink">AI Feedback Learning Loop</span>
        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
          +42% ROAS Boost
        </span>
      </div>
      <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-3">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-slate-400 text-[10px]">Winning Creative Angle</span>
          <span className="text-emerald-400 font-bold text-[10px]">18.4% Save Rate</span>
        </div>
        <p className="text-xs font-bold text-white mb-2">“Before-and-After Foundation Comparison”</p>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-[84%] rounded-full"></div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Angle Reinforcement: <strong className="text-brand-ink font-bold">Enabled</strong></span>
        <span className="text-emerald-600 font-bold">Auto-Optimized</span>
      </div>
    </div>
  );
}

// 8. Export Center Vector
function ExportCenterVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 border-b border-brand-line pb-3">
        <span className="text-xs font-display font-extrabold text-brand-ink">Multi-Format Production Stacks</span>
        <span className="bg-brand-pale text-brand-green text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
          Instant Download
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-brand-canvas border border-brand-line rounded-xl p-3 text-center">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase block mb-1">.CSV</span>
          <p className="text-xs font-bold text-brand-ink">Copywriter Handoff</p>
          <span className="text-[9px] text-slate-400">Spreadsheet ready</span>
        </div>
        <div className="bg-brand-canvas border border-brand-line rounded-xl p-3 text-center">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase block mb-1">.MD</span>
          <p className="text-xs font-bold text-brand-ink">Strategy Brief</p>
          <span className="text-[9px] text-slate-400">Formatted Markdown</span>
        </div>
        <div className="bg-brand-canvas border border-brand-line rounded-xl p-3 text-center">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase block mb-1">.HTML</span>
          <p className="text-xs font-bold text-brand-ink">Executive PDF</p>
          <span className="text-[9px] text-slate-400">Print styled</span>
        </div>
        <div className="bg-brand-canvas border border-brand-line rounded-xl p-3 text-center">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase block mb-1">.JSON</span>
          <p className="text-xs font-bold text-brand-ink">Full Backup</p>
          <span className="text-[9px] text-slate-400">Workspace data</span>
        </div>
      </div>
    </div>
  );
}

// 9. Health & Compliance Vector
function HealthComplianceVector() {
  return (
    <div className="w-full bg-white rounded-2xl border border-brand-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 border-b border-brand-line pb-3">
        <span className="text-xs font-display font-extrabold text-brand-ink">Workspace Health Readiness</span>
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
          87% / 100%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
        {[
          { name: 'Brand Voice', status: 'Optimal', ok: true },
          { name: 'Margin Calculations', status: '78.7% Verified', ok: true },
          { name: 'Trend Freshness', status: 'Live Index', ok: true },
          { name: 'Guardrail Audit', status: '100% Passed', ok: true },
        ].map((item, idx) => (
          <div key={idx} className="bg-brand-canvas p-2 rounded-lg border border-brand-line/60 flex items-center justify-between">
            <span className="text-slate-600 font-medium text-[10px]">{item.name}</span>
            <span className="text-emerald-700 font-bold text-[10px]">✓ {item.status}</span>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 rounded-xl p-2.5 flex items-center justify-between text-[10px] text-emerald-800 font-bold border border-emerald-100">
        <span>Safety Audit: 0 Prohibited Words Detected</span>
        <Shield size={12} className="text-emerald-600" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODULE DEFINITIONS WITH LINKED VECTOR ILLUSTRATIONS
───────────────────────────────────────────────────────────── */

const modules = [
  {
    icon: <Zap size={28} />,
    title: 'AI Strategy Engine',
    desc: 'Formulates 4-pillar marketing campaigns grounded in your product data, margin calculations, and real-time trend signals.',
    bullets: ['4 campaign pillars: Awareness, Acquisition, Trend Velocity, Retention', 'Budget allocation math (Organic vs Paid split)', 'High-margin hero product auto-selection', 'Strategic rationale for every creative decision'],
    color: 'bg-brand-green/10 text-brand-green',
    vector: <StrategyEngineVector />,
  },
  {
    icon: <TrendingUp size={28} />,
    title: 'Trend Intelligence Radar',
    desc: 'Scans social media platforms for emerging viral formats, trending audio, and breakout content angles.',
    bullets: ['Verified source URLs and collection timestamps', 'Confidence scoring (0–100%) per trend', 'Industry-matched suggested creative angles', 'Platform coverage: TikTok, Instagram, Facebook, LinkedIn'],
    color: 'bg-blue-50 text-brand-blue',
    vector: <TrendRadarVector />,
  },
  {
    icon: <Package size={28} />,
    title: 'Product Intelligence',
    desc: 'Calculates profit margins, monitors stock levels, and prioritizes products by business value.',
    bullets: ['Automatic margin tier classification (High / Medium / Low)', 'Stock quantity monitoring with out-of-stock guardrails', 'Feature-to-pain-point semantic mapping', 'Hero product auto-selection for maximum ROAS'],
    color: 'bg-orange-50 text-orange-600',
    vector: <ProductIntelligenceVector />,
  },
  {
    icon: <PenTool size={28} />,
    title: 'Content Studio',
    desc: 'Generates production-ready copy across 5 distinct formats, each tailored to the product and platform.',
    bullets: ['Social post captions with hooks, CTAs, and hashtags', '5-slide carousel scripts (Hook → Problem → Solution → Proof → CTA)', 'Short-form video scripts with timed scenes and camera cues', 'Email newsletters and WhatsApp broadcasts'],
    color: 'bg-purple-50 text-purple-600',
    vector: <ContentStudioVector />,
  },
  {
    icon: <Calendar size={28} />,
    title: 'Editorial Calendar',
    desc: 'Distributes generated content across a weekly or monthly schedule with balanced channel coverage.',
    bullets: ['7-day or 30-day automated scheduling', 'Balanced organic and paid content cadence', 'Platform-specific timing optimization', 'One-click batch generation for all scheduled slots'],
    color: 'bg-brand-green/10 text-brand-green',
    vector: <EditorialCalendarVector />,
  },
  {
    icon: <Shield size={28} />,
    title: 'Brand Kit & Guardrails',
    desc: 'Enforces inviolable brand safety rules across all generated content.',
    bullets: ['Tone of voice descriptor tags (e.g., Empowering, Clean)', 'Prohibited word regex + LLM safety filtering', 'Approved CTA library for consistent conversion language', 'Real-time fact-checking against product catalogue'],
    color: 'bg-red-50 text-red-600',
    vector: <BrandKitVector />,
  },
  {
    icon: <Activity size={28} />,
    title: 'Performance Tracking',
    desc: 'Log content performance manually to feed the AI learning loop and improve future recommendations.',
    bullets: ['Track reach, engagement, saves, and click-through rates', 'Compare organic vs paid performance by pillar', 'Identify winning hooks and creative angles', 'AI-recommended format adjustments based on results'],
    color: 'bg-blue-50 text-brand-blue',
    vector: <PerformanceVector />,
  },
  {
    icon: <Download size={28} />,
    title: 'Export Center',
    desc: 'Download your strategy, content, and data in multiple production-ready formats.',
    bullets: ['Markdown strategy briefs for stakeholder review', 'CSV copywriter handoff spreadsheets', 'Print-ready HTML reports (save as PDF)', 'Full JSON workspace backup for data portability'],
    color: 'bg-brand-green/10 text-brand-green',
    vector: <ExportCenterVector />,
  },
  {
    icon: <HeartPulse size={28} />,
    title: 'Workspace Health & Compliance',
    desc: 'Scores your workspace readiness across 8 dimensions and audits AI guardrail compliance.',
    bullets: ['8-dimension health score (0–100%)', 'Actionable improvement suggestions per dimension', 'AI guardrail pass rate statistics', 'Compliance audit trail for brand safety'],
    color: 'bg-purple-50 text-purple-600',
    vector: <HealthComplianceVector />,
  },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-green/20 border border-brand-green/40 px-3.5 py-1.5 rounded-full text-brand-green-light text-xs font-extrabold uppercase tracking-wider mb-5">
            <Sparkles size={13} /> Full Autonomous Architecture
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            Everything you need to market smarter
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            9 purpose-built AI modules that work together as one unified marketing operating system.
          </p>
        </div>
      </section>

      {/* Module Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {modules.map((mod, i) => (
            <div
              key={mod.title}
              className={`flex flex-col md:flex-row items-center gap-12 mb-24 last:mb-0 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Feature Description */}
              <div className="flex-1">
                <div className={`w-14 h-14 rounded-2xl ${mod.color} grid place-items-center mb-5 shadow-sm`}>
                  {mod.icon}
                </div>
                <div className="inline-block text-[11px] font-extrabold tracking-wider text-brand-green uppercase mb-1">
                  MODULE 0{i + 1}
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-ink mb-3">
                  {mod.title}
                </h3>
                <p className="text-brand-muted leading-relaxed mb-5">{mod.desc}</p>
                <ul className="space-y-2.5">
                  {mod.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-brand-ink">
                      <span className="w-5 h-5 rounded-full bg-brand-pale text-brand-green grid place-items-center flex-shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Vector AI Illustration */}
              <div className="flex-1 w-full max-w-lg">
                <div className="transition-transform duration-300 hover:scale-[1.02]">
                  {mod.vector}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-brand-navy to-[#0f2b1a] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-extrabold mb-4">Ready to transform your marketing?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Experience all 9 intelligent modules working seamlessly for your brand today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg text-lg"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
