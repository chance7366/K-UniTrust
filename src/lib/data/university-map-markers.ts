import { matchSidoRegion } from "@/lib/analysis/korea-sido-regions";
import type { SidoRegion } from "@/lib/analysis/korea-sido-regions";
import { findNearbyUniversities } from "@/lib/data/nearby-universities";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import {
  schoolMarkerId,
  type UniversityMapMarker,
} from "@/lib/map/types";

type BuildUniversityMapMarkersOptions = {
  allRows: UniversityLocationRow[];
  browsingRows: UniversityLocationRow[];
  focusedSchool: UniversityLocationRow | null;
  nearbyRadiusKm: number;
  showSidoContext: boolean;
  selectedSido: SidoRegion | null;
};

function toMarker(
  school: UniversityLocationRow,
  role: UniversityMapMarker["role"],
): UniversityMapMarker {
  return {
    id: schoolMarkerId(school),
    lng: school.lng,
    lat: school.lat,
    establishment: school.establishment,
    role,
    school,
  };
}

export function buildUniversityMapMarkers({
  allRows,
  browsingRows,
  focusedSchool,
  nearbyRadiusKm,
  showSidoContext,
  selectedSido,
}: BuildUniversityMapMarkersOptions): UniversityMapMarker[] {
  if (!focusedSchool) {
    const source = selectedSido ? browsingRows : allRows;
    return source.map((school) => toMarker(school, "default"));
  }

  const markers = new Map<string, UniversityMapMarker>();
  markers.set(
    schoolMarkerId(focusedSchool),
    toMarker(focusedSchool, "primary"),
  );

  for (const school of findNearbyUniversities(
    focusedSchool,
    allRows,
    nearbyRadiusKm,
  )) {
    markers.set(schoolMarkerId(school), toMarker(school, "nearby"));
  }

  if (showSidoContext) {
    const focusedSido = matchSidoRegion(focusedSchool.sido);
    if (focusedSido) {
      for (const school of allRows) {
        const matched = matchSidoRegion(school.sido);
        if (!matched || matched.id !== focusedSido.id) continue;
        const key = schoolMarkerId(school);
        if (markers.has(key)) continue;
        markers.set(key, toMarker(school, "sido-context"));
      }
    }
  }

  return [...markers.values()];
}

export function collectMarkerPoints(markers: UniversityMapMarker[]) {
  return markers.map((marker) => ({
    lng: marker.lng,
    lat: marker.lat,
  }));
}
