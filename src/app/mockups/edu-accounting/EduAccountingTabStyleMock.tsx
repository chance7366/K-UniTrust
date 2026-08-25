"use client";

import Link from "next/link";
import { Database } from "lucide-react";

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
import "./edu-accounting-tab-style-mock.css";

const MOCK_BASE = "/mockups/edu-accounting";

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
  );
}

export function EduAccountingTabStyleMock({
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
        <strong>교비회계 탭 박스 시안 · 프로덕션 미적용</strong>
        <p>
          탭 박스 배경은 연한 녹색, 탭 외곽선은 그보다 진한 녹색입니다. 선택된
          탭 글자색(보라)은 유지했습니다.{" "}
          <Link
            href="/analysis/univ-map?tab=edu-accounting"
            className="underline underline-offset-2"
          >
            프로덕션 교비회계
          </Link>
        </p>
      </div>
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        title="교비회계"
        subtitle="대학재정알리미 · 교비·등록금·비등록금 자금계산서·대차대조표·운영계산서"
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
