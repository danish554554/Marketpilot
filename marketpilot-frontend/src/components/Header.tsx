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
    <header className="h-[74px] sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-brand-line px-5 md:px-10 flex items-center justify-between">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-slate-800 p-1"
        >
          <Menu size={20} />
        </button>
        <div>
          <small className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            {current.kicker}
          </small>
          <h3 className="text-[15px] font-display font-bold text-brand-ink m-0">
            {current.title}
          </h3>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Currency Switcher */}
        <CurrencySelector />

        <button className="text-slate-400 hover:text-slate-700 p-2 rounded-lg transition-colors hidden sm:block">
          <Bell size={18} />
        </button>

        {/* User Avatar / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors"
            title={isLoggedIn && userEmail ? `Logged in as ${userEmail}` : 'Account'}
          >
            <span className="w-8 h-8 rounded-full bg-[#e9e1d7] text-[#7c5637] text-xs font-extrabold grid place-items-center">
              {isLoggedIn && userEmail ? userEmail[0].toUpperCase() : <User size={14} />}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 bg-white border border-brand-line rounded-xl shadow-soft py-2 w-52 z-50">
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
          className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-[11px] px-3.5 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Sparkles size={13} />
          <span>✦ Generate plan</span>
        </button>
      </div>
    </header>
  );
};
