"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GlassActionButton } from "@/components/analysis/GlassHelpButton";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { readApiJson } from "@/lib/api/read-api-json";
import { buildFpReportGuidelines } from "@/lib/competitiveness-analysis/financial-projection/report/generation-guidelines";
import type { FpReportMeta } from "@/lib/competitiveness-analysis/financial-projection/report/fp-report-store";

export function FpUniversityReportActions({
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
  const isAdmin = accessRole === "admin";
  const [meta, setMeta] = useState<FpReportMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guidelines = useMemo(
    () => (isAdmin ? buildFpReportGuidelines(analysisYear) : ""),
    [isAdmin, analysisYear],
  );

  const fetchMeta = useCallback(async () => {
    if (!schoolCodeStd) {
      setMeta(null);
      return;
    }
    setLoadingMeta(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/financial-projection/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}`,
        { credentials: "same-origin" },
      );
      if (res.status === 404) {
        setMeta(null);
        return;
      }
      const data = await readApiJson<{
        meta?: FpReportMeta;
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
    if (!isAdmin) {
      setError("관리자만 보고서를 생성할 수 있습니다.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/financial-projection/university-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ analysisYear, schoolCodeStd }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        meta?: FpReportMeta;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "보고서 생성에 실패했습니다.");
      }
      setMeta(data.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "보고서 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function openReport() {
    if (!schoolCodeStd) return;
    window.open(
      `/api/financial-projection/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}?format=html`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function downloadPdf() {
    if (!schoolCodeStd || !schoolName) return;
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/financial-projection/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}?format=pdf`,
        { credentials: "same-origin" },
      );
      if (!res.ok) {
        const data = await readApiJson<{ error?: string }>(res);
        throw new Error(data.error ?? "PDF 저장에 실패했습니다.");
      }
      const blob = await res.blob();
      const filename = `${analysisYear}_${schoolCodeStd}_${schoolName}_financial-projection-report.pdf`;
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

  const canGenerate = isAdmin && hasRunResults;

  return (
    <div className="rounded-lg border border-border/70 bg-surface-2/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-accent-cyan">
            개별대학 재정추계 보고서
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
              추계 차트 없이도 저장된 보고서를 열람할 수 있습니다.
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
                onClick={downloadPdf}
                disabled={pdfLoading}
              >
                {pdfLoading ? "PDF 생성 중…" : "PDF 저장"}
              </GlassActionButton>
            </>
          ) : null}
          {canGenerate ? (
            <>
              <GlassActionButton
                tone="green"
                onClick={() => void handleGenerate()}
                disabled={generating}
              >
                {generating ? "생성 중…" : meta ? "보고서 재생성" : "보고서 생성"}
              </GlassActionButton>
              <GlassActionButton
                tone="blue"
                onClick={() => setGuidelinesOpen((open) => !open)}
                title="분석연도가 반영된 생성 지침 전문 (관리자 전용)"
              >
                {guidelinesOpen ? "지침 닫기" : "생성 지침"}
              </GlassActionButton>
            </>
          ) : null}
        </div>
      </div>
      {isAdmin && !hasRunResults && !meta ? (
        <p className={`mt-2 ${FDB_TYPO.legend} text-muted`}>
          보고서 생성은 {analysisYear}년 재정추계 분석실행을 완료한 뒤 가능합니다.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      {generating ? (
        <p className={`mt-2 ${FDB_TYPO.legend} text-muted`}>
          Gemini AI가 4개 시나리오 추계·한계진단·대응전략 보고서를 작성 중입니다.
          1~3분 정도 소요될 수 있습니다.
        </p>
      ) : null}
      {isAdmin && guidelinesOpen ? (
        <pre
          className={`mt-3 max-h-[480px] overflow-auto rounded-lg border border-border/60 bg-surface p-3 whitespace-pre-wrap ${FDB_TYPO.legend}`}
        >
          {guidelines}
        </pre>
      ) : null}
    </div>
  );
}
