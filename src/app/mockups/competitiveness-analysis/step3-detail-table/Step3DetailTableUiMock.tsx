"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GlassActionButton, GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { DEFAULT_CATEGORY_WEIGHTS } from "@/lib/analysis/competitiveness-indicators";
import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/run-analytics";
import {
  fmtScore,
  formatDiagnosticGradeLabel,
  gradeBadgeClass,
  gradeFromCompositeScore,
  gradeScoreClass,
} from "@/lib/competitiveness-analysis/run-analytics";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import {
  MOCK_STEP3_DETAIL_JUNIOR_ROWS,
  MOCK_STEP3_DETAIL_UNIVERSITY_ROWS,
  type Step3DetailMockRow,
} from "./mock-data";

import "@/components/analysis/competitiveness-analysis/run-analytics.css";
import "@/components/analysis/competitiveness-analysis/run-export-buttons.css";
import "@/components/analysis/competitiveness-analysis/step3-composite-table.css";
import "./step3-detail-table-mock.css";

const GRADE_LEGEND: { grade: AnalyticsGrade; color: string; label: string }[] = [
  { grade: "S", color: "#4338ca", label: "S (77+)" },
  { grade: "A", color: "#047857", label: "A (65+)" },
  { grade: "B", color: "#1d4ed8", label: "B (56+)" },
  { grade: "C", color: "#b45309", label: "C (44+)" },
  { grade: "D", color: "#be185d", label: "D (30+)" },
  { grade: "E", color: "#be123c", label: "E (<30)" },
];

function StackedHeader({
  line1,
  line2,
  rowSpan,
}: {
  line1: string;
  line2: string;
  rowSpan?: number;
}) {
  return (
    <th rowSpan={rowSpan} className="s3d-stack">
      <span>{line1}</span>
      <span>{line2}</span>
    </th>
  );
}

function ScoreCell({ value }: { value: number }) {
  const grade = gradeFromCompositeScore(value);
  return (
    <td className="text-right">
      <span className={gradeScoreClass(grade)}>{fmtScore(value)}</span>
    </td>
  );
}

export function Step3DetailTableUiMock() {
  const [kind, setKind] = useState<SchoolKindFilter>("junior-college");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const sourceRows =
    kind === "university"
      ? MOCK_STEP3_DETAIL_UNIVERSITY_ROWS
      : MOCK_STEP3_DETAIL_JUNIOR_ROWS;

  const rows = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) return sourceRows;
    return sourceRows.filter((row) => row.name.toLowerCase().includes(query));
  }, [schoolQuery, sourceRows]);

  const studentWeight = DEFAULT_CATEGORY_WEIGHTS["student-enrollment"];
  const univWeight = DEFAULT_CATEGORY_WEIGHTS["univ-finance"];
  const corpWeight = DEFAULT_CATEGORY_WEIGHTS["corp-finance"];

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="s3d-banner">
        ✦ 분석실행 3단계 표 변경 목업 · 실제 화면에는 아직 적용하지 않음 ·{" "}
        <Link href="/analysis/competitiveness-analysis/run?view=step3&kind=junior-college">
          현재 3단계 화면
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`${FDB_TYPO.legend} text-muted`}>
            2단계 지수에 카테고리·지표 가중치를 반영한 종합지수·순위입니다. 대학·전문대학은
            분리하여 평가합니다. 가중치는 이 단계에서만 사용됩니다.
            <span className="text-accent-cyan">
              {" "}
              [3단계 마지막 실행: 2026. 8. 16. 오전 5:20:00]
            </span>
          </p>
          <GlassActionButton tone="orange" onClick={() => undefined}>
            3단계 실행
          </GlassActionButton>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <SchoolKindTabBar
              active={kind}
              universityCount={150}
              juniorCollegeCount={123}
              onChange={setKind}
              ariaLabel="학교종류별 3단계 결과"
            />
          </div>

          {helpOpen ? (
            <section className="rounded-xl border border-accent/30 bg-surface-2/50 p-5">
              <p className={`font-medium text-accent ${CHART_TYPO.filterLabel}`}>
                목업에서 확인하는 변경점
              </p>
              <ul className={`mt-2 list-disc space-y-1 pl-5 ${FDB_TYPO.legend}`}>
                <li>종합순위 헤더를 2줄로 줄여 열 너비를 최소화</li>
                <li>진단등급 헤더를 2줄로 줄이고, 대학명 바로 오른쪽으로 이동</li>
                <li>
                  학생충원·대학재정·법인재정 부문 점수 옆에 세부지표 지수(2단계
                  백분위)를 함께 표시
                </li>
              </ul>
            </section>
          ) : null}

          <div className="cra-tactile-card overflow-hidden rounded-3xl">
            <div className="flex flex-col justify-between gap-4 border-b border-border bg-surface-2/50 p-6 md:flex-row md:items-center">
              <h3 className={CHART_TYPO.panelTitle}>종합지수 · 대학별 결과</h3>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <SchoolNameSearchInput
                  value={schoolQuery}
                  onSearch={setSchoolQuery}
                  className="shrink-0"
                />
                <button type="button" className={`run-export-btn ${FDB_TYPO.toolbarControl}`}>
                  CSV
                </button>
                <button type="button" className={`run-export-btn ${FDB_TYPO.toolbarControl}`}>
                  Excel
                </button>
                <GlassHelpButton
                  active={helpOpen}
                  onClick={() => setHelpOpen((open) => !open)}
                  size="sm"
                />
              </div>
            </div>

            <div className="s3d-table-wrap">
              <table className={`s3d-table text-left ${CHART_TYPO.tableBody}`}>
                <thead
                  className={`border-b border-border bg-surface-2 ${CHART_TYPO.tableHead}`}
                >
                  <tr>
                    <StackedHeader line1="종합" line2="순위" rowSpan={2} />
                    <th rowSpan={2}>대학명</th>
                    <StackedHeader line1="진단" line2="등급" rowSpan={2} />
                    <th rowSpan={2} className="s3d-cell-tight">
                      지역
                    </th>
                    <th rowSpan={2} className="s3d-cell-tight">
                      권역
                    </th>
                    <StackedHeader line1="재학생" line2="수" rowSpan={2} />
                    <th rowSpan={2} className="s3d-cell-tight">
                      규모
                    </th>
                    <th colSpan={4} className="s3d-group s3d-group-student">
                      학생충원
                      <span className="s3d-weight">({studentWeight}%)</span>
                    </th>
                    <th colSpan={4} className="s3d-group s3d-group-univ">
                      대학재정
                      <span className="s3d-weight">({univWeight}%)</span>
                    </th>
                    <th colSpan={3} className="s3d-group s3d-group-corp">
                      법인재정
                      <span className="s3d-weight">({corpWeight}%)</span>
                    </th>
                    <th rowSpan={2} className="text-center">
                      종합점수
                      <span className="s3d-weight">(100%)</span>
                    </th>
                    <StackedHeader line1="절대" line2="지표" rowSpan={2} />
                  </tr>
                  <tr>
                    <th className="s3d-sub s3d-group-student">부문</th>
                    <th className="s3d-sub s3d-group-student">
                      <span>신입생</span>
                      <span>충원율</span>
                    </th>
                    <th className="s3d-sub s3d-group-student">
                      <span>재학생</span>
                      <span>충원율</span>
                    </th>
                    <th className="s3d-sub s3d-group-student">
                      <span>중도</span>
                      <span>탈락율</span>
                    </th>
                    <th className="s3d-sub s3d-group-univ">부문</th>
                    <th className="s3d-sub s3d-group-univ">
                      <span>자금</span>
                      <span>확보율</span>
                    </th>
                    <th className="s3d-sub s3d-group-univ">
                      <span>재정지원</span>
                      <span>수혜율</span>
                    </th>
                    <th className="s3d-sub s3d-group-univ">
                      <span>등록금</span>
                      <span>의존율</span>
                    </th>
                    <th className="s3d-sub s3d-group-corp">부문</th>
                    <th className="s3d-sub s3d-group-corp">
                      <span>수익용</span>
                      <span>재산확보</span>
                    </th>
                    <th className="s3d-sub s3d-group-corp">
                      <span>법인</span>
                      <span>전입금</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-foreground">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={20}
                        className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}
                      >
                        검색 조건에 맞는 학교가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                  {rows.map((row, idx) => (
                    <DetailRow key={row.schoolCodeStd} row={row} idx={idx} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border bg-surface-2/30 px-6 py-4">
              <p className={`${FDB_TYPO.legend} font-medium text-muted`}>
                부문·세부·종합 지수는 2026 baseline 통합 컷오프 색상 · 세부열은 2단계
                지수(목업)
              </p>
              <div className="s3d-legend">
                {GRADE_LEGEND.map((item) => (
                  <span key={item.grade} className="s3d-legend-item">
                    <span
                      className="s3d-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ row, idx }: { row: Step3DetailMockRow; idx: number }) {
  return (
    <tr
      className={`border-b border-border/40 ${
        idx % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
      }`}
    >
      <td className="s3d-cell-tight font-mono font-bold text-accent">
        {row.excludedFromRanking || !row.rank ? "—" : row.rank}
      </td>
      <td className={FDB_TABLE_COLOR.schoolName}>{row.name}</td>
      <td className="s3d-cell-tight">
        <span
          className={gradeBadgeClass(row.grade)}
          title={
            row.gradeCapped
              ? "고위험(동종 하위 7%) 지표 2개 이상 — 최약 고리 규칙 적용"
              : undefined
          }
        >
          {formatDiagnosticGradeLabel(
            row.grade,
            row.gradeCapped,
            row.excludedFromRanking,
          )}
        </span>
      </td>
      <td className="s3d-cell-tight text-muted">{row.province}</td>
      <td className="s3d-cell-tight text-muted">{row.zone}</td>
      <td className="text-right font-mono tabular-nums text-muted">
        {row.enrolledTotal.toLocaleString("ko-KR")}
      </td>
      <td className="s3d-cell-tight text-muted">{row.scale}</td>
      <ScoreCell value={row.studentScore} />
      <ScoreCell value={row.freshmanIndex} />
      <ScoreCell value={row.enrolledIndex} />
      <ScoreCell value={row.dropoutIndex} />
      <ScoreCell value={row.univFinanceScore} />
      <ScoreCell value={row.fundIndex} />
      <ScoreCell value={row.benefitIndex} />
      <ScoreCell value={row.tuitionIndex} />
      <ScoreCell value={row.foundationScore} />
      <ScoreCell value={row.propertyIndex} />
      <ScoreCell value={row.transferIndex} />
      <td className="text-right">
        <span
          className={gradeScoreClass(
            row.excludedFromRanking
              ? gradeFromCompositeScore(row.totalScore)
              : row.grade,
          )}
        >
          {fmtScore(row.totalScore)}
        </span>
      </td>
      <td className="text-center">
        {row.absoluteLabels.length ? (
          <span className="s3d-absolute">{row.absoluteLabels.join(", ")}</span>
        ) : null}
      </td>
    </tr>
  );
}
