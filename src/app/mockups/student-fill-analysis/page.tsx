import { redirect } from "next/navigation";

import { STUDENT_FILL_ANALYSIS_MOCK_BASE } from "@/lib/analysis/student-fill-analysis-tabs";

export default function StudentFillAnalysisMockIndexPage() {
  redirect(`${STUDENT_FILL_ANALYSIS_MOCK_BASE}/settings`);
}
