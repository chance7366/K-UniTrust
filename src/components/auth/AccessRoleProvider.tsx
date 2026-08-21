"use client";

import { createContext, useContext, useEffect } from "react";

import type { AccessRole } from "@/lib/auth/access";
import { canUploadExcel } from "@/lib/auth/access";
import { setLocalWorkspaceRole } from "@/lib/auth/local-workspace";

const AccessRoleContext = createContext<AccessRole | null | undefined>(
  undefined,
);

export function AccessRoleProvider({
  role,
  children,
}: {
  role: AccessRole | null;
  children: React.ReactNode;
}) {
  if (role === "admin" || role === "user") {
    setLocalWorkspaceRole(role);
  }

  useEffect(() => {
    setLocalWorkspaceRole(role);
  }, [role]);

  return (
    <AccessRoleContext.Provider value={role}>
      {children}
    </AccessRoleContext.Provider>
  );
}

export function useAccessRole(): AccessRole | null | undefined {
  return useContext(AccessRoleContext);
}

export function useCanUploadExcel(): boolean {
  const role = useAccessRole();
  if (role === undefined) return true;
  return canUploadExcel(role);
}
