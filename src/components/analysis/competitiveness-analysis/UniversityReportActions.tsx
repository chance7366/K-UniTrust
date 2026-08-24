"use client";

import { useCallback, useEffect, useState } from "react";

import {
  GlassActionButton,
} from "@/components/analysis/GlassHelpButton";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { readApiJson } from "@/lib/api/read-api-json";
import type { UniversityReportMeta } from "@/lib/competitiveness-analysis/university-report/report-store";
import { reportMetaHasPdf } from "@/lib/reports/report-pdf-messages";

export function UniversityReportActions({
  analysisYear,
  schoolCodeStd,
  schoolName,
  hasRunResults,
}: {
  analysisYear: number;
  schoolCodeStd: string | null;
  schoolName: string | null;
  hasRunResults: boolean;
}) {
  const accessRole = useAccessRole();
  const [meta, setMeta] = useState<UniversityReportMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeta = useCallback(async () => {
    if (!schoolCodeStd) {
      setMeta(null);
      return;
    }
    setLoadingMeta(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/competitiveness-analysis/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}`,
        { credentials: "same-origin" },
      );
      if (res.status === 404) {
        setMeta(null);
        return;
      }
      const data = await readApiJson<{
        meta?: UniversityReportMeta;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error ?? "보고서 상태를 불러오지 못했습니다.");
      }
      setMeta(data.meta ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "보고서 상태를 불러오지 못했습니다.",
      );
      setMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, [analysisYear, schoolCodeStd]);

  useEffect(() => {
    void fetchMeta();
  }, [fetchMeta]);

  async function handleGenerate() {
    if (!schoolCodeStd) {
      setError("대학을 선택한 뒤 다시 시도해 주세요.");
      return;
    }
    if (accessRole !== "admin") {
      setError("관리자만 보고서를 생성할 수 있습니다.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/competitiveness-analysis/university-reports/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            analysisYear,
            schoolCodeStd,
          }),
        },
      );
      const data = await readApiJson<{
        ok?: boolean;
        meta?: UniversityReportMeta;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error ?? "보고서 생성에 실패했습니다.");
      }
      setMeta(data.meta ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "보고서 생성에 실패했습니다.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function openReport() {
    if (!schoolCodeStd) return;
    window.open(
      `/api/competitiveness-analysis/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}?format=html`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openReportForPrint() {
    openReport();
    setError(null);
  }

  async function downloadPdf() {
    if (!schoolCodeStd || !schoolName) return;
    if (!reportMetaHasPdf(meta)) {
      openReportForPrint();
      return;
    }
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/competitiveness-analysis/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}?format=pdf`,
        { credentials: "same-origin" },
      );
      if (!res.ok) {
        const data = await readApiJson<{ error?: string }>(res);
        throw new Error(data.error ?? "PDF 저장에 실패했습니다.");
      }
      const blob = await res.blob();
      const filename = `${analysisYear}_${schoolCodeStd}_${schoolName}_competitiveness-report.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename.replace(/[\\/:*?"<>|]/g, "_");
      anchor.click();
      URL.revokeObjectURL(url);
      void fetchMeta();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 저장에 실패했습니다.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (!schoolCodeStd || !schoolName) return null;

  const canGenerate = accessRole === "admin" && hasRunResults;
  const hasPdf = reportMetaHasPdf(meta);

  return (
    <div className="rounded-lg border border-border/70 bg-surface-2/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-accent-cyan">
            개별대학 보고서
          </p>
          <p className={`mt-0.5 ${FDB_TYPO.legend} text-muted`}>
            {schoolName} · {analysisYear}년
            {loadingMeta ? " · 상태 확인 중…" : null}
            {!loadingMeta && meta
              ? ` · 생성됨 (${new Date(meta.generatedAt).toLocaleString("ko-KR")})`
              : !loadingMeta
                ? " · 미생성"
                : null}
          </p>
          {!hasRunResults && meta ? (
            <p className={`mt-1 ${FDB_TYPO.legend} text-muted`}>
              분석 차트 없이도 저장된 보고서를 열람할 수 있습니다.
            </p>
          ) : null}
          {meta && !hasPdf ? (
            <p className={`mt-1 ${FDB_TYPO.legend} text-muted`}>
              PDF 파일이 없으면 「PDF 저장(인쇄)」 또는 보고서 열람 후 Ctrl+P →
              PDF로 저장을 이용하세요.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {meta ? (
            <>
              <GlassActionButton tone="blue" onClick={openReport}>
                보고서 열람
              </GlassActionButton>
              <GlassActionButton
                tone="orange"
                onClick={() => void downloadPdf()}
                disabled={pdfLoading}
                title={
                  hasPdf
                    ? "배포된 PDF 파일 다운로드"
                    : "보고서 열람 후 Ctrl+P → PDF로 저장"
                }
              >
                {pdfLoading
                  ? "다운로드 중…"
                  : hasPdf
                    ? "PDF 저장"
                    : "PDF 저장(인쇄)"}
              </GlassActionButton>
            </>
          ) : null}
          {canGenerate ? (
            <GlassActionButton
              tone="green"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating
                ? "생성 중…"
                : meta
                  ? "보고서 재생성"
                  : "보고서 생성"}
            </GlassActionButton>
          ) : null}
        </div>
      </div>
      {accessRole === "admin" && !hasRunResults && !meta ? (
        <p className={`mt-2 ${FDB_TYPO.legend} text-muted`}>
          보고서 생성은 {analysisYear}년 분석실행을 완료한 뒤 가능합니다.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-danger">{error}</p>
      ) : null}
      {generating ? (
        <p className={`mt-2 ${FDB_TYPO.legend} text-muted`}>
          Gemini AI가 보고서를 작성 중입니다. 1~3분 정도 소요될 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
