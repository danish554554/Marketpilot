import React, { useState } from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Mail, MessageSquare, Send, CheckCircle2, Building2, Users, DollarSign, Shield } from 'lucide-react';

export function ContactSalesPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    companyName: '',
    teamSize: '5-15',
    monthlyAdSpend: '$5,000 - $25,000',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="bg-brand-green/20 text-brand-green-light text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-3">
            ENTERPRISE & AGENCY SOLUTIONS
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            Scale Your E-Commerce Marketing with MarketPilot AI
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Custom multi-workspace setups, dedicated strategy architects, white-label exports, and private LLM fine-tuning for high-growth brands.
          </p>
        </div>
      </section>

      {/* Contact Form & Benefits Section */}
      <section className="py-16 flex-1">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-brand-line rounded-2xl p-8 shadow-card">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-brand-green rounded-full grid place-items-center mx-auto text-2xl">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-display font-bold text-brand-ink">Inquiry Received!</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Thank you, <strong>{formData.fullName}</strong>. Our enterprise team has received your request for <strong>{formData.companyName}</strong> and will reach out within 2 hours with a tailored proposal.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold text-brand-green hover:underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-brand-line pb-4 mb-4">
                  <h2 className="text-xl font-display font-bold text-brand-ink">Speak with our Enterprise Team</h2>
                  <p className="text-xs text-slate-500 mt-1">Fill in your details and we’ll schedule a live demo tailored to your catalog.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Sarah Jenkins"
                      className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.workEmail}
                      onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                      placeholder="sarah@brand.com"
                      className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="GlowSilk Beauty"
                      className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team Size</label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-white"
                    >
                      <option value="1-5">1 - 5 team members</option>
                      <option value="5-15">5 - 15 team members</option>
                      <option value="15-50">15 - 50 team members</option>
                      <option value="50+">50+ Enterprise team</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Monthly Ad Spend</label>
                  <select
                    value={formData.monthlyAdSpend}
                    onChange={(e) => setFormData({ ...formData, monthlyAdSpend: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-white"
                  >
                    <option value="Under $5,000">Under $5,000 / month</option>
                    <option value="$5,000 - $25,000">$5,000 - $25,000 / month</option>
                    <option value="$25,000 - $100,000">$25,000 - $100,000 / month</option>
                    <option value="$100,000+">$100,000+ / month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tell us about your brand goals</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="We manage 40+ SKUs across TikTok Shop and Meta ads and want automated margin-aware campaigns..."
                    className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-green hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? 'Submitting Inquiry...' : 'Submit Enterprise Inquiry'}
                  <Send size={13} />
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Trust & Highlights (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-lg text-brand-ink">What's included in Enterprise?</h3>
              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Building2 size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>Multi-Workspace Architecture:</strong> Manage multiple storefronts or client brands under one unified master dashboard.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Users size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>Dedicated Growth Strategist:</strong> 1-on-1 monthly onboarding and campaign review sessions with our marketing engineers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Shield size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>Custom Brand Guardrails:</strong> Strictly enforce compliance, brand voice, FTC disclosures, and medical claim sanitization.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <DollarSign size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <span><strong>High-Volume API Access:</strong> Ingest bulk product feeds and export scheduled posts directly to your publishing queue.</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <Mail size={16} className="text-emerald-700" /> Need immediate support?
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed m-0">
                You can also email our executive team directly at <a href="mailto:sales@marketpilot.ai" className="font-bold underline">sales@marketpilot.ai</a> or reach our customer desk via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
