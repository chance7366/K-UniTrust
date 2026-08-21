"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useState } from "react";

import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";

export function AnalysisYearSelector({
  variant = "card",
}: {
  variant?: "card" | "inline";
}) {
  const {
    analysisYear,
    editions,
    editionsLoading,
    setAnalysisYear,
    createAnalysisYear,
    settingsStale,
  } = useCompetitivenessSettings();
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const editionMeta = editions.find((e) => e.analysisYear === analysisYear);
  const yearControlsDisabled = hydrated && (pending || editionsLoading);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function handleYearChange(next: number) {
    if (next === analysisYear) return;
    setError(null);
    setInfo(null);
    setPending(true);
    void (async () => {
      try {
        await setAnalysisYear(next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "분석연도 전환에 실패했습니다.",
        );
      } finally {
        setPending(false);
      }
    })();
  }

  function handleCreateYear() {
    const year = Number(newYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setError("2000~2100 사이의 연도를 입력하세요.");
      return;
    }
    if (editions.some((e) => e.analysisYear === year)) {
      setError("이미 목록에 있는 연도입니다. 위 선택 목록에서 고르세요.");
      return;
    }
    setError(null);
    setInfo(null);
    setPending(true);
    void (async () => {
      try {
        const copiedFromYear = await createAnalysisYear(year);
        setNewYear("");
        setShowAddYear(false);
        if (copiedFromYear != null) {
          const yearDelta = year - copiedFromYear;
          const shiftNote =
            yearDelta !== 0
              ? ` 적용연도는 ${Math.abs(yearDelta)}년 ${yearDelta < 0 ? "앞당겼습니다" : "늦췄습니다"}.`
              : "";
          setInfo(
            `${year}년을 추가했습니다. ${copiedFromYear}년의 지표·가중치·분석방법을 복사했습니다.${shiftNote} 대상대학은 분석대상 대표학교에서 해당 연도 목록을 불러옵니다.`,
          );
        } else {
          setInfo(
            `${year}년을 추가했습니다. 기본설정의 대상대학에서 분석대상 대표학교를 확인한 뒤 분석을 진행하세요.`,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "연도 추가에 실패했습니다.",
        );
      } finally {
        setPending(false);
      }
    })();
  }

  const yearSelect = (
        <div className="flex items-center gap-2">
          <label className={FDB_TYPO.toolbarLabel}>분석연도</label>
          <select
            value={analysisYear}
            disabled={yearControlsDisabled || undefined}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent disabled:opacity-60 ${FDB_TYPO.toolbarControl}`}
          >
            {editions.length ? (
              editions.map((e) => (
                <option key={e.analysisYear} value={e.analysisYear}>
                  {e.analysisYear}년
                </option>
              ))
            ) : (
              <option value={analysisYear}>{analysisYear}년</option>
            )}
          </select>
          {yearControlsDisabled ? (
            <span className={FDB_TYPO.legend}>불러오는 중…</span>
          ) : null}
        </div>
  );

  if (variant === "inline") {
    return yearSelect;
  }

  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {yearSelect}

        {editionMeta ? (
          <span
            className={`rounded-md border px-2 py-0.5 ${FDB_TYPO.legend} ${
              editionMeta.hasRunResults
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            {editionMeta.hasRunResults ? "분석결과 있음" : "분석결과 없음"}
          </span>
        ) : null}

        {!showAddYear ? (
          <button
            type="button"
            disabled={yearControlsDisabled || undefined}
            onClick={() => {
              setShowAddYear(true);
              setError(null);
            }}
            className={`ml-auto ${FDB_TYPO.legend} text-accent hover:underline disabled:opacity-60`}
          >
            + 연도 추가
          </button>
        ) : (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={2000}
              max={2100}
              placeholder="예: 2025"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className={`h-[30px] w-28 rounded-md border border-border bg-surface-2 px-2 text-sm`}
            />
            <button
              type="button"
              disabled={yearControlsDisabled || undefined}
              onClick={handleCreateYear}
              className={`h-[30px] rounded-md bg-accent px-3 text-white hover:opacity-90 disabled:opacity-60 ${FDB_TYPO.toolbarControl}`}
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddYear(false);
                setNewYear("");
                setError(null);
              }}
              className={`${FDB_TYPO.legend} text-muted hover:text-foreground`}
            >
              취소
            </button>
          </div>
        )}
      </div>

      {showAddYear ? (
        <p className={`mt-2 ${FDB_TYPO.legend}`}>
          가장 최근 연도의 적용지표·가중치·분석방법·지침을 복사합니다. 대상대학은
          분석대상 대표학교에서 해당 연도 목록을 불러옵니다.
        </p>
      ) : null}

      {settingsStale ? (
        <p className="mt-2 text-xs font-medium text-accent-orange">
          기본설정 값이 변경되었습니다. 다시 분석실행하시기 바랍니다.
        </p>
      ) : null}

      {info ? <p className="mt-2 text-xs text-accent">{info}</p> : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </section>
  );
}
