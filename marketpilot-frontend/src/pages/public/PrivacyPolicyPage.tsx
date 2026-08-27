import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { ShieldCheck, Lock, Eye, Database, Server } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="bg-brand-green/20 text-brand-green-light text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-3">
            LEGAL & PRIVACY
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-sm md:text-base">Last updated: August 26, 2026 · Effective immediately</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 bg-white border border-brand-line rounded-2xl p-8 md:p-12 shadow-card space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-brand-ink">1. Commitment to Privacy & Workspace Isolation</h2>
            <p>
              At <strong>MarketPilot AI</strong> ("we", "our", or "us"), we prioritize the absolute security and privacy of your e-commerce catalogue, brand guidelines, and proprietary marketing data. All workspace data is isolated using strict PostgreSQL Row-Level Security (RLS) policies.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-brand-ink">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Account Credentials:</strong> Email, encrypted password hashes, full name, and business name.</li>
              <li><strong>E-Commerce Catalogue:</strong> Product names, cost prices, retail prices, features, and pain points used solely for grounding AI marketing plans.</li>
              <li><strong>Brand Kit Guidelines:</strong> Brand voice adjectives, primary color codes, and prohibited words list.</li>
              <li><strong>Payment & Billing Data:</strong> Processed securely via PCI-DSS compliant third-party payment gateways. We never store raw credit card numbers.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-brand-ink">3. AI Data Processing & Zero-Training Guarantee</h2>
            <p>
              We utilize enterprise Google Gemini API services. <strong>Your proprietary product data and custom Brand Kit copy are never used to train public foundational AI models.</strong> All data sent to AI model endpoints is ephemeral and used strictly to generate requested scripts and campaign recommendations.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-brand-ink">4. Data Retention & Deletion Rights</h2>
            <p>
              You retain 100% ownership of your catalogue, marketing plans, and generated content. You can request a complete export of your workspace backup or permanently delete your account and all associated data at any time from your account settings.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-brand-ink">5. Contact Our Data Protection Officer</h2>
            <p>
              If you have any questions or data access requests under GDPR or CCPA, contact our privacy compliance team at <a href="mailto:privacy@marketpilot.ai" className="text-brand-green font-bold underline">privacy@marketpilot.ai</a>.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
