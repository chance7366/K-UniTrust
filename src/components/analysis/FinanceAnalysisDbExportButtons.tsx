import { Download } from "lucide-react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./glass-help-button.css";

type FinanceAnalysisDbExportButtonsProps = {
  exportBasePath: string;
  hasConsolidated?: boolean;
  campusRowCount?: number;
  consolidatedRowCount?: number;
};

function exportHref(basePath: string, variant?: "campus" | "consolidated") {
  if (!variant) return basePath;
  const url = new URL(basePath, "http://local");
  url.searchParams.set("variant", variant);
  return `${url.pathname}${url.search}`;
}

function GlassDbDown({
  href,
  disabled,
  children,
}: {
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const inner = (
    <span className="glass-db-down-btn-core">
      <Download size={12} strokeWidth={2.6} aria-hidden />
      {children}
    </span>
  );

  if (disabled || !href) {
    return (
      <button type="button" disabled className="glass-db-down-btn">
        {inner}
      </button>
    );
  }

  return (
    <a href={href} download className="glass-db-down-btn">
      {inner}
    </a>
  );
}

export function FinanceAnalysisDbExportButtons({
  exportBasePath,
  hasConsolidated = false,
  campusRowCount = 0,
  consolidatedRowCount = 0,
}: FinanceAnalysisDbExportButtonsProps) {
  const campusDisabled = campusRowCount <= 0;
  const consolidatedDisabled = consolidatedRowCount <= 0;

  return (
    <div className="border-t border-border/60 pt-3">
      <p className={`mb-2 ${FDB_TYPO.toolbarLabel} text-foreground`}>
        DB 원본 다운로드
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {hasConsolidated ? (
          <>
            <GlassDbDown
              href={exportHref(exportBasePath, "campus")}
              disabled={campusDisabled}
            >
              캠퍼스별 DBdown
            </GlassDbDown>
            <GlassDbDown
              href={exportHref(exportBasePath, "consolidated")}
              disabled={consolidatedDisabled}
            >
              본교통합 DBdown
            </GlassDbDown>
          </>
        ) : (
          <GlassDbDown href={exportBasePath} disabled={campusDisabled}>
            DBdown
          </GlassDbDown>
        )}
        <span className={FDB_TYPO.legend}>
          저장된 CSV 전체를 엑셀(.xlsx)로 변환해 다운로드
        </span>
      </div>
    </div>
  );
}
