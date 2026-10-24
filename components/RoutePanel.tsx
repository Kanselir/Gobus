"use client";

// components/RoutePanel.tsx
// Panel hasil rute dengan integrasi GobisTimelineNav & real-time ETA

import { CalculatedRoute } from "@/lib/algorithms/routeCalculator";
import GobisTimelineNav from "./navigation/GobisTimelineNav";

interface RoutePanelProps {
  calculatedRoute: CalculatedRoute | null;
  isLoading: boolean;
  pointA: { lat: number; lng: number } | null;
  pointB: { lat: number; lng: number } | null;
  onReset: () => void;
}

export default function RoutePanel({
  calculatedRoute,
  isLoading,
  pointA,
  pointB,
  onReset,
}: RoutePanelProps) {
  // State: Belum ada titik sama sekali
  if (!pointA && !pointB) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 gap-4">
        <div className="text-5xl">🗺️</div>
        <h3 className="font-bold text-slate-800 text-base">Navigasi Suroboyo Bus</h3>
        <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
          Ketik lokasi asal & tujuan di kotak pencarian atau ketuk langsung di peta Surabaya.
        </p>
        <div className="bg-indigo-50/80 rounded-xl p-3.5 w-full text-left space-y-2 border border-indigo-100 text-xs text-indigo-700">
          <p className="font-bold text-indigo-900">✨ Fitur GOBIS v1.1-timed:</p>
          <p>• ⏱️ Estimasi Waktu Kedatangan (ETA) bus real-time</p>
          <p>• 🚌 Dukungan rute transit (ganti rute antar koridor)</p>
          <p>• 🚸 Deteksi menyeberang jalan ke platform seberang (pair_id)</p>
        </div>
      </div>
    );
  }

  // State: Point A dipilih, menunggu Point B
  if (pointA && !pointB) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 gap-4">
        <div className="text-4xl animate-bounce">📍</div>
        <h3 className="font-bold text-slate-800 text-base">Titik Asal Dipilih</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Ketik atau ketuk di peta untuk menentukan <strong className="text-rose-600">Titik Tujuan (B)</strong>.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 w-full text-left text-xs">
          <div className="font-bold text-emerald-800">🟢 Asal:</div>
          <div className="text-emerald-700 truncate mt-0.5">
            {pointA.lat.toFixed(5)}, {pointA.lng.toFixed(5)}
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors font-medium"
        >
          Batal & Reset
        </button>
      </div>
    );
  }

  // State: Loading kalkulasi rute
  if (isLoading) {
    return <GobisTimelineNav routeResult={null} isLoading={true} />;
  }

  // State: Rute berhasil ditemukan
  if (calculatedRoute && calculatedRoute.routingResult) {
    return (
      <GobisTimelineNav
        routeResult={calculatedRoute.routingResult}
        isLoading={false}
        onReset={onReset}
      />
    );
  }

  // State: Error / tidak ditemukan
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 gap-4">
      <div className="text-4xl">😕</div>
      <h3 className="font-bold text-slate-800 text-base">Rute Tidak Ditemukan</h3>
      <p className="text-slate-500 text-xs">
        Tidak ditemukan jalur bus yang menghubungkan kedua titik tersebut. Coba pilih lokasi lain.
      </p>
      <button
        onClick={onReset}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
      >
        Coba Lokasi Lain
      </button>
    </div>
  );
}
