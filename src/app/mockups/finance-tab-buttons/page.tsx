import type { Metadata } from "next";

import { FinanceTabButtonsMock } from "./FinanceTabButtonsMock";

export const metadata: Metadata = {
  title: "재정분석 탭 버튼 목업",
  description:
    "대학별DB·통계분석·코호트 버튼 리디자인 제안 — 실제 앱 미적용",
};

export default function FinanceTabButtonsMockPage() {
  return <FinanceTabButtonsMock />;
}
