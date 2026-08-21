"use client";

import { useMemo, useState } from "react";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { RunResultsExportButtons } from "@/components/analysis/competitiveness-analysis/RunResultsExportButtons";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import type { CompetitivenessFinanceGroupId } from "@/lib/analysis/competitiveness-indicators";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import { STEP3_COMPOSITE_HELP_SECTIONS } from "@/lib/competitiveness-analysis/step3-composite-help";
import type { AnalyticsGrade, RunAnalyticsRow } from "@/lib/competitiveness-analysis/run-analytics";
import {
  buildAnalyticsExportAoa,
  fmtScore,
  formatDiagnosticGradeLabel,
  gradeBadgeClass,
  gradeFromCompositeScore,
  gradeScoreClass,
} from "@/lib/competitiveness-analysis/run-analytics";

import "./run-analytics.css";
import "./step3-composite-table.css";

export type Step3CategoryWeights = Pick<
  Record<CompetitivenessFinanceGroupId, number>,
  "student-enrollment" | "univ-finance" | "corp-finance"
>;

function fmtEnrolledCount(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return Math.trunc(v).toLocaleString("ko-KR");
}

function fmtWeightPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? `${rounded}%`
    : `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

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
    <th rowSpan={rowSpan} className="s3t-stack">
      <span>{line1}</span>
      <span>{line2}</span>
    </th>
  );
}

const GRADE_LEGEND: { grade: AnalyticsGrade; color: string; label: string }[] = [
  { grade: "S", color: "#4338ca", label: "S (77+)" },
  { grade: "A", color: "#047857", label: "A (65+)" },
  { grade: "B", color: "#1d4ed8", label: "B (56+)" },
  { grade: "C", color: "#b45309", label: "C (44+)" },
  { grade: "D", color: "#be185d", label: "D (30+)" },
  { grade: "E", color: "#be123c", label: "E (<30)" },
];

function ScoreCell({ value }: { value: number | null | undefined }) {
  if (value == null || Number.isNaN(value)) {
    return <td className="text-right text-muted">—</td>;
  }
  const grade = gradeFromCompositeScore(value);
  return (
    <td className="text-right">
      <span className={gradeScoreClass(grade)}>{fmtScore(value)}</span>
    </td>
  );
}

function Step3HelpPanel({
  lastRunAt,
  onClose,
}: {
  lastRunAt: string | null;
  onClose: () => void;
}) {
  return (
    <section className="s3t-help-panel rounded-xl border border-accent/30 bg-surface-2/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-medium uppercase tracking-wide text-accent ${CHART_TYPO.filterLabel}`}>
            3단계 도움말
          </p>
          <h3 className={`mt-1 ${CHART_TYPO.panelTitle}`}>종합지수 · 등급 기준</h3>
          <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
            2단계 지수에 카테고리·지표 가중치를 반영한 종합지수·순위입니다.
            대학·전문대학은 분리하여 평가하며, 가중치는 이 단계에서만 사용됩니다.
            {lastRunAt ? ` 마지막 실행: ${lastRunAt}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 hover:text-foreground ${CHART_TYPO.toolbarControl} text-muted`}
        >
          닫기
        </button>
      </div>
      <div className="mt-4 max-h-[560px] space-y-0 overflow-y-auto pr-1">
        {STEP3_COMPOSITE_HELP_SECTIONS.map((section) => (
          <section key={section.title}>
            <h4>{section.title}</h4>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}

export function Step3CompositeResultsTable({
  rows,
  analysisYear,
  schoolKindFilter,
  categoryWeights,
  lastRunAt,
}: {
  rows: RunAnalyticsRow[];
  analysisYear: number;
  schoolKindFilter: SchoolKindFilter;
  categoryWeights: Step3CategoryWeights;
  lastRunAt?: string | null;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const displayRows = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(query));
  }, [rows, schoolQuery]);
  const totalWeight =
    (categoryWeights["student-enrollment"] ?? 0) +
    (categoryWeights["univ-finance"] ?? 0) +
    (categoryWeights["corp-finance"] ?? 0);

  return (
    <div className="space-y-3">
      {helpOpen ? (
        <Step3HelpPanel
          lastRunAt={lastRunAt ?? null}
          onClose={() => setHelpOpen(false)}
        />
      ) : null}

      <div className="cra-tactile-card overflow-hidden rounded-3xl">
        <div className="flex h-[56px] flex-wrap items-center justify-end gap-1.5 border-b border-border bg-surface-2/50 px-4">
            <SchoolNameSearchInput
              value={schoolQuery}
              onSearch={setSchoolQuery}
              className="shrink-0"
            />
            <RunResultsExportButtons
              step={3}
              analysisYear={analysisYear}
              schoolKind={schoolKindFilter}
              universityCount={
                schoolKindFilter === "university" ? rows.length : 0
              }
              juniorCollegeCount={
                schoolKindFilter === "junior-college" ? rows.length : 0
              }
              buildRows={() => buildAnalyticsExportAoa(rows)}
            />
            <GlassHelpButton
              active={helpOpen}
              onClick={() => setHelpOpen((open) => !open)}
              size="sm"
            />
        </div>

        <div className="s3t-table-wrap">
          <table className={`s3t-table text-left ${CHART_TYPO.tableBody}`}>
            <thead
              className={`border-b border-border bg-surface-2 ${CHART_TYPO.tableHead}`}
            >
              <tr>
                <StackedHeader line1="종합" line2="순위" rowSpan={2} />
                <th rowSpan={2}>대학명</th>
                <StackedHeader line1="진단" line2="등급" rowSpan={2} />
                <th rowSpan={2} className="s3t-col-tight">
                  지역
                </th>
                <StackedHeader line1="권역" line2="5극·3특" rowSpan={2} />
                <StackedHeader line1="재학생" line2="수" rowSpan={2} />
                <th rowSpan={2} className="s3t-col-tight">
                  규모
                </th>
                <th colSpan={4} className="s3t-group s3t-group-student">
                  학생충원
                  <span className="s3t-col-weight">
                    ({fmtWeightPct(categoryWeights["student-enrollment"] ?? 0)})
                  </span>
                </th>
                <th colSpan={4} className="s3t-group s3t-group-univ">
                  대학재정
                  <span className="s3t-col-weight">
                    ({fmtWeightPct(categoryWeights["univ-finance"] ?? 0)})
                  </span>
                </th>
                <th colSpan={3} className="s3t-group s3t-group-corp">
                  법인재정
                  <span className="s3t-col-weight">
                    ({fmtWeightPct(categoryWeights["corp-finance"] ?? 0)})
                  </span>
                </th>
                <th rowSpan={2} className="text-center">
                  종합점수
                  <span className="s3t-col-weight s3t-col-weight-break">
                    ({fmtWeightPct(totalWeight)})
                  </span>
                </th>
                <StackedHeader line1="절대" line2="지표" rowSpan={2} />
              </tr>
              <tr>
                <th className="s3t-sub s3t-group-student">부문</th>
                <th className="s3t-sub s3t-group-student">
                  <span>신입생</span>
                  <span>충원율</span>
                </th>
                <th className="s3t-sub s3t-group-student">
                  <span>재학생</span>
                  <span>충원율</span>
                </th>
                <th className="s3t-sub s3t-group-student">
                  <span>중도</span>
                  <span>탈락율</span>
                </th>
                <th className="s3t-sub s3t-group-univ">부문</th>
                <th className="s3t-sub s3t-group-univ">
                  <span>자금</span>
                  <span>확보율</span>
                </th>
                <th className="s3t-sub s3t-group-univ">
                  <span>재정지원</span>
                  <span>수혜율</span>
                </th>
                <th className="s3t-sub s3t-group-univ">
                  <span>등록금</span>
                  <span>의존율</span>
                </th>
                <th className="s3t-sub s3t-group-corp">부문</th>
                <th className="s3t-sub s3t-group-corp">
                  <span>수익용</span>
                  <span>재산확보</span>
                </th>
                <th className="s3t-sub s3t-group-corp">
                  <span>법인</span>
                  <span>전입금</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium text-foreground">
              {displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={20}
                    className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}
                  >
                    {schoolQuery.trim()
                      ? "검색 조건에 맞는 학교가 없습니다."
                      : "해당 학교종류 대상대학이 없습니다."}
                  </td>
                </tr>
              ) : null}
              {displayRows.map((row, idx) => (
                <tr
                  key={row.schoolCodeStd}
                  className={`border-b border-border/40 ${
                    idx % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                  data-stripe={idx % 2 === 0 ? "odd" : "even"}
                >
                  <td className="s3t-col-tight font-mono font-bold text-accent">
                    {row.excludedFromRanking || !row.rank ? "—" : row.rank}
                  </td>
                  <td className={FDB_TABLE_COLOR.schoolName}>
                    {row.name}
                  </td>
                  <td className="s3t-col-tight">
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
                  <td className="s3t-col-tight text-muted">{row.province}</td>
                  <td className="s3t-col-tight text-muted">{row.zone}</td>
                  <td className="text-right font-mono tabular-nums text-muted">
                    {fmtEnrolledCount(row.enrolledTotal)}
                  </td>
                  <td className="s3t-col-tight text-muted">
                    {row.scale ?? "—"}
                  </td>
                  <ScoreCell value={row.studentSectorScore} />
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
                      <span className="s3t-absolute">
                        {row.absoluteLabels.join(", ")}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-surface-2/30 px-6 py-4">
          <p className={`${FDB_TYPO.legend} font-medium text-muted`}>
            부문·세부·종합 지수 등급 색상 (2026 baseline 통합 컷오프 · 4년제·전문대 공통)
          </p>
          <div className="s3t-legend">
            {GRADE_LEGEND.map((item) => (
              <span key={item.grade} className="s3t-legend-item">
                <span
                  className="s3t-legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
