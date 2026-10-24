"use client";

// components/ads/BannerAd.tsx
// Komponen iklan banner statis di bagian bawah layar

export default function BannerAd() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-3 py-2 flex items-center justify-between gap-4">
        {/* Label iklan */}
        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest flex-shrink-0 border border-gray-300 px-1.5 py-0.5 rounded">
          Iklan
        </span>

        {/* Konten iklan */}
        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            🏪
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-800 truncate">
              Promo Spesial! Diskon 50% di Merchant Partner Suroboyo Bus
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              Tunjukkan kartu Suroboyo Bus Anda dan dapatkan diskon eksklusif.
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
          Lihat Promo
        </button>
      </div>
    </div>
  );
}
