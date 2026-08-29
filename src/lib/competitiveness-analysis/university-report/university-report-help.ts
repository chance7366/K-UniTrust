import type { HelpSection } from "@/lib/analysis/advanced-chart-help";
import {
  BENCHMARK_NARRATIVE_LABELS,
  UNIVERSITY_REPORT_GUIDELINES_VERSION,
  UNIVERSITY_REPORT_OUTLINE,
  UNIVERSITY_REPORT_ROLE_POLICY,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines";

export const UNIVERSITY_REPORT_HELP_TITLE = "보고서생성지침";
export const UNIVERSITY_REPORT_HELP_SUB =
  "대학별경쟁력 화면 내용을 기반으로 연도별·대학별 보고서를 동일 형식으로 생성하기 위한 표준 지침입니다.";

export function universityReportHelp(opts: {
  analysisYear: number;
  isAdmin: boolean;
}): HelpSection[] {
  const { analysisYear, isAdmin } = opts;
  const outline = UNIVERSITY_REPORT_OUTLINE.map(
    (s) => `${s.order}. ${s.title}`,
  ).join(" → ");

  return [
    {
      title: "목적",
      body: `${analysisYear}년 분석결과를 바탕으로 대학별경쟁력 화면의 차트·표·지수·순위를 보고서로 저장·배포합니다. 모든 대학이 동일 목차·동일 서술 규칙을 따르며, GEMINI_API_KEY 기반 AI는 본 지침과 동일 데이터(JSON)만 사용합니다. 지침 버전 ${UNIVERSITY_REPORT_GUIDELINES_VERSION}.`,
    },
    {
      title: "권한",
      body: isAdmin
        ? `관리자: ${analysisYear}년 에디션 보고서 생성·재생성·삭제 가능. 일괄 생성 시 동일 지침·동일 프롬프트 적용.\n\n사용자: 생성된 보고서 열람·다운로드만 (${UNIVERSITY_REPORT_ROLE_POLICY.user.join(", ")})`
        : `사용자 계정은 보고서 열람·다운로드만 가능합니다. 생성·재생성은 관리자에게 요청하세요.`,
    },
    {
      title: "보고서 목차 (전 대학 공통)",
      body: outline,
    },
    {
      title: "제1부 — 화면 재현",
      body: "대학별경쟁력 화면에 보이는 모든 항목을 빠짐없이 포함합니다. KPI(종합지수·순위·진단등급), 4개 그룹 지수 추세 차트·비교표, 8개 지표별 연도표·추세 차트, 당해 연도 전체 지표 요약(3부문×8지표). 수치·범례·색상은 화면과 동일하게 재현합니다.",
    },
    {
      title: "제2부 — 지표·부문 분석",
      body: `각 지표마다: 정의·원천·방향, 원지표·지수·동종 순위, ${Object.values(BENCHMARK_NARRATIVE_LABELS).join(" · ")} 대비 우위/열위 해석. 부문별(학생충원·대학재정·법인재정) 강약점, 종합지수·진단등급(S~E) 산출 근거를 기술합니다.`,
    },
    {
      title: "제3부 — 종합 총평",
      body: "강점·취약 지표를 데이터 기준으로 명시합니다. 동종 하위 7% 지표, 벤치마크 하회 지표를 취약점으로 분류하고, 지표 방향성(정방향/역방향)에 맞는 개선 노력을 제안합니다. 임의 목표치·타교 실명 비교·입력에 없는 수치는 금지합니다.",
    },
    {
      title: "생성 전 확인",
      body: `${analysisYear}년 분석실행(3단계) 완료 → 대학별경쟁력 화면에서 해당 대학 수치 확인 → 관리자 「보고서 생성」 실행(구현 예정). 생성 후 사용자는 보고서 목록에서 열람합니다.`,
    },
    {
      title: "전문 지침",
      body: "아래 「보고서생성지침」에서 분석연도·기본설정(가중치·적용지표)이 반영된 생성 지침 전체를 확인·복사할 수 있습니다. Gemini 프롬프트·품질 검수 기준으로 사용합니다.",
    },
  ];
}
