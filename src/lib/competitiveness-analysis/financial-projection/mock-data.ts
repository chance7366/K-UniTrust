import type {
  AccountMapRow,
  HistoryStudentYear,
  MacroData,
  ProgramSegmentBase,
  TuitionActualYear,
  UnivBaseData,
} from "./types";
import {
  FP_ANALYSIS_YEAR,
  FP_END_YEAR,
  FP_GRAD_PROGRAM_YEARS,
  FP_SETTLEMENT_YEAR,
} from "./years";

function extendMacroYears(
  years: MacroData["years"],
  endYear = FP_END_YEAR,
): MacroData["years"] {
  const out = [...years];
  const last = out[out.length - 1];
  const prev = out[out.length - 2];
  if (!last) return out;
  const popStep = prev ? last.populationRatio - prev.populationRatio : -0.03;
  const extStep = prev ? last.extinctionIndex - prev.extinctionIndex : 0.02;
  for (let year = last.year + 1; year <= endYear; year += 1) {
    const k = year - last.year;
    out.push({
      year,
      populationRatio: Math.max(0.12, Math.round((last.populationRatio + popStep * k) * 1000) / 1000),
      extinctionIndex: Math.min(0.95, Math.round((last.extinctionIndex + extStep * k) * 100) / 100),
    });
  }
  return out;
}

/** 학령인구 시도 실적(0~18세) → 연령이동으로 만든 입학연령 인구비율. 별도 장래추계 파일 없음 */
export const MOCK_MACRO_BY_REGION: Record<string, MacroData> = {
  경기: {
    regionLabel: "경기도",
    sigunguLabel: "성남시",
    years: extendMacroYears([
      { year: 2025, populationRatio: 1.0, extinctionIndex: 0.12 },
      { year: 2026, populationRatio: 0.97, extinctionIndex: 0.13 },
      { year: 2027, populationRatio: 0.93, extinctionIndex: 0.14 },
      { year: 2028, populationRatio: 0.89, extinctionIndex: 0.16 },
      { year: 2029, populationRatio: 0.85, extinctionIndex: 0.18 },
      { year: 2030, populationRatio: 0.81, extinctionIndex: 0.2 },
      { year: 2031, populationRatio: 0.77, extinctionIndex: 0.22 },
      { year: 2032, populationRatio: 0.73, extinctionIndex: 0.24 },
      { year: 2033, populationRatio: 0.7, extinctionIndex: 0.26 },
      { year: 2034, populationRatio: 0.66, extinctionIndex: 0.28 },
      { year: 2035, populationRatio: 0.63, extinctionIndex: 0.3 },
    ]),
  },
  충남: {
    regionLabel: "충청남도",
    sigunguLabel: "아산시",
    years: extendMacroYears([
      { year: 2025, populationRatio: 1.0, extinctionIndex: 0.28 },
      { year: 2026, populationRatio: 0.94, extinctionIndex: 0.3 },
      { year: 2027, populationRatio: 0.88, extinctionIndex: 0.33 },
      { year: 2028, populationRatio: 0.83, extinctionIndex: 0.36 },
      { year: 2029, populationRatio: 0.78, extinctionIndex: 0.39 },
      { year: 2030, populationRatio: 0.73, extinctionIndex: 0.42 },
      { year: 2031, populationRatio: 0.68, extinctionIndex: 0.45 },
      { year: 2032, populationRatio: 0.64, extinctionIndex: 0.48 },
      { year: 2033, populationRatio: 0.6, extinctionIndex: 0.51 },
      { year: 2034, populationRatio: 0.56, extinctionIndex: 0.54 },
      { year: 2035, populationRatio: 0.53, extinctionIndex: 0.57 },
    ]),
  },
  제주: {
    regionLabel: "제주특별자치도",
    sigunguLabel: "제주시",
    years: extendMacroYears([
      { year: 2025, populationRatio: 1.0, extinctionIndex: 0.22 },
      { year: 2026, populationRatio: 0.95, extinctionIndex: 0.24 },
      { year: 2027, populationRatio: 0.9, extinctionIndex: 0.27 },
      { year: 2028, populationRatio: 0.85, extinctionIndex: 0.3 },
      { year: 2029, populationRatio: 0.8, extinctionIndex: 0.33 },
      { year: 2030, populationRatio: 0.75, extinctionIndex: 0.36 },
      { year: 2031, populationRatio: 0.71, extinctionIndex: 0.39 },
      { year: 2032, populationRatio: 0.66, extinctionIndex: 0.42 },
      { year: 2033, populationRatio: 0.62, extinctionIndex: 0.45 },
      { year: 2034, populationRatio: 0.58, extinctionIndex: 0.48 },
      { year: 2035, populationRatio: 0.54, extinctionIndex: 0.51 },
    ]),
  },
};

export const MOCK_MACRO_GYEONGGI = MOCK_MACRO_BY_REGION["경기"]!;

/** 2025년 학령인구(명) 목 데이터 — 연령이동: t+k년 만18세 ≈ 2025년 만(18-k)세 */
export const MOCK_SCHOOL_AGE_2025: {
  region: string;
  geoLevel: "sido" | "sigungu";
  ages: number[];
}[] = [
  {
    region: "경기도",
    geoLevel: "sido",
    ages: [
      132400, 128900, 125100, 121800, 118200, 114500, 110800, 107200, 103900,
      99800, 96100, 92400, 88900, 85200, 81800, 78400, 75100, 72100, 69400,
    ],
  },
  {
    region: "성남시",
    geoLevel: "sigungu",
    ages: [
      11200, 10940, 10680, 10350, 10020, 9680, 9340, 9010, 8720, 8410, 8120,
      7840, 7560, 7280, 7010, 6750, 6490, 6240, 6010,
    ],
  },
];

export type LaborYearPoint = { year: number; laborEok: number };

function mockTuitionTrail(
  ugStudents: number,
  grStudents: number,
  ugPrice: number,
  grPrice: number,
  ugFill: number,
  grFill: number,
): { tuitionActuals: TuitionActualYear[]; historyStudents: HistoryStudentYear[] } {
  const tuitionActuals: TuitionActualYear[] = [];
  const historyStudents: HistoryStudentYear[] = [];
  for (let year = 2020; year <= FP_ANALYSIS_YEAR; year += 1) {
    const k = 0.94 + (year - 2020) * 0.012;
    const ug = Math.round(ugStudents * k);
    const gr = Math.round(grStudents * k);
    historyStudents.push({
      year,
      undergrad: ug,
      graduate: gr,
      undergradFillRatePct: ugFill,
      graduateFillRatePct: grFill,
    });
    if (year <= FP_SETTLEMENT_YEAR) {
      tuitionActuals.push({
        year,
        undergradWon: Math.round(ug * ugPrice),
        graduateWon: Math.round(gr * grPrice),
      });
    }
  }
  return { tuitionActuals, historyStudents };
}

function withFixedCostParts(
  univ: Pick<UnivBaseData, "fixedCosts"> &
    Partial<Pick<UnivBaseData, "fixedCostLabor" | "fixedCostAdmin" | "fixedCostNonEdu">>,
): Pick<UnivBaseData, "fixedCostLabor" | "fixedCostAdmin" | "fixedCostNonEdu"> {
  if (univ.fixedCostLabor != null && univ.fixedCostAdmin != null && univ.fixedCostNonEdu != null) {
    return {
      fixedCostLabor: univ.fixedCostLabor,
      fixedCostAdmin: univ.fixedCostAdmin,
      fixedCostNonEdu: univ.fixedCostNonEdu,
    };
  }
  const labor = Math.round(univ.fixedCosts * 0.62);
  const admin = Math.round(univ.fixedCosts * 0.28);
  return {
    fixedCostLabor: labor,
    fixedCostAdmin: admin,
    fixedCostNonEdu: univ.fixedCosts - labor - admin,
  };
}

function withSegments(
  univ: Omit<UnivBaseData, "fixedCostLabor" | "fixedCostAdmin" | "fixedCostNonEdu">,
  undergrad: ProgramSegmentBase,
  graduate: ProgramSegmentBase | null,
): UnivBaseData {
  const trail = mockTuitionTrail(
    undergrad.currentStudents,
    graduate?.currentStudents ?? 0,
    undergrad.tuitionPerStudent,
    graduate?.tuitionPerStudent ?? 0,
    undergrad.freshmanFillRatePct,
    graduate?.freshmanFillRatePct ?? 0,
  );
  return {
    ...univ,
    ...withFixedCostParts(univ),
    quota: undergrad.quota + (graduate?.quota ?? 0),
    currentStudents:
      undergrad.currentStudents + (graduate?.currentStudents ?? 0),
    freshmanFillRatePct: undergrad.freshmanFillRatePct,
    enrolledFillRatePct: undergrad.enrolledFillRatePct,
    dropoutRatePct: undergrad.dropoutRatePct,
    tuitionPerStudent: undergrad.tuitionPerStudent,
    analysisYear: FP_ANALYSIS_YEAR,
    settlementYear: FP_SETTLEMENT_YEAR,
    undergrad,
    graduate,
    ...trail,
    schoolAgeDecline: (
      MOCK_MACRO_BY_REGION[univ.region] ?? MOCK_MACRO_BY_REGION["경기"]!
    ).years.map((pt) => {
      const series =
        MOCK_MACRO_BY_REGION[univ.region] ?? MOCK_MACRO_BY_REGION["경기"]!;
      const base =
        series.years.find((y) => y.year === 2026)?.populationRatio ?? 1;
      const index =
        pt.year <= 2026
          ? 100
          : Math.round((pt.populationRatio / base) * 1000) / 10;
      return {
        year: pt.year,
        age: pt.year <= 2026 ? 18 : Math.max(0, 18 - (pt.year - 2026)),
        count: 0,
        admissionWeight: 1,
        weightedResource: 0,
        index,
      };
    }),
  };
}

export const MOCK_UNIVERSITIES: UnivBaseData[] = [
  withSegments(
    {
      schoolCodeStd: "0000063",
      schoolName: "가천대학교",
      region: "경기",
      sigungu: "성남시",
      schoolKind: "대학",
      programYears: 4,
      compositeGrade: "A",
      quota: 3680,
      currentStudents: 12400,
      freshmanFillRatePct: 98.2,
      enrolledFillRatePct: 96.1,
      dropoutRatePct: 4.2,
      reputationRatio: 0.62,
      localOriginRatio: 0.28,
      currentReserves: 285_000_000_000,
      usableLiquidity: 162_000_000_000,
      tuitionPerStudent: 8_200_000,
      fixedCosts: 198_000_000_000,
      variableCostPerStudent: 3_100_000,
      otherRevenues: 42_000_000_000,
      nationalScholarship: 38_000_000_000,
      govGrant: 0,
      laborCostCagrPct: 3.1,
    },
    {
      quota: 3200,
      currentStudents: 10000,
      freshmanFillRatePct: 98.2,
      enrolledFillRatePct: 96.1,
      dropoutRatePct: 4.2,
      tuitionPerStudent: 8_200_000,
      programYears: 4,
    },
    {
      quota: 480,
      currentStudents: 2400,
      freshmanFillRatePct: 68.4,
      enrolledFillRatePct: 71.2,
      dropoutRatePct: 5.6,
      tuitionPerStudent: 6_500_000,
      programYears: FP_GRAD_PROGRAM_YEARS,
    },
  ),
  withSegments(
    {
      schoolCodeStd: "0000312",
      schoolName: "선문대학교",
      region: "충남",
      sigungu: "아산시",
      schoolKind: "대학",
      programYears: 4,
      compositeGrade: "C",
      quota: 2100,
      currentStudents: 6200,
      freshmanFillRatePct: 84.6,
      enrolledFillRatePct: 91.2,
      dropoutRatePct: 6.1,
      reputationRatio: 0.34,
      localOriginRatio: 0.52,
      currentReserves: 48_000_000_000,
      usableLiquidity: 21_000_000_000,
      tuitionPerStudent: 7_600_000,
      fixedCosts: 72_000_000_000,
      variableCostPerStudent: 2_900_000,
      otherRevenues: 9_800_000_000,
      nationalScholarship: 12_400_000_000,
      govGrant: 0,
      laborCostCagrPct: 2.4,
    },
    {
      quota: 1850,
      currentStudents: 5100,
      freshmanFillRatePct: 84.6,
      enrolledFillRatePct: 91.2,
      dropoutRatePct: 6.1,
      tuitionPerStudent: 7_600_000,
      programYears: 4,
    },
    {
      quota: 250,
      currentStudents: 1100,
      freshmanFillRatePct: 62.0,
      enrolledFillRatePct: 68.4,
      dropoutRatePct: 7.2,
      tuitionPerStudent: 6_100_000,
      programYears: FP_GRAD_PROGRAM_YEARS,
    },
  ),
  withSegments(
    {
      schoolCodeStd: "0000248",
      schoolName: "제주국제대학교",
      region: "제주",
      sigungu: "제주시",
      schoolKind: "대학",
      programYears: 4,
      compositeGrade: "D",
      quota: 760,
      currentStudents: 2100,
      freshmanFillRatePct: 72.4,
      enrolledFillRatePct: 88.5,
      dropoutRatePct: 7.8,
      reputationRatio: 0.18,
      localOriginRatio: 0.71,
      currentReserves: 12_000_000_000,
      usableLiquidity: 4_800_000_000,
      tuitionPerStudent: 7_400_000,
      fixedCosts: 28_000_000_000,
      variableCostPerStudent: 2_800_000,
      otherRevenues: 4_500_000_000,
      nationalScholarship: 6_200_000_000,
      govGrant: 0,
      laborCostCagrPct: 1.8,
    },
    {
      quota: 680,
      currentStudents: 1850,
      freshmanFillRatePct: 72.4,
      enrolledFillRatePct: 88.5,
      dropoutRatePct: 7.8,
      tuitionPerStudent: 7_400_000,
      programYears: 4,
    },
    {
      quota: 80,
      currentStudents: 250,
      freshmanFillRatePct: 48.0,
      enrolledFillRatePct: 55.0,
      dropoutRatePct: 9.1,
      tuitionPerStudent: 5_800_000,
      programYears: FP_GRAD_PROGRAM_YEARS,
    },
  ),
  withSegments(
    {
      schoolCodeStd: "0000186",
      schoolName: "한려대학교",
      region: "전남",
      sigungu: "광양시",
      schoolKind: "전문대학",
      programYears: 2,
      compositeGrade: "E",
      quota: 920,
      currentStudents: 1680,
      freshmanFillRatePct: 76.2,
      enrolledFillRatePct: 85.1,
      dropoutRatePct: 12.4,
      reputationRatio: 0.12,
      localOriginRatio: 0.78,
      currentReserves: 6_200_000_000,
      usableLiquidity: 2_100_000_000,
      tuitionPerStudent: 6_400_000,
      fixedCosts: 18_500_000_000,
      variableCostPerStudent: 2_200_000,
      otherRevenues: 2_800_000_000,
      nationalScholarship: 4_100_000_000,
      govGrant: 0,
      laborCostCagrPct: 1.2,
    },
    {
      quota: 920,
      currentStudents: 1680,
      freshmanFillRatePct: 76.2,
      enrolledFillRatePct: 85.1,
      dropoutRatePct: 12.4,
      tuitionPerStudent: 6_400_000,
      programYears: 2,
    },
    null,
  ),
  withSegments(
    {
      schoolCodeStd: "0000410",
      schoolName: "영진전문대학교",
      region: "대구",
      sigungu: "북구",
      schoolKind: "전문대학",
      programYears: 2,
      compositeGrade: "B",
      quota: 2100,
      currentStudents: 5400,
      freshmanFillRatePct: 94.8,
      enrolledFillRatePct: 93.2,
      dropoutRatePct: 5.4,
      reputationRatio: 0.41,
      localOriginRatio: 0.48,
      currentReserves: 38_000_000_000,
      usableLiquidity: 16_500_000_000,
      tuitionPerStudent: 6_800_000,
      fixedCosts: 54_000_000_000,
      variableCostPerStudent: 2_400_000,
      otherRevenues: 8_200_000_000,
      nationalScholarship: 9_600_000_000,
      govGrant: 0,
      laborCostCagrPct: 2.6,
    },
    {
      quota: 2100,
      currentStudents: 5400,
      freshmanFillRatePct: 94.8,
      enrolledFillRatePct: 93.2,
      dropoutRatePct: 5.4,
      tuitionPerStudent: 6_800_000,
      programYears: 2,
    },
    null,
  ),
];

export type ProjectionTargetRow = {
  schoolCodeStd: string;
  schoolName: string;
  schoolKind: "대학" | "전문대학";
  region: string;
  estb: string;
  campusCount: number;
  enrolledTotal: number | null;
  studentAidRestrict: string;
  provisionalBoard: string;
  noSettlement: string;
  fundShortage: string;
  included: boolean;
};

function mockTarget(
  row: Omit<
    ProjectionTargetRow,
    | "campusCount"
    | "enrolledTotal"
    | "studentAidRestrict"
    | "provisionalBoard"
    | "noSettlement"
    | "fundShortage"
    | "included"
  > &
    Partial<ProjectionTargetRow>,
): ProjectionTargetRow {
  return {
    campusCount: 1,
    enrolledTotal: null,
    studentAidRestrict: "",
    provisionalBoard: "",
    noSettlement: "",
    fundShortage: "",
    included: true,
    ...row,
  };
}

export const MOCK_PROJECTION_TARGETS: ProjectionTargetRow[] = [
  mockTarget({ schoolCodeStd: "0000063", schoolName: "가천대학교", schoolKind: "대학", region: "경기", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0000312", schoolName: "선문대학교", schoolKind: "대학", region: "충남", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0000248", schoolName: "제주국제대학교", schoolKind: "대학", region: "제주", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0000046", schoolName: "가톨릭대학교", schoolKind: "대학", region: "경기", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0002748", schoolName: "가야대학교(김해)", schoolKind: "대학", region: "경남", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0000186", schoolName: "한려대학교", schoolKind: "전문대학", region: "전남", estb: "사립" }),
  mockTarget({ schoolCodeStd: "0000410", schoolName: "영진전문대학교", schoolKind: "전문대학", region: "대구", estb: "사립" }),
];

export type BaselineIndicatorPick = {
  id: string;
  source: "대학현황" | "재정분석지표";
  group: string;
  label: string;
  required: boolean;
  selected: boolean;
};

export const BASELINE_INDICATOR_CATALOG: BaselineIndicatorPick[] = [
  { id: "quota", source: "대학현황", group: "대학알리미", label: "입학정원(학부·대학원)", required: true, selected: true },
  { id: "freshman-fill", source: "대학현황", group: "대학알리미", label: "신입생충원율(학부·대학원)", required: true, selected: true },
  { id: "enrolled-fill", source: "재정분석지표", group: "학생충원", label: "재학생충원율(학부·대학원)", required: true, selected: true },
  { id: "dropout", source: "대학현황", group: "대학알리미", label: "중도탈락율(학부·대학원)", required: true, selected: true },
  { id: "enrolled-students", source: "재정분석지표", group: "학생충원", label: "재학생(계)·상·하반기 평균", required: true, selected: true },
  { id: "avg-tuition", source: "대학현황", group: "대학알리미", label: "가중평균수업료(학부·대학원)", required: true, selected: true },
  { id: "fund-secure", source: "재정분석지표", group: "대학재정", label: "자금확보율(교비 이월·임의·원금보존)", required: true, selected: true },
  { id: "edu-operating-income", source: "재정분석지표", group: "교비자금(수입)", label: "운영수입[1086]−수업료(기타수입 잔액)", required: true, selected: true },
  { id: "edu-grant", source: "재정분석지표", group: "교비자금(수입)", label: "국고보조금수입[1048](국가장학금 한도)", required: true, selected: true },
  { id: "support-benefit", source: "재정분석지표", group: "재정지원", label: "맞춤형국가장학금(한도: 교비 국고[1048])", required: true, selected: true },
  { id: "edu-labor", source: "재정분석지표", group: "교비자금(지출) 3·2년 평균", label: "보수[1136](고정비)", required: true, selected: true },
  { id: "edu-admin", source: "재정분석지표", group: "교비자금(지출) 3·2년 평균", label: "관리운영비[1154](고정비)", required: true, selected: true },
  { id: "edu-scholarship", source: "재정분석지표", group: "교비자금(지출) 3·2년 평균", label: "연구학생경비[1186](변동비)", required: true, selected: true },
  { id: "edu-nonedu", source: "재정분석지표", group: "교비자금(지출) 3·2년 평균", label: "교육외비용[1205](고정비 합산)", required: true, selected: true },
];

/** 전체 대상대학 공통 CPI (학교별 아님) */
export const MOCK_CPI_GLOBAL = [
  { year: 2021, yoyPct: 2.5 },
  { year: 2022, yoyPct: 5.1 },
  { year: 2023, yoyPct: 3.6 },
  { year: 2024, yoyPct: 2.3 },
  { year: 2025, yoyPct: 2.1 },
];

export const MOCK_CPI_FORWARD_ASSUMPTION_PCT = 2.5;

/** 전체 대상대학 공통 학령인구·소멸 (학교별 시나리오가 아님) */
export const MOCK_MACRO_NATIONAL: MacroData = {
  regionLabel: "전국 · 시도 입학자원가중 학령인구 감소 지수",
  years: extendMacroYears([
    { year: 2025, populationRatio: 1.0, extinctionIndex: 0.26 },
    { year: 2026, populationRatio: 0.96, extinctionIndex: 0.28 },
    { year: 2027, populationRatio: 0.91, extinctionIndex: 0.3 },
    { year: 2028, populationRatio: 0.87, extinctionIndex: 0.32 },
    { year: 2029, populationRatio: 0.82, extinctionIndex: 0.35 },
    { year: 2030, populationRatio: 0.78, extinctionIndex: 0.37 },
    { year: 2031, populationRatio: 0.74, extinctionIndex: 0.4 },
    { year: 2032, populationRatio: 0.7, extinctionIndex: 0.42 },
    { year: 2033, populationRatio: 0.66, extinctionIndex: 0.45 },
    { year: 2034, populationRatio: 0.63, extinctionIndex: 0.47 },
    { year: 2035, populationRatio: 0.59, extinctionIndex: 0.5 },
  ]),
};

export const MOCK_LABOR_HISTORY: Record<string, LaborYearPoint[]> = {
  "0000063": [
    { year: 2020, laborEok: 142 },
    { year: 2021, laborEok: 147 },
    { year: 2022, laborEok: 151 },
    { year: 2023, laborEok: 156 },
    { year: 2024, laborEok: 161 },
  ],
  "0000312": [
    { year: 2020, laborEok: 52 },
    { year: 2021, laborEok: 53 },
    { year: 2022, laborEok: 55 },
    { year: 2023, laborEok: 56 },
    { year: 2024, laborEok: 58 },
  ],
  "0000248": [
    { year: 2020, laborEok: 21.2 },
    { year: 2021, laborEok: 21.6 },
    { year: 2022, laborEok: 21.9 },
    { year: 2023, laborEok: 22.3 },
    { year: 2024, laborEok: 22.7 },
  ],
  "0000186": [
    { year: 2020, laborEok: 16.8 },
    { year: 2021, laborEok: 17.0 },
    { year: 2022, laborEok: 17.2 },
    { year: 2023, laborEok: 17.4 },
    { year: 2024, laborEok: 17.6 },
  ],
  "0000410": [
    { year: 2020, laborEok: 41.0 },
    { year: 2021, laborEok: 42.1 },
    { year: 2022, laborEok: 43.5 },
    { year: 2023, laborEok: 44.8 },
    { year: 2024, laborEok: 46.2 },
  ],
};

export const DEFAULT_ACCOUNT_MAP: AccountMapRow[] = [
  { code: "1136", label: "3.보수", costClass: "fc", note: "3·2년 평균 · 비전임 미분리" },
  { code: "1154", label: "3.관리운영비", costClass: "fc", note: "3·2년 평균" },
  { code: "1186", label: "3.연구학생경비", costClass: "vc", note: "3·2년 평균 ÷ 분석연도 재학생(계)" },
  { code: "1205", label: "3.교육외비용", costClass: "fc", note: "3·2년 평균 · 인원 비연동 · 고정비에 합산" },
];

export type DataCheckStatus = "ok" | "warn" | "missing";

export type DataCheckRow = {
  source: string;
  years: string;
  status: DataCheckStatus;
  note: string;
};

export const MOCK_DATA_CHECKS: DataCheckRow[] = [
  { source: "신입생·재학생 충원 / 중도탈락", years: "2020~2025", status: "ok", note: "대표학교 *_rep.csv" },
  { source: "평균등록금", years: "2020~2025", status: "ok", note: "재학생 가중평균" },
  { source: "교비자금(수입)", years: "2020~2024", status: "ok", note: "수업료[1008·1009] · 운영수입[1086] · 국고[1048]" },
  { source: "교비대차(가용자금)", years: "2020~2024", status: "ok", note: "이월+임의기금+원금보존기금 · 산단 제외" },
  { source: "산학협력단 결산", years: "—", status: "warn", note: "재정추계 가용자금·수입·지출에 미사용" },
  { source: "맞춤형국가장학금", years: "결산연 포함 3·2년", status: "ok", note: "min(재정지원, 교비 국고[1048]) · 학생 수 비례" },
  { source: "법인전입금", years: "—", status: "warn", note: "기타수입 산출에 미사용 · 가산은 시나리오 비율" },
  { source: "학령인구 시도", years: "2025탭", status: "ok", note: "18세=2026 대입 · 입학자원가중 · 소재 시도 감소지수" },
  { source: "지역소멸지수", years: "2020~2025", status: "warn", note: "참고만 · 등록금 경로 미사용 (20~39세 여성/65세+)" },
  { source: "교비자금(지출) 보수 5개년", years: "2020~2024", status: "ok", note: "임금상승률 = CAGR" },
  { source: "소비자물가지수(CPI)", years: "—", status: "warn", note: "미업로드 · 변동비 가정 2.5%" },
  { source: "입학정원 중장기 계획", years: "—", status: "missing", note: "없음 · 최근 정원 고정" },
  { source: "시간강사·비전임 비중", years: "—", status: "missing", note: "없음 · 보수 전체 FC" },
];

export const ORIGIN_PORTFOLIO_MOCK = [
  { label: "수도권", value: 62, color: "#3B82F6" },
  { label: "자교·동일 광역", value: 28, color: "#FF9F1A" },
  { label: "기타 비수도권", value: 10, color: "#7C5CFC" },
];

export function laborCagrPct(points: LaborYearPoint[]): number {
  if (points.length < 2) return 0;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const n = last.year - first.year;
  if (n <= 0 || first.laborEok <= 0) return 0;
  return (Math.pow(last.laborEok / first.laborEok, 1 / n) - 1) * 100;
}

export function ageShiftEighteen(
  ages0to18: number[],
  baseYear: number,
  horizonYear: number,
): { year: number; age18: number; ratio: number }[] {
  const age18_0 = ages0to18[18] ?? 1;
  const rows: { year: number; age18: number; ratio: number }[] = [];
  for (let y = baseYear; y <= horizonYear; y += 1) {
    const k = y - baseYear;
    const srcAge = 18 - k;
    const age18 = srcAge >= 0 ? (ages0to18[srcAge] ?? 0) : 0;
    rows.push({
      year: y,
      age18,
      ratio: age18_0 > 0 ? age18 / age18_0 : 0,
    });
  }
  return rows;
}
