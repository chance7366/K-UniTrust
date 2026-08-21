"use client";

import { Database } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { UnivAlimiRawDashboard } from "@/components/analysis/UnivAlimiRawDashboard";
import {
  INDUSTRY_ACCOUNTING_SHEETS,
  buildIndustryAccountingHref,
  type IndustryAccountingSheetId,
} from "@/lib/analysis/industry-accounting";
import type {
  UnivAlimiRawDashboardData,
  UnivAlimiScreenConfig,
} from "@/lib/analysis/univ-alimi-raw/types";

import "./edu-accounting-dashboard.css";

function StatementTabRow({ active }: { active: IndustryAccountingSheetId }) {
  return (
    <GlassMintTabGroup
      ariaLabel="산단회계 서식"
      active={active}
      items={INDUSTRY_ACCOUNTING_SHEETS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: Database,
        href: buildIndustryAccountingHref(tab.id, { resetFilters: true }),
      }))}
    />
  );
}

export function IndustryAccountingDashboard({
  data,
  screen,
  sheetId,
}: {
  data: UnivAlimiRawDashboardData;
  screen: UnivAlimiScreenConfig;
  sheetId: IndustryAccountingSheetId;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        title="산단회계"
        subtitle="대학재정알리미 · 산학협력단 현금흐름표·대차대조표·운영계산서"
      />
      <UnivAlimiRawDashboard
        data={data}
        screen={screen}
        hideHeader
        toolbarStart={<StatementTabRow active={sheetId} />}
        buildHref={buildIndustryAccountingHref}
        metricRoundDigits={0}
        metricUnitLabel="(단위 : 천원)"
      />
    </div>
  );
}
