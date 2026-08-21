"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

import { CompetitivenessTargetUnivMockPage } from "@/components/mockups/CompetitivenessTargetUnivMockPage";
import {
  toTargetUniversityRow,
  type CompetitivenessTargetUnivData,
  type CompetitivenessTargetUnivRow,
} from "@/lib/analysis/competitiveness-target-univ-mock-view";
import {
  useCompetitivenessCategories,
  useCompetitivenessSettings,
} from "@/lib/competitiveness-analysis/store";
import {
  ABSOLUTE_INDICATOR_POLICY_LABELS,
  NATIONAL_COMPARISON_SCOPE_LABELS,
  STEP_INDICATOR_SCOPE_LABELS,
  type AnalysisPolicy,
  type AbsoluteIndicatorPolicy,
  type NationalComparisonScope,
  type StepIndicatorScope,
} from "@/lib/competitiveness-analysis/analysis-policy";
import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import {
  DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT,
  DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";
import { GlassActionButton } from "@/components/analysis/GlassHelpButton";
import { SettingsSaveBar } from "@/components/analysis/competitiveness-analysis/SettingsActionBar";
import {
  IndicatorYearsHelpPanel,
  IndicatorYearsHelpToggle,
} from "@/components/analysis/competitiveness-analysis/IndicatorYearsHelp";
import {
  formatWeightValidationError,
  summarizeCategoryIndicatorWeights,
} from "@/lib/competitiveness-analysis/validate-competitiveness-weights";

import "@/components/analysis/freshman-enrollment-alimi-table.css";

type SettingsSectionTab = "target" | "indicators" | "absolute" | "guidelines";

function parseSettingsSection(value: string | null): SettingsSectionTab {
  if (
    value === "indicators" ||
    value === "absolute" ||
    value === "guidelines"
  ) {
    return value;
  }
  return "target";
}

function SettingsSectionTabRow({
  active,
  targetCount,
  absoluteCount,
  onChange,
}: {
  active: SettingsSectionTab;
  targetCount: number;
  absoluteCount: number;
  onChange: (tab: SettingsSectionTab) => void;
}) {
  const tabs: {
    id: SettingsSectionTab;
    label: string;
    icon: typeof Building2;
    count?: number;
  }[] = [
    { id: "target", label: "대상대학", icon: Building2, count: targetCount },
    { id: "indicators", label: "적용지표 · 가중치", icon: SlidersHorizontal },
    { id: "guidelines", label: "분석방법과 지침", icon: BookOpen },
    { id: "absolute", label: "절대지표 대학", icon: AlertTriangle, count: absoluteCount },
  ];

  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label="기본설정 섹션"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
                isActive ? "text-indigo-700" : "text-muted"
              }`}
              aria-hidden
            />
            {tab.label}
            {tab.count != null ? (
              <span
                className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-surface text-muted"
                }`}
              >
                {tab.count.toLocaleString("ko-KR")}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({
  title,
  description,
  headerMeta,
  headerActions,
  contentClassName,
  children,
}: {
  title?: string;
  description?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const hasHeader = Boolean(title || description || headerMeta || headerActions);
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="text-base font-semibold">{title}</h2>
            ) : null}
            {description ? (
              <p
                className={`${title ? "mt-1 text-sm text-muted" : FDB_TYPO.legend} ${!title ? "text-muted" : ""}`}
              >
                {description}
              </p>
            ) : null}
            {headerMeta}
          </div>
          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={hasHeader ? (contentClassName ?? "mt-4") : ""}>
        {children}
      </div>
    </section>
  );
}

function WeightInput({
  value,
  onChange,
  suffix = "%",
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm font-mono"
      />
      <span className={FDB_TYPO.legend}>{suffix}</span>
    </div>
  );
}

function PercentileTailInput({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={FDB_TYPO.legend}>{label}</span>
      <input
        type="number"
        min={1}
        max={49}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm font-mono disabled:opacity-50"
      />
      <span className={FDB_TYPO.legend}>%</span>
    </div>
  );
}

export function SettingsPanel({
  targetUnivData,
}: {
  targetUnivData: CompetitivenessTargetUnivData;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");

  const categories = useCompetitivenessCategories();
  const {
    analysisYear,
    editionsLoading,
    settings,
    indicators,
    yearsByTab,
    updateCategoryWeight,
    updateIndicatorWeight,
    setEnabledIndicator,
    setIndicatorYear,
    updateIndicatorPercentileLowerTail,
    updateIndicatorPercentileUpperTail,
    setTargetUniversities,
    saveSettings,
    settingsSavePending,
    weightValidationIssues,
    weightsValid,
    runAnalysis,
    runPending,
    runError,
    postRunValidationPending,
    updateAnalysisPolicy,
    analysisGuidelines,
    refreshEditions,
  } = useCompetitivenessSettings();

  const [activeSection, setActiveSection] = useState<SettingsSectionTab>(() =>
    parseSettingsSection(sectionParam),
  );

  useEffect(() => {
    setActiveSection(parseSettingsSection(sectionParam));
  }, [sectionParam]);

  useEffect(() => {
    if (editionsLoading) return;
    const urlYear = Number(searchParams.get("year"));
    if (urlYear === analysisYear) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(analysisYear));
    const qs = params.toString();
    router.replace(
      qs
        ? `/analysis/competitiveness-analysis/settings?${qs}`
        : "/analysis/competitiveness-analysis/settings",
      { scroll: false },
    );
  }, [analysisYear, editionsLoading, router, searchParams]);

  function setSection(tab: SettingsSectionTab) {
    setActiveSection(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "target") {
      params.delete("section");
    } else {
      params.set("section", tab);
    }
    const qs = params.toString();
    router.replace(
      qs
        ? `/analysis/competitiveness-analysis/settings?${qs}`
        : "/analysis/competitiveness-analysis/settings",
      { scroll: false },
    );
  }

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [indicatorHelpOpen, setIndicatorHelpOpen] = useState(false);

  useEffect(() => {
    if (activeSection !== "indicators") {
      setIndicatorHelpOpen(false);
    }
  }, [activeSection]);

  useEffect(() => {
    if (editionsLoading) return;
    const urlYear = Number(searchParams.get("year"));
    if (Number.isInteger(urlYear) && urlYear !== analysisYear) return;
    const rows = [
      ...targetUnivData.allCohortRows.university,
      ...targetUnivData.allCohortRows["junior-college"],
    ].map(toTargetUniversityRow);
    setTargetUniversities(rows);
  }, [
    analysisYear,
    editionsLoading,
    searchParams,
    setTargetUniversities,
    targetUnivData,
  ]);

  const categoryIndicatorMap = useMemo(() => {
    const map = new Map<string, typeof indicators>();
    for (const cat of categories) {
      map.set(
        cat.id,
        indicators.filter((i) => i.categoryId === cat.id),
      );
    }
    return map;
  }, [categories, indicators]);

  const targetUnivRows = useMemo(
    () => [
      ...targetUnivData.allCohortRows.university,
      ...targetUnivData.allCohortRows["junior-college"],
    ],
    [targetUnivData],
  );

  const absoluteLists = useMemo(() => {
    const studentAidRestrict: CompetitivenessTargetUnivRow[] = [];
    const provisional: CompetitivenessTargetUnivRow[] = [];
    const noSettlement: CompetitivenessTargetUnivRow[] = [];
    const fundShortage: CompetitivenessTargetUnivRow[] = [];
    for (const row of targetUnivRows) {
      if (row.studentAidRestrict === "해당") studentAidRestrict.push(row);
      if (row.provisionalBoard === "해당") provisional.push(row);
      if (row.noSettlement === "해당") noSettlement.push(row);
      if (row.fundShortage === "해당") fundShortage.push(row);
    }
    return { studentAidRestrict, provisional, noSettlement, fundShortage };
  }, [targetUnivRows]);

  const absoluteCount = useMemo(
    () =>
      targetUnivRows.filter(
        (row) =>
          row.studentAidRestrict === "해당" ||
          row.provisionalBoard === "해당" ||
          row.noSettlement === "해당" ||
          row.fundShortage === "해당",
      ).length,
    [targetUnivRows],
  );

  const categoryWeightSum = categories.reduce(
    (s, c) => s + (settings.categoryWeights[c.id] ?? 0),
    0,
  );

  const categoryIndicatorSummaries = useMemo(
    () => summarizeCategoryIndicatorWeights(settings, indicators),
    [settings, indicators],
  );

  function handleSaveSettings() {
    if (!weightsValid) {
      setSaveMessage(null);
      setSaveError(formatWeightValidationError(weightValidationIssues));
      return;
    }
    setSaveError(null);
    void saveSettings()
      .then(async () => {
        await refreshEditions();
        setSaveMessage(`${analysisYear}년 가중치가 이 PC에 저장되었습니다.`);
      })
      .catch((err: unknown) => {
        setSaveError(
          err instanceof Error ? err.message : "설정 저장에 실패했습니다.",
        );
      });
  }

  const saveBar = (
    <SettingsSaveBar
      onSave={handleSaveSettings}
      savePending={settingsSavePending}
      saveError={saveError}
      saveMessage={saveMessage}
    />
  );

  const indicatorsHeaderActions = (
    <SettingsSaveBar
      onSave={handleSaveSettings}
      savePending={settingsSavePending}
      saveError={saveError}
      saveMessage={saveMessage}
      extraActions={
        <IndicatorYearsHelpToggle
          open={indicatorHelpOpen}
          onToggle={() => setIndicatorHelpOpen((v) => !v)}
        />
      }
    />
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <SettingsSectionTabRow
          active={activeSection}
          targetCount={
            targetUnivData.cohortCounts.university +
            targetUnivData.cohortCounts["junior-college"]
          }
          absoluteCount={absoluteCount}
          onChange={setSection}
        />
        <div className="flex flex-col items-end gap-1">
          {runError ? (
            <p className={`${FDB_TYPO.legend} text-danger`}>{runError}</p>
          ) : null}
          <GlassActionButton
            tone="green"
            onClick={() => void runAnalysis()}
            disabled={runPending || postRunValidationPending || !weightsValid}
            title={
              weightsValid
                ? "1·2·3단계를 연속 실행한 뒤 검증 결과를 표시합니다."
                : weightValidationIssues.map((issue) => issue.message).join(" ")
            }
          >
            {runPending
              ? "실행 중…"
              : postRunValidationPending
                ? "검증 중…"
                : "분석실행"}
          </GlassActionButton>
        </div>
      </div>

      {activeSection === "target" ? (
        <CompetitivenessTargetUnivMockPage
          data={targetUnivData}
          variant="production"
          chrome="board"
        />
      ) : null}

      {activeSection === "indicators" ? (
      <SectionCard
        description="재정분석지표 메뉴의 지표를 자동 반영 · 지표별 하위/상위 n%는 §3 선형 보간의 Pₙ·P₍₁₀₀₋ₙ₎ 임계치"
        headerMeta={
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            카테고리 가중치 합계:{" "}
            <span
              className={
                categoryWeightSum === 100 ? "text-accent" : "text-danger"
              }
            >
              {categoryWeightSum}%
            </span>
            {categoryWeightSum !== 100 ? " (100% 필수)" : ""}
            {weightsValid ? (
              <span className="text-accent">
                {" · "}가중치 검증 완료 · 3단계 종합지수 산출에 사용됩니다.
              </span>
            ) : null}
          </p>
        }
        headerActions={indicatorsHeaderActions}
        contentClassName="mt-2"
      >
        {indicatorHelpOpen ? (
          <IndicatorYearsHelpPanel onClose={() => setIndicatorHelpOpen(false)} />
        ) : null}
        {!weightsValid ? (
          <div className="mb-3 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
            {weightValidationIssues.map((issue) => (
              <p key={`${issue.code}-${issue.message}`}>{issue.message}</p>
            ))}
          </div>
        ) : null}
        <div className="space-y-6">
          {categories.map((cat) => {
            const catSummary = categoryIndicatorSummaries.find(
              (summary) => summary.categoryId === cat.id,
            );
            return (
            <div key={cat.id}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-semibold text-accent-cyan">
                  {cat.label}
                </h3>
                <span className={FDB_TYPO.legend}>카테고리 가중치</span>
                <WeightInput
                  value={settings.categoryWeights[cat.id] ?? 0}
                  onChange={(v) => updateCategoryWeight(cat.id, v)}
                />
                <span
                  className={`text-xs ${
                    catSummary?.valid ? "text-accent" : "text-danger"
                  }`}
                >
                  적용 지표 가중치 합계: {catSummary?.sum ?? 0}%
                  {catSummary?.enabledCount === 0
                    ? " (적용 지표 없음)"
                    : catSummary?.valid
                      ? ""
                      : " (100% 필수)"}
                </span>
              </div>
              <ul className="mt-2 space-y-2">
                {(categoryIndicatorMap.get(cat.id) ?? []).map((ind) => {
                  const yearOptions =
                    yearsByTab[ind.financeTabId]?.length
                      ? yearsByTab[ind.financeTabId]
                      : [ind.defaultYearLabel];
                  return (
                    <li
                      key={ind.financeTabId}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
                    >
                      <label className="flex min-w-[160px] items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            settings.enabledIndicators[ind.financeTabId] !==
                            false
                          }
                          onChange={(e) =>
                            setEnabledIndicator(
                              ind.financeTabId,
                              e.target.checked,
                            )
                          }
                          className="rounded border-border"
                        />
                        {ind.label}
                      </label>
                      <select
                        value={
                          settings.indicatorYears[ind.financeTabId] ??
                          ind.defaultYearLabel
                        }
                        onChange={(e) =>
                          setIndicatorYear(ind.financeTabId, e.target.value)
                        }
                        className="min-w-[140px] rounded-md border border-border bg-surface px-2 py-1 text-sm"
                        disabled={
                          settings.enabledIndicators[ind.financeTabId] ===
                          false
                            ? true
                            : undefined
                        }
                      >
                        {yearOptions!.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <span className={FDB_TYPO.legend}>지표 가중치</span>
                      <WeightInput
                        value={
                          settings.indicatorWeights[ind.financeTabId] ??
                          ind.defaultWeightPct
                        }
                        onChange={(v) =>
                          updateIndicatorWeight(ind.financeTabId, v)
                        }
                      />
                      <PercentileTailInput
                        label="하위"
                        value={
                          settings.indicatorPercentileLowerTailPct?.[
                            ind.financeTabId
                          ] ?? DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT
                        }
                        onChange={(v) =>
                          updateIndicatorPercentileLowerTail(
                            ind.financeTabId,
                            v,
                          )
                        }
                        disabled={
                          settings.enabledIndicators[ind.financeTabId] ===
                          false
                        }
                      />
                      <PercentileTailInput
                        label="상위"
                        value={
                          settings.indicatorPercentileUpperTailPct?.[
                            ind.financeTabId
                          ] ?? DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT
                        }
                        onChange={(v) =>
                          updateIndicatorPercentileUpperTail(
                            ind.financeTabId,
                            v,
                          )
                        }
                        disabled={
                          settings.enabledIndicators[ind.financeTabId] ===
                          false
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </div>
      </SectionCard>
      ) : null}

      {activeSection === "guidelines" ? (
        <GuidelinesSettingsSection
          policy={settings.analysisPolicy}
          indicators={indicators}
          onUpdate={updateAnalysisPolicy}
          preview={analysisGuidelines}
          readOnly
        />
      ) : null}

      {activeSection === "absolute" ? (
      <SectionCard description="분석연도 대상대학의 학자금제한·임시이사·결산미제출·자금부족 해당 대학입니다.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AbsoluteList
            title="학자금제한"
            rows={absoluteLists.studentAidRestrict}
          />
          <AbsoluteList
            title="임시이사"
            rows={absoluteLists.provisional}
          />
          <AbsoluteList
            title="결산미제출"
            rows={absoluteLists.noSettlement}
          />
          <AbsoluteList
            title="자금부족"
            rows={absoluteLists.fundShortage}
          />
        </div>
      </SectionCard>
      ) : null}
    </div>
  );
}

function PolicyRadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={FDB_TYPO.sectionTab}>{label}</legend>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex gap-3 rounded-lg border px-3 py-2 ${
              disabled ? "cursor-default" : "cursor-pointer"
            } ${
              value === opt.value
                ? "border-accent bg-accent/5"
                : "border-border bg-surface-2"
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.hint ? (
                <span className="mt-0.5 block text-xs text-muted">{opt.hint}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GuidelinesSettingsSection({
  policy,
  indicators,
  onUpdate,
  preview,
  readOnly = false,
}: {
  policy: AnalysisPolicy;
  indicators: CompetitivenessIndicatorDef[];
  onUpdate: (patch: Partial<AnalysisPolicy>) => void;
  preview: string;
  readOnly?: boolean;
}) {
  const lowerOptions = indicators.map((ind) => ({
    id: ind.financeTabId,
    label: ind.label,
  }));

  function toggleLowerIsBetter(id: string) {
    const set = new Set(policy.lowerIsBetterIndicatorIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onUpdate({ lowerIsBetterIndicatorIds: [...set] });
  }

  return (
    <SectionCard
      description="분석방법과 지침은 조회 전용입니다. 분석실행은 적용지표·가중치 탭에서 저장한 값과 이 지침을 함께 사용합니다."
      headerActions={null}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <PolicyRadioGroup<StepIndicatorScope>
            label="1·2단계 조회 지표"
            value={policy.step12IndicatorScope}
            onChange={(v) => onUpdate({ step12IndicatorScope: v })}
            disabled={readOnly}
            options={[
              {
                value: "enabled-only",
                label: STEP_INDICATOR_SCOPE_LABELS["enabled-only"],
                hint: "적용지표·적용연도·가중치 탭의 체크 상태와 동일",
              },
              {
                value: "all-catalog",
                label: STEP_INDICATOR_SCOPE_LABELS["all-catalog"],
                hint: "카탈로그 8개 지표 전체 (미적용 지표 포함)",
              },
            ]}
          />

          <PolicyRadioGroup<NationalComparisonScope>
            label="2단계 전국 백분위 비교 범위"
            value={policy.nationalComparisonScope}
            onChange={(v) => onUpdate({ nationalComparisonScope: v })}
            disabled={readOnly}
            options={[
              {
                value: "same-school-kind",
                label: NATIONAL_COMPARISON_SCOPE_LABELS["same-school-kind"],
                hint: "대학은 대학끼리, 전문대학은 전문대학끼리 분포 비교",
              },
              {
                value: "all-schools",
                label: NATIONAL_COMPARISON_SCOPE_LABELS["all-schools"],
                hint: "대학·전문대학 통합 분포 비교",
              },
            ]}
          />

          <PolicyRadioGroup<AbsoluteIndicatorPolicy>
            label="절대지표 해당 대학 (종합순위)"
            value={policy.absoluteIndicatorPolicy}
            onChange={(v) => onUpdate({ absoluteIndicatorPolicy: v })}
            disabled={readOnly}
            options={[
              {
                value: "include-with-notes",
                label: ABSOLUTE_INDICATOR_POLICY_LABELS["include-with-notes"],
              },
              {
                value: "exclude-from-ranking",
                label: ABSOLUTE_INDICATOR_POLICY_LABELS["exclude-from-ranking"],
              },
            ]}
          />

          <fieldset className="space-y-2">
            <legend className={FDB_TYPO.sectionTab}>
              역지표 (낮을수록 우수 · 백분위 역산)
            </legend>
            <ul className="space-y-2">
              {lowerOptions.map((opt) => (
                <li key={opt.id}>
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={policy.lowerIsBetterIndicatorIds.includes(opt.id)}
                      onChange={() => toggleLowerIsBetter(opt.id)}
                      disabled={readOnly}
                    />
                    {opt.label}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-accent-cyan">분석 지침</h3>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            대상대학·가중치·적용지표·분석방법 설정을 반영해 자동 생성됩니다.
          </p>
          <pre className="mt-3 max-h-[720px] overflow-auto rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap">
            {preview}
          </pre>
        </div>
      </div>
    </SectionCard>
  );
}

function AbsoluteList({
  title,
  rows,
}: {
  title: string;
  rows: CompetitivenessTargetUnivRow[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className={FDB_TYPO.sectionTab}>{title}</h3>
      <p className={`mt-1 ${FDB_TYPO.legend}`}>{rows.length}건</p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((r) => (
            <li
              key={`${r.schoolRepCode}-${r.schoolRepName}`}
              className="flex flex-col gap-0.5"
            >
              <span>{r.schoolRepName}</span>
              <span className={FDB_TYPO.legend}>{r.region}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">해당 대학 없음</p>
      )}
    </div>
  );
}
