import { TARGET_UNIVERSITY_TEMPLATE_HEADER } from "@/lib/analysis/competitiveness-indicators";

export type TargetUniversityRow = {
  schoolCodeStd: string;
  schoolName: string;
  estb: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  enrolledTotal?: number | null;
  studentAidRestrict?: "" | "해당";
  noSettlement?: "" | "해당";
  crisis: "" | "해당";
  noAccreditation: "" | "해당";
  provisionalBoard: "" | "해당";
  /** 업로드 시 자금확보율 DB(자금합계<0)로 자동 산출 — 엑셀 J열은 빈 칸 */
  fundShortage: "" | "해당";
};

export const TARGET_UNIVERSITY_UPLOAD_HEADER = [
  ...TARGET_UNIVERSITY_TEMPLATE_HEADER,
] as const;

/** 대상대학 업로드 샘플 (절대지표 '해당' 포함) */
export const MOCK_TARGET_UNIVERSITIES: TargetUniversityRow[] = [
  {
    schoolCodeStd: "0002748",
    schoolName: "가야대학교(김해)",
    estb: "사립",
    schoolDivision: "대학",
    schoolKind: "대학교",
    region: "경남",
    crisis: "",
    noAccreditation: "",
    provisionalBoard: "",
    fundShortage: "",
  },
  {
    schoolCodeStd: "0000046",
    schoolName: "가톨릭대학교",
    estb: "사립",
    schoolDivision: "대학",
    schoolKind: "대학교",
    region: "경기",
    crisis: "",
    noAccreditation: "",
    provisionalBoard: "",
    fundShortage: "",
  },
  {
    schoolCodeStd: "0000100",
    schoolName: "경북대학교",
    estb: "국·공립",
    schoolDivision: "대학",
    schoolKind: "대학교",
    region: "대구",
    crisis: "",
    noAccreditation: "",
    provisionalBoard: "",
    fundShortage: "",
  },
  {
    schoolCodeStd: "0000186",
    schoolName: "한려대학교",
    estb: "사립",
    schoolDivision: "대학",
    schoolKind: "전문대학",
    region: "전남",
    crisis: "해당",
    noAccreditation: "",
    provisionalBoard: "",
    fundShortage: "",
  },
  {
    schoolCodeStd: "0000321",
    schoolName: "○○대학교",
    estb: "사립",
    schoolDivision: "대학",
    schoolKind: "대학교",
    region: "서울",
    crisis: "",
    noAccreditation: "해당",
    provisionalBoard: "",
    fundShortage: "",
  },
];

/** 분석실행 목업용 원지표값 (재정분석 DB 연동 전) */
export const MOCK_RAW_INDICATOR_VALUES: Record<
  string,
  Partial<Record<string, number>>
> = {
  "0000100": {
    "freshman-enrollment-rate": 98.2,
    "enrolled-enrollment-rate": 96.4,
    "dropout-rate": 4.1,
    "fund-secure-rate": 185.3,
    "financial-support-benefit-rate": 42.1,
    "tuition-dependency-rate": 28.5,
    "income-property-secure-rate": 312.0,
    "corp-transfer-ratio": 18.2,
  },
  "0000046": {
    "freshman-enrollment-rate": 102.1,
    "enrolled-enrollment-rate": 94.8,
    "dropout-rate": 5.6,
    "fund-secure-rate": 142.7,
    "financial-support-benefit-rate": 38.5,
    "tuition-dependency-rate": 36.2,
    "income-property-secure-rate": 245.8,
    "corp-transfer-ratio": 53.0,
  },
  "0002748": {
    "freshman-enrollment-rate": 88.5,
    "enrolled-enrollment-rate": 91.2,
    "dropout-rate": 8.9,
    "fund-secure-rate": 252.4,
    "financial-support-benefit-rate": 22.3,
    "tuition-dependency-rate": 52.5,
    "income-property-secure-rate": 98.4,
    "corp-transfer-ratio": 1.4,
  },
  "0000186": {
    "freshman-enrollment-rate": 76.2,
    "enrolled-enrollment-rate": 85.1,
    "dropout-rate": 12.4,
    "fund-secure-rate": 98.1,
    "financial-support-benefit-rate": 18.7,
    "tuition-dependency-rate": 61.2,
    "income-property-secure-rate": 45.2,
    "corp-transfer-ratio": 0.8,
  },
  "0000321": {
    "freshman-enrollment-rate": 82.0,
    "enrolled-enrollment-rate": 88.0,
    "dropout-rate": 9.5,
    "fund-secure-rate": 110.0,
    "financial-support-benefit-rate": 25.0,
    "tuition-dependency-rate": 48.0,
    "income-property-secure-rate": 60.0,
    "corp-transfer-ratio": 2.0,
  },
};

export const MOCK_OUR_UNIVERSITY_CODE = "0002748";
