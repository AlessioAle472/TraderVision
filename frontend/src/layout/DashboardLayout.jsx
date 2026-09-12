import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MacroTicker from '../components/MacroTicker';
import SearchBar from '../components/SearchBar';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
 const { toggleWatchlist } = useWatchlist();
 const { user, simulatedPlan, setSimulatedPlan } = useAuth();
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);

 return (
 <div className="flex h-screen bg-background text-text overflow-hidden transition-colors duration-300">
 <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
 <main className="flex-1 flex flex-col overflow-hidden">
 {/* Top Navbar */}
 <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10 w-full gap-4 md:gap-8 transition-colors duration-300">
 <div className="flex items-center gap-4 md:hidden">
 <button 
 onClick={() => setIsSidebarOpen(true)}
 className="p-2 -ml-2 text-gray-400 hover:text-white focus:outline-none"
 >
 <Menu className="w-6 h-6"/>
 </button>
 </div>
 
 <MacroTicker />
 
 <div className="hidden md:flex flex-1 justify-center">
 <SearchBar onAddTicker={(ticker) => toggleWatchlist(ticker)} />
 </div>

 <div className="flex items-center gap-4">
 {user?.isMaster && (
 <div className="flex bg-surface rounded-full p-1 items-center relative shadow-inner">
 {simulatedPlan === 'free' && (
 <>
 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full animate-ping opacity-75"></span>
 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
 </>
 )}
 <button
 onClick={() => setSimulatedPlan('free')}
 className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${simulatedPlan === 'free' ? 'bg-danger text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
 >
 Free
 </button>
 <button
 onClick={() => setSimulatedPlan('pro')}
 className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${simulatedPlan === 'pro' ? 'bg-success text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
 >
 Pro
 </button>
 <button
 onClick={() => setSimulatedPlan(null)}
 className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${!simulatedPlan ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
 >
 Admin
 </button>
 </div>
 )}
 </div>
 </header>
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="p-4 md:p-8">
          {children}
        </div>

        {/* Regulatory & Financial Risk Disclaimer Footer */}
        <footer className="mt-auto px-4 py-6 md:px-8 border-t border-white/[0.04] bg-surface/30 backdrop-blur-sm text-slate-500 text-[11px] leading-relaxed space-y-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="max-w-4xl">
              <strong className="text-slate-400">AVVISO GENERALE DI RISCHIO:</strong> Il trading e gli investimenti sui mercati finanziari (azioni, indici, materie prime, valute e criptovalute) comportano un elevato rischio di perdita del capitale. Le analisi quantitative, gli algoritmi Smart Quant e i contenuti di TraderVision hanno scopo esclusivamente didattico ed informativo e non costituiscono in alcun caso consulenza finanziaria o sollecitazione al pubblico risparmio ai sensi del D.Lgs. 58/1998 (TUF) e della Direttiva MiFID II.
            </p>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <a href="/settings" className="hover:text-indigo-400 transition-colors">Termini & Disclaimer</a>
              <span>•</span>
              <a href="/settings" className="hover:text-indigo-400 transition-colors">Privacy GDPR</a>
              <span>•</span>
              <span>v1.0 Launch</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  </div>
 );
};

export default DashboardLayout;
