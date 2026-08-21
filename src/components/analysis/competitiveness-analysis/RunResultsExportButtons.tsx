"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  competitivenessExportFilename,
  downloadExportCsv,
  downloadExportXlsx,
  type ExportCell,
} from "@/lib/competitiveness-analysis/export-run-results";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import "./run-export-buttons.css";

type RunResultsExportButtonsProps = {
  step: 1 | 2 | 3;
  analysisYear: number;
  schoolKind: SchoolKindFilter;
  universityCount: number;
  juniorCollegeCount: number;
  buildRows: (kind: SchoolKindFilter) => ExportCell[][];
};

export function RunResultsExportButtons({
  step,
  analysisYear,
  schoolKind,
  universityCount,
  juniorCollegeCount,
  buildRows,
}: RunResultsExportButtonsProps) {
  const sheetName =
    step === 1 ? "1단계_원지표" : step === 2 ? "2단계_지수순위" : "3단계_종합";
  const disabled =
    schoolKind === "university" ? universityCount <= 0 : juniorCollegeCount <= 0;

  function exportCurrent(format: "csv" | "xlsx") {
    const aoa = buildRows(schoolKind);
    if (aoa.length <= 1) return;
    const filename = competitivenessExportFilename(
      analysisYear,
      step,
      format,
      schoolKind,
    );
    if (format === "csv") {
      downloadExportCsv(filename, aoa);
    } else {
      downloadExportXlsx(filename, aoa, sheetName);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => exportCurrent("csv")}
        disabled={disabled}
        className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
      >
        CSV
      </button>
      <button
        type="button"
        onClick={() => exportCurrent("xlsx")}
        disabled={disabled}
        className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
      >
        Excel
      </button>
    </div>
  );
}
