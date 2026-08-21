const EARTH_RADIUS_KM = 6371;

/** Haversine 거리 (km) */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type SpatialPoint = {
  lat: number;
  lng: number;
};

export type NearbyResult<T> = T & {
  distanceKm: number;
};

/**
 * 반경 내 포인트 검색 (Haversine).
 * DB PostGIS 없이 CSV 좌표 기반으로 동작 — 341건 규모에서 충분히 빠름.
 */
export function findWithinRadiusKm<T extends SpatialPoint>(
  origin: SpatialPoint,
  points: T[],
  radiusKm: number,
  options?: {
    excludeKey?: string;
    getKey?: (item: T) => string;
    limit?: number;
  },
): NearbyResult<T>[] {
  const getKey = options?.getKey ?? ((item: T) => `${item.lat},${item.lng}`);
  const limit = options?.limit ?? 50;

  const results: NearbyResult<T>[] = [];

  for (const point of points) {
    if (options?.excludeKey && getKey(point) === options.excludeKey) continue;

    const distanceKm = haversineDistanceKm(
      origin.lat,
      origin.lng,
      point.lat,
      point.lng,
    );
    if (distanceKm <= radiusKm) {
      results.push({ ...point, distanceKm });
    }
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, limit);
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
