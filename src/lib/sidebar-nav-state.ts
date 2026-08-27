export type SidebarOpenSections = {
  univMap: boolean;
  financeAnalysis: boolean;
  competitiveness: boolean;
  financialProjection: boolean;
  studentFillAnalysis: boolean;
};

export type SidebarNavPersisted = {
  openSections: SidebarOpenSections;
  financeGroupOpen: Record<string, boolean>;
  univMapGroupOpen: Record<string, boolean>;
  competitivenessGroupOpen: Record<string, boolean>;
};

const STORAGE_KEY = "k-unitrust.sidebar-nav";
const COLLAPSED_KEY = "k-unitrust.sidebar-collapsed";

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* private mode / quota */
  }
}

export function readSidebarNavState(): SidebarNavPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SidebarNavPersisted;
    if (!parsed?.openSections) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSidebarNavState(state: SidebarNavPersisted) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function mergeGroupOpen(
  current: Record<string, boolean>,
  persisted?: Record<string, boolean>,
): Record<string, boolean> {
  const keptOpen = Object.fromEntries(
    Object.entries(current).filter(([, open]) => open),
  );
  return { ...persisted, ...keptOpen };
}
