/** 지도 엔진 추상화 타입 (2D OpenLayers / 3D Cesium) */

import type { SidoRegion } from "@/lib/analysis/korea-sido-regions";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";

export type MapDisplayMode = "2d" | "satellite" | "3d" | "boundary";

export type MapViewTarget =
  | { kind: "nationwide" }
  | { kind: "sido"; sido: SidoRegion }
  | { kind: "school"; lng: number; lat: number }
  | { kind: "search-focus"; points: Array<{ lng: number; lat: number }> };

export type MarkerRole = "primary" | "nearby" | "sido-context" | "default";

export type UniversityMapMarker = {
  id: string;
  lng: number;
  lat: number;
  establishment: string;
  role: MarkerRole;
  school: UniversityLocationRow;
};

export type UniversityMapControllerOptions = {
  container: HTMLElement;
  apiKey: string;
  onSelectSchool: (school: UniversityLocationRow) => void;
  onSelectRegion: (sido: SidoRegion, sigungu: string | null) => void;
  /** 지도 드래그·줌 후 중심 시도가 바뀌면 호출 */
  onViewportRegionChange?: (sido: SidoRegion) => void;
};

export interface UniversityMapController {
  readonly ready: boolean;
  mount(): Promise<void>;
  destroy(): void;
  setMarkers(markers: UniversityMapMarker[]): void;
  flyTo(target: MapViewTarget): void;
  setSelectedSidoId(sidoId: string | null): void;
  setDisplayMode(mode: MapDisplayMode): Promise<void>;
  getDisplayMode(): MapDisplayMode;
  resize(): void;
}

export function schoolMarkerId(school: UniversityLocationRow): string {
  return `${school.schoolCodeStd || school.schoolName}-${school.mainBranch}`;
}
