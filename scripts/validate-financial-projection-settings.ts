/**
 * 재정추계분석 기본설정(대상대학·기초자료·시나리오) 데이터 검증
 * Usage: npx tsx scripts/validate-financial-projection-settings.ts --year=2025
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateProjection,
  scenarioParams,
} from "../src/lib/competitiveness-analysis/financial-projection/calculate-projection.ts";
import {
  loadFinancialProjectionBaseline,
  loadFinancialProjectionBootstrap,
} from "../src/lib/competitiveness-analysis/financial-projection/load-live.ts";
import { MOCK_CPI_FORWARD_ASSUMPTION_PCT } from "../src/lib/competitiveness-analysis/financial-projection/mock-data.ts";
import { riskStage } from "../src/lib/competitiveness-analysis/financial-projection/risk-stage.ts";
import type { SimulationParams } from "../src/lib/competitiveness-analysis/financial-projection/types.ts";
import {
  FP_DEFAULT_ANALYSIS_YEAR,
  FP_HISTORY_START_YEAR,
  isFpAnalysisYear,
  projectionEndYearOf,
} from "../src/lib/competitiveness-analysis/financial-projection/years.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

type Check = { name: string; passed: boolean; detail: string };
const checks: Check[] = [];
let failures = 0;

function pass(name: string, detail: string) {
  checks.push({ name, passed: true, detail });
  console.log(`  OK  ${name} — ${detail}`);
}

function fail(name: string, detail: string) {
  failures += 1;
  checks.push({ name, passed: false, detail });
  console.log(`  FAIL ${name} — ${detail}`);
}

function warn(name: string, detail: string) {
  checks.push({ name, passed: true, detail: `주의: ${detail}` });
  console.log(`  WARN ${name} — ${detail}`);
}

function argYear(): number {
  const raw = process.argv.find((a) => a.startsWith("--year="))?.slice("--year=".length);
  const n = Number(raw);
  return isFpAnalysisYear(n) ? n : FP_DEFAULT_ANALYSIS_YEAR;
}

function withUnivWage(params: SimulationParams, wagePct: number): SimulationParams {
  return { ...params, wageInflationRatePct: wagePct };
}

function oldStage(
  loss: number | null,
  dep: number | null,
): string {
  if (dep != null) return "경영위기";
  if (loss != null) return "경고";
  return "정상";
}

async function main() {
  const analysisYear = argYear();
  const endYear = projectionEndYearOf(analysisYear);
  console.log(`재정추계 기본설정 검증 · 분석연도 ${analysisYear} (전망 ${endYear})`);

  const boot = await loadFinancialProjectionBootstrap({ analysisYear });

  if (boot.coverage.hasTargetRoster) {
    pass(
      "대상대학 · 명부",
      `${analysisYear}년 명부 ${boot.targets.length}교`,
    );
  } else {
    fail("대상대학 · 명부", `${analysisYear}년 대상대학 명부가 없습니다.`);
  }

  const codes = boot.targets.map((t) => t.schoolCodeStd);
  const unique = new Set(codes);
  if (unique.size !== codes.length) {
    fail(
      "대상대학 · 코드 중복",
      `${codes.length - unique.size}건 중복`,
    );
  } else {
    pass("대상대학 · 코드 중복", "대표학교코드 중복 없음");
  }

  const unnamed = boot.targets.filter((t) => !t.schoolName.trim());
  if (unnamed.length) fail("대상대학 · 학교명", `${unnamed.length}교 이름 없음`);
  else pass("대상대학 · 학교명", "빈 학교명 없음");

  const univN = boot.targets.filter((t) => t.schoolKind === "대학").length;
  const colN = boot.targets.filter((t) => t.schoolKind === "전문대학").length;
  pass("대상대학 · 코호트", `대학 ${univN} · 전문대학 ${colN}`);

  if (boot.coverage.hasSchoolAge) {
    pass("시나리오 · 학령자료", `${analysisYear}년 학령인구 탭 있음 (지수기준 ${boot.indexBaseYear})`);
  } else {
    fail("시나리오 · 학령자료", `${analysisYear}년 학령인구 탭이 없습니다.`);
  }

  const series = boot.schoolAge?.declineSeries ?? [];
  const basePt = series.find((p) => p.year === boot.indexBaseYear);
  if (boot.coverage.hasSchoolAge) {
    if (basePt && Math.abs(basePt.index - 100) < 0.6) {
      pass(
        "시나리오 · 학령지수 100",
        `${boot.indexBaseYear}년 지수 ${basePt.index}`,
      );
    } else {
      fail(
        "시나리오 · 학령지수 100",
        `${boot.indexBaseYear}년 지수 ${basePt?.index ?? "없음"} (100이어야 함)`,
      );
    }
    const last = series.at(-1);
    if (last && last.index > 0 && last.index < 100) {
      pass("시나리오 · 학령감소", `${last.year}년 전국 가중지수 ${last.index}`);
    } else if (last) {
      warn("시나리오 · 학령감소", `${last.year}년 지수 ${last.index}`);
    }
  }

  const extUsed = boot.nationalMacro.years.some((y) => y.extinctionIndex > 0);
  pass(
    "시나리오 · 지역소멸",
    extUsed
      ? "소멸지수 시계열 있음(등록금 경로 미사용)"
      : "소멸지수 시계열이 비어 있음(참고용)",
  );

  if (Math.abs(boot.cpiAssumptionPct - MOCK_CPI_FORWARD_ASSUMPTION_PCT) > 1e-9) {
    fail(
      "시나리오 · CPI 기본값",
      `bootstrap ${boot.cpiAssumptionPct} ≠ mock ${MOCK_CPI_FORWARD_ASSUMPTION_PCT}`,
    );
  } else {
    pass("시나리오 · CPI 기본값", `${boot.cpiAssumptionPct}%`);
  }

  const cpi = boot.cpiAssumptionPct;
  const applied = { ...scenarioParams("worst", cpi), inflationRatePct: cpi };
  if (applied.inflationRatePct !== cpi) {
    fail("시나리오 · 칩이 CPI 유지", `worst 적용 후 CPI ${applied.inflationRatePct}`);
  } else {
    pass("시나리오 · 칩이 CPI 유지", `비관 칩도 물가 ${cpi}% 유지`);
  }
  if (applied.subsidyChangeRatePct !== -2 || applied.fillRateAdjPct !== -3) {
    fail(
      "시나리오 · 비관 기본값",
      `기타 ${applied.subsidyChangeRatePct} / 충원 ${applied.fillRateAdjPct}`,
    );
  } else {
    pass("시나리오 · 비관 기본값", "기타 −2%/년 · 충원 −3%p · 중탈 +1.5%p");
  }
  const rawWorst = scenarioParams("worst", cpi);
  if (rawWorst.inflationRatePct !== cpi) {
    fail(
      "시나리오 · scenarioParams CPI",
      `비관 함수 내부 물가 ${rawWorst.inflationRatePct}% (UI ${cpi}%와 불일치)`,
    );
  } else {
    pass("시나리오 · scenarioParams CPI", `비관 함수도 물가 ${cpi}%`);
  }

  if (!codes.length) {
    console.log("\n대상대학이 없어 기초자료 검증을 건너뜁니다.");
    summarize();
    process.exit(failures ? 1 : 0);
  }

  console.log(`기초자료 생성 ${codes.length}교…`);
  const baseline = await loadFinancialProjectionBaseline({
    schoolCodes: codes,
    analysisYear,
  });
  const missing = codes.length - baseline.length;
  if (missing > 0) {
    warn(
      "기초자료 · 생성 건수",
      `명부 ${codes.length}교 중 ${baseline.length}교 생성 (${missing}교 매핑 없음)`,
    );
  } else {
    pass("기초자료 · 생성 건수", `${baseline.length}교`);
  }

  const zeroStudents = baseline.filter((u) => u.currentStudents <= 0);
  const zeroTuition = baseline.filter((u) => u.tuitionPerStudent <= 0);
  const zeroFixed = baseline.filter((u) => u.fixedCosts <= 0);
  const negUsable = baseline.filter((u) => u.usableLiquidity < 0);
  const noAge = baseline.filter((u) => !(u.schoolAgeDecline?.length));
  const wildWage = baseline.filter(
    (u) => u.laborCostCagrPct < -8 || u.laborCostCagrPct > 20,
  );

  if (zeroStudents.length) {
    fail("기초자료 · 재학생", `${zeroStudents.length}교 재학생 0`);
  } else {
    pass("기초자료 · 재학생", "재학생 0인 학교 없음");
  }
  if (zeroTuition.length) {
    warn(
      "기초자료 · 수업료",
      `${zeroTuition.length}교 1인당 수업료 0 — 알리미·교비 모두 없음 (${zeroTuition
        .map((u) => u.schoolName)
        .join(", ")})`,
    );
  } else {
    pass("기초자료 · 수업료", "1인당 수업료 0인 학교 없음");
  }
  if (zeroFixed.length) {
    warn("기초자료 · 고정비", `${zeroFixed.length}교 고정비 0 (교비 지출 없음 가능)`);
  } else {
    pass("기초자료 · 고정비", "고정비 0인 학교 없음");
  }
  if (negUsable.length) {
    warn(
      "기초자료 · 가용자금",
      `${negUsable.length}교 가용자금 음수 — 분석연도부터 경영위기 가능`,
    );
  } else {
    pass("기초자료 · 가용자금", "가용자금 음수 학교 없음");
  }
  if (noAge.length) {
    fail("기초자료 · 학령지수", `${noAge.length}교 소재 시도 학령시계열 없음`);
  } else {
    pass("기초자료 · 학령지수", "대학별 시도 학령시계열 있음");
  }
  if (wildWage.length) {
    warn(
      "기초자료 · 보수 CAGR",
      `${wildWage.length}교가 −8%~20% 밖 (예: ${wildWage
        .slice(0, 3)
        .map((u) => `${u.schoolName} ${u.laborCostCagrPct}%`)
        .join(", ")})`,
    );
  } else {
    pass("기초자료 · 보수 CAGR", "대학별 임금이 −8%~20% 안");
  }

  const runParams = withUnivWage(
    { ...scenarioParams("base", cpi), inflationRatePct: cpi },
    cpi,
  );
  const stageCount: Record<string, number> = {
    경영위기: 0,
    경고: 0,
    주의: 0,
    정상: 0,
  };
  const oldCount: Record<string, number> = { 경영위기: 0, 경고: 0, 정상: 0 };
  let cashEqLoss = 0;
  for (const univ of baseline) {
    const result = calculateProjection(
      univ,
      boot.nationalMacro,
      withUnivWage(runParams, univ.laborCostCagrPct),
      FP_HISTORY_START_YEAR,
      endYear,
    );
    const next = riskStage(
      result.operatingLossYear,
      result.cashDeficitYear,
      result.liquidityDepletionYear,
      analysisYear,
    );
    stageCount[next.label] = (stageCount[next.label] ?? 0) + 1;
    const prev = oldStage(result.operatingLossYear, result.liquidityDepletionYear);
    oldCount[prev] = (oldCount[prev] ?? 0) + 1;
    if (result.operatingLossYear === result.cashDeficitYear) cashEqLoss += 1;
  }

  pass(
    "분석결과 · 위험단계(신규)",
    `경영위기 ${stageCount["경영위기"]} · 경고 ${stageCount["경고"]} · 주의 ${stageCount["주의"]} · 정상 ${stageCount["정상"]} / ${baseline.length}`,
  );
  pass(
    "분석결과 · 위험단계(구)",
    `구간 내 고갈=경영위기 ${oldCount["경영위기"]} · 적자만=경고 ${oldCount["경고"]} · 정상 ${oldCount["정상"]}`,
  );
  if (cashEqLoss === baseline.length) {
    warn(
      "시나리오 · 현금적자 필드",
      "cashDeficitYear가 운영적자연도와 동일 — 한계진단에서 고갈까지 잔여연수로 대체함",
    );
  }

  summarize();
  process.exit(failures ? 1 : 0);
}

function summarize() {
  const ok = checks.filter((c) => c.passed).length;
  console.log(`\n결과 ${ok}/${checks.length} 통과 · 실패 ${failures}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
