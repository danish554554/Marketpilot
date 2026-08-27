import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Check, Minus, ChevronDown, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'For solo creators',
    features: ['1 product', '5 posts per month', 'Basic strategy', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    desc: 'For growing brands',
    features: ['Unlimited products', 'Unlimited posts', '4-pillar strategy engine', 'Trend radar', 'Content Studio (all 5 formats)', 'Editorial calendar', 'Brand Kit guardrails', 'Export center', 'Priority support'],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For agencies & teams',
    features: ['Everything in Pro', 'Multi-workspace', 'API access', 'Custom integrations', 'White-label exports', 'Dedicated account manager'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const comparisonFeatures = [
  { name: 'Products', free: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'AI Posts / Month', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Strategy Engine', free: 'Basic', pro: '4-Pillar', enterprise: '4-Pillar + Custom' },
  { name: 'Trend Radar', free: false, pro: true, enterprise: true },
  { name: 'Content Studio', free: 'Captions only', pro: 'All 5 formats', enterprise: 'All 5 formats' },
  { name: 'Editorial Calendar', free: false, pro: true, enterprise: true },
  { name: 'Brand Kit Guardrails', free: false, pro: true, enterprise: true },
  { name: 'Export Center', free: false, pro: true, enterprise: true },
  { name: 'Multi-workspace', free: false, pro: false, enterprise: true },
  { name: 'API Access', free: false, pro: false, enterprise: true },
  { name: 'Support', free: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
];

const faqs = [
  { q: 'Can I try MarketPilot AI for free?', a: 'Yes! Our Free plan lets you add 1 product and generate up to 5 AI posts per month with no credit card required. Upgrade anytime when you need more.' },
  { q: 'What happens when I exceed the free plan limits?', a: 'You\'ll be prompted to upgrade to the Pro plan. Your existing data and content will be preserved — nothing is lost.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Absolutely. You can cancel your Pro subscription at any time from your account settings. You\'ll retain access until the end of your billing period.' },
  { q: 'Do you offer a refund policy?', a: 'We offer a 14-day money-back guarantee on Pro plans. If you\'re not satisfied, contact support for a full refund.' },
  { q: 'Is my data secure?', a: 'Yes. All data is encrypted in transit (TLS 1.3) and at rest. We use Supabase with row-level security policies to ensure workspace isolation.' },
];

export function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-brand-canvas">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg">Start free. Upgrade when you're ready to scale.</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlight
                  ? 'bg-brand-pale border-2 border-brand-green'
                  : 'bg-white border border-brand-line'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <h3 className="font-display font-bold text-xl text-brand-ink mb-1">{plan.name}</h3>
              <p className="text-brand-muted text-sm mb-4">{plan.desc}</p>
              <p className="text-4xl font-display font-extrabold text-brand-ink mb-6">
                {plan.price}<span className="text-base font-normal text-brand-muted">{plan.period}</span>
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-ink">
                    <Check size={14} className="text-brand-green flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {plan.name === 'Enterprise' ? (
                <Link
                  to="/contact"
                  className="block text-center border-2 border-brand-line text-brand-ink font-bold py-3 rounded-xl hover:bg-brand-canvas transition"
                >
                  {plan.cta}
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className={`block text-center font-bold py-3 rounded-xl transition ${
                    plan.highlight
                      ? 'bg-brand-green text-white hover:bg-brand-green-dark'
                      : 'border-2 border-brand-line text-brand-ink hover:bg-brand-canvas'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-brand-ink text-center mb-10">Feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-line">
                  <th className="text-left py-3 px-4 text-brand-muted font-bold">Feature</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-bold">Free</th>
                  <th className="text-center py-3 px-4 text-brand-green font-bold">Pro</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-brand-line/50">
                    <td className="py-3 px-4 text-brand-ink font-medium">{row.name}</td>
                    {[row.free, row.pro, row.enterprise].map((val, i) => (
                      <td key={i} className="text-center py-3 px-4">
                        {val === true ? <Check size={16} className="text-brand-green mx-auto" /> :
                         val === false ? <Minus size={16} className="text-gray-300 mx-auto" /> :
                         <span className="text-brand-ink text-xs">{val}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-brand-canvas py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-brand-ink text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-brand-line overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold text-brand-ink">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-brand-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-brand-muted leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-extrabold mb-4">Ready to scale your marketing?</h2>
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
