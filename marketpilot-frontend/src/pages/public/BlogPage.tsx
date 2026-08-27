import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Sparkles, Calendar, Clock, ArrowRight, TrendingUp, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const articles = [
  {
    id: 1,
    title: 'The 2026 Direct-to-Consumer Marketing Playbook: Moving from Fluff to Margins',
    excerpt: 'Why customer acquisition cost (CAC) is soaring and how modern e-commerce founders are restructuring their campaign pillars to focus purely on high-margin hero SKUs.',
    category: 'Strategy & Unit Economics',
    readTime: '6 min read',
    date: 'August 24, 2026',
    author: 'MarketPilot Research Team',
  },
  {
    id: 2,
    title: 'How to Turn Real-Time Google & TikTok Trends into High-Converting Ad Angles in 60 Seconds',
    excerpt: 'A step-by-step breakdown of how live search momentum and viral hashtags can be injected directly into 3-second split screen video scripts with zero guesswork.',
    category: 'Trend Intelligence',
    readTime: '5 min read',
    date: 'August 20, 2026',
    author: 'Growth Engineering Desk',
  },
  {
    id: 3,
    title: 'Brand Guardrails: Why Prohibiting Medical Claims and Miracle Language Protects Your ROAS',
    excerpt: 'An analysis of Meta and TikTok ad account suspensions in 2026 and how automated Brand Kit guardrails sanitize copy before it reaches ad reviewers.',
    category: 'Compliance & Guardrails',
    readTime: '4 min read',
    date: 'August 16, 2026',
    author: 'AI Safety & Policy',
  },
  {
    id: 4,
    title: 'The Multi-Currency E-Commerce Boom: Scaling Local Brands to Pakistan, UAE, and Beyond',
    excerpt: 'How localized pricing in PKR, AED, SAR, and USD unlocks higher checkout conversion rates for emerging direct-to-consumer lifestyle and beauty brands.',
    category: 'Global E-Commerce',
    readTime: '7 min read',
    date: 'August 12, 2026',
    author: 'MarketPilot Global Ops',
  },
];

export function BlogPage() {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="bg-brand-green/20 text-brand-green-light text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-3">
            MARKETPILOT AI BLOG & INSIGHTS
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            E-Commerce Growth & AI Marketing Strategies
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Practical playbooks, algorithmic trend breakdowns, and margin-first marketing frameworks from our engineering and marketing teams.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 flex-1">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col justify-between hover:shadow-soft transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                      {article.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={11} /> {article.readTime}
                    </span>
                  </div>

                  <h2 className="text-lg font-display font-bold text-brand-ink hover:text-brand-green transition-colors leading-snug">
                    {article.title}
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{article.date}</span>
                  <Link
                    to="/signup"
                    className="font-bold text-brand-green hover:underline flex items-center gap-1"
                  >
                    <span>Read Strategy</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
