"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  MOCK_DENSITY,
  MOCK_HISTOGRAM,
  MOCK_KPIS,
  MOCK_RISK_SCHOOLS,
  MOCK_RISK_TIERS,
  MOCK_SIDO,
  MOCK_YEARS,
  MOCK_ZONES,
} from "./mock-data";

const CHART = {
  grid: "#E2E8F0",
  axis: "#64748B",
  indigo: "#6366F1",
  indigoLight: "#A5B4FC",
  amber: "#F59E0B",
  emerald: "#10B981",
};

const tooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  boxShadow: "0 12px 30px -6px rgba(0,0,0,0.12)",
  fontSize: 12,
  padding: "10px 14px",
};

function KpiIcon({ type }: { type: "indigo" | "blue" | "rose" | "amber" }) {
  const paths: Record<string, string> = {
    indigo: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    blue: "M3 3v18h18M7 16l4-4 4 4 6-6",
    rose: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    amber: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  };
  return (
    <div className={`fsl-kpi-icon ${type}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d={paths[type]} />
      </svg>
    </div>
  );
}

function LightTooltip({
  formatter,
}: {
  formatter?: (v: number) => string;
}) {
  return (
    <Tooltip
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
          <div style={tooltipStyle}>
            {label != null && label !== "" ? (
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0F172A" }}>{label}</p>
            ) : null}
            {payload.map((entry) => {
              const raw = entry.value as number;
              const display = formatter ? formatter(raw) : String(raw ?? "—");
              return (
                <p key={String(entry.dataKey)} style={{ margin: "2px 0", color: "#475569" }}>
                  {entry.name}: <strong style={{ color: "#0F172A" }}>{display}</strong>
                </p>
              );
            })}
          </div>
        );
      }}
    />
  );
}

type MainTab = "geo" | "distribution";

export function ChartsSection() {
  const [year, setYear] = useState(2024);
  const [mainTab, setMainTab] = useState<MainTab>("geo");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const sidoBarData = [...MOCK_SIDO]
    .sort((a, b) => b.avgRate - a.avgRate)
    .map((s) => ({ region: s.region, avgRate: s.avgRate }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="fsl-filter-bar">
        <div className="fsl-filter-label">글로벌 필터</div>
        <div className="fsl-filter-row">
          <div className="fsl-filter-group">
            <label>표시 연도</label>
            {MOCK_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                className={`fsl-pill${year === y ? " active" : ""}`}
                onClick={() => setYear(y)}
              >
                {y}년
              </button>
            ))}
          </div>
          <div className="fsl-filter-group">
            <label>설립구분</label>
            <select className="fsl-select" defaultValue="사립">
              <option value="">전체</option>
              <option value="국·공립">국·공립</option>
              <option value="사립">사립</option>
            </select>
          </div>
          <div className="fsl-filter-group">
            <label>학교구분</label>
            <select className="fsl-select" defaultValue="">
              <option value="">전체</option>
              <option value="대학">대학</option>
              <option value="전문대학">전문대학</option>
            </select>
          </div>
          <button type="button" className="fsl-btn-ghost">
            필터 초기화
          </button>
        </div>
      </div>

      <div className="fsl-kpi-grid">
        <div className="fsl-kpi">
          <div className="fsl-kpi-top">
            <KpiIcon type="indigo" />
            <span className="fsl-delta up">↑ +{MOCK_KPIS.yoy}%p</span>
          </div>
          <p className="fsl-kpi-label">전국 평균 자금확보율</p>
          <p className="fsl-kpi-value indigo">{MOCK_KPIS.avgRate}%</p>
          <p className="fsl-kpi-sub">Σ자금합계 ÷ Σ등록금수입 · 높을수록 좋음</p>
        </div>
        <div className="fsl-kpi">
          <div className="fsl-kpi-top">
            <KpiIcon type="blue" />
          </div>
          <p className="fsl-kpi-label">중앙값 &amp; IQR</p>
          <p className="fsl-kpi-value blue">{MOCK_KPIS.median}%</p>
          <p className="fsl-kpi-sub">IQR (Q3−Q1) = {MOCK_KPIS.iqr}%p</p>
        </div>
        <div className="fsl-kpi">
          <div className="fsl-kpi-top">
            <KpiIcon type="rose" />
          </div>
          <p className="fsl-kpi-label">위험군 대학 수</p>
          <p className="fsl-kpi-value rose">{MOCK_KPIS.riskBelow100}개교</p>
          <p className="fsl-kpi-sub">
            &lt;100% {MOCK_KPIS.riskBelow100Pct}% · &lt;80% {MOCK_KPIS.riskBelow80}개 (
            {MOCK_KPIS.riskBelow80Pct}%)
          </p>
        </div>
        <div className="fsl-kpi">
          <div className="fsl-kpi-top">
            <KpiIcon type="amber" />
          </div>
          <p className="fsl-kpi-label">분석 대상</p>
          <p className="fsl-kpi-value amber">{MOCK_KPIS.schoolCount}개교</p>
          <p className="fsl-kpi-sub">{year}년 · 선택 필터 적용</p>
        </div>
      </div>

      <div className="fsl-main-tabs" role="tablist">
        {(
          [
            { id: "geo" as const, label: "지역·권역 격차" },
            { id: "distribution" as const, label: "분포·위험군" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mainTab === tab.id}
            className={`fsl-main-tab${mainTab === tab.id ? " active" : ""}`}
            onClick={() => setMainTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === "geo" ? (
        <>
          <div className="fsl-chart-grid-2">
            <div className="fsl-panel">
              <div className="fsl-panel-head">
                <h3 className="fsl-panel-title">5대 권역 비교</h3>
                <p className="fsl-panel-sub">권역별 평균 자금확보율 · 막대=평균, 선=전년 대비(%p)</p>
              </div>
              <div className="fsl-panel-body">
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_ZONES} barCategoryGap="22%">
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818CF8" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="region" tick={{ fontSize: 11, fill: CHART.axis }} interval={0} angle={-20} textAnchor="end" height={44} />
                      <YAxis yAxisId="rate" tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `${v}%`} width={40} />
                      <YAxis yAxisId="yoy" orientation="right" tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `${v}%p`} width={40} />
                      <LightTooltip formatter={(v) => `${v}%`} />
                      <Bar yAxisId="rate" dataKey="avgRate" name="평균 자금확보율" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                      <Line yAxisId="yoy" type="monotone" dataKey="yoy" name="전년 대비" stroke={CHART.amber} strokeWidth={3} dot={{ r: 4, fill: CHART.amber }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="fsl-panel">
              <div className="fsl-panel-head">
                <h3 className="fsl-panel-title">17개 시·도 순위</h3>
                <p className="fsl-panel-sub">평균 자금확보율 내림차순 · X축=지역</p>
              </div>
              <div className="fsl-panel-body">
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sidoBarData} margin={{ bottom: 56 }} barCategoryGap="28%">
                      <defs>
                        <linearGradient id="sidoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A5B4FC" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="region" tick={{ fontSize: 10, fill: CHART.axis }} interval={0} angle={-45} textAnchor="end" height={56} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: CHART.axis }} width={44} />
                      <LightTooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="avgRate" name="평균 자금확보율" fill="url(#sidoGrad)" radius={[8, 8, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="fsl-panel">
            <div className="fsl-panel-head">
              <h3 className="fsl-panel-title">17개 시·도 상세 테이블</h3>
              <p className="fsl-panel-sub">행 클릭 시 하단 위험군 목록이 해당 지역으로 필터링됩니다</p>
            </div>
            <div className="fsl-panel-body">
              <div className="fsl-table-wrap">
                <table className="fsl-table">
                  <thead>
                    <tr>
                      <th>지역</th>
                      <th className="right">학교 수</th>
                      <th className="right">평균 자금확보율</th>
                      <th className="right">전년 대비</th>
                      <th className="right">중앙값</th>
                      <th className="right">위험군 (&lt;100%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SIDO.map((row) => (
                      <tr
                        key={row.region}
                        className={`clickable${selectedRegion === row.region ? " selected" : ""}`}
                        onClick={() =>
                          setSelectedRegion(selectedRegion === row.region ? null : row.region)
                        }
                      >
                        <td>{row.region}</td>
                        <td className="right mono">{row.schoolCount}</td>
                        <td className="right mono highlight">{row.avgRate}%</td>
                        <td className={`right mono ${row.yoy >= 0 ? "highlight" : "danger"}`}>
                          {row.yoy >= 0 ? "+" : ""}
                          {row.yoy}%p
                        </td>
                        <td className="right mono">{row.median}%</td>
                        <td className="right mono danger">{row.riskCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="fsl-panel">
            <div className="fsl-panel-head">
              <h3 className="fsl-panel-title">위험군 대학 목록</h3>
              <p className="fsl-panel-sub">
                {selectedRegion ? `${selectedRegion} · ` : ""}
                자금확보율 100% 미만 · 금액 단위: 백만원
              </p>
            </div>
            <div className="fsl-panel-body">
              <div className="fsl-table-wrap">
                <table className="fsl-table">
                  <thead>
                    <tr>
                      <th>학교명</th>
                      <th>지역</th>
                      <th className="right">자금합계</th>
                      <th className="right">등록금수입</th>
                      <th className="right">자금확보율</th>
                      <th className="center">구분</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_RISK_SCHOOLS.filter((r) =>
                      selectedRegion ? r.region === selectedRegion : true,
                    ).map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.region}</td>
                        <td className="right mono">{row.totalFunds.toLocaleString("ko-KR")}</td>
                        <td className="right mono">{row.tuition.toLocaleString("ko-KR")}</td>
                        <td className={`right mono ${row.rate < 80 ? "danger" : "warn"}`}>
                          {row.rate}%
                        </td>
                        <td className="center">
                          <span className={`fsl-badge ${row.tier === "고위험" ? "rose" : "amber"}`}>
                            {row.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mainTab === "distribution" ? (
        <>
          <div className="fsl-panel">
            <div className="fsl-panel-head">
              <h3 className="fsl-panel-title">자금확보율 밀도 분포</h3>
              <p className="fsl-panel-sub">중앙값·평균·100% 기준선 · 150%+ 고성과 구간</p>
            </div>
            <div className="fsl-panel-body">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_DENSITY} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="x" tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `${v}%`} />
                    <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={36} />
                    <LightTooltip />
                    <Area type="monotone" dataKey="y" name="밀도" stroke="#6366F1" strokeWidth={3} fill="url(#densityFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="fsl-footnote">
                100% = 등록금수입 대비 확보 자금 기준선 · 평균 128.4% · 중앙값 121.6%
              </div>
            </div>
          </div>

          <div className="fsl-chart-grid-2">
            <div className="fsl-panel">
              <div className="fsl-panel-head">
                <h3 className="fsl-panel-title">위험 단계별 분포</h3>
                <p className="fsl-panel-sub">고위험 · 위험 · 양호 · 여유 구간별 학교 수</p>
              </div>
              <div className="fsl-panel-body">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_RISK_TIERS} barCategoryGap="24%">
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="tier" tick={{ fontSize: 10, fill: CHART.axis }} interval={0} angle={-12} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={36} />
                      <LightTooltip />
                      <Bar dataKey="count" name="학교 수" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {MOCK_RISK_TIERS.map((entry) => (
                          <Cell key={entry.tier} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="fsl-panel">
              <div className="fsl-panel-head">
                <h3 className="fsl-panel-title">히스토그램</h3>
                <p className="fsl-panel-sub">20%p 고정 구간별 학교 수</p>
              </div>
              <div className="fsl-panel-body">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_HISTOGRAM} barCategoryGap="18%">
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="bin" tick={{ fontSize: 10, fill: CHART.axis }} interval={0} angle={-30} textAnchor="end" height={52} />
                      <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={36} />
                      <LightTooltip />
                      <Bar dataKey="count" name="학교 수" fill="#818CF8" radius={[8, 8, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
