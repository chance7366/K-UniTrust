"use client";

import { useState } from "react";

import { MOCK_TABLE_ROWS, MOCK_YEARS } from "./mock-data";

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
      <div className="fsl-card fsl-card-pad">
        <div className="fsl-data-header">
          <div>
            <h3>대학별DB</h3>
            <p>
              {filtered.length.toLocaleString("ko-KR")}개 대학 · DB 연도 {MOCK_YEARS.length}개
            </p>
          </div>
          <div className="fsl-filter-row">
            <span style={{ fontSize: 12, color: "var(--fsl-muted)" }}>표시 연도</span>
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
        </div>

        <div
          className="fsl-filter-row"
          style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--fsl-border)" }}
        >
          <div className="fsl-filter-group">
            <label>설립구분</label>
            <select className="fsl-select" defaultValue="">
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
          <div className="fsl-filter-group">
            <label>학교종류</label>
            <select className="fsl-select" defaultValue="">
              <option value="">전체</option>
              <option value="대학">대학</option>
              <option value="산업대학">산업대학</option>
            </select>
          </div>
          <div className="fsl-filter-group">
            <label>지역</label>
            <select className="fsl-select" defaultValue="">
              <option value="">전체</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="부산">부산</option>
            </select>
          </div>
          <input
            type="search"
            className="fsl-search"
            placeholder="학교명 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginLeft: "auto" }}
          />
        </div>
      </div>

      <div className="fsl-card fsl-card-pad">
        <div className="fsl-unit-label">(단위 : 백만원)</div>
        <div className="fsl-table-wrap">
          <table className="fsl-table fsl-db-table">
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
                  <span style={{ display: "block", fontSize: 10, fontWeight: 400 }}>기준</span>
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
              {filtered.map((row, i) => (
                <tr key={row.code} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td className="sticky-col center mono" style={{ color: "var(--fsl-muted)" }}>
                    {row.code}
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td className="right mono">{fmtMillion(row.schoolFundsCarryover)}</td>
                  <td className="right mono">{fmtMillion(row.schoolFundsEndowment)}</td>
                  <td className="right mono">{fmtMillion(row.industryCarryover)}</td>
                  <td className="right mono">{fmtMillion(row.industryEndowment)}</td>
                  <td className="right mono">{fmtMillion(row.totalFunds)}</td>
                  <td className="right mono">{fmtMillion(row.tuitionRevenue)}</td>
                  <td
                    className={`right mono rate-col${row.fundSecureRate < 100 ? " danger" : ""}`}
                    style={row.fundSecureRate < 100 ? { color: "#e11d48" } : undefined}
                  >
                    {fmtPercent(row.fundSecureRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fsl-footnote">
          {year}년 공시 기준 · 목업 샘플 데이터 · 실제 DB와 무관
        </p>
      </div>
    </div>
  );
}
