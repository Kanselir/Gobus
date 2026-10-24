// lib/algorithms/etaCalculator.ts
// Logika estimasi waktu kedatangan bus (ETA) berbasis interval keberangkatan (headway) & waktu dari terminus

import { RouteDefinition, StopDefinition, EtaEstimation } from "@/lib/types/gobis";
import { ROUTES_INFO } from "@/lib/data/routes";

/**
 * Konversi string waktu "HH:mm" menjadi menit dari tengah malam (00:00)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Konversi menit dari tengah malam menjadi string waktu "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  // Tangani overflow hari jika perjalanan melewati tengah malam
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Menghasilkan semua waktu kedatangan bus di suatu halte sepanjang jam operasional
 * @param route Definisi rute dengan jam operasional dan interval headway
 * @param stop Halte dengan nilai time_from_origin_mins
 * @returns Array menit dari tengah malam saat bus dijadwalkan tiba di halte
 */
export function generateStopArrivalSchedule(
  route: RouteDefinition,
  stop: StopDefinition
): number[] {
  const hours =
    route.operational_hours ||
    ROUTES_INFO[route.id]?.operationalHours || { start: "05:30", end: "21:00" };
  const startMin = timeStringToMinutes(hours.start);
  const endMin = timeStringToMinutes(hours.end);
  const headway = route.headway_minutes;
  const travelFromOrigin = stop.time_from_origin_mins;

  const arrivals: number[] = [];

  // Bus diberangkatkan dari Terminus setiap interval headway
  for (let dep = startMin; dep <= endMin; dep += headway) {
    const arrivalAtStop = dep + travelFromOrigin;
    arrivals.push(arrivalAtStop);
  }

  return arrivals;
}

/**
 * Menghitung ETA real-time untuk bus rute tertentu di halte tertentu
 * @param route Rute bus
 * @param stop Halte keberangkatan
 * @param currentTime Waktu acuan sekarang (default: waktu sistem lokal)
 */
export function calculateNextBusEta(
  route: RouteDefinition,
  stop: StopDefinition,
  currentTime: Date = new Date()
): EtaEstimation {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const schedule = generateStopArrivalSchedule(route, stop);

  if (schedule.length === 0) {
    return {
      routeId: route.id,
      routeName: route.name,
      stopId: stop.id,
      stopName: stop.name,
      isOperating: false,
      statusText: "Jadwal tidak tersedia",
      nextBusArrivalTime: "-",
      minutesUntilArrival: -1,
      headwayMinutes: route.headway_minutes,
      scheduledArrivals: [],
    };
  }

  const firstArrival = schedule[0];
  const lastArrival = schedule[schedule.length - 1];

  // Kasus 1: Belum jam operasional (terlalu pagi)
  if (currentMinutes < firstArrival) {
    const diff = firstArrival - currentMinutes;
    return {
      routeId: route.id,
      routeName: route.name,
      stopId: stop.id,
      stopName: stop.name,
      isOperating: false,
      statusText: `Layanan belum dimulai (Bus pertama tiba pukul ${minutesToTimeString(firstArrival)})`,
      nextBusArrivalTime: minutesToTimeString(firstArrival),
      minutesUntilArrival: diff,
      headwayMinutes: route.headway_minutes,
      scheduledArrivals: schedule.slice(0, 3).map(minutesToTimeString),
    };
  }

  // Kasus 2: Sudah lewat jam operasional (layanan berakhir untuk hari ini)
  if (currentMinutes > lastArrival) {
    const hours =
      route.operational_hours ||
      ROUTES_INFO[route.id]?.operationalHours || { start: "05:30", end: "21:00" };
    return {
      routeId: route.id,
      routeName: route.name,
      stopId: stop.id,
      stopName: stop.name,
      isOperating: false,
      statusText: `Layanan hari ini telah selesai (Beroperasi kembali besok pukul ${hours.start})`,
      nextBusArrivalTime: "-",
      minutesUntilArrival: -1,
      headwayMinutes: route.headway_minutes,
      scheduledArrivals: [],
    };
  }

  // Kasus 3: Sedang beroperasi aktif
  // Cari kedatangan berikutnya (arrival >= currentMinutes)
  const upcoming = schedule.filter((t) => t >= currentMinutes);
  const nextArrivalMin = upcoming[0];
  const minutesUntil = Math.max(0, nextArrivalMin - currentMinutes);

  let statusText = `Tiba pukul ${minutesToTimeString(nextArrivalMin)}`;
  if (minutesUntil <= 1) {
    statusText = "Bus sedang mendekati halte (< 1 menit)";
  } else {
    statusText = `Tiba dalam ${minutesUntil} menit (${minutesToTimeString(nextArrivalMin)})`;
  }

  return {
    routeId: route.id,
    routeName: route.name,
    stopId: stop.id,
    stopName: stop.name,
    isOperating: true,
    statusText,
    nextBusArrivalTime: minutesToTimeString(nextArrivalMin),
    minutesUntilArrival: minutesUntil,
    headwayMinutes: route.headway_minutes,
    scheduledArrivals: upcoming.slice(0, 4).map(minutesToTimeString),
  };
}

/**
 * Menghitung waktu tiba di tujuan dengan menambahkan durasi menit ke waktu mulai
 */
export function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  const current = timeStringToMinutes(timeStr);
  return minutesToTimeString(current + minutesToAdd);
}
