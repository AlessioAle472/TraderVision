import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, Flame, Check, Plus } from 'lucide-react';
import apiClient from '../../services/apiClient';

const TRENDING_TOPICS = [
  { category: 'Criptovalute • In tendenza', tag: '$BTC', label: 'Bitcoin & Mercato Crypto', posts: '14.8K post' },
  { category: 'Indici & Macro • In tendenza', tag: '$SPY', label: 'S&P 500 & Inflazione US', posts: '11.2K post' },
  { category: 'AI & Tech • In tendenza', tag: '$NVDA', label: 'Nvidia & Semiconduttori', posts: '9.4K post' },
  { category: 'Forex • In tendenza', tag: '$EURUSD', label: 'Euro / Dollaro & Tassi BCE', posts: '6.7K post' },
  { category: 'Materie Prime • In tendenza', tag: '$GOLD', label: 'Oro & Asset Rifugio', posts: '5.1K post' },
  { category: 'Azioni Growth • In tendenza', tag: '$TSLA', label: 'Tesla Motors', posts: '4.3K post' },
];

const TrendsSidebar = ({ onSelectTicker, onSearch, activeTicker, onSelectGroup }) => {
  const [searchInput, setSearchInput] = useState('');
  const [recommendedGroups, setRecommendedGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState(new Set());

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const [my, search] = await Promise.all([
          apiClient.getMyGroups().catch(() => []),
          apiClient.searchGroups('').catch(() => [])
        ]);
        const myIds = new Set((my || []).map(g => g._id));
        setJoinedGroupIds(myIds);
        
        // Show groups not joined, or top 3 public groups
        const available = (search || []).filter(g => !myIds.has(g._id));
        setRecommendedGroups(available.slice(0, 3));
      } catch (err) {
        // Fallback quiet
      }
    };
    fetchGroups();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchInput.trim());
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await apiClient.joinGroup(groupId);
      setJoinedGroupIds(prev => new Set([...prev, groupId]));
      if (onSelectGroup) onSelectGroup(groupId);
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  return (
    <aside className="w-full flex flex-col gap-4 sticky top-4">
      {/* 1. X Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (e.target.value === '' && onSearch) onSearch('');
          }}
          placeholder="Cerca nella community o $TICKER..."
          className="w-full bg-[#16181C] hover:bg-[#1E2228] focus:bg-[#000000] border border-white/5 focus:border-[#1d9bf0] text-sm text-white placeholder-neutral-500 rounded-full py-2.5 pl-11 pr-4 outline-none transition-all duration-200"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              if (onSearch) onSearch('');
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs bg-neutral-800 rounded-full w-4 h-4 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </form>

      {/* 2. Tendenze di Mercato (What's happening) */}
      <div className="bg-[#16181C] border border-white/5 rounded-2xl p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/5">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            Tendenze di Mercato
          </h3>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Live Alpha</span>
        </div>

        <div className="divide-y divide-white/5">
          {TRENDING_TOPICS.map((trend, idx) => {
            const isSelected = activeTicker === trend.tag;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTicker && onSelectTicker(isSelected ? null : trend.tag)}
                className={`w-full text-left py-2.5 px-2 -mx-2 rounded-xl transition-all duration-150 flex items-center justify-between group ${
                  isSelected ? 'bg-[#1d9bf0]/10 border-l-2 border-[#1d9bf0]' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div>
                  <span className="text-[11px] text-neutral-500 block leading-tight">
                    {trend.category}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-[#1d9bf0] transition-colors flex items-center gap-1.5 mt-0.5">
                    {trend.tag}
                    <span className="text-xs font-normal text-neutral-400">• {trend.label}</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    {trend.posts}
                  </span>
                </div>
                {isSelected ? (
                  <span className="text-[10px] bg-[#1d9bf0] text-white px-2 py-0.5 rounded-full font-bold">
                    Attivo
                  </span>
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#1d9bf0] transition-colors shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Gruppi Consigliati (Who to follow) */}
      {recommendedGroups.length > 0 && (
        <div className="bg-[#16181C] border border-white/5 rounded-2xl p-4">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#1d9bf0]" />
            Gruppi Consigliati
          </h3>
          <div className="space-y-3">
            {recommendedGroups.map(group => {
              const isJoined = joinedGroupIds.has(group._id);
              return (
                <div key={group._id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer" onClick={() => onSelectGroup && onSelectGroup(group._id)}>
                      {group.name}
                    </h4>
                    <p className="text-xs text-neutral-500 truncate">
                      {group.members?.length || 1} trader iscritti
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(group._id)}
                    disabled={isJoined}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 flex items-center gap-1 ${
                      isJoined 
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' 
                        : 'bg-white hover:bg-neutral-200 text-black shadow-sm'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3 h-3" />
                        Iscritto
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Unisciti
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Footer istituzionale in stile X */}
      <footer className="px-3 text-[11px] text-neutral-500 leading-relaxed space-x-2">
        <span className="hover:underline cursor-pointer">Termini di Servizio</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Privacy Policy</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Regolamento Community</span>
        <span>•</span>
        <span>© 2026 TraderVision Inc.</span>
      </footer>
    </aside>
  );
};

export default TrendsSidebar;
