/** 대학알리미 표 화면 전용 — 업로드 양식·DB 내보내기는 변경하지 않는다. */

export type AlimiIdentityCols = {
  year: number;
  schoolCode: number;
  schoolKind: number;
  estb: number;
  region: number;
  status: number;
  schoolName?: number;
  gradName?: number;
};

export const UNIV_ALIMI_IDENTITY_CHROME_IDS = new Set([
  "enrolled-enrollment",
  "dropout-rate",
  "enrolled-students",
  "origin-school",
  "avg-tuition",
]);

export const UNIV_ALIMI_IDENTITY_WIDTH = {
  year: "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]",
  estb: "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]",
  schoolName: "min-w-[16rem] w-[16rem]",
} as const;

export const UNIV_ALIMI_IDENTITY_WIDTH_CSS = {
  year: "4.5rem",
  estb: "4.5rem",
  schoolName: "16rem",
} as const;

export function hiddenAlimiIdentityCols(cols: AlimiIdentityCols): Set<number> {
  return new Set([
    cols.schoolCode,
    cols.schoolKind,
    cols.region,
    cols.status,
  ]);
}

export function isAlimiIdentityCenterCol(
  cols: AlimiIdentityCols,
  colIndex: number,
): boolean {
  return (
    colIndex === cols.year ||
    colIndex === cols.schoolCode ||
    colIndex === cols.schoolKind ||
    colIndex === cols.estb ||
    colIndex === cols.region ||
    colIndex === cols.status
  );
}

export function alimiIdentityWidthClass(
  cols: AlimiIdentityCols,
  colIndex: number,
): string {
  if (colIndex === cols.year) return UNIV_ALIMI_IDENTITY_WIDTH.year;
  if (colIndex === cols.estb) return UNIV_ALIMI_IDENTITY_WIDTH.estb;
  if (colIndex === cols.schoolName || colIndex === cols.gradName) {
    return UNIV_ALIMI_IDENTITY_WIDTH.schoolName;
  }
  return "";
}

/** 화면 전용. 업로드 양식의 '학교' 헤더는 그대로 두고 표시만 학교명으로 통일 */
export function displayAlimiHeaderLabel(label: string): string {
  if (label === "학교" || label === "대학명") return "학교명";
  if (label === "학교코드_표준") return "학교코드";
  return label;
}
