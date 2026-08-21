import type { Metadata } from "next";
import { Suspense } from "react";

import { FinancialProjectionApp } from "./FinancialProjectionApp";

export const metadata: Metadata = {
  title: "재정추계분석",
  description:
    "분석연도별 대상대학·기초자료·시나리오 설정 후 재정추계 결과 및 대학별 조회",
};

export default function FinancialProjectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
      <FinancialProjectionApp />
      {children}
    </Suspense>
  );
}
