/** 지도 마커 색상 (A안: 고대비 진한 색) */
export const MARKER_COLORS = {
  private: "#DB2777",
  public: "#4F46E5",
  primary: "#FBBF24",
  stroke: "#1E293B",
  sidoContextOpacity: 0.42,
} as const;

export function isPublicEstablishment(establishment: string): boolean {
  return establishment.includes("국립") || establishment === "공립";
}

export function establishmentMarkerHex(establishment: string): string {
  return isPublicEstablishment(establishment)
    ? MARKER_COLORS.public
    : MARKER_COLORS.private;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
