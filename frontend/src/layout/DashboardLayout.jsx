import Sidebar from '../components/Sidebar';
import LanguageSelector from '../components/LanguageSelector';
import MacroTicker from '../components/MacroTicker';
import SearchBar from '../components/SearchBar';
import { useWatchlist } from '../context/WatchlistContext';

const DashboardLayout = ({ children }) => {
  const { toggleWatchlist } = useWatchlist();

  return (
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-700/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 w-full gap-8">
          <MacroTicker />
          
          <div className="hidden md:flex flex-1 justify-center">
            <SearchBar onAddTicker={(ticker) => toggleWatchlist(ticker)} />
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </header>
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
