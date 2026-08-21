import type { Metadata } from "next";

import { HomeIntroMock } from "./HomeIntroMock";

export const metadata: Metadata = {
  title: "몰입형 인트로 — UI 목업 · K-UniTrust",
  description:
    "순차 Fade-in 텍스트 + 시작하기 버튼. 향후 로그인/인트로 화면 시안 (프로덕션 미적용)",
};

export default function HomeIntroMockPage() {
  return <HomeIntroMock />;
}
