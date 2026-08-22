import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import {
  Zap, Calendar, Shield, BarChart3, PenTool, TrendingUp,
  Package, Download, Activity, ArrowRight, Check
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      <PublicNavbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="bg-brand-navy text-white pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-green-light text-sm font-bold tracking-wider uppercase mb-4">AI-Powered Marketing</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-6">
                Stop guessing what to post. Let AI plan your marketing day.
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                MarketPilot AI analyzes your products, tracks trends, and generates ready-to-publish content — so you can focus on growing your brand.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/50 flex-1 max-w-xs"
                />
                <Link
                  to="/signup"
                  className="bg-brand-green hover:bg-brand-green-dark text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg inline-flex items-center gap-2"
                >
                  Get Started Free <ArrowRight size={16} />
                </Link>
              </div>
              <p className="text-gray-500 text-xs">Free to start · No credit card required</p>
            </div>

            {/* Mini Dashboard Preview Card */}
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse"></div>
                  <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">Today's Priority</span>
                </div>
                <h3 className="text-brand-ink font-display font-bold text-lg mb-1">2-in-1 Hair Remover</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-brand-pale text-brand-green text-xs font-bold px-2.5 py-1 rounded-lg">78.7% margin</span>
                  <span className="text-gray-400 text-xs">650 in stock</span>
                </div>
                <div className="flex items-end gap-2 h-16 mb-4">
                  <div className="flex-1 bg-brand-green/20 rounded-t-lg" style={{ height: '60%' }}></div>
                  <div className="flex-1 bg-brand-green/40 rounded-t-lg" style={{ height: '80%' }}></div>
                  <div className="flex-1 bg-brand-green rounded-t-lg" style={{ height: '100%' }}></div>
                  <div className="flex-1 bg-brand-green/60 rounded-t-lg" style={{ height: '70%' }}></div>
                  <div className="flex-1 bg-brand-green/30 rounded-t-lg" style={{ height: '50%' }}></div>
                  <div className="flex-1 bg-brand-green/70 rounded-t-lg" style={{ height: '90%' }}></div>
                  <div className="flex-1 bg-brand-green/50 rounded-t-lg" style={{ height: '65%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div><span className="text-xs text-gray-400">Organic</span><p className="text-sm font-bold text-brand-ink">60%</p></div>
                    <div><span className="text-xs text-gray-400">Paid</span><p className="text-sm font-bold text-brand-ink">40%</p></div>
                  </div>
                  <span className="text-brand-green text-xs font-bold flex items-center gap-1 cursor-pointer">
                    Generate Strategy <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section className="bg-white border-y border-brand-line py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { num: '57%', label: 'Time Saved on Content Planning' },
            { num: '3.4K', label: 'AI-Generated Posts This Month' },
            { num: '111', label: 'Active Brands Using MarketPilot' },
          ].map((s) => (
            <div key={s.num}>
              <p className="text-3xl font-display font-extrabold text-brand-green mb-1">{s.num}</p>
              <p className="text-sm text-brand-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURE INTRO ═══════════════════ */}
      <section className="bg-brand-canvas py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">
              Marketing automation that never misses a beat
            </h2>
            <p className="text-brand-muted max-w-2xl mx-auto">
              From product analysis to published content — one intelligent pipeline.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap size={28} />, title: 'AI Strategy Engine', desc: 'Analyzes margins, trends, and inventory to build 4-pillar campaigns automatically.' },
              { icon: <Calendar size={28} />, title: 'Smart Editorial Calendar', desc: 'Distributes content across 7 or 30 days with balanced organic and paid cadence.' },
              { icon: <Shield size={28} />, title: 'Brand Safety Guardrails', desc: 'Enforces tone of voice rules, blocks prohibited words, and fact-checks against your catalogue.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-brand-line shadow-card p-8 hover:shadow-soft transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-pale text-brand-green grid place-items-center mb-5">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-brand-ink mb-2">{f.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ DASHBOARD PREVIEW ═══════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">
              A dashboard for modern marketing — not just data, it's a plan
            </h2>
          </div>
          <div className="bg-brand-canvas rounded-2xl border border-brand-line p-6 md:p-8 max-w-4xl mx-auto">
            <div className="flex gap-2 mb-6">
              <button className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-lg">Analytics</button>
              <button className="bg-white text-brand-muted text-xs font-bold px-4 py-2 rounded-lg border border-brand-line">Content</button>
              <button className="bg-white text-brand-muted text-xs font-bold px-4 py-2 rounded-lg border border-brand-line">Schedule</button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Posts Generated', val: '24' },
                { label: 'Avg. Engagement', val: '4.2%' },
                { label: 'Content Score', val: '87/100' },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-brand-line p-4">
                  <p className="text-[10px] text-brand-muted uppercase font-bold mb-1">{m.label}</p>
                  <p className="text-xl font-display font-extrabold text-brand-ink">{m.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { title: 'Peach Fuzz Removal Reel', platform: 'TikTok', status: 'Published', color: 'bg-green-100 text-green-700' },
                { title: 'Salon vs At-Home Comparison', platform: 'Instagram', status: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
                { title: 'Eyebrow Shaping Carousel', platform: 'Facebook', status: 'Draft', color: 'bg-gray-100 text-gray-600' },
              ].map((r) => (
                <div key={r.title} className="bg-white rounded-xl border border-brand-line p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">{r.title}</p>
                    <p className="text-xs text-brand-muted">{r.platform}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${r.color}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMPLETE TOOLKIT ═══════════════════ */}
      <section className="bg-brand-canvas py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">
              A complete toolkit designed for modern marketers
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Zap size={24} />, title: 'AI Strategy Planner', desc: 'Formulate 4-pillar campaigns with margin-aware hero product selection.' },
              { icon: <PenTool size={24} />, title: 'Content Studio', desc: '5-format copywriting: posts, carousels, video scripts, emails, WhatsApp.' },
              { icon: <Calendar size={24} />, title: 'Editorial Calendar', desc: 'Auto-distribute content across 7 or 30 days with balanced cadence.' },
              { icon: <TrendingUp size={24} />, title: 'Trend Radar', desc: 'Real-time social signal scanning with verified source URLs and confidence scoring.' },
              { icon: <Package size={24} />, title: 'Product Intelligence', desc: 'Margin calculation, stock monitoring, and hero product prioritization.' },
              { icon: <Download size={24} />, title: 'Export Center', desc: 'Download strategies as Markdown, CSV, HTML, or full JSON workspace backup.' },
            ].map((t) => (
              <div key={t.title} className="bg-white rounded-2xl border border-brand-line p-6 hover:shadow-soft transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-brand-pale text-brand-green grid place-items-center mb-4">
                  {t.icon}
                </div>
                <h3 className="font-display font-bold text-brand-ink mb-2">{t.title}</h3>
                <p className="text-sm text-brand-muted">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRACKING CTA BANNER ═══════════════════ */}
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-extrabold mb-3">What your team is tracking, daily</h2>
            <p className="text-gray-400 max-w-xl mx-auto">See content performance and upcoming deadlines at a glance.</p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-5 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
              <div key={d} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-3 text-center">{d}</p>
                <div className="space-y-2">
                  {i % 2 === 0 && <div className="h-2 rounded-full bg-brand-green/60"></div>}
                  <div className="h-2 rounded-full bg-brand-blue/50"></div>
                  {i % 3 === 0 && <div className="h-2 rounded-full bg-brand-green"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CALENDAR DEMO ═══════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">Planning, day by day</h2>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={d} className="bg-brand-canvas rounded-xl p-3 border border-brand-line min-h-[120px]">
                <p className="text-[10px] font-bold text-brand-muted mb-2 text-center">{d}</p>
                {i === 0 && (
                  <>
                    <div className="bg-brand-green/10 border-l-2 border-brand-green rounded p-1.5 mb-1.5">
                      <p className="text-[9px] font-bold text-brand-green">TikTok Reel</p>
                      <p className="text-[8px] text-brand-muted">9:00 AM</p>
                    </div>
                    <div className="bg-blue-50 border-l-2 border-brand-blue rounded p-1.5">
                      <p className="text-[9px] font-bold text-brand-blue">IG Carousel</p>
                      <p className="text-[8px] text-brand-muted">2:00 PM</p>
                    </div>
                  </>
                )}
                {i === 1 && (
                  <div className="bg-purple-50 border-l-2 border-purple-400 rounded p-1.5">
                    <p className="text-[9px] font-bold text-purple-600">Email Newsletter</p>
                    <p className="text-[8px] text-brand-muted">10:00 AM</p>
                  </div>
                )}
                {i === 2 && (
                  <div className="bg-brand-green/10 border-l-2 border-brand-green rounded p-1.5">
                    <p className="text-[9px] font-bold text-brand-green">FB Ad</p>
                    <p className="text-[8px] text-brand-muted">11:00 AM</p>
                  </div>
                )}
                {i === 3 && (
                  <>
                    <div className="bg-blue-50 border-l-2 border-brand-blue rounded p-1.5 mb-1.5">
                      <p className="text-[9px] font-bold text-brand-blue">IG Story</p>
                      <p className="text-[8px] text-brand-muted">8:00 AM</p>
                    </div>
                    <div className="bg-brand-green/10 border-l-2 border-brand-green rounded p-1.5">
                      <p className="text-[9px] font-bold text-brand-green">TikTok Reel</p>
                      <p className="text-[8px] text-brand-muted">4:00 PM</p>
                    </div>
                  </>
                )}
                {i === 4 && (
                  <div className="bg-orange-50 border-l-2 border-orange-400 rounded p-1.5">
                    <p className="text-[9px] font-bold text-orange-600">WhatsApp Blast</p>
                    <p className="text-[8px] text-brand-muted">12:00 PM</p>
                  </div>
                )}
                {i === 5 && (
                  <div className="bg-brand-green/10 border-l-2 border-brand-green rounded p-1.5">
                    <p className="text-[9px] font-bold text-brand-green">Recap Post</p>
                    <p className="text-[8px] text-brand-muted">10:00 AM</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ GROWTH FEATURES ═══════════════════ */}
      <section className="bg-brand-canvas py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">Built to grow with brands</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-5">
            {[
              'Multi-format content generation (posts, carousels, video scripts, emails)',
              'Margin-aware product prioritization for maximum ROAS',
              'Real-time trend signal integration from TikTok, Instagram, and Facebook',
              'One-click export to CSV, Markdown, HTML, and JSON',
            ].map((feat) => (
              <div key={feat} className="flex items-start gap-4 bg-white rounded-xl border border-brand-line p-5">
                <div className="w-8 h-8 rounded-lg bg-brand-pale text-brand-green grid place-items-center flex-shrink-0 mt-0.5">
                  <Check size={16} strokeWidth={3} />
                </div>
                <p className="text-brand-ink font-medium">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING SECTION ═══════════════════ */}
      <section id="pricing" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-brand-ink mb-3">Simple, clear pricing</h2>
            <p className="text-brand-muted">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-brand-line p-8 flex flex-col">
              <h3 className="font-display font-bold text-xl text-brand-ink mb-1">Free</h3>
              <p className="text-brand-muted text-sm mb-4">For solo creators</p>
              <p className="text-4xl font-display font-extrabold text-brand-ink mb-6">$0<span className="text-base font-normal text-brand-muted">/mo</span></p>
              <ul className="space-y-3 mb-8 flex-1">
                {['1 product', '5 posts per month', 'Basic strategy', 'Community support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-ink"><Check size={14} className="text-brand-green" />{f}</li>
                ))}
              </ul>
              <Link to="/signup" className="block text-center border-2 border-brand-line text-brand-ink font-bold py-3 rounded-xl hover:bg-brand-canvas transition">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="bg-brand-pale rounded-2xl border-2 border-brand-green p-8 flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>
              <h3 className="font-display font-bold text-xl text-brand-ink mb-1">Pro</h3>
              <p className="text-brand-muted text-sm mb-4">For growing brands</p>
              <p className="text-4xl font-display font-extrabold text-brand-ink mb-6">$49<span className="text-base font-normal text-brand-muted">/mo</span></p>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited products', 'Unlimited posts', '4-pillar strategy engine', 'Trend radar', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-ink"><Check size={14} className="text-brand-green" />{f}</li>
                ))}
              </ul>
              <Link to="/signup" className="block text-center bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-dark transition">Get Started</Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl border border-brand-line p-8 flex flex-col">
              <h3 className="font-display font-bold text-xl text-brand-ink mb-1">Enterprise</h3>
              <p className="text-brand-muted text-sm mb-4">For agencies & teams</p>
              <p className="text-4xl font-display font-extrabold text-brand-ink mb-6">Custom</p>
              <ul className="space-y-3 mb-8 flex-1">
                {['Multi-workspace', 'API access', 'Custom integrations', 'Dedicated support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-ink"><Check size={14} className="text-brand-green" />{f}</li>
                ))}
              </ul>
              <a href="#" className="block text-center border-2 border-brand-line text-brand-ink font-bold py-3 rounded-xl hover:bg-brand-canvas transition">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="bg-gradient-to-br from-brand-navy to-[#0f2b1a] text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4">
            Start every marketing day with a clear plan.
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join hundreds of brands using MarketPilot AI to plan, create, and publish content faster than ever.
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
