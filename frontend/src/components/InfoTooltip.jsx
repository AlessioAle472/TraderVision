import React from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ text, className ='' }) => {
 return (
 <div className={`group relative inline-flex items-center ml-1.5 ${className}`}>
 <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-colors cursor-help"/>
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-[10px] text-gray-200 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 leading-snug font-medium text-center">
 {text}
 {/* Freccia */}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] bg-slate-700/50"></div>
 </div>
 </div>
 );
};

export default InfoTooltip;
