export type SchoolDivGroup = "대학" | "전문대학";

export type TableFilterRow = {
  estb?: string;
  schoolKind?: string;
  schoolDivision?: string;
};

const EXCLUDED_ESTB = new Set(["특별법국립", "특별법법인"]);

export function normalizeEstbGroup(
  estb: string,
): "국공립" | "사립" | null {
  if (EXCLUDED_ESTB.has(estb)) return null;
  if (estb === "사립") return "사립";
  if (estb === "국립" || estb === "공립" || estb === "국립대법인") {
    return "국공립";
  }
  return null;
}

export function resolveSchoolKindDivision(
  schoolKind: string,
): SchoolDivGroup | null {
  const kind = schoolKind.trim();
  if (!kind || kind.includes("대학원")) return null;
  if (kind.includes("전문")) return "전문대학";
  if (kind === "기능대학" || kind === "기술대학") return "전문대학";
  if (kind.includes("대학")) return "대학";
  return null;
}

export function resolveSchoolDivisionFromFields(
  schoolKind: string,
  schoolDivision: string,
): SchoolDivGroup | null {
  const fromKind = resolveSchoolKindDivision(schoolKind);
  if (fromKind) return fromKind;

  const div = schoolDivision.trim();
  if (!div) return null;
  if (div.includes("대학원")) return null;
  if (div.includes("전문")) return "전문대학";
  if (div.includes("대학")) return "대학";
  return null;
}

export function rowMatchesSchoolDivisionFilter(
  row: TableFilterRow,
  schoolDivisionFilter: string,
): boolean {
  if (!schoolDivisionFilter) return true;
  const resolved = resolveSchoolDivisionFromFields(
    row.schoolKind ?? "",
    row.schoolDivision ?? "",
  );
  return resolved === schoolDivisionFilter;
}

export function getTableSchoolKindOptions(
  rows: TableFilterRow[],
  estbFilter: string,
  schoolDivisionFilter: string,
): string[] {
  const kinds = new Set<string>();
  for (const row of rows) {
    if (estbFilter && row.estb !== estbFilter) continue;
    if (!rowMatchesSchoolDivisionFilter(row, schoolDivisionFilter)) continue;
    if (row.schoolKind) kinds.add(row.schoolKind);
  }
  return [...kinds].sort((a, b) => a.localeCompare(b, "ko"));
}
