"use client";

import { Database } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { UnivAlimiRawDashboard } from "@/components/analysis/UnivAlimiRawDashboard";
import {
  CORP_GENERAL_SHEETS,
  buildCorpGeneralHref,
  type CorpGeneralSheetId,
} from "@/lib/analysis/corp-general";
import type {
  UnivAlimiRawDashboardData,
  UnivAlimiScreenConfig,
} from "@/lib/analysis/univ-alimi-raw/types";

import "./edu-accounting-dashboard.css";

function StatementTabRow({ active }: { active: CorpGeneralSheetId }) {
  return (
    <GlassMintTabGroup
      ariaLabel="법인일반 서식"
      active={active}
      items={CORP_GENERAL_SHEETS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: Database,
        href: buildCorpGeneralHref(tab.id, { resetFilters: true }),
      }))}
    />
  );
}

export function CorpGeneralDashboard({
  data,
  screen,
  sheetId,
}: {
  data: UnivAlimiRawDashboardData;
  screen: UnivAlimiScreenConfig;
  sheetId: CorpGeneralSheetId;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        title="법인일반"
        subtitle="대학재정알리미 · 법인일반회계 자금계산서·대차대조표·운영계산서"
      />
      <UnivAlimiRawDashboard
        data={data}
        screen={screen}
        hideHeader
        toolbarStart={<StatementTabRow active={sheetId} />}
        buildHref={buildCorpGeneralHref}
        metricRoundDigits={0}
        metricUnitLabel="(단위 : 천원)"
      />
    </div>
  );
}
