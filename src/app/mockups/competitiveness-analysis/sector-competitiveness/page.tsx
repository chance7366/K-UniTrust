import type { Metadata } from "next";

import { SectorCompetitivenessMock } from "./SectorCompetitivenessMock";

export const metadata: Metadata = {
  title: "통계분석 부문경쟁력 목업",
  description:
    "대학경쟁력분석 통계분석에 부문경쟁력 탭을 둔 목업. 학생충원·대학재정·법인재정 각 부문 지수로 지역·규모 / 분포·등급 / 시계열. 프로덕션 미적용.",
};

export default function SectorCompetitivenessMockPage() {
  return <SectorCompetitivenessMock />;
}
