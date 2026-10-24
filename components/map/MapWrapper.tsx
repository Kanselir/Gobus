"use client";

// components/map/MapWrapper.tsx
// Dynamic import wrapper untuk React Leaflet (SSR disabled)

import dynamic from "next/dynamic";
import { CalculatedRoute } from "@/lib/algorithms/routeCalculator";

// Leaflet hanya bisa jalan di browser (butuh window/document)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Memuat peta…</span>
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  pointA: { lat: number; lng: number } | null;
  pointB: { lat: number; lng: number } | null;
  calculatedRoute: CalculatedRoute | null;
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <LeafletMap {...props} />;
}
