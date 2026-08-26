import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Coins } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

export const CurrencySelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currency, setCurrency, currencyConfig } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border border-brand-line bg-white hover:bg-slate-50 transition-all font-bold text-xs text-brand-ink shadow-sm ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        }`}
        title={`Current currency: ${currencyConfig.name}`}
      >
        <span className="text-sm">{currencyConfig.flag}</span>
        <span className="font-extrabold">{currencyConfig.code}</span>
        <span className="text-slate-400 text-[10px]">({currencyConfig.symbol})</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white border border-brand-line shadow-xl z-50 py-2 animate-fadeIn">
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <small className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Coins size={11} className="text-brand-green" /> Select Currency
            </small>
            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Active: {currencyConfig.code}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {Object.values(SUPPORTED_CURRENCIES).map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-extrabold'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{c.flag}</span>
                    <div>
                      <b className="block text-xs leading-none mb-0.5">
                        {c.code} <span className="font-normal text-slate-400">({c.symbol})</span>
                      </b>
                      <small className="text-[10px] text-slate-500 leading-none">{c.name}</small>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-700" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
