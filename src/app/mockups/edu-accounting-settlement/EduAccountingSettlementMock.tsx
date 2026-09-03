"use client";

import Link from "next/link";
import { Database, FileText } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { UnivAlimiRawDashboard } from "@/components/analysis/UnivAlimiRawDashboard";
import {
  EDU_ACCOUNTING_SHEETS,
  type EduAccountingSheetId,
} from "@/lib/analysis/edu-accounting";
import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import type {
  UnivAlimiIndicatorId,
  UnivAlimiRawDashboardData,
  UnivAlimiRawQuery,
  UnivAlimiScreenConfig,
} from "@/lib/analysis/univ-alimi-raw/types";

import "../univ-status-menu/univ-status-menu-mock.css";
import "../edu-accounting/edu-accounting-tab-style-mock.css";
import "@/components/analysis/glass-help-button.css";

const MOCK_BASE = "/mockups/edu-accounting-settlement";

function buildMockHref(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("sheet", indicator);
  if (query.dataset) params.set("dataset", query.dataset);
  if (query.year != null) params.set("year", String(query.year));
  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.schoolDivision) {
      params.set("schoolDivision", query.schoolDivision);
    }
    const schoolKinds = serializeMultiFilterParam(
      parseMultiFilterParam(query.schoolKind),
    );
    if (schoolKinds) params.set("schoolKind", schoolKinds);
    const regions = serializeMultiFilterParam(
      parseMultiFilterParam(query.region),
    );
    if (regions) params.set("region", regions);
    if (query.search) params.set("search", query.search);
  }
  return `${MOCK_BASE}?${params.toString()}`;
}

function StatementTabRow({ active }: { active: EduAccountingSheetId }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
      <div className="eatm-tablist" role="tablist" aria-label="교비회계 서식">
        {EDU_ACCOUNTING_SHEETS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={buildMockHref(tab.id, { resetFilters: true })}
              role="tab"
              aria-selected={isActive}
              className={`eatm-tab ${isActive ? "eatm-tab-active" : ""}`}
            >
              <Database className="eatm-tab-icon" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/mockups/edu-accounting-settlement/report"
        className="glass-mint-seg shrink-0"
        aria-label="종합보고서 목업"
      >
        <span className="glass-mint-seg-item is-on">
          <FileText size={12} strokeWidth={2.6} aria-hidden />
          종합보고서
        </span>
      </Link>
    </div>
  );
}

export function EduAccountingSettlementMock({
  data,
  screen,
  sheetId,
}: {
  data: UnivAlimiRawDashboardData;
  screen: UnivAlimiScreenConfig;
  sheetId: EduAccountingSheetId;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="usm-mock-banner" role="note">
        <strong>교비회계 결산 종합보고서 · 목업 · 프로덕션 미적용</strong>
        <p>
          두 번째 메뉴(서식 탭) 오른쪽 끝에 종합보고서 버튼을 둔 시안입니다.{" "}
          <Link
            href="/analysis/univ-map?tab=edu-accounting"
            className="underline underline-offset-2"
          >
            프로덕션 교비회계
          </Link>
        </p>
      </div>
      <DashboardEmeraldHeader
        sectionLabel="대학현황 · 재정알리미"
        title="교비회계"
        subtitle="교비자금(수입)으로 2025회계연도 수입분석을 붙일 위치 · 목업"
      />
      <UnivAlimiRawDashboard
        data={data}
        screen={screen}
        hideHeader
        toolbarStart={<StatementTabRow active={sheetId} />}
        buildHref={buildMockHref}
        metricRoundDigits={0}
        metricUnitLabel="(단위 : 천원)"
      />
    </div>
  );
}
