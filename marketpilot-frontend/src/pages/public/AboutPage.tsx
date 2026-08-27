import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Sparkles, Target, Zap, ShieldCheck, TrendingUp, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="bg-brand-green/20 text-brand-green-light text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-3">
            OUR MISSION & VISION
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            Democratizing Enterprise-Grade Marketing for Modern E-Commerce
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            We empower independent brands, growing direct-to-consumer businesses, and digital founders to plan and execute high-margin marketing with autonomous intelligence.
          </p>
        </div>
      </section>

      {/* Core Story Section */}
      <section className="py-20 flex-1">
        <div className="max-w-5xl mx-auto px-4 space-y-16">
          {/* Mission & Problem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-brand-green uppercase tracking-wider">THE PROBLEM WE SOLVED</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-ink leading-tight">
                Generic AI copy doesn't convert. Grounded margin intelligence does.
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Most AI marketing tools generate fluffy, generic copy disconnected from your real unit economics, actual inventory levels, and live breakout search trends.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                <strong>MarketPilot AI</strong> was engineered from the ground up to unite your <strong>Product Margin Tiers</strong>, <strong>Live Google Trends & TikTok Radar</strong>, and <strong>Brand Voice Guardrails</strong> into one continuous strategic copilot.
              </p>
            </div>

            <div className="bg-white border border-brand-line rounded-2xl p-8 shadow-card space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-brand-green grid place-items-center font-bold text-xl">
                ✦
              </div>
              <h3 className="font-display font-bold text-xl text-brand-ink">Our Core Principles</h3>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Target size={14} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>Margin-Aware:</strong> We never push low-margin products that burn ad spend without profit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp size={14} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>Live Trend Grounding:</strong> Ingest real viral breakout topics from Google Trends and Reddit daily.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>100% Guardrailed:</strong> Zero hallucinated claims, zero prohibited medical words.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-brand-navy text-white rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <b className="font-display font-extrabold text-3xl md:text-4xl text-brand-green-light block mb-1">100%</b>
              <span className="text-xs text-gray-400 font-bold uppercase">Grounded Copy</span>
            </div>
            <div>
              <b className="font-display font-extrabold text-3xl md:text-4xl text-brand-green-light block mb-1">5+</b>
              <span className="text-xs text-gray-400 font-bold uppercase">Channel Formats</span>
            </div>
            <div>
              <b className="font-display font-extrabold text-3xl md:text-4xl text-brand-green-light block mb-1">8</b>
              <span className="text-xs text-gray-400 font-bold uppercase">Global Currencies</span>
            </div>
            <div>
              <b className="font-display font-extrabold text-3xl md:text-4xl text-brand-green-light block mb-1">Gemini 3.6</b>
              <span className="text-xs text-gray-400 font-bold uppercase">AI Architecture</span>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 md:p-12 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-emerald-950">
              Ready to transform how your brand markets?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto">
              Join forward-thinking brand owners who use MarketPilot AI to plan smarter, publish faster, and grow profit margins.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-sm transition-all"
              >
                <span>Get Started Free</span>
                <Sparkles size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
