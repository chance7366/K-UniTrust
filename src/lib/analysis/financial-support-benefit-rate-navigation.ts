import type { FinancialSupportBenefitRateQuery } from "@/lib/data/financial-support-benefit-rate";
import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import { FINANCIAL_SUPPORT_BENEFIT_RATE_FIXED_ESTB } from "@/lib/ingest/financial-support-benefit-rate-config";

export function buildFinancialSupportBenefitRateHref(
  query: FinancialSupportBenefitRateQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "financial-support-benefit-rate");

  if (query.year != null) {
    params.set("year", String(query.year));
  }

  if (query.section === "charts") {
    params.set("section", "charts");
  }

  if (query.resetFilters) {
    params.set("estb", FINANCIAL_SUPPORT_BENEFIT_RATE_FIXED_ESTB);
  } else {
    const estb =
      query.estb !== undefined
        ? query.estb
        : FINANCIAL_SUPPORT_BENEFIT_RATE_FIXED_ESTB;
    params.set("estb", estb);
    if (query.schoolDivision) params.set("schoolDivision", query.schoolDivision);
    const schoolKinds = serializeMultiFilterParam(
      parseMultiFilterParam(query.schoolKind),
    );
    if (schoolKinds) params.set("schoolKind", schoolKinds);
    const regions = serializeMultiFilterParam(
      parseMultiFilterParam(query.region),
    );
    if (regions) params.set("region", regions);
    if (query.search) params.set("search", query.search);
  }

  return `/analysis/finance-analysis?${params.toString()}`;
}
