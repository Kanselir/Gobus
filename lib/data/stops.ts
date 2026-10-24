// lib/data/stops.ts
// Data halte Suroboyo Bus berdasarkan Master Data GOBIS v1.1-timed

import masterData from "./gobisMasterData.json";
import { StopDefinition } from "@/lib/types/gobis";

export type BusStop = StopDefinition;

export const BUS_STOPS: BusStop[] = masterData.stops;

// Map untuk lookup cepat berdasarkan id
export const STOPS_MAP: Record<string, BusStop> = BUS_STOPS.reduce(
  (acc, stop) => ({ ...acc, [stop.id]: stop }),
  {}
);
