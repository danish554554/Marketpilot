import React, { useState } from 'react';
import { X, Sparkles, Clock, Calendar } from 'lucide-react';

interface GeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (timeframe: 'weekly' | 'monthly') => void;
  isGenerating: boolean;
}

export const GeneratePlanModal: React.FC<GeneratePlanModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-[440px] w-full relative shadow-2xl border border-brand-line">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
        >
          <X size={18} />
        </button>

        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block mb-1">
          GENERATE A PLAN
        </small>
        <h2 className="text-xl font-display font-bold text-brand-ink mb-2">
          Choose your planning window
        </h2>
        <p className="text-[12px] text-slate-500 leading-relaxed mb-5">
          MarketPilot will use your real product margins, brand voice, trend signals, and budget to formulate a grounded strategy.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              timeframe === 'weekly'
                ? 'border-brand-green bg-brand-pale text-brand-green font-bold shadow-sm'
                : 'border-brand-line bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Clock size={13} />
              <span>7-day plan</span>
            </div>
            <span className="block text-[10px] text-slate-500 font-normal">
              Focused weekly action plan
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              timeframe === 'monthly'
                ? 'border-brand-green bg-brand-pale text-brand-green font-bold shadow-sm'
                : 'border-brand-line bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Calendar size={13} />
              <span>30-day plan</span>
            </div>
            <span className="block text-[10px] text-slate-500 font-normal">
              Full monthly strategy
            </span>
          </button>
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={() => onGenerate(timeframe)}
          className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Sparkles size={14} />
          <span>{isGenerating ? 'Synthesizing strategy...' : 'Generate strategy →'}</span>
        </button>
      </div>
    </div>
  );
};
