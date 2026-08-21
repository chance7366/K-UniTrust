"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CompetitivenessSettingsProvider } from "@/lib/competitiveness-analysis/store";

export function CompetitivenessProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompetitivenessSettingsProvider>{children}</CompetitivenessSettingsProvider>
  );
}
