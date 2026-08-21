import type { Metadata } from "next";

import { HomeIntroMarqueeMock } from "./HomeIntroMarqueeMock";

export const metadata: Metadata = {
  title: "인트로 + 대학 로고 marquee — UI 목업 · K-UniTrust",
  description:
    "시작하기 아래 3행 대학 로고 흐름 시안 (D:\\대학DB\\대학로고 연동, 프로덕션 미적용)",
};

export default function HomeIntroMarqueeMockPage() {
  return <HomeIntroMarqueeMock />;
}
