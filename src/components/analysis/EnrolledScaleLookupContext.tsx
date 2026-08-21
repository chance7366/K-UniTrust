"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { EnrolledScaleLookupJson } from "@/lib/analysis/school-scale-trend";

const EnrolledScaleLookupContext = createContext<EnrolledScaleLookupJson>({});

export function EnrolledScaleLookupProvider({
  value,
  children,
}: {
  value: EnrolledScaleLookupJson;
  children: ReactNode;
}) {
  return (
    <EnrolledScaleLookupContext.Provider value={value}>
      {children}
    </EnrolledScaleLookupContext.Provider>
  );
}

export function useEnrolledScaleLookup(): EnrolledScaleLookupJson {
  return useContext(EnrolledScaleLookupContext);
}
