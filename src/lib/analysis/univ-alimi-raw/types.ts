import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";

export type UnivAlimiDatasetKind = "undergrad" | "grad";

export type UnivAlimiIndicatorId =
  | "enrolled-enrollment"
  | "dropout-rate"
  | "enrolled-students"
  | "foreign-students"
  | "foreign-dropout"
  | "origin-school"
  | "avg-tuition"
  | "edu-fund"
  | "edu-fund-expense"
  | "edu-balance"
  | "edu-operation"
  | "tuition-fund"
  | "tuition-fund-expense"
  | "tuition-balance"
  | "tuition-operation"
  | "non-tuition-fund"
  | "non-tuition-fund-expense"
  | "non-tuition-balance"
  | "non-tuition-operation"
  | "corp-fund"
  | "corp-fund-expense"
  | "corp-balance"
  | "corp-operation"
  | "industry-cash"
  | "industry-balance"
  | "industry-operation"
  | "income-property"
  | "financial-support";

export type UnivAlimiColMap = {
  year: number;
  schoolCode: number;
  schoolKind: number;
  estb: number;
  region: number;
  status: number;
  schoolName?: number;
  gradName?: number;
  firstMetric: number;
};

export type UnivAlimiRawRow = {
  year: number | null;
  yearText: string;
  schoolCodeStd: string;
  schoolKind: string;
  estb: string;
  region: string;
  schoolDivision: string;
  schoolName: string;
  cells: string[];
};

export type UnivAlimiRawSheet = {
  kind: UnivAlimiDatasetKind;
  label: string;
  fileName: string;
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  rows: UnivAlimiRawRow[];
  columnCount: number;
  years: number[];
  uploadedAt: string | null;
  rowCount: number;
};

export type UnivAlimiRawDashboardData = {
  indicator: UnivAlimiIndicatorId;
  dataset: UnivAlimiDatasetKind;
  undergrad: UnivAlimiRawSheet;
  grad: UnivAlimiRawSheet;
  displayYear: number | null;
  filteredRows: UnivAlimiRawRow[];
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

export type UnivAlimiRawQuery = {
  dataset?: UnivAlimiDatasetKind;
  year?: number | null;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
};

export type UnivAlimiHelpCopy = {
  overview: string;
  source: string;
  management: string;
  notes: string;
  undergradForm: string;
  gradForm?: string;
};

export type UnivAlimiScreenConfig = {
  id: UnivAlimiIndicatorId;
  tabId: string;
  title: string;
  subtitle: string;
  apiBase: string;
  datasets: UnivAlimiDatasetKind[];
  help: UnivAlimiHelpCopy;
};
