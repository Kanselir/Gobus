"use client";

// components/map/LeafletMap.tsx
// Komponen peta interaktif menggunakan Google Maps Tiles dengan pembatasan ketat wilayah Surabaya

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import type { Map as LMap } from "leaflet";
import L from "leaflet";
import { BUS_STOPS } from "@/lib/data/stops";
import { ROUTES_INFO } from "@/lib/data/routes";
import { CalculatedRoute } from "@/lib/algorithms/routeCalculator";

// Batas Geografis Wilayah Surabaya (Strict Bounds)
// Pengguna tidak dapat menggeser peta ke luar area ini
const SURABAYA_BOUNDS: L.LatLngBoundsExpression = [
  [-7.46, 112.54], // Barat Daya (Waru / Sepanjang / Benowo / Romokalisari)
  [-7.12, 112.89], // Timur Laut (Tanjung Perak / Kenjeran / Selat Madura)
];

// Opsi penyedia tile peta (Default: Google Maps Asli)
const MAP_PROVIDERS = {
  google_roadmap: {
    name: "Google Maps Jalan",
    icon: "🗺️",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=id",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  google_satellite: {
    name: "Google Satelit",
    icon: "🛰️",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=id",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps Satellite</a>',
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  osm: {
    name: "OpenStreetMap",
    icon: "🌐",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: ["a", "b", "c"],
  },
};

type MapTypeKey = keyof typeof MAP_PROVIDERS;

// Fix ikon Leaflet default
const fixLeafletIcon = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

// Ikon Pin Bergaya Google Maps (SVG Pin dengan drop shadow)
const createGoogleMapsPin = (color: string, letter: string) =>
  L.divIcon({
    className: "google-maps-pin",
    html: `
      <div style="position:relative; width:34px; height:44px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 384 512" width="34" height="44" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
          <path fill="${color}" stroke="#ffffff" stroke-width="20" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
        </svg>
        <span style="position:absolute; top:8px; color:white; font-weight:800; font-size:14px; font-family:sans-serif;">${letter}</span>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42],
  });

const iconA = createGoogleMapsPin("#34A853", "A"); // Google Green
const iconB = createGoogleMapsPin("#EA4335", "B"); // Google Red

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}
function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LeafletMapProps {
  pointA: { lat: number; lng: number } | null;
  pointB: { lat: number; lng: number } | null;
  calculatedRoute: CalculatedRoute | null;
  onMapClick: (lat: number, lng: number) => void;
}

export default function LeafletMap({
  pointA,
  pointB,
  calculatedRoute,
  onMapClick,
}: LeafletMapProps) {
  const mapRef = useRef<LMap | null>(null);
  const [mapType, setMapType] = useState<MapTypeKey>("google_roadmap");

  useEffect(() => {
    fixLeafletIcon();
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Auto-fit bounds ke rute yang dikalkulasi
  useEffect(() => {
    if (!mapRef.current || !calculatedRoute) return;
    const bounds = L.latLngBounds(calculatedRoute.polylineCoords);
    mapRef.current.fitBounds(bounds, { padding: [70, 70] });
  }, [calculatedRoute]);

  const primaryRouteColor =
    calculatedRoute && calculatedRoute.steps.find((s) => s.routeColor)?.routeColor
      ? calculatedRoute.steps.find((s) => s.routeColor)!.routeColor!
      : "#4285F4"; // Google Blue fallback

  const currentProvider = MAP_PROVIDERS[mapType];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[-7.2756, 112.7484]}
        zoom={13}
        minZoom={11}
        maxZoom={19}
        maxBounds={SURABAYA_BOUNDS}
        maxBoundsViscosity={1.0} // Peta terkunci 100% di Surabaya
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        {/* TILE LAYER GOOGLE MAPS ASLI */}
        <TileLayer
          key={mapType}
          attribution={currentProvider.attribution}
          url={currentProvider.url}
          maxZoom={currentProvider.maxZoom}
          subdomains={currentProvider.subdomains}
        />

        {/* Event handler klik */}
        <MapClickHandler onMapClick={onMapClick} />

        {/* Marker semua halte bus GOBIS */}
        {BUS_STOPS.map((stop) => {
          const isOnRoute = calculatedRoute?.path.includes(stop.id);
          const routeColor = isOnRoute
            ? stop.routes
                .map((r) => ROUTES_INFO[r]?.color)
                .filter(Boolean)[0] ?? "#4285F4"
            : "#64748b";

          return (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={isOnRoute ? 9 : 5.5}
              pathOptions={{
                color: "#ffffff",
                fillColor: routeColor,
                fillOpacity: isOnRoute ? 1 : 0.75,
                weight: isOnRoute ? 2.5 : 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="text-xs font-semibold p-1">
                  <div className="font-bold text-slate-900">{stop.name}</div>
                  <div className="text-slate-500 text-[10px]">{stop.direction}</div>
                  <div className="text-indigo-600 text-[10px] mt-0.5 font-mono">
                    Rute: {stop.routes.join(", ")}
                  </div>
                  <div className="text-slate-400 text-[9px]">
                    Pair: {stop.pair_id}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Polylines Rute Mengikuti Jalan Raya Nyata */}
        {calculatedRoute && (
          <>
            {/* 1. Jalan Kaki dari Titik A ke Halte Keberangkatan */}
            {calculatedRoute.walkToOriginGeometry && calculatedRoute.walkToOriginGeometry.length > 1 && (
              <Polyline
                positions={calculatedRoute.walkToOriginGeometry}
                pathOptions={{
                  color: "#F59E0B",
                  weight: 5,
                  opacity: 0.95,
                  dashArray: "6 6",
                }}
              />
            )}

            {/* 2. Rute Jalan Raya Bus Suroboyo (Gaya Google Maps Navigation) */}
            {calculatedRoute.busRoadGeometry && calculatedRoute.busRoadGeometry.length > 1 && (
              <>
                {/* Border kontras luar garis rute */}
                <Polyline
                  positions={calculatedRoute.busRoadGeometry}
                  pathOptions={{ color: "#0f172a", weight: 9, opacity: 0.35 }}
                />
                {/* Garis aspal rute utama */}
                <Polyline
                  positions={calculatedRoute.busRoadGeometry}
                  pathOptions={{
                    color: primaryRouteColor,
                    weight: 6,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </>
            )}

            {/* 3. Jalan Kaki dari Halte Kedatangan ke Titik B */}
            {calculatedRoute.walkFromDestGeometry && calculatedRoute.walkFromDestGeometry.length > 1 && (
              <Polyline
                positions={calculatedRoute.walkFromDestGeometry}
                pathOptions={{
                  color: "#EA4335",
                  weight: 5,
                  opacity: 0.95,
                  dashArray: "6 6",
                }}
              />
            )}
          </>
        )}

        {/* Marker Titik Awal (A) */}
        {pointA && (
          <Marker position={[pointA.lat, pointA.lng]} icon={iconA}>
            <Popup>
              <div className="text-xs p-1">
                <div className="font-bold text-emerald-700">📍 Titik Asal (A)</div>
                <div className="text-slate-600 mt-0.5">
                  {pointA.lat.toFixed(5)}, {pointA.lng.toFixed(5)}
                </div>
                {calculatedRoute && (
                  <div className="mt-1 text-slate-500 border-t pt-1">
                    Halte terdekat: <strong>{calculatedRoute.originStop.name}</strong>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Titik Tujuan (B) */}
        {pointB && (
          <Marker position={[pointB.lat, pointB.lng]} icon={iconB}>
            <Popup>
              <div className="text-xs p-1">
                <div className="font-bold text-rose-700">🏁 Titik Tujuan (B)</div>
                <div className="text-slate-600 mt-0.5">
                  {pointB.lat.toFixed(5)}, {pointB.lng.toFixed(5)}
                </div>
                {calculatedRoute && (
                  <div className="mt-1 text-slate-500 border-t pt-1">
                    Halte terdekat: <strong>{calculatedRoute.destinationStop.name}</strong>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* FLOATING MAP TYPE SWITCHER (Ala Google Maps) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 p-1 flex items-center gap-1 text-xs">
        {(Object.keys(MAP_PROVIDERS) as MapTypeKey[]).map((key) => {
          const provider = MAP_PROVIDERS[key];
          const isActive = mapType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMapType(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{provider.icon}</span>
              <span className="hidden sm:inline">{provider.name}</span>
            </button>
          );
        })}
      </div>

      {/* BADGE PEMBATASAN WILAYAH SURABAYA */}
      <div className="absolute bottom-4 right-4 z-[400] bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full font-medium pointer-events-none">
        🔒 Area Terkunci: Wilayah Surabaya
      </div>
    </div>
  );
}
