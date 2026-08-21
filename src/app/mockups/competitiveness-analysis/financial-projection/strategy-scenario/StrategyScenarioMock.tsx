"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import {
  calculateProjection,
  scenarioParams,
} from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import {
  MOCK_CPI_FORWARD_ASSUMPTION_PCT,
  MOCK_MACRO_NATIONAL,
  MOCK_PROJECTION_TARGETS,
  MOCK_UNIVERSITIES,
} from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import type {
  SimulationParams,
  SimulationScenario,
} from "@/lib/competitiveness-analysis/financial-projection/types";

import {
  DiagnosisSection,
  RunSection,
  type LookupTab,
  type RunTab,
} from "../FinancialProjectionLookupMock";
import { FpUniversityLookupPanel } from "../FpUniversityLookupPanel";
import {
  FpAnalysisYearBar,
  START_YEAR,
  projectionEndYearOf,
  riskStage,
  settlementYearOf,
} from "../fpm-shared";
import "../financial-projection-ui-mock.css";
import "../university/fp-university-lookup-mock.css";
import { StrategyScenarioCompare } from "./StrategyScenarioCompare";

function withUnivWage(params: SimulationParams, wagePct: number): SimulationParams {
  return { ...params, wageInflationRatePct: wagePct };
}

export function StrategyScenarioMock() {
  const [analysisYear, setAnalysisYear] = useState(2025);
  const [availableYears, setAvailableYears] = useState([2025]);
  const [scenario, setScenario] = useState<SimulationScenario>("base");
  const [selectedCode, setSelectedCode] = useState(
    MOCK_UNIVERSITIES[0]!.schoolCodeStd,
  );
  const [lookupTab, setLookupTab] = useState<LookupTab>("strategy");
  const [runTab, setRunTab] = useState<RunTab>("students");

  const settlementYear = settlementYearOf(analysisYear);
  const endYear = projectionEndYearOf(analysisYear);
  const cpiPct = MOCK_CPI_FORWARD_ASSUMPTION_PCT;
  const runParams = useMemo(
    () => ({ ...scenarioParams(scenario, cpiPct), inflationRatePct: cpiPct }),
    [scenario, cpiPct],
  );

  const selectedUniv =
    MOCK_UNIVERSITIES.find((row) => row.schoolCodeStd === selectedCode) ??
    MOCK_UNIVERSITIES[0]!;

  const listStages = useMemo(() => {
    const map = new Map<string, ReturnType<typeof riskStage>>();
    for (const univ of MOCK_UNIVERSITIES) {
      const result = calculateProjection(
        univ,
        MOCK_MACRO_NATIONAL,
        withUnivWage(runParams, univ.laborCostCagrPct),
        START_YEAR,
        endYear,
        { lite: true },
      );
      map.set(
        univ.schoolCodeStd,
        riskStage(
          result.operatingLossYear,
          result.cashDeficitYear,
          result.liquidityDepletionYear,
          analysisYear,
        ),
      );
    }
    return map;
  }, [runParams, endYear, analysisYear]);

  const projection = useMemo(
    () =>
      calculateProjection(
        selectedUniv,
        MOCK_MACRO_NATIONAL,
        withUnivWage(runParams, selectedUniv.laborCostCagrPct),
        START_YEAR,
        endYear,
      ),
    [selectedUniv, runParams, endYear],
  );

  const compareSeries = useMemo(
    () =>
      (["best", "base", "worst", "stress"] as const).map((s) => ({
        scenario: s,
        result: calculateProjection(
          selectedUniv,
          MOCK_MACRO_NATIONAL,
          withUnivWage(
            { ...scenarioParams(s, cpiPct), inflationRatePct: cpiPct },
            selectedUniv.laborCostCagrPct,
          ),
          START_YEAR,
          endYear,
          { lite: true, skipTuition: true },
        ),
      })),
    [selectedUniv, cpiPct, endYear],
  );

  const perCapitaRows = useMemo(
    () =>
      projection.rows
        .filter((row) => row.rowKind !== "actual")
        .map((row) => {
          const expPer = row.students > 0 ? (row.expenseEok * 100) / row.students : 0;
          const tuiPer =
            row.students > 0 ? (row.tuitionRevenueEok * 100) / row.students : 0;
          return {
            year: row.year,
            expenseMan: Math.round(expPer * 10) / 10,
            tuitionMan: Math.round(tuiPer * 10) / 10,
            gapMan: Math.round((expPer - tuiPer) * 10) / 10,
          };
        }),
    [projection],
  );

  const selectedStage = listStages.get(selectedUniv.schoolCodeStd)!;

  return (
    <>
      <div className="fpm-univ-banner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            ✦ 대응전략 시나리오 비교 목업 · 프로덕션{" "}
            <code className="rounded bg-white/70 px-1">대응전략</code> 미적용 ·{" "}
            <Link
              href="/analysis/financial-projection/university?year=2025"
              className="font-medium text-accent hover:underline"
            >
              프로덕션 대학별추계 →
            </Link>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-10">
        <DashboardEmeraldHeader
          sectionLabel="재정추계분석"
          title="대학별추계"
          subtitle="대응전략 · 이 대학만 시나리오 가정을 가감해 손익적자·기금고갈 변화를 봅니다 (목업)"
        />

        <FpAnalysisYearBar
          analysisYear={analysisYear}
          availableYears={availableYears}
          settlementYear={settlementYear}
          endYear={endYear}
          hasRun
          showYearMeta={false}
          onChange={setAnalysisYear}
          onAddYear={(year) => {
            setAvailableYears((prev) =>
              prev.includes(year) ? prev : [...prev, year].sort((a, b) => a - b),
            );
            setAnalysisYear(year);
          }}
        />

        <FpUniversityLookupPanel
          universities={MOCK_UNIVERSITIES}
          targets={MOCK_PROJECTION_TARGETS}
          analysisYear={analysisYear}
          scenario={scenario}
          onScenario={setScenario}
          lookupTab={lookupTab}
          onLookupTab={setLookupTab}
          runTab={runTab}
          onRunTab={setRunTab}
          selectedCode={selectedCode}
          onSelectCode={setSelectedCode}
          listStages={listStages}
          projection={projection}
        >
          {lookupTab === "result" ? (
            <RunSection
              tab={runTab}
              onTab={setRunTab}
              projection={projection}
              perCapitaRows={perCapitaRows}
              analysisYear={analysisYear}
              settlementYear={settlementYear}
              showInnerTabs={false}
            />
          ) : null}
          {lookupTab === "diagnosis" ? (
            <DiagnosisSection
              projection={projection}
              compareSeries={compareSeries}
              stage={selectedStage}
              analysisYear={analysisYear}
            />
          ) : null}
          {lookupTab === "strategy" ? (
            <StrategyScenarioCompare
              scenario={scenario}
              cpiPct={cpiPct}
              univ={selectedUniv}
              nationalMacro={MOCK_MACRO_NATIONAL}
              startYear={START_YEAR}
              endYear={endYear}
            />
          ) : null}
        </FpUniversityLookupPanel>
      </div>
    </>
  );
}
