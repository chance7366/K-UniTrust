"use client";

import { useMemo, useState } from "react";

import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import {
  GlassActionButton,
  GlassHelpButton,
} from "@/components/analysis/GlassHelpButton";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildUniversityReportGuidelines } from "@/lib/competitiveness-analysis/university-report/build-university-report-guidelines";
import {
  UNIVERSITY_REPORT_HELP_SUB,
  UNIVERSITY_REPORT_HELP_TITLE,
  universityReportHelp,
} from "@/lib/competitiveness-analysis/university-report/university-report-help";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

export function UniversityReportGuidelinesPanel({
  analysisYear,
  settings,
  hasRunResults,
}: {
  analysisYear: number;
  settings: CompetitivenessSettings;
  hasRunResults: boolean;
}) {
  const isAdmin = useCanUploadExcel();

  if (!isAdmin) return null;

  const [helpOpen, setHelpOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const fullGuidelines = useMemo(
    () => buildUniversityReportGuidelines(analysisYear, settings),
    [analysisYear, settings],
  );

  const helpSections = useMemo(
    () => universityReportHelp({ analysisYear, isAdmin }),
    [analysisYear, isAdmin],
  );

  async function copyFullGuidelines() {
    try {
      await navigator.clipboard.writeText(fullGuidelines);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-lg border border-border/70 bg-surface-2/80 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-accent-cyan">
              개별대학 보고서 생성 지침
            </h2>
            <GlassHelpButton
              active={helpOpen}
              onClick={() => setHelpOpen((open) => !open)}
              size="sm"
            />
          </div>
          <p className={`${FDB_TYPO.legend} text-muted`}>
            {isAdmin
              ? "관리자: 선택 대학의 보고서 생성·재생성. 모든 대학 동일 목차·동일 서술 규칙."
              : "사용자: 생성된 보고서 열람만 가능합니다."}
            {!hasRunResults
              ? " · 분석실행(3단계) 완료 후 생성할 수 있습니다."
              : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassActionButton
            tone="green"
            onClick={() => setFullOpen((open) => !open)}
            title="분석연도·기본설정이 반영된 지침 전문"
          >
            {fullOpen ? "지침 전문 닫기" : "지침 전문 보기"}
          </GlassActionButton>
          {fullOpen ? (
            <GlassActionButton tone="blue" onClick={copyFullGuidelines}>
              지침 복사
            </GlassActionButton>
          ) : null}
        </div>
      </div>

      {helpOpen ? (
        <div className="mt-3">
          <HelpGuidePanel
            sections={helpSections}
            onClose={() => setHelpOpen(false)}
            eyebrow={UNIVERSITY_REPORT_HELP_TITLE}
            title="보고서 생성 표준"
            description={UNIVERSITY_REPORT_HELP_SUB}
          />
        </div>
      ) : null}

      {fullOpen ? (
        <div className="mt-3">
          <pre
            className={`max-h-[480px] overflow-auto rounded-lg border border-border/60 bg-surface p-3 whitespace-pre-wrap ${FDB_TYPO.legend}`}
          >
            {fullGuidelines}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
