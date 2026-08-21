"use client";

import Link from "next/link";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import "./emerald-header.css";

function ProposalEmeraldHeader() {
  return (
    <div className="soh-emerald-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="soh-emerald-label">제안 1 · 산뜻한 에메랄드 소프트 그라데이션 (추천)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          본문 대비 약간 선명한 에메랄드 톤 + 초소형 콤팩트 버튼
        </p>
      </div>
      <div className="p-4">
        <DashboardEmeraldHeader
          sectionLabel="대학현황"
          subtitle="학교별 개황 정보 관리"
          title="학교개황"
          action={<ExcelUploadButton variant="emerald" />}
        />
      </div>
    </div>
  );
}

function CurrentProductionHeader() {
  return (
    <div className="soh-emerald-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="soh-emerald-label current">현재 앱 (프로덕션)</span>
      </div>
      <div className="p-4">
        <header className="soh-emerald-current-header">
          <h1>학교개황</h1>
          <span className="soh-emerald-current-btn">엑셀 데이터 업로드</span>
        </header>
      </div>
    </div>
  );
}

export function EmeraldHeaderMock() {
  return (
    <div className="soh-emerald-root p-6 antialiased">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-emerald-900">
              프로덕션 학교개황 페이지에 적용 완료
            </p>
            <Link
              href="/analysis/univ-map?tab=school-overview"
              className="font-bold text-emerald-700 hover:text-emerald-900"
            >
              현재 앱 보기 →
            </Link>
          </div>
        </div>

        <header className="soh-emerald-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            학교개황 헤더 — 에메랄드 그라데이션 제안
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            아이콘 · 섹션 배지 · 부제 · 제목 · 콤팩트 업로드 버튼을 한 카드에 묶은 헤더
            리디자인 시안입니다.
          </p>
        </header>

        <ProposalEmeraldHeader />
        <CurrentProductionHeader />

        <section className="soh-emerald-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">제안 1 구성 요소</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">배경</strong> — 좌측 에메랄드 소프트
              그라데이션, 우측으로 흰색 페이드
            </li>
            <li>
              <strong className="text-[#1a2433]">좌측</strong> — 건물 아이콘,{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">대학현황</code>{" "}
              배지, 부제 &lsquo;학교별 개황 정보 관리&rsquo;
            </li>
            <li>
              <strong className="text-[#1a2433]">제목</strong> — L1(26px)급 굵은
              다크 네이비 톤
            </li>
            <li>
              <strong className="text-[#1a2433]">버튼</strong> — 다크 에메랄드 솔리드 +
              아이콘, 시·도 필터 버튼과 비슷한 초소형 높이
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
