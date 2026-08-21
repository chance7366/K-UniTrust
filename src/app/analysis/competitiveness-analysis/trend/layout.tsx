import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "재정추계분석",
  description: "저장된 연도별 분석결과 · 종합지수·순위 추세",
};

export default function FinancialProjectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
