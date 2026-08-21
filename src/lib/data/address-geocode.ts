import { readCsvFile } from "@/lib/csv/read";
import type { AddressGeocodeRow } from "@/lib/ingest/address-geocode-config";

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRow(r: Record<string, string>): AddressGeocodeRow | null {
  const schoolCodeStd = r.school_code_std?.trim();
  const roadAddress = r.road_address?.trim();
  const lng = num(r.lng);
  const lat = num(r.lat);
  if (!schoolCodeStd || !roadAddress || lng == null || lat == null) return null;

  return {
    schoolCodeStd,
    roadAddress,
    lotAddress: r.lot_address?.trim() ?? "",
    lng,
    lat,
    sido: r.sido?.trim() ?? "",
    sigungu: r.sigungu?.trim() ?? "",
    geocodedAt: r.geocoded_at?.trim() ?? "",
  };
}

export async function loadAddressGeocodeCache(): Promise<
  Map<string, AddressGeocodeRow>
> {
  const raw = await readCsvFile("univMapAddressGeocode").catch(() => []);
  const map = new Map<string, AddressGeocodeRow>();

  for (const r of raw) {
    const parsed = parseRow(r);
    if (parsed) map.set(parsed.schoolCodeStd, parsed);
  }

  return map;
}

export function isGeocodeCacheHit(
  cached: AddressGeocodeRow | undefined,
  roadAddress: string,
): boolean {
  if (!cached) return false;
  return (
    cached.roadAddress === roadAddress &&
    Boolean(cached.lotAddress) &&
    Number.isFinite(cached.lng) &&
    Number.isFinite(cached.lat)
  );
}

/** 좌표만 있고 지번주소가 비어 있을 때 (부분 캐시) */
export function isCoordinateCacheHit(
  cached: AddressGeocodeRow | undefined,
  roadAddress: string,
): boolean {
  if (!cached) return false;
  return (
    cached.roadAddress === roadAddress &&
    Number.isFinite(cached.lng) &&
    Number.isFinite(cached.lat)
  );
}
