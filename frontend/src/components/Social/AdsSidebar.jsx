import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const AdsSidebar = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const activeAds = await apiClient.getActiveAds();
        setAds(activeAds);
      } catch (err) {
        console.error('Failed to fetch ads', err);
      }
    };
    fetchAds();
  }, []);

  if (ads.length === 0) {
    return (
      <div className="w-full p-4">
        {/* Placeholder per quando non ci sono ads, o widget secondari */}
        <div className="bg-[#151923] border border-[#1C212D] rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">Tendenze in TraderVision</h3>
          <p className="text-xs text-gray-500">Iscriviti ai gruppi per vedere più contenuti rilevanti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      {ads.map(ad => (
        <div key={ad._id} className="bg-[#0B0E14] border border-[#1C212D] rounded-2xl overflow-hidden hover:bg-[#151923] transition-colors relative group">
          {/* Badge Promoted */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-gray-300 text-[10px] uppercase font-bold px-2 py-1 rounded">
            Sponsorizzato
          </div>
          
          {ad.imageUrl && (
            <div className="w-full h-32 bg-[#1C212D] overflow-hidden">
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          <div className="p-4">
            <div className="text-xs font-semibold text-blue-500 mb-1">{ad.sponsorName}</div>
            <h3 className="text-sm font-bold text-white mb-2 leading-tight">{ad.title}</h3>
            <p className="text-xs text-gray-400 line-clamp-3 mb-4">{ad.description}</p>
            
            <a 
              href={ad.targetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#1C212D] hover:bg-[#2A3143] text-white text-xs font-bold py-2 rounded-xl transition-colors"
            >
              Scopri di più
            </a>
          </div>
        </div>
      ))}
      
      <div className="text-[10px] text-gray-600 text-center mt-6">
        Informazioni sugli Annunci • Privacy • Termini
        <br />© 2026 TraderVision
      </div>
    </div>
  );
};

export default AdsSidebar;
