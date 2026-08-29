"use client";

import { useState } from "react";

import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import {
  GlassActionButton,
  GlassHelpButton,
} from "@/components/analysis/GlassHelpButton";
import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export const REPORT_GUIDELINES_LABEL = "보고서생성지침";

type HelpSection = { title: string; body: string };

export function ReportGuidelinesBanner({
  helpSections,
  helpTitle = "보고서 생성 표준",
  helpDescription,
  fullGuidelines,
  fullTitle = "분석연도가 반영된 지침 전문",
}: {
  helpSections: HelpSection[];
  helpTitle?: string;
  helpDescription: string;
  fullGuidelines: string;
  fullTitle?: string;
}) {
  const isAdmin = useCanUploadExcel();
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  async function copyFullGuidelines() {
    try {
      await navigator.clipboard.writeText(fullGuidelines);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="rounded-lg border border-border/70 bg-surface-2/80 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-accent-cyan">
              {REPORT_GUIDELINES_LABEL}
            </h2>
            <GlassHelpButton
              active={helpOpen}
              onClick={() => setHelpOpen((open) => !open)}
              size="sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassActionButton
            tone="green"
            onClick={() => setFullOpen((open) => !open)}
            title={fullTitle}
          >
            {fullOpen ? "닫기" : REPORT_GUIDELINES_LABEL}
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
            eyebrow={REPORT_GUIDELINES_LABEL}
            title={helpTitle}
            description={helpDescription}
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
