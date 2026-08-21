"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Step3CompositeResultsTable } from "@/components/analysis/competitiveness-analysis/Step3CompositeResultsTable";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { DEFAULT_CATEGORY_WEIGHTS } from "@/lib/analysis/competitiveness-indicators";
import type { RunAnalyticsRow } from "@/lib/competitiveness-analysis/run-analytics";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import {
  MOCK_STEP3_JUNIOR_COUNT,
  MOCK_STEP3_JUNIOR_ROWS,
  MOCK_STEP3_UNIVERSITY_COUNT,
  MOCK_STEP3_UNIVERSITY_ROWS,
  type Step3TableMockRow,
} from "./mock-data";

function toAnalyticsRow(row: Step3TableMockRow): RunAnalyticsRow {
  return {
    schoolCodeStd: row.schoolCodeStd,
    rank: row.rank,
    name: row.name,
    type: row.isJuniorCollege ? "전문대" : "4년제",
    province: row.province,
    zone: row.zone,
    enrolledTotal: null,
    scale: null,
    freshRate: null,
    enrolledRate: null,
    dropRate: null,
    fundRate: null,
    freshmanIndex: null,
    enrolledIndex: null,
    dropoutIndex: null,
    fundIndex: null,
    benefitIndex: null,
    tuitionIndex: null,
    propertyIndex: null,
    transferIndex: null,
    studentSectorScore: row.studentScore,
    univFinanceScore: row.univFinanceScore,
    foundationScore: row.foundationScore,
    totalScore: row.totalScore,
    grade: row.grade,
    gradeCapped: row.gradeCapped,
    excludedFromRanking: row.excludedFromRanking,
    absoluteLabels: row.absoluteLabels,
  };
}

export function Step3TableUiMock() {
  const [kind, setKind] = useState<SchoolKindFilter>("university");

  const rows = useMemo(() => {
    const source =
      kind === "university" ? MOCK_STEP3_UNIVERSITY_ROWS : MOCK_STEP3_JUNIOR_ROWS;
    return source.map(toAnalyticsRow);
  }, [kind]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="s3t-banner">
        ✦ 3단계 종합지수 테이블 UI 목업 · Step3CompositeResultsTable 공유 컴포넌트 ·{" "}
        <Link href="/analysis/competitiveness-analysis/run?view=step3">
          현재 3단계 화면
        </Link>
        {" · "}
        <Link href="/analysis/competitiveness-analysis/run?view=analytics">
          통계분석(참고)
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`${FDB_TYPO.legend} text-muted`}>
              2단계 지수에 카테고리·지표 가중치를 반영한 종합지수·순위 (목업
              데이터)
            </p>
            <p className={`mt-1 ${FDB_TYPO.legend} text-accent-cyan`}>
              3단계 마지막 실행: 2026. 8. 10. 오전 5:38:09
            </p>
          </div>
          <button
            type="button"
            className={`h-[30px] shrink-0 rounded-md bg-accent px-3 font-semibold text-white ${FDB_TYPO.toolbarControl}`}
          >
            3단계 실행
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <SchoolKindTabBar
            active={kind}
            universityCount={MOCK_STEP3_UNIVERSITY_COUNT}
            juniorCollegeCount={MOCK_STEP3_JUNIOR_COUNT}
            onChange={setKind}
            ariaLabel="학교종류별 3단계 결과"
          />

          <p className={FDB_TYPO.legend}>
            {kind === "university" ? "대학" : "전문대학"}{" "}
            {rows.length.toLocaleString("ko-KR")}건 표시 (목업 샘플) ·
            종합순위는 동종 내 · 절대지표 해당 대학 포함
          </p>

          <Step3CompositeResultsTable
            rows={rows}
            analysisYear={2026}
            schoolKindFilter={kind}
            categoryWeights={{
              "student-enrollment":
                DEFAULT_CATEGORY_WEIGHTS["student-enrollment"],
              "univ-finance": DEFAULT_CATEGORY_WEIGHTS["univ-finance"],
              "corp-finance": DEFAULT_CATEGORY_WEIGHTS["corp-finance"],
            }}
          />
        </div>
      </section>
    </div>
  );
}
