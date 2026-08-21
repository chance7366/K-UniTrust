import { findWithinRadiusKm } from "@/lib/geo/spatial-query";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import { schoolMarkerId } from "@/lib/map/types";

export type NearbyUniversity = UniversityLocationRow & {
  distanceKm: number;
};

export function findNearbyUniversities(
  origin: UniversityLocationRow,
  candidates: UniversityLocationRow[],
  radiusKm: number,
): NearbyUniversity[] {
  return findWithinRadiusKm(
    { lat: origin.lat, lng: origin.lng },
    candidates,
    radiusKm,
    {
      excludeKey: schoolMarkerId(origin),
      getKey: schoolMarkerId,
      limit: 30,
    },
  );
}

export const NEARBY_RADIUS_OPTIONS_KM = [3, 5, 10, 20, 50] as const;

export type NearbyRadiusKm = (typeof NEARBY_RADIUS_OPTIONS_KM)[number];
