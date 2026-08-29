"use client";

import { useMemo } from "react";

import { ReportGuidelinesBanner } from "@/components/analysis/ReportGuidelinesBanner";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import {
  buildFpReportGuidelines,
  FP_REPORT_GUIDELINES_VERSION,
  FP_REPORT_TOC,
} from "@/lib/competitiveness-analysis/financial-projection/report/generation-guidelines";

export function FpReportGuidelinesPanel({
  analysisYear,
}: {
  analysisYear: number;
}) {
  const isAdmin = useCanUploadExcel();

  const fullGuidelines = useMemo(
    () => (isAdmin ? buildFpReportGuidelines(analysisYear) : ""),
    [isAdmin, analysisYear],
  );

  const helpSections = useMemo(
    () => [
      {
        title: "목적",
        body: `${analysisYear}년 재정추계 결과를 바탕으로 개별대학 보고서를 동일 목차·동일 서술 규칙으로 생성합니다. 지침 버전 ${FP_REPORT_GUIDELINES_VERSION}.`,
      },
      {
        title: "권한",
        body: "관리자만 보고서 생성·재생성과 지침 열람이 가능합니다. 사용자는 생성된 보고서 열람·다운로드만 할 수 있습니다.",
      },
      {
        title: "보고서 목차 (전 대학 공통)",
        body: FP_REPORT_TOC.map((item) => `${item.page}. ${item.title}`).join(
          " → ",
        ),
      },
      {
        title: "전문 지침",
        body: "아래 「보고서생성지침」에서 분석연도가 반영된 생성 지침 전체를 확인·복사할 수 있습니다.",
      },
    ],
    [analysisYear],
  );

  return (
    <ReportGuidelinesBanner
      helpSections={helpSections}
      helpDescription="대학별추계 화면 내용을 기반으로 연도별·대학별 보고서를 동일 형식으로 생성하기 위한 표준 지침입니다."
      fullGuidelines={fullGuidelines}
      fullTitle="분석연도가 반영된 생성 지침 전문"
    />
  );
}
