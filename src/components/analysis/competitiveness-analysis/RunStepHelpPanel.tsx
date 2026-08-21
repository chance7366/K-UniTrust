"use client";

import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import type { StepHelpSection } from "@/lib/competitiveness-analysis/step-help";

export function RunStepHelpPanel({
  kicker,
  title,
  intro,
  sections,
  onClose,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: StepHelpSection[];
  onClose: () => void;
}) {
  return (
    <section className="rounded-xl border border-accent/30 bg-surface-2/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`font-medium uppercase tracking-wide text-accent ${CHART_TYPO.filterLabel}`}
          >
            {kicker}
          </p>
          <h3 className={`mt-1 ${CHART_TYPO.panelTitle}`}>{title}</h3>
          <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>{intro}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 hover:text-foreground ${CHART_TYPO.toolbarControl} text-muted`}
        >
          닫기
        </button>
      </div>
      <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section
            key={section.title}
            className="border-t border-border pt-4 first:border-t-0 first:pt-0"
          >
            <h4 className="text-[13px] font-bold text-foreground">
              {section.title}
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </section>
  );
}
