import type { HelpSection } from "@/lib/analysis/advanced-chart-help";
import {
  RISK_MID_HORIZON_YEARS,
  RISK_NEAR_HORIZON_YEARS,
} from "@/lib/competitiveness-analysis/financial-projection/risk-stage";

export const FP_RUN_RESULTS_HELP_TITLE = "분석결과 도움말";
export const FP_RUN_RESULTS_HELP_SUB =
  "저장된 시나리오별 전망 결과, 위험단계 집계, 표 칼럼, 검색·내보내기, 기초자료·시나리오와의 관계를 정리한 설명입니다.";

export function fpRunResultsHelp(analysisYear: number): HelpSection[] {
  return [
    {
      title: "이 화면이 하는 일",
      body: `기본설정에서 「분석실행」으로 저장한 ${analysisYear}년 에디션 결과를 봅니다. 낙관·기본·비관·한계 4시나리오가 미리 계산되어 있으며, 칩을 바꿔도 다시 계산하지 않고 저장값을 표시합니다. 시나리오·기초자료·CPI를 바꾼 뒤에는 분석실행을 다시 해야 이 화면이 갱신됩니다.`,
    },
    {
      title: "시나리오 · 학교구분",
      body: "낙관·기본·비관·한계: 시나리오 탭 가정 + 기초자료(대학별 임금 CAGR·고정비·변동비 등)를 합친 실행 결과. 실행 당시 슬라이더로 조정한 값이 저장됩니다. 대학·전문대학 탭은 KPI·요약 표·등록금수입 표를 함께 필터합니다.",
    },
    {
      title: "전망에 들어간 지출 가정(복습)",
      body: "각 대학·시나리오마다: 변동비는 물가인상률(CPI)과 재학생, 고정비는 기초 고정비 × (1+임금 CAGR/100)^τ × (1−고정비절감/100)^τ. 고정비 절감 0·기본 시나리오에서도 고정비는 CPI가 아니라 기초자료 임금 CAGR로 증가합니다. 물가는 변동비만.",
    },
    {
      title: "위험단계",
      body: `교육부 한계대학 지정과 무관한 내부 분류. 가용자금 고갈 연도 기준. 경영위기: ${analysisYear}~${analysisYear + RISK_NEAR_HORIZON_YEARS}년 고갈. 경고: ${analysisYear + RISK_NEAR_HORIZON_YEARS + 1}~${analysisYear + RISK_MID_HORIZON_YEARS}년 고갈. 주의: 그 이후 고갈 또는 전망 구간 내 운영적자만. 정상: 구간 내 고갈·운영적자 없음.`,
    },
    {
      title: "재학생수 · 규모 · 지역 · 권역",
      body: "재학생수: 대상대학 표와 동일한 재적학생(A), 없으면 기초자료 재학생(계). 규모: 경쟁력분석과 동일(대학 1만·5천, 전문대 4천·2천). 지역=소재 시·도, 권역=5극3특.",
    },
    {
      title: "요약 표 칼럼",
      body: "학교, 재학생수, 규모, 지역, 권역, 위험단계, 손익적자 연도(운영수지<0 최초), 가용고갈 연도(가용자금≤0 최초). 등록금수입 표는 연도별 등록금수입(억) 추이.",
    },
    {
      title: "학교명 검색",
      body: "요약 표 오른쪽 학교명 + Enter → 현재 대학/전문대 탭 필터. 부분 일치. 비우고 Enter → 전체.",
    },
    {
      title: "CSV · Excel",
      body: "화면에 보이는 실행 결과 요약(필터·검색 적용 후)을 내려받습니다. 시나리오 칩·학교구분 탭 상태가 반영됩니다.",
    },
    {
      title: "대학별추계",
      body: "개별 학교의 연도별 재학생·수입·지출·가용자금 상세는 「대학별추계」 메뉴에서 같은 분석연도·시나리오로 조회합니다.",
    },
  ];
}
