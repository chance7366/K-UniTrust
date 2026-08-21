/** Soft Mint / Tactile Light 테마 토큰 (globals.css와 동기화) */
export const TEAL_GLOW = {
  bg: "#E9EEF3",
  surface: "#FFFFFF",
  surface2: "#F3F7F5",
  border: "#C5D8CE",
  foreground: "#1A2433",
  muted: "#5A6A7C",
  accent: "#3B9A6A",
  glowCenter: "#F2FBF6",
  navActiveMid: "#D6EFFF",
} as const;

export const TEAL_GLOW_GRADIENTS = {
  main: `radial-gradient(ellipse 90% 55% at 50% -8%, rgba(59, 154, 106, 0.12) 0%, transparent 55%), linear-gradient(180deg, #F2F6FA 0%, ${TEAL_GLOW.bg} 45%, #DDE5EE 100%)`,
  panelHero: `linear-gradient(180deg, #FFFFFF 0%, #F7FBFA 100%)`,
  panelKpi: `radial-gradient(ellipse 90% 70% at 20% 0%, rgba(59, 154, 106, 0.08), transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F6F9FB 100%)`,
  sidebar: `radial-gradient(ellipse 100% 45% at 30% 0%, rgba(255,255,255,0.95), transparent 55%), linear-gradient(175deg, #F5FCF8 0%, #EAF5EF 42%, #E3F0E9 100%)`,
  sidebarBrand: `radial-gradient(ellipse 70% 120% at 50% 0%, #FFFFFF 0%, transparent 65%), linear-gradient(180deg, #EFFAF4 0%, #D8F0E4 48%, #C8E8D8 100%)`,
  sidebarNav: `transparent`,
  navActive: `radial-gradient(ellipse 90% 80% at 15% 0%, #FFFFFF, transparent 55%), linear-gradient(180deg, #F0F9FF 0%, #D6EFFF 100%)`,
} as const;

/** Recharts 공통 팔레트 (라이트 Soft Mint) */
export const CHART_THEME = {
  mint: "#3B9A6A",
  blue: "#2D7FD6",
  amber: "#FF9F1A",
  rose: "#D93A48",
  emerald: "#2A7A55",
  violet: "#7C5CFC",
  orange: "#F08A24",
  yellow: "#FFD24A",
  grid: "#C9D8D0",
  axisLabel: "#5A6A7C",
  tooltipBg: "#E7F8EF",
  tooltipBorder: "#A8E0C0",
  tooltipText: "#146C43",
} as const;

export const CHART_TOOLTIP_PROPS = {
  contentStyle: {
    background: "linear-gradient(145deg, #e7f8ef, #cfeedd)",
    border: "1px solid #a8e0c0",
    borderRadius: 10,
    boxShadow:
      "0 8px 20px rgba(26,36,51,0.16), inset 0 1px 0 rgba(255,255,255,0.7)",
    fontSize: 12,
    padding: "10px 12px",
    color: "#146c43",
  },
  labelStyle: {
    color: "#146c43",
    fontWeight: 600,
    fontSize: 11,
    marginBottom: 3,
    opacity: 0.85,
  },
  itemStyle: {
    color: "#146c43",
    fontWeight: 800,
    fontSize: 13,
  },
} as const;
