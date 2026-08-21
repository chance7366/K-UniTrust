import {
  getCompetitivenessIndicators,
} from "@/lib/analysis/competitiveness-indicators";
import { buildAnalysisGuidelines } from "@/lib/competitiveness-analysis/build-analysis-guidelines";
import {
  BENCHMARK_NARRATIVE_LABELS,
  INDICATOR_ANALYSIS_TEMPLATE,
  OVERALL_ASSESSMENT_RULES,
  PART2_DEEP_ANALYSIS_SPEC,
  PART3_STRATEGY_ROADMAP_SPEC,
  REPORT_INDICATOR_CATALOG,
  SCREEN_MIRROR_CHECKLIST,
  UNIVERSITY_REPORT_FORMAT_RULES,
  UNIVERSITY_REPORT_GEMINI_BODY_SPEC,
  UNIVERSITY_REPORT_GUIDELINES_VERSION,
  UNIVERSITY_REPORT_OUTLINE,
  UNIVERSITY_REPORT_PAGE_LAYOUT,
  UNIVERSITY_REPORT_ROLE_POLICY,
  V2_ACTION_ROADMAP_PAGE_SPEC,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

function checklistLines(title: string, items: readonly string[]): string[] {
  return [title, ...items.map((item) => `  · ${item}`), ""];
}

function buildIndicatorCatalogSection(
  settings: CompetitivenessSettings,
): string[] {
  const indicators = getCompetitivenessIndicators();
  const lines = ["■ 지표별 보고서 서술 템플릿", ""];

  for (const meta of REPORT_INDICATOR_CATALOG) {
    const def = indicators.find((i) => i.financeTabId === meta.id);
    const enabled = settings.enabledIndicators[meta.id] !== false;
    const year =
      settings.indicatorYears[meta.id] ??
      def?.defaultYearLabel ??
      "—";
    const weight = settings.indicatorWeights[meta.id] ?? def?.defaultWeightPct ?? 0;

    lines.push(
      `[${meta.sector}] ${meta.label}${enabled ? "" : " [미적용]"}`,
    );
    lines.push(`  - 정의: ${meta.definition}`);
    lines.push(`  - 원천: ${meta.source} · 적용연도 ${year}`);
    lines.push(
      `  - 방향: ${meta.direction === "positive" ? "정방향(↑ 우수)" : "역방향(↓ 우수)"} · 부문내 가중 ${weight}%`,
    );
    lines.push("  - 제2부 필수: 원지표·지수·순위·전국/권역/시·도/규모 대비 해석");
    lines.push("");
  }

  return lines;
}

/** 대학별경쟁력 메뉴·Gemini 생성 공통 지침 전문 */
export function buildUniversityReportGuidelines(
  analysisYear: number,
  settings: CompetitivenessSettings,
): string {
  const indicators = getCompetitivenessIndicators();
  const analysisMethodAppendix = buildAnalysisGuidelines(settings, indicators);

  const sections: string[] = [
    "═══════════════════════════════════════════════════════════",
    "  K-UniTrust · 대학별경쟁력 개별대학 보고서 생성 지침",
    `  버전 ${UNIVERSITY_REPORT_GUIDELINES_VERSION} · 분석연도 ${analysisYear}년`,
    "═══════════════════════════════════════════════════════════",
    "",
    "■ 0. 운영·권한",
    "",
    "· 보고서는 「분석연도(에디션)」 단위로 생성·보관한다.",
    "· 관리자(admin): 생성·재생성·삭제 가능. GEMINI_API_KEY로 AI 서술 생성.",
    "· 사용자(user): 열람·다운로드만 가능. 생성 UI·API 접근 불가.",
    "· 선행 조건: 해당 연도 분석실행(3단계) 완료 + 대학별경쟁력 화면 데이터 검증 통과.",
    "",
    "  [관리자]",
    ...UNIVERSITY_REPORT_ROLE_POLICY.admin.map((line) => `  · ${line}`),
    "",
    "  [사용자]",
    ...UNIVERSITY_REPORT_ROLE_POLICY.user.map((line) => `  · ${line}`),
    "",
    "■ 1. 보고서 목차 (모든 대학 동일)",
    "",
    "· 표지 목차: 번호는 toc-num 1회만(ol list-style:none — 이중 번호 금지).",
    "· 각 목차 항목 우측에 본문 시작 페이지 번호(표지 제외, 1부터).",
    "· A4 1장 = report-page-body article 1개. v2 패널·지표(h4)·소절(1.2+)마다 page-break로 분할.",
    "· 세분 분할 후 청크 병합: 1=§1 Executive, 2=Insights, 3=Deep-Dive+표, 4=Decision+SWOT, 5=Roadmap, 6+=제1부~(report-page-merge-config.ts).",
    "· 3쪽: gap/score 차트 62mm 박스 채움 · 8행 표 균등 행높이. 4쪽: Decision+SWOT 병합.",
    "",
    ...UNIVERSITY_REPORT_OUTLINE.map(
      (section) => `${section.order}. ${section.title} (${section.id})`,
    ),
    "",
    "■ 2. 제1부 — 대학경쟁력 진단 대시보드 (v2 화면·필수·누락 금지)",
    "",
    "화면(`/analysis/competitiveness-analysis/university`)에 표시되는 내용을",
    "표·차트·수치 그대로 보고서에 옮긴다. 요약·생략하지 않는다.",
    "",
    ...checklistLines("2.1 헤더·KPI", SCREEN_MIRROR_CHECKLIST.header),
    ...checklistLines("2.2 그룹 지수·연도별 추세", SCREEN_MIRROR_CHECKLIST.groupTrend),
    ...checklistLines(
      "2.3 지표별 드릴다운(선택 지표 8종 각각)",
      SCREEN_MIRROR_CHECKLIST.indicatorDrilldown,
    ),
    ...checklistLines(
      "2.4 당해 연도 전체 지표 요약(8지표×3부문)",
      SCREEN_MIRROR_CHECKLIST.fullSummary,
    ),
    ...checklistLines("2.5 v2 Executive Dashboard", SCREEN_MIRROR_CHECKLIST.v2Executive),
    ...checklistLines("2.5a v2 Insights Panel", SCREEN_MIRROR_CHECKLIST.v2Insights),
    ...checklistLines("2.6 v2 Indicator Deep-Dive", SCREEN_MIRROR_CHECKLIST.v2IndicatorDeep),
    ...checklistLines("2.7 v2 Decision Insight", SCREEN_MIRROR_CHECKLIST.v2DecisionInsight),
    ...checklistLines("2.8 v2 SWOT 매트릭스", SCREEN_MIRROR_CHECKLIST.v2Swot),
    ...checklistLines("2.9 v2 실행 로드맵", SCREEN_MIRROR_CHECKLIST.v2Roadmap),
    ...checklistLines("2.10 메타·각주", SCREEN_MIRROR_CHECKLIST.footerMeta),
    "",
    "■ 3. 제2부 — 8대 핵심지표 심층 분석 (카드형)",
    "",
    `· 레퍼런스: ${PART2_DEEP_ANALYSIS_SPEC.reference}`,
    "· 각 지표·부문·종합에 대해 「설명 + 수치 + 벤치마크 대비 + 해석」을 기술한다.",
    "",
    "3.0 필수 구조 (가야대 0000032 형식 — 모든 대학 동일):",
    "  · 2.1~2.3: 부문 intro 1문단 + 지표별 <p><strong>[지표명]</strong> …</p>",
    `  · 2.1 지표 ${PART2_DEEP_ANALYSIS_SPEC.perIndicator.countBySection["2.1"]}개 · 2.2 ${PART2_DEEP_ANALYSIS_SPEC.perIndicator.countBySection["2.2"]}개 · 2.3 ${PART2_DEEP_ANALYSIS_SPEC.perIndicator.countBySection["2.3"]}개`,
    `  · 2.4: ${PART2_DEEP_ANALYSIS_SPEC.composite.minParagraphs}문단 이상 (Balance Index·Danger/Strength·사분면)`,
    "",
    "  [금지 — 대구대 0000061 유형]",
    ...PART2_DEEP_ANALYSIS_SPEC.antiPatterns.map((line) => `  · ${line}`),
    "",
    "  [지표 단락 형식]",
    `  · ${PART2_DEEP_ANALYSIS_SPEC.perIndicator.format}`,
    "",
    "3.1 지표 1개당 필수 항목:",
    ...INDICATOR_ANALYSIS_TEMPLATE.perIndicator.map((line) => `  · ${line}`),
    "",
    "3.2 부문(학생충원·대학재정·법인재정)당 필수 항목:",
    ...INDICATOR_ANALYSIS_TEMPLATE.perSector.map((line) => `  · ${line}`),
    "",
    "3.3 종합지수·진단등급 필수 항목:",
    ...INDICATOR_ANALYSIS_TEMPLATE.composite.map((line) => `  · ${line}`),
    "",
    "3.4 벤치마크 비교 기준 (동종 집단 = 4년제 또는 전문대):",
    `  · ${BENCHMARK_NARRATIVE_LABELS.national}`,
    `  · ${BENCHMARK_NARRATIVE_LABELS.zone}`,
    `  · ${BENCHMARK_NARRATIVE_LABELS.sido}`,
    `  · ${BENCHMARK_NARRATIVE_LABELS.scale}`,
    "",
    ...buildIndicatorCatalogSection(settings),
    "",
    "■ 4. 제3부 — 전략적 종합 총평 및 실행 로드맵",
    "",
    `· 레퍼런스: ${PART3_STRATEGY_ROADMAP_SPEC.reference}`,
    "",
    "4.0 필수 구조 (가야대 0000032 형식):",
    `  · 3.1: ${PART3_STRATEGY_ROADMAP_SPEC.section31.minParagraphs}문단 이상`,
    "  · 3.2: intro + [강점/약점/기회/위기] 4문단 + [SO/ST/WO/WT] 전략 4문단",
    "  · 3.3: intro + [단기 비상] ①②③ + [중장기] ①②",
    "",
    "  [금지 — 대구대 0000061 유형]",
    ...PART3_STRATEGY_ROADMAP_SPEC.antiPatterns.map((line) => `  · ${line}`),
    "",
    "4.0a 5쪽 v2 Action Roadmap (시스템 자동 · Gemini 작성 금지):",
    `  · ${V2_ACTION_ROADMAP_PAGE_SPEC.reference}`,
    `  · 단기 ${V2_ACTION_ROADMAP_PAGE_SPEC.structure.shortTermCount}건 + 중장기 ${V2_ACTION_ROADMAP_PAGE_SPEC.structure.midLongCount}건`,
    ...V2_ACTION_ROADMAP_PAGE_SPEC.taskSource.map((line) => `  · ${line}`),
    "",
    "4.1 총평 구조:",
    ...OVERALL_ASSESSMENT_RULES.structure.map((line) => `  ${line}`),
    "",
    "4.2 취약 지표 판별 기준:",
    ...OVERALL_ASSESSMENT_RULES.weakIndicatorCriteria.map(
      (line) => `  · ${line}`,
    ),
    "",
    "4.3 개선 권고 작성 원칙:",
    ...OVERALL_ASSESSMENT_RULES.improvementTone.map((line) => `  · ${line}`),
    "",
    "4.4 총평 예시 흐름 (수치는 입력 JSON에서만 인용):",
    "  「{학교명}은 {analysisYear}년 종합지수 {점수}점·동종 {순위}위·{등급}입니다.",
    "   학생충원 부문은 {강/약}하며, 특히 {지표명}이 전국 평균 대비 {열위/우위}합니다.",
    "   개선을 위해 {지표 성격에 맞는 조치}가 필요합니다.」",
    "",
    "■ 5. 형식·품질 통일 규칙",
    "",
    ...UNIVERSITY_REPORT_FORMAT_RULES.map((line) => `· ${line}`),
    "",
    "■ 5a. A4 본문 페이지 배치 (세분·병합)",
    "",
    ...UNIVERSITY_REPORT_PAGE_LAYOUT.bodyPages.map((line) => `· ${line}`),
    "",
    "  [청크 병합 그룹 — 0-based]",
    ...UNIVERSITY_REPORT_PAGE_LAYOUT.chunkMergeGroups.map((line) => `  · ${line}`),
    "",
    "  [3쪽 Deep-Dive CSS]",
    ...UNIVERSITY_REPORT_PAGE_LAYOUT.deepDivePageCss.map((line) => `  · ${line}`),
    "",
    "  [4쪽 Decision+SWOT CSS]",
    ...UNIVERSITY_REPORT_PAGE_LAYOUT.decisionSwotPageCss.map((line) => `  · ${line}`),
    "",
    "  [reinject]",
    ...UNIVERSITY_REPORT_PAGE_LAYOUT.reinject.map((line) => `  · ${line}`),
    "",
    "■ 5b. Gemini HTML 본문 골격 (가야대학교 0000032 레퍼런스)",
    "",
    `· ${UNIVERSITY_REPORT_GEMINI_BODY_SPEC.reference}`,
    "",
    "  [금지]",
    ...UNIVERSITY_REPORT_GEMINI_BODY_SPEC.forbidden.map((line) => `  · ${line}`),
    "",
    "  [필수 h4 제목 8종]",
    ...UNIVERSITY_REPORT_GEMINI_BODY_SPEC.indicatorH4Titles.map((line) => `  · ${line}`),
    "",
    "■ 6. AI(Gemini) 생성 시 입력·출력 규칙",
    "",
    "· 입력: 대학 1곳당 JSON 1건 — 화면 재현용 표·차트 수치 + 벤치마크 + settingsAtRun.",
    "· 출력: HTML 본문만(표지·목차는 시스템 자동). class: section-title/subsection-title/subsubsection-title, data-table.",
    "· 금지: 입력에 없는 수치·순위·연도 invent, 타교 실명 비교, 정치·법률 자문.",
    "· 제1부 표/차트 수치를 제2·3부 서술이 모순되지 않도록 교차 검증한다.",
    "· 동일 프롬프트·동일 지침 버전으로 전 대학 생성 → 형태 통일.",
    "",
    "■ 7. 부록 — 분석방법 (기본설정·분석실행 지침 인용)",
    "",
    analysisMethodAppendix,
    "",
    "— 지침 끝 —",
  ];

  return sections.join("\n");
}
