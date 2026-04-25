import { LogIn, LogOut, LayoutDashboard, LineChart, Wallet, Settings, MessageSquare, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
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

  return (
    <aside className="w-64 bg-surface h-screen border-r border-slate-700/50 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <LineChart className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Trader Vision</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t('sidebar.dashboard')}</span>
        </NavLink>
        <NavLink 
          to="/markets" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <LineChart className="w-5 h-5" />
          <span>{t('sidebar.markets')}</span>
        </NavLink>
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <Wallet className="w-5 h-5" />
          <span>{t('sidebar.watchlist')}</span>
        </NavLink>
        <NavLink 
          to="/community" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <MessageSquare className="w-5 h-5" />
          <span>{t('sidebar.community')}</span>
        </NavLink>
        <NavLink 
          to="/daily-news" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>{t('sidebar.dailyNews')}</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-400 hover:bg-slate-800/50 hover:text-white font-medium'}`
          }
        >
          <Settings className="w-5 h-5" />
          <span>{t('sidebar.settings')}</span>
        </NavLink>
        <button onClick={handleAuthAction} className={`flex w-full items-center gap-3 px-4 py-3 mt-2 transition-colors ${user ? 'text-danger hover:text-red-400' : 'text-indigo-400 hover:text-indigo-300'}`}>
          {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          <span className="font-medium">{user ? t('sidebar.logout') : 'Login'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
