"use client";

import { useEffect, useRef, useState } from "react";

import type { SidoRegion } from "@/lib/analysis/korea-sido-regions";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import {
  MARKER_COLORS,
} from "@/lib/map/marker-colors";
import {
  createUniversityMapController,
} from "@/lib/map/university-map-controller";
import type { UniversityMapController } from "@/lib/map/types";
import {
  type MapDisplayMode,
  type MapViewTarget,
  type UniversityMapMarker,
} from "@/lib/map/types";

type Selection = {
  sido: SidoRegion | null;
  sigungu: string | null;
};

type UniversityLocationsMapProps = {
  markers: UniversityMapMarker[];
  selection: Selection;
  focusedSchool: UniversityLocationRow | null;
  searchFocusPoints: Array<{ lng: number; lat: number }> | null;
  mapMode?: MapDisplayMode;
  onMapModeChange?: (mode: MapDisplayMode) => void;
  onSelectRegion: (sido: SidoRegion, sigungu: string | null) => void;
  onSelectSchool: (school: UniversityLocationRow) => void;
};

export function UniversityLocationsMap({
  markers = [],
  selection,
  focusedSchool,
  searchFocusPoints,
  mapMode: mapModeProp,
  onMapModeChange: onMapModeChangeProp,
  onSelectRegion,
  onSelectSchool,
}: UniversityLocationsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<UniversityMapController | null>(null);
  const onSelectSchoolRef = useRef(onSelectSchool);
  const onSelectRegionRef = useRef(onSelectRegion);
  const skipFlyToRef = useRef(false);
  const selectionSidoIdRef = useRef(selection.sido?.id ?? null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);

  const [internalMapMode, setInternalMapMode] = useState<MapDisplayMode>("2d");
  const mapMode = mapModeProp ?? internalMapMode;
  const onMapModeChange = onMapModeChangeProp ?? setInternalMapMode;

  const focusedKey = focusedSchool
    ? `${focusedSchool.schoolCodeStd}-${focusedSchool.lng}-${focusedSchool.lat}`
    : null;

  onSelectSchoolRef.current = onSelectSchool;
  onSelectRegionRef.current = onSelectRegion;
  selectionSidoIdRef.current = selection.sido?.id ?? null;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VWORLD_MAP_KEY?.trim();
    if (!apiKey) {
      setMapError("NEXT_PUBLIC_VWORLD_MAP_KEY가 .env에 설정되지 않았습니다.");
      return;
    }

    const container = mapContainerRef.current;
    if (!container || controllerRef.current) return;

    let cancelled = false;
    let mountObserver: ResizeObserver | null = null;
    let controller: UniversityMapController | null = null;

    const mountMap = () => {
      if (cancelled || controllerRef.current || !container) return;
      if (container.clientWidth < 2 || container.clientHeight < 2) return;

      controller = createUniversityMapController({
        container,
        apiKey,
        onSelectSchool: (school) => onSelectSchoolRef.current(school),
        onSelectRegion: (sido, sigungu) =>
          onSelectRegionRef.current(sido, sigungu),
        onViewportRegionChange: (sido) => {
          if (sido.id === selectionSidoIdRef.current) return;
          skipFlyToRef.current = true;
          onSelectRegionRef.current(sido, null);
        },
      });

      controllerRef.current = controller;

      controller
        .mount()
        .then(() => {
          if (cancelled || !controllerRef.current) return;
          requestAnimationFrame(() => {
            controllerRef.current?.resize();
            setMapReady(true);
          });
        })
        .catch(() => setMapError("지도를 초기화하지 못했습니다."));
    };

    mountMap();
    if (!controllerRef.current) {
      mountObserver = new ResizeObserver(() => {
        mountMap();
        if (controllerRef.current) {
          mountObserver?.disconnect();
          mountObserver = null;
        }
      });
      mountObserver.observe(container);
    }

    return () => {
      cancelled = true;
      mountObserver?.disconnect();
      controller?.destroy();
      controllerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!mapReady || !controller) return;

    controller.setSelectedSidoId(selection.sido?.id ?? null);
  }, [mapReady, selection.sido?.id]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!mapReady || !controller) return;

    controller.setMarkers(markers);
  }, [markers, mapReady]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!mapReady || !controller) return;

    if (skipFlyToRef.current) {
      skipFlyToRef.current = false;
      return;
    }

    let target: MapViewTarget;
    if (focusedSchool && searchFocusPoints && searchFocusPoints.length > 0) {
      target = { kind: "search-focus", points: searchFocusPoints };
    } else if (focusedSchool) {
      target = {
        kind: "school",
        lng: focusedSchool.lng,
        lat: focusedSchool.lat,
      };
    } else if (selection.sido) {
      target = { kind: "sido", sido: selection.sido };
    } else {
      target = { kind: "nationwide" };
    }

    controller.flyTo(target);
  }, [focusedKey, selection.sido, mapReady, focusedSchool, searchFocusPoints]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!mapReady || !controller) return;

    let cancelled = false;
    setModeLoading(true);
    controller
      .setDisplayMode(mapMode)
      .catch(() => {
        if (!cancelled) onMapModeChange("2d");
      })
      .finally(() => {
        if (!cancelled) setModeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mapMode, mapReady, onMapModeChange]);

  useEffect(() => {
    const controller = controllerRef.current;
    const container = mapContainerRef.current;
    if (!mapReady || !controller || !container) return;

    const observer = new ResizeObserver(() => {
      controller.resize();
    });
    observer.observe(container);
    controller.resize();

    return () => observer.disconnect();
  }, [mapReady]);

  const showSearchLegend = markers.some(
    (marker) => marker.role === "nearby" || marker.role === "sido-context",
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-surface-2">
      {mapError ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-accent-orange">
          {mapError}
        </div>
      ) : (
        <>
          <div ref={mapContainerRef} className="h-full w-full" />
          {!mapReady || modeLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm text-muted">
              {modeLoading ? "지도 전환 중…" : "지도 로딩 중…"}
            </div>
          ) : null}
        </>
      )}

      <div className="absolute left-3 top-3 flex flex-wrap gap-1 rounded-lg border border-border/60 bg-surface/90 p-1">
        <button
          type="button"
          onClick={() => onMapModeChange("2d")}
          className={`rounded-md px-2.5 py-1 text-[11px] ${
            mapMode === "2d"
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => onMapModeChange("satellite")}
          className={`rounded-md px-2.5 py-1 text-[11px] ${
            mapMode === "satellite"
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          위성
        </button>
        <button
          type="button"
          onClick={() => onMapModeChange("3d")}
          className={`rounded-md px-2.5 py-1 text-[11px] ${
            mapMode === "3d"
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          3D
        </button>
        <button
          type="button"
          onClick={() => onMapModeChange("boundary")}
          className={`rounded-md px-2.5 py-1 text-[11px] ${
            mapMode === "boundary"
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          경계
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-3 rounded-lg border border-border/60 bg-surface/90 px-3 py-2 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MARKER_COLORS.public }}
          />
          국·공립
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MARKER_COLORS.private }}
          />
          사립
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MARKER_COLORS.primary }}
          />
          선택
        </span>
        {showSearchLegend ? (
          <>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: MARKER_COLORS.private }}
              />
              주변
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: MARKER_COLORS.private,
                  opacity: MARKER_COLORS.sidoContextOpacity,
                }}
              />
              동일 시·도
            </span>
          </>
        ) : null}
      </div>
      <div className="pointer-events-none absolute right-3 top-3 max-w-[220px] rounded-lg border border-border/60 bg-surface/90 px-3 py-2 text-[11px] text-muted">
        {mapMode === "3d"
          ? "3D 지구본 모드 — 드래그로 회전, 휠로 확대합니다."
          : mapMode === "satellite"
            ? "위성 지도 모드입니다. 대학 검색 후 주변·동일 시도 대학을 확인하세요."
            : mapMode === "boundary"
              ? "경계 지도 — 어두운 배경에 시·도·시군구 경계선만 표시됩니다."
              : "대학을 검색하거나 지도를 드래그해 지역별 대학을 확인하세요."}
      </div>
    </div>
  );
}
