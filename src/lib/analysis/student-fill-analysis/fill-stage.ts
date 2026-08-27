export type SfaFillStage = {
  label: "충원양호" | "충원보통" | "충원취약" | "충원위기";
  tone: "ok" | "caution" | "warn" | "crisis";
};

export function sfaFillStage(rateAll: number): SfaFillStage {
  if (rateAll >= 98) return { label: "충원양호", tone: "ok" };
  if (rateAll >= 94) return { label: "충원보통", tone: "caution" };
  if (rateAll >= 90) return { label: "충원취약", tone: "warn" };
  return { label: "충원위기", tone: "crisis" };
}
