import type { Metadata } from "next";

import { EmeraldHeaderMock } from "../EmeraldHeaderMock";

export const metadata: Metadata = {
  title: "학교개황 헤더 — 에메랄드 그라데이션 목업",
  description:
    "제안 1: 산뜻한 에메랄드 소프트 그라데이션 헤더 시안 (실제 앱 미적용)",
};

export default function EmeraldHeaderMockPage() {
  return <EmeraldHeaderMock />;
}
