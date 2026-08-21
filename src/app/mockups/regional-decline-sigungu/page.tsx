import { redirect } from "next/navigation";

/** 목업은 프로덕션에 반영됨 — 대학현황 지역소멸로 이동 */
export default function RegionalDeclineSigunguMockPage() {
  redirect("/analysis/univ-map?tab=regional-decline");
}
