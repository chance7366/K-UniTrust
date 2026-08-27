import { redirect } from "next/navigation";

import { getStudentFillAnalysisTabHref } from "@/lib/analysis/student-fill-analysis-tabs";

export default function StudentFillAnalysisIndexPage() {
  redirect(getStudentFillAnalysisTabHref("settings"));
}
