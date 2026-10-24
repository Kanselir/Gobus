"use client";

// components/RouteLegend.tsx
// Legenda rute di sudut peta

import { ROUTES_INFO } from "@/lib/data/routes";

export default function RouteLegend() {
  return (
    <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
        Legenda Rute
      </p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {Object.values(ROUTES_INFO).map((route) => (
          <div key={route.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-3 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: route.color }}
              />
              <span className="text-[10px] text-gray-700 font-semibold truncate max-w-[140px]">
                {route.id}
              </span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
              ~{route.headwayMinutes}m
            </span>
          </div>
        ))}
        <hr className="border-gray-100 my-1" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm flex-shrink-0" />
          <span className="text-[11px] text-gray-500">Titik Halte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 flex-shrink-0" />
          <span className="text-[11px] text-gray-500">Jalan Kaki</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 rounded bg-indigo-600 flex-shrink-0" />
          <span className="text-[11px] text-gray-500">Jalan Raya Bus</span>
        </div>
      </div>
    </div>
  );
}
