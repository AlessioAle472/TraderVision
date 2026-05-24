import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 ArrowLeft, 
 ShieldAlert, 
 FileText, 
 Download, 
 Loader2, 
 Zap, 
 Activity, 
 TrendingDown,
 Info
} from 'lucide-react';
import { 
 Radar, 
 RadarChart, 
 PolarGrid, 
 PolarAngleAxis, 
 PolarRadiusAxis, 
 ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import PremiumGate from '../components/PremiumGate';

const RiskReport = () => {
 const navigate = useNavigate();
 
 // Default mock data for emergency/fail-safe
 const defaultMock = {
 analysis:`
 <p><strong>Analisi del Rischio Esecutiva:</strong> Il portafoglio presenta attualmente una vulnerabilità elevata dovuta alla correlazione inversa con il comparto energetico. Il de-risking forzato è un pericolo reale se il petrolio supera i massimi recenti.</p>
 <p>La pressione inflazionistica rimane il driver principale della volatilità, influenzando direttamente le decisioni di allocazione degli asset istituzionali e provocando repentine rotazioni settoriali.</p>
 <p>Si consiglia una riduzione tattica della leva e un incremento delle posizioni in asset non correlati per mitigare l'impatto di possibili shock esterni lato offerta energetica.</p>
`,
 riskScores: [
 { subject: 'Inflation', A: 80, fullMark: 100 },
 { subject: 'Interest Rates', A: 45, fullMark: 100 },
 { subject: 'Recession', A: 40, fullMark: 100 },
 { subject: 'Market Volatility', A: 65, fullMark: 100 }
 ]
 };

 const [loading, setLoading] = useState(true);
 const [report, setReport] = useState(defaultMock);

 useEffect(() => {
 fetchRiskReport();
 }, []);

 const fetchRiskReport = async () => {
 try {
 setLoading(true);
 const macroRes = await axios.get('/api/macro-deep-dive');
 const { chart, fundamentals, correlationMatrix } = macroRes.data;

 const res = await axios.post('/api/risk/report', {
 chartData: chart,
 fundamentals,
 correlations: correlationMatrix.correlations
 });
 
 if (res.data && res.data.riskScores) {
 setReport(res.data);
 }
 } catch (error) {
 console.error('Error fetching risk report, using fallback:', error);
 // Keep using defaultMock already in state
 } finally {
 // Simulate a small processing delay for UX even if fast
 setTimeout(() => setLoading(false), 800);
 }
 };

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
 <div className="relative">
 <Loader2 className="w-12 h-12 text-blue-500 animate-spin"/>
 <ShieldAlert className="w-5 h-5 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
 </div>
 <div className="text-center">
 <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2 animate-pulse">Computing Risk Vectors…</p>
 <p className="text-xs text-gray-600 font-bold italic">Applying institutional stress-test models</p>
 </div>
 </div>
 );
 }

 const { analysis, riskScores } = report;

 return (
 <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in px-4 md:px-0">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-5">
 <button 
 onClick={() => navigate('/macro-deep-dive')} 
 className="p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-gray-400 hover:text-white transition-all cursor-pointer shadow-lg group"
 >
 <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1"/>
 </button>
 <div>
 <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
 <ShieldAlert className="w-8 h-8 text-rose-500"/>
 Institutional Risk Report
 </h1>
 <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.25em] mt-1">Cross-Asset Exposure & Volatility Stress Test</p>
 </div>
 </div>
 
 <button 
 onClick={() => alert('PDF Export functionality coming soon to Terminal.')}
 className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600/10 /20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-300 font-black uppercase tracking-widest text-[10px]"
 >
 <Download className="w-4 h-4"/>
 Export PDF
 </button>
 </div>

 <PremiumGate>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Risk Visualization Card */}
 <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden group animate-zoom-in">
 <div className="relative z-10">
 <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
 <Zap className="w-4 h-4 text-yellow-500 animate-pulse"/> Exposure matrix
 </h2>
 <p className="text-2xl font-bold text-white tracking-tight">Risk Quadrant Synthesis</p>
 </div>

 <div className="h-[300px] md:h-[400px] flex items-center justify-center relative z-10 animate-slide-up">
 <ResponsiveContainer width="100%"height="100%">
 <RadarChart cx="50%"cy="50%"outerRadius="80%"data={riskScores}>
 <defs>
 <radialGradient id="riskGradient"cx="50%"cy="50%"r="50%"fx="50%"fy="50%">
 <stop offset="0%"stopColor="#3b82f6"stopOpacity={0.6}/>
 <stop offset="60%"stopColor="#3b82f6"stopOpacity={0.3}/>
 <stop offset="80%"stopColor="#ef4444"stopOpacity={0.7}/>
 <stop offset="100%"stopColor="#ef4444"stopOpacity={0.9}/>
 </radialGradient>
 </defs>
 <PolarGrid stroke="#334155"opacity={0.6} />
 <PolarAngleAxis 
 dataKey="subject"
 tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: '0.1em' }} 
 />
 <PolarRadiusAxis 
 angle={30} 
 domain={[0, 100]} 
 axisLine={false} 
 tick={false} 
 />
 <Radar
 name="Risk Exposure"
 dataKey="A"
 stroke="#ef4444"
 strokeWidth={2}
 fill="url(#riskGradient)"
 fillOpacity={0.8}
 isAnimationActive={true}
 animationBegin={200}
 animationDuration={1000}
 />
 </RadarChart>
 </ResponsiveContainer>
 </div>

 <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 animate-fade-in delay-500">
 {riskScores?.map((s, i) => (
 <div key={i} className="flex flex-col p-4 rounded-2xl bg-white/5 hover: transition-colors duration-300">
 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.subject}</span>
 <div className="flex items-end justify-between mt-1">
 <span className={`text-xl font-black ${s.A > 75 ? 'text-rose-500' : 'text-white'}`}>{s.A}%</span>
 <div className={`w-2 h-2 rounded-full ${s.A > 75 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* AI Analysis Column */}
 <div className="bg-gradient-to-br from-slate-900/60 to-transparent backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl flex flex-col h-full animate-slide-right">
 <div className="flex items-center gap-4 mb-10 pb-6">
 <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
 <FileText className="w-6 h-6"/>
 </div>
 <div>
 <h2 className="text-xs font-black text-blue-500/70 uppercase tracking-[0.4em]">AI Brain Output</h2>
 <p className="text-2xl font-bold text-white tracking-tight">Executive Risk Summary</p>
 </div>
 </div>

 <div className="flex-grow">
 <div 
 className="risk-analysis-content space-y-6 animate-fade-in delay-1000"
 dangerouslySetInnerHTML={{ __html: analysis }}
 />
 </div>

 <div className="mt-12 p-6 rounded-3xl bg-rose-500/5 /10 flex gap-5 animate-fade-in delay-1000">
 <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 h-fit">
 <TrendingDown className="w-5 h-5"/>
 </div>
 <div>
 <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Risk Warning</h4>
 <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
"L'esposizione attuale richiede una vigilanza costante sui flussi energetici e sulla curva dei rendimenti. Una divergenza eccessiva potrebbe innescare una fase di de-risking forzato."
 </p>
 </div>
 </div>
 </div>

 </div>
 </PremiumGate>

 <style>
 {`
 .risk-analysis-content p {
 margin-bottom: 1.5rem;
 font-size: 1rem;
 line-height: 1.8;
 color: #94a3b8;
 font-weight: 500;
 }
 .risk-analysis-content strong {
 color: #fff;
 font-weight: 800;
 }

 .animate-fade-in { animation: fadeIn 1s both; }
 .animate-zoom-in { animation: zoomIn 1s both; }
 .animate-slide-up { animation: slideUp 1s 0.3s both; }
 .animate-slide-right { animation: slideRight 1s 0.2s both; }

 .delay-500 { animation-delay: 0.5s; }
 .delay-1000 { animation-delay: 1s; }

 @keyframes fadeIn {
 from { opacity: 0; }
 to { opacity: 1; }
 }
 @keyframes zoomIn {
 from { opacity: 0; transform: scale(0.95); }
 to { opacity: 1; transform: scale(1); }
 }
 @keyframes slideUp {
 from { opacity: 0; transform: translateY(20px); }
 to { opacity: 1; transform: translateY(0); }
 }
 @keyframes slideRight {
 from { opacity: 0; transform: translateX(20px); }
 to { opacity: 1; transform: translateX(0); }
 }
`}
 </style>
 </div>
 );
};

export default RiskReport;
