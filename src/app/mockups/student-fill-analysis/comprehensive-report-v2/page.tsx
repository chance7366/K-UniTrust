"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildStudentFillComprehensiveGuidelinesV2Mock } from "@/lib/analysis/student-fill-analysis/comprehensive-guidelines-v2.mock";

import { StudentFillFrame } from "../StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";

export default function StudentFillComprehensiveReportV2MockPage() {
  const guidelines = buildStudentFillComprehensiveGuidelinesV2Mock(2026);

  return (
    <StudentFillFrame activeLabel="분석결과 · 종합보고서 v2 목업">
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="종합보고서 심층 시안 (v2)"
          subtitle="첨부 8장 소절 분량 · A4 세로 · 분교·캠퍼스 본교 합산 후 율 재계산 · 2022–2026"
          note="분석실행(2022–2026) 본교 합산 결과로 표·차트를 다시 채웠습니다. 프로덕션 종합보고서와 같은 숫자입니다."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mockups/student-fill-analysis/comprehensive-report"
            className={`${FDB_TYPO.legend} underline underline-offset-2`}
          >
            현재 종합보고서 목업
          </Link>
          <Link
            href="/analysis/student-fill-analysis/run"
            className={`${FDB_TYPO.legend} underline underline-offset-2`}
          >
            프로덕션 분석결과
          </Link>
          <div className="ml-auto">
            <div className="glass-mint-seg">
              <span className="glass-mint-seg-item is-on">
                <FileText size={12} strokeWidth={2.6} aria-hidden />
                심층 시안 v2
              </span>
            </div>
          </div>
        </div>
        <iframe
          title="종합보고서 심층 시안 v2"
          src="/mockups/sfa-comprehensive-report-v2.html"
          className="h-[min(86vh,1200px)] w-full rounded-lg border border-border bg-white"
        />
        <details className="rounded-lg border border-border bg-card p-4">
          <summary className={`${FDB_TYPO.panelTitle} cursor-pointer`}>
            첨부 보고서 vs 이 목업 · 소절별 대조
          </summary>
          <div className="mt-3 overflow-auto text-[13px] leading-relaxed text-muted-foreground">
            <p className="mb-2">
              대제목·중제목(8장)과 소절 번호는 첨부와 같습니다. 첨부는 2025–2026 2개년·캠퍼스 행을 학교
              단위로 본 분량이고, 이 목업은 같은 소절에 2022–2026 5개년과{" "}
              <strong>분교·캠퍼스 인원 본교 합산 후 율 재계산</strong>을 넣었습니다. 이전 목업은 소절당
              1–2문단이라 첨부보다 짧았습니다. 이번 수정은 소절마다 첨부와 같은 진단 단락(배경–숫자–해석–시사)을
              채웠습니다.
            </p>
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 pr-2">소절</th>
                  <th className="py-1 pr-2">첨부 PDF</th>
                  <th className="py-1">이 목업</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/70">
                  <td>1.2 대상</td>
                  <td>학교 수·CSV 항목</td>
                  <td>합산 분자/분모로 율 재계산 방법까지 기술</td>
                </tr>
                <tr className="border-b border-border/70">
                  <td>2.1–2.3</td>
                  <td>1년 5교 감축</td>
                  <td>5년 14교 + 캠퍼스 통폐합은 정원에 남는다는 해석</td>
                </tr>
                <tr className="border-b border-border/70">
                  <td>3.1–3.4</td>
                  <td>모집 이중전략·격차·외비중·신입탈락</td>
                  <td>같은 논리 + 5년 경로 + 규모별 외비중 차트</td>
                </tr>
                <tr className="border-b border-border/70">
                  <td>4.1–4.4</td>
                  <td>정원·격차·휴학·중탈</td>
                  <td>같은 소절 + 권역 격차·휴학·중탈 차트</td>
                </tr>
                <tr className="border-b border-border/70">
                  <td>5.1–5.3</td>
                  <td>증가·언어·위험군</td>
                  <td>5년 가속 + 합산 비중/충족/탈락</td>
                </tr>
                <tr className="border-b border-border/70">
                  <td>7–8</td>
                  <td>5대 총평, A–D, 8.1.1–8.3.3, 8.4</td>
                  <td>동일 소절 구조 + 본교 합산 감독 원칙</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
        <details className="rounded-lg border border-border bg-card p-4">
          <summary className={`${FDB_TYPO.panelTitle} cursor-pointer`}>
            목업 지침 v2.0.0 전문 (프로덕션 미반영)
          </summary>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
            {guidelines}
          </pre>
        </details>
      </div>
    </StudentFillFrame>
  );
}
