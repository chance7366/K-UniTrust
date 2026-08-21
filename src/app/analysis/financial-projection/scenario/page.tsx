import { redirect } from "next/navigation";

export default async function FinancialProjectionScenarioRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const yearRaw =
    typeof sp.year === "string"
      ? sp.year
      : Array.isArray(sp.year)
        ? sp.year[0]
        : "";
  const qs = new URLSearchParams();
  qs.set("tab", "scenario");
  if (yearRaw) qs.set("year", yearRaw);
  redirect(`/analysis/financial-projection/settings?${qs.toString()}`);
}
