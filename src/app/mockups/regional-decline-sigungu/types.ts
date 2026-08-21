export type RegionalDeclineMockCell = {
  index: number;
  grade: number;
  women2039: number | null;
  senior65: number | null;
};

export type RegionalDeclineMockSidoRow = {
  region: string;
  regionFull: string;
  regionCode: string;
  byYear: Record<number, RegionalDeclineMockCell>;
};

export type RegionalDeclineMockSigunguRow = {
  sido: string;
  name: string;
  fullName: string;
  regionCode: string;
  byYear: Record<number, RegionalDeclineMockCell>;
};

export type RegionalDeclineSigunguMockData = {
  years: number[];
  defaultDisplayYears: number[];
  sidoRows: RegionalDeclineMockSidoRow[];
  sigunguRows: RegionalDeclineMockSigunguRow[];
  sourceFileName: string;
  rowCount: number;
  sidoCount: number;
  sigunguCount: number;
};
