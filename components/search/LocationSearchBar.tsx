"use client";

// components/search/LocationSearchBar.tsx
// Komponen bar pencarian lokasi ala Google Maps dengan autocomplete

import { useState, useEffect, useRef } from "react";
import { searchPlaces, SearchResult, POPULAR_SURABAYA_PLACES } from "@/lib/services/geocoding";
import { BUS_STOPS } from "@/lib/data/stops";

interface LocationPoint {
  lat: number;
  lng: number;
  name?: string;
}

interface LocationSearchBarProps {
  pointA: LocationPoint | null;
  pointB: LocationPoint | null;
  onSelectPointA: (point: LocationPoint | null) => void;
  onSelectPointB: (point: LocationPoint | null) => void;
  onSwapPoints: () => void;
  isLoading: boolean;
}

export default function LocationSearchBar({
  pointA,
  pointB,
  onSelectPointA,
  onSelectPointB,
  onSwapPoints,
  isLoading,
}: LocationSearchBarProps) {
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [resultsA, setResultsA] = useState<SearchResult[]>([]);
  const [resultsB, setResultsB] = useState<SearchResult[]>([]);
  const [activeInput, setActiveInput] = useState<"A" | "B" | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sinkronkan input text ketika marker diubah dari klik peta
  useEffect(() => {
    if (pointA) {
      setQueryA(pointA.name || `${pointA.lat.toFixed(4)}, ${pointA.lng.toFixed(4)}`);
    } else {
      setQueryA("");
    }
  }, [pointA]);

  useEffect(() => {
    if (pointB) {
      setQueryB(pointB.name || `${pointB.lat.toFixed(4)}, ${pointB.lng.toFixed(4)}`);
    } else {
      setQueryB("");
    }
  }, [pointB]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveInput(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search untuk Input A
  useEffect(() => {
    if (activeInput !== "A") return;
    if (!queryA || queryA.trim().length < 2) {
      setResultsA(POPULAR_SURABAYA_PLACES.slice(0, 5));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchPlaces(queryA);
      setResultsA(res);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [queryA, activeInput]);

  // Debounced search untuk Input B
  useEffect(() => {
    if (activeInput !== "B") return;
    if (!queryB || queryB.trim().length < 2) {
      setResultsB(POPULAR_SURABAYA_PLACES.slice(0, 5));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchPlaces(queryB);
      setResultsB(res);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [queryB, activeInput]);

  // Handle GPS lokasi saat ini
  const handleUseCurrentLocation = (type: "A" | "B") => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "Lokasi Saya Saat Ini (GPS)",
        };
        if (type === "A") {
          onSelectPointA(point);
          setQueryA("Lokasi Saya Saat Ini (GPS)");
        } else {
          onSelectPointB(point);
          setQueryB("Lokasi Saya Saat Ini (GPS)");
        }
        setActiveInput(null);
      },
      () => {
        alert("Gagal mengakses lokasi GPS Anda. Pastikan izin lokasi diaktifkan.");
      }
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "station":
        return "🚆";
      case "stop":
        return "🚏";
      case "mall":
        return "🛍️";
      case "campus":
        return "🎓";
      case "landmark":
        return "🏛️";
      default:
        return "📍";
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-3 z-[450] w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 p-3 transition-all"
    >
      <div className="flex flex-col gap-2 relative">
        {/* Tombol Swap A <-> B */}
        <button
          onClick={onSwapPoints}
          title="Tukar Titik A dan Titik B"
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          ⇅
        </button>

        {/* INPUT A: Titik Asal */}
        <div className="relative flex items-center">
          <div className="w-7 flex items-center justify-center flex-shrink-0">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow flex-shrink-0" />
          </div>
          <input
            type="text"
            value={queryA}
            onChange={(e) => setQueryA(e.target.value)}
            onFocus={() => {
              setActiveInput("A");
              if (!queryA) setResultsA(POPULAR_SURABAYA_PLACES.slice(0, 5));
            }}
            placeholder="Ketik lokasi asal (A)..."
            className="w-full text-xs sm:text-sm py-2 pl-1 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
          />
          {queryA && (
            <button
              onClick={() => {
                setQueryA("");
                onSelectPointA(null);
              }}
              className="absolute right-10 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Garis pemisah konektor */}
        <div className="ml-3.5 h-2 w-0.5 border-l-2 border-dashed border-slate-300" />

        {/* INPUT B: Titik Tujuan */}
        <div className="relative flex items-center">
          <div className="w-7 flex items-center justify-center flex-shrink-0">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow flex-shrink-0" />
          </div>
          <input
            type="text"
            value={queryB}
            onChange={(e) => setQueryB(e.target.value)}
            onFocus={() => {
              setActiveInput("B");
              if (!queryB) setResultsB(POPULAR_SURABAYA_PLACES.slice(0, 5));
            }}
            placeholder="Ketik lokasi tujuan (B)..."
            className="w-full text-xs sm:text-sm py-2 pl-1 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
          />
          {queryB && (
            <button
              onClick={() => {
                setQueryB("");
                onSelectPointB(null);
              }}
              className="absolute right-10 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      {!activeInput && !pointA && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cepat:</span>
          {["Purabaya", "Perak", "ITS", "Tunjungan", "Romokalisari"].map((place) => (
            <button
              key={place}
              type="button"
              onClick={() => {
                const found =
                  BUS_STOPS.find((s) => s.name.toLowerCase().includes(place.toLowerCase())) ||
                  POPULAR_SURABAYA_PLACES.find((p) => p.name.toLowerCase().includes(place.toLowerCase()));
                if (found) {
                  onSelectPointA({ lat: found.lat, lng: found.lng, name: found.name });
                  setQueryA(found.name);
                }
              }}
              className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-0.5 rounded-md transition-colors font-medium border border-slate-200/60"
            >
              {place}
            </button>
          ))}
        </div>
      )}

      {/* AUTOCOMPLETE DROPDOWN */}
      {activeInput && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 max-h-64 overflow-y-auto">
          {/* Tombol Gunakan GPS */}
          <button
            type="button"
            onClick={() => handleUseCurrentLocation(activeInput)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-colors text-left"
          >
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🎯</span>
            <div className="flex-1">
              <div>Gunakan Lokasi Saya Saat Ini</div>
              <div className="text-[10px] text-indigo-400 font-normal">Akurasi GPS perangkat</div>
            </div>
          </button>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mt-1">
            {isSearching ? "Mencari lokasi di Surabaya..." : "Saran Lokasi Surabaya"}
          </div>

          {(activeInput === "A" ? resultsA : resultsB).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const point = { lat: item.lat, lng: item.lng, name: item.name };
                if (activeInput === "A") {
                  onSelectPointA(point);
                  setQueryA(item.name);
                } else {
                  onSelectPointB(point);
                  setQueryB(item.name);
                }
                setActiveInput(null);
              }}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-100 text-left transition-colors border-b border-slate-50 last:border-b-0"
            >
              <span className="text-base flex-shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {item.address}
                </div>
              </div>
            </button>
          ))}

          {(activeInput === "A" ? resultsA : resultsB).length === 0 && !isSearching && (
            <div className="p-3 text-center text-xs text-slate-400">
              Tidak ada lokasi ditemukan. Anda juga bisa langsung klik di peta!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
