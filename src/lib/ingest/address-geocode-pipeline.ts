import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import {
  isCoordinateCacheHit,
  isGeocodeCacheHit,
} from "@/lib/data/address-geocode";
import type { AddressGeocodeRow } from "@/lib/ingest/address-geocode-config";
import { ADDRESS_GEOCODE_CSV_COLUMNS } from "@/lib/ingest/address-geocode-config";
import {
  SCHOOL_OVERVIEW_CSV_COLUMNS,
  type SchoolOverviewCsvRow,
} from "@/lib/ingest/school-overview-config";
import {
  UNIVERSITY_LOCATIONS_CSV_COLUMNS,
  UNIVERSITY_LOCATION_SCHOOL_TYPES,
} from "@/lib/ingest/university-locations-config";

export type GeocodeCacheMap = Map<string, AddressGeocodeRow>;

export function parseGeocodeCacheRow(
  r: Record<string, string>,
): AddressGeocodeRow | null {
  const schoolCodeStd = r.school_code_std?.trim();
  const roadAddress = r.road_address?.trim();
  const lng = Number(r.lng);
  const lat = Number(r.lat);
  if (!schoolCodeStd || !roadAddress || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

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

export async function loadGeocodeCacheMap(): Promise<GeocodeCacheMap> {
  const raw = await readCsvFile("univMapAddressGeocode").catch(() => []);
  const map = new Map<string, AddressGeocodeRow>();
  for (const r of raw) {
    const parsed = parseGeocodeCacheRow(r);
    if (parsed) map.set(parsed.schoolCodeStd, parsed);
  }
  return map;
}

export function geocodeCacheToCsvRow(row: AddressGeocodeRow): Record<string, string> {
  return {
    school_code_std: row.schoolCodeStd,
    road_address: row.roadAddress,
    lot_address: row.lotAddress,
    lng: String(row.lng),
    lat: String(row.lat),
    sido: row.sido,
    sigungu: row.sigungu,
    geocoded_at: row.geocodedAt,
  };
}

export function mergeLotAddressFromCache(
  overviewRows: Record<string, string>[],
  cache: GeocodeCacheMap,
): Record<string, string>[] {
  return overviewRows.map((row) => {
    const code = row.school_code_std?.trim() ?? "";
    const road = row.road_address?.trim() ?? "";
    const cached = cache.get(code);
    if (!road || !isGeocodeCacheHit(cached, road)) return row;

    return {
      ...row,
      lot_address: cached!.lotAddress,
    };
  });
}

export async function writeGeocodeCache(cache: GeocodeCacheMap): Promise<void> {
  const rows = [...cache.values()]
    .sort((a, b) => a.schoolCodeStd.localeCompare(b.schoolCodeStd))
    .map(geocodeCacheToCsvRow);

  await writeCsvFile("univMapAddressGeocode", rows, [...ADDRESS_GEOCODE_CSV_COLUMNS]);
}

export async function rebuildUniversityLocationsCsv(
  overviewRows: Record<string, string>[],
  cache: GeocodeCacheMap,
  geocodedAt: string,
): Promise<number> {
  const locationRows: Record<string, string>[] = [];

  for (const row of overviewRows) {
    const schoolStatus = row.school_status?.trim() ?? "";
    const schoolType = row.school_type?.trim() ?? "";
    const roadAddress = row.road_address?.trim() ?? "";
    const schoolCodeStd = row.school_code_std?.trim() ?? "";

    if (schoolStatus !== "기존") continue;
    if (!UNIVERSITY_LOCATION_SCHOOL_TYPES.includes(schoolType as "대학교" | "전문대학")) {
      continue;
    }
    if (!roadAddress || !schoolCodeStd) continue;

    const geo = cache.get(schoolCodeStd);
    if (!isGeocodeCacheHit(geo, roadAddress) && !isCoordinateCacheHit(geo, roadAddress)) {
      continue;
    }

    locationRows.push({
      school_code_std: schoolCodeStd,
      school_name: row.school_name?.trim() ?? "",
      main_branch: row.main_branch?.trim() ?? "",
      school_type: schoolType,
      establishment: row.establishment?.trim() ?? "",
      road_address: roadAddress,
      lot_address: geo!.lotAddress,
      sido: geo!.sido,
      sigungu: geo!.sigungu,
      lng: String(geo!.lng),
      lat: String(geo!.lat),
      geocoded_at: geo!.geocodedAt || geocodedAt,
    });
  }

  locationRows.sort((a, b) =>
    (a.school_name ?? "").localeCompare(b.school_name ?? "", "ko"),
  );

  await writeCsvFile(
    "univMapUniversityLocations",
    locationRows,
    [...UNIVERSITY_LOCATIONS_CSV_COLUMNS],
  );

  return locationRows.length;
}

export async function writeSchoolOverviewRows(
  rows: Record<string, string>[],
): Promise<void> {
  await writeCsvFile("univMapSchoolOverview", rows, [...SCHOOL_OVERVIEW_CSV_COLUMNS]);
}

export type SchoolOverviewCsvRowInput = SchoolOverviewCsvRow;
