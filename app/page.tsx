"use client";

// app/page.tsx
// Halaman utama aplikasi Suroboyo Bus Navigator dengan Pencarian Ala Google Maps & Geometri Jalan Nyata

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import RoutePanel from "@/components/RoutePanel";
import BannerAd from "@/components/ads/BannerAd";
import InterstitialAd from "@/components/ads/InterstitialAd";
import RouteLegend from "@/components/RouteLegend";
import LocationSearchBar from "@/components/search/LocationSearchBar";
import { calculateRoute, CalculatedRoute } from "@/lib/algorithms/routeCalculator";
import { getNearestPlaceName } from "@/lib/services/geocoding";

// Dynamic import peta (SSR disabled)
const MapWrapper = dynamic(() => import("@/components/map/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Memuat peta Surabaya…</span>
      </div>
    </div>
  ),
});

type ClickStep = "A" | "B";

interface Point {
  lat: number;
  lng: number;
  name?: string;
}

export default function HomePage() {
  const [clickStep, setClickStep] = useState<ClickStep>("A");
  const [pointA, setPointA] = useState<Point | null>(null);
  const [pointB, setPointB] = useState<Point | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);

  /**
   * Fungsi inti kalkulasi rute dengan delay simulasi interstitial ad
   */
  const executeRouteCalculation = useCallback(
    async (start: Point, end: Point) => {
      setIsLoading(true);
      setShowInterstitial(true);
      setCalculatedRoute(null);

      // Simulasi delay interstitial iklan (2-3 detik)
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 800)
      );

      // Ambil rute jalan raya asli (OSRM + Dijkstra)
      const route = await calculateRoute(start, end);
      setCalculatedRoute(route);
      setIsLoading(false);
      setShowInterstitial(false);
    },
    []
  );

  /**
   * Handler saat pengguna mengklik peta
   */
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (isLoading) return;
      const placeName = getNearestPlaceName(lat, lng);

      if (clickStep === "A" || !pointA) {
        const newPointA: Point = { lat, lng, name: placeName };
        setPointA(newPointA);
        setCalculatedRoute(null);
        setClickStep("B");

        // Jika Point B sudah ada, langsung kalkulasi
        if (pointB) {
          executeRouteCalculation(newPointA, pointB);
        }
        return;
      }

      // Point B dipilih via klik peta
      const newPointB: Point = { lat, lng, name: placeName };
      setPointB(newPointB);
      setClickStep("A");

      if (pointA) {
        executeRouteCalculation(pointA, newPointB);
      }
    },
    [clickStep, isLoading, pointA, pointB, executeRouteCalculation]
  );

  /**
   * Handler pemilihan lokasi dari Search Bar
   */
  const handleSelectPointA = useCallback(
    (point: Point | null) => {
      setPointA(point);
      setCalculatedRoute(null);
      if (point && pointB) {
        executeRouteCalculation(point, pointB);
      } else if (point) {
        setClickStep("B");
      }
    },
    [pointB, executeRouteCalculation]
  );

  const handleSelectPointB = useCallback(
    (point: Point | null) => {
      setPointB(point);
      setCalculatedRoute(null);
      if (pointA && point) {
        executeRouteCalculation(pointA, point);
      }
    },
    [pointA, executeRouteCalculation]
  );

  /**
   * Tukar posisi Titik A dan Titik B
   */
  const handleSwapPoints = useCallback(() => {
    if (!pointA && !pointB) return;
    const tempA = pointA;
    const tempB = pointB;
    setPointA(tempB);
    setPointB(tempA);
    setCalculatedRoute(null);

    if (tempA && tempB) {
      executeRouteCalculation(tempB, tempA);
    }
  }, [pointA, pointB, executeRouteCalculation]);

  /**
   * Reset semua state ke kondisi awal
   */
  const handleReset = useCallback(() => {
    setPointA(null);
    setPointB(null);
    setCalculatedRoute(null);
    setIsLoading(false);
    setShowInterstitial(false);
    setClickStep("A");
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header / Navbar */}
      <Header />

      {/* Bar status instruksi */}
      <div
        className={`text-center text-xs font-semibold py-1.5 px-4 transition-colors z-20 ${
          isLoading
            ? "bg-indigo-100 text-indigo-700 border-b border-indigo-200"
            : !pointA
            ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
            : !pointB
            ? "bg-amber-50 text-amber-800 border-b border-amber-200"
            : "bg-indigo-50 text-indigo-700 border-b border-indigo-200"
        }`}
      >
        {isLoading
          ? "⏳ Menelusuri jalur jalan raya nyata Surabaya & jadwal bus…"
          : !pointA
          ? "🟢 Ketik lokasi asal di pencarian atau klik titik asal (A) di peta"
          : !pointB
          ? "🔴 Ketik lokasi tujuan atau klik titik tujuan (B) di peta"
          : "✨ Rute aktif terpasang pada jaringan jalan Surabaya"}
      </div>

      {/* Konten utama: Peta + Panel */}
      <div className="flex flex-1 min-h-0 relative pb-14">
        {/* Kolom Peta (kiri / utama) */}
        <div className="relative flex-1 min-w-0 h-full">
          {/* SEARCH BAR ALA GOOGLE MAPS */}
          <LocationSearchBar
            pointA={pointA}
            pointB={pointB}
            onSelectPointA={handleSelectPointA}
            onSelectPointB={handleSelectPointB}
            onSwapPoints={handleSwapPoints}
            isLoading={isLoading}
          />

          {/* Komponen Peta Interaktif */}
          <MapWrapper
            pointA={pointA}
            pointB={pointB}
            calculatedRoute={calculatedRoute}
            onMapClick={handleMapClick}
          />

          {/* Legenda rute (overlay di kanan atas peta) */}
          <RouteLegend />

          {/* Petunjuk melayang jika belum ada titik */}
          {!pointA && !pointB && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/20 animate-pulse">
                🔍 Ketik lokasi di kotak pencarian atau ketuk peta
              </div>
            </div>
          )}
        </div>

        {/* Panel navigasi (kanan) */}
        <div className="w-80 lg:w-96 border-l border-gray-200 bg-white flex flex-col shadow-xl overflow-hidden z-30">
          <RoutePanel
            calculatedRoute={calculatedRoute}
            isLoading={isLoading}
            pointA={pointA}
            pointB={pointB}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* Banner Ad bawah */}
      <BannerAd />

      {/* Interstitial Ad (muncul sesaat saat loading kalkulasi) */}
      <InterstitialAd isVisible={showInterstitial} />
    </div>
  );
}
