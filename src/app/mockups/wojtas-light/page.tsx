"use client";

import Link from "next/link";
import { useState } from "react";

const KPI = [
  { label: "전국 평균 자금확보율", value: "142.3%", delta: "+2.1%p", up: true },
  { label: "국·공립 평균", value: "168.7%", delta: "+0.8%p", up: true },
  { label: "사립 평균", value: "128.4%", delta: "-0.5%p", up: false },
  { label: "분석 대학 수", value: "312", delta: "2024 공시", up: true },
];

const CHART = [
  { year: "2020", h: 62 },
  { year: "2021", h: 68 },
  { year: "2022", h: 71 },
  { year: "2023", h: 78 },
  { year: "2024", h: 82 },
];

const REGIONS = [
  { name: "서울", meta: "42개교 · 평균 156.2%", badge: "156.2%", tone: "green" as const },
  { name: "경기", meta: "38개교 · 평균 138.5%", badge: "138.5%", tone: "blue" as const },
  { name: "부산", meta: "18개교 · 평균 131.0%", badge: "131.0%", tone: "green" as const },
  { name: "대구", meta: "14개교 · 평균 125.4%", badge: "125.4%", tone: "amber" as const },
  { name: "광주", meta: "11개교 · 평균 148.9%", badge: "148.9%", tone: "green" as const },
];

const TABLE = [
  {
    code: "0000019",
    name: "서울대학교",
    region: "서울",
    estb: "국·공립",
    rate: "185.2",
    funds: "12,450,320",
  },
  {
    code: "0002748",
    name: "가야대학교(김해)",
    region: "경남",
    estb: "사립",
    rate: "118.6",
    funds: "892,140",
  },
  {
    code: "0000123",
    name: "연세대학교",
    region: "서울",
    estb: "사립",
    rate: "152.8",
    funds: "4,231,880",
  },
  {
    code: "0000088",
    name: "부산대학교",
    region: "부산",
    estb: "국·공립",
    rate: "171.3",
    funds: "2,105,670",
  },
  {
    code: "0000312",
    name: "전남대학교",
    region: "광주",
    estb: "국·공립",
    rate: "163.5",
    funds: "1,876,420",
  },
];

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17V11" />
      <path d="M12 17V7" />
      <path d="M16 17v-4" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M9 10v9" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 19h16" />
    </svg>
  );
}

export default function WojtasLightMockupPage() {
  const [chartRange, setChartRange] = useState<"5y" | "region">("5y");

  return (
    <>
      <div className="wl-banner">
        디자인 목업 · Wojtaś Light (Farm24 톤) · 실제 앱 미적용
        <Link href="/analysis/finance-analysis?tab=fund-secure-rate" className="wl-btn wl-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>
          현재 앱 보기
        </Link>
      </div>

      <div className="wl-shell">
        <nav className="wl-rail" aria-label="주요 메뉴">
          <div className="wl-rail-logo" title="K-UniTrust">
            KU
          </div>
          <button type="button" className="wl-rail-btn" aria-label="대시보드">
            <IconGrid />
          </button>
          <button type="button" className="wl-rail-btn active" aria-label="재정분석">
            <IconChart />
          </button>
          <button type="button" className="wl-rail-btn" aria-label="대학지도">
            <IconMap />
          </button>
          <button type="button" className="wl-rail-btn" aria-label="데이터">
            <IconTable />
          </button>
        </nav>

        <aside className="wl-sidebar" aria-label="대학재정분석">
          <div className="wl-sidebar-title">대학재정분석</div>
          <button type="button" className="wl-nav-item">
            <span className="wl-nav-dot" />
            학교코드
          </button>
          <button type="button" className="wl-nav-item">
            <span className="wl-nav-dot" />
            신입생충원율
          </button>
          <button type="button" className="wl-nav-item">
            <span className="wl-nav-dot" />
            재학생충원율
          </button>
          <button type="button" className="wl-nav-item active">
            <span className="wl-nav-dot" />
            자금확보율
          </button>
          <button type="button" className="wl-nav-item">
            <span className="wl-nav-dot" />
            등록금의존율
          </button>
          <button type="button" className="wl-nav-item">
            <span className="wl-nav-dot" />
            출신지역
          </button>
        </aside>

        <div className="wl-main">
          <header className="wl-header">
            <div className="wl-header-left">
              <h1>자금확보율</h1>
              <p>2024 공시 · 전국 대학 재정 지표 분석</p>
            </div>
            <div className="wl-header-actions">
              <label className="wl-search">
                <IconSearch />
                학교명 검색…
              </label>
              <select className="wl-select" defaultValue="2024" aria-label="조회 연도">
                <option value="2024">2024년</option>
                <option value="2023">2023년</option>
                <option value="2022">2022년</option>
              </select>
              <button type="button" className="wl-btn wl-btn-secondary">
                <IconDownload />
                내보내기
              </button>
              <button type="button" className="wl-btn wl-btn-primary">
                엑셀 업로드
              </button>
              <div className="wl-avatar" title="사용자">
                YK
              </div>
            </div>
          </header>

          <main className="wl-content">
            <div className="wl-kpi-row">
              {KPI.map((k) => (
                <article key={k.label} className="wl-kpi">
                  <div className="wl-kpi-label">{k.label}</div>
                  <div className="wl-kpi-value">{k.value}</div>
                  <div className={`wl-kpi-delta ${k.up ? "up" : "down"}`}>
                    {k.delta}
                  </div>
                </article>
              ))}
            </div>

            <div className="wl-grid-2">
              <section className="wl-card">
                <div className="wl-card-head">
                  <h2>연도별 추이</h2>
                  <div className="wl-chips">
                    <button
                      type="button"
                      className={`wl-chip ${chartRange === "5y" ? "active" : ""}`}
                      onClick={() => setChartRange("5y")}
                    >
                      5개년
                    </button>
                    <button
                      type="button"
                      className={`wl-chip ${chartRange === "region" ? "active" : ""}`}
                      onClick={() => setChartRange("region")}
                    >
                      지역별
                    </button>
                  </div>
                </div>
                <div className="wl-card-body">
                  <div className="wl-chart-area" role="img" aria-label="자금확보율 5개년 막대 차트 목업">
                    {CHART.map((b) => (
                      <div key={b.year} className="wl-bar-wrap">
                        <div className="wl-bar" style={{ height: `${b.h}%` }} />
                        <span className="wl-bar-label">{b.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="wl-card">
                <div className="wl-card-head">
                  <h2>시·도별 현황</h2>
                  <button type="button" className="wl-btn wl-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    전체 보기
                  </button>
                </div>
                <div className="wl-card-body">
                  <ul className="wl-region-list">
                    {REGIONS.map((r) => (
                      <li key={r.name}>
                        <div className="wl-region-item">
                          <div>
                            <div className="wl-region-name">{r.name}</div>
                            <div className="wl-region-meta">{r.meta}</div>
                          </div>
                          <span className={`wl-badge wl-badge-${r.tone}`}>{r.badge}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            <section className="wl-card">
              <div className="wl-card-head">
                <h2>학교별 상세</h2>
                <div className="wl-chips">
                  <button type="button" className="wl-chip active">
                    전체
                  </button>
                  <button type="button" className="wl-chip">
                    국·공립
                  </button>
                  <button type="button" className="wl-chip">
                    사립
                  </button>
                </div>
              </div>
              <div className="wl-table-wrap">
                <table className="wl-table">
                  <thead>
                    <tr>
                      <th>학교코드</th>
                      <th>학교명</th>
                      <th>지역</th>
                      <th>설립</th>
                      <th>자금확보율(%)</th>
                      <th>총자금(천원)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE.map((row) => (
                      <tr key={row.code}>
                        <td className="mono">{row.code}</td>
                        <td>{row.name}</td>
                        <td>{row.region}</td>
                        <td>{row.estb}</td>
                        <td className="mono">{row.rate}</td>
                        <td className="mono">{row.funds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
