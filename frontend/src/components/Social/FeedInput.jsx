import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Smile, Send, Loader2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import apiClient from '../../services/apiClient';

const FeedInput = ({ onPostCreated, selectedGroupId }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    setContent(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const onEmojiClick = (emojiObject) => {
    setContent(prev => prev + emojiObject.emoji);
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
      if (selectedGroupId) {
        formData.append('groupId', selectedGroupId);
      }
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const newPost = await apiClient.createPost(formData);
      setContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      if (onPostCreated) onPostCreated(newPost);
    } catch (error) {
      alert("Errore durante la pubblicazione. " + (error.response?.data?.error || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0f131a] rounded-xl p-4 mb-6 border border-white/5">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">
          U
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="Cosa succede sul mercato? (Usa $TICKER per taggare un asset)"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none min-h-[40px] text-lg mb-2"
            rows={1}
          />

          {previewUrl && (
            <div className="relative mb-3">
              <img src={previewUrl} alt="Preview" className="rounded-xl max-h-80 object-cover w-full border border-white/10" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black p-1.5 rounded-full text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2 relative">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                title="Aggiungi Immagine"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                title="Emoji"
              >
                <Smile size={20} />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-12 left-0 z-50">
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative z-50">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !selectedFile)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Pubblica'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedInput;
