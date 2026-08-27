import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "학생충원분석 목업",
  description:
    "기본설정·분석결과·대학별분석 UI 시안. 프로덕션 메뉴 미적용.",
};

export default function StudentFillAnalysisMockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">불러오는 중…</p>}>{children}</Suspense>;
}
