"use client";

import { useMemo, useState } from "react";

import { PanelWithHelp } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import {
  fmtScore,
  gradeBadgeClass,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  RISK_SIDO_ORDER,
  buildRiskSidoRows,
  buildRiskTotalRow,
  iqrScore,
  riskUniversityRows,
  toSidoShortLabel,
  type RiskSidoRow,
} from "@/lib/competitiveness-analysis/risk-universities-analytics";

function fmtYoy(value: number | null): string {
  if (value == null) return "—";
  if (value === 0) return "0.0";
  return `${value > 0 ? "▲" : "▼"} ${Math.abs(value).toFixed(1)}`;
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string | null;
  accent?: "mint" | "amber" | "rose" | "blue";
}) {
  const valueClass =
    accent === "mint"
      ? "text-accent"
      : accent === "amber"
        ? "text-accent-orange"
        : accent === "rose"
          ? "text-rose-600"
          : accent === "blue"
            ? "text-sky-600"
            : "text-foreground";
  const deltaPositive = delta?.startsWith("▲");

  return (
    <div className="rounded-xl border border-border bg-surface p-5 border-l-4 border-l-border/80">
      <div className="flex items-start justify-between gap-2">
        <p className={CHART_TYPO.kpiLabel}>{label}</p>
        {delta ? (
          <span
            className={`rounded-full px-2 py-0.5 ${CHART_TYPO.kpiDelta} ${
              deltaPositive
                ? "bg-emerald-500/15 text-emerald-600"
                : delta.startsWith("▼")
                  ? "bg-rose-500/15 text-rose-600"
                  : "bg-surface-2 text-muted"
            }`}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className={`mt-1.5 ${CHART_TYPO.kpiSub}`}>{sub}</p> : null}
    </div>
  );
}

function SidoTable({
  rows,
  total,
  selectedRegion,
  onSelect,
}: {
  rows: RiskSidoRow[];
  total: RiskSidoRow;
  selectedRegion: string | null;
  onSelect: (region: string | null) => void;
}) {
  const sorted = [...rows].sort(
    (a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1),
  );
  const display = [total, ...sorted];

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full table-fixed border-collapse ${CHART_TYPO.tableBody}`}
      >
        <colgroup>
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-2 text-center">
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>지역</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>학교수</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>가중평균</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>전년대비</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>중앙값</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>산술평균</th>
            <th className={`px-3 py-2 text-rose-600 ${CHART_TYPO.tableHead}`}>
              위험군
            </th>
          </tr>
        </thead>
        <tbody>
          {display.map((row) => {
            const isTotal = row.region === "전체";
            return (
              <tr
                key={row.region}
                onClick={() =>
                  isTotal
                    ? onSelect(null)
                    : onSelect(selectedRegion === row.region ? null : row.region)
                }
                className={`cursor-pointer border-b border-border/40 transition-colors hover:bg-accent/5 ${
                  isTotal
                    ? "bg-surface-2 font-semibold"
                    : selectedRegion === row.region
                      ? "bg-accent/10"
                      : ""
                }`}
              >
                <td className="px-3 py-2 text-center font-bold text-accent">
                  {row.region}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {row.schoolCount}
                </td>
                <td className="px-3 py-2 text-center font-mono font-semibold text-accent">
                  {row.avgScore == null ? "—" : fmtScore(row.avgScore)}
                </td>
                <td
                  className={`px-3 py-2 text-center font-mono ${
                    row.yoy == null
                      ? "text-muted"
                      : row.yoy >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                  }`}
                >
                  {fmtYoy(row.yoy)}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {row.median == null ? "—" : fmtScore(row.median)}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {row.meanScore == null ? "—" : fmtScore(row.meanScore)}
                </td>
                <td className="px-3 py-2 text-center font-mono text-rose-600">
                  {row.riskCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`mt-2 ${CHART_TYPO.legend}`}>
        가중평균은 재학생수 가중 종합점수, 산술평균은 학교별 평균입니다. 위험군은
        D등급·E등급 학교 수입니다. 행을 클릭하면 하단 목록이 해당 지역으로
        필터링됩니다.
      </p>
    </div>
  );
}

function RiskSchoolTable({
  rows,
  region,
}: {
  rows: RunAnalyticsRow[];
  region: string | null;
}) {
  const highRisk = rows.filter((row) => row.grade === "E").length;

  if (!rows.length) {
    return (
      <p className={CHART_TYPO.bodyText}>
        {region
          ? `${region} · D등급·E등급 위험군 대학이 없습니다.`
          : "선택 필터 기준 위험군(D·E등급) 대학이 없습니다."}
      </p>
    );
  }

  return (
    <div>
      <div className="max-h-[420px] overflow-auto rounded-lg border border-border/60">
        <table
          className={`w-full min-w-[1080px] border-collapse ${CHART_TYPO.tableBody}`}
        >
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr className="border-b border-border">
              <th className={`px-2 py-2 text-left ${CHART_TYPO.tableHead}`}>
                학교명
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                재학생수
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                규모
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                지역
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                권역
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                학생충원
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                대학재정
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                법인재정
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                종합점수
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                진단등급
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.schoolCodeStd} className="border-b border-border/30">
                <td className="px-2 py-1.5 font-bold text-accent">{row.name}</td>
                <td className="px-2 py-1.5 text-center font-mono text-muted">
                  {row.enrolledTotal == null
                    ? "—"
                    : row.enrolledTotal.toLocaleString("ko-KR")}
                </td>
                <td className="px-2 py-1.5 text-center">{row.scale ?? "—"}</td>
                <td className="px-2 py-1.5 text-center">{row.province}</td>
                <td className="px-2 py-1.5 text-center">{row.zone}</td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.studentSectorScore)}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.univFinanceScore)}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.foundationScore)}
                </td>
                <td
                  className={`px-2 py-1.5 text-center font-mono font-semibold ${
                    row.grade === "E" ? "text-rose-600" : "text-accent-orange"
                  }`}
                >
                  {fmtScore(row.totalScore)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`${gradeBadgeClass(row.grade)} cra-grade-sm`}>
                    {row.grade ? `${row.grade}등급` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`mt-2 ${CHART_TYPO.legend}`}>
        {region ? `${region} · ` : ""}
        위험군 {rows.length.toLocaleString("ko-KR")}개교 표시 · E등급(고위험){" "}
        {highRisk.toLocaleString("ko-KR")}개교 · 학생충원·대학재정·법인재정은
        카테고리 지수
      </p>
    </div>
  );
}

export function RiskUniversitiesTab({
  rows,
  prevRows,
  analysisYear,
  cohortLabel,
}: {
  rows: RunAnalyticsRow[];
  prevRows: RunAnalyticsRow[];
  analysisYear: number;
  cohortLabel: string;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const sidoRows = useMemo(
    () => buildRiskSidoRows(rows, prevRows),
    [rows, prevRows],
  );
  const total = useMemo(
    () => buildRiskTotalRow(rows, prevRows),
    [rows, prevRows],
  );
  const iqr = useMemo(() => iqrScore(rows), [rows]);
  const riskRows = useMemo(() => {
    const all = riskUniversityRows(rows);
    if (!selectedRegion) return all;
    const known = new Set<string>(RISK_SIDO_ORDER);
    return all.filter((row) => {
      const sido = toSidoShortLabel(row.province);
      if (selectedRegion === "기타") return !known.has(sido);
      return sido === selectedRegion;
    });
  }, [rows, selectedRegion]);

  const eCount = rows.filter(
    (row) => !row.excludedFromRanking && row.grade === "E",
  ).length;
  const dCount = Math.max(0, total.riskCount - eCount);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="전국 평균 종합점수"
          value={total.avgScore == null ? "—" : fmtScore(total.avgScore)}
          delta={fmtYoy(total.yoy)}
          sub={`재학생수 가중 평균 · ${analysisYear}년`}
          accent="mint"
        />
        <KpiCard
          label="평균값"
          value={total.meanScore == null ? "—" : fmtScore(total.meanScore)}
          sub="학교별 산술평균"
        />
        <KpiCard
          label="중앙값 & IQR"
          value={total.median == null ? "—" : fmtScore(total.median)}
          sub={iqr == null ? undefined : `IQR( Q3−Q1 ) = ${fmtScore(iqr)}`}
          accent="blue"
        />
        <KpiCard
          label="위험군 대학 수"
          value={`${total.riskCount.toLocaleString("ko-KR")}개교`}
          sub={`D등급 ${dCount} · E등급(고위험) ${eCount}`}
          accent="rose"
        />
        <KpiCard
          label="분석 대상"
          value={`${total.schoolCount.toLocaleString("ko-KR")}개교`}
          sub={`${analysisYear}년 · ${cohortLabel}`}
          accent="amber"
        />
      </div>

      <PanelWithHelp
        title="17개 시·도 상세 테이블"
        help={{
          title: "17개 시·도 상세 테이블",
          body: "시·도별 학교 수, 가중 평균 종합점수, 전년 대비, 중앙값, 산술평균(평균값), D·E등급 위험군 학교 수입니다. 행을 클릭하면 해당 지역의 위험군 대학만 목록에 표시됩니다.",
        }}
      >
        <SidoTable
          rows={sidoRows}
          total={total}
          selectedRegion={selectedRegion}
          onSelect={setSelectedRegion}
        />
      </PanelWithHelp>

      <PanelWithHelp
        title="위험군 대학 목록"
        help={{
          title: "위험군 대학 목록",
          body: "진단등급 D·E 대학을 종합점수 낮은 순으로 나열합니다. 학생충원·대학재정·법인재정은 카테고리 지수, 종합점수는 3단계 결과입니다. E등급은 고위험으로 구분합니다.",
        }}
      >
        <RiskSchoolTable rows={riskRows} region={selectedRegion} />
      </PanelWithHelp>
    </div>
  );
}
