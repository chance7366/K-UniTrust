"use client";

import Link from "next/link";

import { SidebarBrand } from "@/components/layout/SidebarBrand";

import "./ai-status-placement.css";

type AiStatus = "connected" | "idle" | "error";

const statusLabel: Record<AiStatus, string> = {
  connected: "AI Connected",
  idle: "AI Idle",
  error: "AI Error",
};

const statusColor: Record<AiStatus, string> = {
  connected: "bg-success",
  idle: "bg-warning",
  error: "bg-danger",
};

function AiStatusBadge({ status = "idle" }: { status?: AiStatus }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted">
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusColor[status]}`}
      />
      <span className="whitespace-nowrap">{statusLabel[status]}</span>
    </div>
  );
}

function MockNavPlaceholder() {
  return (
    <div className="ai-status-mock-nav-placeholder space-y-2">
      <p className="font-bold text-emerald-900">재정분석지표</p>
      <p className="pl-2">▾ 학생충원</p>
      <p className="pl-4 font-medium text-sky-700">신입생충원율</p>
      <p className="pl-4">재학생충원율</p>
      <p className="pl-4">중도탈락율</p>
    </div>
  );
}

function MockMainPreview() {
  return (
    <div className="ai-status-mock-main">
      <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <p className="ai-status-mock-page-title">신입생 충원 현황</p>
      </div>
      <div className="mt-2 flex gap-1 rounded-lg border border-border bg-surface-2 p-1 text-xs">
        <span className="rounded-md px-3 py-1.5 text-muted">통계분석</span>
        <span className="rounded-md bg-white px-3 py-1.5 font-semibold shadow-sm ring-1 ring-border">
          대학별DB
        </span>
      </div>
      <div className="ai-status-mock-card">
        대학별DB · 407개 대학 · 캠퍼스별 DB · 필터·테이블 영역
      </div>
    </div>
  );
}

function BeforeShell() {
  return (
    <div className="ai-status-mock-shell">
      <div className="ai-status-mock-sidebar">
        <div className="ai-status-mock-brand">
          <SidebarBrand />
        </div>
        <MockNavPlaceholder />
      </div>
      <div className="ai-status-mock-main-col">
        <div className="ai-status-mock-top-header">
          <AiStatusBadge status="idle" />
        </div>
        <MockMainPreview />
      </div>
    </div>
  );
}

function AfterShell() {
  return (
    <div className="ai-status-mock-shell">
      <div className="ai-status-mock-sidebar">
        <div className="ai-status-mock-brand">
          <SidebarBrand />
          <div className="ai-status-mock-brand-ai">
            <AiStatusBadge status="idle" />
          </div>
        </div>
        <MockNavPlaceholder />
      </div>
      <div className="ai-status-mock-main-col">
        <MockMainPreview />
      </div>
    </div>
  );
}

function BrandZoom({ variant }: { variant: "before" | "after" }) {
  return (
    <div className="ai-status-mock-brand-zoom">
      <p className="mb-2 text-xs font-semibold text-slate-500">
        사이드바 브랜드 영역 확대
      </p>
      <div className="ai-status-mock-brand">
        <SidebarBrand />
        {variant === "after" ? (
          <div className="ai-status-mock-brand-ai">
            <AiStatusBadge status="idle" />
          </div>
        ) : null}
      </div>
      {variant === "before" ? (
        <p className="mt-2 text-xs text-slate-500">
          AI 상태는 상단 헤더(우측)에만 표시
        </p>
      ) : (
        <p className="mt-2 text-xs text-emerald-700">
          AI 상태를 브랜드 박스 <strong>우측 하단</strong>에 배치
        </p>
      )}
    </div>
  );
}

function PreviewPanel({
  variant,
  children,
}: {
  variant: "before" | "after";
  children: React.ReactNode;
}) {
  return (
    <div className="ai-status-mock-panel">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <span className={`ai-status-mock-label ${variant}`}>
          {variant === "before" ? "현재 (Before)" : "제안 (After)"}
        </span>
      </div>
      {children}
    </div>
  );
}

export function AiStatusPlacementMock() {
  return (
    <div className="ai-status-mock-root antialiased">
      <div className="ai-status-mock-banner">
        <span>AI 상태 배치 · 프로덕션 적용 완료 (사이드바 브랜드 우하단)</span>
        <Link href="/analysis/finance-analysis?tab=freshman-enrollment-rate">
          현재 앱 보기 →
        </Link>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="ai-status-mock-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-slate-900">
            AI 상태 표시 위치 변경
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            상단 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">header</code>{" "}
            바의 AI Idle 뱃지를 제거하고, 사이드바{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">K-UniTrust Dashboard</code>{" "}
            브랜드 영역 우측 하단으로 이동
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewPanel variant="before">
            <BeforeShell />
            <BrandZoom variant="before" />
          </PreviewPanel>
          <PreviewPanel variant="after">
            <AfterShell />
            <BrandZoom variant="after" />
          </PreviewPanel>
        </div>

        <section className="ai-status-mock-panel px-5 py-4">
          <h2 className="font-bold text-slate-900">변경 요약</h2>
          <ul className="ai-status-mock-note mt-2 list-inside list-disc">
            <li>
              <strong>제거:</strong> 메인 영역 위 56px 상단 헤더 바 (AI Idle만 있던 공간)
            </li>
            <li>
              <strong>추가:</strong> 사이드바 브랜드(`bg-glow-sidebar-brand`) 우측 하단에 AI
              Connected / Idle / Error 뱃지
            </li>
            <li>
              <strong>효과:</strong> 콘텐츠가 상단부터 시작되어 세로 공간 확보, AI 상태는
              접속 정보성 UI로 사이드바에 자연스럽게 배치
            </li>
            <li>
              <strong>동작:</strong> 표시 로직은 기존과 동일 (API 키 유무 → Connected / Idle)
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
