"use client";

import { Database } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { UnivAlimiRawDashboard } from "@/components/analysis/UnivAlimiRawDashboard";
import {
  EDU_ACCOUNTING_SHEETS,
  buildEduAccountingHref,
  type EduAccountingSheetId,
} from "@/lib/analysis/edu-accounting";
import type {
  UnivAlimiRawDashboardData,
  UnivAlimiScreenConfig,
} from "@/lib/analysis/univ-alimi-raw/types";

import "./edu-accounting-dashboard.css";

function StatementTabRow({ active }: { active: EduAccountingSheetId }) {
  return (
    <GlassMintTabGroup
      ariaLabel="교비회계 서식"
      active={active}
      items={EDU_ACCOUNTING_SHEETS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: Database,
        href: buildEduAccountingHref(tab.id, { resetFilters: true }),
      }))}
    />
  );
}

export function EduAccountingDashboard({
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
        buildHref={buildEduAccountingHref}
        metricRoundDigits={0}
        metricUnitLabel="(단위 : 천원)"
      />
    </div>
  );
}
