// lib/algorithms/haversine.ts
// Rumus Haversine untuk menghitung jarak antar dua koordinat GPS (dalam km)

export interface Coordinate {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Menghitung jarak antara dua titik koordinat menggunakan Haversine Formula.
 * @returns Jarak dalam kilometer
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const haversine =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * c;
}

/**
 * Mengkonversi jarak km ke estimasi waktu berjalan kaki (menit).
 * Asumsi kecepatan berjalan: 5 km/jam
 */
export function kmToWalkMinutes(km: number): number {
  return Math.round((km / 5) * 60);
}

/**
 * Format jarak ke string yang mudah dibaca
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
