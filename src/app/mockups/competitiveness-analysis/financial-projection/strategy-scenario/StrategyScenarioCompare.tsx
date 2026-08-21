"use client";

import { StrategySection } from "../FinancialProjectionLookupMock";
import type {
  MacroData,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

/** @deprecated 프로덕션 `StrategySection`과 동일. 목업 페이지 호환용 */
export function StrategyScenarioCompare(props: {
  scenario: SimulationScenario;
  cpiPct: number;
  univ: UnivBaseData;
  nationalMacro: MacroData;
  startYear: number;
  endYear: number;
}) {
  return <StrategySection {...props} />;
}
