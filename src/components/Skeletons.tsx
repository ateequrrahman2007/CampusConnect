import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs animate-pulse duration-700">
      <div className="w-full h-44 bg-slate-200 rounded-xl mb-4"></div>
      <div className="h-4 bg-slate-200 rounded-sm w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded-sm w-1/2 mb-4"></div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
        <div className="h-5 bg-slate-200 rounded-sm w-16"></div>
        <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <tr className="border-b border-slate-100 animate-pulse duration-700">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded-sm w-32 mb-1"></div>
        <div className="h-3 bg-slate-200 rounded-sm w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded-sm w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-slate-200 rounded-full w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded-sm w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
      </td>
    </tr>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="flex gap-4 pb-8 animate-pulse duration-700">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
        <div className="w-0.5 h-16 bg-slate-200"></div>
      </div>
      <div className="flex-1 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
        <div className="h-4 bg-slate-200 rounded-sm w-2/3 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded-sm w-full mb-3"></div>
        <div className="h-3 bg-slate-200 rounded-sm w-1/3"></div>
      </div>
    </div>
  );
}
