// lib/data/routes.ts
// Informasi dan pemetaan rute Suroboyo Bus dari Master Data GOBIS v2.0-complete

import masterData from "./gobisMasterData.json";
import { RouteDefinition, OperationalHours } from "@/lib/types/gobis";

export interface RouteInfo {
  id: string;
  name: string;
  color: string;
  type: string;
  description: string;
  headwayMinutes: number;
  operationalHours: OperationalHours;
}

const ROUTE_COLORS: Record<string, string> = {
  "SB-R1": "#dc2626",    // Merah Cerah (Purabaya -> Perak)
  "SB-R2": "#991b1b",    // Merah Marun (Perak -> Purabaya)
  "SB-R4_A": "#2563eb",  // Biru Terang (Purabaya -> PENS)
  "SB-R4_B": "#0284c7",  // Biru Cyan (PENS -> Purabaya)
  "SB-SBT_A": "#d97706", // Oranye Emas (SBT Purabaya -> Pirngadi)
  "SB-SBT_B": "#ea580c", // Oranye Tua (SBT Alun Contong -> Purabaya)
  "SB-WKND": "#059669",  // Hijau Zamrud (TIJ -> Romokalisari Wisata)
};

const DEFAULT_OPERATIONAL_HOURS: Record<string, OperationalHours> = {
  "SB-R1": { start: "05:30", end: "21:00" },
  "SB-R2": { start: "05:30", end: "21:00" },
  "SB-R4_A": { start: "05:30", end: "21:00" },
  "SB-R4_B": { start: "05:30", end: "21:00" },
  "SB-SBT_A": { start: "07:00", end: "19:00" },
  "SB-SBT_B": { start: "07:00", end: "19:00" },
  "SB-WKND": { start: "08:00", end: "17:00" }, // Khusus Akhir Pekan
};

export const ROUTES_INFO: Record<string, RouteInfo> = masterData.routes.reduce(
  (acc, r) => {
    const raw = r as unknown as RouteDefinition;
    const hours =
      raw.operational_hours ||
      DEFAULT_OPERATIONAL_HOURS[r.id] || { start: "05:30", end: "21:00" };

    acc[r.id] = {
      id: r.id,
      name: r.name,
      color: ROUTE_COLORS[r.id] || "#6366f1",
      type: r.type,
      description: `${r.type} • Tiap ${r.headway_minutes} mnt (${hours.start} - ${hours.end})`,
      headwayMinutes: r.headway_minutes,
      operationalHours: hours,
    };
    return acc;
  },
  {} as Record<string, RouteInfo>
);
