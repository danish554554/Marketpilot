import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sparkles, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencySelector } from './CurrencySelector';

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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-[64px] sm:h-[74px] sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-brand-line px-3.5 sm:px-5 md:px-10 flex items-center justify-between w-full max-w-full overflow-x-hidden">
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
        {/* Currency Switcher */}
        <CurrencySelector />

        <button className="text-slate-400 hover:text-slate-700 p-2 rounded-lg transition-colors hidden sm:block">
          <Bell size={18} />
        </button>

        {/* User Avatar / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-0.5 sm:p-1 rounded-full hover:bg-slate-50 transition-colors"
            title={isLoggedIn && userEmail ? `Logged in as ${userEmail}` : 'Account'}
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e9e1d7] text-[#7c5637] text-xs font-extrabold grid place-items-center">
              {isLoggedIn && userEmail ? userEmail[0].toUpperCase() : <User size={13} />}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 sm:top-12 bg-white border border-brand-line rounded-xl shadow-soft py-2 w-52 z-50">
              {isLoggedIn && userEmail && (
                <div className="px-4 py-2 border-b border-brand-line">
                  <p className="text-xs font-bold text-brand-ink truncate">{userEmail}</p>
                  <p className="text-[10px] text-brand-muted">Logged in</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                Log out
              </button>
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
