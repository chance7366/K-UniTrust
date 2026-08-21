/** 도로명주소 → 지번주소·좌표 변환 캐시 (V-World 지오코딩 결과) */

export type AddressGeocodeRow = {
  schoolCodeStd: string;
  roadAddress: string;
  lotAddress: string;
  lng: number;
  lat: number;
  sido: string;
  sigungu: string;
  geocodedAt: string;
};

export const ADDRESS_GEOCODE_CSV_COLUMNS = [
  "school_code_std",
  "road_address",
  "lot_address",
  "lng",
  "lat",
  "sido",
  "sigungu",
  "geocoded_at",
] as const;
