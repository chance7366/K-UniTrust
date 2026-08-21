import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "학생충원 통계분석 신버전 목업 · K-UniTrust",
  description:
    "신입생충원율·재학생충원율·중도탈락율 Advanced 통계분석 목업 (실제 앱 미적용)",
};

export default function StudentFillAdvancedMockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
