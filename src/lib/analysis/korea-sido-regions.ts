/** 시도 클릭 영역 (목업·프로덕션 공통, EPSG:4326 bbox) */

export type SidoRegion = {
  id: string;
  label: string;
  shortLabel: string;
  bbox: [number, number, number, number];
  center: [number, number];
};

/** 대한민국 전체 bbox [minLng, minLat, maxLng, maxLat] EPSG:4326 */
export const KOREA_BBOX: [number, number, number, number] = [
  124.6, 33.0, 131.9, 38.7,
];

export const KOREA_CENTER: [number, number] = [127.8, 36.2];

const METRO_SIDO_IDS = new Set([
  "seoul",
  "busan",
  "daegu",
  "incheon",
  "gwangju",
  "daejeon",
  "ulsan",
  "sejong",
]);

/** 시도 선택 시 지도 줌 (화면 중앙 기준) */
export function getSidoMapZoom(sido: SidoRegion): number {
  if (METRO_SIDO_IDS.has(sido.id)) return 11;
  if (sido.id === "jeju") return 10;
  return 9;
}

export const KOREA_SIDO_REGIONS: SidoRegion[] = [
  { id: "seoul", label: "서울특별시", shortLabel: "서울", bbox: [126.76, 37.42, 127.18, 37.7], center: [126.978, 37.5665] },
  { id: "busan", label: "부산광역시", shortLabel: "부산", bbox: [128.74, 35.0, 129.32, 35.4], center: [129.0756, 35.1796] },
  { id: "daegu", label: "대구광역시", shortLabel: "대구", bbox: [128.45, 35.68, 128.78, 36.0], center: [128.6014, 35.8714] },
  { id: "incheon", label: "인천광역시", shortLabel: "인천", bbox: [126.3, 37.26, 126.89, 37.75], center: [126.7052, 37.4563] },
  { id: "gwangju", label: "광주광역시", shortLabel: "광주", bbox: [126.68, 35.07, 127.0, 35.24], center: [126.8526, 35.1595] },
  { id: "daejeon", label: "대전광역시", shortLabel: "대전", bbox: [127.25, 36.22, 127.55, 36.48], center: [127.3845, 36.3504] },
  { id: "ulsan", label: "울산광역시", shortLabel: "울산", bbox: [129.0, 35.33, 129.48, 35.7], center: [129.3114, 35.5384] },
  { id: "sejong", label: "세종특별자치시", shortLabel: "세종", bbox: [127.14, 36.42, 127.4, 36.6], center: [127.289, 36.48] },
  { id: "gyeonggi", label: "경기도", shortLabel: "경기", bbox: [126.45, 36.89, 127.98, 38.3], center: [127.008, 37.4138] },
  { id: "gangwon", label: "강원특별자치도", shortLabel: "강원", bbox: [127.05, 37.02, 129.46, 38.61], center: [128.1555, 37.8228] },
  { id: "chungbuk", label: "충청북도", shortLabel: "충북", bbox: [127.38, 36.26, 128.7, 37.22], center: [127.491, 36.8] },
  { id: "chungnam", label: "충청남도", shortLabel: "충남", bbox: [126.08, 35.97, 127.68, 36.95], center: [126.8, 36.5184] },
  { id: "jeonbuk", label: "전북특별자치도", shortLabel: "전북", bbox: [126.38, 35.25, 127.8, 36.19], center: [127.108, 35.7175] },
  { id: "jeonnam", label: "전라남도", shortLabel: "전남", bbox: [125.99, 34.21, 127.59, 35.73], center: [126.991, 34.8679] },
  { id: "gyeongbuk", label: "경상북도", shortLabel: "경북", bbox: [127.98, 35.67, 129.61, 37.52], center: [128.888, 36.4919] },
  { id: "gyeongnam", label: "경상남도", shortLabel: "경남", bbox: [127.57, 34.68, 129.3, 35.9], center: [128.691, 35.4606] },
  { id: "jeju", label: "제주특별자치도", shortLabel: "제주", bbox: [126.15, 33.19, 126.97, 33.57], center: [126.5312, 33.4996] },
];

export function findSidoById(id: string | null | undefined): SidoRegion | null {
  if (!id) return null;
  return KOREA_SIDO_REGIONS.find((r) => r.id === id) ?? null;
}

export function findSidoAtPoint(lng: number, lat: number): SidoRegion | null {
  for (const region of KOREA_SIDO_REGIONS) {
    const [minLng, minLat, maxLng, maxLat] = region.bbox;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return region;
    }
  }
  return null;
}

export function matchSidoRegion(
  sido: string,
  shortRegion?: string,
): SidoRegion | null {
  const norm = sido.trim();
  if (!norm && !shortRegion) return null;

  return (
    KOREA_SIDO_REGIONS.find(
      (r) =>
        norm.includes(r.label) ||
        r.label.includes(norm) ||
        (shortRegion &&
          (r.shortLabel === shortRegion || norm.includes(r.shortLabel))),
    ) ?? null
  );
}
