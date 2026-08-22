import React from 'react';
import {
  LayoutDashboard,
  Package,
  Palette,
  TrendingUp,
  Sparkles,
  Calendar as CalendarIcon,
  PenTool,
  FileText,
  BarChart3,
  BookOpen,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  businessName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  isOpen,
  setIsOpen,
  businessName,
}) => {
  const navItems = [
    { section: 'WORKSPACE' },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'brand', label: 'Brand Kit', icon: Palette },
    { section: 'PLAN & CREATE' },
    { id: 'trends', label: 'Trend Intelligence', icon: TrendingUp },
    { id: 'planner', label: 'AI Planner', icon: Sparkles },
    { id: 'calendar', label: 'Content Calendar', icon: CalendarIcon },
    { id: 'studio', label: 'Content Studio', icon: PenTool },
    { id: 'briefs', label: 'Campaign Briefs', icon: FileText },
    { section: 'LEARN & EXPORT' },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'library', label: 'Content Library & Exports', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`w-[255px] bg-white border-r border-brand-line p-5 flex flex-col fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActivePage('overview');
          }}
          className="flex items-center gap-2 text-[17px] font-display font-bold text-brand-ink pb-5 px-2 tracking-tight"
        >
          <span className="grid place-items-center bg-brand-green text-white rounded-md w-[26px] height-[26px] h-[26px] font-bold text-sm">
            ⌁
          </span>
          MarketPilot <b className="text-brand-green">AI</b>
        </a>

        {/* Workspace Card */}
        <div className="border border-brand-line rounded-[10px] p-2.5 flex items-center gap-2.5 mb-5 bg-white">
          <span className="w-7 h-7 grid place-items-center rounded-lg bg-emerald-100 text-brand-green font-extrabold text-xs">
            {businessName ? businessName[0].toUpperCase() : 'M'}
          </span>
          <div className="min-w-0 flex-1">
            <small className="block text-[8px] text-brand-muted tracking-wider font-extrabold uppercase">
              WORKSPACE
            </small>
            <b className="block text-[11px] font-bold truncate text-brand-ink">
              {businessName || 'Luna Bags'}
            </b>
          </div>
          <button className="text-brand-muted hover:text-brand-ink">
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <p
                  key={idx}
                  className="text-[9px] font-extrabold text-slate-400 tracking-wider px-2 pt-4 pb-1.5 uppercase"
                >
                  {item.section}
                </p>
              );
            }

            const Icon = item.icon!;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id!);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors ${
                  isActive
                    ? 'text-brand-green bg-brand-pale font-extrabold'
                    : 'text-slate-500 hover:text-brand-green hover:bg-slate-50'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-brand-green' : 'text-slate-400'} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick-start Help */}
        <div className="mt-auto bg-[#f3f7f4] rounded-[10px] p-2.5 flex items-center gap-2.5">
          <b className="grid place-items-center bg-brand-green text-white w-5 h-5 rounded-full text-[10px] font-bold">
            ?
          </b>
          <div className="text-[9px] leading-tight">
            <strong className="block text-brand-ink font-bold">Need help?</strong>
            <small className="text-brand-muted">Explore the quick-start guide.</small>
          </div>
        </div>
      </aside>
    </>
  );
};
