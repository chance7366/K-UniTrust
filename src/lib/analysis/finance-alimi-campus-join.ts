import type { AnalysisTargetCampus } from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type FinanceAlimiNamedRow = {
  schoolCodeStd: string;
  schoolName: string;
};

export function financeAlimiSchoolName(
  raw: Record<string, string>,
): string {
  return (raw.school_name ?? "").trim();
}

export function normalizeFinanceAlimiSchoolName(
  name: string | null | undefined,
): string {
  return String(name ?? "")
    .replace(/\s+/g, "")
    .replace(/[()[\]（）【】]/g, "");
}

export function financeAlimiNameMatchesCampus(
  alimiName: string,
  campus: Pick<AnalysisTargetCampus, "schoolName" | "schoolRepName">,
): boolean {
  const alimi = normalizeFinanceAlimiSchoolName(alimiName);
  if (!alimi) return false;
  for (const raw of [campus.schoolName, campus.schoolRepName]) {
    const campusName = normalizeFinanceAlimiSchoolName(raw);
    if (!campusName) continue;
    if (
      alimi === campusName ||
      campusName.startsWith(alimi) ||
      alimi.startsWith(campusName)
    ) {
      return true;
    }
  }
  return false;
}

export function findFinanceAlimiRowForCampus<T extends FinanceAlimiNamedRow>(
  campus: Pick<
    AnalysisTargetCampus,
    "schoolCodeStd" | "schoolName" | "schoolRepName"
  >,
  yearRows: T[],
  used: Set<T>,
): T | undefined {
  const byCode = yearRows.find(
    (row) => row.schoolCodeStd === campus.schoolCodeStd && !used.has(row),
  );
  if (byCode) {
    used.add(byCode);
    return byCode;
  }
  const byName = yearRows.find(
    (row) =>
      !used.has(row) && financeAlimiNameMatchesCampus(row.schoolName, campus),
  );
  if (byName) {
    used.add(byName);
    return byName;
  }
  return undefined;
}
