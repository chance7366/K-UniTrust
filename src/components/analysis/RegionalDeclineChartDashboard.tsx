"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useState } from "react";

import { RegionalDeclineDetailTable } from "@/components/analysis/RegionalDeclineDetailTable";
import { RegionalDeclineEChartsBarRace } from "@/components/analysis/RegionalDeclineEChartsBarRace";
import { RegionalDeclineEChartsLineChart } from "@/components/analysis/RegionalDeclineEChartsLineChart";
import { RegionalDeclineGradeMatrix } from "@/components/analysis/RegionalDeclineGradeMatrix";
import {
  fmtRegionalIndex,
  fmtRegionalSigned,
  REGIONAL_DECLINE_PLAY_INTERVAL_MS,
  type RegionalDeclineDashboardModel,
} from "@/lib/analysis/regional-decline-dashboard-analytics";
import type { LineChartRegionFilter } from "@/lib/analysis/school-age-decline-analytics";

export function RegionalDeclineChartDashboard({
  model,
}: {
  model: RegionalDeclineDashboardModel;
}) {
  const lastYearIndex = model.years.length - 1;
  const [yearIndex, setYearIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lineFilter, setLineFilter] = useState<LineChartRegionFilter>("ALL");

  const currentYear = model.years[yearIndex];
  const barRaceEntries = model.barRaceByYear.get(currentYear) ?? [];
  const nationalPoint = model.nationalSeries.points.find(
    (point) => point.year === currentYear,
  );
  const atEnd = yearIndex >= lastYearIndex;

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      setYearIndex((prev) => {
        if (prev >= lastYearIndex) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, REGIONAL_DECLINE_PLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [lastYearIndex, playing]);

  function handlePlayToggle() {
    if (atEnd && !playing) {
      setYearIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((prev) => !prev);
  }

  function handleSliderChange(index: number) {
    setPlaying(false);
    setYearIndex(index);
  }

  function handleReset() {
    setPlaying(false);
    setYearIndex(0);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          accent="blue"
          title={`${model.kpi.startYear}년 전국 소멸위험지수`}
          value={fmtRegionalIndex(model.kpi.nationalStartIndex)}
          sub="차트 시작 기준년"
        />
        <KpiCard
          accent="amber"
          title={`${model.kpi.latestYear}년 전국 소멸위험지수`}
          value={fmtRegionalIndex(model.kpi.nationalLatestIndex)}
          sub={`${model.kpi.startYear}년 대비 ${fmtRegionalSigned(model.kpi.nationalChange)}`}
        />
        <KpiCard
          accent="red"
          title={`${model.kpi.latestYear}년 최고 위험 지역`}
          value={model.kpi.worstRegion}
          sub={`지수 ${fmtRegionalIndex(model.kpi.worstLatestIndex)} (가장 낮음)`}
        />
        <KpiCard
          accent="emerald"
          title={`${model.kpi.latestYear}년 최저 위험 지역`}
          value={model.kpi.bestRegion}
          sub={`지수 ${fmtRegionalIndex(model.kpi.bestLatestIndex)} (가장 높음)`}
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-accent/30 bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                메인 시각화
              </span>
              <h2 className="text-lg font-bold text-foreground">
                연도별 지역 소멸위험지수 (Y축 고정 · 막대 길이 애니메이션)
              </h2>
            </div>
            <p className={`mt-1 ${FDB_TYPO.legend}`}>
              Y축 시·도 순서는 고정하고, 재생 시 {model.kpi.startYear}→
              {model.kpi.latestYear}년까지 1년씩 막대 길이·색상(등급)만
              변합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 p-2">
            <button
              type="button"
              onClick={handlePlayToggle}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-accent/30 transition-all hover:opacity-90"
            >
              {playing ? "일시정지" : atEnd ? "다시 재생" : "재생"}
            </button>
            <button
              type="button" onClick={handleReset}
              className={`rounded-lg border border-border px-3 py-1.5 hover:text-foreground ${FDB_TYPO.toolbarControl} text-muted` }
            >
              처음으로
            </button>

            <div className="flex min-w-[180px] flex-col">
              <div className="mb-1 flex justify-between text-[11px] text-muted">
                <span className="font-bold text-accent">{currentYear}년</span>
                <span className="font-mono">
                  전국:{" "}
                  {nationalPoint
                    ? fmtRegionalIndex(nationalPoint.index)
                    : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={lastYearIndex}
                value={yearIndex}
                onChange={(event) =>
                  handleSliderChange(Number(event.target.value))
                }
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface accent-accent"
                aria-label="연도 타임라인"
              />
            </div>
          </div>
        </div>

        <RegionalDeclineEChartsBarRace entries={barRaceEntries} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                17개 시도별 소멸위험지수 추세 (전국 비교)
              </h3>
              <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
                전국 추세선(붉은 점선) 대비 지역별 하락·상승 속도를
                비교합니다.
              </p>
            </div>
            <select
              value={lineFilter}
              onChange={(event) =>
                setLineFilter(event.target.value as LineChartRegionFilter)
              }
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
            >
              <option value="ALL">전체 지역 보기</option>
              <option value="SUDOGWON">수도권 (서울, 경기, 인천)</option>
              <option value="NON_SUDOGWON">비수도권 전체</option>
            </select>
          </div>
          <RegionalDeclineEChartsLineChart
            years={model.years}
            sidoSeries={model.sidoSeries}
            nationalSeries={model.nationalSeries}
            filter={lineFilter}
          />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <RegionalDeclineGradeMatrix
            latestYear={model.kpi.latestYear}
            groups={model.gradeGroupsLatest}
          />
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <RegionalDeclineDetailTable
          years={model.years}
          sidoSeries={model.sidoSeries}
          nationalSeries={model.nationalSeries}
        />
      </section>
    </div>
  );
}

function KpiCard({
  accent,
  title,
  value,
  sub,
}: {
  accent: "blue" | "amber" | "red" | "emerald";
  title: string;
  value: string;
  sub: string;
}) {
  const border = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    emerald: "border-l-emerald-500",
  }[accent];

  const valueColor = {
    blue: "text-foreground",
    amber: "text-amber-400",
    red: "text-red-400",
    emerald: "text-emerald-600",
  }[accent];

  const subColor = {
    blue: "text-accent",
    amber: "text-amber-300/80",
    red: "text-red-300/80",
    emerald: "text-emerald-300/80",
  }[accent];

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 border-l-4 ${border}`}
    >
      <p className="mb-1 text-xs font-medium text-muted">{title}</p>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      <p className={`mt-1 text-xs ${subColor}`}>{sub}</p>
    </div>
  );
}
