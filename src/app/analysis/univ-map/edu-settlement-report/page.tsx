import Link from "next/link";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { EduSettlementReportPanel } from "@/components/analysis/edu-accounting/EduSettlementReportPanel";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildEduSettlementGuidelines } from "@/lib/analysis/edu-accounting/settlement-guidelines";

export const metadata = {
  title: "교비회계 결산 종합보고서",
  description: "교비자금(수입) 결산 수입분석 종합보고서",
};

export default async function EduSettlementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const parsed = Number(params.year);
  const year =
    Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : null;
  const guidelines = buildEduSettlementGuidelines(
    year ?? new Date().getFullYear(),
  );

  return (
    <div className="flex flex-col gap-4">
      <DashboardEmeraldHeader
        sectionLabel="대학현황 · 재정알리미 · 교비회계"
        title="교비회계 결산 종합보고서"
        subtitle="수입분석 1차 · 등록금 · 전입·기부 · 교육부대·교육외 · A4 세로 · 디자인 표준 v2.2"
        note="숫자는 교비자금(수입)·학교코드·재학생(A) 원본에서 집계합니다. 매칭 실패 학교는 제외합니다."
      />
      <Link
        href={
          year != null
            ? `/analysis/univ-map?tab=edu-accounting&sheet=edu-fund&year=${year}`
            : "/analysis/univ-map?tab=edu-accounting&sheet=edu-fund"
        }
        className={`${FDB_TYPO.legend} underline underline-offset-2`}
      >
        교비회계로 돌아가기
      </Link>
      <EduSettlementReportPanel year={year} guidelines={guidelines} />
    </div>
  );
}
