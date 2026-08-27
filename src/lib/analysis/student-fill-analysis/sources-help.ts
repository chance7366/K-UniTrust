import type { HelpSection } from "@/lib/analysis/advanced-chart-help";

export const SFA_SOURCES_HELP_TITLE = "기초자료 도움말";
export const SFA_SOURCES_HELP_SUB =
  "학생충원분석 기초자료의 외국인 범위, 자료 연도 시차, 대학현황 원천을 정리한 설명입니다.";

export function sfaSourcesHelp(analysisYear: number): HelpSection[] {
  const dropoutYear = analysisYear - 1;
  return [
    {
      title: "외국인 범위",
      body: "기본값: 학위과정 소계(A)만. 정원외 입학 ≠ 외국인. 외국인 탭은 다음 단계에서 붙입니다.",
    },
    {
      title: "자료 연도 시차",
      body: `분석연도 ${analysisYear}년 = 충원·재적·외국인 ${analysisYear}년 + 탈락 ${dropoutYear}년.`,
    },
    {
      title: "자료 표",
      body: "아래 표는 분석실행에 쓰는 대학현황 › 대학알리미 자료입니다. 자료·대학현황 위치·범위·기간·사용 연도를 보여 줍니다. 중도탈락·외국학생중도탈락은 분석연도 전년도입니다.",
    },
  ];
}
