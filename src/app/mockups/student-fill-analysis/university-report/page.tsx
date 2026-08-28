import type { Metadata } from "next";

import { StudentFillUniversityReportMock } from "./StudentFillUniversityReportMock";

export const metadata: Metadata = {
  title: "학생충원 심층보고서 목업 — 가야대학교 예시",
  description:
    "대학별분석 보고서 고도화 시안. 프로덕션 미적용. 가야대학교는 개별 대학 예시.",
};

export default function StudentFillUniversityReportMockPage() {
  return <StudentFillUniversityReportMock />;
}
