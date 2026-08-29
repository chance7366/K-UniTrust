import type { Metadata } from "next";

import { StudentFillUniversityResultStatsMock } from "../StudentFillUniversityResultStatsMock";

export const metadata: Metadata = {
  title: "대학별분석 분석결과 통계 목업",
  description:
    "대학별분석 분석결과에 신입생·재학생·외국인 5개년 표와 권역·규모·시도 비교를 두는 시안. 프로덕션 미적용.",
};

export default function StudentFillUniversityResultStatsMockPage() {
  return <StudentFillUniversityResultStatsMock />;
}
