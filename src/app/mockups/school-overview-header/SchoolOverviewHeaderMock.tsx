"use client";

import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

import "./school-overview-header.css";

function HeaderShell({
  variant,
  children,
}: {
  variant: "before" | "after";
  children: React.ReactNode;
}) {
  return (
    <div className="soh-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className={`soh-label ${variant}`}>
          {variant === "before" ? "현재 (Before)" : "제안 (After)"}
        </span>
      </div>
      <header className="px-5 py-4">{children}</header>
    </div>
  );
}

function CurrentHeader() {
  return (
    <HeaderShell variant="before">
      <div className="soh-header-current flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1>학교개황</h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            대학·전문대학 학교 개황 정보 (2026-07-22 기준)
          </p>
        </div>
        <button type="button" className="soh-btn-current">
          엑셀 데이터 업로드
        </button>
      </div>
    </HeaderShell>
  );
}

function ProposedHeader() {
  return (
    <HeaderShell variant="after">
      <div className="soh-header-proposed flex flex-wrap items-center justify-between gap-3">
        <h1>학교개황</h1>
        <button type="button" className="soh-btn-upload">
          <FileSpreadsheet size={13} strokeWidth={2.4} aria-hidden />
          엑셀업로드
        </button>
      </div>
    </HeaderShell>
  );
}

export function SchoolOverviewHeaderMock() {
  return (
    <div className="soh-root p-6 antialiased">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-amber-900">
              목업 갤러리 — 이전 제안(단순 녹색 제목)은 프로덕션에 반영됨
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/mockups/school-overview-header/emerald"
                className="font-bold text-emerald-700 hover:text-emerald-900"
              >
                에메랄드 그라데이션 제안 →
              </Link>
              <Link
                href="/analysis/univ-map?tab=school-overview"
                className="font-bold text-emerald-700 hover:text-emerald-900"
              >
                현재 앱 보기 →
              </Link>
            </div>
          </div>
        </div>

        <header className="soh-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            학교개황 페이지 헤더 목업
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            부제목 삭제 · 제목 진한 녹색 · 엑셀업로드 버튼 입체감(3D) 적용
          </p>
        </header>

        <div className="grid gap-6">
          <CurrentHeader />
          <ProposedHeader />
        </div>

        <section className="soh-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">변경 요약</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">부제목 삭제</strong> — 기준일
              안내 문구 제거
            </li>
            <li>
              <strong className="text-[#1a2433]">제목 색상</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
                #1a5c3a
              </code>{" "}
              진한 녹색
            </li>
            <li>
              <strong className="text-[#1a2433]">업로드 버튼</strong> — 라벨
              &lsquo;엑셀업로드&rsquo;, 그라데이션 + 하단 그림자 3D 효과, 호버·
              클릭 피드백
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
