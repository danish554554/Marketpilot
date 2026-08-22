import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Package, Palette, Sparkles, Send, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: <Package size={32} />,
    title: 'Add Your Products',
    desc: 'Upload your product catalogue with retail prices, cost prices, features, and customer pain points. The AI instantly calculates profit margins and classifies each product into margin tiers.',
    details: ['Enter product name, SKU, prices, and stock quantity', 'List key features and customer pain points the product solves', 'Automatic margin calculation and tier classification (High / Medium / Low)', 'Hero product auto-selection based on margin + stock velocity'],
  },
  {
    num: '02',
    icon: <Palette size={32} />,
    title: 'Configure Your Brand Voice',
    desc: 'Set your brand personality, prohibited language, and approved CTAs in the Brand Kit. The AI will enforce these rules across every piece of generated content.',
    details: ['Add tone of voice tags (e.g., Empowering, Clean, Relatable)', 'Define prohibited words the AI must never use', 'Set approved call-to-action examples for consistent conversion language', 'Configure primary brand color for visual consistency'],
  },
  {
    num: '03',
    icon: <Sparkles size={32} />,
    title: 'Generate Your Strategy',
    desc: 'Click one button and the AI Strategy Engine builds a complete 4-pillar marketing campaign with budget allocation, content formats, and creative angles.',
    details: ['AI selects hero products based on margin and stock data', 'Formulates 4 campaign pillars: Awareness, Acquisition, Trend Velocity, Retention', 'Allocates budget between organic and paid channels', 'Generates hooks, CTAs, and platform-specific creative angles'],
  },
  {
    num: '04',
    icon: <Send size={32} />,
    title: 'Publish & Track',
    desc: 'Export production-ready content in any format — social captions, video scripts, email newsletters, CSV handoff sheets — and track performance to feed the AI learning loop.',
    details: ['Copy text with one click or download as Markdown, CSV, HTML, or JSON', 'Distribute content across a 7-day or 30-day editorial calendar', 'Log performance results to improve future AI recommendations', 'Download full workspace backup for data portability'],
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">How MarketPilot AI works</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From setup to published content in 4 simple steps. No marketing degree required.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex flex-col md:flex-row items-center gap-12 mb-24 last:mb-0 ${
                i % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Text Side */}
              <div className="flex-1">
                <span className="text-6xl font-display font-extrabold text-brand-pale block mb-4">
                  {step.num}
                </span>
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-brand-muted leading-relaxed mb-5">{step.desc}</p>
                <ul className="space-y-2.5">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-brand-ink">
                      <span className="text-brand-green mt-0.5 font-bold">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Side */}
              <div className="flex-1 w-full">
                <div className="bg-brand-pale rounded-2xl p-10 flex items-center justify-center min-h-[280px]">
                  <div className="w-24 h-24 rounded-2xl bg-brand-green/10 text-brand-green grid place-items-center">
                    {step.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connection Line Visual */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-extrabold text-brand-ink mb-3">The complete pipeline</h2>
            <p className="text-brand-muted">Every step feeds into the next, creating a continuous improvement loop.</p>
          </div>
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {['Products', 'Brand Kit', 'Strategy', 'Publish'].map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full grid place-items-center text-white font-display font-extrabold ${
                    i === 2 ? 'bg-brand-green' : 'bg-brand-navy'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-xs font-bold text-brand-ink mt-2">{label}</span>
                </div>
                {i < 3 && (
                  <div className="flex-1 h-0.5 bg-brand-line mx-2"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-brand-navy to-[#0f2b1a] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-extrabold mb-4">Ready to see it in action?</h2>
          <p className="text-gray-400 mb-8">Create your free account and generate your first AI strategy in under 5 minutes.</p>
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
