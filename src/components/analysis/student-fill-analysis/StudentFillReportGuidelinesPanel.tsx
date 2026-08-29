"use client";

import { useMemo } from "react";

import { ReportGuidelinesBanner } from "@/components/analysis/ReportGuidelinesBanner";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { buildStudentFillReportGuidelines } from "@/lib/analysis/student-fill-analysis/build-report-guidelines";
import {
  STUDENT_FILL_REPORT_GUIDELINES_VERSION,
  STUDENT_FILL_REPORT_OUTLINE,
  STUDENT_FILL_REPORT_ROLE_POLICY,
} from "@/lib/analysis/student-fill-analysis/generation-guidelines";

export function StudentFillReportGuidelinesPanel({
  analysisYear,
}: {
  analysisYear: number;
}) {
  const isAdmin = useCanUploadExcel();

  const fullGuidelines = useMemo(
    () => (isAdmin ? buildStudentFillReportGuidelines(analysisYear) : ""),
    [isAdmin, analysisYear],
  );

  const helpSections = useMemo(
    () => [
      {
        title: "목적",
        body: `${analysisYear}년 대학별분석 분석결과(신입생충원·재학생충원·외국인)를 표와 지표별 시계열 차트로 담고, 집단 비교로 진단한 뒤 쉬운 대응전략을 적습니다. 지침 버전 ${STUDENT_FILL_REPORT_GUIDELINES_VERSION}.`,
      },
      {
        title: "권한",
        body: `관리자: ${STUDENT_FILL_REPORT_ROLE_POLICY.admin.join(", ")}.\n\n사용자: ${STUDENT_FILL_REPORT_ROLE_POLICY.user.join(", ")}.`,
      },
      {
        title: "보고서 목차 (전 대학 공통)",
        body: STUDENT_FILL_REPORT_OUTLINE.map(
          (item) => `${item.order}. ${item.title}`,
        ).join(" → "),
      },
      {
        title: "서식·열람",
        body: "A4 서식은 대학별경쟁력·대학별추계와 같습니다. 제1부 각 파트는 표 쪽과 지표별 시계열 차트 쪽입니다. 「보고서 열람」은 별도 창 HTML이며 「인쇄 / PDF 저장」(Ctrl+P)합니다.",
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
      helpDescription="대학별분석 화면 내용을 기반으로 연도별·대학별 보고서를 대학별경쟁력·대학별추계와 동일한 A4 형식으로 생성하기 위한 표준 지침입니다."
      fullGuidelines={fullGuidelines}
      fullTitle="분석연도가 반영된 생성 지침 전문"
    />
  );
}
