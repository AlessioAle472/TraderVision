import React from 'react';

/**
 * Skeleton loader components for premium loading states.
 * Replaces spinner/text placeholders with animated shimmer blocks.
 */

/** Single skeleton row for market tables */
export const SkeletonRow = () => (
 <tr className="/20">
 <td className="p-4 w-10">
 <div className="skeleton w-5 h-5 rounded-lg"/>
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="skeleton w-9 h-9 rounded-xl"/>
 <div className="space-y-2">
 <div className="skeleton w-20 h-3"/>
 <div className="skeleton w-14 h-2"/>
 </div>
 </div>
 </td>
 <td className="p-4 text-right">
 <div className="skeleton w-16 h-4 ml-auto"/>
 </td>
 <td className="p-4 text-right">
 <div className="skeleton w-14 h-4 ml-auto"/>
 </td>
 <td className="p-4">
 <div className="flex justify-center">
 <div className="skeleton w-24 h-3"/>
 </div>
 </td>
 <td className="p-4">
 <div className="flex justify-center">
 <div className="skeleton w-28 h-8 rounded-lg"/>
 </div>
 </td>
 <td className="p-4 text-center">
 <div className="skeleton w-12 h-6 mx-auto rounded-xl"/>
 </td>
 </tr>
);

/** KPI card skeleton */
export const SkeletonCard = () => (
 <div className="bg-surface p-6 rounded-2xl shadow-xl">
 <div className="skeleton w-28 h-3 mb-4"/>
 <div className="skeleton w-20 h-7 mb-2"/>
 <div className="skeleton w-16 h-3"/>
 </div>
);

/** Chart area skeleton */
export const SkeletonChart = () => (
 <div className="bg-surface rounded-2xl overflow-hidden shadow-xl">
 <div className="p-4 flex justify-between items-center">
 <div className="skeleton w-40 h-4"/>
 <div className="skeleton w-24 h-3"/>
 </div>
 <div className="p-4">
 <div className="skeleton w-full h-[360px]"/>
 </div>
 </div>
);

/** Inline skeleton block */
export const SkeletonBlock = ({ width = 'w-full', height = 'h-4', className = '' }) => (
 <div className={`skeleton ${width} ${height} ${className}`} />
);
