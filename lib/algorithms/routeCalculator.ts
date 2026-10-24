// lib/algorithms/routeCalculator.ts
// Orkestrasi kalkulasi rute: Mengintegrasikan GOBIS Routing Engine + OSRM Real Road Geometry

import { BUS_STOPS, BusStop } from "@/lib/data/stops";
import { ROUTES_INFO } from "@/lib/data/routes";
import { Coordinate, formatDistance, kmToWalkMinutes } from "./haversine";
import { getDetailedRouteGeometry } from "@/lib/services/routing";
import { findBestBusRoute } from "./gobisRouter";
import { RoutingResult } from "@/lib/types/gobis";

export interface RouteStep {
  type: "walk" | "bus" | "arrival";
  icon: string;
  description: string;
  detail?: string;
  distance?: string;
  duration?: string;
  routeColor?: string;
}

export interface CalculatedRoute {
  originStop: BusStop;
  destinationStop: BusStop;
  walkToOrigin: number; // km
  walkFromDestination: number; // km
  path: string[]; // stop IDs
  totalBusDistance: number; // km
  totalDistance: number; // km
  steps: RouteStep[];
  polylineCoords: [number, number][]; // untuk bounds
  walkToOriginGeometry: [number, number][]; // rute jalan kaki asli titik A -> halte asal
  busRoadGeometry: [number, number][]; // rute aspal jalan raya bus asli
  walkFromDestGeometry: [number, number][]; // rute jalan kaki asli halte tujuan -> titik B
  routingResult: RoutingResult; // Hasil komprehensif GOBIS (transit, headway, live ETA)
}

/**
 * Fungsi utama: kalkulasi rute dari Point A ke Point B
 * Menggunakan GOBIS Transit Router + OSRM Real Road Geometries
 */
export async function calculateRoute(
  pointA: Coordinate,
  pointB: Coordinate
): Promise<CalculatedRoute | null> {
  const result = findBestBusRoute(pointA, pointB);
  if (!result) return null;

  const originStop = result.boardingStop;
  const destinationStop = result.alightingStop;

  // Konversi steps ke format RouteStep legacy untuk kompatibilitas
  const steps: RouteStep[] = result.steps.map((s) => {
    let icon = "📍";
    let type: "walk" | "bus" | "arrival" = "arrival";
    let color: string | undefined = undefined;

    if (s.type === "walk_to_stop" || s.type === "walk_to_destination") {
      icon = "🚶";
      type = "walk";
    } else if (s.type === "ride_bus") {
      icon = "🚌";
      type = "bus";
      color = s.route ? ROUTES_INFO[s.route.id]?.color : "#6366f1";
    } else if (s.type === "transit_transfer") {
      icon = "🔄";
      type = "walk";
      color = "#f59e0b";
    } else if (s.type === "cross_street") {
      icon = "🚸";
      type = "walk";
      color = "#f43f5e";
    }

    return {
      type,
      icon,
      description: s.title,
      detail: s.instruction,
      distance: s.distanceKm ? formatDistance(s.distanceKm) : undefined,
      duration: s.durationMinutes ? `${s.durationMinutes} menit` : undefined,
      routeColor: color,
    };
  });

  // Ambil koordinat halte yang dilalui
  const busStopCoordinates = result.allPathStopIds
    .map((id) => BUS_STOPS.find((s) => s.id === id))
    .filter((s): s is BusStop => !!s)
    .map((s) => ({ lat: s.lat, lng: s.lng }));

  // Fallback geometries
  let geometries = {
    walkToOriginGeometry: [
      [pointA.lat, pointA.lng],
      [originStop.lat, originStop.lng],
    ] as [number, number][],
    busRoadGeometry: busStopCoordinates.map((s) => [s.lat, s.lng]) as [number, number][],
    walkFromDestGeometry: [
      [destinationStop.lat, destinationStop.lng],
      [pointB.lat, pointB.lng],
    ] as [number, number][],
    fullGeometry: [] as [number, number][],
  };

  try {
    const detailed = await getDetailedRouteGeometry(
      pointA,
      pointB,
      busStopCoordinates.length > 0
        ? busStopCoordinates
        : [{ lat: originStop.lat, lng: originStop.lng }, { lat: destinationStop.lat, lng: destinationStop.lng }]
    );
    geometries = detailed;
  } catch {
    geometries.fullGeometry = [
      ...geometries.walkToOriginGeometry,
      ...geometries.busRoadGeometry,
      ...geometries.walkFromDestGeometry,
    ];
  }

  const walkOriginKm = result.steps.find((s) => s.type === "walk_to_stop")?.distanceKm || 0.1;
  const walkDestKm = result.steps.find((s) => s.type === "walk_to_destination")?.distanceKm || 0.1;

  return {
    originStop,
    destinationStop,
    walkToOrigin: walkOriginKm,
    walkFromDestination: walkDestKm,
    path: result.allPathStopIds,
    totalBusDistance: result.totalDistanceKm - (walkOriginKm + walkDestKm),
    totalDistance: result.totalDistanceKm,
    steps,
    polylineCoords: geometries.fullGeometry,
    walkToOriginGeometry: geometries.walkToOriginGeometry,
    busRoadGeometry: geometries.busRoadGeometry,
    walkFromDestGeometry: geometries.walkFromDestGeometry,
    routingResult: result,
  };
}
