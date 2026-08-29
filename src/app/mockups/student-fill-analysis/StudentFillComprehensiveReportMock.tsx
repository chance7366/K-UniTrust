"use client";

import { FileText } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { StudentFillComprehensiveReportPanel } from "@/components/analysis/student-fill-analysis/StudentFillComprehensiveReportPanel";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";

export function StudentFillComprehensiveReportMock() {
  return (
    <StudentFillFrame activeLabel="분석결과 · 종합보고서">
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="분석결과"
          subtitle="첨부 종합보고서 본문 · 분석조건 필터는 보고서 안(기준 연도·권역·설립·학제)"
          note="인쇄는 A4 가로입니다. 프로덕션 분석결과의 종합보고서와 같은 화면입니다."
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className={FDB_TYPO.toolbarLabel}>분석연도</span>
          <span className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl}`}>
            2026년
          </span>
          <div className="ml-auto">
            <div className="glass-mint-seg">
              <span className="glass-mint-seg-item is-on">
                <FileText size={12} strokeWidth={2.6} aria-hidden />
                종합보고서
              </span>
            </div>
          </div>
        </div>
        <StudentFillComprehensiveReportPanel year={2026} />
      </div>
    </StudentFillFrame>
  );
}