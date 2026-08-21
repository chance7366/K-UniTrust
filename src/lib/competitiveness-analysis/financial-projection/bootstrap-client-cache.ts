import type { ProjectionTargetRow } from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import type { MacroData } from "@/lib/competitiveness-analysis/financial-projection/types";

export type FinancialProjectionBootstrapPayload = {
  analysisYear?: number;
  availableYears?: number[];
  coverage?: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  targets?: ProjectionTargetRow[];
  nationalMacro: MacroData;
  schoolAge?: {
    regionLabel: string;
    dataYear: number;
    admissionBaselineYear: number;
    declineSeries: { year: number; index: number; weightedResource: number }[];
  } | null;
  cpiAssumptionPct?: number;
  error?: string;
};

const cache = new Map<number, FinancialProjectionBootstrapPayload>();
const inflight = new Map<number, Promise<FinancialProjectionBootstrapPayload>>();

export function fetchFinancialProjectionBootstrap(
  year: number,
): Promise<FinancialProjectionBootstrapPayload> {
  const hit = cache.get(year);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(year);
  if (pending) return pending;

  const request = fetch(`/api/financial-projection/bootstrap?year=${year}`)
    .then(async (res) => {
      const json = (await res.json()) as FinancialProjectionBootstrapPayload;
      if (!res.ok) {
        throw new Error(json.error ?? "대상대학을 불러오지 못했습니다.");
      }
      if (!json.nationalMacro) {
        throw new Error(json.error ?? "대상대학을 불러오지 못했습니다.");
      }
      cache.set(year, json);
      return json;
    })
    .finally(() => {
      inflight.delete(year);
    });

  inflight.set(year, request);
  return request;
}
