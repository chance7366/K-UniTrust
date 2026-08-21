"use client";

import Link from "next/link";

import "./font-pretendard.css";

const MOCK_ROWS = [
  { code: "0000072", name: "가천대학교", quota: 1200, rate: 99.83 },
  { code: "0000107", name: "강원대학교", quota: 850, rate: 91.0 },
  { code: "0000115", name: "경기대학교", quota: 960, rate: 97.28 },
];

function FontSamplePreview({ variant }: { variant: "before" | "after" }) {
  const rootClass = variant === "before" ? "font-mock-before" : "font-mock-after";

  return (
    <div className={`${rootClass} font-pretendard-mock-preview`}>
      {/* 사이드바 브랜드 */}
      <div className="font-pretendard-mock-sidebar">
        <p className="font-mock-brand-title font-pretendard-mock-brand-title">
          K-UniTrust
        </p>
        <span className="mt-1.5 inline-block rounded-full border border-[#3b9a6a]/30 bg-[#e7f6ee] px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] text-[#2a7a55] uppercase">
          Dashboard
        </span>
        <p className="mt-3 text-[13px] font-semibold text-[#4a7a66]">▾ 학생충원</p>
        <p className="mt-1 pl-2 text-[13px] font-medium text-sky-700">신입생충원율</p>
      </div>

      {/* 페이지 제목 */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <h2 className="font-pretendard-mock-page-title">신입생 충원 현황</h2>
      </div>

      {/* 탭 + 패널 */}
      <div className="mt-2 flex gap-1 rounded-lg border border-border bg-surface-2 p-1 text-base">
        <span className="rounded-md px-3 py-1.5 text-[15px] text-muted">통계분석</span>
        <span className="rounded-md bg-surface px-3 py-1.5 text-[15px] font-semibold shadow-sm ring-1 ring-border">
          대학별DB
        </span>
      </div>
      <p className="mt-2 text-[15px] text-muted">
        407개 대학 · 캠퍼스별 DB · 표시 연도 2024년
      </p>

      {/* 필터 */}
      <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-muted">
        <span className="font-semibold">설립구분</span>
        <span className="font-semibold">학교종류 ▾</span>
        <span className="font-semibold">지역 ▾</span>
      </div>

      {/* 테이블 */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="font-pretendard-mock-table">
          <thead>
            <tr>
              <th>학교코드</th>
              <th>학교명</th>
              <th>입학정원</th>
              <th>충원율(정원내)</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row) => (
              <tr key={row.code}>
                <td className="code font-mock-mono">{row.code}</td>
                <td className="font-semibold">{row.name}</td>
                <td className="num font-mock-mono">{row.quota.toLocaleString("ko-KR")}</td>
                <td className="num font-mock-mono highlight">{row.rate.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* weight 샘플 (After에서만 의미 있지만 양쪽 표시) */}
      <div className="font-pretendard-mock-weight-row mt-4">
        <span className="font-normal">Regular 400</span>
        <span className="font-medium">Medium 500</span>
        <span className="font-semibold">SemiBold 600</span>
        <span className="font-bold">Bold 700</span>
        <span className="font-extrabold">ExtraBold 800</span>
      </div>

      <p className="font-pretendard-mock-note">
        {variant === "before" ? (
          <>
            <strong>현재:</strong> 영문 K-UniTrust → Sora · 한글 UI → OS 기본 폰트(맑은 고딕
            등) · 숫자 → JetBrains Mono
          </>
        ) : (
          <>
            <strong>제안:</strong> 한글 UI 전체 → Pretendard · K-UniTrust만 → Sora · 숫자 →
            JetBrains Mono
          </>
        )}
      </p>
    </div>
  );
}

function PreviewPanel({
  variant,
}: {
  variant: "before" | "after";
}) {
  return (
    <div className="font-pretendard-mock-panel">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <span className={`font-pretendard-mock-label ${variant}`}>
          {variant === "before" ? "현재 (Sora + OS 한글)" : "제안 (Pretendard + Sora 브랜드)"}
        </span>
      </div>
      <FontSamplePreview variant={variant} />
    </div>
  );
}

export function FontPretendardMock() {
  return (
    <div className="font-pretendard-mock-root antialiased">
      <div className="font-pretendard-mock-banner">
        <span> Pretendard 폰트 · 프로덕션 적용 완료</span>
        <Link href="/analysis/finance-analysis?tab=freshman-enrollment-rate">
          현재 앱 보기 →
        </Link>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="font-pretendard-mock-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-slate-900">한글 폰트 개선 — Pretendard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sora(latin only)로 인한 한글 OS fallback 문제를 Pretendard Variable로 해결. 브랜드
            영문 K-UniTrust는 Sora 유지.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewPanel variant="before" />
          <PreviewPanel variant="after" />
        </div>

        <section className="font-pretendard-mock-panel px-5 py-4">
          <h2 className="font-bold text-slate-900">3단 폰트 역할 (승인 후 적용 예정)</h2>
          <ul className="font-pretendard-mock-spec mt-2 list-inside list-disc">
            <li>
              <strong>Pretendard</strong> — 본문·한글 UI 전체 (<code className="text-xs">font-sans</code>
              )
            </li>
            <li>
              <strong>Sora</strong> — 사이드바 브랜드 &quot;K-UniTrust&quot;만 (
              <code className="text-xs">font-brand</code>)
            </li>
            <li>
              <strong>JetBrains Mono</strong> — 테이블 숫자·학교코드 (
              <code className="text-xs">font-mono</code>, 현행 유지)
            </li>
          </ul>
        </section>

        <section className="font-pretendard-mock-panel px-5 py-4">
          <h2 className="font-bold text-slate-900">승인 후 적용 파일</h2>
          <ul className="font-pretendard-mock-spec mt-2 list-inside list-disc">
            <li>
              <code className="text-xs">public/fonts/PretendardVariable.woff2</code> 추가
            </li>
            <li>
              <code className="text-xs">src/app/layout.tsx</code> — localFont 등록
            </li>
            <li>
              <code className="text-xs">src/app/globals.css</code> —{" "}
              <code className="text-xs">--font-sans</code> → Pretendard
            </li>
            <li>
              <code className="text-xs">SidebarBrand.tsx</code> —{" "}
              <code className="text-xs">font-brand</code> 클래스
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
