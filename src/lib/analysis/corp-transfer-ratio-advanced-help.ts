/** 전입금비율 고도화 통계분석 — 도움말 문구 */

import { COHORT_RISK_KPI_HELP } from "@/lib/analysis/cohort-relative-risk";
import { SCALE_COMPARE_HELP } from "@/lib/analysis/school-scale-trend";

export type HelpSection = {
  title: string;
  body: string;
};

export const CORP_TRANSFER_ADVANCED_HELP_OVERVIEW: HelpSection = {
  title: "통계분석 대시보드 개요",
  body: "선택한 연도·설립구분·학교구분·학교종류 필터(기본 설립구분 사립)에 따라 대학의 전입금비율을 다각도로 분석합니다. 전입금비율은 정부·지자체 법인전입금 규모를 등록금수입 대비로 나타낸 지표이며, 높을수록 등록금 대비 공공 지원이 충분한 것으로 해석합니다.",
};

export const CORP_TRANSFER_ADVANCED_KPI_HELP = {
  avgRate: {
    title: "전국 평균 전입금비율",
    body: "필터 조건에 해당하는 모든 대학의 전입금 합계(원)를 등록금수입(억원) 합계로 나눈 가중 평균입니다. Σ전입금 ÷ Σ등록금수입 × 100으로 계산합니다. 전년 대비(%p)는 전년 동일 필터 기준과 비교한 증감입니다.",
  },
  medianIqr: {
    title: "중앙값 & IQR",
    body: "개별 대학 전입금비율의 중앙값(Median)과 사분위 범위(IQR = Q3−Q1)입니다. 소수 극단값에 끌리지 않는 전형적 수준을 파악할 때 평균보다 유용합니다.",
  },
  riskCount: COHORT_RISK_KPI_HELP,
  schoolCount: {
    title: "분석 대상",
    body: "현재 선택된 연도와 필터(학교구분, 학교종류, 설립구분)를 모두 통과한 대학 수입니다. KPI·차트·테이블의 모든 집계는 이 N개교를 기준으로 산출됩니다.",
  },
} as const;

export const CORP_TRANSFER_ADVANCED_TAB_HELP = {
  risk: {
    title: "위험군대학 탭",
    body: "17개 시·도 상세 테이블과 위험군 대학 목록으로 취약 지역과 대학을 확인합니다. 테이블 행을 클릭하면 해당 지역의 위험군 대학만 목록에 표시됩니다.",
  },
  geo: {
    title: "지역·규모 탭",
    body: "5극 3특 권역 비교, 학생 규모(대규모·중규모·소규모) 비교, 17개 시·도 순위로 전입금비율 수준과 전년 대비를 비교합니다.",
  },
  distribution: {
    title: "분포·위험 탭",
    body: "평균에 가려지는 분포 형태와 전입금비율 위험 단계별 학교 수를 분석합니다. 밀도 분포·히스토그램으로 전체 분포를, 위험 단계 차트로 고위험·위험·양호·여유 구간별 규모를 확인합니다.",
  },
  pipeline: {
    title: "시계열 탭",
    body: "5개년 권역별 추이와 규모별 추이로 중장기 변화를 비교합니다. 규모는 대학경쟁력분석 3단계와 같은 재학생수 기준입니다.",
  },
} as const;

export const CORP_TRANSFER_ADVANCED_CHART_HELP = {
    zoneCompare: {
    title: "5극 3특 권역 비교",
    body: "5극 3특(수도권·충청권·동남권·대경권·서남권·강원권·전북권·제주권) 권역별 가중 평균 전입금비율(막대)과 전년 대비 증감(%p, 선)을 동시에 표시합니다.",
  },
  scaleCompare: SCALE_COMPARE_HELP,
  sidoRank: {
    title: "17개 시·도 순위",
    body: "시·도별 평균 전입금비율(막대)과 전년 대비 증감(%p, 선)을 내림차순으로 나열합니다. 상위·하위 지역을 빠르게 식별할 때 사용합니다.",
  },
  sidoTable: {
    title: "17개 시·도 상세 테이블",
    body: "맨 위 전체 행과 시·도별 학교 수, 가중 평균 전입금비율, 전년 대비, 중앙값, 산술평균(평균값), 위험군(동종 하위 15%) 학교 수를 표로 제공합니다. 행을 클릭하면 해당 지역의 위험군 대학만 하단 목록에 표시됩니다.",
  },
  schoolPreview: {
    title: "위험군 대학 목록",
    body: "동종(4년제·전문대학 각각) 내 하위 15%에 해당하는 위험군 대학을 성과 낮은 순으로 전체 나열합니다. 전입금합계(억원)와 등록금수입(억원)을 함께 표시합니다. 동종 하위 7%는 고위험으로 구분합니다.",
  },
  boxPlot: {
    title: "전입금비율 분포 (Box Plot)",
    body: "수도권/비수도권, 대학/전문대학 그룹별 전입금비율 분포를 사분위 상자로 표시합니다.",
  },
  density: {
    title: "전입금비율 밀도 분포",
    body: "선택 필터 기준 대학별 전입금비율(%)의 분포를 밀도 곡선으로 표시합니다. 하위 25%·중앙값·상위 25%와 가중 평균 위치를 함께 보여 줍니다.",
  },
  histogram: {
    title: "히스토그램",
    body: "전입금비율을 위험 단계 경계에 맞춘 10개 구간으로 나누어 학교 수를 표시합니다.",
  },
  riskTier: {
    title: "전입금비율 위험 단계별 분포",
    body: "전입금비율만을 기준으로 대학을 고위험(<10%), 위험(50~20%), 양호(70~100%), 여유(≥100%) 네 구간으로 나누어 학교 수를 표시합니다.",
  },
  trend: {
    title: "5개년 권역별 추이",
    body: "5극 3특 권역별 평균 전입금비율 추이를 선 그래프로 표시합니다.",
  },
  funnel: {
    title: "5개년 규모별 추이",
    body: "재학생수는 대학현황 › 대학알리미 › 재적학생의 재학생(A) 계·소계를 대표학교코드로 합산합니다(대학=대학전문+대학원, 전문대학=대학전문). 규모는 대학경쟁력분석 3단계와 같습니다. 대학은 10,000명 이상 대규모·5,000명 이상 중규모, 전문대학은 4,000명 이상 대규모·2,000명 이상 중규모입니다. 규모별 가중 평균 전입금비율 추이를 선 그래프로 표시합니다.",
  },
} as const;

export const CORP_TRANSFER_ADVANCED_HELP_SECTIONS: HelpSection[] = [
  CORP_TRANSFER_ADVANCED_HELP_OVERVIEW,
  ...Object.values(CORP_TRANSFER_ADVANCED_KPI_HELP),
  ...Object.values(CORP_TRANSFER_ADVANCED_TAB_HELP),
  ...Object.values(CORP_TRANSFER_ADVANCED_CHART_HELP),
];
