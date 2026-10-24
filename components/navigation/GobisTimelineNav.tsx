"use client";

// components/navigation/GobisTimelineNav.tsx
// Komponen Timeline Navigasi & Real-Time ETA Suroboyo Bus (Tailwind CSS)

import { useState } from "react";
import { RoutingResult, JourneyStep } from "@/lib/types/gobis";

interface GobisTimelineNavProps {
  routeResult: RoutingResult | null;
  isLoading: boolean;
  onReset?: () => void;
}

export default function GobisTimelineNav({
  routeResult,
  isLoading,
  onReset,
}: GobisTimelineNavProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-700 font-semibold text-sm">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Mengkalkulasi rute transit & jadwal bus…</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border border-slate-200 rounded-xl space-y-2 animate-pulse bg-slate-50">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!routeResult) {
    return (
      <div className="p-6 text-center text-slate-500 space-y-3">
        <div className="text-4xl">🚌</div>
        <div className="font-bold text-slate-800 text-sm">Belum Ada Rute Aktif</div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Pilih lokasi keberangkatan dan tujuan untuk melihat kalkulasi jalur transit serta estimasi kedatangan bus (ETA).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* HEADER RINGKASAN PERJALANAN */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 text-white p-4 shadow-md flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Hasil Rute GOBIS
          </span>
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-white/80 hover:text-white underline font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Ringkasan Durasi & Jam Tiba */}
        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              {routeResult.totalDurationMinutes} <span className="text-sm font-semibold opacity-90">menit</span>
            </div>
            <div className="text-xs text-indigo-100 flex items-center gap-1.5 mt-0.5">
              <span>{routeResult.departureTime}</span>
              <span>→</span>
              <span className="font-bold text-white bg-indigo-500/40 px-1.5 py-0.5 rounded">
                Tiba {routeResult.estimatedArrivalTime}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-white">
              {routeResult.totalDistanceKm.toFixed(1)} km
            </div>
            <div className="text-[11px] text-indigo-200">Total Jarak</div>
          </div>
        </div>

        {/* Tags Indikator: Transit / Crossing */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/15">
          {routeResult.hasTransit ? (
            <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span>🔄</span> Transit Rute
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-400 text-slate-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span>⚡</span> Rute Langsung
            </span>
          )}

          {routeResult.hasCrossing && (
            <span className="text-[10px] bg-rose-400 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span>🚸</span> Seberang Jalan (Pair)
            </span>
          )}
        </div>
      </div>

      {/* TIMELINE STEP-BY-STEP */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {routeResult.steps.map((step, idx) => {
          const isExpanded = expandedStepId === step.id;
          return (
            <div key={step.id} className="relative flex gap-3 text-slate-800">
              {/* Garis vertikal timeline */}
              {idx < routeResult.steps.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 -z-0" />
              )}

              {/* Icon Marker */}
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-white">
                {step.type === "walk_to_stop" && (
                  <span className="bg-amber-100 text-amber-700 w-full h-full rounded-full flex items-center justify-center">
                    🚶
                  </span>
                )}
                {step.type === "ride_bus" && (
                  <span className="bg-indigo-600 text-white w-full h-full rounded-full flex items-center justify-center">
                    🚌
                  </span>
                )}
                {step.type === "transit_transfer" && (
                  <span className="bg-amber-500 text-white w-full h-full rounded-full flex items-center justify-center">
                    🔄
                  </span>
                )}
                {step.type === "cross_street" && (
                  <span className="bg-rose-500 text-white w-full h-full rounded-full flex items-center justify-center">
                    🚸
                  </span>
                )}
                {step.type === "walk_to_destination" && (
                  <span className="bg-emerald-600 text-white w-full h-full rounded-full flex items-center justify-center">
                    🏁
                  </span>
                )}
              </div>

              {/* Konten Card Step */}
              <div className="flex-1 min-w-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {step.instruction}
                    </div>
                  </div>
                  {step.departureTime && (
                    <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex-shrink-0">
                      {step.departureTime}
                    </span>
                  )}
                </div>

                {/* REAL-TIME ETA BADGE (Khusus Step Bus) */}
                {step.type === "ride_bus" && step.eta && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                          Live ETA Kedatangan
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Headway: ~{step.eta.headwayMinutes} mnt
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <div className="text-sm font-extrabold text-indigo-900">
                          {step.eta.statusText}
                        </div>
                      </div>

                      {/* Jadwal kedatangan berikutnya */}
                      {step.eta.scheduledArrivals.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-600 mt-1">
                          <span className="text-slate-400">Jadwal berikutnya:</span>
                          {step.eta.scheduledArrivals.slice(0, 3).map((jam, i) => (
                            <span
                              key={i}
                              className="bg-white px-1.5 py-0.5 rounded font-mono font-semibold text-indigo-700 border border-indigo-200 shadow-2xs"
                            >
                              {jam}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Halte yang dilewati (Collapsible) */}
                    {step.passedStops && step.passedStops.length > 1 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <span>{isExpanded ? "▲ Sembunyikan" : "▼ Lihat"}</span>
                          <span>{step.passedStops.length} halte yang dilewati</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 pl-2 border-l-2 border-indigo-100 space-y-1">
                            {step.passedStops.map((ps, psIdx) => (
                              <div
                                key={ps.id}
                                className="text-[11px] text-slate-600 flex items-center justify-between py-0.5"
                              >
                                <span className={psIdx === 0 || psIdx === step.passedStops!.length - 1 ? "font-bold text-slate-900" : ""}>
                                  {ps.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  +{ps.time_from_origin_mins}m
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Informasi Transit Penyeberangan Jalan (Pair ID) */}
                {step.type === "cross_street" && step.crossingPairId && (
                  <div className="mt-2 text-[10px] bg-rose-50 border border-rose-200 text-rose-700 rounded-md p-2">
                    ⚠️ <strong>Harap berhati-hati:</strong> Gunakan jembatan penyeberangan orang (JPO) atau zebra cross untuk menyeberang ke halte seberang.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
