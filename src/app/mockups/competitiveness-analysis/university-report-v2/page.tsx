import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

import { UniversityReportV2Mock } from "./UniversityReportV2Mock";

export const metadata: Metadata = {
  title: "대학별경쟁력 v2.0 — 화면·보고서 검토 목업",
  description:
    "Gemini v2.0 제안 — 프로덕션 적용 완료. 화면·보고서 v2 검토·목업.",
};

export default function UniversityReportV2MockPage() {
  return (
    <AppShell>
      <UniversityReportV2Mock />
    </AppShell>
  );
}
