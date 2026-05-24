import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../services/apiClient';

const RepostModal = ({ post, onClose, onRepostSuccess }) => {
  const [content, setContent] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await apiClient.getMyGroups();
        setGroups(data || []);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };
    fetchGroups();
  }, []);

  const handleRepost = async () => {
    try {
      setLoading(true);
      const data = {
        groupId: selectedGroupId || null,
        content: content
      };
      await apiClient.repostPost(post._id, data);
      onRepostSuccess();
      onClose();
    } catch (err) {
      alert("Errore durante il repost");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2b] border border-white/10 w-full max-w-lg rounded-2xl p-5 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Inoltra questo post</h2>
        
        <div className="mb-4 border border-white/5 rounded-xl p-3 bg-white/5">
          <p className="text-gray-300 text-sm truncate">{post.content || 'Post multimediale'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">Aggiungi un commento (opzionale)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#0f131a] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            rows="3"
            placeholder="Cosa ne pensi?"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-1">Destinazione</label>
          <select 
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-[#0f131a] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Feed Globale</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Annulla
          </button>
          <button 
            onClick={handleRepost}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Inoltro...' : 'Inoltra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepostModal;
