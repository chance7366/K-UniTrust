"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import {
  calculateProjection,
  fmtEok,
  scenarioParams,
} from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import type {
  MacroData,
  ProjectionResult,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

import {
  BAR_FILL,
  ROW_KIND_LABEL,
  SCENARIO_LABEL,
  SlimTabs,
  SliderControl,
  YOY_BLUE,
  tickProps,
  yearOrDash,
} from "./fpm-shared";

export type RunTab = "students" | "pnl" | "cash" | "percapita";
export type LookupTab = "result" | "diagnosis" | "strategy";

export function RunSection({
  tab,
  onTab,
  projection,
  perCapitaRows,
  analysisYear,
  settlementYear,
  showInnerTabs = true,
}: {
  tab: RunTab;
  onTab: (t: RunTab) => void;
  projection: ProjectionResult;
  perCapitaRows: {
    year: number;
    expenseMan: number;
    tuitionMan: number;
    gapMan: number;
  }[];
  analysisYear: number;
  settlementYear: number;
  showInnerTabs?: boolean;
}) {
  const hasGraduate = projection.rows.some((r) => r.graduateStudents > 0);
  return (
    <div className="space-y-4">
      {showInnerTabs ? (
      <SlimTabs
        ariaLabel="추계결과 탭"
        active={tab}
        onChange={onTab}
        tabs={[
          { id: "students", label: "학생수" },
          { id: "pnl", label: "수입·지출" },
          { id: "cash", label: "자금수지" },
          { id: "percapita", label: "1인당" },
        ]}
      />
      ) : null}

      {tab === "students" ? (
        <div className="fpm-chart-card">
          <h3 className={CHART_TYPO.panelTitle}>재학생 · 신입 · 충원율 (학부·대학원)</h3>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height={280} debounce={200} minWidth={0}>
              <ComposedChart data={projection.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={tickProps()} />
                <YAxis yAxisId="n" tick={tickProps()} />
                <YAxis yAxisId="pct" orientation="right" tick={tickProps()} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: CHART_TYPO.tickPx }} />
                <Bar yAxisId="n" dataKey="freshmen" name="신입" fill={BAR_FILL} isAnimationActive={false} />
                <Line
                  yAxisId="n"
                  type="monotone"
                  dataKey="undergradStudents"
                  name="학부재학생"
                  stroke={YOY_BLUE}
                  strokeWidth={2}
                  dot={false} isAnimationActive={false}
                />
                {hasGraduate ? (
                <Line
                  yAxisId="n"
                  type="monotone"
                  dataKey="graduateStudents"
                  name="대학원재학생"
                  stroke={CHART_THEME.emerald}
                  strokeWidth={2}
                  dot={false} isAnimationActive={false}
                />
                ) : null}
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="undergradFillRatePct"
                  name="학부충원율"
                  stroke={CHART_THEME.violet}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false} isAnimationActive={false}
                />
                {hasGraduate ? (
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="graduateFillRatePct"
                  name="대학원충원율"
                  stroke={CHART_THEME.rose}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false} isAnimationActive={false}
                />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {tab === "pnl" ? (
        <div className="fpm-chart-card">
          <h3 className={CHART_TYPO.panelTitle}>운영 수입·지출 · 운영차액</h3>
          <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
            {settlementYear}년까지는 교비 수업료 실적만 표시합니다. {analysisYear}년부터 수입은
            등록금+맞춤형국가장학금+기타수입, 운영수지·가용자금은 그때부터 누적합니다.
          </p>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height={280} debounce={200} minWidth={0}>
              <ComposedChart data={projection.rows.filter((r) => r.rowKind !== "actual")}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={tickProps()} />
                <YAxis tick={tickProps()} unit="억" />
                <Tooltip formatter={(v) => `${v}억`} />
                <Legend wrapperStyle={{ fontSize: CHART_TYPO.tickPx }} />
                <Bar isAnimationActive={false} dataKey="revenueEok" name="수입" fill={BAR_FILL} />
                <Bar isAnimationActive={false} dataKey="expenseEok" name="지출" fill={CHART_THEME.rose} />
                <Line
                  type="monotone"
                  dataKey="tuitionRevenueEok"
                  name="등록금수입"
                  stroke={CHART_THEME.emerald}
                  strokeWidth={2}
                  dot={false} isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="operatingProfitEok"
                  name="운영차액"
                  stroke={YOY_BLUE}
                  strokeWidth={2}
                  dot={false} isAnimationActive={false}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {tab === "cash" ? (
        <div className="fpm-chart-card">
          <h3 className={CHART_TYPO.panelTitle}>가용자금 (교비 이월+임의기금+원금보존기금)</h3>
          <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
            산학협력단은 제외합니다. 고갈은 가용자금 ≤ 0 시점입니다.
          </p>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height={280} debounce={200} minWidth={0}>
              <ComposedChart data={projection.rows.filter((r) => r.rowKind !== "actual")}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={tickProps()} />
                <YAxis yAxisId="bar" tick={tickProps()} unit="억" />
                <YAxis yAxisId="line" orientation="right" tick={tickProps()} unit="억" />
                <Tooltip formatter={(v) => `${v}억`} />
                <Legend wrapperStyle={{ fontSize: CHART_TYPO.tickPx }} />
                <ReferenceLine yAxisId="line" y={0} stroke="#64748b" strokeWidth={2} />
                <Bar isAnimationActive={false} yAxisId="bar" dataKey="cashflowEok" name="당기수지">
                  {projection.rows
                    .filter((row) => row.rowKind !== "actual")
                    .map((row) => (
                    <Cell
                      key={row.year}
                      fill={row.isDeficit ? CHART_THEME.rose : YOY_BLUE}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="line"
                  type="monotone"
                  dataKey="usableLiquidityEok"
                  name="가용자금"
                  stroke={CHART_THEME.emerald}
                  strokeWidth={2.5}
                  dot={false} isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {tab === "percapita" ? (
        <div className="fpm-chart-card">
          <h3 className={CHART_TYPO.panelTitle}>1인당 교육비 vs 1인당 등록금</h3>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height={280} debounce={200} minWidth={0}>
              <LineChart data={perCapitaRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={tickProps()} />
                <YAxis tick={tickProps()} unit="백만" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: CHART_TYPO.tickPx }} />
                <Line type="monotone" dataKey="expenseMan" name="1인당 지출" stroke={CHART_THEME.rose} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="tuitionMan" name="1인당 등록금" stroke={BAR_FILL} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="gapMan" name="갭" stroke={YOY_BLUE} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="fpm-chart-card overflow-x-auto">
        <h3 className={CHART_TYPO.panelTitle}>연도별 추계 표</h3>
        <table className="mt-3 w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["연도", "구분", "학부", "대학원", "신입", "학령지수", "등록금수입", "운영차액", "가용자금"].map((h) => (
                <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projection.rows.map((r) => (
              <tr key={r.year} className="border-b border-border/60">
                <td className={FDB_TABLE.cell}>{r.year}</td>
                <td className={FDB_TABLE.cell}>{ROW_KIND_LABEL[r.rowKind]}</td>
                <td className={`${FDB_TABLE.cell} font-mono`}>
                  {r.undergradStudents.toLocaleString("ko-KR")}
                </td>
                <td className={`${FDB_TABLE.cell} font-mono`}>
                  {r.graduateStudents ? r.graduateStudents.toLocaleString("ko-KR") : "—"}
                </td>
                <td className={`${FDB_TABLE.cell} font-mono`}>{r.freshmen.toLocaleString("ko-KR")}</td>
                <td className={`${FDB_TABLE.cell} font-mono`}>
                  {r.rowKind === "actual" ? "—" : `${r.schoolAgeDeclineIndex}`}
                </td>
                <td className={`${FDB_TABLE.cell} font-mono`}>{r.tuitionRevenueEok}</td>
                <td className={`${FDB_TABLE.cell} font-mono ${r.isDeficit ? "text-rose-600" : ""}`}>
                  {r.rowKind === "actual" ? "—" : r.operatingProfitEok}
                </td>
                <td className={`${FDB_TABLE.cell} font-mono ${r.usableLiquidityEok <= 0 ? "text-rose-600" : ""}`}>
                  {r.rowKind === "actual" ? "—" : r.usableLiquidityEok}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DiagnosisSection({
  projection,
  compareSeries,
  stage,
  analysisYear,
}: {
  projection: ProjectionResult;
  compareSeries: {
    scenario: SimulationScenario;
    result: ProjectionResult;
  }[];
  stage: { label: string; tone: "ok" | "caution" | "warn" | "crisis"; hint?: string };
  analysisYear: number;
}) {
  const yearsLeft =
    projection.liquidityDepletionYear == null
      ? "구간 내 없음"
      : `${projection.liquidityDepletionYear - analysisYear}년 후`;
  return (
    <div className="space-y-4">
      <div className={`fpm-stage-banner fpm-stage-${stage.tone}`}>
        위험단계 {stage.label}
        <span className="ml-2 font-normal opacity-80">
          {stage.hint ?? "참고 분류 · 교육부 한계대학 지정이 아닙니다"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>손익 적자 전환</p>
          <p className="fpm-kpi-value">{yearOrDash(projection.operatingLossYear)}</p>
        </div>
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>고갈까지</p>
          <p className="fpm-kpi-value">{yearsLeft}</p>
        </div>
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>가용자금 고갈</p>
          <p className="fpm-depletion-year mt-1" style={{ fontSize: "1.5rem" }}>
            {yearOrDash(projection.liquidityDepletionYear)}
          </p>
        </div>
      </div>

      <div className="fpm-chart-card overflow-x-auto">
        <h3 className={CHART_TYPO.panelTitle}>시나리오 4줄 비교</h3>
        <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
          물가인상률은 시나리오 탭 가정값을 공통으로 씁니다. 낙관·비관·한계 칩이 물가를
          바꾸지 않는 것과 같습니다.
        </p>
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["시나리오", "손익적자", "가용고갈"].map((h) => (
                <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareSeries.map((cs) => (
              <tr key={cs.scenario} className="border-b border-border/60">
                <td className={FDB_TABLE.cell}>{SCENARIO_LABEL[cs.scenario]}</td>
                <td className={FDB_TABLE.cell}>{yearOrDash(cs.result.operatingLossYear)}</td>
                <td className={FDB_TABLE.cell}>{yearOrDash(cs.result.liquidityDepletionYear)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function withUnivWage(params: SimulationParams, wagePct: number): SimulationParams {
  return { ...params, wageInflationRatePct: wagePct };
}

function seedStrategyParams(
  scenario: SimulationScenario,
  cpiPct: number,
  settingsParams?: SimulationParams,
): SimulationParams {
  if (settingsParams && settingsParams.scenario === scenario) {
    return { ...settingsParams, scenario };
  }
  return {
    ...scenarioParams(scenario, cpiPct),
    inflationRatePct: cpiPct,
    scenario,
  };
}

function paramsFingerprint(params: SimulationParams): string {
  return [
    params.scenario,
    params.inflationRatePct,
    params.tuitionIncreaseRatePct,
    params.subsidyChangeRatePct,
    params.quotaReductionRatePct,
    params.fixedCostCutRatePct,
    params.otherRevenueBoostPct ?? 0,
    params.fillRateAdjPct,
    params.dropoutRateAddonPct,
  ].join("|");
}

function strategyCalc(
  univ: UnivBaseData,
  nationalMacro: MacroData,
  params: SimulationParams,
  startYear: number,
  endYear: number,
) {
  return calculateProjection(
    univ,
    nationalMacro,
    withUnivWage(params, univ.laborCostCagrPct),
    startYear,
    endYear,
    { minForecastT: 1 },
  );
}

function rowAt(result: ProjectionResult, year: number) {
  return result.rows.find((row) => row.year === year);
}

function shiftLabel(
  from: number | null,
  to: number | null,
): { text: string; tone: "better" | "worse" | "same" } {
  if (from == null && to == null) {
    return { text: "변화 없음 (구간 내 없음)", tone: "same" };
  }
  if (from == null && to != null) {
    return { text: `${to}년에 새로 발생 (악화)`, tone: "worse" };
  }
  if (from != null && to == null) {
    return { text: `${from}년 → 구간 밖 (개선)`, tone: "better" };
  }
  const delta = (to as number) - (from as number);
  if (delta === 0) return { text: `${to}년 · 변화 없음`, tone: "same" };
  if (delta > 0) {
    return { text: `${from}년 → ${to}년 · ${delta}년 늦춤 (개선)`, tone: "better" };
  }
  return {
    text: `${from}년 → ${to}년 · ${Math.abs(delta)}년 앞당김 (악화)`,
    tone: "worse",
  };
}

function toneClass(tone: "better" | "worse" | "same") {
  if (tone === "better") return "text-emerald-700";
  if (tone === "worse") return "text-rose-700";
  return "text-muted";
}

export function StrategySection({
  scenario,
  cpiPct,
  univ,
  nationalMacro,
  startYear,
  endYear,
  settingsParams,
}: {
  scenario: SimulationScenario;
  cpiPct: number;
  univ: UnivBaseData;
  nationalMacro: MacroData;
  startYear: number;
  endYear: number;
  /** 기본설정 시나리오 탭의 현재 가정. 칩 시나리오와 같을 때만 출발값으로 사용 */
  settingsParams?: SimulationParams;
}) {
  const settingsFp =
    settingsParams && settingsParams.scenario === scenario
      ? paramsFingerprint(settingsParams)
      : "";
  const baseline = useMemo(
    () => seedStrategyParams(scenario, cpiPct, settingsParams),
    [scenario, cpiPct, settingsFp, settingsParams],
  );
  const [draft, setDraft] = useState<SimulationParams>(() => ({ ...baseline }));
  const seedFp = paramsFingerprint(baseline);

  useEffect(() => {
    setDraft({ ...baseline });
    // 출발 가정값이 같을 때는 객체 참조만 바뀌어도 가감을 유지합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seedFp
  }, [seedFp, univ.schoolCodeStd]);

  function patch(partial: Partial<SimulationParams>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  const baselineResult = useMemo(
    () => strategyCalc(univ, nationalMacro, baseline, startYear, endYear),
    [univ, nationalMacro, baseline, startYear, endYear],
  );

  const draftResult = useMemo(
    () => strategyCalc(univ, nationalMacro, draft, startYear, endYear),
    [univ, nationalMacro, draft, startYear, endYear],
  );

  const analysisYear = univ.analysisYear ?? startYear;
  const nearYear = Math.min(endYear, analysisYear + 1);
  const midYear = Math.min(endYear, analysisYear + 5);
  const baseNear = rowAt(baselineResult, nearYear);
  const draftNear = rowAt(draftResult, nearYear);
  const baseMid = rowAt(baselineResult, midYear);
  const draftMid = rowAt(draftResult, midYear);
  const baseEnd = rowAt(baselineResult, endYear);
  const draftEnd = rowAt(draftResult, endYear);

  const lossShift = shiftLabel(
    baselineResult.operatingLossYear,
    draftResult.operatingLossYear,
  );
  const depleteShift = shiftLabel(
    baselineResult.liquidityDepletionYear,
    draftResult.liquidityDepletionYear,
  );
  const tweaked = JSON.stringify(draft) !== JSON.stringify(baseline);

  return (
    <div className="space-y-4">
      <div className="fpm-chart-card">
        <p className={FDB_TYPO.legend}>이 대학의 출발 시나리오</p>
        <p className="mt-1 text-2xl font-bold">{SCENARIO_LABEL[scenario]}</p>
        <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
          기본설정의 시나리오 탭은 전 대학에 공통 적용됩니다. 여기서는{" "}
          <strong>{univ.schoolName}</strong>만, 위 칩({SCENARIO_LABEL[scenario]})
          가정값을 출발점으로 가감합니다. 조정 결과는 이 화면에만 반영되며 기본설정·다른
          대학에는 저장되지 않습니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-bold text-accent-orange">
              {yearOrDash(draftResult.operatingLossYear)}
            </p>
            <p className={FDB_TYPO.legend}>손익적자연도</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">
              {yearOrDash(draftResult.liquidityDepletionYear)}
            </p>
            <p className={FDB_TYPO.legend}>가용고갈(기금고갈)연도</p>
          </div>
        </div>
      </div>

      <div className="fpm-chart-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={CHART_TYPO.panelTitle}>
            {SCENARIO_LABEL[scenario]} 가정 · 이 대학만 가감
          </h3>
          <button
            type="button"
            className={`${FDB_TYPO.legend} text-accent hover:underline disabled:text-muted`}
            disabled={!tweaked}
            onClick={() => setDraft(baseline)}
          >
            {SCENARIO_LABEL[scenario]} 값으로 되돌리기
          </button>
        </div>
        <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
          낙관 예: 물가 2.5% · 등록금 2% · 정원감축 0% · 고정비절감 2%/년 · 충원
          +2%p · 기타수입 0%. 슬라이더를 움직이면 위 연도가 바로 바뀝니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="물가인상률"
              value={draft.inflationRatePct}
              min={0}
              max={6}
              step={0.1}
              suffix="%"
              onChange={(v) => patch({ inflationRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="등록금 인상률"
              value={draft.tuitionIncreaseRatePct}
              min={0}
              max={5}
              step={0.5}
              suffix="%"
              onChange={(v) => patch({ tuitionIncreaseRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="정원 감축"
              value={draft.quotaReductionRatePct}
              min={0}
              max={5}
              step={0.5}
              suffix="%/년"
              onChange={(v) => patch({ quotaReductionRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="고정비 절감"
              value={draft.fixedCostCutRatePct}
              min={0}
              max={8}
              step={0.5}
              suffix="%/년"
              onChange={(v) => patch({ fixedCostCutRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="충원율 가감"
              value={draft.fillRateAdjPct}
              min={-10}
              max={10}
              step={0.5}
              suffix="%p"
              onChange={(v) => patch({ fillRateAdjPct: v })}
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="기타수입 증감률"
              value={draft.subsidyChangeRatePct}
              min={-20}
              max={20}
              step={0.1}
              suffix="%/년"
              onChange={(v) => patch({ subsidyChangeRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="기타수입 가산비율"
              value={draft.otherRevenueBoostPct ?? 0}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              onChange={(v) => patch({ otherRevenueBoostPct: v })}
            />
          </div>
        </div>
      </div>

      <div className="fpm-chart-card">
        <h3 className={CHART_TYPO.panelTitle}>
          {SCENARIO_LABEL[scenario]} 출발값 대비 연도 변화
        </h3>
        <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
          왼쪽은 칩 시나리오 그대로, 오른쪽은 이 대학에서 가감한 결과입니다.
          손익·가용 금액은 슬라이더를 움직이면 바로 바뀝니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
            <p className={FDB_TYPO.legend}>손익적자</p>
            <p className="mt-1 font-mono text-sm text-muted">
              {yearOrDash(baselineResult.operatingLossYear)} →{" "}
              {yearOrDash(draftResult.operatingLossYear)}
            </p>
            <p className={`mt-1 text-sm font-semibold ${toneClass(lossShift.tone)}`}>
              {lossShift.text}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
            <p className={FDB_TYPO.legend}>가용고갈(기금고갈)</p>
            <p className="mt-1 font-mono text-sm text-muted">
              {yearOrDash(baselineResult.liquidityDepletionYear)} →{" "}
              {yearOrDash(draftResult.liquidityDepletionYear)}
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${toneClass(depleteShift.tone)}`}
            >
              {depleteShift.text}
            </p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>구분</th>
                <th className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                  {SCENARIO_LABEL[scenario]} 출발
                </th>
                <th className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>가감 후</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [
                    `${nearYear}년 운영손익`,
                    baseNear ? fmtEok(baseNear.operatingProfitEok) : "—",
                    draftNear ? fmtEok(draftNear.operatingProfitEok) : "—",
                  ],
                  [
                    `${midYear}년 가용자금`,
                    baseMid ? fmtEok(baseMid.usableLiquidityEok) : "—",
                    draftMid ? fmtEok(draftMid.usableLiquidityEok) : "—",
                  ],
                  [
                    `${endYear}년 가용자금`,
                    baseEnd ? fmtEok(baseEnd.usableLiquidityEok) : "—",
                    draftEnd ? fmtEok(draftEnd.usableLiquidityEok) : "—",
                  ],
                ] as const
              ).map(([label, from, to]) => (
                <tr key={label} className="border-b border-border/60">
                  <td className={FDB_TABLE.cell}>{label}</td>
                  <td className={FDB_TABLE.cell}>{from}</td>
                  <td className={FDB_TABLE.cell}>
                    <span className={from === to ? "text-muted" : "font-semibold"}>
                      {to}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
