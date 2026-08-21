"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, MapPin } from "lucide-react";

import { SchoolAgePopulationChartDashboard } from "@/components/analysis/SchoolAgePopulationChartDashboard";
import { SchoolAgePopulationDataTable } from "@/components/analysis/SchoolAgePopulationDataTable";
import {
  buildDeclineDashboardModelFromRows,
  type SchoolAgePopulationSection,
} from "@/lib/analysis/school-age-decline-analytics";
import type { SchoolAgePopulationDashboardData } from "@/lib/data/school-age-population";
import {
  SCHOOL_AGE_POPULATION_TEMPLATE_SAMPLES,
  SCHOOL_AGE_UPLOAD_HEADERS,
} from "@/lib/ingest/school-age-population-config";

function fmtPreview(v: string | number): string {
  return String(v);
}

function SectionTabRow({
  active,
  onChange,
  action,
}: {
  active: SchoolAgePopulationSection;
  onChange: (section: SchoolAgePopulationSection) => void;
  action?: ReactNode;
}) {
  const tabs: {
    id: SchoolAgePopulationSection;
    label: string;
    icon: typeof MapPin;
  }[] = [
    { id: "sido-data", label: "시도별자료", icon: MapPin },
    { id: "dashboard", label: "학령인구대시보드", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <GlassMintTabGroup
        active={active}
        onChange={onChange}
        items={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
        }))}
      />
      {action ?? null}
    </div>
  );
}

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[960px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {SCHOOL_AGE_UPLOAD_HEADERS.map((h) => (
              <th
                key={h}
                className="text-table-head whitespace-nowrap px-2 py-2 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHOOL_AGE_POPULATION_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              {row.map((value, j) => (
                <td key={j} className="whitespace-nowrap px-2 py-1.5 font-mono">
                  {fmtPreview(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        1행 헤더 · 기준연도와 0세~20세 인구가 한 시트에 있습니다. 행정기관은
        시도명(전국 포함)입니다.
      </p>
    </div>
  );
}

function UploadPanel({
  uploadedAt,
  rowCount,
  onClose,
}: {
  uploadedAt: string | null;
  rowCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  function handleFile(file: File) {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch(
          "/api/ingest/finance-analysis/school-age-population/upload",
          { method: "POST", body: fd },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
          overwrittenYears?: number[];
          newYears?: number[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "업로드에 실패했습니다.");
        }
        const parts: string[] = [];
        if (body.overwrittenYears?.length) {
          parts.push(`덮어쓰기 연도: ${body.overwrittenYears.join(", ")}`);
        }
        if (body.newYears?.length) {
          parts.push(`신규 연도: ${body.newYears.join(", ")}`);
        }
        setMessage(
          `${body.rowCount ?? 0}건 저장됨${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
        );
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "업로드에 실패했습니다.",
        );
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-5">
      <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
            엑셀업로드
          </p>
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>학령인구(시도)</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            시도별 0세~20세 주민등록 인구 엑셀을 업로드하면{" "}
            <code className="text-accent">
              data/csv/finance_analysis_school_age_population.csv
            </code>
            에 저장됩니다. 동일 연도는 덮어쓰기, 신규 연도는 추가됩니다.
          </p>
          {uploadedAt ? (
            <p className={`mt-2 ${FDB_TYPO.legend}`}>
              최근 업로드: {new Date(uploadedAt).toLocaleString("ko-KR")} ·{" "}
              {rowCount.toLocaleString("ko-KR")}행
            </p>
          ) : (
            <p className={`mt-2 ${FDB_TYPO.legend} text-warning`}>
              아직 업로드된 데이터가 없습니다.
            </p>
          )}
          {message ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p>
          ) : null}
          {error ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UploadPanelTemplateLink
            href="/api/ingest/finance-analysis/school-age-population/template"
            download="school_age_population_sido_upload_template.xlsx"
          />
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <UploadPanelSelectButton disabled={pending} pending={pending} onClick={() => inputRef.current?.click()} />
          <UploadPanelHideButton onClick={onClose} />
          <UploadPanelHelpButton active={helpOpen} onClick={() => setHelpOpen((prev) => !prev)} />
        </div>
        </div>
        <FinanceAnalysisDbExportButtons
          exportBasePath="/api/ingest/finance-analysis/school-age-population/export"
          campusRowCount={rowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">학령인구지수</span> =
              해당 연령 인구 / 18세 인구 × 100
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">대입연도</span> =
              자료연도 + (19 − 연령). 18세는 차년도 대학입학자원 기준 연령입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">가중치</span> :
              한국교육과정평가원(KICE) 홈페이지 접속 ➔ [알림마당] ➔ [보도자료]에서
              &quot;2024학년도(또는 2025학년도) 수능 원서접수 결과&quot;
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">나만의 지수 만들기</span>
              : 지역별 재학생진학률과 N수생(졸업생) 유입율, 고졸취업자 등을
              고려
            </p>
            <p className="mt-2">
              해당 지역의 총 수능 지원자 수 ÷ 해당 지역의 만 17세 인구수 =
              지역별 입학 자원 가중치
            </p>
            <p className="mt-2">(AI에게 산출하도록 함)</p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> :
              행정안전부 주민등록 인구통계의 [연령별 인구현황]
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">관리</span> :
              조회기간을 연간으로 선택한 후 연령구분단위 1세, 연령조회범위를
              0세~20세로 선택하여 시도별 자료를 추출합니다. 입학자원가중치는
              시도별로 함께 관리합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">특이사항</span> : 없음.
            </p>
          </div>
        ) : null}
        <TemplatePreviewTable />
      </div>
    </section>
  );
}

export function SchoolAgePopulationDashboard({
  data,
}: {
  data: SchoolAgePopulationDashboardData;
}) {
  const allYears = data.years;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [section, setSection] = useState<SchoolAgePopulationSection>("sido-data");
  const [displayYear, setDisplayYear] = useState<number | null>(
    data.defaultDisplayYear,
  );

  useEffect(() => {
    setDisplayYear(data.defaultDisplayYear);
  }, [data.defaultDisplayYear]);

  const declineModel = useMemo(() => {
    if (!data.hasData || displayYear == null) return null;
    return buildDeclineDashboardModelFromRows(data.rows, displayYear);
  }, [data.hasData, data.rows, displayYear]);

  const hasChartData = declineModel != null;

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="주민등록 인구통계 · 시도별 0~20세"
        title="학령인구(시도)"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        <SectionTabRow
          active={section}
          onChange={setSection}
          action={
            !uploadOpen ? (
              <div className="ml-auto shrink-0">
                <ExcelUploadButton
                  variant="emerald"
                  onClick={() => setUploadOpen(true)}
                />
              </div>
            ) : null
          }
        />

        {allYears.length > 0 ? (
          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
              {allYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setDisplayYear(y)}
                  className={`h-[30px] rounded-md border px-2.5 py-1 transition-colors ${FDB_TYPO.toolbarControl} ${
                    displayYear === y
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface-2 text-muted hover:text-foreground"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {!data.hasData || displayYear == null ? (
          <section className="rounded-xl border border-border bg-surface p-5">
            <p className={FDB_TYPO.bodyText}>
              데이터가 없습니다. 상단의{" "}
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="text-accent underline-offset-2 hover:underline"
              >
                엑셀업로드
              </button>
              에서 양식을 다운로드한 뒤 엑셀을 업로드하세요.
            </p>
          </section>
        ) : section === "dashboard" ? (
          hasChartData ? (
            <SchoolAgePopulationChartDashboard model={declineModel} />
          ) : (
            <section className="rounded-xl border border-border bg-surface p-5">
              <p className={FDB_TYPO.bodyText}>
                {displayYear}년 데이터로 대시보드를 구성할 수 없습니다. 전국·시·도
                0세~18세 인구가 모두 채워져 있는지 확인해 주세요.
              </p>
            </section>
          )
        ) : (
          <section className="rounded-xl border border-border bg-surface p-5">
            <SchoolAgePopulationDataTable
              rows={data.rows}
              displayYear={displayYear}
            />
          </section>
        )}
      </div>
    </div>
  );
}
