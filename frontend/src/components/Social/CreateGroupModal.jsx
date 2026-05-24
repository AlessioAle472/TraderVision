import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIsPrivate(true);
      setSuggestions([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuggestions([]);
    setIsSubmitting(true);

    try {
      await apiClient.createGroup({
        name,
        description,
        isPrivate,
        members: [] // A real app would let you invite users here
      });
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.error);
        setSuggestions(err.response.data.suggestions || []);
      } else {
        setError('Errore durante la creazione del gruppo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0B0E14] border border-[#1C212D] rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#1C212D]">
          <h2 className="text-xl font-bold text-white">Crea un Gruppo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex space-x-2 bg-[#151923] p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isPrivate ? 'bg-[#2A3143] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                🔒 Privato
              </button>
              <button 
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isPrivate ? 'bg-[#2A3143] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                🌍 Pubblico
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isPrivate ? 'Solo le persone invitate possono vedere questo gruppo.' : 'Chiunque può cercare e unirsi a questo gruppo.'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome del Gruppo</label>
            <input 
              type="text" 
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#151923] border border-[#2A3143] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Es. Alpha Traders"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrizione (opzionale)</label>
            <textarea 
              maxLength={160}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#151923] border border-[#2A3143] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
              placeholder="Di cosa si parlerà in questo gruppo?"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-yellow-500 mb-2">Esistono già gruppi simili a cui potresti unirti:</p>
              <div className="space-y-2">
                {suggestions.map(g => (
                  <div key={g._id} className="flex items-center justify-between bg-[#151923] p-2 rounded border border-[#2A3143]">
                    <span className="text-sm text-gray-300">{g.name}</span>
                    <span className="text-xs text-gray-500">{g.members.length} membri</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            {isSubmitting ? 'Creazione in corso...' : 'Crea Gruppo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
