import { LogIn, LogOut, LayoutDashboard, LineChart, Settings, MessageSquare, Calendar, Globe, Coins } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

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
 <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface h-screen flex flex-col transform md:relative md:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
 <div className="p-6 flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
 <LineChart className="text-white w-5 h-5"/>
 </div>
 <h1 className="text-xl font-bold tracking-tight text-text">Trader Vision</h1>
 </div>
 
 <nav className="flex-1 p-4 space-y-2">
 <NavLink 
 to="/"
 end
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <LayoutDashboard className="w-5 h-5"/>
 <span>{t('sidebar.dashboard')}</span>
 </NavLink>
 <NavLink 
 to="/markets"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <LineChart className="w-5 h-5"/>
 <span>{t('sidebar.markets')}</span>
 </NavLink>

 <NavLink 
 to="/crypto"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <Coins className="w-5 h-5"/>
 <span>Crypto</span>
 </NavLink>

 <NavLink 
 to="/global-macro"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <Globe className="w-5 h-5"/>
 <span>Macro Globale</span>
 </NavLink>

 <NavLink 
 to="/community"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <MessageSquare className="w-5 h-5"/>
 <span>{t('sidebar.community')}</span>
 </NavLink>
 <NavLink 
 to="/daily-news"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <Calendar className="w-5 h-5"/>
 <span>{t('sidebar.dailyNews')}</span>
 </NavLink>
 </nav>

 <div className="p-4">
 <NavLink 
 to="/settings"
 className={({ isActive }) => 
`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'}`
 }
 onClick={closeMobile}
 >
 <Settings className="w-5 h-5"/>
 <span>{t('sidebar.settings')}</span>
 </NavLink>
 
 <div className="px-4 py-2 mt-2 pt-4">
 <LanguageSelector />
 </div>

 <button onClick={handleAuthAction} className={`flex w-full items-center gap-3 px-4 py-3 mt-2 transition-colors ${user ? 'text-danger hover:text-red-400' : 'text-indigo-400 hover:text-indigo-300'}`}>
 {user ? <LogOut className="w-5 h-5"/> : <LogIn className="w-5 h-5"/>}
 <span className="font-medium">{user ? t('sidebar.logout') : 'Accedi'}</span>
 </button>
 </div>
 </aside>
 </>
 );
};

export default Sidebar;
