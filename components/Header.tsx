"use client";

// components/Header.tsx
// Navbar atas aplikasi

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white shadow-md z-[500] relative">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">
            🚌
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none">
              Suroboyo Bus Navigator
            </h1>
            <p className="text-[10px] opacity-75 font-medium tracking-wide">
              Gobis Surabaya • Real-time Route Finder
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-400/20 border border-green-300/30 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-green-200">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
