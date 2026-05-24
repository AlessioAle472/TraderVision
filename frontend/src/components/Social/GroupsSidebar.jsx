import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const GroupsSidebar = ({ onSelectGroup, selectedGroupId, onCreateClick }) => {
  const [myGroups, setMyGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchMyGroups = async () => {
    try {
      const groups = await apiClient.getMyGroups();
      setMyGroups(groups);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await apiClient.searchGroups(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id) => {
    try {
      await apiClient.joinGroup(id);
      fetchMyGroups(); // Refresh list
      setSearchQuery(''); // Clear search
      onSelectGroup(id);
    } catch (err) {
      console.error(err);
      alert('Impossibile unirsi al gruppo');
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-[#0B0E14] border-r border-[#1C212D]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Gruppi</h2>
        <button 
          onClick={onCreateClick}
          className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          title="Crea nuovo gruppo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Cerca gruppi pubblici..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#151923] border border-[#2A3143] rounded-full py-2 px-4 pl-10 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        />
        <svg className="w-4 h-4 text-gray-500 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {isSearching && searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Risultati Ricerca</h3>
            {searchResults.map(group => (
              <div key={group._id} className="flex items-center justify-between p-2 hover:bg-[#151923] rounded-lg mb-1">
                <div>
                  <div className="text-sm font-medium text-white">{group.name}</div>
                  <div className="text-xs text-gray-500">{group.members.length} membri</div>
                </div>
                {!myGroups.find(g => g._id === group._id) && (
                  <button onClick={() => handleJoin(group._id)} className="text-xs bg-[#1C212D] hover:bg-[#2A3143] text-white px-3 py-1 rounded-full transition-colors">
                    Unisciti
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">I miei Gruppi</h3>
          
          <button 
            onClick={() => onSelectGroup(null)}
            className={`w-full flex items-center p-3 rounded-xl transition-colors mb-2 ${selectedGroupId === null ? 'bg-[#1C212D] border border-blue-500/30' : 'hover:bg-[#151923] border border-transparent'}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-3 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Feed Globale</div>
              <div className="text-xs text-gray-500">Tutta la community</div>
            </div>
          </button>

          {myGroups.map(group => (
            <button 
              key={group._id}
              onClick={() => onSelectGroup(group._id)}
              className={`w-full flex items-center p-3 rounded-xl transition-colors mb-2 ${selectedGroupId === group._id ? 'bg-[#1C212D] border border-blue-500/30' : 'hover:bg-[#151923] border border-transparent'}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#2A3143] flex items-center justify-center mr-3 shrink-0">
                <span className="text-white font-bold">{group.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-sm font-semibold text-white truncate">{group.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {group.isPrivate ? 'Privato' : 'Pubblico'} • {group.members?.length || 0} membri
                </div>
              </div>
            </button>
          ))}
          {myGroups.length === 0 && !isSearching && (
            <div className="text-xs text-gray-500 italic p-2 text-center mt-4">
              Non partecipi ancora a nessun gruppo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsSidebar;
