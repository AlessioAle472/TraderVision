import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Users, RefreshCw, X, MessageSquare, Plus, Layers } from 'lucide-react';
import PremiumGate from '../components/PremiumGate';
import FeedInput from '../components/Social/FeedInput';
import PostCard from '../components/Social/PostCard';
import GroupsSidebar from '../components/Social/GroupsSidebar';
import TrendsSidebar from '../components/Social/TrendsSidebar';
import CreateGroupModal from '../components/Social/CreateGroupModal';
import apiClient from '../services/apiClient';

const TweetSkeleton = () => (
  <div className="border-b border-white/10 p-4 animate-pulse flex gap-3">
    <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-24 bg-neutral-800 rounded" />
        <div className="h-3 w-16 bg-neutral-800 rounded" />
      </div>
      <div className="h-3 w-3/4 bg-neutral-800 rounded" />
      <div className="h-3 w-1/2 bg-neutral-800 rounded" />
      <div className="h-28 w-full bg-neutral-800/60 rounded-2xl mt-2" />
      <div className="flex justify-between max-w-md pt-2">
        <div className="h-3 w-6 bg-neutral-800 rounded" />
        <div className="h-3 w-6 bg-neutral-800 rounded" />
        <div className="h-3 w-6 bg-neutral-800 rounded" />
        <div className="h-3 w-6 bg-neutral-800 rounded" />
      </div>
    </div>
  </div>
);

const Community = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for_you'); // 'for_you' | 'trends' | 'groups'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTicker, setActiveTicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMobileGroups, setShowMobileGroups] = useState(false);

  const fetchFeed = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      let groupId = selectedGroupId;
      let ticker = activeTicker;
      let search = searchQuery;

      // When in 'trends' tab without a specific ticker, look for any cashtag
      if (activeTab === 'trends' && !activeTicker && !searchQuery) {
        ticker = '$';
      }

      const data = await apiClient.getFeed(1, 50, groupId, ticker, search);
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to load feed", error);
      if (!silent) setPosts([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeTab, selectedGroupId, activeTicker, searchQuery]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePostCreated = (newPost) => {
    // Instant optimistic insertion at the very top of feed
    setPosts(prev => [newPost, ...prev]);
  };

  const handleSelectTicker = (ticker) => {
    setActiveTicker(ticker);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setActiveTab('groups');
    setShowMobileGroups(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setActiveTicker(null);
    setSearchQuery('');
    setSelectedGroupId(null);
    setActiveTab('for_you');
  };

  return (
    <PremiumGate>
      <div className="min-h-screen bg-[#000000] text-white flex justify-center pb-20">
        <div className="flex w-full max-w-[1240px] justify-center px-0 sm:px-4 gap-0 lg:gap-6">
          
          {/* ─── 1. Colonna Sinistra (Gruppi di Trading) ─── */}
          <div className="hidden lg:block w-[280px] shrink-0 sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14]/60 backdrop-blur-md">
            <GroupsSidebar 
              onSelectGroup={handleSelectGroup} 
              selectedGroupId={selectedGroupId}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          </div>

          {/* ─── 2. Colonna Centrale: Feed Principale X-Style ─── */}
          <main className="flex-1 max-w-[620px] w-full border-x border-white/10 min-h-screen bg-[#000000]">
            {/* Header Fisso con Effetto Blur */}
            <header className="sticky top-0 z-20 bg-[#000000]/80 backdrop-blur-md border-b border-white/10">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {selectedGroupId ? 'Gruppo' : 'Community'}
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Feed in tempo reale" />
                </div>

                <div className="flex items-center gap-1">
                  {/* Refresh Button */}
                  <button
                    onClick={() => fetchFeed(false)}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Ricarica feed"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1d9bf0]' : ''}`} />
                  </button>

                  {/* Mobile Toggle Groups */}
                  <button 
                    onClick={() => setShowMobileGroups(!showMobileGroups)}
                    className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
                    title="Gruppi"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Schede in Stile X: Per te | Tendenze | Gruppi */}
              <div className="flex border-t border-white/5">
                {[
                  { id: 'for_you', label: 'Per te', icon: Sparkles },
                  { id: 'trends', label: 'Tendenze & Cashtag', icon: TrendingUp },
                  { id: 'groups', label: 'I miei Gruppi', icon: Users },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'for_you') {
                          setSelectedGroupId(null);
                        }
                      }}
                      className="flex-1 py-3 hover:bg-white/[0.03] transition-colors relative flex items-center justify-center gap-1.5 text-sm font-bold"
                    >
                      <span className={`${isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute bottom-0 h-1 w-14 bg-[#1d9bf0] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Banner Filtri Attivi (Cashtag o Ricerca) */}
              {(activeTicker || searchQuery || selectedGroupId) && (
                <div className="px-4 py-2 bg-[#1d9bf0]/10 border-t border-[#1d9bf0]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-neutral-400">Filtro attivo:</span>
                    {activeTicker && (
                      <span className="font-mono font-bold text-[#1d9bf0] bg-[#1d9bf0]/20 px-2 py-0.5 rounded-full">
                        {activeTicker}
                      </span>
                    )}
                    {searchQuery && (
                      <span className="text-white italic">
                        "{searchQuery}"
                      </span>
                    )}
                    {selectedGroupId && (
                      <span className="text-emerald-400 font-medium">
                        Gruppo selezionato
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 font-semibold ml-2 shrink-0 hover:bg-white/10 px-2 py-0.5 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" /> Azzera
                  </button>
                </div>
              )}
            </header>

            {/* Mobile Drawer per Gruppi */}
            {showMobileGroups && (
              <div className="lg:hidden p-4 border-b border-white/10 bg-[#0B0E14]">
                <GroupsSidebar 
                  onSelectGroup={handleSelectGroup} 
                  selectedGroupId={selectedGroupId}
                  onCreateClick={() => {
                    setShowMobileGroups(false);
                    setIsCreateModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* Composer Box (Cosa sta succedendo?) */}
            <FeedInput 
              onPostCreated={handlePostCreated} 
              selectedGroupId={selectedGroupId} 
            />

            {/* Feed dei Post */}
            {loading ? (
              <div>
                <TweetSkeleton />
                <TweetSkeleton />
                <TweetSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-500 mb-4">
                  <MessageSquare className="w-7 h-7 text-[#1d9bf0]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Nessun post trovato
                </h3>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
                  {activeTicker 
                    ? `Non ci sono ancora analisi o discussioni su ${activeTicker}. Sii il primo a postare!`
                    : "Condividi un'analisi, un grafico o una previsione macroeconomica con la community."}
                </p>
                {(activeTicker || searchQuery || selectedGroupId) && (
                  <button
                    onClick={clearAllFilters}
                    className="bg-white hover:bg-neutral-200 text-black font-bold text-xs px-5 py-2 rounded-full transition-colors"
                  >
                    Mostra tutti i post
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {posts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onInteraction={() => fetchFeed(true)}
                    onSelectTicker={handleSelectTicker}
                  />
                ))}
              </div>
            )}
          </main>

          {/* ─── 3. Colonna Destra: Tendenze di Mercato X-Style ─── */}
          <div className="hidden xl:block w-[320px] shrink-0">
            <TrendsSidebar 
              onSelectTicker={handleSelectTicker} 
              onSearch={handleSearch}
              activeTicker={activeTicker}
              onSelectGroup={handleSelectGroup}
            />
          </div>

        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchFeed(false);
        }}
      />
    </PremiumGate>
  );
};

export default Community;
