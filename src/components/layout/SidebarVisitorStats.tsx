"use client";

import { useEffect, useState } from "react";

import { readApiJson } from "@/lib/api/read-api-json";

export type VisitorStatsView = {
  todayVisitors: number;
  totalVisitors: number;
  dateKey: string;
};

function formatCount(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function useSidebarVisitorStats(): VisitorStatsView | null {
  const [stats, setStats] = useState<VisitorStatsView | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void fetch("/api/analytics/visitors", {
        method: "POST",
        credentials: "same-origin",
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("방문자 통계를 불러오지 못했습니다.");
          }
          return readApiJson<VisitorStatsView>(res);
        })
        .then((data) => {
          if (!cancelled) setStats(data);
        })
        .catch(() => {
          if (cancelled) return;
          void fetch("/api/analytics/visitors", { credentials: "same-origin" })
            .then(async (res) => {
              if (!res.ok) return null;
              return readApiJson<VisitorStatsView>(res);
            })
            .then((data) => {
              if (!cancelled && data) setStats(data);
            });
        });
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return stats;
}

export function formatVisitorCount(value: number | null | undefined): string {
  return value == null ? "—" : formatCount(value);
}
