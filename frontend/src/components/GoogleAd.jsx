import React from 'react';
import { useAuth } from '../context/AuthContext';

const GoogleAd = ({ className ='' }) => {
 const { user } = useAuth();

 // Se l'utente è un"Master", nascondiamo la pubblicità restituendo null
 if (user && user.isMaster) {
 return null;
 }

 // Placeholder per Google AdSense
 return (
 <div className={`w-full bg-slate-800/40 rounded-xl flex items-center justify-center p-4 text-slate-500 overflow-hidden ${className}`}>
 <div className="flex flex-col items-center opacity-50">
 <span className="text-xs tracking-widest uppercase mb-1">Advertisement</span>
 {/* In futuro qui andrà lo script AdSense:
 <ins className="adsbygoogle"
 style={{ display:"block"}}
 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
 data-ad-slot="XXXXXXXXXX"
 data-ad-format="auto"
 data-full-width-responsive="true"></ins>
 */}
 <div className="h-[90px] w-[728px] max-w-full bg-slate-700/30 rounded flex items-center justify-center">
 <span className="text-sm">728x90 AdSpace Placeholder</span>
 </div>
 </div>
 </div>
 );
};

export default GoogleAd;
