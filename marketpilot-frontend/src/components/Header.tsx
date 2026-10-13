import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sparkles, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencySelector } from './CurrencySelector';
import { getIndustryProfile, PRESET_INDUSTRIES } from '../utils/industry';

interface HeaderProps {
  activePage: string;
  onMenuToggle: () => void;
  onOpenGenerateModal: () => void;
  onOpenAuthModal: () => void;
  userEmail?: string;
  isLoggedIn: boolean;
}

const pageTitles: Record<string, { title: string; kicker: string }> = {
  overview: { title: 'Overview', kicker: 'WORKSPACE' },
  products: { title: 'Products Catalogue', kicker: 'WORKSPACE' },
  brand: { title: 'Brand Kit', kicker: 'WORKSPACE' },
  trends: { title: 'Trend Intelligence', kicker: 'PLAN & CREATE' },
  planner: { title: 'AI Strategy Planner', kicker: 'PLAN & CREATE' },
  calendar: { title: 'Content Calendar', kicker: 'PLAN & CREATE' },
  studio: { title: 'Content Studio', kicker: 'PLAN & CREATE' },
  briefs: { title: 'Campaign Briefs', kicker: 'PLAN & CREATE' },
  performance: { title: 'Performance Tracking', kicker: 'LEARN & EXPORT' },
  library: { title: 'Content Library & Exports', kicker: 'LEARN & EXPORT' },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onMenuToggle,
  onOpenGenerateModal,
  onOpenAuthModal,
  userEmail,
  isLoggedIn,
}) => {
  const current = pageTitles[activePage] || { title: 'MarketPilot AI', kicker: 'WORKSPACE' };
  const { logout, industry, setIndustry } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showIndustryMenu, setShowIndustryMenu] = useState(false);
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const industryMenuRef = useRef<HTMLDivElement>(null);

  const activeProfile = getIndustryProfile(industry);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (industryMenuRef.current && !industryMenuRef.current.contains(event.target as Node)) {
        setShowIndustryMenu(false);
        setIsCustomMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/');
  };

  const handleSelectIndustry = (indId: string) => {
    setIndustry(indId);
    setShowIndustryMenu(false);
    setIsCustomMode(false);
  };

  const handleSaveCustomIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIndustryInput.trim()) return;
    setIndustry(customIndustryInput.trim());
    setCustomIndustryInput('');
    setIsCustomMode(false);
    setShowIndustryMenu(false);
  };

  return (
    <header className="h-[64px] sm:h-[74px] sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-line px-3.5 sm:px-5 md:px-10 flex items-center justify-between w-full max-w-full">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 -ml-1 shrink-0 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <small className="block text-[8px] sm:text-[9px] font-extrabold tracking-wider text-slate-400 uppercase truncate">
            {current.kicker}
          </small>
          <h3 className="text-sm sm:text-[15px] font-display font-bold text-brand-ink m-0 truncate">
            {current.title}
          </h3>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Industry Switcher */}
        <div className="relative" ref={industryMenuRef}>
          <button
            type="button"
            onClick={() => setShowIndustryMenu(!showIndustryMenu)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50/70 border border-brand-line hover:border-brand-green/40 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-brand-ink transition-all cursor-pointer"
            title="Switch Business Industry / Niche"
          >
            <span>{activeProfile.icon}</span>
            <span className="hidden md:inline max-w-[135px] truncate">{activeProfile.label}</span>
            <span className="text-[9px] text-slate-400">▾</span>
          </button>

          {showIndustryMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-brand-line rounded-2xl shadow-xl p-2 w-72 z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Active Business Industry
                </p>
                <p className="text-xs font-bold text-brand-ink truncate">
                  {activeProfile.icon} {industry}
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                {PRESET_INDUSTRIES.map((ind) => {
                  const isSelected = ind.id.toLowerCase() === industry.toLowerCase();
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => handleSelectIndustry(ind.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-brand-green font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50 font-semibold'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{ind.icon}</span>
                        <span className="truncate">{ind.label}</span>
                      </span>
                      {isSelected && <span className="text-[10px] text-brand-green font-black">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                {!isCustomMode ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-extrabold text-brand-green hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>➕</span>
                    <span>Other (Specify Custom Industry...)</span>
                  </button>
                ) : (
                  <form onSubmit={handleSaveCustomIndustry} className="p-1.5 bg-slate-50 rounded-xl space-y-2">
                    <label className="block text-[10px] font-bold text-slate-600">
                      Enter Any Business Branch / Industry:
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={customIndustryInput}
                      onChange={(e) => setCustomIndustryInput(e.target.value)}
                      placeholder="e.g. Solar Energy, Salon, Real Estate..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-brand-line rounded-lg focus:outline-none focus:border-brand-green"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[10px] font-extrabold bg-brand-green text-white rounded-lg hover:bg-brand-green-dark"
                      >
                        Apply Industry
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <CurrencySelector />

        <button className="text-slate-400 hover:text-slate-700 p-2 rounded-lg transition-colors hidden sm:block">
          <Bell size={18} />
        </button>

        {/* User Avatar / Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title={isLoggedIn && userEmail ? `Logged in as ${userEmail}` : 'Account'}
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e9e1d7] text-[#7c5637] text-xs font-extrabold grid place-items-center shadow-xs">
              {isLoggedIn && userEmail ? userEmail[0].toUpperCase() : <User size={13} />}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-brand-line rounded-2xl shadow-xl py-2 w-56 z-50">
              {isLoggedIn && userEmail && (
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-brand-ink truncate">{userEmail}</p>
                  <p className="text-[10px] text-emerald-700 font-bold truncate mt-0.5">
                    {activeProfile.icon} {industry}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <p className="text-[10px] text-slate-400 font-medium">Logged in</p>
                  </div>
                </div>
              )}
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Generate CTA */}
        <button
          onClick={onOpenGenerateModal}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-[10px] sm:text-[11px] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg shadow-sm flex items-center gap-1 sm:gap-1.5 transition-all"
        >
          <Sparkles size={12} className="shrink-0" />
          <span className="hidden xs:inline sm:inline">✦ Generate</span>
          <span className="inline xs:hidden sm:hidden">Plan</span>
        </button>
      </div>
    </header>
  );
};
