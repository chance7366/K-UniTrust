import { redirect } from "next/navigation";

export default function RunAnalyticsMockRedirect() {
  redirect("/analysis/competitiveness-analysis/run?view=analytics");
}
