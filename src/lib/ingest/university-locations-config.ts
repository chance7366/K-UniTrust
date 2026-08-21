export type UniversityLocationRow = {
  schoolCodeStd: string;
  schoolName: string;
  mainBranch: string;
  schoolType: string;
  establishment: string;
  roadAddress: string;
  lotAddress: string;
  sido: string;
  sigungu: string;
  lng: number;
  lat: number;
};

export const UNIVERSITY_LOCATIONS_CSV_COLUMNS = [
  "school_code_std",
  "school_name",
  "main_branch",
  "school_type",
  "establishment",
  "road_address",
  "lot_address",
  "sido",
  "sigungu",
  "lng",
  "lat",
  "geocoded_at",
] as const;

export const UNIVERSITY_LOCATION_SCHOOL_TYPES = ["대학교", "전문대학"] as const;
