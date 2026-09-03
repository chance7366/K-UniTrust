"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";

import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "@/components/analysis/glass-help-button.css";

export function EduSettlementReportPanel({
  year,
  guidelines,
}: {
  year: number | null;
  guidelines: string;
}) {
  const isAdmin = useCanUploadExcel();
  const [busy, setBusy] = useState<"gen" | "pdf" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "warn" | "error">("ok");
  const [reload, setReload] = useState(0);

  const liveSrc = useMemo(() => {
    const qs = new URLSearchParams();
    if (year != null) qs.set("year", String(year));
    qs.set("format", "html");
    qs.set("_", String(reload));
    return `/api/edu-accounting/settlement-report?${qs.toString()}`;
  }, [year, reload]);

  async function generate() {
    setBusy("gen");
    setMessage(null);
    try {
      const res = await fetch("/api/edu-accounting/settlement-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const body = (await res.json()) as {
        error?: string;
        generatedAt?: string;
        warnings?: string[];
        match?: { schools?: number; unmatchedRows?: number };
      };
      if (!res.ok) {
        setMessageTone("error");
        throw new Error(body.error ?? "저장에 실패했습니다.");
      }
      const warn = body.warnings?.length
        ? `\n\n${body.warnings.join("\n")}`
        : "";
      setMessageTone(body.warnings?.length ? "warn" : "ok");
      setMessage(
        `이 결산연도 보고서를 저장했습니다. ${body.generatedAt ?? ""} · 매칭 ${body.match?.schools ?? "—"}교.${warn}`.trim(),
      );
      setReload((n) => n + 1);
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function savePdf() {
    setBusy("pdf");
    window.open(liveSrc, "edu-settlement-print", "noopener,noreferrer");
    setMessage("열람 창에서 Ctrl+P → 용지 세로 → 배경 그래픽 켜기 → PDF로 저장하세요.");
    setMessageTone("ok");
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={FDB_TYPO.legend}>
          수입분석 1차 · 교비자금(수입)×학교코드 · 인쇄는 A4 세로입니다.
        </span>
        <div className="ml-auto">
          <div className="glass-mint-seg" role="group" aria-label="종합보고서 작업">
            {isAdmin ? (
              <button
                type="button"
                className="glass-mint-seg-item"
                disabled={busy != null}
                onClick={() => void generate()}
              >
                <FileText size={12} strokeWidth={2.6} aria-hidden />
                {busy === "gen" ? "저장 중…" : "올해 저장"}
              </button>
            ) : null}
            <button
              type="button"
              className="glass-mint-seg-item"
              disabled={busy != null}
              onClick={savePdf}
            >
              <Download size={12} strokeWidth={2.6} aria-hidden />
              PDF 저장
            </button>
            <button
              type="button"
              className="glass-mint-seg-item"
              onClick={() => window.open(liveSrc, "edu-settlement-view")}
            >
              <Printer size={12} strokeWidth={2.6} aria-hidden />
              열람
            </button>
          </div>
        </div>
      </div>
      {message ? (
        <pre
          className={`${FDB_TYPO.legend} whitespace-pre-wrap rounded-md border px-3 py-2 ${
            messageTone === "error"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : messageTone === "warn"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </pre>
      ) : null}
      <iframe
        key={liveSrc}
        title="교비회계 결산 종합보고서"
        src={liveSrc}
        className="h-[min(82vh,1100px)] w-full rounded-lg border border-border bg-white"
      />
      <details className="rounded-lg border border-border bg-card p-4" open>
        <summary className={`${FDB_TYPO.panelTitle} cursor-pointer`}>
          종합보고서 생성 지침
        </summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
          {guidelines}
        </pre>
      </details>
    </div>
  );
}
