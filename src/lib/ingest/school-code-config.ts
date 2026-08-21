/** 학교코드 업로드 양식 — 표준분류 학교코드 (1행 헤더) */

export const SCHOOL_CODE_TEMPLATE_HEADER = [
  "기준연도",
  "학교코드",
  "학교명",
  "본분교",
  "학교구분",
  "대표학교코드",
  "학교대표",
  "학교종류",
  "지역",
  "설립구분",
  "관련법령",
  "법인명",
  "학교상태",
  "상위학교",
] as const;

/** @deprecated 구 양식(조사년도·학교코드_표준·캠퍼스명) — 업로드 호환용 */
export const SCHOOL_CODE_LEGACY_V2_HEADER = [
  "조사년도",
  "학교코드_표준",
  "학교명",
  "본분교명",
  "학교대표코드",
  "학교대표명",
  "상위학교명",
  "캠퍼스명",
  "학교구분",
  "지역",
  "설립구분",
  "학교상태",
  "학교종류",
] as const;

/** @deprecated 구 양식(학교종류명·지역명 등) — 업로드 호환용 */
export const SCHOOL_CODE_LEGACY_V1_HEADER = [
  "조사년도",
  "학교코드_표준",
  "학교명",
  "본분교명",
  "학교대표코드",
  "학교대표명",
  "상위학교명",
  "캠퍼스명",
  "학교구분명",
  "학교종류명",
  "지역명",
  "설립구분명",
  "학교상태명",
] as const;

export type SchoolCodeRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  mainBranchName: string;
  schoolRepCode: string;
  schoolRepName: string;
  parentSchoolName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  relatedLaw: string;
  corpName: string;
  status: string;
};

export const SCHOOL_CODE_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "main_branch_name",
  "school_rep_code",
  "school_rep_name",
  "parent_school_name",
  "school_division",
  "school_kind",
  "region",
  "estb",
  "related_law",
  "corp_name",
  "status",
  "uploaded_at",
] as const;

export type SchoolCodeCsvRow = Record<
  (typeof SCHOOL_CODE_CSV_COLUMNS)[number],
  string
>;

export const SCHOOL_CODE_TEMPLATE_SAMPLES = [
  {
    기준연도: 2026,
    학교코드: "0000003",
    학교명: "강원대학교",
    본분교: "본교",
    학교구분: "대학",
    대표학교코드: "0000002",
    학교대표: "강원대학교",
    학교종류: "대학교",
    지역: "강원",
    설립구분: "국립",
    관련법령: "고등교육법",
    법인명: "해당없음",
    학교상태: "기존",
    상위학교: "강원대학교[본교]",
  },
  {
    기준연도: 2026,
    학교코드: "0000019",
    학교명: "서울대학교",
    본분교: "본교",
    학교구분: "대학",
    대표학교코드: "0000019",
    학교대표: "서울대학교",
    학교종류: "대학교",
    지역: "서울",
    설립구분: "국립대법인",
    관련법령: "국립대법인",
    법인명: "서울대학교 법인",
    학교상태: "기존",
    상위학교: "서울대학교[본교]",
  },
] as const;

export type SchoolCodeHeaderFormat = "current" | "legacy-v2" | "legacy-v1";

export const SCHOOL_CODE_TEXT_COLUMNS = ["학교코드", "대표학교코드"] as const;

export function padSchoolCodeText(value: string): string {
  const t = value.trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return t.padStart(7, "0");
  return t;
}

function normalizeHeaderRow(row0: unknown[]): string[] {
  const h = row0.map((c) => (c == null ? "" : String(c).trim()));
  while (h.length && !h[h.length - 1]) h.pop();
  return h;
}

function headersEqual(
  actual: string[],
  expected: readonly string[],
): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every((label, i) => actual[i] === label);
}

export function detectSchoolCodeHeaderFormat(
  row0: unknown[],
): SchoolCodeHeaderFormat {
  const h0 = normalizeHeaderRow(row0);
  const current = [...SCHOOL_CODE_TEMPLATE_HEADER];
  const legacyV2 = [...SCHOOL_CODE_LEGACY_V2_HEADER];
  const legacyV1 = [...SCHOOL_CODE_LEGACY_V1_HEADER];

  if (headersEqual(h0, current)) return "current";
  if (headersEqual(h0, legacyV2)) return "legacy-v2";
  if (headersEqual(h0, legacyV1)) return "legacy-v1";

  throw new Error(
    `헤더가 올바르지 않습니다. 양식down 파일의 1행 헤더를 그대로 사용하세요. (받은 헤더: ${h0.join(", ") || "없음"})`,
  );
}
