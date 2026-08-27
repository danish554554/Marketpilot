import React, { useState } from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Sparkles, Briefcase, MapPin, Globe, CheckCircle2, Send, ArrowRight } from 'lucide-react';

const openings = [
  {
    id: 1,
    title: 'Senior AI & LLM Prompt Systems Engineer',
    team: 'AI Architecture',
    location: 'Remote (Global) / Hybrid',
    type: 'Full-Time',
    desc: 'Design and optimize grounded multi-channel copywriting pipelines, fine-tuning structured prompt contexts with Google Gemini 3.6 Flash and Anthropic Claude models.',
  },
  {
    id: 2,
    title: 'Full-Stack React & TypeScript Engineer',
    team: 'Frontend Platform',
    location: 'Remote (Pakistan / Global)',
    type: 'Full-Time',
    desc: 'Build high-performance, real-time reactive dashboards, rich editorial calendar drag-and-drop schedulers, and multi-currency e-commerce interfaces in Vite, React 18, and Tailwind.',
  },
  {
    id: 3,
    title: 'Growth Marketing & D2C Strategist',
    team: 'Marketing Operations',
    location: 'Remote',
    type: 'Full-Time',
    desc: 'Work directly with fast-growing e-commerce brands to codify viral TikTok hooks, Meta ad angles, and profit-margin frameworks into autonomous agent templates.',
  },
];

export function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-brand-navy text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="bg-brand-green/20 text-brand-green-light text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-3">
            JOIN OUR TEAM
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            Build the Future of Autonomous E-Commerce Marketing
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            We are a high-velocity, product-first team building AI marketing infrastructure that drives real sales and unit economics for modern brands.
          </p>
        </div>
      </section>

      {/* Openings Grid */}
      <section className="py-20 flex-1">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          {/* Values Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-2">
              <Globe size={24} className="text-brand-green mx-auto" />
              <h3 className="font-bold text-sm text-brand-ink">Remote-First Culture</h3>
              <p className="text-xs text-slate-500">Work from anywhere with flexible hours and asynchronous communication.</p>
            </div>
            <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-2">
              <Sparkles size={24} className="text-brand-green mx-auto" />
              <h3 className="font-bold text-sm text-brand-ink">Cutting-Edge AI Stack</h3>
              <p className="text-xs text-slate-500">Directly deploy production LLM systems, live trend ingestion, and vector embeddings.</p>
            </div>
            <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-card space-y-2">
              <Briefcase size={24} className="text-brand-green mx-auto" />
              <h3 className="font-bold text-sm text-brand-ink">High Impact & Equity</h3>
              <p className="text-xs text-slate-500">Generous compensation packages, learning stipends, and real ownership in the platform.</p>
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-4">
            <div className="border-b border-brand-line pb-4">
              <h2 className="text-2xl font-display font-bold text-brand-ink">Current Open Roles</h2>
              <p className="text-xs text-slate-500 mt-0.5">Explore open positions across engineering, product, and growth.</p>
            </div>

            {applied ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                <CheckCircle2 size={36} className="text-brand-green mx-auto" />
                <h3 className="font-bold text-lg text-emerald-950">Application Received!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Thank you for applying. Our talent team will review your profile and get back to you within 3 business days.
                </p>
                <button
                  onClick={() => setApplied(false)}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  View other positions
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {openings.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-brand-line rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-green transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {job.team}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin size={11} /> {job.location}
                        </span>
                        <span className="text-[11px] text-brand-green font-bold">
                          ● {job.type}
                        </span>
                      </div>
                      <h3 className="text-base font-display font-bold text-brand-ink">{job.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{job.desc}</p>
                    </div>

                    <a
                      href="mailto:careers@marketpilot.ai?subject=Application for Senior Role"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedJob(job.title);
                        setApplied(true);
                      }}
                      className="px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all text-center self-start md:self-auto shrink-0 inline-flex items-center gap-1.5"
                    >
                      <span>Apply Now</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
