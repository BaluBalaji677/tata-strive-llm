import React from 'react';

export const SidebarSkeleton = () => (
  <div className="flex flex-col h-full bg-slate-900 border-r border-white/10 animate-pulse p-4">
    <div className="h-6 bg-slate-800 rounded w-1/2 mb-6"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-2">
          <div className="h-10 bg-slate-800/50 rounded w-full"></div>
          <div className="h-8 bg-slate-800/30 rounded w-5/6 ml-4"></div>
          <div className="h-8 bg-slate-800/30 rounded w-4/6 ml-4"></div>
        </div>
      ))}
    </div>
  </div>
);

export const TaskSkeleton = () => (
  <div className="flex h-full flex-col lg:flex-row bg-[#0b0f19] animate-pulse">
    <div className="w-full lg:w-1/3 p-5 border-r border-white/10">
      <div className="h-8 bg-slate-800 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-800/60 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-800/60 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-slate-800/60 rounded w-4/6 mb-6"></div>
      <div className="h-6 bg-slate-800/50 rounded w-1/2 mb-3"></div>
      <div className="h-20 bg-slate-800/30 rounded w-full"></div>
    </div>
    <div className="flex-1 p-5">
      <div className="h-full bg-slate-800/30 rounded-xl"></div>
    </div>
  </div>
);

export const ContentSkeleton = () => (
  <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col animate-pulse">
    <div className="h-10 bg-slate-800 rounded w-1/2 mb-8"></div>
    <div className="space-y-4">
      <div className="h-4 bg-slate-800/60 rounded w-full"></div>
      <div className="h-4 bg-slate-800/60 rounded w-full"></div>
      <div className="h-4 bg-slate-800/60 rounded w-5/6"></div>
      <div className="h-40 bg-slate-800/30 rounded w-full mt-8"></div>
    </div>
  </div>
);
