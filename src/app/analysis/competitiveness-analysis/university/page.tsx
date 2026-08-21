"use client";

import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { UniversityCompetitivenessDashboard } from "@/components/analysis/competitiveness-analysis/UniversityCompetitivenessDashboard";

export default function CompetitivenessUniversityPage() {
  return (
    <CompetitivenessShell activeTab="university">
      <UniversityCompetitivenessDashboard />
    </CompetitivenessShell>
  );
}
