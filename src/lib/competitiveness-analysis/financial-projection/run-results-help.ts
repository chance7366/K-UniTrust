import type { HelpSection } from "@/lib/analysis/advanced-chart-help";
import {
  RISK_MID_HORIZON_YEARS,
  RISK_NEAR_HORIZON_YEARS,
} from "@/lib/competitiveness-analysis/financial-projection/risk-stage";

export const FP_RUN_RESULTS_HELP_TITLE = "분석결과 도움말";
export const FP_RUN_RESULTS_HELP_SUB =
  "시나리오·학교구분 칩, 위험단계 집계, 학교명 검색과 CSV·Excel 내보내기를 정리한 설명입니다.";

export function fpRunResultsHelp(analysisYear: number): HelpSection[] {
  return [
    {
      title: "시나리오·학교구분",
      body: "낙관·기본·비관·한계는 시나리오 탭에서 분석실행할 때 함께 저장한 결과입니다. 칩을 누르면 저장된 값을 바로 보여 주며 다시 계산하지 않습니다. 실행 당시 선택했던 시나리오 칩은 슬라이더로 조정한 값입니다. 대학·전문대학은 대상 KPI·요약 표·등록금수입 표를 함께 필터합니다.",
    },
    {
      title: "위험단계",
      body: `교육부 한계대학 지정이 아닙니다. 전망 구간 안 가용고갈 시점으로 나눕니다. 경영위기: ${analysisYear}~${analysisYear + RISK_NEAR_HORIZON_YEARS}년 고갈. 경고: ${analysisYear + RISK_NEAR_HORIZON_YEARS + 1}~${analysisYear + RISK_MID_HORIZON_YEARS}년 고갈. 주의: 그 이후 고갈이거나 고갈 없이 운영적자. 정상: 구간 내 고갈·운영적자 없음.`,
    },
    {
      title: "재학생수 · 규모 · 지역 · 권역",
      body: "재학생수는 기본설정 대상대학과 같은 재적학생 재학생(A)입니다. 없으면 기초자료 재학생(계)을 씁니다. 규모는 대학경쟁력분석과 같습니다. 대학은 10,000명 이상 대규모·5,000명 이상 중규모, 전문대학은 4,000명 이상 대규모·2,000명 이상 중규모입니다. 지역은 소재 시·도, 권역은 5극 3특입니다.",
    },
    {
      title: "학교명 검색",
      body: "실행 결과 요약 오른쪽 학교명 칸에 이름을 넣고 Enter를 누르면 현재 대학·전문대학 탭 목록을 걸러 보여 줍니다. 일부만 입력해도 됩니다. 검색을 지우려면 칸을 비운 뒤 Enter를 누르세요.",
    },
    {
      title: "CSV·Excel",
      body: "화면에 보이는 실행 결과 요약 행(학교, 재학생수, 규모, 지역, 권역, 위험단계, 손익적자, 가용고갈)을 내려받습니다. 검색·학교구분 필터가 적용된 목록입니다.",
    },
  ];
}
