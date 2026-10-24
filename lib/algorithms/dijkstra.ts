// lib/algorithms/dijkstra.ts
// Implementasi algoritma Dijkstra untuk mencari rute terpendek antar halte

export interface EdgeData {
  distance: number;
  routeId: string;
}

export type Graph = Record<string, Record<string, EdgeData>>;

export interface DijkstraResult {
  path: string[]; // array of stop IDs
  totalDistance: number; // dalam km
  edges: Array<{ from: string; to: string; routeId: string; distance: number }>;
}

/**
 * Algoritma Dijkstra untuk mencari jalur terpendek dalam graf berbobot.
 * @param graph - Graf adjacency berisi node dan bobot
 * @param startId - ID halte awal
 * @param endId - ID halte tujuan
 * @returns Hasil path terpendek beserta detail edges, atau null jika tidak ditemukan
 */
export function dijkstra(
  graph: Graph,
  startId: string,
  endId: string
): DijkstraResult | null {
  if (startId === endId) {
    return { path: [startId], totalDistance: 0, edges: [] };
  }

  // Inisialisasi distances dengan Infinity
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const previousEdge: Record<string, EdgeData & { from: string }> = {};
  const unvisited = new Set<string>();

  // Kumpulkan semua nodes dari graf
  Object.keys(graph).forEach((nodeId) => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  });

  if (!(startId in distances)) {
    distances[startId] = 0;
    unvisited.add(startId);
  } else {
    distances[startId] = 0;
  }

  while (unvisited.size > 0) {
    // Temukan node dengan jarak terkecil yang belum dikunjungi
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const nodeId of unvisited) {
      const dist = distances[nodeId] ?? Infinity;
      if (dist < smallestDist) {
        smallestDist = dist;
        currentId = nodeId;
      }
    }

    // Jika tidak ada node yang reachable atau sudah sampai tujuan
    if (currentId === null || currentId === endId) break;
    if (distances[currentId] === Infinity) break;

    unvisited.delete(currentId);

    // Update jarak tetangga
    const neighbors = graph[currentId] ?? {};
    for (const [neighborId, edgeData] of Object.entries(neighbors)) {
      if (!unvisited.has(neighborId)) continue;

      const newDist = distances[currentId] + edgeData.distance;
      if (newDist < (distances[neighborId] ?? Infinity)) {
        distances[neighborId] = newDist;
        previous[neighborId] = currentId;
        previousEdge[neighborId] = { ...edgeData, from: currentId };
      }
    }
  }

  // Rekonstruksi path dari endId ke startId
  if (distances[endId] === Infinity) return null;

  const path: string[] = [];
  const edges: DijkstraResult["edges"] = [];
  let current: string | null = endId;

  while (current !== null) {
    path.unshift(current);
    const edge = previousEdge[current];
    if (edge) {
      edges.unshift({
        from: edge.from,
        to: current,
        routeId: edge.routeId,
        distance: edge.distance,
      });
    }
    current = previous[current] ?? null;
  }

  // Pastikan path dimulai dari startId
  if (path[0] !== startId) return null;

  return {
    path,
    totalDistance: distances[endId],
    edges,
  };
}
