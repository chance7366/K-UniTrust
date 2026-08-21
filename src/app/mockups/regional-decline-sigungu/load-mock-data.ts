import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

import { pickDefaultDisplayYears } from "@/lib/ingest/regional-decline-config";
import { REGIONAL_DECLINE_REGION_ORDER } from "@/lib/ingest/regional-decline-config";

import type {
  RegionalDeclineMockCell,
  RegionalDeclineMockSidoRow,
  RegionalDeclineMockSigunguRow,
  RegionalDeclineSigunguMockData,
} from "./types";

export const REGIONAL_DECLINE_SIGUNGU_XLSX_PATH =
  "d:/바이브코딩/데이터관리/지역인구/지역소멸/(업로드)연령별인구현황_소멸지수_시군구.xlsx";

const SIDO_FULL_TO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원도: "강원",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

function s(v: unknown): string {
  return v == null ? "" : String(v).replace(/\s+/g, " ").trim();
}

function num(v: unknown): number | null {
  const t = s(v).replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 지방소멸위험분류: 10 미만 5, 20 미만 4, 40 미만 3, 60 미만 2, 100 미만 1, 100 이상 0 */
export function gradeFromExtinctionIndex(index: number): number {
  if (index < 10) return 5;
  if (index < 20) return 4;
  if (index < 40) return 3;
  if (index < 60) return 2;
  if (index < 100) return 1;
  return 0;
}

function regionSortKey(name: string): number {
  const idx = REGIONAL_DECLINE_REGION_ORDER.indexOf(
    name as (typeof REGIONAL_DECLINE_REGION_ORDER)[number],
  );
  return idx >= 0 ? idx : 999;
}

function toShortSido(full: string): string | null {
  return SIDO_FULL_TO_SHORT[full] ?? null;
}

function sigunguLabel(fullName: string, sidoFull: string): string {
  const rest = fullName.slice(sidoFull.length).trim();
  return rest || fullName;
}

function makeCell(
  index: number,
  women2039: number | null,
  senior65: number | null,
): RegionalDeclineMockCell {
  return {
    index,
    grade: gradeFromExtinctionIndex(index),
    women2039,
    senior65,
  };
}

export function loadRegionalDeclineSigunguMockData(
  filePath = REGIONAL_DECLINE_SIGUNGU_XLSX_PATH,
): RegionalDeclineSigunguMockData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`목업 원본 파일이 없습니다: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const sidoMap = new Map<string, RegionalDeclineMockSidoRow>();
  const sigunguMap = new Map<string, RegionalDeclineMockSigunguRow>();
  const yearSet = new Set<number>();
  let rowCount = 0;

  for (let i = 2; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const code = s(row[1]);
    const fullName = s(row[2]);
    const women2039 = num(row[3]);
    const senior65 = num(row[4]);
    const index = num(row[5]);
    if (!year || !fullName || index == null) continue;

    yearSet.add(year);
    rowCount += 1;
    const cell = makeCell(index, women2039, senior65);
    const tokens = fullName.split(" ");
    const sidoFull = tokens[0] ?? "";
    const sidoShort = toShortSido(sidoFull);
    if (!sidoShort) continue;

    if (tokens.length === 1) {
      let entry = sidoMap.get(sidoShort);
      if (!entry) {
        entry = {
          region: sidoShort,
          regionFull: fullName,
          regionCode: code,
          byYear: {},
        };
        sidoMap.set(sidoShort, entry);
      }
      entry.regionFull = fullName;
      if (code) entry.regionCode = code;
      entry.byYear[year] = cell;
      continue;
    }

    const name = sigunguLabel(fullName, sidoFull);
    const key = `${sidoShort}::${code || name}`;
    let entry = sigunguMap.get(key);
    if (!entry) {
      entry = {
        sido: sidoShort,
        name,
        fullName,
        regionCode: code,
        byYear: {},
      };
      sigunguMap.set(key, entry);
    }
    entry.fullName = fullName;
    entry.name = name;
    if (code) entry.regionCode = code;
    entry.byYear[year] = cell;
  }

  const years = [...yearSet].sort((a, b) => a - b);

  const sidoRows = [...sidoMap.values()].sort(
    (a, b) =>
      regionSortKey(a.region) - regionSortKey(b.region) ||
      a.region.localeCompare(b.region, "ko"),
  );

  const nationalByYear: Record<number, RegionalDeclineMockCell> = {};
  for (const year of years) {
    let women = 0;
    let senior = 0;
    let has = false;
    for (const row of sidoRows) {
      const cell = row.byYear[year];
      if (!cell || cell.women2039 == null || cell.senior65 == null) continue;
      women += cell.women2039;
      senior += cell.senior65;
      has = true;
    }
    if (!has || senior <= 0) continue;
    nationalByYear[year] = makeCell((women / senior) * 100, women, senior);
  }

  const nationalRow: RegionalDeclineMockSidoRow = {
    region: "전국",
    regionFull: "전국",
    regionCode: "00",
    byYear: nationalByYear,
  };

  const sigunguRows = [...sigunguMap.values()].sort(
    (a, b) =>
      regionSortKey(a.sido) - regionSortKey(b.sido) ||
      a.name.localeCompare(b.name, "ko"),
  );

  return {
    years,
    defaultDisplayYears: pickDefaultDisplayYears(years),
    sidoRows: [nationalRow, ...sidoRows],
    sigunguRows,
    sourceFileName: path.basename(filePath),
    rowCount,
    sidoCount: sidoRows.length,
    sigunguCount: sigunguRows.length,
  };
}
