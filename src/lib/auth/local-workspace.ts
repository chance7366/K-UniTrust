import type { AccessRole } from "@/lib/auth/access";

const ROLE_STORAGE_KEY = "kunitrust.workspace-role";

let roleKey: "admin" | "user" = "user";
let hydrated = false;

function readStoredRole(): "admin" | "user" {
  if (typeof window === "undefined") return roleKey;
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    if (stored === "admin" || stored === "user") return stored;
  } catch {
    /* private mode */
  }
  return roleKey;
}

export function workspaceScope(): "admin" | "user" {
  if (!hydrated && typeof window !== "undefined") {
    roleKey = readStoredRole();
    hydrated = true;
  }
  return roleKey;
}

export function setLocalWorkspaceRole(role: AccessRole | null | undefined) {
  const next: "admin" | "user" = role === "admin" ? "admin" : "user";
  roleKey = next;
  hydrated = true;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

export function clearLocalWorkspaceRole() {
  roleKey = "user";
  hydrated = true;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
