import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/diagnostic-grade";
import { gradeFromCompositeScore } from "@/lib/competitiveness-analysis/diagnostic-grade";
import {
  MOCK_STEP3_JUNIOR_ROWS,
  MOCK_STEP3_UNIVERSITY_ROWS,
  type Step3TableMockRow,
} from "@/app/mockups/competitiveness-analysis/step3-table/mock-data";

export type Step3DetailMockRow = Step3TableMockRow & {
  enrolledTotal: number;
  scale: "대규모" | "중규모" | "소규모";
  freshmanIndex: number;
  enrolledIndex: number;
  dropoutIndex: number;
  fundIndex: number;
  benefitIndex: number;
  tuitionIndex: number;
  propertyIndex: number;
  transferIndex: number;
};

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

function withDetailScores(
  row: Step3TableMockRow,
  enrolledTotal: number,
  scale: Step3DetailMockRow["scale"],
): Step3DetailMockRow {
  return {
    ...row,
    enrolledTotal,
    scale,
    freshmanIndex: clampScore(row.studentScore + 3.2),
    enrolledIndex: clampScore(row.studentScore - 1.4),
    dropoutIndex: clampScore(row.studentScore - 4.8),
    fundIndex: clampScore(row.univFinanceScore + 2.1),
    benefitIndex: clampScore(row.univFinanceScore - 3.6),
    tuitionIndex: clampScore(row.univFinanceScore + 1.2),
    propertyIndex: clampScore(row.foundationScore + 4.4),
    transferIndex: clampScore(row.foundationScore - 2.7),
  };
}

export const MOCK_STEP3_DETAIL_UNIVERSITY_ROWS: Step3DetailMockRow[] =
  MOCK_STEP3_UNIVERSITY_ROWS.map((row, idx) =>
    withDetailScores(
      row,
      [18420, 9620, 8410, 22150, 19880, 7340, 2180, 890, 640][idx] ?? 5200,
      idx < 2 ? "대규모" : idx < 6 ? "중규모" : "소규모",
    ),
  );

export const MOCK_STEP3_DETAIL_JUNIOR_ROWS: Step3DetailMockRow[] =
  MOCK_STEP3_JUNIOR_ROWS.map((row, idx) =>
    withDetailScores(
      {
        ...row,
        grade: gradeFromCompositeScore(row.totalScore) as AnalyticsGrade,
      },
      [4120, 3680, 2910, 2540, 2210, 1980, 1760, 1540, 1320, 1180, 960, 820][
        idx
      ] ?? 1500,
      idx < 3 ? "대규모" : idx < 8 ? "중규모" : "소규모",
    ),
  );
