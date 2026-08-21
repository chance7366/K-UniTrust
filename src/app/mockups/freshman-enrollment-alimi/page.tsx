import { redirect } from "next/navigation";

/** 목업은 프로덕션에 반영됨 — 신입생충원 탭으로 이동 */
export default function FreshmanEnrollmentAlimiMockPage() {
  redirect("/analysis/univ-map?tab=freshman-enrollment");
}
