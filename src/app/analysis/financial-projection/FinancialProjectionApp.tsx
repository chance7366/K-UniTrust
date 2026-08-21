"use client";

import { usePathname } from "next/navigation";

import { FinancialProjectionUiMock } from "@/app/mockups/competitiveness-analysis/financial-projection/FinancialProjectionUiMock";
import { getFinancialProjectionActiveTabId } from "@/lib/analysis/financial-projection-tabs";

export function FinancialProjectionApp() {
  const pathname = usePathname();
  if (
    !pathname.endsWith("/settings") &&
    !pathname.endsWith("/run") &&
    !pathname.endsWith("/university")
  ) {
    return null;
  }

  return (
    <FinancialProjectionUiMock
      activeMenu={getFinancialProjectionActiveTabId(pathname)}
      production
    />
  );
}
