"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { UniversityLocationsMap } from "@/components/analysis/UniversityLocationsMap";
import { UniversitySearchCombobox } from "@/components/analysis/UniversitySearchCombobox";
import { buildUniversityLocationsHref } from "@/lib/analysis/university-locations-navigation";
import {
  KOREA_SIDO_REGIONS,
  matchSidoRegion,
  type SidoRegion,
} from "@/lib/analysis/korea-sido-regions";
import {
  buildUniversityMapMarkers,
  collectMarkerPoints,
} from "@/lib/data/university-map-markers";
import {
  findNearbyUniversities,
  NEARBY_RADIUS_OPTIONS_KM,
  type NearbyRadiusKm,
} from "@/lib/data/nearby-universities";
import type { UniversityLocationsDashboardData } from "@/lib/data/university-locations";
import { formatDistanceKm } from "@/lib/geo/spatial-query";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import type { MapDisplayMode } from "@/lib/map/types";

function schoolKey(row: UniversityLocationRow) {
  return `${row.schoolCodeStd || row.schoolName}-${row.mainBranch}`;
}

function establishmentBadgeClass(establishment: string) {
  if (establishment.includes("국립") || establishment === "공립") {
    return "border-sky-600/50 bg-sky-100 font-semibold text-sky-800";
  }
  if (establishment === "사립") {
    return "border-orange-600/55 bg-orange-100 font-semibold text-orange-800";
  }
  return "border-border bg-surface-2 font-medium text-foreground";
}

function establishmentTextClass(establishment: string) {
  if (establishment.includes("국립") || establishment === "공립") {
    return "text-sky-800";
  }
  if (establishment === "사립") {
    return "text-orange-800";
  }
  return "text-muted";
}

function handleSchoolListWheel(event: React.WheelEvent<HTMLDivElement>) {
  const element = event.currentTarget;
  const canScrollUp = element.scrollTop > 0;
  const canScrollDown =
    element.scrollTop + element.clientHeight < element.scrollHeight - 1;

  if (
    (event.deltaY < 0 && canScrollUp) ||
    (event.deltaY > 0 && canScrollDown)
  ) {
    event.stopPropagation();
  }
}

export function UniversityLocationsDashboard({
  data,
}: {
  data: UniversityLocationsDashboardData;
}) {
  const router = useRouter();
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [focusedSchool, setFocusedSchool] = useState<UniversityLocationRow | null>(
    null,
  );
  const [mapMode, setMapMode] = useState<MapDisplayMode>("2d");
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<NearbyRadiusKm>(10);
  const [showSidoContext, setShowSidoContext] = useState(false);

  const { selectedSido, filters } = data;

  const mapMarkers = useMemo(
    () =>
      buildUniversityMapMarkers({
        allRows: data.allRows,
        browsingRows: data.rows,
        focusedSchool,
        nearbyRadiusKm,
        showSidoContext,
        selectedSido,
      }),
    [
      data.allRows,
      data.rows,
      focusedSchool,
      nearbyRadiusKm,
      showSidoContext,
      selectedSido,
    ],
  );

  const nearbySchools = useMemo(() => {
    if (!focusedSchool) return [];
    return findNearbyUniversities(
      focusedSchool,
      data.allRows,
      nearbyRadiusKm,
    );
  }, [focusedSchool, data.allRows, nearbyRadiusKm]);

  function selectSchool(school: UniversityLocationRow) {
    setHighlightedCode(school.schoolCodeStd || school.schoolName);
    setFocusedSchool(school);
  }

  function navigate(next: { sidoId?: string; sigungu?: string; reset?: boolean }) {
    router.push(
      buildUniversityLocationsHref({
        sidoId: next.reset ? "" : (next.sidoId ?? filters.sidoId),
        sigungu: next.reset ? "" : (next.sigungu ?? filters.sigungu),
        resetFilters: next.reset,
      }),
    );
    setHighlightedCode(null);
    setFocusedSchool(null);
  }

  function handleSelectRegion(sido: SidoRegion, sigungu: string | null) {
    navigate({ sidoId: sido.id, sigungu: sigungu ?? "" });
  }

  function handleSearchSelect(school: UniversityLocationRow) {
    const sido = matchSidoRegion(school.sido);
    if (sido) {
      router.push(
        buildUniversityLocationsHref({
          sidoId: sido.id,
          sigungu: "",
        }),
      );
    }
    selectSchool(school);
  }

  const searchFocusPoints = useMemo(() => {
    if (!focusedSchool) return null;
    return collectMarkerPoints(mapMarkers);
  }, [focusedSchool, mapMarkers]);

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="대학별 위치·지도 조회"
        title="대학위치"
      />
      {!data.hasData ? (
        <p className="text-xs text-warning">
          좌표 데이터가 없습니다. 관리자에게 위치 데이터 생성을 요청하세요.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ reset: true })}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            !selectedSido
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          전국
        </button>
        {KOREA_SIDO_REGIONS.map((sido) => (
          <button
            key={sido.id}
            type="button"
            onClick={() => handleSelectRegion(sido, null)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              selectedSido?.id === sido.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {sido.shortLabel}
          </button>
        ))}
        <div className="ml-auto w-full min-w-[220px] max-w-md shrink-0 sm:w-72">
          <UniversitySearchCombobox
            schools={data.allRows}
            onSelect={handleSearchSelect}
            compact
            className="max-w-none"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="relative w-full min-w-0 lg:sticky lg:top-6 lg:self-start">
          <div className="relative w-full pb-[100%] lg:h-[calc(100dvh-13rem)] lg:max-h-[780px] lg:pb-0">
            <div className="absolute inset-0">
              <UniversityLocationsMap
                markers={mapMarkers}
                selection={{ sido: selectedSido, sigungu: filters.sigungu || null }}
                focusedSchool={focusedSchool}
                searchFocusPoints={searchFocusPoints}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
                onSelectRegion={handleSelectRegion}
                onSelectSchool={selectSchool}
              />
            </div>
          </div>
        </div>

        <aside className="flex max-h-[50vh] min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold text-accent-cyan">
              <span className="text-base">대학 목록</span>
              <span className="text-sm">
                (
                {selectedSido
                  ? `${selectedSido.label}${filters.sigungu ? `·${filters.sigungu}` : ""}`
                  : "전국"}
                ·{data.rows.length.toLocaleString("ko-KR")}건)
              </span>
            </h2>
          </div>

          {selectedSido && data.sigunguOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-b border-border/60 px-4 py-2">
              <button
                type="button"
                onClick={() => navigate({ sigungu: "" })}
                className={`rounded-md border px-2 py-0.5 text-[11px] ${
                  !filters.sigungu
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-surface-2 text-muted"
                }`}
              >
                전체
              </button>
              {data.sigunguOptions.map((sgg) => (
                <button
                  key={sgg}
                  type="button"
                  onClick={() => navigate({ sigungu: sgg })}
                  className={`rounded-md border px-2 py-0.5 text-[11px] ${
                    filters.sigungu === sgg
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface-2 text-muted"
                  }`}
                >
                  {sgg}
                </button>
              ))}
            </div>
          ) : null}

          {focusedSchool ? (
            <div className="border-b border-border/60 px-4 py-3">
              <div className="mb-2 rounded-lg border border-accent-cyan/30 bg-accent/5 px-3 py-2">
                <p className={FDB_TYPO.legend}>검색/선택 대학</p>
                <p className="text-sm font-semibold text-foreground">
                  {focusedSchool.schoolName}
                  {focusedSchool.mainBranch !== "본교" ? (
                    <span className="ml-1 text-xs text-muted">
                      ({focusedSchool.mainBranch})
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">주변 대학</h3>
                <div className="flex flex-wrap gap-1">
                  {NEARBY_RADIUS_OPTIONS_KM.map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setNearbyRadiusKm(km)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] ${
                        nearbyRadiusKm === km
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted"
                      }`}
                    >
                      {km}km
                    </button>
                  ))}
                </div>
              </div>
              <p className={`mt-1 ${FDB_TYPO.legend}`}>
                {focusedSchool.schoolName} 기준 · {nearbyRadiusKm}km 이내 ·{" "}
                {nearbySchools.length}건
              </p>
              {nearbySchools.length > 0 ? (
                <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                  {nearbySchools.map((school) => (
                    <li key={schoolKey(school)}>
                      <button
                        type="button"
                        onClick={() => selectSchool(school)}
                        className="flex w-full items-center justify-between rounded-md border border-transparent bg-surface-2/50 px-2 py-1.5 text-left text-[11px] hover:border-border"
                      >
                        <span className="truncate font-medium">
                          {school.schoolName}
                        </span>
                        <span className="ml-2 shrink-0 text-muted">
                          {formatDistanceKm(school.distanceKm)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 ${FDB_TYPO.legend}`}>
                  반경 내 다른 대학이 없습니다.
                </p>
              )}

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={showSidoContext}
                  onChange={(event) => setShowSidoContext(event.target.checked)}
                  className="rounded border-border"
                />
                동일 시·도 내 다른 대학 연하게 표시
              </label>
            </div>
          ) : null}

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2"
            onWheel={handleSchoolListWheel}
          >
            {!data.hasData ? (
              <p className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}>
                표시할 위치 데이터가 없습니다.
              </p>
            ) : data.rows.length === 0 ? (
              <p className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}>
                선택한 지역에 표시할 대학이 없습니다.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-1 p-0">
                {data.rows.map((school) => {
                  const key = schoolKey(school);
                  const active =
                    highlightedCode === school.schoolCodeStd ||
                    highlightedCode === school.schoolName;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => selectSchool(school)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "border-accent-cyan/50 bg-accent/10"
                            : "border-transparent bg-surface-2/40 hover:border-border hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-accent-cyan">
                              {school.schoolName}
                              {school.mainBranch !== "본교" ? (
                                <span className="ml-1 text-xs font-medium text-accent-cyan/70">
                                  ({school.mainBranch})
                                </span>
                              ) : null}
                            </p>
                            <p
                              className={`mt-0.5 truncate ${FDB_TYPO.legend} ${establishmentTextClass(school.establishment)}`}
                            >
                              {school.sigungu ? `${school.sigungu} · ` : ""}
                              {school.roadAddress}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${establishmentBadgeClass(school.establishment)}`}
                          >
                            {school.establishment}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-xs font-semibold ${establishmentTextClass(school.establishment)}`}
                        >
                          {school.schoolType}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
