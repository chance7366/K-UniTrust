import Link from "next/link";
import { FileText } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { AppShell } from "@/components/layout/AppShell";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildEduSettlementGuidelinesMock } from "@/lib/analysis/edu-accounting/settlement-guidelines.mock";

import "@/components/analysis/glass-help-button.css";

export const metadata = {
  title: "교비회계 결산 종합보고서 시안",
  description: "2025회계연도 수입분석 종합보고서 목업 (프로덕션 미적용)",
};

export default function EduAccountingSettlementReportMockPage() {
  const guidelines = buildEduSettlementGuidelinesMock(2025);

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="대학현황 · 재정알리미 · 교비회계 · 목업"
          title="2025회계연도 교비회계 결산 종합보고서"
          subtitle="수입분석 1차 · 등록금 · 전입·기부 · 교육부대·교육외 · A4 세로 · 디자인 표준 v2.2"
          note="프로덕션 미적용. 표·차트 숫자는 시안입니다. 생성 시 교비자금(수입)·학교코드·재학생(A)로 다시 집계합니다."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mockups/edu-accounting-settlement?sheet=edu-fund"
            className={`${FDB_TYPO.legend} underline underline-offset-2`}
          >
            교비회계 화면 목업
          </Link>
          <div className="ml-auto">
            <div className="glass-mint-seg">
              <span className="glass-mint-seg-item is-on">
                <FileText size={12} strokeWidth={2.6} aria-hidden />
                종합보고서 시안
              </span>
            </div>
          </div>
        </div>
        <iframe
          title="교비회계 결산 종합보고서 목업"
          src="/mockups/edu-fund-income-comprehensive.html"
          className="h-[min(86vh,1200px)] w-full rounded-lg border border-border bg-white"
        />
        <details className="rounded-lg border border-border bg-card p-4" open>
          <summary className={`${FDB_TYPO.panelTitle} cursor-pointer`}>
            종합보고서 생성 지침 (목업)
          </summary>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
            {guidelines}
          </pre>
        </details>
      </div>
    </AppShell>
  );
}
