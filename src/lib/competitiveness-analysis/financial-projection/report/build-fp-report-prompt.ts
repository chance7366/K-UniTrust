import {
  FP_REPORT_NARRATIVE_SLOTS,
  buildFpReportGuidelines,
} from "./generation-guidelines";
import type { FpReportPayload, FpReportScenario } from "./build-fp-report-payload";

function keyYearsOf(analysisYear: number, endYear: number): number[] {
  const candidates = [
    analysisYear,
    analysisYear + 1,
    analysisYear + 3,
    analysisYear + 5,
    analysisYear + 7,
    analysisYear + 10,
    analysisYear + 15,
    endYear,
  ];
  return [...new Set(candidates.filter((y) => y <= endYear))];
}

function scenarioSummary(s: FpReportScenario, keyYears: number[]) {
  const byYear = new Map(s.rows.map((r) => [r.year, r]));
  return {
    scenario: s.scenario,
    label: s.label,
    가정: {
      등록금인상_pct: s.params.tuitionIncreaseRatePct,
      기타수입증감_pct_년: s.params.subsidyChangeRatePct,
      충원율가감_pp: s.params.fillRateAdjPct,
      중도탈락가산_pp: s.params.dropoutRateAddonPct,
      고정비절감_pct_년: s.params.fixedCostCutRatePct,
    },
    분기점: {
      운영손익적자: s.operatingLossYear,
      자금수지적자: s.cashDeficitYear,
      가용자금고갈: s.liquidityDepletionYear,
    },
    위험단계: { label: s.stage.label, hint: s.stage.hint },
    주요연도: keyYears
      .map((y) => byYear.get(y))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({
        연도: r.year,
        재학생: r.students,
        신입생: r.freshmen,
        충원율_pct: r.fillRatePct,
        학령지수: r.schoolAgeDeclineIndex || null,
        등록금수입_억: r.tuitionRevenueEok,
        총수입_억: r.revenueEok,
        총지출_억: r.expenseEok,
        운영차액_억: r.operatingProfitEok,
        당기자금수지_억: r.cashflowEok,
        가용자금_억: r.usableLiquidityEok,
      })),
  };
}

export function buildFpReportGeminiPrompt(payload: FpReportPayload): {
  systemInstruction: string;
  userPrompt: string;
} {
  const keyYears = keyYearsOf(payload.analysisYear, payload.endYear);

  const data = {
    대학: {
      학교명: payload.school.schoolName,
      지역: `${payload.school.region} ${payload.school.sigungu}`,
      학교종류: payload.school.schoolKind,
      모집정원: payload.school.quota,
      재학생: payload.school.currentStudents,
      신입생충원율_pct: payload.school.freshmanFillRatePct,
      재학생충원율_pct: payload.school.enrolledFillRatePct,
      중도탈락률_pct: payload.school.dropoutRatePct,
    },
    분석연도: payload.analysisYear,
    추계구간: `${payload.analysisYear}~${payload.endYear}`,
    물가CPI_pct: payload.cpiPct,
    보수CAGR_pct: payload.school.laborCostCagrPct,
    재정구조: {
      고정비합계_억: payload.school.fixedCostsEok,
      보수_억: payload.school.fixedCostLaborEok,
      관리운영비_억: payload.school.fixedCostAdminEok,
      교육외비용_억: payload.school.fixedCostNonEduEok,
      기타수입_억: payload.school.otherRevenuesEok,
      국가장학금_억: payload.school.nationalScholarshipEok,
      가용자금초기_억: payload.school.usableLiquidityEok,
      등록금의존도_pct: payload.structure.tuitionDependencePct,
      학생1인당고정비_백만: payload.structure.fixedCostPerStudentMan,
      학령지수경로: `${payload.structure.schoolAgeIndexStart ?? "—"} → ${payload.structure.schoolAgeIndexEnd ?? "—"}`,
    },
    시나리오: payload.scenarios.map((s) => scenarioSummary(s, keyYears)),
    "1인당지표_기본시나리오_백만원": payload.perCapitaRows
      .filter((r) => keyYears.includes(r.year))
      .map((r) => ({
        연도: r.year,
        "1인당지출": r.expenseMan,
        "1인당등록금": r.tuitionMan,
        갭: r.gapMan,
      })),
    민감도_고갈시점변화_년: payload.tornado,
    목표탐색_고정비절감률: Object.fromEntries(
      [1, 2, 3, 4, 5]
        .map((d) => [d, payload.goalSeekByDelay[String(d)]])
        .filter(([, v]) => v != null)
        .map(([d, v]) => [
          `고갈 +${d}년 지연`,
          {
            필요절감률_pct_년: (v as { cutPct: number }).cutPct,
            달성가능: (v as { achieved: boolean }).achieved,
            목표연도: (v as { targetYear: number }).targetYear,
          },
        ]),
    ),
    우선순위대응: payload.contingencyActions,
  };

  const slotList = FP_REPORT_NARRATIVE_SLOTS.map(
    (s) => `<section data-fp-narrative="${s.id}">\n<!-- ${s.spec} -->\n</section>`,
  ).join("\n\n");

  const systemInstruction = `${buildFpReportGuidelines(payload.analysisYear)}

## 9. 출력 계약 (반드시 준수)
- 아래 "출력 형식"의 <section data-fp-narrative="..."> 컨테이너 ${FP_REPORT_NARRATIVE_SLOTS.length}개를 전부, 순서대로, 정확히 1회씩 반환한다.
- 각 컨테이너 안에는 <p> 문단만 넣는다 (<strong>·<em> 허용). 표·리스트·제목·차트 금지.
- 컨테이너 밖의 텍스트, 마크다운, 코드펜스, 설명 문구를 출력하지 않는다.
- 페이지·표·차트는 시스템이 이미 생성했다. 서술만 작성한다.`;

  const userPrompt = `다음은 ${payload.school.schoolName}의 ${payload.analysisYear}년 재정추계 분석 데이터다.
이 데이터만 사용하여 서술 슬롯 ${FP_REPORT_NARRATIVE_SLOTS.length}개를 작성하라.

## 분석 데이터 (JSON)
${JSON.stringify(data, null, 1)}

## 출력 형식 (이 구조 그대로, 주석 위치에 문단 작성)
${slotList}`;

  return { systemInstruction, userPrompt };
}
