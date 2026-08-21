import type { Metadata } from "next";
import { Suspense } from "react";

import { CompetitivenessProviders } from "@/components/analysis/competitiveness-analysis/CompetitivenessProviders";

export const metadata: Metadata = {
  title: "대학경쟁력분석",
  description: "기본설정·분석결과·대학별경쟁력",
};

function CompetitivenessFallback() {
  return <p className="text-sm text-muted">불러오는 중…</p>;
}

export default function CompetitivenessAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompetitivenessProviders>
      <Suspense fallback={<CompetitivenessFallback />}>
        {children}
      </Suspense>
    </CompetitivenessProviders>
  );
}
