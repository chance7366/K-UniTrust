"use client";

import { useState } from "react";

import {
  MOCK_TABLE_ROWS,
  MOCK_YEARS,
  rateStatus,
  rateStatusLabel,
} from "./mock-data";

function fmtMillion(thousandWon: number): string {
  return Math.round(thousandWon / 1000).toLocaleString("ko-KR");
}

function fmtPercent(n: number): string {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function DataDbSection() {
  const [year, setYear] = useState(2024);
  const [search, setSearch] = useState("");

  const filtered = MOCK_TABLE_ROWS.filter((row) =>
    search.trim() === "" ? true : row.name.includes(search.trim()),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="fst-card" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>대학별DB</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fst-muted)" }}>
              {filtered.length.toLocaleString("ko-KR")}개 대학 · DB 연도 {MOCK_YEARS.length}개
            </p>
          </div>
          <div className="fst-filter-row">
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fst-muted)" }}>표시 연도</span>
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
        </div>

        <div
          className="fst-filter-row"
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #dce8e1",
          }}
        >
          <div className="fst-filter-group">
            <label>설립구분</label>
            <select className="fst-select" defaultValue="">
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
          <div className="fst-filter-group">
            <label>학교종류</label>
            <select className="fst-select" defaultValue="">
              <option value="">전체</option>
              <option value="대학">대학</option>
              <option value="산업대학">산업대학</option>
            </select>
          </div>
          <div className="fst-filter-group">
            <label>지역</label>
            <select className="fst-select" defaultValue="">
              <option value="">전체</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="부산">부산</option>
            </select>
          </div>
          <button type="button" className="fst-btn fst-btn-primary">
            엑셀 업로드
          </button>
          <input
            type="search"
            className="fst-search"
            placeholder="학교명 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginLeft: "auto" }}
          />
        </div>
      </div>

      <div className="fst-panel">
        <div className="fst-panel-head fst-soft-head">
          <h3 className="fst-panel-title">대학별 자금확보율 DB</h3>
          <p className="fst-panel-sub">{year}년 공시 · 목업 샘플</p>
        </div>
        <div className="fst-panel-body">
          <div className="fst-unit">(단위 : 백만원)</div>
          <div className="fst-table-wrap">
            <table className="fst-table fst-db-table">
              <colgroup>
                <col className="col-code" />
                <col className="col-name" />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className="sticky-col center">
                    학교코드
                  </th>
                  <th rowSpan={2}>학교명</th>
                  <th colSpan={2} className="center">
                    교비
                  </th>
                  <th colSpan={2} className="center">
                    산단
                  </th>
                  <th rowSpan={2} className="center">
                    자금합계
                  </th>
                  <th rowSpan={2} className="center">
                    등록금수입
                  </th>
                  <th rowSpan={2} className="center">
                    자금확보율
                  </th>
                  <th rowSpan={2} className="center">
                    상태
                  </th>
                </tr>
                <tr>
                  <th className="center">이월자금</th>
                  <th className="center">기금</th>
                  <th className="center">이월자금</th>
                  <th className="center">기금</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = rateStatus(row.fundSecureRate);
                  return (
                    <tr key={row.code}>
                      <td className="sticky-col center mono" style={{ color: "var(--fst-muted)" }}>
                        {row.code}
                      </td>
                      <td className="fst-school-name">{row.name}</td>
                      <td className="right mono col-a">{fmtMillion(row.schoolFundsCarryover)}</td>
                      <td className="right mono col-a">{fmtMillion(row.schoolFundsEndowment)}</td>
                      <td className="right mono col-b">{fmtMillion(row.industryCarryover)}</td>
                      <td className="right mono col-b">{fmtMillion(row.industryEndowment)}</td>
                      <td className="right mono col-metric">{fmtMillion(row.totalFunds)}</td>
                      <td className="right mono col-d">{fmtMillion(row.tuitionRevenue)}</td>
                      <td
                        className={`right mono ${status === "ok" ? "emph" : status === "warn" ? "warn" : "danger"}`}
                        style={{ fontWeight: 800 }}
                      >
                        {fmtPercent(row.fundSecureRate)}
                      </td>
                      <td className="center">
                        <span className={`fst-badge ${status}`}>
                          {rateStatusLabel(row.fundSecureRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="fst-footnote">
            교비(파랑 틴트) · 산단(주황 틴트) · 자금합계(초록) · 등록금(슬레이트) · zebra 행 · 상태 pill · 폰트 11px+
          </p>
        </div>
      </div>
    </div>
  );
}
