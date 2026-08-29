import type {
  StudentFillPeerMetricKey,
  StudentFillPeerPayload,
  StudentFillPeerRates,
} from "./peer-aggregates";
import { sfaFillStage } from "./fill-stage";
import type { StudentFillSchoolRow } from "./types";

export type StudentFillFinding = {
  title: string;
  body: string;
  tone: "warn" | "ok" | "info";
};

export type StudentFillAction = {
  title: string;
  body: string;
  owner?: string;
  budget?: string;
  kpi?: string;
  effect?: string;
  steps?: string[];
};

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function pct(num: number, den: number): number | null {
  if (!(den > 0) || !Number.isFinite(num)) return null;
  return Number(((num / den) * 100).toFixed(1));
}

export function counterfactualRateAll(row: StudentFillSchoolRow): number | null {
  if (row.recruitChange == null || row.recruitChange >= 0) return null;
  const factor = 1 + row.recruitChange / 100;
  if (!(factor > 0)) return null;
  const priorRecruit = row.recruitTotal / factor;
  return pct(row.admitTotal, priorRecruit);
}

function series(
  peer: StudentFillPeerPayload | null | undefined,
  key: StudentFillPeerMetricKey,
): (number | null)[] {
  return (peer?.trend ?? []).map((row) => row.school[key]);
}

function trendWord(values: (number | null)[]): "증가" | "감소" | "유지" | null {
  const nums = values.filter((n): n is number => n != null && Number.isFinite(n));
  if (nums.length < 2) return null;
  const delta = nums[nums.length - 1]! - nums[0]!;
  if (delta > 0.5) return "증가";
  if (delta < -0.5) return "감소";
  return "유지";
}

function vsAvg(
  school: number | null | undefined,
  avg: number | null | undefined,
  higherIsBetter: boolean,
): string {
  if (school == null || avg == null) return "비교할 평균이 없습니다";
  const diff = Number((school - avg).toFixed(1));
  if (Math.abs(diff) < 0.5) return `평균(${fmtPct(avg)})과 비슷합니다`;
  if (diff > 0) {
    return higherIsBetter
      ? `평균(${fmtPct(avg)})보다 ${diff.toFixed(1)}%p 높습니다`
      : `평균(${fmtPct(avg)})보다 ${diff.toFixed(1)}%p 높습니다`;
  }
  return higherIsBetter
    ? `평균(${fmtPct(avg)})보다 ${Math.abs(diff).toFixed(1)}%p 낮습니다`
    : `평균(${fmtPct(avg)})보다 ${Math.abs(diff).toFixed(1)}%p 낮습니다`;
}

function groupLine(
  label: string,
  school: number | null | undefined,
  rates: StudentFillPeerRates | null | undefined,
  key: StudentFillPeerMetricKey,
  higherIsBetter: boolean,
): string {
  return `${label} ${vsAvg(school, rates?.[key], higherIsBetter)}`;
}

function toneFromGap(
  school: number | null | undefined,
  avg: number | null | undefined,
  higherIsBetter: boolean,
): "warn" | "ok" | "info" {
  if (school == null || avg == null) return "info";
  const diff = school - avg;
  if (Math.abs(diff) < 0.5) return "info";
  if (higherIsBetter) return diff < 0 ? "warn" : "ok";
  return diff > 0 ? "warn" : "ok";
}

export function buildStudentFillDiagnosis(
  row: StudentFillSchoolRow,
  peer?: StudentFillPeerPayload | null,
): StudentFillFinding[] {
  const items: StudentFillFinding[] = [];
  const zone = peer?.slices.zone;
  const scale = peer?.slices.scale;
  const estb = peer?.slices.estb;
  const sido = peer?.slices.sido;
  const nation = peer?.slices.nationwide;

  const outTrend = trendWord(series(peer, "outShare"));
  const foreignTrend = trendWord(series(peer, "foreignShare"));
  const rateAllTrend = trendWord(series(peer, "rateAll"));
  const enrolledTrend = trendWord(series(peer, "enrolledFillRate"));

  items.push({
    title: "시계열 — 최근 5년 추세",
    body: [
      `정원내외충원율은 ${rateAllTrend ? `${rateAllTrend} 흐름` : "시계열 부족"}입니다(${fmtPct(row.rateAll)}).`,
      `재학생충원율은 ${enrolledTrend ? `${enrolledTrend} 흐름` : "시계열 부족"}입니다(${fmtPct(row.enrolledFillRate)}).`,
      `정원외비중(신입)은 ${outTrend ? `${outTrend} 흐름` : "시계열 부족"}입니다(${fmtPct(row.outShare)}).`,
      `외국인 재적대비비중은 ${foreignTrend ? `${foreignTrend} 흐름` : "시계열 부족"}입니다(${fmtPct(row.foreignShare)}).`,
    ].join(" "),
    tone:
      outTrend === "증가" || foreignTrend === "증가" || rateAllTrend === "감소"
        ? "warn"
        : "info",
  });

  items.push({
    title: "집단 비교 — 정원내외충원율",
    body: [
      `본교 ${fmtPct(row.rateAll)}.`,
      groupLine("권역은", row.rateAll, zone, "rateAll", true) + ".",
      groupLine("같은 규모는", row.rateAll, scale, "rateAll", true) + ".",
      groupLine("같은 설립은", row.rateAll, estb, "rateAll", true) + ".",
      groupLine("같은 시도는", row.rateAll, sido, "rateAll", true) + ".",
      groupLine("전국 동종은", row.rateAll, nation, "rateAll", true) + ".",
    ].join(" "),
    tone: toneFromGap(row.rateAll, zone?.rateAll ?? nation?.rateAll, true),
  });

  items.push({
    title: "신입생충원 — 정원내·정원외",
    body: [
      `정원내충원율 ${fmtPct(row.rateIn)}, 정원내외충원율 ${fmtPct(row.rateAll)}, 정원외비중 ${fmtPct(row.outShare)}.`,
      outTrend === "증가"
        ? "정원외비중이 점차 늘고 있습니다. 정원내 충원을 먼저 채워야 합니다."
        : outTrend === "감소"
          ? "정원외비중은 줄어드는 흐름입니다."
          : "정원외비중은 큰 변화가 없습니다.",
      `정원내충원율은 권역 ${vsAvg(row.rateIn, zone?.rateIn, true)}.`,
    ].join(" "),
    tone: outTrend === "증가" || (row.rateIn != null && row.rateIn < 90) ? "warn" : "info",
  });

  const dropHigh =
    row.freshmanDropoutRate != null &&
    row.dropoutRate != null &&
    row.freshmanDropoutRate > row.dropoutRate;
  items.push({
    title: "신입생탈락율과 중도탈락율",
    body: [
      `신입생탈락율 ${fmtPct(row.freshmanDropoutRate)}(Y−1), 중도탈락율 ${fmtPct(row.dropoutRate)}(Y−1).`,
      dropHigh
        ? "신입생탈락율이 중도탈락율보다 높습니다. 입학 직후 1학년에서 먼저 빠지고 있습니다."
        : row.freshmanDropoutRate != null && row.dropoutRate != null
          ? "신입생탈락율은 중도탈락율보다 낮거나 비슷합니다."
          : "탈락 자료를 비교할 수 없습니다.",
      `신입생탈락율은 권역 ${vsAvg(row.freshmanDropoutRate, zone?.freshmanDropoutRate, false)}.`,
    ].join(" "),
    tone: dropHigh ? "warn" : "info",
  });

  const fillGap =
    row.enrolledFillRate != null && row.enrolledFillRateIn != null
      ? Number((row.enrolledFillRate - row.enrolledFillRateIn).toFixed(1))
      : null;
  items.push({
    title: "재학생충원 — 내외와 정원내",
    body: [
      `재학생충원율 ${fmtPct(row.enrolledFillRate)}, 정원내충원율 ${fmtPct(row.enrolledFillRateIn)}, 정원외비중 ${fmtPct(row.enrolledOutShare)}.`,
      fillGap != null && fillGap >= 5
        ? `두 충원율 격차가 ${fillGap.toFixed(1)}%p입니다. 정원외가 합산 수치를 받치고 있습니다.`
        : "재학생충원율과 정원내충원율 격차는 크지 않습니다.",
      `재학생충원율은 권역 ${vsAvg(row.enrolledFillRate, zone?.enrolledFillRate, true)}, 규모 ${vsAvg(row.enrolledFillRate, scale?.enrolledFillRate, true)}.`,
    ].join(" "),
    tone: fillGap != null && fillGap >= 5 ? "warn" : "info",
  });

  items.push({
    title: "휴학비중·유예비중 — 집단 비교",
    body: [
      `휴학비중 ${fmtPct(row.leaveShare)}, 유예비중 ${fmtPct(row.deferShare)}.`,
      `휴학은 권역 ${vsAvg(row.leaveShare, zone?.leaveShare, false)}, 규모 ${vsAvg(row.leaveShare, scale?.leaveShare, false)}, 설립 ${vsAvg(row.leaveShare, estb?.leaveShare, false)}, 시도 ${vsAvg(row.leaveShare, sido?.leaveShare, false)}.`,
      `유예는 권역 ${vsAvg(row.deferShare, zone?.deferShare, false)}, 규모 ${vsAvg(row.deferShare, scale?.deferShare, false)}, 설립 ${vsAvg(row.deferShare, estb?.deferShare, false)}, 시도 ${vsAvg(row.deferShare, sido?.deferShare, false)}.`,
    ].join(" "),
    tone: toneFromGap(row.leaveShare, zone?.leaveShare ?? nation?.leaveShare, false),
  });

  items.push({
    title: "외국인 — 비중·언어·탈락",
    body: [
      `재적대비비중 ${fmtPct(row.foreignShare)}(${foreignTrend ? `${foreignTrend} 흐름` : "시계열 부족"}).`,
      `언어능력충족율 ${fmtPct(row.langAbilityRate)}. 권역 ${vsAvg(row.langAbilityRate, zone?.langAbilityRate, true)}, 규모 ${vsAvg(row.langAbilityRate, scale?.langAbilityRate, true)}, 설립 ${vsAvg(row.langAbilityRate, estb?.langAbilityRate, true)}, 시도 ${vsAvg(row.langAbilityRate, sido?.langAbilityRate, true)}.`,
      `외국인탈락율 ${fmtPct(row.foreignDropRate)}(Y−1), 전체외국인탈락율 ${fmtPct(row.foreignDropAllRate)}(Y−1).`,
      "정원외와 외국인을 같은 숫자로 읽지 않습니다.",
    ].join(" "),
    tone:
      foreignTrend === "증가" ||
      toneFromGap(row.langAbilityRate, zone?.langAbilityRate, true) === "warn"
        ? "warn"
        : "info",
  });

  if (row.rateAll != null) {
    const stage = sfaFillStage(row.rateAll);
    items.push({
      title: `충원단계 참고 — ${stage.label}`,
      body: "충원단계는 정원내외충원율의 라벨일 뿐입니다. 위 추세와 집단 비교가 결론입니다.",
      tone: "info",
    });
  }

  return items;
}

export function buildStudentFillActions(
  row: StudentFillSchoolRow,
  peer?: StudentFillPeerPayload | null,
): StudentFillAction[] {
  const actions: StudentFillAction[] = [];
  const zone = peer?.slices.zone;
  const outTrend = trendWord(series(peer, "outShare"));
  const foreignTrend = trendWord(series(peer, "foreignShare"));

  if (row.rateIn != null && row.rateIn < 95) {
    actions.push({
      title: "미충원 학과 정원을 충원이 되는 학과로 옮깁니다",
      body: `정원내충원율이 ${fmtPct(row.rateIn)}입니다. 3년 동안 자리가 비는 학과의 정원을 조금 줄이고, 그 정원을 충원이 되는 학과로 옮깁니다. 학교 전체 모집 인원은 줄이지 않습니다.`,
      owner: "교무처 · 입학처",
      kpi: "다음 해 모집 총량 ≥ 올해, 정원내충원율 전년 대비 유지 또는 상승",
      effect: "빈 자리를 줄이고 충원율을 실제 수요에 맞춥니다",
      steps: [
        "학과별 3년 정원내충원율을 표로 정리합니다",
        "빈 자리가 많은 학과와 충원이 되는 학과를 나눕니다",
        "다음다음 학년도 정원 이동안을 한 장으로 올립니다",
      ],
    });
  }

  if (outTrend === "증가" || (row.outShare != null && row.outShare >= 8)) {
    actions.push({
      title: "정원외를 더 늘리지 않습니다",
      body: `신입 정원외비중이 ${fmtPct(row.outShare)}이고 ${outTrend === "증가" ? "최근 늘고 있습니다" : "이미 높습니다"}. 다음 해 정원외 선발을 올해보다 늘리지 않고, 정원내 충원을 먼저 채웁니다.`,
      owner: "입학처 · 교무처",
      kpi: "다음 해 신입 정원외비중 ≤ 올해",
      effect: "정원내 충원이 가려지지 않습니다",
      steps: ["정원외 전형별 선발 인원을 올해 이하로 고정합니다"],
    });
  }

  const dropHigh =
    row.freshmanDropoutRate != null &&
    row.dropoutRate != null &&
    row.freshmanDropoutRate > row.dropoutRate;
  if (dropHigh || (row.freshmanDropoutRate != null && row.freshmanDropoutRate >= 7)) {
    actions.push({
      title: "입학 후 8주 동안 출석과 기초학습을 챙깁니다",
      body: `신입생탈락율이 ${fmtPct(row.freshmanDropoutRate)}로 중도탈락율(${fmtPct(row.dropoutRate)})보다 높거나 7% 이상입니다. 상담 창구를 늘리기보다, 입학 후 8주 출석을 확인하고 기초가 부족한 학생에게 선배 도우미를 붙입니다.`,
      owner: "학생처 · 학과",
      kpi: `신입생탈락율 ${fmtPct(row.freshmanDropoutRate)} → 중도탈락율 이하`,
      effect: "1학년에서 빠지는 학생을 줄입니다",
      steps: [
        "2주 연속 결석하면 학과가 연락합니다",
        "기초학습이 부족한 신입생에게 주 1~2회 도우미를 붙입니다",
      ],
    });
  }

  const enrolledWeak =
    row.enrolledFillRate != null &&
    zone?.enrolledFillRate != null &&
    row.enrolledFillRate < zone.enrolledFillRate - 0.5;
  if (enrolledWeak) {
    actions.push({
      title: "재학생은 정원내 숫자를 먼저 봅니다",
      body: `재학생충원율 ${fmtPct(row.enrolledFillRate)}은 권역 평균(${fmtPct(zone?.enrolledFillRate)})보다 낮습니다. 정원외를 늘려 숫자를 맞추지 말고, 정원내 재학생충원율(${fmtPct(row.enrolledFillRateIn)})을 올리는 일을 먼저 합니다.`,
      owner: "교무처 · 학생처",
      kpi: `재학생 정원내충원율 ${fmtPct(row.enrolledFillRateIn)} 전년 대비 상승`,
      effect: "합산 충원율이 정원외에 기대지 않게 됩니다",
      steps: [
        "학과별 정원내 재학생 수를 올해와 작년으로 비교합니다",
        "정원외 선발은 올해 이하로 둡니다",
      ],
    });
  }

  const leaveHigh =
    row.leaveShare != null &&
    zone?.leaveShare != null &&
    row.leaveShare > zone.leaveShare + 0.5;
  const leaveHighNoPeer =
    zone?.leaveShare == null && row.leaveShare != null && row.leaveShare >= 10;
  if (leaveHigh || leaveHighNoPeer) {
    actions.push({
      title: "휴학생에게 복학 안내를 하고 분납을 쉽게 합니다",
      body: `휴학비중이 ${fmtPct(row.leaveShare)}로 권역 평균(${fmtPct(zone?.leaveShare)})보다 높습니다. 1년 넘게 휴학 중인 학생에게 학과가 연락하고, 복학하는 학기는 등록금을 나눠 내게 합니다.`,
      owner: "교무처 · 학과",
      kpi: `휴학비중 ${fmtPct(row.leaveShare)} 전년 대비 하락`,
      effect: "수업에 돌아오는 학생을 늘립니다",
      steps: [
        "1년 초과 휴학생 명단을 학과에 나눠 줍니다",
        "복학 학기 분납을 안내합니다",
      ],
    });
  }

  const langWeak =
    row.langAbilityRate != null &&
    (row.langAbilityRate < 70 ||
      (zone?.langAbilityRate != null && row.langAbilityRate < zone.langAbilityRate - 0.5));
  if (langWeak && (row.foreignDegree ?? 0) > 0) {
    actions.push({
      title: "전공 수업 전에 한국어 수업을 듣고, 유학생은 더 뽑지 않습니다",
      body: `언어능력충족율이 ${fmtPct(row.langAbilityRate)}입니다. 한국어가 부족한 학생은 전공 수업 전에 짧은 집중 수업을 듣게 합니다. ${foreignTrend === "증가" ? "재적대비비중이 늘고 있으므로 " : ""}유학생 선발을 늘리지 않습니다.`,
      owner: "국제교류 · 교무처",
      kpi: `언어능력충족율 ${fmtPct(row.langAbilityRate)} → 권역 평균 이상`,
      effect: "수업을 따라가지 못해 빠지는 일을 줄입니다",
      steps: ["학기 시작 전 한국어 집중 수업을 엽니다", "다음 해 유학 선발은 올해 이하로 둡니다"],
    });
  }

  if (!actions.length) {
    actions.push({
      title: "지금 수준을 유지하고 해마다 비교표를 확인합니다",
      body: "정원내충원율, 정원외비중, 신입생탈락율, 휴학비중, 언어능력충족율이 권역·규모 평균과 크게 다르지 않습니다. 해마다 같은 비교표를 보고, 모집을 줄여 충원율을 만들어 내지 않습니다.",
      owner: "기획처",
      kpi: "정원내충원율·재학생 정원내충원율 전년 대비 유지",
      effect: "숫자 착시 없이 현황을 봅니다",
    });
  }
  return actions;
}
