"use client";

import { FinanceSectionTabRow } from "@/components/analysis/GlassMintTabGroup";

export type DashboardSection = "charts" | "data";

export function DashboardSectionTabRow({
  active,
  onChange,
  action,
}: {
  active: DashboardSection;
  onChange: (section: DashboardSection) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <FinanceSectionTabRow active={active} onChange={onChange} />
      {action ?? null}
    </div>
  );
}
