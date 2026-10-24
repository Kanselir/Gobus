// lib/services/routing.ts
// Layanan untuk mengambil geometri rute jalan asli (bukan garis lurus)
// Menggunakan OSRM (Open Source Routing Machine) API dengan fallback

export interface LatLngPoint {
  lat: number;
  lng: number;
}

// In-memory cache agar permintaan koordinat yang sama tidak diulang
const routeCache = new Map<string, [number, number][]>();

/**
 * Mengambil geometri jalan raya asli dari OSRM untuk serangkaian titik koordinat.
 * @param points Array titik [lat, lng] yang harus dilalui
 * @param profile 'driving' untuk kendaraan/bus, 'foot' untuk jalan kaki
 * @returns Array [lat, lng] mengikuti belokan dan garis jalan sebenarnya
 */
export async function fetchRoadGeometry(
  points: LatLngPoint[],
  profile: "driving" | "foot" = "driving"
): Promise<[number, number][]> {
  if (points.length < 2) {
    return points.map((p) => [p.lat, p.lng]);
  }

  // Buat cache key
  const cacheKey = `${profile}:${points
    .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
    .join(";")}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // OSRM format: lng,lat;lng,lat
  const coordString = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]?.geometry?.coordinates) {
        // OSRM mengembalikan koordinat GeoJSON [lng, lat]
        // Konversikan ke Leaflet [lat, lng]
        const leafletCoords: [number, number][] =
          data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );

        routeCache.set(cacheKey, leafletCoords);
        return leafletCoords;
      }
    }
  } catch (err) {
    // Jika timeout atau offline, gunakan fallback
    console.warn("OSRM routing offline/timeout, using fallback interpolation", err);
  }

  // Fallback jika API OSRM tidak dapat dihubungi:
  // Buat garis lurus antar waypoint
  const fallbackCoords: [number, number][] = points.map((p) => [p.lat, p.lng]);
  return fallbackCoords;
}

/**
 * Mengambil rute terintegrasi:
 * 1. Segmen jalan kaki A -> Halte Asal (geometri jalan pejalan kaki)
 * 2. Segmen bus Halte Asal -> Halte Tujuan (geometri jalan raya koridor bus)
 * 3. Segmen jalan kaki Halte Tujuan -> B (geometri jalan pejalan kaki)
 */
export async function getDetailedRouteGeometry(
  pointA: LatLngPoint,
  pointB: LatLngPoint,
  busStopsPath: LatLngPoint[]
): Promise<{
  walkToOriginGeometry: [number, number][];
  busRoadGeometry: [number, number][];
  walkFromDestGeometry: [number, number][];
  fullGeometry: [number, number][];
}> {
  const originStop = busStopsPath[0];
  const destStop = busStopsPath[busStopsPath.length - 1];

  // Jalankan fetch secara paralel untuk performa maksimal
  const [walkToOrigin, busRoad, walkFromDest] = await Promise.all([
    // Jalan kaki dari Point A ke Halte Pertama
    fetchRoadGeometry([pointA, originStop], "foot"),
    // Bus dari Halte Pertama melewati semua halte transit hingga Halte Terakhir
    fetchRoadGeometry(busStopsPath, "driving"),
    // Jalan kaki dari Halte Terakhir ke Point B
    fetchRoadGeometry([destStop, pointB], "foot"),
  ]);

  // Gabungkan seluruh geometri untuk auto-fit bounds
  const fullGeometry: [number, number][] = [
    ...walkToOrigin,
    ...busRoad,
    ...walkFromDest,
  ];

  return {
    walkToOriginGeometry: walkToOrigin,
    busRoadGeometry: busRoad,
    walkFromDestGeometry: walkFromDest,
    fullGeometry,
  };
}
