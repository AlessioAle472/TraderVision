import React, { useState } from 'react';
import PremiumGate from '../components/PremiumGate';

const WorldMonitorOSINT = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PremiumGate>
      <div className="-m-4 md:-m-8 h-[calc(100vh-64px)] relative bg-[#0B0E14] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center z-10 transition-opacity duration-500">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-text-secondary animate-pulse tracking-widest text-sm uppercase">Inizializzazione OSINT...</p>
          </div>
        )}
        <iframe
          src="https://world-monitor.com/"
          className="w-full h-full border-0"
          allow="geolocation; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </PremiumGate>
  );
};

export default WorldMonitorOSINT;
