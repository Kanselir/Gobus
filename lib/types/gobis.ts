// lib/types/gobis.ts
// Tipe data untuk Master Data GOBIS Suroboyo Routing & ETA System

export interface OperationalHours {
  start: string; // e.g. "05:30"
  end: string;   // e.g. "21:00"
}

export interface RouteDefinition {
  id: string;
  name: string;
  type: string;
  operational_hours?: OperationalHours;
  headway_minutes: number;
}

export interface StopDefinition {
  id: string;
  pair_id: string;
  name: string;
  lat: number;
  lng: number;
  direction: string;
  routes: string[];
  time_from_origin_mins: number;
}

export interface GobisMasterData {
  metadata: {
    city: string;
    app_name: string;
    version: string;
    updated_at: string;
  };
  routes: RouteDefinition[];
  stops: StopDefinition[];
}

// Hasil estimasi waktu kedatangan (ETA) bus real-time
export interface EtaEstimation {
  routeId: string;
  routeName: string;
  stopId: string;
  stopName: string;
  isOperating: boolean;
  statusText: string;
  nextBusArrivalTime: string; // "07:35"
  minutesUntilArrival: number; // e.g. 19
  headwayMinutes: number;
  scheduledArrivals: string[]; // daftar 3-4 jadwal bus berikutnya hari ini
}

// Segmen perjalanan dalam hasil navigasi
export type TravelSegmentType =
  | "walk_to_stop"
  | "ride_bus"
  | "transit_transfer"
  | "cross_street"
  | "walk_to_destination";

export interface JourneyStep {
  id: string;
  type: TravelSegmentType;
  title: string;
  instruction: string;
  fromStop?: StopDefinition;
  toStop?: StopDefinition;
  route?: RouteDefinition;
  passedStops?: StopDefinition[];
  distanceKm: number;
  durationMinutes: number;
  eta?: EtaEstimation;
  departureTime?: string;
  arrivalTime?: string;
  crossingPairId?: string;
}

export interface RoutingResult {
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  boardingStop: StopDefinition;
  alightingStop: StopDefinition;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  departureTime: string;
  estimatedArrivalTime: string;
  hasTransit: boolean;
  hasCrossing: boolean;
  transitStops: StopDefinition[];
  steps: JourneyStep[];
  allPathStopIds: string[];
}
