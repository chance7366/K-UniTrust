import type { HeaderMergeRange } from "./header-merges";

export type FreshmanEnrollmentDatasetKind = "undergrad" | "grad";

export type RawEnrollmentRowMeta = {
  year: number | null;
  yearText: string;
  schoolCodeStd: string;
  schoolKind: string;
  estb: string;
  region: string;
  schoolDivision: string;
  schoolName: string;
};

export type RawEnrollmentRow = RawEnrollmentRowMeta & {
  cells: string[];
};

export type RawEnrollmentSheet = {
  kind: FreshmanEnrollmentDatasetKind;
  label: string;
  fileName: string;
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  rows: RawEnrollmentRow[];
  columnCount: number;
  years: number[];
  uploadedAt: string | null;
  rowCount: number;
};

export type FreshmanEnrollmentAlimiDashboardData = {
  dataset: FreshmanEnrollmentDatasetKind;
  undergrad: RawEnrollmentSheet;
  grad: RawEnrollmentSheet;
  displayYear: number | null;
  filteredRows: RawEnrollmentRow[];
  filterOptions: {
    estbs: string[];
    schoolDivisions: string[];
    schoolKinds: string[];
    regions: string[];
  };
  filters: {
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
    regions: string[];
    search: string;
  };
  hasData: boolean;
};

export type FreshmanEnrollmentAlimiFilterOptions = {
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
};

export type FreshmanEnrollmentAlimiMockData = {
  undergrad: RawEnrollmentSheet;
  grad: RawEnrollmentSheet;
};

export type FreshmanEnrollmentAlimiQuery = {
  dataset?: FreshmanEnrollmentDatasetKind;
  year?: number | null;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
};
