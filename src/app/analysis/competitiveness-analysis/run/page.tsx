"use client";

import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { RunPanel } from "@/components/analysis/competitiveness-analysis/panels/RunPanel";

export default function CompetitivenessRunPage() {
  return (
    <CompetitivenessShell activeTab="run">
      <RunPanel />
    </CompetitivenessShell>
  );
}
