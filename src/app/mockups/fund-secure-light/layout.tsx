import { Inter } from "next/font/google";

import "./fund-secure-light.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "자금확보율 Light Mockup · K-UniTrust",
  description:
    "Modern Light & Tactile UI 목업 — 통계분석·대학별DB (실제 앱 미적용)",
};

export default function FundSecureLightMockupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`fsl-root ${inter.variable}`}>{children}</div>
  );
}
