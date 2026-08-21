import type { Metadata } from "next";

import { KrdsFreshmanEnrollmentPage } from "./KrdsFreshmanEnrollmentPage";

export const metadata: Metadata = {
  title: "신입생충원율 L1~L10 타이포 목업",
  description:
    "L1~L10 단계별 타이포그래피가 적용된 신입생충원율 대학별DB 전체 페이지 목업 (실제 앱 미적용)",
};

export default function FreshmanEnrollmentTypographyMockPage() {
  return <KrdsFreshmanEnrollmentPage />;
}
