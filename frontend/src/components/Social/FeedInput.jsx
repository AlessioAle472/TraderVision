import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Smile, Loader2, TrendingUp, TrendingDown, Sparkles, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const POPULAR_CASHTAGS = ['$BTC', '$NVDA', '$SPY', '$TSLA', '$EURUSD', '$GOLD'];

const FeedInput = ({ onPostCreated, selectedGroupId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState(null); // 'bullish' | 'bearish' | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const maxChars = 500;
  const charsRemaining = maxChars - content.length;

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setContent(val);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
      }
    }
  };

  const handleInsertCashtag = (tag) => {
    setContent(prev => {
      const trimmed = prev.trim();
      const updated = trimmed ? `${trimmed} ${tag} ` : `${tag} `;
      return updated.slice(0, maxChars);
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setContent(prev => (prev + emojiObject.emoji).slice(0, maxChars));
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("L'immagine non può superare i 2MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (sentiment) {
        formData.append('sentiment', sentiment);
      }
      if (selectedGroupId) {
        formData.append('groupId', selectedGroupId);
      }
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const newPost = await apiClient.createPost(formData);
      setContent('');
      setSentiment(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      if (onPostCreated) onPostCreated(newPost);
    } catch (error) {
      alert("Errore durante la pubblicazione: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'T';

  return (
    <div className="bg-[#000000]/60 border-b border-white/10 px-4 pt-3 pb-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-sm">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>

        {/* Input & Controls */}
        <div className="flex-1 min-w-0">
          {/* Sentiment Selection Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <button
              type="button"
              onClick={() => setSentiment(prev => prev === 'bullish' ? null : 'bullish')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                sentiment === 'bullish'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Bullish</span>
            </button>
            <button
              type="button"
              onClick={() => setSentiment(prev => prev === 'bearish' ? null : 'bearish')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                sentiment === 'bearish'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span>Bearish</span>
            </button>
          </div>

          {/* Borderless Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="Cosa sta succedendo sui mercati? (Usa $TICKER per taggare)"
            className="w-full bg-transparent text-white placeholder-neutral-500 outline-none resize-none text-[17px] leading-relaxed mb-2 min-h-[52px]"
            rows={2}
          />

          {/* Media Preview */}
          {previewUrl && (
            <div className="relative mb-3 rounded-2xl overflow-hidden border border-white/10 max-h-72 bg-neutral-900">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-72 object-contain" />
              <button 
                type="button"
                onClick={removeImage}
                className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-black p-1.5 rounded-full text-white transition-colors"
                title="Rimuovi immagine"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Cashtag Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-white/5">
            <span className="text-[11px] text-neutral-500 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Cashtag:
            </span>
            {POPULAR_CASHTAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleInsertCashtag(tag)}
                className="text-xs font-mono font-semibold text-[#1d9bf0] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 px-2 py-0.5 rounded-md transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-2.5">
            <div className="flex items-center gap-1 text-[#1d9bf0]">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors"
                title="Aggiungi Grafico / Screenshot"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-10 left-0 z-50">
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                    <div className="relative z-50">
                      <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Character Counter & Post Button */}
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={`text-xs font-mono ${charsRemaining < 50 ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                  {charsRemaining}
                </span>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !selectedFile)}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Invio...</span>
                  </>
                ) : (
                  'Posta'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedInput;
