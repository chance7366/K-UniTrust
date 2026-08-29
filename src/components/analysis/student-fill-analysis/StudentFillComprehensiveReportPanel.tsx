"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";

import { useCanUploadExcel } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "@/components/analysis/glass-help-button.css";

const GEMINI_SRC = "/reports/sfa-gemini-comprehensive.html";

export function StudentFillComprehensiveReportPanel({
  year,
}: {
  year: number;
  estb?: string;
  schoolKind?: string;
  explorerRows?: unknown[];
}) {
  const isAdmin = useCanUploadExcel();
  const [busy, setBusy] = useState<"gen" | "pdf" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const liveSrc = useMemo(() => {
    const qs = new URLSearchParams({ year: String(year) });
    return `${GEMINI_SRC}?${qs.toString()}`;
  }, [year]);

  async function generate() {
    setBusy("gen");
    setMessage(null);
    try {
      const res = await fetch("/api/student-fill-analysis/comprehensive-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisYear: year,
          metro: "all",
          estb: "all",
          schoolKind: "university",
        }),
      });
      const body = (await res.json()) as { error?: string; report?: { generatedAt?: string } };
      if (!res.ok) throw new Error(body.error ?? "저장에 실패했습니다.");
      setMessage(`이 분석연도 보고서를 저장했습니다. ${body.report?.generatedAt ?? ""}`.trim());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function savePdf() {
    setBusy("pdf");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/student-fill-analysis/comprehensive-report?year=${year}&metro=all&estb=all&schoolKind=university&format=pdf`,
      );
      if (res.ok && res.headers.get("content-type")?.includes("pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${year}_student-fill-comprehensive.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("PDF를 저장했습니다.");
        return;
      }
      window.open(liveSrc, "sfa-comprehensive-print", "noopener,noreferrer");
      setMessage("열람 창에서 Ctrl+P → 용지 가로 → PDF로 저장하세요.");
    } catch {
      window.open(liveSrc, "sfa-comprehensive-print", "noopener,noreferrer");
      setMessage("열람 창에서 Ctrl+P → 용지 가로 → PDF로 저장하세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={FDB_TYPO.legend}>
          첨부 종합보고서 · 분석조건 필터(기준 연도·권역·설립·학제)는 보고서 안에서 바꿉니다. 인쇄는 A4 가로입니다.
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
              onClick={() => void savePdf()}
            >
              <Download size={12} strokeWidth={2.6} aria-hidden />
              {busy === "pdf" ? "PDF…" : "PDF 저장"}
            </button>
            <button
              type="button"
              className="glass-mint-seg-item"
              onClick={() => window.open(liveSrc, "sfa-comprehensive-view")}
            >
              <Printer size={12} strokeWidth={2.6} aria-hidden />
              열람
            </button>
          </div>
        </div>
      </div>
      {message ? <p className={`${FDB_TYPO.legend} text-accent`}>{message}</p> : null}
      <iframe
        key={liveSrc}
        title="학생충원 종합보고서"
        src={liveSrc}
        className="h-[min(82vh,1100px)] w-full rounded-lg border border-border bg-white"
      />
    </div>
  );
}