export const RISK_NEAR_HORIZON_YEARS = 5;
export const RISK_MID_HORIZON_YEARS = 10;

export type RiskStageTone = "ok" | "caution" | "warn" | "crisis";

export type RiskStage = {
  label: string;
  tone: RiskStageTone;
  hint: string;
};

/**
 * 전망 구간 안에서의 가용고갈·운영적자 시점만 사용합니다.
 * 교육부 한계대학 지정이 아닙니다.
 *
 * - 경영위기: 분석연도부터 5년 이내 가용고갈
 * - 경고: 6~10년 차 가용고갈
 * - 주의: 11년 차 이후 고갈, 또는 고갈은 없으나 운영수지 적자
 * - 정상: 구간 내 고갈·운영적자 없음
 */
export function riskStage(
  operatingLossYear: number | null,
  _cashDeficitYear: number | null,
  liquidityDepletionYear: number | null,
  analysisYear: number,
): RiskStage {
  const nearEnd = analysisYear + RISK_NEAR_HORIZON_YEARS;
  const midEnd = analysisYear + RISK_MID_HORIZON_YEARS;

  if (liquidityDepletionYear != null && liquidityDepletionYear <= nearEnd) {
    return {
      label: "경영위기",
      tone: "crisis",
      hint: `가용자금이 ${liquidityDepletionYear}년(분석연도부터 ${RISK_NEAR_HORIZON_YEARS}년 이내)에 소진됩니다.`,
    };
  }
  if (liquidityDepletionYear != null && liquidityDepletionYear <= midEnd) {
    return {
      label: "경고",
      tone: "warn",
      hint: `가용자금이 ${liquidityDepletionYear}년(6~10년 차)에 소진됩니다.`,
    };
  }
  if (liquidityDepletionYear != null) {
    return {
      label: "주의",
      tone: "caution",
      hint: `전망 후반(${liquidityDepletionYear}년)에 가용자금이 소진됩니다.`,
    };
  }
  if (operatingLossYear != null) {
    return {
      label: "주의",
      tone: "caution",
      hint: `${operatingLossYear}년부터 운영수지 적자가 있으나 전망 구간 내 가용고갈은 없습니다.`,
    };
  }
  return {
    label: "정상",
    tone: "ok",
    hint: "전망 구간 내 운영수지 적자와 가용고갈이 없습니다.",
  };
}

export function yearsUntilDepletion(
  liquidityDepletionYear: number | null,
  analysisYear: number,
): number | null {
  if (liquidityDepletionYear == null) return null;
  return liquidityDepletionYear - analysisYear;
}
