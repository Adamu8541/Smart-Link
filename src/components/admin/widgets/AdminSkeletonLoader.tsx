/**
 * SmartLink Admin Panel — Reusable Skeleton Loader Components (Module 2)
 */

import React from "react";

export function AdminStatSkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 bg-slate-800 rounded-md" />
        <div className="h-8 w-8 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-7 w-32 bg-slate-800 rounded-lg" />
      <div className="h-3 w-40 bg-slate-800/60 rounded-md" />
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-slate-900 border border-slate-800 rounded-xl w-full" />
      {[1, 2, 3, 4, 5].map((idx) => (
        <div key={idx} className="h-14 bg-slate-900/60 border border-slate-800/60 rounded-2xl w-full flex items-center justify-between px-4 gap-4">
          <div className="h-4 w-12 bg-slate-800 rounded" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-6 w-20 bg-slate-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded-lg" />
          <div className="h-3.5 w-64 bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-28 bg-slate-800 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-6 w-28 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
