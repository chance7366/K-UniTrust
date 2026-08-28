"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SlimTabs } from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { sfaFillStage } from "@/lib/analysis/student-fill-analysis/fill-stage";
import type {
  StudentFillPeerMetricKey,
  StudentFillPeerPayload,
  StudentFillPeerRates,
} from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";

type ResultDomain = "roster" | "freshman" | "enrolled" | "foreign";
type ResultLens = "stats" | "risk" | "geo" | "dist" | "trend";

const DOMAIN_TABS: { id: ResultDomain; label: string }[] = [
  { id: "roster", label: "재적현황" },
  { id: "freshman", label: "신입생충원" },
  { id: "enrolled", label: "재학·탈락" },
  { id: "foreign", label: "외국인" },
];

const LENS_TABS: { id: ResultLens; label: string }[] = [
  { id: "stats", label: "지표통계" },
  { id: "risk", label: "위치·위험" },
  { id: "geo", label: "지역·규모" },
  { id: "dist", label: "분포" },
  { id: "trend", label: "시계열" },
];

const PRIMARY: Record<ResultDomain, StudentFillPeerMetricKey> = {
  roster: "leaveShare",
  freshman: "rateAll",
  enrolled: "enrolledFillRate",
  foreign: "foreignShare",
};

const AUX: Record<ResultDomain, { key: StudentFillPeerMetricKey; label: string }[]> = {
  roster: [
    { key: "leaveShare", label: "휴학 비중" },
    { key: "enrolledOutShare", label: "정원외 재학생 비중" },
    { key: "deferShare", label: "유예 비중" },
  ],
  freshman: [
    { key: "rateAll", label: "정원내외 충원율" },
    { key: "rateIn", label: "정원내 충원율" },
    { key: "outShare", label: "정원외 입학 비중" },
  ],
  enrolled: [
    { key: "enrolledFillRate", label: "재학생충원율" },
    { key: "enrolledFillRateIn", label: "정원내 재학생충원율" },
    { key: "dropoutRate", label: "중도탈락율" },
    { key: "freshmanDropoutRate", label: "신입 탈락율" },
  ],
  foreign: [
    { key: "foreignShare", label: "학위(A) 비중" },
    { key: "langAbilityRate", label: "언어능력충족율" },
    { key: "foreignDropRate", label: "학위 탈락율" },
  ],
};

const METRIC_LABEL: Record<StudentFillPeerMetricKey, string> = {
  rateAll: "정원내외 충원율",
  rateIn: "정원내 충원율",
  outShare: "정원외 입학 비중",
  enrolledFillRate: "재학생충원율",
  enrolledFillRateIn: "정원내 재학생충원율",
  dropoutRate: "중도탈락율",
  freshmanDropoutRate: "신입 탈락율",
  foreignShare: "학위(A) 비중",
  langAbilityRate: "언어능력충족율",
  foreignDropRate: "학위 탈락율",
  leaveShare: "휴학 비중",
  enrolledOutShare: "정원외 재학생 비중",
  deferShare: "유예 비중",
};

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}명`;
}

function gap(school: number | null | undefined, peer: number | null | undefined): string {
  if (school == null || peer == null) return "—";
  const d = school - peer;
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}%p`;
}

function rateOf(rates: StudentFillPeerRates | null | undefined, key: StudentFillPeerMetricKey): number | null {
  return rates ? rates[key] : null;
}

export function StudentFillUniversityResultPane({
  school,
  peer,
}: {
  school: StudentFillSchoolRow;
  peer: StudentFillPeerPayload | null;
}) {
  const [domain, setDomain] = useState<ResultDomain>("freshman");
  const [lens, setLens] = useState<ResultLens>("stats");
  const primary = PRIMARY[domain];
  const position = peer?.positions[primary];
  const slices = peer?.slices;

  const geoBars = useMemo(() => {
    if (!peer) return [];
    return [
      { name: "자교", value: school[primary] ?? null, fill: "#2a7a55" },
      ...(slices?.sido && slices.sido.n >= 2
        ? [{ name: "시·도", value: rateOf(slices.sido, primary), fill: "#3B82F6" }]
        : []),
      { name: "권역", value: rateOf(slices?.zone ?? undefined, primary), fill: "#0284c7" },
      { name: "규모", value: rateOf(slices?.scale ?? undefined, primary), fill: "#d97706" },
      { name: "전국", value: rateOf(slices?.nationwide ?? undefined, primary), fill: "#64748b" },
    ].filter((row): row is { name: string; value: number; fill: string } => row.value != null);
  }, [peer, primary, school, slices]);

  const histData = useMemo(
    () =>
      (position?.histogram ?? []).map((bin) => ({
        name: `${bin.from}`,
        count: bin.count,
        from: bin.from,
        to: bin.to,
      })),
    [position],
  );

  const trendData = useMemo(
    () =>
      (peer?.trend ?? []).map((row) => ({
        year: row.year,
        school: rateOf(row.school, primary),
        nationwide: rateOf(row.nationwide, primary),
        zone: rateOf(row.zone, primary),
        scale: rateOf(row.scale, primary),
        sido: rateOf(row.sido, primary),
      })),
    [peer, primary],
  );

  const leakPrimary = domain === "roster" || domain === "enrolled" || domain === "foreign";

  return (
    <div className="flex flex-col gap-3">
      <SlimTabs ariaLabel="분석 영역" active={domain} onChange={setDomain} tabs={DOMAIN_TABS} />
      <SlimTabs ariaLabel="비교 렌즈" active={lens} onChange={setLens} tabs={LENS_TABS} />
      <p className={FDB_TYPO.legend}>
        동종 {school.schoolDivision} 가중 평균(합산 후 율). 주축 {METRIC_LABEL[primary]}.
        {domain === "foreign" ? " 정원외 ≠ 외국인 · 학위(A) 기본." : ""}
        {domain === "enrolled" ? " 탈락은 분석연도−1." : ""}
      </p>

      {!peer ? (
        <p className={FDB_TYPO.bodyText}>비교 집단을 불러오는 중이거나 자료가 없습니다.</p>
      ) : lens === "stats" ? (
        <StatsLens school={school} domain={domain} peer={peer} />
      ) : lens === "risk" ? (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">위치·위험 · {METRIC_LABEL[primary]}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="자교" value={fmtPct(position?.schoolValue)} />
            <Stat
              label="동종 순위"
              value={position?.rank != null ? `${position.rank} / ${position.n}` : "—"}
            />
            <Stat label="상위 백분위" value={position?.percentile != null ? `${position.percentile}%` : "—"} />
            <Stat
              label="동종 하위 15%"
              value={position?.inHighRisk ? "고위험" : position?.inRisk ? "위험" : "해당 없음"}
            />
          </dl>
          {domain === "freshman" && school.rateAll != null ? (
            <p className={`mt-2 ${FDB_TYPO.legend}`}>
              충원단계 {sfaFillStage(school.rateAll).label} (정원내외 기준). 하위 15%/7%는 동종 분포 컷입니다.
            </p>
          ) : null}
          <h4 className={`mt-4 ${FDB_TYPO.legend}`}>가까운 대학 5곳 (같은 시·도·규모, 부족하면 같은 규모)</h4>
          <ul className="mt-2 space-y-1">
            {(peer.neighbors[primary] ?? []).map((row) => (
              <li key={row.schoolCodeStd} className={`flex justify-between gap-3 ${FDB_TYPO.bodyText}`}>
                <span>
                  {row.schoolName}
                  <span className={`ml-2 ${FDB_TYPO.legend}`}>
                    {row.region}
                    {row.scale ? ` · ${row.scale}` : ""}
                  </span>
                </span>
                <span>{fmtPct(row.value)}</span>
              </li>
            ))}
            {(peer.neighbors[primary] ?? []).length === 0 ? (
              <li className={FDB_TYPO.legend}>비교할 근접 대학이 없습니다.</li>
            ) : null}
          </ul>
        </section>
      ) : lens === "geo" ? (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">지역·규모 · {METRIC_LABEL[primary]}</h3>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            시·도 {slices?.sido?.n ?? 0}교
            {slices?.sido && slices.sido.n < 2 ? " · 시·도 비교 표본이 적어 막대는 생략될 수 있습니다." : ""}
            {" · "}권역 {slices?.zone?.n ?? 0}교 · 규모 {slices?.scale?.n ?? 0}교 · 전국 {slices?.nationwide?.n ?? 0}교
          </p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="value" name={METRIC_LABEL[primary]} radius={4}>
                  {geoBars.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : lens === "dist" ? (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">분포 · {METRIC_LABEL[primary]}</h3>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            동종 {position?.n ?? 0}교 히스토그램(10%p 구간). 중앙값 {fmtPct(position?.median)} · 가중평균{" "}
            {fmtPct(position?.weighted)}. 초록 점선은 자교.
          </p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                {position?.schoolValue != null ? (
                  <ReferenceLine x={`${Math.min(90, Math.floor(position.schoolValue / 10) * 10)}`} stroke="#2a7a55" />
                ) : null}
                <Bar dataKey="count" name="학교 수" fill="#94a3b8" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">시계열 · {METRIC_LABEL[primary]} (5개년)</h3>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            자교 실선, 동종 전국·권역·규모 점선. 시·도는 2교 이상일 때만 계산합니다.
          </p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={leakPrimary ? [0, "auto"] : [70, 105]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="school" name="자교" stroke="#2a7a55" strokeWidth={2} connectNulls dot={false} />
                <Line type="monotone" dataKey="nationwide" name="동종 전국" stroke="#64748b" strokeDasharray="4 3" connectNulls dot={false} />
                <Line type="monotone" dataKey="zone" name="권역" stroke="#0284c7" strokeDasharray="4 3" connectNulls dot={false} />
                <Line type="monotone" dataKey="scale" name="규모" stroke="#d97706" strokeDasharray="4 3" connectNulls dot={false} />
                <Line type="monotone" dataKey="sido" name="시·도" stroke="#3B82F6" strokeDasharray="2 3" connectNulls dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-auto">
            <table className={`w-full min-w-[640px] border-collapse ${FDB_TYPO.tableBody}`}>
              <thead>
                <tr className="border-b border-border bg-surface-2/80">
                  {["연도", "자교", "전국", "권역", "규모", "시·도"].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendData.map((row) => (
                  <tr key={row.year} className="border-b border-border/60">
                    <td className="px-2 py-1.5">{row.year}</td>
                    <td className="px-2 py-1.5">{fmtPct(row.school)}</td>
                    <td className="px-2 py-1.5">{fmtPct(row.nationwide)}</td>
                    <td className="px-2 py-1.5">{fmtPct(row.zone)}</td>
                    <td className="px-2 py-1.5">{fmtPct(row.scale)}</td>
                    <td className="px-2 py-1.5">{fmtPct(row.sido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
      <dt className={FDB_TYPO.legend}>{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-emerald-800">{value}</dd>
    </div>
  );
}

function StatsLens({
  school,
  domain,
  peer,
}: {
  school: StudentFillSchoolRow;
  domain: ResultDomain;
  peer: StudentFillPeerPayload;
}) {
  const rows = AUX[domain];
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">지표통계</h3>
      {domain === "roster" ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="재학생(충원)" value={fmtCount(school.enrolledFill)} />
          <Stat label="재적학생" value={fmtCount(school.rosterTotal)} />
          <Stat label="휴학생" value={fmtCount(school.leaveCount)} />
          <Stat label="정원외 재학생" value={fmtCount(school.enrolledOutside)} />
        </dl>
      ) : domain === "freshman" ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="정원내 모집" value={fmtCount(school.recruitWithin)} />
          <Stat label="정원내 입학" value={fmtCount(school.admitWithin)} />
          <Stat label="정원외 입학" value={fmtCount(school.admitOutside)} />
          <Stat label="모집증감" value={fmtPct(school.recruitChange)} />
        </dl>
      ) : domain === "enrolled" ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="학생정원" value={fmtCount(school.studentQuota)} />
          <Stat label="재학생(충원)" value={fmtCount(school.enrolledFill)} />
          <Stat label="중도탈락" value={fmtCount(school.dropoutCount)} />
          <Stat label="신입 탈락" value={fmtCount(school.freshmanDropoutCount)} />
        </dl>
      ) : (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="학위(A)" value={fmtCount(school.foreignDegree)} />
          <Stat label="공동(B)" value={fmtCount(school.foreignJoint)} />
          <Stat label="연수(C)" value={fmtCount(school.foreignTraining)} />
          <Stat label="외국인 계" value={fmtCount(school.foreignTotal)} />
        </dl>
      )}
      <div className="mt-4 overflow-auto">
        <table className={`w-full min-w-[720px] border-collapse ${FDB_TYPO.tableBody}`}>
          <thead>
            <tr className="border-b border-border bg-surface-2/80">
              {["지표", "자교", "시·도", "권역", "규모", "전국", "전국 대비"].map((h) => (
                <th key={h} className="px-2 py-1.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const self = school[row.key];
              const sido = peer.slices.sido?.[row.key] ?? null;
              const zone = peer.slices.zone?.[row.key] ?? null;
              const scale = peer.slices.scale?.[row.key] ?? null;
              const nation = peer.slices.nationwide?.[row.key] ?? null;
              return (
                <tr key={row.key} className="border-b border-border/60">
                  <td className="px-2 py-1.5">{row.label}</td>
                  <td className="px-2 py-1.5 font-semibold">{fmtPct(self)}</td>
                  <td className="px-2 py-1.5">
                    {fmtPct(sido)}
                    {peer.slices.sido ? ` (n=${peer.slices.sido.n})` : ""}
                  </td>
                  <td className="px-2 py-1.5">
                    {fmtPct(zone)}
                    {peer.slices.zone ? ` (n=${peer.slices.zone.n})` : ""}
                  </td>
                  <td className="px-2 py-1.5">
                    {fmtPct(scale)}
                    {peer.slices.scale ? ` (n=${peer.slices.scale.n})` : ""}
                  </td>
                  <td className="px-2 py-1.5">
                    {fmtPct(nation)}
                    {peer.slices.nationwide ? ` (n=${peer.slices.nationwide.n})` : ""}
                  </td>
                  <td className="px-2 py-1.5">{gap(self, nation)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
