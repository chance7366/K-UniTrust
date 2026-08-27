import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "학생충원분석",
  description: "기본설정·분석결과·대학별분석",
};

export default function StudentFillAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
      {children}
    </Suspense>
  );
}
