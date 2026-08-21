import { NextResponse } from "next/server";

import { computeFpRunEdition } from "@/lib/competitiveness-analysis/financial-projection/compute-run-edition";
import { loadFinancialProjectionBootstrap } from "@/lib/competitiveness-analysis/financial-projection/load-live";
import { assertFpYear } from "@/lib/competitiveness-analysis/financial-projection/server-store";
import {
  FP_HISTORY_START_YEAR,
  projectionEndYearOf,
} from "@/lib/competitiveness-analysis/financial-projection/years";
import type {
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = assertFpYear(Number(url.searchParams.get("year")));
    if (year == null) {
      return NextResponse.json({ error: "분석연도가 올바르지 않습니다." }, { status: 400 });
    }
    return NextResponse.json({ analysisYear: year, edition: null });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석결과를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      analysisYear?: unknown;
      cpiPct?: unknown;
      params?: SimulationParams;
      paramsScenario?: SimulationScenario;
      universities?: UnivBaseData[];
    };
    const year = assertFpYear(Number(body.analysisYear));
    if (year == null) {
      return NextResponse.json({ error: "분석연도가 올바르지 않습니다." }, { status: 400 });
    }
    const universities = Array.isArray(body.universities)
      ? body.universities
      : [];
    if (!universities.length) {
      return NextResponse.json(
        { error: "기초자료가 없습니다. 기본설정에서 기초자료를 먼저 생성하세요." },
        { status: 409 },
      );
    }
    const bootstrap = await loadFinancialProjectionBootstrap({ analysisYear: year });
    const cpiPct = Number(body.cpiPct);
    const runParams = body.params;
    if (!runParams || !Number.isFinite(cpiPct)) {
      return NextResponse.json({ error: "시나리오 가정이 없습니다." }, { status: 400 });
    }
    const paramsScenario =
      body.paramsScenario ?? runParams.scenario ?? "base";
    const edition = computeFpRunEdition({
      universities,
      nationalMacro: bootstrap.nationalMacro,
      cpiPct,
      runParams: { ...runParams, inflationRatePct: cpiPct },
      paramsScenario,
      startYear: FP_HISTORY_START_YEAR,
      endYear: projectionEndYearOf(year),
    });
    return NextResponse.json({
      analysisYear: year,
      lastRunAt: new Date().toLocaleString("ko-KR"),
      edition,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석실행에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
