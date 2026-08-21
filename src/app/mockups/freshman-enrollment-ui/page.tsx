import type { Metadata } from "next";

import { FreshmanEnrollmentUiMock } from "./FreshmanEnrollmentUiMock";

export const metadata: Metadata = {
  title: "신입생충원율 — UI 패턴 목업",
  description:
    "슬림 탭·ViewMode·간격 시안 및 학교개황 패턴 목업 (실제 앱 미적용)",
};

export default function FreshmanEnrollmentUiMockPage() {
  return <FreshmanEnrollmentUiMock />;
}
