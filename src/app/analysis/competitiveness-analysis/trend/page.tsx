import { redirect } from "next/navigation";

import { getFinancialProjectionTabHref } from "@/lib/analysis/financial-projection-tabs";

export default function CompetitivenessTrendRedirectPage() {
  redirect(getFinancialProjectionTabHref("settings"));
}
