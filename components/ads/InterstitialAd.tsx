"use client";

// components/ads/InterstitialAd.tsx
// Modal iklan interstitial yang muncul saat loading rute

import { useEffect, useState } from "react";

interface InterstitialAdProps {
  isVisible: boolean;
}

const AD_CONTENT = [
  {
    emoji: "🎟️",
    title: "Kartu Suroboyo Bus",
    subtitle: "Isi ulang saldo & nikmati perjalanan tanpa antri!",
    cta: "Beli Sekarang",
    gradient: "from-indigo-600 to-purple-700",
    badge: "PROMO",
  },
  {
    emoji: "🛵",
    title: "GoFood & GrabFood",
    subtitle: "Pesan makan sambil menunggu bus berikutnya!",
    cta: "Pesan Sekarang",
    gradient: "from-green-500 to-teal-600",
    badge: "PARTNER",
  },
  {
    emoji: "🏨",
    title: "Hotel di Surabaya",
    subtitle: "Penginapan terbaik dengan harga terjangkau",
    cta: "Cek Harga",
    gradient: "from-orange-500 to-red-600",
    badge: "HEMAT",
  },
];

export default function InterstitialAd({ isVisible }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(3);
  const [ad] = useState(() => AD_CONTENT[Math.floor(Math.random() * AD_CONTENT.length)]);

  // Reset dan mulai countdown ketika modal muncul
  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      return;
    }
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-80 max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header gradient */}
        <div
          className={`bg-gradient-to-br ${ad.gradient} p-6 flex flex-col items-center text-white text-center`}
        >
          {/* Badge */}
          <span className="bg-white/20 text-white text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-full mb-3">
            {ad.badge}
          </span>

          {/* Emoji besar */}
          <div className="text-7xl mb-3 drop-shadow-lg">{ad.emoji}</div>

          {/* Judul */}
          <h2 className="text-xl font-extrabold leading-tight mb-1">{ad.title}</h2>
          <p className="text-sm opacity-90">{ad.subtitle}</p>

          {/* CTA */}
          <button className="mt-4 bg-white text-indigo-700 font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform text-sm">
            {ad.cta}
          </button>
        </div>

        {/* Footer: info loading + countdown */}
        <div className="bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Sedang menghitung rute…</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: `conic-gradient(#6366f1 ${((3 - countdown) / 3) * 360}deg, #e2e8f0 0deg)`,
              }}
            >
              &nbsp;
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {countdown > 0 ? `${countdown}s` : "✓"}
            </span>
          </div>
        </div>

        {/* Label iklan */}
        <div className="absolute top-2 right-2 bg-black/30 text-white text-[9px] px-1.5 py-0.5 rounded font-medium tracking-wide">
          IKLAN
        </div>
      </div>
    </div>
  );
}
