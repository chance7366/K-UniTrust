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

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}명`;
}

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

function roundManwon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}만원`;
}

export function buildStudentFillDiagnosis(row: StudentFillSchoolRow): StudentFillFinding[] {
  const items: StudentFillFinding[] = [];
  const cf = counterfactualRateAll(row);
  const fillGap =
    row.enrolledFillRate != null && row.enrolledFillRateIn != null
      ? Number((row.enrolledFillRate - row.enrolledFillRateIn).toFixed(1))
      : null;
  const outGap =
    row.enrolledOutShare != null && row.outShare != null
      ? Number((row.enrolledOutShare - row.outShare).toFixed(1))
      : null;

  if (row.rateAll != null) {
    const stage = sfaFillStage(row.rateAll);
    const shrink = row.recruitChange != null && row.recruitChange <= -8;
    items.push({
      title: shrink
        ? `충원단계 「${stage.label}」은 모집 분모 축소로 방어된 라벨입니다`
        : `신입생충원 ${stage.label}`,
      body: shrink
        ? `정원내외 충원율 ${fmtPct(row.rateAll)}, 정원내 ${fmtPct(row.rateIn)}, 정원외 입학 비중 ${fmtPct(row.outShare)}, 모집 ${fmtPct(row.recruitChange)}. 모집을 줄이기 전 규모로 나누면 대항 충원율은 ${fmtPct(cf)}입니다. 단계 라벨은 수요 회복의 증거가 아닙니다.`
        : `정원내외 충원율 ${fmtPct(row.rateAll)}, 정원내 ${fmtPct(row.rateIn)}, 정원외 입학 비중 ${fmtPct(row.outShare)}. 정원외를 외국인으로 보지 않습니다.`,
      tone: shrink || stage.tone === "crisis" || stage.tone === "warn" ? "warn" : stage.tone === "ok" ? "ok" : "info",
    });
  } else {
    items.push({
      title: "신입생충원 자료 없음",
      body: "정원내외 충원율을 계산할 신입생충원 자료가 없습니다. 0으로 채우지 않습니다.",
      tone: "info",
    });
  }

  if (fillGap != null && fillGap >= 5) {
    items.push({
      title: "정원내 재학이 비고 정원외 스톡이 받치고 있습니다",
      body: `재학생충원율 ${fmtPct(row.enrolledFillRate)} 대비 정원내 ${fmtPct(row.enrolledFillRateIn)}로 ${fillGap.toFixed(1)}%p 벌어집니다. 신입 정원외 비중 ${fmtPct(row.outShare)}, 재학 정원외 ${fmtCount(row.enrolledOutside)}(${fmtPct(row.enrolledOutShare)})${outGap != null && outGap >= 3 ? ` — 신입 흐름보다 재학 스톡이 ${outGap.toFixed(1)}%p 높습니다.` : "."} 학위 외국인은 ${fmtCount(row.foreignDegree)}이며 정원외와 섞어 읽지 않습니다.`,
      tone: "warn",
    });
  } else {
    items.push({
      title: "재적 구성",
      body: `재학생(충원) ${fmtCount(row.enrolledFill)} · 휴학 ${fmtCount(row.leaveCount)}(${fmtPct(row.leaveShare)}) · 유예 ${fmtCount(row.deferCount)}(${fmtPct(row.deferShare)}). 정원외 재학생 ${fmtCount(row.enrolledOutside)}(${fmtPct(row.enrolledOutShare)}).`,
      tone: row.leaveShare != null && row.leaveShare >= 10 ? "warn" : "info",
    });
  }

  const freshmanHigh =
    row.freshmanDropoutRate != null &&
    (row.freshmanDropoutRate >= 7 ||
      (row.dropoutRate != null && row.freshmanDropoutRate > row.dropoutRate + 0.4));
  if (row.freshmanDropoutRate != null || row.dropoutRate != null) {
    items.push({
      title: freshmanHigh
        ? "1학년 누수가 재학생충원의 선행지표입니다"
        : "탈락",
      body: freshmanHigh
        ? `신입생 탈락 ${fmtCount(row.freshmanDropoutCount)}·${fmtPct(row.freshmanDropoutRate)} (Y−1)가 전체 중도탈락율 ${fmtPct(row.dropoutRate)}보다 높거나 7% 이상입니다. 과제는 상담 창구 확대가 아니라 입학 후 8주 출석·기초학력·원거리 이탈입니다.`
        : `전체 중도탈락율 ${fmtPct(row.dropoutRate)} (Y−1), 신입생 중도탈락율 ${fmtPct(row.freshmanDropoutRate)}.`,
      tone: freshmanHigh ? "warn" : "info",
    });
  }

  if (row.leaveShare != null && row.leaveShare >= 10) {
    items.push({
      title: "휴학이 충원 산식 밖에 쌓여 있습니다",
      body: `휴학 ${fmtCount(row.leaveCount)}(${fmtPct(row.leaveShare)}). 장부상 재적의 상당수가 수업·등록금 사이클 밖에 있으며, 복학 실패 시 중도탈락으로 이관됩니다. 유예 ${fmtCount(row.deferCount)}(${fmtPct(row.deferShare)}).`,
      tone: "warn",
    });
  }

  const langWeak =
    row.foreignDegree != null &&
    row.foreignDegree > 0 &&
    row.langAbilityRate != null &&
    row.langAbilityRate < 50;
  const foreignSmall =
    row.foreignShare != null && row.foreignShare < 5 && (row.foreignDegree ?? 0) > 0;
  items.push({
    title: langWeak || foreignSmall ? "유학생은 충원 카드가 아니라 학사 리스크입니다" : "외국인 학위(A)",
    body: `학위(A) ${fmtCount(row.foreignDegree)} · 재적대비 ${fmtPct(row.foreignShare)} · 연수(C) ${fmtCount(row.foreignTraining)} · 언어능력충족 ${fmtPct(row.langAbilityRate)}. 학위 탈락율 ${fmtPct(row.foreignDropRate)}(Y−1). ${langWeak ? "언어충족이 절반 미만이면 모집 확대를 쓰지 않습니다." : "정원외 ≠ 외국인."}`,
    tone: langWeak ? "warn" : row.foreignDegree == null ? "info" : "ok",
  });

  return items;
}

export function buildStudentFillActions(row: StudentFillSchoolRow): StudentFillAction[] {
  const actions: StudentFillAction[] = [];
  const admit = row.admitTotal > 0 ? row.admitTotal : null;
  const freshmanPackage = admit != null ? admit * 12 : 5000;
  const tutorLine = admit != null ? Math.round(admit * 2.4) : 1000;
  const assistantLine = admit != null ? Math.round(admit * 4.3) : 1800;
  const lmsLine = 800;
  const leaveFte = (row.enrolledTotal ?? 0) < 2500 ? 0.5 : 1;
  const leaveStaff = Math.round(3600 * leaveFte);
  const voucher = 2500;
  const langBudget = (row.foreignDegree ?? 0) <= 20 ? 900 : 900 + Math.round(((row.foreignDegree ?? 0) - 12) * 40);

  const needQuota =
    (row.recruitChange != null && row.recruitChange <= -8) ||
    (row.rateAll != null && row.rateAll < 98);
  if (needQuota) {
    actions.push({
      title: "모집축소 효과를 분리한 뒤 학과 정원을 재배분합니다",
      body: "학과×전형(수시/정시/정원외) 3년 매트릭스로 충원율 변동을 분모효과(모집 감소)와 분자효과(입학)로 나눕니다. 3년 연속 정원내 충원율 90% 미만 또는 합격 대비 등록 70% 미만 학과는 다음다음 학년도 정원을 5~10% 감축해, 최근 2년 정원내 충원율 98% 이상 학과로만 옮깁니다. 다음 해 모집 총량은 당해 이상 동결이 기본이며 추가 축소로 충원율을 방어하지 않습니다. 정원외 전형은 학위 외국인과 요강에서 분리 표기합니다.",
      owner: "기획처(총괄) · 교무처(정원) · 입학처(전형)",
      budget: "내부 TF 전용 + 권역 수요조사 외주 1,500만원",
      kpi: "다음 해 모집 총량 ≥ 당해, 분모효과 기여도 공개",
      effect: "충원율 착시 제거, 미충원 학과 좌석 이전",
      steps: [
        "원자료 추출·충원율 변동 = 분모효과 + 분자효과 계산식 확정",
        "학과장 설명회 1회, 이의 제기 2주",
        "정원 조정안 교무위원회·이사회 보고",
      ],
    });
  }

  const freshmanHigh =
    row.freshmanDropoutRate != null &&
    (row.freshmanDropoutRate >= 7 ||
      (row.dropoutRate != null && row.freshmanDropoutRate > row.dropoutRate + 0.4));
  if (freshmanHigh) {
    const targetDrop = 8;
    const saved =
      row.freshmanDropoutCount != null && row.freshmanDropoutRate != null && row.freshmanDropoutRate > targetDrop
        ? Math.max(1, Math.round(row.freshmanDropoutCount * (1 - targetDrop / row.freshmanDropoutRate)))
        : 12;
    actions.push({
      title: "Freshman 8 — 입학 후 8주 출석·기초학력 패키지",
      body: `상담 창구를 늘리지 않습니다. 신입 ${fmtCount(admit)}을 대상으로 0주차 전공기초 진단(40분) 후 하위 30%를 튜터링에 자동 편성합니다. 재학생 튜터는 학과 성적 상위 20%만, 주 2회×8주. 동일 교과 2주 연속 결석 시 LMS가 조교·지도교수에게 알리고 48시간 내 대면·화상 미실시는 학사팀으로 올립니다. 통학 90분 초과 또는 권역 외 주소 신입은 빈 침상 재배치로 1학기 기숙사 우선(신축 금지).`,
      owner: "학생처 · 학과 조교 · 전산(LMS 규칙)",
      budget: `연 약 ${roundManwon(freshmanPackage)} (튜터 ${roundManwon(tutorLine)} + 조교 ${roundManwon(assistantLine)} + LMS ${roundManwon(lmsLine)} + 운영)`,
      kpi: `신입 탈락율 ${fmtPct(row.freshmanDropoutRate)} → 8.0% 이하`,
      effect: `잔류 약 ${saved}명 × 연 등록금 가정치로 수입 방어(사업비 상회를 목표)`,
      steps: [
        "진단고사 문항·하위 30% 컷 확정",
        "튜터 선발·시급 장학 전용 지급",
        "결석 2주 규칙 운영 개시",
      ],
    });
  }

  if (row.leaveShare != null && row.leaveShare >= 10) {
    actions.push({
      title: "휴학 전수 복학설계 — 사유 4코드와 16주 복귀 창구",
      body: `휴학 ${fmtCount(row.leaveCount)}을 군입대·질병·경제·학업부진 4코드로만 재분류합니다(기타 금지). 1년 초과 휴학생은 학과장 명단으로 3주 내 전화 접촉 100%를 목표로 합니다. 복학 당해 학기는 최소 9학점, 등록금 3회 분납(위약금 없음). 학업부진 복학자는 Freshman 8과 같은 튜터 라인에 첫 8주를 연결합니다. 3학기 연속 미복학은 제적 예고로 「무기한 휴학」을 닫습니다.`,
      owner: "교무처 학사 · 학과장",
      budget: `코디 ${leaveFte}FTE ${roundManwon(leaveStaff)} + 복학 등록 바우처 ${roundManwon(voucher)}`,
      kpi: `휴학비중 ${fmtPct(row.leaveShare)} → 13.0% 이하`,
      effect: "재학생충원 분자 회복, 탈락 이관 지연",
      steps: [
        "휴학 사유 4코드 재분류",
        "1년 초과자 통화 로그 마감",
        "분납·9학점 학칙 한시 적용",
      ],
    });
  }

  const fillGap =
    row.enrolledFillRate != null && row.enrolledFillRateIn != null
      ? row.enrolledFillRate - row.enrolledFillRateIn
      : 0;
  if ((row.enrolledOutShare != null && row.enrolledOutShare >= 9) || fillGap >= 5) {
    actions.push({
      title: "정원외 재학 캡 — 학과 단위 12%",
      body: `교무처가 매 학기 학과별 정원외 재학생 비중을 공개합니다. 12%를 넘는 학과는 다음 학년도 정원외 모집을 0으로 두고 정원내 미충원 좌석을 먼저 채웁니다. 신입 정원외 비중 ${fmtPct(row.outShare)}만 보고 넘어가지 않습니다. 재학 스톡 ${fmtPct(row.enrolledOutShare)}이 이미 높으면 정책 과제입니다.`,
      owner: "교무처 · 입학처",
      budget: "0~200만원 (공시 표·요강 개정)",
      kpi: "학과 최대 정원외 재학 비중 ≤ 12%",
      effect: `정원내 ${fmtPct(row.enrolledFillRateIn)}과 내외 ${fmtPct(row.enrolledFillRate)} 격차 축소`,
    });
  }

  if (
    row.foreignDegree != null &&
    row.foreignDegree > 0 &&
    row.langAbilityRate != null &&
    row.langAbilityRate < 70
  ) {
    const lock = row.foreignShare != null && row.foreignShare < 8;
    actions.push({
      title: lock
        ? "학위 유학생 언어 집중 — 모집 확대 모라토리엄 1년"
        : "학위 유학생 언어능력 시정 후 유지",
      body: `${lock ? `학위 재적 ${fmtCount(row.foreignDegree)}을 넘지 못하게 다음 학년 신입 총량을 잠급니다. ` : ""}TOPIK 3 미만(또는 교내 동등 미달)은 학기 시작 전 4주·주 15시간 집중어학을 이수한 뒤에만 전공 수강을 엽니다. 시간강사 운영이 기본이며 전임 채용은 하지 않습니다. 언어충족 ${fmtPct(row.langAbilityRate)}가 70%를 넘기 전에는 유학 규모 확대를 충원 과제로 쓰지 않습니다.`,
      owner: "국제교류 · 교무(수강 제한)",
      budget: `강사·교재 약 ${roundManwon(langBudget)}`,
      kpi: `언어능력 충족률 ${fmtPct(row.langAbilityRate)} → 70% 이상`,
      effect: "학사·비자 리스크 차단, 허위 국제화 지표 방지",
    });
  }

  if (!actions.length) {
    actions.push({
      title: "동일집단 대비 현 수준 유지",
      body: "교차분석 임계(모집 −8%, 신입 탈락 7%, 휴학 10%, 정원외 격차, 언어 70%)에 걸리지 않습니다. 권역·설립 동일집단 5개년과 연 1회 비교하고, 모집 추가 축소로 충원율을 만들지 않습니다.",
      owner: "기획처",
      budget: "별도 사업비 없음",
      kpi: "정원내외 충원율·재학생 정원내 충원율 전년 대비 유지",
      effect: "착시 없는 모니터링",
    });
  }
  return actions;
}
