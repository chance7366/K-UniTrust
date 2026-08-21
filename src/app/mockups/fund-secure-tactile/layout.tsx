import { Inter } from "next/font/google";

import "./fund-secure-tactile.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "자금확보율 Tactile Mockup · K-UniTrust",
  description:
    "Inventory Tracker + Gap Analysis 합성 목업 — 통계분석·대학별DB (실제 앱 미적용)",
};

export default function FundSecureTactileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`fst-root ${inter.variable}`}>{children}</div>;
}
