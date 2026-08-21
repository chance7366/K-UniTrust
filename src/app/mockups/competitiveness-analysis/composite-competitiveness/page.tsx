import type { Metadata } from "next";

import { CompositeCompetitivenessMock } from "./CompositeCompetitivenessMock";

export const metadata: Metadata = {
  title: "통계분석 종합경쟁력 목업",
  description:
    "대학경쟁력분석 통계분석에 종합경쟁력 탭을 둔 목업. 지역·규모 / 분포·등급 / 시계열. 프로덕션 미적용.",
};

export default function CompositeCompetitivenessMockPage() {
  return <CompositeCompetitivenessMock />;
}
