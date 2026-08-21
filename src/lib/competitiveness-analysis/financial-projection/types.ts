/** 재정추계분석 — 데이터·시뮬레이션 타입 (목업 v0.2) */

export type SchoolAgeDeclinePoint = {
  year: number;
  age: number | null;
  count: number;
  admissionWeight: number;
  weightedResource: number;
  /** 자료연도 18세(대입연도=자료연도+1)=100 */
  index: number;
};

export type MacroYearPoint = {
  year: number;
  /** 학령인구 감소 지수 / 100. 2026(2025년 탭 18세)=1.0 */
  populationRatio: number;
  /** 학령인구 감소 지수 (2026=100) */
  schoolAgeDeclineIndex?: number;
  /** 참고용(20~39세 여성/65세+). 등록금 경로에는 사용하지 않음 */
  extinctionIndex: number;
};

export type MacroData = {
  regionLabel: string;
  sigunguLabel?: string;
  years: MacroYearPoint[];
};

export type ProgramSegmentBase = {
  quota: number;
  currentStudents: number;
  freshmanFillRatePct: number;
  enrolledFillRatePct: number;
  dropoutRatePct: number;
  /** 분석연도 가중평균 수업료 (원). 가격은 알리미 평균등록금, 인원은 재학생충원 재학생/계 */
  tuitionPerStudent: number;
  programYears: number;
};

export type TuitionActualYear = {
  year: number;
  /** 교비자금 학부생수업료[1008] (원) */
  undergradWon: number;
  /** 교비자금 대학원생수업료[1009] (원) */
  graduateWon: number;
};

export type HistoryStudentYear = {
  year: number;
  undergrad: number;
  graduate: number;
  undergradFillRatePct?: number;
  graduateFillRatePct?: number;
};

export type ProjectionRowKind = "actual" | "estimate" | "forecast";

export type UnivBaseData = {
  schoolCodeStd: string;
  schoolName: string;
  region: string;
  sigungu: string;
  schoolKind: "대학" | "전문대학";
  /** 학제 연한 — 대학 4, 전문대 2~3. 비전임 비중은 사용하지 않음 */
  programYears: 2 | 3 | 4;
  compositeGrade: "S" | "A" | "B" | "C" | "D" | "E";
  /** 모집 정원 (최근 연도 고정. 중장기 계획 없음) — 학부+대학원 */
  quota: number;
  currentStudents: number;
  freshmanFillRatePct: number;
  enrolledFillRatePct: number;
  dropoutRatePct: number;
  reputationRatio: number;
  localOriginRatio: number;
  /** 총 적립·기금 (원) — 가용과 동일(교비 이월+임의+원금보존) */
  currentReserves: number;
  /** 가용자금 초 = 교비 이월(유동자산−유동부채+단기차입)+임의기금+원금보존기금. 산단 제외 */
  usableLiquidity: number;
  tuitionPerStudent: number;
  /** 교비자금(지출) 보수[1136]+관리운영비[1154]+교육외비용[1205] (원).
   * 기준 = max(결산연 포함 최근 3년 평균, 최근 2년 평균). 교비 없는 연도는 0. */
  fixedCosts: number;
  /** 3·2년 평균 보수[1136] (원) — 고정비 합산 구성 */
  fixedCostLabor: number;
  /** 3·2년 평균 관리운영비[1154] (원) */
  fixedCostAdmin: number;
  /** 3·2년 평균 교육외비용[1205] (원) */
  fixedCostNonEdu: number;
  /** 위와 같은 3·2년 평균의 연구학생경비[1186] ÷ 분석연도 재학생(계) (원) */
  variableCostPerStudent: number;
  /**
   * 기타수입(원) = 운영수입[1086]−수업료[1008·1009]−국가장학금.
   * 기준 = max(결산연 포함 최근 3년 평균, 최근 2년 평균). 교비 없는 연도는 0.
   * 학생 수 비연동. 시나리오 증감률·가산비율만 적용. 법인전입·재정지원수혜율로 대체하지 않음.
   */
  otherRevenues: number;
  /**
   * 맞춤형국가장학금(원).
   * 연도값 = min(재정지원 맞춤형국가장학금, 교비 국고보조금수입[1048]).
   * 기준 = max(결산연 포함 최근 3년 평균, 최근 2년 평균). 전망은 분석연도 재학생 대비 비례.
   */
  nationalScholarship: number;
  /** @deprecated 국고는 국가장학금 한도로만 사용. 별도 가산하지 않음(항상 0) */
  govGrant: number;
  /** 교비자금(지출) 보수[1136] 5개년 CAGR (%) — 고정비 에스컬레이션 */
  laborCostCagrPct: number;
  /** 알리미 분석연도. 미지정 시 2025 */
  analysisYear?: number;
  /** 교비 결산연도. 미지정 시 2024 */
  settlementYear?: number;
  undergrad?: ProgramSegmentBase;
  /** 4년제만. 전문대·대학원 없음이면 null */
  graduate?: ProgramSegmentBase | null;
  /** ≤결산연도 교비 학부·대학원 수업료 실적 */
  tuitionActuals?: TuitionActualYear[];
  /** 연도별 재학생 — 재학생충원율 재학생/계(상반기+전년 하반기 평균) */
  historyStudents?: HistoryStudentYear[];
  /** 소재 시도 학령인구 감소 지수 (2025년 탭, 18세→2026=100) */
  schoolAgeDecline?: SchoolAgeDeclinePoint[];
};

export type SimulationScenario = "best" | "base" | "worst" | "stress";

export type SimulationParams = {
  scenario: SimulationScenario;
  /** 변동비 물가 가정 (CPI, %) */
  inflationRatePct: number;
  /** 고정비(보수) 상승률 — 기본값은 교비 보수 CAGR */
  wageInflationRatePct: number;
  tuitionIncreaseRatePct: number;
  /** 기타수입(국가장학금 제외 잔액) 연 증감률(%/년). 국가장학금에는 미적용 */
  subsidyChangeRatePct: number;
  /** what-if 정원 감축. 중장기 계획 아님 */
  quotaReductionRatePct: number;
  fixedCostCutRatePct: number;
  /**
   * 기타수입 가산비율(%). 기준액 × (1+가산비율). 학생 수·결산 전입금과 무관.
   * 기본·비관·한계 기본값 0. 낙관은 관리자 입력(기본값 0).
   */
  otherRevenueBoostPct: number;
  dropoutRateAddonPct: number;
  /** 충원율 가감 (%p) — 민감도·시나리오 */
  fillRateAdjPct: number;
};

export type ProjectionYearRow = {
  year: number;
  rowKind: ProjectionRowKind;
  quota: number;
  fillRatePct: number;
  freshmen: number;
  students: number;
  undergradStudents: number;
  graduateStudents: number;
  undergradFillRatePct: number;
  graduateFillRatePct: number;
  undergradFreshmen: number;
  graduateFreshmen: number;
  /** 소재 시도 학령인구 감소 지수 (2026=100). 실적연도는 0 */
  schoolAgeDeclineIndex: number;
  /** 등록금수입(억) — 결산연도까지 교비 실적, 분석연도는 가중평균수업료×재학생충원 재학생/계 */
  tuitionRevenueEok: number;
  revenueEok: number;
  expenseEok: number;
  operatingProfitEok: number;
  cashflowEok: number;
  usableLiquidityEok: number;
  reservesEok: number;
  isDeficit: boolean;
};

export type ProjectionResult = {
  rows: ProjectionYearRow[];
  /** 연도별 등록금수입(억). 일괄 추계(lite)에서 표용 */
  tuitionByYear?: Record<number, number>;
  /** 운영손익 < 0 최초 연도 */
  operatingLossYear: number | null;
  /** 당기 자금수지 < 0 최초 연도 */
  cashDeficitYear: number | null;
  /** 가용자금 ≤ 0 최초 연도 */
  liquidityDepletionYear: number | null;
  /** @deprecated 호환 — liquidityDepletionYear */
  bankruptcyYear: number | null;
  /** @deprecated 호환 — cashDeficitYear */
  deathCrossYear: number | null;
};

export type ContingencyAction = {
  priority: number;
  action: string;
  effect: string;
  delayYears: number;
};

export type AccountCostClass = "fc" | "vc" | "grant" | "exclude";

export type AccountMapRow = {
  code: string;
  label: string;
  costClass: AccountCostClass;
  note?: string;
};
