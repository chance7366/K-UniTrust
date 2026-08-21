"use client";

import { useState } from "react";
import { BarChart3, Database } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { UnivStatusMenuTab } from "@/lib/analysis/univ-status-menu-mock-tabs";

import "./univ-status-menu-mock.css";

type Section = "data" | "charts";

const MOCK_YEARS = [2024, 2023, 2022, 2021];
const MOCK_SCHOOLS = [
  { code: "0000123", name: "○○대학교", region: "경기", kind: "대학", value: "12,450" },
  { code: "0000456", name: "△△대학교", region: "충남", kind: "대학", value: "8,920" },
  { code: "0000789", name: "□□전문대학", region: "부산", kind: "전문대학", value: "3,210" },
  { code: "0001011", name: "◇◇대학교", region: "전북", kind: "대학", value: "6,780" },
  { code: "0001213", name: "☆☆대학교", region: "경남", kind: "대학", value: "5,430" },
];

function SectionTabs({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  const tabs = [
    { id: "data" as const, label: "대학별DB", icon: Database },
    { id: "charts" as const, label: "통계분석", icon: BarChart3 },
  ];

  return (
    <div
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function placeholderColumns(tab: UnivStatusMenuTab): string[] {
  if (tab.id === "analysis-target") {
    return ["분석연도", "학교종류", "학교", "분석대상", "비고"];
  }
  if (tab.groupId === "finance-alimi") {
    return ["기준연도", "학교", "계정과목", "금액(원)", "전년대비"];
  }
  if (tab.id === "avg-tuition") {
    return ["기준연도", "학교", "학부·대학원", "평균등록금(원)", "전년대비"];
  }
  return ["기준연도", "학교", "학부·대학원", "재적학생(명)", "전년대비"];
}

export function UnivStatusDbPlaceholder({ tab }: { tab: UnivStatusMenuTab }) {
  const [section, setSection] = useState<Section>("data");
  const [year, setYear] = useState(MOCK_YEARS[0]);
  const columns = placeholderColumns(tab);

  return (
    <div className="space-y-4">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        title={tab.label}
        subtitle={`${tab.groupLabel} · ${tab.description}`}
        action={<ExcelUploadButton variant="emerald" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTabs active={section} onChange={setSection} />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className={FDB_TYPO.toolbarLabel}>기준연도</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
            >
              {MOCK_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {section === "data" ? (
        <div className="usm-table-wrap overflow-x-auto rounded-xl border border-border bg-surface">
          <table className={`w-full min-w-[720px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
            <thead className="border-b border-border bg-surface-2">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="text-table-head whitespace-nowrap px-3 py-2.5 font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SCHOOLS.map((row) => (
                <tr key={row.code} className="border-b border-border/40 hover:bg-surface-2/50">
                  <td className="px-3 py-2 text-muted">{year}</td>
                  {tab.id === "analysis-target" ? (
                    <>
                      <td className="px-3 py-2">{row.kind}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                      <td className="px-3 py-2">
                        <span className="usm-badge usm-badge-on">포함</span>
                      </td>
                      <td className="px-3 py-2 text-muted">—</td>
                    </>
                  ) : tab.groupId === "finance-alimi" ? (
                    <>
                      <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                      <td className="px-3 py-2 text-muted">(계정과목)</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.value}</td>
                      <td className="px-3 py-2 text-muted">—</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                      <td className="px-3 py-2 text-muted">학부</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.value}</td>
                      <td className="px-3 py-2 text-muted">—</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="usm-chart-placeholder flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/40 p-8 text-center">
          <BarChart3 className="mb-3 h-10 w-10 text-muted" aria-hidden />
          <p className={`${FDB_TYPO.sectionTab} text-foreground`}>통계분석 (목업)</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            {tab.label} 지표에 대한 연도·지역·설립별 통계 차트가 이 영역에 배치됩니다.
          </p>
        </div>
      )}

      <p className="text-xs text-muted">
        화면 구성은 재정분석지표/학생충원/신입생충원율 대학별DB 패턴을 따릅니다. 실데이터·업로드·
        필터는 Phase 2에서 연동 예정입니다.
      </p>
    </div>
  );
}
