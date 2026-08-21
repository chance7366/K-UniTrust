"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CircleHelp,
  Download,
  EyeOff,
  FileSpreadsheet,
} from "lucide-react";

import "./upload-panel-buttons.css";

function PanelMeta() {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-[#2db5d4]">
        엑셀업로드
      </p>
      <h4 className="mt-1 text-base font-semibold text-[#1a5c3a]">학교개황</h4>
      <p className="mt-2 max-w-xl text-sm text-[#5a6a7c]">
        학교 개황 정보 엑셀을 업로드하면{" "}
        <code className="text-[#2a7a55]">data/csv/univ_map_school_overview.csv</code>
        에 저장됩니다.
      </p>
      <p className="mt-2 text-xs text-[#5a6a7c]">
        최근 업로드: 2026. 8. 1. 오후 7:45:45 · 478행
      </p>
    </div>
  );
}

function CurrentButtons({
  helpOpen,
  onToggleHelp,
}: {
  helpOpen: boolean;
  onToggleHelp: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="upb-btn-current">양식down</span>
      <span className="upb-btn-current">엑셀 파일 선택</span>
      <span className="upb-btn-current-muted">숨기기</span>
      <button
        type="button"
        onClick={onToggleHelp}
        className={`upb-btn-current-help ${helpOpen ? "active" : ""}`}
      >
        도움말
      </button>
    </div>
  );
}

function ProposedButtons({
  helpOpen,
  onToggleHelp,
}: {
  helpOpen: boolean;
  onToggleHelp: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <a href="#template" className="upb-btn upb-btn-template">
        <Download size={13} strokeWidth={2.4} aria-hidden />
        양식down
      </a>
      <button type="button" className="upb-btn upb-btn-select">
        <FileSpreadsheet size={13} strokeWidth={2.4} aria-hidden />
        엑셀 파일 선택
      </button>
      <button type="button" className="upb-btn upb-btn-hide">
        <EyeOff size={13} strokeWidth={2.4} aria-hidden />
        숨기기
      </button>
      <button
        type="button"
        onClick={onToggleHelp}
        className={`upb-btn upb-btn-help ${helpOpen ? "active" : ""}`}
        aria-expanded={helpOpen}
      >
        <CircleHelp size={13} strokeWidth={2.4} aria-hidden />
        도움말
      </button>
    </div>
  );
}

function UploadPanelPreview({
  variant,
  helpOpen,
  onToggleHelp,
}: {
  variant: "before" | "after";
  helpOpen: boolean;
  onToggleHelp: () => void;
}) {
  return (
    <div className="upb-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className={`upb-label ${variant}`}>
          {variant === "before" ? "현재 (Before)" : "제안 (After)"}
        </span>
      </div>
      <section className="upb-upload-section m-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PanelMeta />
          {variant === "before" ? (
            <CurrentButtons helpOpen={helpOpen} onToggleHelp={onToggleHelp} />
          ) : (
            <ProposedButtons helpOpen={helpOpen} onToggleHelp={onToggleHelp} />
          )}
        </div>
        {helpOpen ? (
          <div className="mt-3 rounded-lg border border-[#dde5ee] bg-[#f8fafc] p-3 text-xs text-[#5a6a7c]">
            업로드 양식은 학교코드·학교명·본분교… 1행 헤더 구조입니다.
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function UploadPanelButtonsMock() {
  const [helpBefore, setHelpBefore] = useState(false);
  const [helpAfter, setHelpAfter] = useState(false);

  return (
    <div className="upb-root p-6 antialiased">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-amber-900">
              목업 갤러리 — 프로덕션 UploadPanel 버튼에 적용 완료
            </p>
            <Link
              href="/analysis/univ-map?tab=school-overview"
              className="font-bold text-emerald-700 hover:text-emerald-900"
            >
              현재 앱 보기 →
            </Link>
          </div>
        </div>

        <header className="upb-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            엑셀 업로드 패널 버튼 목업
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            심플한 3D 버튼 · 기능별 색상 구분 (선택=시안, 숨기기=슬레이트, 도움말=앰버)
          </p>
        </header>

        <div className="grid gap-6">
          <UploadPanelPreview
            variant="before"
            helpOpen={helpBefore}
            onToggleHelp={() => setHelpBefore((v) => !v)}
          />
          <UploadPanelPreview
            variant="after"
            helpOpen={helpAfter}
            onToggleHelp={() => setHelpAfter((v) => !v)}
          />
        </div>

        <section className="upb-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">색상·역할</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">엑셀 파일 선택</strong> — 시안
              3D (주요 액션)
            </li>
            <li>
              <strong className="text-[#1a2433]">숨기기</strong> — 슬레이트 그레이
              3D (닫기)
            </li>
            <li>
              <strong className="text-[#1a2433]">도움말</strong> — 앰버 3D (보조
              정보, 활성 시 진하게)
            </li>
            <li>
              <strong className="text-[#1a2433]">양식down</strong> — 연녹색
              아웃라인 3D (다운로드)
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
