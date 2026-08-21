import type { Metadata } from "next";

import { CompetitivenessRiskUniversitiesMock } from "./CompetitivenessRiskUniversitiesMock";

export const metadata: Metadata = {
  title: "통계분석 위험군대학 목업",
  description:
    "대학경쟁력분석 통계분석 왼쪽에 위험군대학 탭을 둔 목업. 재정분석과 같은 17개 시·도 테이블 + D·E등급 목록. 프로덕션 미적용.",
};

export default function CompetitivenessRiskUniversitiesMockPage() {
  return <CompetitivenessRiskUniversitiesMock />;
}
