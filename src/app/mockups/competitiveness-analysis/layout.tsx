import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대학경쟁력분석 (redirect)",
};

export default function CompetitivenessMockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
