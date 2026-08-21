import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";

export type DashboardKpiAccent = "blue" | "amber" | "red" | "emerald";

export function DashboardKpiCard({
  accent,
  title,
  value,
  sub,
}: {
  accent: DashboardKpiAccent;
  title: string;
  value: string;
  sub: string;
}) {
  const border = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    emerald: "border-l-emerald-500",
  }[accent];

  const valueColor = {
    blue: "text-foreground",
    amber: "text-amber-400",
    red: "text-red-400",
    emerald: "text-emerald-600",
  }[accent];

  const subColor = {
    blue: "text-accent",
    amber: "text-amber-300/80",
    red: "text-red-300/80",
    emerald: "text-emerald-300/80",
  }[accent];

  return (
    <div
      className={`rounded-xl border border-border bg-surface px-3 py-2.5 border-l-4 ${border}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className={`shrink-0 ${CHART_TYPO.kpiLabel}`}>{title}</p>
        <p
          className={`truncate text-xl font-black leading-none tabular-nums ${valueColor}`}
        >
          {value}
        </p>
      </div>
      <p className={`mt-1 leading-tight ${CHART_TYPO.kpiSub} ${subColor}`}>{sub}</p>
    </div>
  );
}
