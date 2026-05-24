import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PremiumGate from '../components/PremiumGate';
import FeedInput from '../components/Social/FeedInput';
import PostCard from '../components/Social/PostCard';
import GroupsSidebar from '../components/Social/GroupsSidebar';
import AdsSidebar from '../components/Social/AdsSidebar';
import CreateGroupModal from '../components/Social/CreateGroupModal';
import apiClient from '../services/apiClient';

const Community = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFeed(1, 50, selectedGroupId);
      setPosts(data);
    } catch (error) {
      console.error("Failed to load feed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedGroupId]);

  const handlePostCreated = (newPost) => {
    // Aggiungi il nuovo post se non c'è filtro gruppo, o se corrisponde al gruppo selezionato
    if (!selectedGroupId || newPost.groupId === selectedGroupId) {
      setPosts(prev => [newPost, ...prev]);
    }
  };

  return (
    <PremiumGate>
      {/* 3-Column Layout Container */}
      <div className="min-h-screen bg-[#0B0E14] text-white flex justify-center pb-20 pt-4">
        <div className="flex w-full max-w-[1200px] px-4 gap-6">
          
          {/* Left Column (Groups) - Hidden on mobile by default or managed via drawer */}
          <div className="hidden lg:block w-[300px] shrink-0 sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-white/5">
            <GroupsSidebar 
              onSelectGroup={setSelectedGroupId} 
              selectedGroupId={selectedGroupId}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          </div>

          {/* Central Column (Feed) */}
          <div className="flex-1 max-w-[600px] border-x border-white/5 min-h-screen bg-[#0B0E14]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold">
                {selectedGroupId ? 'Feed Gruppo' : 'Community Globale'}
              </h1>
              {/* Mobile group toggle button (simplified) */}
              <button className="lg:hidden p-2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </header>

            {/* Feed Input Area */}
            <div className="p-4 border-b border-white/5">
              <FeedInput onPostCreated={handlePostCreated} selectedGroupId={selectedGroupId} />
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="flex justify-center p-8 text-gray-500">
                Caricamento feed...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nessun post da mostrare. Inizia tu la conversazione!
              </div>
            ) : (
              <div className="flex flex-col">
                {posts.map((post, index) => (
                  <React.Fragment key={post._id}>
                    <PostCard post={post} />
                    {/* Optional inline ads for mobile can go here, but right sidebar is default */}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Ads) - Hidden on smaller screens */}
          <div className="hidden xl:block w-[300px] shrink-0 sticky top-4 h-fit">
            <AdsSidebar />
          </div>

        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Forzerà il refresh della sidebar chiudendo e riaprendo o triggerando re-fetch
          // Per semplicità ricarichiamo la pagina o aggiorniamo lo state
          window.location.reload();
        }}
      />
    </PremiumGate>
  );
};

export default Community;
