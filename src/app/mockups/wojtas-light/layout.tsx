import { Inter } from "next/font/google";

import "./wojtas-light.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Wojtaś Light Mockup · K-UniTrust",
  description: "디자인 목업 — Farm24 / Matt Wojtaś 라이트 톤 (미적용)",
};

export default function WojtasLightMockupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`wojtas-light-root ${inter.variable}`}>{children}</div>
  );
}
