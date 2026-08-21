"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Database,
  Layers3,
  TrendingUp,
} from "lucide-react";

import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import {
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { gradeBadgeClass } from "@/lib/competitiveness-analysis/run-analytics";
import "@/components/analysis/competitiveness-analysis/run-analytics.css";

import {
  MOCK_RISK_JUNIOR,
  MOCK_RISK_UNIVERSITY,
  MOCK_SIDO_JUNIOR,
  MOCK_SIDO_UNIVERSITY,
  MOCK_TOTAL_JUNIOR,
  MOCK_TOTAL_UNIVERSITY,
  type MockCohort,
  type MockRiskSchool,
  type MockSidoRow,
} from "./mock-data";

type AnalyticsInnerTab = "risk" | "all" | "step1" | "step2" | "step3";
type MockRunCohort = MockCohort | "compare";
type MockResultView = "step1" | "step2" | "step3" | "analytics";

function fmtScore(value: number): string {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtYoy(value: number): string {
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
  rows: MockSidoRow[];
  total: MockSidoRow;
  selectedRegion: string | null;
  onSelect: (region: string | null) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.avgScore - a.avgScore);
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
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>평균</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>전년대비</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>중앙값</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>평균값</th>
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
                  {fmtScore(row.avgScore)}
                </td>
                <td
                  className={`px-3 py-2 text-center font-mono ${
                    row.yoy >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {fmtYoy(row.yoy)}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {fmtScore(row.median)}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {fmtScore(row.meanScore)}
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
        평균은 재학생수 가중 종합점수, 평균값은 학교별 산술평균입니다. 위험군은
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
  rows: MockRiskSchool[];
  region: string | null;
}) {
  const filtered = rows
    .filter((row) => (region ? row.region === region : true))
    .sort((a, b) => a.totalScore - b.totalScore);
  const highRisk = filtered.filter((row) => row.grade === "E").length;

  if (!filtered.length) {
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
            {filtered.map((row) => (
              <tr key={row.name} className="border-b border-border/30">
                <td className="px-2 py-1.5 font-bold text-accent">{row.name}</td>
                <td className="px-2 py-1.5 text-center font-mono text-muted">
                  {row.enrolled.toLocaleString("ko-KR")}
                </td>
                <td className="px-2 py-1.5 text-center">{row.scale}</td>
                <td className="px-2 py-1.5 text-center">{row.region}</td>
                <td className="px-2 py-1.5 text-center">{row.zone}</td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.studentIndex)}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.univFinanceIndex)}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmtScore(row.foundationIndex)}
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
                    {row.grade}등급
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`mt-2 ${CHART_TYPO.legend}`}>
        {region ? `${region} · ` : ""}
        위험군 {filtered.length.toLocaleString("ko-KR")}개교 표시 · E등급(고위험){" "}
        {highRisk.toLocaleString("ko-KR")}개교 · 학생충원·대학재정·법인재정은 2단계
        카테고리 지수
      </p>
    </div>
  );
}

export function CompetitivenessRiskUniversitiesMock() {
  const [cohort, setCohort] = useState<MockRunCohort>("university");
  const [innerTab, setInnerTab] = useState<AnalyticsInnerTab>("risk");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const dataCohort: MockCohort =
    cohort === "junior-college" ? "junior-college" : "university";

  const sidoRows =
    dataCohort === "university" ? MOCK_SIDO_UNIVERSITY : MOCK_SIDO_JUNIOR;
  const total =
    dataCohort === "university" ? MOCK_TOTAL_UNIVERSITY : MOCK_TOTAL_JUNIOR;
  const riskRows =
    dataCohort === "university" ? MOCK_RISK_UNIVERSITY : MOCK_RISK_JUNIOR;
  const eCount = riskRows.filter((row) => row.grade === "E").length;

  return (
    <CompetitivenessShell activeTab="run">
      <section className="rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3">
        <p className={`font-medium text-foreground ${CHART_TYPO.bodyText}`}>
          목업 — 프로덕션 미적용
        </p>
        <p className={`mt-1 ${CHART_TYPO.legend}`}>
          통계분석 맨 왼쪽에 <strong>위험군대학</strong> 탭을 둔 제안입니다.
          재정분석 통계분석의 위험군대학과 같이 17개 시·도 테이블 + D·E등급
          대학 목록입니다. 숫자는 예시입니다.
        </p>
        <p className={`mt-2 ${CHART_TYPO.legend}`}>
          <Link
            href="/analysis/competitiveness-analysis/run?view=analytics"
            className="font-semibold text-accent hover:underline"
          >
            현재 통계분석
          </Link>
          {" · "}
          <Link
            href="/analysis/finance-analysis?year=2024&section=charts&tab=corp-transfer-ratio"
            className="font-semibold text-accent hover:underline"
          >
            재정분석 위험군대학 참고
          </Link>
        </p>
      </section>

      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex h-[30px] items-center rounded-md border border-border bg-surface px-2.5 ${FDB_TYPO.toolbarControl}`}
          >
            분석연도 2025
          </span>
          <GlassMintTabGroup<MockResultView>
            ariaLabel="분석결과 보기"
            active="analytics"
            onChange={() => undefined}
            items={[
              { id: "step1", label: "원지표값", icon: Database },
              { id: "step2", label: "지수·순위", icon: TrendingUp },
              { id: "step3", label: "종합지수", icon: Layers3 },
              { id: "analytics", label: "통계분석", icon: BarChart3 },
            ]}
          />
          <GlassMintTabGroup<MockRunCohort>
            ariaLabel="코호트"
            active={cohort}
            onChange={(id) => {
              setCohort(id);
              setSelectedRegion(null);
            }}
            items={[
              {
                id: "university",
                label: "대학",
                count: String(MOCK_TOTAL_UNIVERSITY.schoolCount),
              },
              {
                id: "junior-college",
                label: "전문대학",
                count: String(MOCK_TOTAL_JUNIOR.schoolCount),
              },
              { id: "compare", label: "대학전문" },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
            role="tablist"
            aria-label="통계분석 보기"
          >
            {(
              [
                { id: "risk", label: "위험군대학", icon: AlertTriangle },
                { id: "all", label: "통합 파이프라인 분석", icon: BarChart3 },
                { id: "step1", label: "1단계", icon: Database },
                { id: "step2", label: "2단계", icon: TrendingUp },
                { id: "step3", label: "3단계", icon: Layers3 },
              ] as const
            ).map((tab) => {
              const isActive = innerTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setInnerTab(tab.id)}
                  className={`inline-flex h-[30px] shrink-0 items-center gap-1 rounded px-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                      : "font-medium text-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-indigo-700" : "text-muted"
                    }`}
                    aria-hidden
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <HelpTip
            help={{
              title: "위험군대학 탭",
              body: "종합점수 진단등급 D·E인 대학을 지역별로 확인합니다. 재정분석 통계분석의 위험군대학 탭과 같은 17개 시·도 테이블 + 대학 목록 구조입니다.",
            }}
          />
        </div>

        {innerTab !== "risk" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              이 목업은 <strong>위험군대학</strong> 탭만 구성했습니다. 통합
              파이프라인·1·2·3단계는 현재 통계분석 화면과 같습니다.
            </p>
          </section>
        ) : cohort === "compare" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              대학vs전문 비교는 이 목업에 넣지 않았습니다. 대학 또는 전문대학
              코호트를 선택해 주세요.
            </p>
          </section>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="전국 평균 종합점수"
                value={fmtScore(total.avgScore)}
                delta={fmtYoy(total.yoy)}
                sub="재학생수 가중 평균 · 2025년"
                accent="mint"
              />
              <KpiCard
                label="중앙값 & IQR"
                value={fmtScore(total.median)}
                sub="IQR( Q3−Q1 ) = 18.4"
                accent="blue"
              />
              <KpiCard
                label="위험군 대학 수"
                value={`${total.riskCount.toLocaleString("ko-KR")}개교`}
                sub={`D등급 ${total.riskCount - eCount} · E등급(고위험) ${eCount}`}
                accent="rose"
              />
              <KpiCard
                label="분석 대상"
                value={`${total.schoolCount.toLocaleString("ko-KR")}개교`}
                sub={`2025년 · ${dataCohort === "university" ? "대학" : "전문대학"}`}
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
          </>
        )}
      </div>
    </CompetitivenessShell>
  );
}
