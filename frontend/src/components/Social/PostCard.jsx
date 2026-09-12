import React, { useState } from 'react';
import { Heart, Repeat2, MessageCircle, MoreHorizontal, Flag, Trash2, Send, Share2, BadgeCheck, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import RepostModal from './RepostModal';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'ora';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${Math.max(1, seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g`;
  return date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
};

const parseCashtagsAndMentions = (text, onSelectTicker) => {
  if (!text) return null;
  // Match $CASHTAGS, #HASHTAGS, and @MENTIONS
  const regex = /(\$[A-Z0-9\-\.]+|#[A-Za-z0-9_]+|@[A-Za-z0-9_]+)/g;
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('$')) {
      const ticker = part.substring(1);
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectTicker) onSelectTicker(part);
          }}
          className="text-[#1d9bf0] font-medium hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span key={i} className="text-[#1d9bf0] hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

const getUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).id;
  } catch(e) { return null; }
};

const PostCard = ({ post, onInteraction, onSelectTicker }) => {
  const currentUserId = getUserId();
  
  const [reactions, setReactions] = useState(post.reactions || []);
  const [repostsCount, setRepostsCount] = useState(post.reposts?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  
  // Comments thread state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Repost modal
  const [showRepostModal, setShowRepostModal] = useState(false);

  // Check if current user liked
  const isLikedByMe = reactions.some(r => r.user === currentUserId || r.user?._id === currentUserId);
  const likesCount = reactions.length;

  // Optimistic like toggle (0ms delay)
  const handleToggleLike = async () => {
    const prevReactions = [...reactions];
    if (isLikedByMe) {
      setReactions(prev => prev.filter(r => (r.user !== currentUserId && r.user?._id !== currentUserId)));
    } else {
      setReactions(prev => [...prev, { user: currentUserId, type: 'like' }]);
    }

    try {
      const data = await apiClient.reactToPost(post._id, 'like');
      if (data && data.reactions) {
        setReactions(data.reactions);
      }
    } catch (err) {
      console.error('Like error, reverting', err);
      setReactions(prevReactions);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Eliminare definitivamente questo post?")) return;
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

  const handleShare = () => {
    const url = window.location.origin + `/community?post=${post._id}`;
    navigator.clipboard?.writeText(url);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      try {
        setIsLoadingComments(true);
        const data = await apiClient.getComments(post._id);
        setComments(data || []);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const addedComment = await apiClient.createComment(post._id, newComment);
      setComments(prev => [...prev, addedComment]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (err) {
      alert("Errore durante l'invio del commento.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
  const author = post.author || {};
  const isVerified = author.isMaster || author.role === 'admin' || author.plan === 'pro';
  const authorInitial = author.name ? author.name.charAt(0).toUpperCase() : 'T';

  return (
    <article className="border-b border-white/10 hover:bg-white/[0.02] transition-colors duration-150 px-4 py-3.5 relative">
      {/* Copied Link Toast */}
      {copiedToast && (
        <div className="absolute top-2 right-4 bg-[#1d9bf0] text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-30 animate-bounce">
          <Check className="w-3 h-3" /> Link copiato negli appunti!
        </div>
      )}

      <div className="flex gap-3">
        {/* Left: User Avatar */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <span>{authorInitial}</span>
            )}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-1 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-bold text-white text-[15px] hover:underline cursor-pointer truncate">
                {author.name || 'TraderVision Member'}
              </span>

              {/* Verified / Pro Checkmark */}
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-black shrink-0" title="Trader Verificato / Pro" />
              )}

              <span className="text-neutral-500 text-sm truncate">
                {author.username || '@trader'}
              </span>

              <span className="text-neutral-500 text-xs">·</span>

              <span className="text-neutral-500 text-sm hover:underline cursor-pointer shrink-0">
                {formatTimeAgo(post.createdAt)}
              </span>

              {/* Sentiment Pill (Bullish / Bearish) */}
              {post.sentiment === 'bullish' && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  🐂 Bullish
                </span>
              )}
              {post.sentiment === 'bearish' && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  🐻 Bearish
                </span>
              )}
            </div>

            {/* Menu Options */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowMenu(!showMenu)} 
                className="text-neutral-500 hover:text-[#1d9bf0] p-1.5 rounded-full hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-[#16181C] border border-white/10 rounded-xl shadow-2xl py-1 z-30">
                  <button
                    type="button"
                    onClick={() => {
                      handleShare();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copia Link Post
                  </button>
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Elimina Post
                  </button>
                  <button 
                    type="button"
                    onClick={handleReport}
                    className="w-full text-left px-3.5 py-2 text-xs text-amber-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5" /> Segnala Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tweet Text */}
          <div className="mt-1 text-[15px] text-[#e7e9ea] leading-relaxed whitespace-pre-wrap break-words">
            {parseCashtagsAndMentions(post.content, onSelectTicker)}
          </div>

          {/* Media (Images) */}
          {post.mediaUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 max-h-[460px] bg-neutral-900">
              <img 
                src={`${backendUrl}${post.mediaUrl}`} 
                alt="Media Post" 
                className="w-full h-auto max-h-[460px] object-cover hover:opacity-95 transition-opacity cursor-pointer"
                loading="lazy"
                onClick={() => window.open(`${backendUrl}${post.mediaUrl}`, '_blank')}
              />
            </div>
          )}

          {/* Quoted Post (if repost with quote) */}
          {post.originalPostId && (
            <div className="mt-3 p-3 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-1.5 mb-1 text-xs">
                <span className="font-bold text-white">{post.originalPostId.author?.name || 'Utente'}</span>
                <span className="text-neutral-500">{post.originalPostId.author?.username || '@trader'}</span>
              </div>
              <p className="text-sm text-neutral-300">
                {parseCashtagsAndMentions(post.originalPostId.content, onSelectTicker)}
              </p>
            </div>
          )}

          {/* Action Row: The 4 X Buttons */}
          <div className="flex items-center justify-between mt-3 text-neutral-500 max-w-md pt-1">
            {/* 1. Reply / Comments */}
            <button 
              type="button"
              onClick={toggleComments}
              className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group"
            >
              <div className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs">{commentsCount > 0 ? commentsCount : ''}</span>
            </button>

            {/* 2. Repost */}
            <button 
              type="button"
              onClick={() => setShowRepostModal(true)}
              className="flex items-center gap-1.5 hover:text-[#00ba7c] transition-colors group"
            >
              <div className="p-1.5 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-xs">{repostsCount > 0 ? repostsCount : ''}</span>
            </button>

            {/* 3. Like (Optimistic) */}
            <button 
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 transition-colors group ${isLikedByMe ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
            >
              <div className={`p-1.5 rounded-full transition-all ${isLikedByMe ? 'bg-[#f91880]/10 scale-110' : 'group-hover:bg-[#f91880]/10'}`}>
                <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-[#f91880] text-[#f91880]' : ''}`} />
              </div>
              <span className={`text-xs ${isLikedByMe ? 'font-bold text-[#f91880]' : ''}`}>
                {likesCount > 0 ? likesCount : ''}
              </span>
            </button>

            {/* 4. Share */}
            <button 
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group"
              title="Condividi o copia link"
            >
              <div className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Comments Thread */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-white/5 pl-12">
          {/* Quick Reply Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-4">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Rispondi a ${author.username || '@trader'}...`} 
              className="flex-1 bg-[#16181C] border border-white/10 focus:border-[#1d9bf0] rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-full transition-colors shrink-0"
            >
              {isSubmittingComment ? '...' : 'Rispondi'}
            </button>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="text-xs text-neutral-500 py-2">Caricamento risposte...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-neutral-500 py-1">Nessuna risposta ancora. Sii il primo a rispondere!</div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c._id} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 mt-0.5">
                    {c.author?.avatar ? (
                      <img src={c.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.author?.name ? c.author.name.charAt(0) : 'U'}</span>
                    )}
                  </div>
                  <div className="bg-[#16181C] rounded-2xl p-3 border border-white/5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 leading-none">
                      <span className="font-bold text-white text-xs">{c.author?.name || 'Trader'}</span>
                      <span className="text-neutral-500 text-[11px]">{c.author?.username || '@trader'}</span>
                      <span className="text-neutral-500 text-[10px]">·</span>
                      <span className="text-neutral-500 text-[11px]">{formatTimeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap break-words">
                      {parseCashtagsAndMentions(c.content, onSelectTicker)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Repost Modal */}
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
    </article>
  );
};

export default PostCard;
