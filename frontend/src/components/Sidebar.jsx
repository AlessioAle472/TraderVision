import { useState } from 'react';
import {
  LogIn, LogOut, LayoutDashboard, LineChart, Settings,
  MessageSquare, Calendar, Globe, Coins, Radar, BarChart2,
  TrendingUp, ChevronDown, Zap, Bookmark, PieChart, Newspaper
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

// ─── Componente gruppo navigazione con label di sezione ───────────────────────
const NavGroup = ({ label, children }) => (
  <div className="space-y-0.5">
    <p className="px-4 pt-4 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary/40 select-none">
      {label}
    </p>
    {children}
  </div>
);

// ─── Singola voce di navigazione ──────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, onClick, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'
      }`
    }
    onClick={onClick}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span>{label}</span>
  </NavLink>
);

// ─── Componente Sidebar principale ────────────────────────────────────────────
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = (e) => {
    e.preventDefault();
    if (user) {
      logout();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const closeMobile = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface h-screen flex flex-col transform md:relative md:translate-x-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/[0.04]">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <LineChart className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-text leading-none">Trader Vision</h1>
            <p className="text-[9px] text-text-secondary/50 uppercase tracking-wider font-bold mt-0.5">Quant Terminal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Dashboard isolato */}
          <NavItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} onClick={closeMobile} end />

          {/* Gruppo Analisi */}
          <NavGroup label="Analisi">
            <NavItem to="/markets" icon={TrendingUp} label={t('sidebar.markets')} onClick={closeMobile} />
            <NavItem to="/crypto" icon={Coins} label="Crypto" onClick={closeMobile} />
            <NavItem to="/global-macro" icon={Globe} label="Macro Globale" onClick={closeMobile} />
            <NavItem to="/cot" icon={BarChart2} label="COT" onClick={closeMobile} />
            <NavItem to="/watchlist" icon={Bookmark} label="Watchlist" onClick={closeMobile} />
            <NavItem to="/portfolio" icon={PieChart} label="Portafoglio" onClick={closeMobile} />
          </NavGroup>

          {/* Gruppo Strumenti */}
          <NavGroup label="Strumenti">
            <NavItem to="/calendar" icon={Calendar} label="Calendario Economico" onClick={closeMobile} />
            <NavItem to="/osint" icon={Radar} label="Geopolitica OSINT" onClick={closeMobile} />
          </NavGroup>

          {/* Informazione & Community */}
          <NavGroup label="Informazione & Feed">
            <NavItem to="/daily-news" icon={Newspaper} label="Notizie dal Mondo" onClick={closeMobile} />
            <NavItem to="/community" icon={MessageSquare} label={t('sidebar.community')} onClick={closeMobile} />
          </NavGroup>
        </nav>

        {/* Bottom: Upgrade + Settings + Logout */}
        <div className="p-3 space-y-1 border-t border-white/[0.04]">
          {/* Upgrade CTA */}
          <button
            onClick={() => navigate('/pricing')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 group"
          >
            <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" />
            Upgrade Pro
          </button>

          <NavItem to="/settings" icon={Settings} label={t('sidebar.settings')} onClick={closeMobile} />

          <div className="px-4 py-2">
            <LanguageSelector />
          </div>

          <button
            onClick={handleAuthAction}
            className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
              user
                ? 'text-danger hover:bg-danger/10 hover:text-red-400'
                : 'text-indigo-400 hover:bg-indigo-400/10 hover:text-indigo-300'
            }`}
          >
            {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{user ? t('sidebar.logout') : 'Accedi'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
