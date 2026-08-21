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

const AXIS = "#5A6A7C";
const GRID = "#C9D8D0";
const AXIS_TICK = { fontSize: 12, fill: AXIS, fontWeight: 600 as const };

function IconSvg({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function ChipTooltip({
  mode,
}: {
  mode: "zone" | "sido" | "default";
}) {
  return (
    <Tooltip
      cursor={{ fill: "rgba(255, 176, 32, 0.12)" }}
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const row = payload[0]?.payload as {
          region?: string;
          avgRate?: number;
          yoy?: number;
          schoolCount?: number;
        };

        if (mode === "zone" && row) {
          const yoy = row.yoy ?? 0;
          const yoyTone = yoy < 0 ? "red" : yoy >= 2 ? "orange" : "green";
          return (
            <div className="fst-tip-stack">
              <div className="fst-tip-chip orange">
                <span>권역 · 평균 자금확보율</span>
                <strong>
                  {label} {row.avgRate}%
                </strong>
              </div>
              <div className={`fst-tip-chip ${yoyTone}`}>
                <span>전년 대비</span>
                <strong>
                  {yoy >= 0 ? "+" : ""}
                  {yoy}%p · {row.schoolCount ?? "—"}개교
                </strong>
              </div>
            </div>
          );
        }

        if (mode === "sido" && row) {
          const rate = row.avgRate ?? Number(payload[0]?.value);
          const tone = rate >= 140 ? "green" : rate >= 120 ? "orange" : "red";
          return (
            <div className="fst-tip-stack">
              <div className={`fst-tip-chip ${tone}`}>
                <span>시·도 · 평균 자금확보율</span>
                <strong>
                  {label} {rate}%
                </strong>
              </div>
            </div>
          );
        }

        return (
          <div className="fst-tip-stack">
            <div className="fst-tip-chip orange">
              {label != null && label !== "" ? <span>{String(label)}</span> : null}
              {payload.map((entry) => (
                <strong key={String(entry.dataKey)}>
                  {entry.name}: {String(entry.value ?? "—")}
                </strong>
              ))}
            </div>
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

  const riskFiltered = MOCK_RISK_SCHOOLS.filter((r) =>
    selectedRegion ? r.region === selectedRegion : true,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="fst-filter">
        <div className="fst-filter-label">글로벌 필터</div>
        <div className="fst-filter-row">
          <div className="fst-filter-group">
            <label>표시 연도</label>
            {MOCK_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                className={`fst-pill${year === y ? " active" : ""}`}
                onClick={() => setYear(y)}
              >
                {y}년
              </button>
            ))}
          </div>
          <div className="fst-filter-group">
            <label>설립구분</label>
            <select className="fst-select" defaultValue="사립">
              <option value="">전체</option>
              <option value="국·공립">국·공립</option>
              <option value="사립">사립</option>
            </select>
          </div>
          <div className="fst-filter-group">
            <label>학교구분</label>
            <select className="fst-select" defaultValue="">
              <option value="">전체</option>
              <option value="대학">대학</option>
              <option value="전문대학">전문대학</option>
            </select>
          </div>
          <button type="button" className="fst-btn">
            필터 초기화
          </button>
          <button type="button" className="fst-btn fst-btn-primary">
            도움말
          </button>
        </div>
      </div>

      <div className="fst-kpi-grid">
        <div className="fst-kpi green">
          <div className="fst-kpi-top">
            <div className="fst-kpi-icon">
              <IconSvg d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </div>
            <span className="fst-delta up">↑ +{MOCK_KPIS.yoy}%p</span>
          </div>
          <p className="fst-kpi-label">전국 평균 자금확보율</p>
          <p className="fst-kpi-value">{MOCK_KPIS.avgRate}%</p>
          <p className="fst-kpi-sub">Σ자금합계 ÷ Σ등록금수입 · 높을수록 좋음</p>
        </div>

        <div className="fst-kpi teal">
          <div className="fst-kpi-top">
            <div className="fst-kpi-icon">
              <IconSvg d="M3 3v18h18M7 16l4-4 4 4 6-6" />
            </div>
          </div>
          <p className="fst-kpi-label">중앙값 &amp; IQR</p>
          <p className="fst-kpi-value">{MOCK_KPIS.median}%</p>
          <p className="fst-kpi-sub">IQR (Q3−Q1) = {MOCK_KPIS.iqr}%p</p>
        </div>

        <div className="fst-kpi amber">
          <div className="fst-kpi-top">
            <div className="fst-kpi-icon">
              <IconSvg d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </div>
          </div>
          <p className="fst-kpi-label">위험군 대학 수</p>
          <p className="fst-kpi-value">{MOCK_KPIS.riskBelow100}개교</p>
          <p className="fst-kpi-sub">
            &lt;100% {MOCK_KPIS.riskBelow100Pct}% · &lt;80% {MOCK_KPIS.riskBelow80}개 (
            {MOCK_KPIS.riskBelow80Pct}%)
          </p>
        </div>

        <div className="fst-kpi blue">
          <div className="fst-kpi-top">
            <div className="fst-kpi-icon">
              <IconSvg d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </div>
          </div>
          <p className="fst-kpi-label">분석 대상</p>
          <p className="fst-kpi-value">{MOCK_KPIS.schoolCount}개교</p>
          <p className="fst-kpi-sub">{year}년 · 선택 필터 적용</p>
        </div>
      </div>

      <div className="fst-main-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`fst-main-tab${mainTab === "geo" ? " active" : ""}`}
          onClick={() => setMainTab("geo")}
        >
          지역·권역 격차
        </button>
        <button
          type="button"
          role="tab"
          className={`fst-main-tab${mainTab === "distribution" ? " active" : ""}`}
          onClick={() => setMainTab("distribution")}
        >
          분포·위험군
        </button>
      </div>

      {mainTab === "geo" ? (
        <>
          <div className="fst-chart-grid split">
            <div className="fst-panel">
              <div className="fst-panel-head fst-soft-head">
                <h3 className="fst-panel-title">5대 권역 비교</h3>
                <p className="fst-panel-sub">막대=평균 · 선=전년 대비</p>
              </div>
              <div className="fst-panel-body">
                <div style={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={MOCK_ZONES}
                      barCategoryGap="20%"
                      margin={{ top: 12, right: 16, left: 0, bottom: 48 }}
                    >
                      <defs>
                        <linearGradient id="zoneBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFE066" />
                          <stop offset="45%" stopColor="#FFB020" />
                          <stop offset="100%" stopColor="#F08A24" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="region" tick={AXIS_TICK} interval={0} angle={-28} textAnchor="end" height={48} />
                      <YAxis yAxisId="rate" tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} width={40} />
                      <YAxis yAxisId="yoy" orientation="right" tick={AXIS_TICK} tickFormatter={(v) => `${v}%p`} width={40} />
                      <ChipTooltip mode="zone" />
                      <Bar yAxisId="rate" dataKey="avgRate" name="평균 자금확보율" fill="url(#zoneBar)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                      <Line yAxisId="yoy" type="monotone" dataKey="yoy" name="전년 대비" stroke="#2D7FD6" strokeWidth={3} dot={{ r: 5, fill: "#2D7FD6", stroke: "#fff", strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="fst-panel">
              <div className="fst-panel-head fst-soft-head">
                <h3 className="fst-panel-title">17개 시·도 순위</h3>
                <p className="fst-panel-sub">평균 자금확보율 내림차순</p>
              </div>
              <div className="fst-panel-body">
                <div style={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sidoBarData}
                      margin={{ top: 12, right: 16, left: 0, bottom: 48 }}
                      barCategoryGap="26%"
                    >
                      <defs>
                        <linearGradient id="sidoBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFD24A" />
                          <stop offset="50%" stopColor="#FF9F1A" />
                          <stop offset="100%" stopColor="#E87800" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="region" tick={AXIS_TICK} interval={0} angle={-28} textAnchor="end" height={48} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} width={40} />
                      <ChipTooltip mode="sido" />
                      <Bar dataKey="avgRate" name="평균 자금확보율" fill="url(#sidoBar)" radius={[8, 8, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="fst-panel">
            <div className="fst-panel-head fst-soft-head">
              <h3 className="fst-panel-title">17개 시·도 상세 테이블</h3>
              <p className="fst-panel-sub">행 클릭 → 위험군 목록 지역 필터</p>
            </div>
            <div className="fst-panel-body">
              <div className="fst-table-wrap">
                <table className="fst-table fst-table-equal">
                  <colgroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <col key={i} style={{ width: `${100 / 6}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="center">지역</th>
                      <th className="center">학교 수</th>
                      <th className="center">평균 자금확보율</th>
                      <th className="center">전년 대비</th>
                      <th className="center">중앙값</th>
                      <th className="center">위험군 (&lt;100%)</th>
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
                        <td className="center" style={{ fontWeight: 700 }}>{row.region}</td>
                        <td className="center">
                          <span className="fst-num-cr mono">{row.schoolCount}</span>
                        </td>
                        <td className="center col-metric">
                          <span className="fst-num-cr mono emph">{row.avgRate}%</span>
                        </td>
                        <td className={`center ${row.yoy >= 0 ? "col-a" : "col-b"}`}>
                          <span className={`fst-num-cr mono ${row.yoy >= 0 ? "emph" : "danger"}`}>
                            {row.yoy >= 0 ? "+" : ""}
                            {row.yoy}%p
                          </span>
                        </td>
                        <td className="center col-d">
                          <span className="fst-num-cr mono">{row.median}%</span>
                        </td>
                        <td className="center col-b">
                          <span className="fst-num-cr mono danger">{row.riskCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="fst-panel">
            <div className="fst-panel-head fst-soft-head alert">
              <h3 className="fst-panel-title">위험군 대학 목록</h3>
              <p className="fst-panel-sub">
                {selectedRegion ? `${selectedRegion} · ` : ""}
                자금확보율 100% 미만 · 백만원
              </p>
            </div>
            <div className="fst-panel-body">
              <div className="fst-table-wrap">
                <table className="fst-table fst-table-risk">
                  <thead className="alert">
                    <tr>
                      <th className="center">학교명</th>
                      <th className="center">지역</th>
                      <th className="center">자금합계</th>
                      <th className="center">등록금수입</th>
                      <th className="center">자금확보율</th>
                      <th className="center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#8A9AAB" }}>
                          선택 지역에 위험군 대학이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      riskFiltered.map((row) => (
                        <tr key={row.name}>
                          <td className="fst-school-name">{row.name}</td>
                          <td className="center">{row.region}</td>
                          <td className="center">
                            <span className="fst-num-cr mono">{row.totalFunds.toLocaleString("ko-KR")}</span>
                          </td>
                          <td className="center">
                            <span className="fst-num-cr mono">{row.tuition.toLocaleString("ko-KR")}</span>
                          </td>
                          <td className="center">
                            <span className={`fst-num-cr mono ${row.rate < 80 ? "danger" : "warn"}`}>
                              {row.rate}%
                            </span>
                          </td>
                          <td className="center">
                            <span className={`fst-badge ${row.tier === "고위험" ? "danger" : "warn"}`}>
                              {row.tier}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mainTab === "distribution" ? (
        <>
          <div className="fst-panel">
            <div className="fst-panel-head fst-soft-head">
              <h3 className="fst-panel-title">자금확보율 밀도 분포</h3>
              <p className="fst-panel-sub">중앙값 · 평균 · 100% 기준선</p>
            </div>
            <div className="fst-panel-body">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_DENSITY} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFB020" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#FFB020" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="x" tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} />
                    <YAxis tick={AXIS_TICK} width={36} />
                    <ChipTooltip mode="default" />
                    <Area type="monotone" dataKey="y" name="밀도" stroke="#E87800" strokeWidth={3} fill="url(#densityFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="fst-chip-row">
                <div className="fst-chip green">
                  <span>평균</span>
                  128.4%
                </div>
                <div className="fst-chip blue">
                  <span>중앙값</span>
                  121.6%
                </div>
                <div className="fst-chip orange">
                  <span>기준선</span>
                  100%
                </div>
              </div>
            </div>
          </div>

          <div className="fst-chart-grid two">
            <div className="fst-panel">
              <div className="fst-panel-head fst-soft-head">
                <h3 className="fst-panel-title">위험 단계별 분포</h3>
                <p className="fst-panel-sub">고위험 · 위험 · 양호 · 여유</p>
              </div>
              <div className="fst-panel-body">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_RISK_TIERS} barCategoryGap="22%">
                      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="tier" tick={AXIS_TICK} />
                      <YAxis tick={AXIS_TICK} width={36} />
                      <ChipTooltip mode="default" />
                      <Bar dataKey="count" name="학교 수" radius={[8, 8, 0, 0]} maxBarSize={52}>
                        {MOCK_RISK_TIERS.map((entry) => (
                          <Cell key={entry.tier} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="fst-panel">
              <div className="fst-panel-head fst-soft-head">
                <h3 className="fst-panel-title">히스토그램</h3>
                <p className="fst-panel-sub">구간별 학교 수 · 색상 = 위험 수준</p>
              </div>
              <div className="fst-panel-body">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_HISTOGRAM} barCategoryGap="16%">
                      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bin" tick={AXIS_TICK} interval={0} angle={-24} textAnchor="end" height={48} />
                      <YAxis tick={AXIS_TICK} width={36} />
                      <ChipTooltip mode="default" />
                      <Bar dataKey="count" name="학교 수" radius={[8, 8, 0, 0]} maxBarSize={36}>
                        {MOCK_HISTOGRAM.map((entry) => (
                          <Cell key={entry.bin} fill={entry.fill} />
                        ))}
                      </Bar>
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
