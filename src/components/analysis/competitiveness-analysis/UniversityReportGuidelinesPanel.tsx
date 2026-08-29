"use client";

import { useMemo } from "react";

import { ReportGuidelinesBanner } from "@/components/analysis/ReportGuidelinesBanner";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { buildUniversityReportGuidelines } from "@/lib/competitiveness-analysis/university-report/build-university-report-guidelines";
import {
  UNIVERSITY_REPORT_HELP_SUB,
  universityReportHelp,
} from "@/lib/competitiveness-analysis/university-report/university-report-help";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

export function UniversityReportGuidelinesPanel({
  analysisYear,
  settings,
}: {
  analysisYear: number;
  settings: CompetitivenessSettings;
}) {
  const isAdmin = useCanUploadExcel();

  const fullGuidelines = useMemo(
    () => (isAdmin ? buildUniversityReportGuidelines(analysisYear, settings) : ""),
    [isAdmin, analysisYear, settings],
  );

  const helpSections = useMemo(
    () => universityReportHelp({ analysisYear, isAdmin }),
    [analysisYear, isAdmin],
  );

  return (
    <ReportGuidelinesBanner
      helpSections={helpSections}
      helpDescription={UNIVERSITY_REPORT_HELP_SUB}
      fullGuidelines={fullGuidelines}
      fullTitle="분석연도·기본설정이 반영된 지침 전문"
    />
  );
}
