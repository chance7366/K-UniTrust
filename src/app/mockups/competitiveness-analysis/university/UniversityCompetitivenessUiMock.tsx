"use client";

import Link from "next/link";

import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { UniversityCompetitivenessDashboard } from "@/components/analysis/competitiveness-analysis/UniversityCompetitivenessDashboard";

import "./university-competitiveness-ui-mock.css";

export function UniversityCompetitivenessUiMock() {
  return (
    <>
      <div className="ucm-banner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            ✦ 대학별경쟁력 UI 목업 · 프로덕션과 동일 컴포넌트 ·{" "}
            <Link
              href="/analysis/competitiveness-analysis/university"
              className="font-medium text-accent hover:underline"
            >
              프로덕션 화면
            </Link>
            {" · "}
            <Link
              href="/mockups/competitiveness-analysis/university-report-v2"
              className="font-medium text-accent hover:underline"
            >
              v2 검토 목업
            </Link>
          </span>
        </div>
      </div>
      <CompetitivenessShell activeTab="university">
        <UniversityCompetitivenessDashboard />
      </CompetitivenessShell>
    </>
  );
}
