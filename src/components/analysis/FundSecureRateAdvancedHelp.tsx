"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import type { HelpSection } from "@/lib/analysis/fund-secure-rate-advanced-help";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";

export function HelpTip({
  help,
  className = "",
  wide = false,
}: {
  help: HelpSection;
  className?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[11px] font-semibold text-muted transition-colors hover:border-accent/60 hover:text-accent"
        aria-label={`${help.title} 도움말`}
        aria-expanded={open}
      >
        ?
      </button>
      {open ? (
        <div
          role="tooltip"
          className={`absolute left-0 top-full z-40 mt-1.5 rounded-lg border border-[#b8e6cf] bg-[#eef8f2] p-3 text-left shadow-lg ${
            wide
              ? "w-80 max-h-[min(70vh,28rem)] max-w-[min(24rem,calc(100vw-2rem))] overflow-y-auto sm:w-96"
              : "w-72 max-w-[min(18rem,calc(100vw-2rem))]"
          }`}
        >
          <div className="text-[13px] font-semibold text-[#1a5c3a]">{help.title}</div>
          <div className="mt-1.5 text-xs leading-relaxed text-[#3d5c4e]">{help.body}</div>
        </div>
      ) : null}
    </span>
  );
}

export function HelpGuidePanel({
  sections,
  onClose,
  eyebrow = "통계분석 도움말",
  title = "지표·차트 설명",
  description,
  children,
}: {
  sections: HelpSection[];
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-accent/30 bg-surface-2/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-medium uppercase tracking-wide text-accent ${CHART_TYPO.filterLabel}`}>
            {eyebrow}
          </p>
          <h3 className={`mt-1 ${CHART_TYPO.panelTitle}`}>{title}</h3>
          <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
            {description ?? (
              <>
                각 KPI 카드와 차트 제목 옆{" "}
                <span className="text-foreground">?</span> 버튼에서도 동일 설명을
                볼 수 있습니다.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 hover:text-foreground ${CHART_TYPO.toolbarControl} text-muted` }
        >
          닫기
        </button>
      </div>
      <div className="mt-4 max-h-[min(72vh,720px)] space-y-4 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-border/60 bg-surface px-3 py-2.5"
          >
            <p className={`font-medium text-foreground ${CHART_TYPO.toolbarControl}`}>{section.title}</p>
            <p className={`mt-1 leading-relaxed ${CHART_TYPO.panelMeta}`}>{section.body}</p>
          </div>
        ))}
        {children}
      </div>
    </section>
  );
}

export function HelpLabel({
  label,
  help,
}: {
  label: string;
  help: HelpSection;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <HelpTip help={help} />
    </span>
  );
}

export function PanelTitle({
  title,
  subtitle,
  help,
}: {
  title: string;
  subtitle?: string;
  help?: HelpSection;
}) {
  return (
    <div className="mb-4">
      <h2 className={`inline-flex items-center gap-2 ${CHART_TYPO.panelTitle}`}>
        {title}
        {help ? <HelpTip help={help} /> : null}
      </h2>
      {subtitle ? (
        <p className={`mt-0.5 ${CHART_TYPO.panelMeta}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}

export function PanelWithHelp({
  title,
  subtitle,
  help,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  help?: HelpSection;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-5${className ? ` ${className}` : ""}`}
    >
      <PanelTitle title={title} subtitle={subtitle} help={help} />
      {children}
    </section>
  );
}
