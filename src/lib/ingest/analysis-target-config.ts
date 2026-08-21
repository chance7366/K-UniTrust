/** 분석대상 업로드 양식 — 학교코드 + 학자금제한·임시이사·결산미제출 (1행 헤더) */

export const ANALYSIS_TARGET_TEMPLATE_HEADER = [
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
  "학자금제한",
  "임시이사",
  "결산미제출",
] as const;

export type AnalysisTargetRow = {
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
  studentAidRestrict: string;
  provisionalBoard: string;
  noSettlement: string;
};

export const ANALYSIS_TARGET_CSV_COLUMNS = [
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
  "student_aid_restrict",
  "provisional_board",
  "no_settlement",
  "uploaded_at",
] as const;

export type AnalysisTargetCsvRow = Record<
  (typeof ANALYSIS_TARGET_CSV_COLUMNS)[number],
  string
>;

export const ANALYSIS_TARGET_TEMPLATE_SAMPLES = [
  {
    기준연도: 2026,
    학교코드: "0000046",
    학교명: "가톨릭대학교",
    본분교: "본교",
    학교구분: "대학",
    대표학교코드: "0000034",
    학교대표: "가톨릭대학교",
    학교종류: "대학교",
    지역: "경기",
    설립구분: "사립",
    관련법령: "고등교육법",
    법인명: "가톨릭학원",
    학교상태: "기존",
    상위학교: "가톨릭대학교[본교]",
    학자금제한: "",
    임시이사: "",
    결산미제출: "",
  },
  {
    기준연도: 2026,
    학교코드: "0000065",
    학교명: "신경주대학교",
    본분교: "본교",
    학교구분: "대학",
    대표학교코드: "0000586",
    학교대표: "신경주대학교",
    학교종류: "대학교",
    지역: "경북",
    설립구분: "사립",
    관련법령: "고등교육법",
    법인명: "원석학원",
    학교상태: "기존",
    상위학교: "신경주대학교[본교]",
    학자금제한: "해당",
    임시이사: "",
    결산미제출: "",
  },
] as const;

export const ANALYSIS_TARGET_TEXT_COLUMNS = ["학교코드", "대표학교코드"] as const;

export function padAnalysisTargetSchoolCode(value: string): string {
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

export function validateAnalysisTargetHeader(row0: unknown[]) {
  const h0 = normalizeHeaderRow(row0);
  const expected = [...ANALYSIS_TARGET_TEMPLATE_HEADER];
  if (
    h0.length !== expected.length ||
    expected.some((label, i) => h0[i] !== label)
  ) {
    throw new Error(
      `헤더가 올바르지 않습니다. 양식down 파일의 1행 헤더를 그대로 사용하세요. (받은 헤더: ${h0.join(", ") || "없음"})`,
    );
  }
}
