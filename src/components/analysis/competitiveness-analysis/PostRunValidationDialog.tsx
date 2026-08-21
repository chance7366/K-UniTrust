"use client";

import { useCallback, useState } from "react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  formatPostRunReportForUi,
} from "@/lib/competitiveness-analysis/post-run-validation/format-ui";
import type { PostRunValidationReport } from "@/lib/competitiveness-analysis/post-run-validation/types";

type PostRunValidationDialogProps = {
  open: boolean;
  report: PostRunValidationReport | null;
  onContinue: () => void;
};

export function PostRunValidationDialog({
  open,
  report,
  onContinue,
}: PostRunValidationDialogProps) {
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const handleReviewRequest = useCallback(async () => {
    if (!report) return;
    const { reviewPrompt } = formatPostRunReportForUi(report);
    try {
      await navigator.clipboard.writeText(reviewPrompt);
      setCopyHint("검토 요청 문구가 클립보드에 복사되었습니다. Cursor 채팅에 붙여 넣어 추가 검토를 요청하세요.");
    } catch {
      setCopyHint("복사에 실패했습니다. 아래 주의 항목을 채팅에 직접 붙여 넣어 주세요.");
    }
  }, [report]);

  if (!open || !report) return null;

  const ui = formatPostRunReportForUi(report);
  const toneBorder =
    ui.statusTone === "ok"
      ? "border-accent/40"
      : ui.statusTone === "warn"
        ? "border-warning/50"
        : "border-danger/50";
  const toneBg =
    ui.statusTone === "ok"
      ? "bg-accent/8"
      : ui.statusTone === "warn"
        ? "bg-warning/10"
        : "bg-danger/8";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-run-validation-title"
    >
      <div
        className={`flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border bg-surface shadow-xl ${toneBorder}`}
      >
        <div className={`border-b border-border px-5 py-4 ${toneBg}`}>
          <p className={`${FDB_TYPO.legend} text-muted`}>3단계 실행 후 자동 검증</p>
          <h2
            id="post-run-validation-title"
            className={`mt-1 ${FDB_TYPO.panelTitle}`}
          >
            {ui.headline}
          </h2>
          <p className={`mt-2 ${FDB_TYPO.bodyText} text-muted`}>
            분석 결과를 저장한 뒤 Post-Run 검증 체크리스트를 실행했습니다.
            {ui.statusTone === "ok"
              ? " 치명적 오류는 없습니다."
              : ui.statusTone === "warn"
                ? " 경고가 있습니다. 내용을 확인한 뒤 진행하세요."
                : " 오류가 있습니다. 사용자 작업 또는 추가 검토를 권장합니다."}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {ui.sections
            .filter((section) => section.title === "요약")
            .map((section) => (
            <section key={section.title}>
              <h3 className={`${FDB_TYPO.toolbarControl} font-semibold text-foreground`}>
                {section.title}
              </h3>
              <ul className={`mt-2 space-y-1.5 ${FDB_TYPO.bodyText} text-muted`}>
                {section.lines.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {ui.failedItems.length ? (
            <section>
              <h3 className={`${FDB_TYPO.toolbarControl} font-semibold text-foreground`}>
                주의 항목
              </h3>
              <ul className="mt-2 space-y-3">
                {ui.failedItems.map((item, index) => (
                  <li
                    key={`${item.checkId}-${item.message}-${index}`}
                    className="rounded-lg border border-border bg-surface-2/40 px-3 py-2.5"
                  >
                    <p className={`${FDB_TYPO.bodyText} leading-relaxed text-foreground`}>
                      <span className="mr-1.5 text-warning" aria-hidden>
                        {item.severity === "error" ? "✗" : "⚠"}
                      </span>
                      <span className="text-muted">[{item.checkId}]</span>{" "}
                      {item.message}
                    </p>
                    {item.schools.length ? (
                      <div className="mt-2">
                        <p className={`${FDB_TYPO.legend} text-muted`}>
                          해당 대학 {item.schools.length}교
                        </p>
                        <ul className={`mt-1.5 max-h-40 space-y-1 overflow-y-auto ${FDB_TYPO.bodyText} text-foreground`}>
                          {item.schools.map((school) => (
                            <li key={school} className="flex gap-2 leading-relaxed">
                              <span className="text-muted" aria-hidden>
                                ·
                              </span>
                              <span>{school}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : item.details.length ? (
                      <ul className={`mt-2 space-y-1 ${FDB_TYPO.bodyText} text-muted`}>
                        {item.details.map((detail) => (
                          <li key={detail} className="flex gap-2 leading-relaxed">
                            <span aria-hidden>·</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {ui.sections
            .filter((section) => section.title !== "요약")
            .map((section) => (
            <section key={section.title}>
              <h3 className={`${FDB_TYPO.toolbarControl} font-semibold text-foreground`}>
                {section.title}
              </h3>
              <ul className={`mt-2 space-y-1.5 ${FDB_TYPO.bodyText} text-muted`}>
                {section.lines.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {copyHint ? (
            <p className={`rounded-lg border border-accent/30 bg-accent/8 px-3 py-2 ${FDB_TYPO.legend} text-accent`}>
              {copyHint}
            </p>
          ) : null}

          <p className={`${FDB_TYPO.legend} text-muted`}>
            상세 보고서:{" "}
            <code className="text-foreground">
              data/validation/competitiveness/latest-{report.analysisYear}.txt
            </code>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-2/50 px-5 py-4">
          <button
            type="button"
            onClick={() => void handleReviewRequest()}
            className={`h-[34px] rounded-md border border-border bg-surface px-3.5 font-medium hover:bg-surface-2 ${FDB_TYPO.toolbarControl} text-foreground`}
          >
            AI 추가 검토 요청 (복사)
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={`h-[34px] rounded-md px-3.5 font-semibold text-white ${FDB_TYPO.toolbarControl} ${
              ui.statusTone === "error"
                ? "bg-warning hover:opacity-90"
                : "bg-accent hover:opacity-90"
            }`}
          >
            {ui.statusTone === "error" ? "오류 확인 후 계속" : "결과 확인하고 계속"}
          </button>
        </div>
      </div>
    </div>
  );
}
