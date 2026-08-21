import * as XLSX from "xlsx";

import {
  STEP1_INDICATOR_LABELS,
  type SchoolKindFilter,
  type Step1IndicatorId,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

export type ExportCell = string | number;

function indicatorLabel(id: string): string {
  return STEP1_INDICATOR_LABELS[id as Step1IndicatorId] ?? id;
}

function fmtExportNumber(value: number | null | undefined): ExportCell {
  if (value == null || Number.isNaN(value)) return "";
  return Math.round(value * 10) / 10;
}

function sortBySchoolKindAndName<
  T extends { schoolKind: string; schoolName: string },
>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.schoolName.localeCompare(b.schoolName, "ko"),
  );
}

function sortStep3Rows(rows: UniversityRunResult[]): UniversityRunResult[] {
  return [...rows].sort((a, b) => {
    if (a.excludedFromRanking !== b.excludedFromRanking) {
      return a.excludedFromRanking ? 1 : -1;
    }
    return (a.compositeRank || 9999) - (b.compositeRank || 9999);
  });
}

export function buildStep1ExportAoa(
  rows: UniversityRawResult[],
  indicatorIds: string[],
  yearLabels: Record<string, string>,
): ExportCell[][] {
  const sorted = sortBySchoolKindAndName(rows);
  const header = [
    "No",
    "학교명",
    "학교종류",
    "재학생수",
    "지역",
    ...indicatorIds.map(
      (id) => `${indicatorLabel(id)}(${yearLabels[id] ?? ""})`,
    ),
  ];

  const body = sorted.map((row, idx) => [
    idx + 1,
    row.schoolName,
    row.schoolKind,
    row.enrolledTotal == null || Number.isNaN(row.enrolledTotal)
      ? ""
      : Math.trunc(row.enrolledTotal),
    row.region,
    ...indicatorIds.map((id) => {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      return cell?.found ? fmtExportNumber(cell.rawValue) : "";
    }),
  ]);

  return [header, ...body];
}

export function buildStep2ExportAoa(
  rows: UniversityRunResult[],
  indicatorIds: string[],
): ExportCell[][] {
  const sorted = sortBySchoolKindAndName(rows);
  const header = [
    "No",
    "학교명",
    "학교종류",
    "설립",
    "지역",
    ...indicatorIds.flatMap((id) => [
      `${indicatorLabel(id)}_지표값`,
      `${indicatorLabel(id)}_지수`,
      `${indicatorLabel(id)}_순위`,
    ]),
  ];

  const body = sorted.map((row, idx) => [
    idx + 1,
    row.schoolName,
    row.schoolKind,
    row.estb,
    row.region,
    ...indicatorIds.flatMap((id) => {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      if (!cell) return ["", "", ""];
      return [
        fmtExportNumber(cell.rawValue),
        fmtExportNumber(cell.indexScore),
        cell.rank || "",
      ];
    }),
  ]);

  return [header, ...body];
}

export function buildStep3ExportAoa(
  rows: UniversityRunResult[],
  indicatorIds: string[],
): ExportCell[][] {
  const sorted = sortStep3Rows(rows);
  const header = [
    "종합순위",
    "학교코드",
    "학교명",
    "학교종류",
    "설립",
    "지역",
    "종합지수",
    "절대지표",
    "순위제외",
    ...indicatorIds.flatMap((id) => [
      `${indicatorLabel(id)}_지표값`,
      `${indicatorLabel(id)}_지수`,
      `${indicatorLabel(id)}_순위`,
    ]),
  ];

  const body = sorted.map((row) => [
    row.excludedFromRanking || !row.compositeRank ? "" : row.compositeRank,
    row.schoolCodeStd,
    row.schoolName,
    row.schoolKind,
    row.estb,
    row.region,
    fmtExportNumber(row.compositeIndex),
    row.absoluteLabels.join(", "),
    row.excludedFromRanking ? "Y" : "",
    ...indicatorIds.flatMap((id) => {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      if (!cell) return ["", "", ""];
      return [
        fmtExportNumber(cell.rawValue),
        fmtExportNumber(cell.indexScore),
        cell.rank || "",
      ];
    }),
  ]);

  return [header, ...body];
}

function csvEscape(cell: ExportCell): string {
  const s = String(cell);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadExportCsv(
  filename: string,
  aoa: ExportCell[][],
): void {
  const csv = aoa
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });
  triggerDownload(blob, filename);
}

export function downloadExportXlsx(
  filename: string,
  aoa: ExportCell[][],
  sheetName = "Sheet1",
): void {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

export function competitivenessExportFilename(
  analysisYear: number,
  step: 1 | 2 | 3,
  format: "csv" | "xlsx",
  schoolKind: SchoolKindFilter,
): string {
  const stepLabel =
    step === 1 ? "step1_raw" : step === 2 ? "step2_index" : "step3_composite";
  const kindLabel =
    schoolKind === "university" ? "university" : "junior_college";
  return `competitiveness_${analysisYear}_${stepLabel}_${kindLabel}.${format}`;
}
