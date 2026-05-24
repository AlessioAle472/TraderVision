import React, { useState, useEffect } from 'react';
import { Heart, Repeat2, MessageCircle, MoreHorizontal, Flag, Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import RepostModal from './RepostModal';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const parseCashtags = (text) => {
  if (!text) return null;
  const regex = /(\$[A-Z0-9\-\.]+)/g;
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (part.match(regex)) {
      const ticker = part.substring(1);
      return (
        <Link key={i} to={`/asset/${ticker}`} className="text-blue-400 hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
};

const REACTIONS = [
  { type: 'like', icon: '👍' },
  { type: 'love', icon: '❤️' },
  { type: 'rocket', icon: '🚀' },
  { type: 'haha', icon: '😂' },
  { type: 'bull', icon: '📈' },
  { type: 'bear', icon: '📉' }
];

const getUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '652136d89a74a12345678901'; // Fallback dev mock
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).id;
  } catch(e) { return '652136d89a74a12345678901'; }
};

const PostCard = ({ post, onInteraction }) => {
  const currentUserId = getUserId();
  
  const [reactions, setReactions] = useState(post.reactions || []);
  const [repostsCount, setRepostsCount] = useState(post.reposts?.length || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // Repost modal
  const [showRepostModal, setShowRepostModal] = useState(false);

  const userReaction = reactions.find(r => r.user === currentUserId)?.type;
  
  const handleReact = async (type) => {
    try {
      setShowReactionMenu(false);
      const data = await apiClient.reactToPost(post._id, type);
      setReactions(data.reactions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Sei sicuro di voler eliminare questo post?")) return;
    try {
      await apiClient.deletePost(post._id);
      if (onInteraction) onInteraction();
    } catch (err) {
      alert("Impossibile eliminare il post. Non sei l'autore.");
    }
  };

  const handleReport = async () => {
    try {
      await apiClient.reportPost(post._id);
      alert("Post segnalato con successo ai moderatori.");
      setShowMenu(false);
    } catch (err) {
      alert("Errore durante la segnalazione.");
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      try {
        const data = await apiClient.getComments(post._id);
        setComments(data);
      } catch (err) {
        console.error(err);
      }
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const addedComment = await apiClient.createComment(post._id, newComment);
      setComments([...comments, addedComment]);
      setNewComment('');
    } catch (err) {
      alert("Errore nell'invio del commento.");
    }
  };

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

  return (
    <div className="bg-[#0f131a] border-b border-white/5 p-4 hover:bg-[#131821] transition-colors relative">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            post.author?.name?.charAt(0) || 'U'
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white truncate">{post.author?.name || 'Utente Premium'}</span>
              <span className="text-gray-500 truncate">{post.author?.username || '@trader'}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 shrink-0 hover:underline cursor-pointer">{formatTimeAgo(post.createdAt)}</span>
            </div>
            
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <MoreHorizontal size={18} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-[#1a1f2b] border border-white/10 rounded-xl shadow-lg py-1 z-10">
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Elimina Post
                  </button>
                  <button 
                    onClick={handleReport}
                    className="w-full text-left px-4 py-2 text-yellow-500 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Flag size={16} /> Segnala Post
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-1 text-[15px] leading-relaxed text-gray-100 whitespace-pre-wrap">
            {parseCashtags(post.content)}
          </div>
          
          {post.mediaUrl && (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-white/10">
              <img 
                src={`${backendUrl}${post.mediaUrl}`} 
                alt="Post Media" 
                className="w-full h-auto max-h-[500px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {post.originalPostId && (
            <div className="mt-3 p-3 border border-white/10 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Repeat2 size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-bold">{post.originalPostId.author?.name}</span>
              </div>
              <p className="text-sm text-gray-200">{parseCashtags(post.originalPostId.content)}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md relative">
            <button onClick={toggleComments} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <MessageCircle size={18} />
              </div>
            </button>
            
            <button 
              onClick={() => setShowRepostModal(true)}
              className="flex items-center gap-1.5 hover:text-green-400 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                <Repeat2 size={18} />
              </div>
              <span className="text-sm">{repostsCount > 0 ? repostsCount : ''}</span>
            </button>
            
            <div className="relative" onMouseLeave={() => setShowReactionMenu(false)}>
              <button 
                onMouseEnter={() => setShowReactionMenu(true)}
                onClick={() => handleReact('like')}
                className={`flex items-center gap-1.5 transition-colors group ${userReaction ? 'text-pink-500' : 'hover:text-pink-500'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${userReaction ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
                  {userReaction ? (
                     <span className="text-lg leading-none">{REACTIONS.find(r => r.type === userReaction)?.icon || '👍'}</span>
                  ) : (
                    <Heart size={18} />
                  )}
                </div>
                <span className="text-sm">{reactions.length > 0 ? reactions.length : ''}</span>
              </button>

              {showReactionMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 z-20">
                  <div className="bg-[#1a1f2b] border border-white/10 rounded-full shadow-lg p-1 flex gap-1">
                    {REACTIONS.map(reaction => (
                      <button
                        key={reaction.type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(reaction.type);
                        }}
                        className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-125"
                      >
                        {reaction.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pl-12">
          <div className="space-y-3 mb-4">
            {comments.map(c => (
              <div key={c._id} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                  {c.author?.avatar ? (
                    <img src={c.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-xs font-bold text-white">
                      {c.author?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="bg-[#1a1f2b] rounded-xl rounded-tl-none p-3 border border-white/5 flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{c.author?.name}</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Scrivi un commento..." 
              className="flex-1 bg-[#1a1f2b] border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {showRepostModal && (
        <RepostModal 
          post={post} 
          onClose={() => setShowRepostModal(false)} 
          onRepostSuccess={() => {
            setRepostsCount(prev => prev + 1);
            if (onInteraction) onInteraction();
          }} 
        />
      )}
    </div>
  );
};

export default PostCard;
