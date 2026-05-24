import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const Sparkline = ({ data, isPositive }) => {
 if (!data || data.length < 2) {
 return <div className="h-8 w-24 bg-slate-800/20 rounded animate-pulse"/>;
 }

 const chartData = data.map((val, idx) => ({ value: val, id: idx }));
 const color = isPositive ? '#22c55e' : '#ef4444';
 const gradientId =`sparklineGradient-${Math.random().toString(36).substr(2, 9)}`;

 return (
 <div className="h-10 w-28">
 <ResponsiveContainer width="100%"height="100%">
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id={gradientId} x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor={color} stopOpacity={0.3} />
 <stop offset="95%"stopColor={color} stopOpacity={0} />
 </linearGradient>
 </defs>
 <Area
 type="monotone"
 dataKey="value"
 stroke={color}
 strokeWidth={1.5}
 fill={`url(#${gradientId})`}
 dot={false}
 isAnimationActive={false}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
};

export default Sparkline;
