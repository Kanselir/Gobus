// lib/algorithms/gobisRouter.ts
// Algoritma routing & pathfinding multi-modal khusus GOBIS Suroboyo v2.0-complete
// Mendukung transit antar rute, deteksi penyeberangan jalan (pair_id), dan estimasi waktu real-time

import masterDataRaw from "@/lib/data/gobisMasterData.json";
import {
  GobisMasterData,
  RouteDefinition,
  StopDefinition,
  RoutingResult,
  JourneyStep,
} from "@/lib/types/gobis";
import { haversineDistance, kmToWalkMinutes, Coordinate } from "./haversine";
import { calculateNextBusEta, minutesToTimeString } from "./etaCalculator";

export const GOBIS_DATA: GobisMasterData = masterDataRaw as GobisMasterData;

export const ROUTES_MAP = new Map<string, RouteDefinition>(
  GOBIS_DATA.routes.map((r) => [r.id, r])
);

export const STOPS_MAP = new Map<string, StopDefinition>(
  GOBIS_DATA.stops.map((s) => [s.id, s])
);

// Map pair_id ke daftar halte yang berada di seberangnya
export const PAIR_STOPS_MAP = new Map<string, StopDefinition[]>();
for (const stop of GOBIS_DATA.stops) {
  const existing = PAIR_STOPS_MAP.get(stop.pair_id) || [];
  existing.push(stop);
  PAIR_STOPS_MAP.set(stop.pair_id, existing);
}

/**
 * Menghitung waktu kumulatif (menit dari origin rute) untuk halte tertentu pada rute tertentu
 */
export function getStopRouteTime(stop: StopDefinition, routeId: string): number {
  if (routeId === "SB-R2") {
    if (stop.id === "H_PERAK") return 0;
    if (stop.id === "H_PURABAYA") return 57;
  }
  if (routeId === "SB-R4_B") {
    if (stop.id === "H_PURABAYA") return 57;
  }
  if (routeId === "SB-SBT_B") {
    if (stop.id === "H_PURABAYA") return 57;
  }
  return stop.time_from_origin_mins;
}

interface GraphEdge {
  toNode: string;
  toStopId: string;
  toRouteId: string | null;
  costMinutes: number;
  distanceKm: number;
  type: "ride" | "transfer" | "cross_pair";
  routeId?: string;
  passedStopIds?: string[];
}

/**
 * Membangun multi-layer transit graph (state-expanded graph)
 * Setiap node merepresentasikan keadaan: (stopId, routeId)
 */
function buildTransitGraph(): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();

  const addEdge = (fromNode: string, edge: GraphEdge) => {
    const list = adj.get(fromNode) || [];
    list.push(edge);
    adj.set(fromNode, list);
  };

  // 1. EDGES DALAM KENDARAAN (IN-VEHICLE): halte berurutan pada rute yang sama
  for (const route of GOBIS_DATA.routes) {
    // Ambil semua halte untuk rute ini, urutkan berdasarkan waktu tempuh dari origin
    const routeStops = GOBIS_DATA.stops
      .filter((s) => s.routes.includes(route.id))
      .sort((a, b) => getStopRouteTime(a, route.id) - getStopRouteTime(b, route.id));

    for (let i = 0; i < routeStops.length; i++) {
      for (let j = i + 1; j < routeStops.length; j++) {
        const fromStop = routeStops[i];
        const toStop = routeStops[j];

        const tFrom = getStopRouteTime(fromStop, route.id);
        const tTo = getStopRouteTime(toStop, route.id);
        const travelMins = Math.max(1, tTo - tFrom);

        const distKm = haversineDistance(
          { lat: fromStop.lat, lng: fromStop.lng },
          { lat: toStop.lat, lng: toStop.lng }
        );

        const fromNode = `${fromStop.id}__${route.id}`;
        const toNode = `${toStop.id}__${route.id}`;

        const intermediateIds = routeStops.slice(i, j + 1).map((s) => s.id);

        addEdge(fromNode, {
          toNode,
          toStopId: toStop.id,
          toRouteId: route.id,
          costMinutes: travelMins,
          distanceKm: distKm,
          type: "ride",
          routeId: route.id,
          passedStopIds: intermediateIds,
        });
      }
    }
  }

  // 2. EDGES PERPINDAHAN RUTE (TRANSIT TRANSFER): di halte yang sama dengan rute berbeda
  for (const stop of GOBIS_DATA.stops) {
    for (const r1 of stop.routes) {
      for (const r2 of stop.routes) {
        if (r1 !== r2) {
          const fromNode = `${stop.id}__${r1}`;
          const toNode = `${stop.id}__${r2}`;
          const targetRoute = ROUTES_MAP.get(r2);
          const transferWait = targetRoute ? Math.round(targetRoute.headway_minutes / 2) : 5;
          const transferPenalty = 2 + transferWait;

          addEdge(fromNode, {
            toNode,
            toStopId: stop.id,
            toRouteId: r2,
            costMinutes: transferPenalty,
            distanceKm: 0.05,
            type: "transfer",
            routeId: r2,
          });
        }
      }
    }
  }

  // 3. EDGES PENYEBERANGAN JALAN (PAIR_ID CROSSING): menyeberang ke halte seberang
  for (const [pairId, stopsInPair] of PAIR_STOPS_MAP.entries()) {
    if (stopsInPair.length > 1) {
      for (let i = 0; i < stopsInPair.length; i++) {
        for (let j = 0; j < stopsInPair.length; j++) {
          if (i !== j) {
            const stopA = stopsInPair[i];
            const stopB = stopsInPair[j];
            for (const rA of stopA.routes) {
              for (const rB of stopB.routes) {
                const fromNode = `${stopA.id}__${rA}`;
                const toNode = `${stopB.id}__${rB}`;
                addEdge(fromNode, {
                  toNode,
                  toStopId: stopB.id,
                  toRouteId: rB,
                  costMinutes: 2, // 2 menit jalan kaki menyeberang jalan
                  distanceKm: 0.05,
                  type: "cross_pair",
                  routeId: rB,
                });
              }
            }
          }
        }
      }
    }
  }

  return adj;
}

const TRANSIT_GRAPH = buildTransitGraph();

/**
 * Mencari halte terdekat dari koordinat yang diberikan
 */
export function findNearestStops(coord: Coordinate, limit = 4): Array<{ stop: StopDefinition; distKm: number }> {
  return GOBIS_DATA.stops
    .map((stop) => ({
      stop,
      distKm: haversineDistance(coord, { lat: stop.lat, lng: stop.lng }),
    }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit);
}

/**
 * Fungsi utama routing: mencari rute bus terbaik dari Titik A ke Titik B
 */
export function findBestBusRoute(
  pointA: Coordinate,
  pointB: Coordinate,
  departureDate: Date = new Date()
): RoutingResult | null {
  const candidateOrigins = findNearestStops(pointA, 5);
  const candidateDestinations = findNearestStops(pointB, 5);

  if (candidateOrigins.length === 0 || candidateDestinations.length === 0) {
    return null;
  }

  const destStopIds = new Set(candidateDestinations.map((c) => c.stop.id));

  // Inisialisasi Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, { fromNode: string; edge: GraphEdge }>();
  const visited = new Set<string>();

  const queue: Array<{ node: string; cost: number }> = [];

  // Masukkan semua candidate origin nodes dengan cost jalan kaki awal
  for (const cand of candidateOrigins) {
    const walkMins = kmToWalkMinutes(cand.distKm);
    for (const routeId of cand.stop.routes) {
      const nodeKey = `${cand.stop.id}__${routeId}`;
      distances.set(nodeKey, walkMins);
      queue.push({ node: nodeKey, cost: walkMins });
    }
  }

  let bestDestNode: string | null = null;
  let minTotalCost = Infinity;

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { node: currNode, cost: currCost } = queue.shift()!;

    if (visited.has(currNode)) continue;
    visited.add(currNode);

    const [currStopId] = currNode.split("__");

    if (destStopIds.has(currStopId)) {
      const destCand = candidateDestinations.find((c) => c.stop.id === currStopId)!;
      const walkFromDestMins = kmToWalkMinutes(destCand.distKm);
      const totalCost = currCost + walkFromDestMins;

      if (totalCost < minTotalCost) {
        minTotalCost = totalCost;
        bestDestNode = currNode;
        break;
      }
    }

    const neighbors = TRANSIT_GRAPH.get(currNode) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.toNode)) continue;

      const newCost = currCost + edge.costMinutes;
      const existingCost = distances.get(edge.toNode) ?? Infinity;

      if (newCost < existingCost) {
        distances.set(edge.toNode, newCost);
        previous.set(edge.toNode, { fromNode: currNode, edge });
        queue.push({ node: edge.toNode, cost: newCost });
      }
    }
  }

  if (!bestDestNode) {
    return null;
  }

  // Rekonstruksi path
  const pathEdges: GraphEdge[] = [];
  let curr = bestDestNode;

  while (previous.has(curr)) {
    const record = previous.get(curr)!;
    pathEdges.unshift(record.edge);
    curr = record.fromNode;
  }

  const [firstStopId, firstRouteId] = curr.split("__");
  const [lastStopId] = bestDestNode.split("__");

  const boardingStop = STOPS_MAP.get(firstStopId)!;
  const alightingStop = STOPS_MAP.get(lastStopId)!;

  const originDistKm = haversineDistance(pointA, { lat: boardingStop.lat, lng: boardingStop.lng });
  const destDistKm = haversineDistance(pointB, { lat: alightingStop.lat, lng: alightingStop.lng });
  const originWalkMins = kmToWalkMinutes(originDistKm);
  const destWalkMins = kmToWalkMinutes(destDistKm);

  const steps: JourneyStep[] = [];
  let currentTimeMinutes = departureDate.getHours() * 60 + departureDate.getMinutes();

  // STEP 1: Jalan Kaki ke Halte Keberangkatan
  const startWalkTime = minutesToTimeString(currentTimeMinutes);
  currentTimeMinutes += originWalkMins;
  const arriveAtStop1Time = minutesToTimeString(currentTimeMinutes);

  steps.push({
    id: "step-walk-origin",
    type: "walk_to_stop",
    title: `Jalan Kaki ke ${boardingStop.name}`,
    instruction: `Berjalan sejauh ${(originDistKm * 1000).toFixed(0)}m (~${originWalkMins} mnt) menuju halte keberangkatan.`,
    fromStop: undefined,
    toStop: boardingStop,
    distanceKm: originDistKm,
    durationMinutes: originWalkMins,
    departureTime: startWalkTime,
    arrivalTime: arriveAtStop1Time,
  });

  let hasTransit = false;
  let hasCrossing = false;
  const transitStops: StopDefinition[] = [];
  const allPathStopIds: string[] = [boardingStop.id];

  let currentBoardStop = boardingStop;

  for (let i = 0; i < pathEdges.length; i++) {
    const edge = pathEdges[i];

    if (edge.type === "ride" && edge.routeId) {
      const toStop = STOPS_MAP.get(edge.toStopId)!;
      const route = ROUTES_MAP.get(edge.routeId)!;

      const eta = calculateNextBusEta(
        route,
        currentBoardStop,
        new Date(departureDate.getTime() + (currentTimeMinutes - (departureDate.getHours() * 60 + departureDate.getMinutes())) * 60000)
      );

      const waitMins = Math.max(0, eta.minutesUntilArrival);
      currentTimeMinutes += waitMins;
      const busDepartureTime = minutesToTimeString(currentTimeMinutes);
      currentTimeMinutes += edge.costMinutes;
      const busArrivalTime = minutesToTimeString(currentTimeMinutes);

      const passed = (edge.passedStopIds || [])
        .map((id) => STOPS_MAP.get(id))
        .filter((s): s is StopDefinition => !!s);

      for (const p of passed) {
        if (!allPathStopIds.includes(p.id)) allPathStopIds.push(p.id);
      }

      steps.push({
        id: `step-ride-${edge.routeId}-${currentBoardStop.id}`,
        type: "ride_bus",
        title: `Naik ${route.name}`,
        instruction: `Naik bus dari ${currentBoardStop.name} menuju ${toStop.name}. Melewati ${Math.max(1, passed.length - 1)} halte.`,
        fromStop: currentBoardStop,
        toStop: toStop,
        route: route,
        passedStops: passed,
        distanceKm: edge.distanceKm,
        durationMinutes: edge.costMinutes,
        eta: eta,
        departureTime: busDepartureTime,
        arrivalTime: busArrivalTime,
      });

      currentBoardStop = toStop;
    } else if (edge.type === "transfer" && edge.routeId) {
      hasTransit = true;
      const targetRoute = ROUTES_MAP.get(edge.routeId);
      transitStops.push(currentBoardStop);

      const transDep = minutesToTimeString(currentTimeMinutes);
      currentTimeMinutes += edge.costMinutes;
      const transArr = minutesToTimeString(currentTimeMinutes);

      steps.push({
        id: `step-transit-${currentBoardStop.id}-${edge.routeId}`,
        type: "transit_transfer",
        title: `Transit & Ganti Rute di ${currentBoardStop.name}`,
        instruction: `Turun dari bus. Berganti rute ke ${targetRoute?.name || edge.routeId}.`,
        fromStop: currentBoardStop,
        toStop: currentBoardStop,
        route: targetRoute,
        distanceKm: 0.05,
        durationMinutes: edge.costMinutes,
        departureTime: transDep,
        arrivalTime: transArr,
      });
    } else if (edge.type === "cross_pair") {
      hasCrossing = true;
      const toStop = STOPS_MAP.get(edge.toStopId)!;

      const crossDep = minutesToTimeString(currentTimeMinutes);
      currentTimeMinutes += edge.costMinutes;
      const crossArr = minutesToTimeString(currentTimeMinutes);

      steps.push({
        id: `step-cross-${currentBoardStop.id}-${toStop.id}`,
        type: "cross_street",
        title: `Menyeberang Jalan ke ${toStop.name}`,
        instruction: `Seberangi jalan menuju platform seberang (Pair: ${toStop.pair_id}).`,
        fromStop: currentBoardStop,
        toStop: toStop,
        distanceKm: edge.distanceKm,
        durationMinutes: edge.costMinutes,
        departureTime: crossDep,
        arrivalTime: crossArr,
        crossingPairId: toStop.pair_id,
      });

      currentBoardStop = toStop;
    }
  }

  // STEP TERAKHIR: Jalan Kaki ke Titik Tujuan
  const finalWalkDep = minutesToTimeString(currentTimeMinutes);
  currentTimeMinutes += destWalkMins;
  const finalWalkArr = minutesToTimeString(currentTimeMinutes);

  steps.push({
    id: "step-walk-dest",
    type: "walk_to_destination",
    title: "Jalan Kaki ke Titik Tujuan",
    instruction: `Berjalan kaki sejauh ${(destDistKm * 1000).toFixed(0)}m (~${destWalkMins} mnt) hingga tiba di lokasi tujuan.`,
    fromStop: alightingStop,
    toStop: undefined,
    distanceKm: destDistKm,
    durationMinutes: destWalkMins,
    departureTime: finalWalkDep,
    arrivalTime: finalWalkArr,
  });

  const totalDistanceKm = steps.reduce((acc, s) => acc + s.distanceKm, 0);
  const totalDurationMinutes = steps.reduce((acc, s) => acc + s.durationMinutes, 0);

  return {
    originCoords: pointA,
    destinationCoords: pointB,
    boardingStop,
    alightingStop,
    totalDistanceKm,
    totalDurationMinutes,
    departureTime: startWalkTime,
    estimatedArrivalTime: finalWalkArr,
    hasTransit,
    hasCrossing,
    transitStops,
    steps,
    allPathStopIds,
  };
}
