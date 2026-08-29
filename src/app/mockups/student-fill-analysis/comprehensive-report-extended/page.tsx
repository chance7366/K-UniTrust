"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import { StudentFillFrame } from "../StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";

export default function StudentFillComprehensiveExtendedMockPage() {
  return (
    <StudentFillFrame activeLabel="분석결과 · 종합보고서 확장 목업">
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="종합보고서 확장 시안"
          subtitle="제1~3장 원문은 유지하고, 국공립·사립 / 수도권·비수도권 / 대학·전문대 / 선제 정원감축 권역 분석을 이어서 붙였습니다"
          note="프로덕션 종합보고서에 동일 비교 분석을 반영했습니다. 초록 점선 박스가 이어서 붙인 부분입니다."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mockups/student-fill-analysis/comprehensive-report"
            className={`${FDB_TYPO.legend} underline underline-offset-2`}
          >
            현재 종합보고서 목업
          </Link>
          <div className="ml-auto">
            <div className="glass-mint-seg">
              <span className="glass-mint-seg-item is-on">
                <FileText size={12} strokeWidth={2.6} aria-hidden />
                종합보고서 확장 시안
              </span>
            </div>
          </div>
        </div>
        <iframe
          title="종합보고서 확장 목업"
          src="/mockups/sfa-comprehensive-report-extended.html"
          className="h-[min(82vh,1100px)] w-full rounded-lg border border-border bg-white"
        />
      </div>
    </StudentFillFrame>
  );
}