"use client";

import Link from "next/link";
import { useEffect } from "react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  FDB_TABLE,
  FDB_TABLE_CURRENT_AUDIT,
} from "@/lib/analysis/finance-db-table-density";

import "./table-row-density-mock.css";

type DensityMode = "current" | "compact";

const SAMPLE_ROWS = [
  {
    code: "0000072",
    name: "가톨릭관동대학교",
    quota: "1,815",
    rateIn: "82.72",
    rateOut: "81.97",
  },
  {
    code: "0000514",
    name: "강릉영동대학교",
    quota: "774",
    rateIn: "83.40",
    rateOut: "98.62",
  },
  {
    code: "0000003",
    name: "강원대학교",
    quota: "3,521",
    rateIn: "91.25",
    rateOut: "92.10",
  },
  {
    code: "0000123",
    name: "경북대학교",
    quota: "4,102",
    rateIn: "88.04",
    rateOut: "89.31",
  },
  {
    code: "0000456",
    name: "고려대학교",
    quota: "3,890",
    rateIn: "95.12",
    rateOut: "96.44",
  },
];

const PADDING = {
  current: {
    headRowSpan: "px-2.5 py-2.5",
    headGroup: "px-2 py-2",
    headSub: "px-2 py-2",
    headSingle: "px-2.5 py-2.5",
    body: "px-2.5 py-2.5",
    bodyMetric: "px-2 py-2.5",
  },
  compact: {
    headRowSpan: FDB_TABLE.headRowSpan,
    headGroup: FDB_TABLE.headGroup,
    headSub: FDB_TABLE.headSub,
    headSingle: FDB_TABLE.headSingle,
    body: FDB_TABLE.cell,
    bodyMetric: FDB_TABLE.cellMetric,
  },
} as const;

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;
const rowSpanHeadClass = `${tableHeadClass} align-middle border-b-0 border-r border-border/50`;

function FreshmanStyleTable({
  mode,
  measureId,
}: {
  mode: DensityMode;
  measureId: string;
}) {
  const p = PADDING[mode];

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table
          id={measureId}
          className={`w-full border-collapse ${FDB_TYPO.tableBody}`}
        >
          <thead>
            <tr className="bg-surface-2">
              <th
                rowSpan={2}
                className={`${rowSpanHeadClass} ${p.headRowSpan} text-center`}
              >
                학교코드
              </th>
              <th
                rowSpan={2}
                className={`${rowSpanHeadClass} ${p.headRowSpan} text-left`}
              >
                학교명
              </th>
              <th
                rowSpan={2}
                className={`${rowSpanHeadClass} ${p.headRowSpan} text-center`}
              >
                입학정원
              </th>
              <th
                colSpan={3}
                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${p.headGroup} text-center`}
              >
                모집인원
              </th>
              <th
                colSpan={2}
                className={`${tableHeadClass} border-b border-border/50 ${p.headGroup} text-center text-warning`}
              >
                신입생충원율
              </th>
            </tr>
            <tr className="border-b border-border bg-surface-2">
              {["계", "정원내", "정원외", "정원내", "정원내외"].map((label) => (
                <th
                  key={label}
                  className={`${tableHeadClass} border-r border-border/50 ${p.headSub} text-center last:border-r-0`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row, i) => (
              <tr
                key={row.code}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
              >
                <td
                  className={`border-r border-border/40 ${p.body} text-center font-mono text-muted ${FDB_TYPO.tableCode}`}
                >
                  {row.code}
                </td>
                <td
                  className={`border-r border-border/40 ${p.body} font-semibold text-[#1a5c3a]`}
                >
                  {row.name}
                </td>
                <td
                  className={`border-r border-border/40 ${p.bodyMetric} text-right font-mono tabular-nums`}
                >
                  {row.quota}
                </td>
                {["1,869", "1,696", "173", row.rateIn, row.rateOut].map(
                  (value, idx) => (
                    <td
                      key={`${row.code}-${idx}`}
                      className={`border-r border-border/40 ${p.bodyMetric} text-right font-mono tabular-nums last:border-r-0 ${
                        idx === 3
                          ? "text-pink-600"
                          : idx === 4
                            ? "font-semibold text-warning"
                            : ""
                      }`}
                    >
                      {value}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RowMeasure targetId={measureId} />
    </div>
  );
}

function SingleHeaderTable({
  mode,
  measureId,
}: {
  mode: DensityMode;
  measureId: string;
}) {
  const p = PADDING[mode];

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table
          id={measureId}
          className={`w-full border-collapse ${FDB_TYPO.tableBody}`}
        >
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {["학교코드", "학교명", "설립", "지역", "학교종류"].map((h) => (
                <th
                  key={h}
                  className={`${tableHeadClass} border-r border-border/50 ${p.headSingle} text-left last:border-r-0`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.slice(0, 4).map((row, i) => (
              <tr
                key={row.code}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
              >
                <td
                  className={`border-r border-border/40 ${p.body} font-mono text-accent-orange ${FDB_TYPO.tableCode}`}
                >
                  {row.code}
                </td>
                <td className={`border-r border-border/40 ${p.body}`}>
                  {row.name}
                </td>
                <td className={`border-r border-border/40 ${p.body} text-muted`}>
                  사립
                </td>
                <td className={`border-r border-border/40 ${p.body} text-muted`}>
                  강원
                </td>
                <td className={`${p.body} text-muted`}>대학교</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RowMeasure targetId={measureId} />
    </div>
  );
}

function RowMeasure({ targetId }: { targetId: string }) {
  useEffect(() => {
    const row = document.querySelector(`#${targetId} tbody tr`);
    const label = document.querySelector(`[data-measure-for="${targetId}"]`);
    if (!row || !label) return;
    const height = Math.round(row.getBoundingClientRect().height);
    label.textContent = `tbody 1행 높이: ${height}px`;
  }, [targetId]);

  return (
    <p className="trd-row-measure" data-measure-for={targetId}>
      tbody 1행 높이: …
    </p>
  );
}

function ComparisonPanel({
  title,
  subtitle,
  variant,
  children,
}: {
  title: string;
  subtitle: string;
  variant: "before" | "after";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        variant === "after"
          ? "border border-[#b4dcc8] bg-[#effaf4]/40"
          : "border border-dashed border-[#dde5ee] bg-[#f8fafc]"
      }`}
    >
      <p
        className={`mb-1 text-xs font-bold ${
          variant === "after" ? "text-[#1a5c3a]" : "text-[#5a6a7c]"
        }`}
      >
        {title}
      </p>
      <p className="mb-3 text-[11px] text-muted">{subtitle}</p>
      {children}
    </div>
  );
}

export function TableRowDensityMock() {
  return (
    <div className="trd-root p-6 antialiased">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-violet-900">
              표 행·헤더 높이 통일 시안 — 프로덕션 적용 완료
            </p>
            <Link
              href="/analysis/finance-analysis?tab=freshman-enrollment-rate&section=data"
              className="font-bold text-violet-700 hover:text-violet-900"
            >
              현재 신입생충원율 보기 →
            </Link>
          </div>
        </div>

        <header className="trd-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            대학별DB 표 — 행 높이 통일 목업
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            신입생충원율 기준(~41px)의 약 80% →{" "}
            <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
              py-1.5
            </code>{" "}
            (~32px)로 전 메뉴 thead·tbody 패딩을 통일합니다.
          </p>
        </header>

        <section className="trd-panel overflow-hidden">
          <div className="border-b border-[#e8edf3] px-4 py-2.5">
            <span className="trd-label">제안 토큰 — FDB_TABLE</span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2 pr-4 font-semibold">역할</th>
                  <th className="pb-2 pr-4 font-semibold">현재 (혼재)</th>
                  <th className="pb-2 font-semibold">제안 (통일)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["tbody 셀", "py-2.5 / py-2 / py-1", FDB_TABLE.cell],
                  ["thead rowspan", "py-2.5", FDB_TABLE.headRowSpan],
                  ["thead 그룹(1행)", "py-2", FDB_TABLE.headGroup],
                  ["thead 서브(2행)", "py-2", FDB_TABLE.headSub],
                  ["thead 단일행", "py-2.5 / py-2 / py-1", FDB_TABLE.headSingle],
                ].map(([role, current, proposed]) => (
                  <tr key={role} className="border-b border-border/40">
                    <td className="py-2 pr-4 font-medium">{role}</td>
                    <td className="py-2 pr-4 text-muted">{current}</td>
                    <td className="py-2">
                      <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
                        {proposed}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="trd-panel overflow-hidden">
          <div className="border-b border-[#e8edf3] px-4 py-2.5">
            <span className="trd-label before">메뉴별 현재 상태 (감사)</span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2 pr-4 font-semibold">메뉴</th>
                  <th className="pb-2 pr-4 font-semibold">thead 패딩</th>
                  <th className="pb-2 pr-4 font-semibold">tbody 패딩</th>
                  <th className="pb-2 font-semibold">추정 행 높이</th>
                </tr>
              </thead>
              <tbody>
                {FDB_TABLE_CURRENT_AUDIT.map((row) => (
                  <tr key={row.menu} className="border-b border-border/40">
                    <td className="py-1.5 pr-4 font-medium">{row.menu}</td>
                    <td className="py-1.5 pr-4 text-muted">{row.head}</td>
                    <td className="py-1.5 pr-4 text-muted">{row.body}</td>
                    <td className="py-1.5 text-muted">{row.estRow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="trd-panel overflow-hidden">
          <div className="border-b border-[#e8edf3] px-4 py-2.5">
            <span className="trd-label">2행 헤더 (신입생충원율형)</span>
            <p className="mt-1 text-xs text-[#5a7a6c]">
              rowspan 헤더 + 그룹 헤더 — 현재 vs 제안 나란히 비교
            </p>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <ComparisonPanel
              title="현재 (프로덕션)"
              subtitle="tbody py-2.5 · thead rowspan py-2.5 · 서브 py-2"
              variant="before"
            >
              <FreshmanStyleTable mode="current" measureId="fe-current" />
            </ComparisonPanel>
            <ComparisonPanel
              title="제안 (통일 · ~80%)"
              subtitle="FDB_TABLE — tbody/rowspan py-1.5 · 서브 py-1"
              variant="after"
            >
              <FreshmanStyleTable mode="compact" measureId="fe-compact" />
            </ComparisonPanel>
          </div>
        </section>

        <section className="trd-panel overflow-hidden">
          <div className="border-b border-[#e8edf3] px-4 py-2.5">
            <span className="trd-label">단일행 헤더 (학교개황·학교코드형)</span>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <ComparisonPanel
              title="현재 혼재"
              subtitle="학교개황 py-2.5/py-2 · 학교코드 py-1"
              variant="before"
            >
              <SingleHeaderTable mode="current" measureId="so-current" />
            </ComparisonPanel>
            <ComparisonPanel
              title="제안 (통일)"
              subtitle="thead/tbody 모두 py-1.5"
              variant="after"
            >
              <SingleHeaderTable mode="compact" measureId="so-compact" />
            </ComparisonPanel>
          </div>
        </section>

        <section className="trd-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">적용 범위 (확정 시)</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
                finance-db-table-density.ts
              </code>{" "}
              → 11개 DataTable + 대시보드 내 인라인 표 일괄 교체
            </li>
            <li>헤더 2행 구조·rowspan border-b-0 패턴은 유지</li>
            <li>글자 크기(text-sm)는 유지 — 패딩만 축소</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
