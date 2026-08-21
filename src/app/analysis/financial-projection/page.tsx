import { redirect } from "next/navigation";

import { getFinancialProjectionTabHref } from "@/lib/analysis/financial-projection-tabs";

export default function FinancialProjectionIndexPage() {
  redirect(getFinancialProjectionTabHref("settings"));
}
