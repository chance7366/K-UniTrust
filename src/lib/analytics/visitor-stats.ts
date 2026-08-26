import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  blobAuthOptions,
  isVercelBlobEnabled,
} from "@/lib/vercel-blob-env";

export type VisitorStats = {
  totalUniqueVisitors: number;
  dailyUniqueVisitors: Record<string, number>;
  updatedAt: string;
};

export type VisitorStatsView = {
  todayVisitors: number;
  totalVisitors: number;
  dateKey: string;
};

const STATS_PATH = path.join(process.cwd(), "data", "json", "visitor-stats.json");
const BLOB_PATH = "analytics/visitor-stats.json";

export function kstDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    date,
  );
}

function emptyStats(): VisitorStats {
  return {
    totalUniqueVisitors: 0,
    dailyUniqueVisitors: {},
    updatedAt: new Date().toISOString(),
  };
}

function normalizeStats(raw: unknown): VisitorStats {
  if (!raw || typeof raw !== "object") return emptyStats();
  const data = raw as Partial<VisitorStats>;
  const daily =
    data.dailyUniqueVisitors && typeof data.dailyUniqueVisitors === "object"
      ? Object.fromEntries(
          Object.entries(data.dailyUniqueVisitors).filter(
            ([key, value]) =>
              /^\d{4}-\d{2}-\d{2}$/.test(key) &&
              typeof value === "number" &&
              Number.isFinite(value) &&
              value >= 0,
          ),
        )
      : {};
  const total =
    typeof data.totalUniqueVisitors === "number" &&
    Number.isFinite(data.totalUniqueVisitors) &&
    data.totalUniqueVisitors >= 0
      ? Math.floor(data.totalUniqueVisitors)
      : 0;

  return {
    totalUniqueVisitors: total,
    dailyUniqueVisitors: daily,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

export function toVisitorStatsView(
  stats: VisitorStats,
  dateKey = kstDateKey(),
): VisitorStatsView {
  return {
    todayVisitors: stats.dailyUniqueVisitors[dateKey] ?? 0,
    totalVisitors: stats.totalUniqueVisitors,
    dateKey,
  };
}

async function readBlobStats(): Promise<VisitorStats | null> {
  if (!isVercelBlobEnabled()) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false,
      ...blobAuthOptions(),
    });
    if (!result?.stream) return null;
    const text = await new Response(result.stream).text();
    if (!text) return null;
    return normalizeStats(JSON.parse(text));
  } catch (error) {
    console.error("[visitor-stats] blob read failed", error);
    return null;
  }
}

async function writeBlobStats(stats: VisitorStats): Promise<void> {
  if (!isVercelBlobEnabled()) return;

  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(stats, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: "application/json; charset=utf-8",
    ...blobAuthOptions(),
  });
}

export async function loadVisitorStats(): Promise<VisitorStats> {
  if (isVercelBlobEnabled()) {
    const remote = await readBlobStats();
    if (remote) return remote;
    // Vercel 배포본 visitor-stats.json은 항상 0이라 운영 집계로 쓰지 않는다.
    if (process.env.VERCEL) return emptyStats();
  }
  try {
    const raw = await readFile(STATS_PATH, "utf8");
    return normalizeStats(JSON.parse(raw));
  } catch {
    return emptyStats();
  }
}

async function saveVisitorStats(stats: VisitorStats): Promise<void> {
  const next: VisitorStats = {
    ...stats,
    updatedAt: new Date().toISOString(),
  };
  const payload = JSON.stringify(next, null, 2);

  let savedLocally = false;
  try {
    await mkdir(path.dirname(STATS_PATH), { recursive: true });
    await writeFile(STATS_PATH, payload, "utf8");
    savedLocally = true;
  } catch {
    /* read-only FS (Vercel) */
  }

  if (isVercelBlobEnabled()) {
    try {
      await writeBlobStats(next);
      return;
    } catch (error) {
      console.error("[visitor-stats] blob write failed", error);
      if (!savedLocally) throw error;
      return;
    }
  }

  if (!savedLocally) {
    throw new Error(
      "방문자 통계를 저장할 수 없습니다. Vercel Blob(BLOB_STORE_ID 또는 BLOB_READ_WRITE_TOKEN)을 설정하세요.",
    );
  }
}

export type RecordVisitorResult = {
  stats: VisitorStatsView;
  visitorId: string;
  setVisitorId: boolean;
  setVisitDate: boolean;
};

/** 쿠키 기준 일일·누적 고유 방문자 집계 (KST) */
export async function recordVisitor(args: {
  visitorId?: string | null;
  lastVisitDate?: string | null;
}): Promise<RecordVisitorResult> {
  const dateKey = kstDateKey();
  let visitorId = args.visitorId?.trim() || "";
  let setVisitorId = false;
  let setVisitDate = false;
  let incrementTotal = false;
  let incrementDaily = false;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    setVisitorId = true;
    incrementTotal = true;
    incrementDaily = true;
  } else if (args.lastVisitDate !== dateKey) {
    incrementDaily = true;
    setVisitDate = true;
  }

  const stats = await loadVisitorStats();

  if (incrementDaily) {
    stats.dailyUniqueVisitors[dateKey] =
      (stats.dailyUniqueVisitors[dateKey] ?? 0) + 1;
  }
  if (incrementTotal) {
    stats.totalUniqueVisitors += 1;
  }

  if (incrementDaily || incrementTotal) {
    await saveVisitorStats(stats);
  }

  return {
    stats: toVisitorStatsView(stats, dateKey),
    visitorId,
    setVisitorId,
    setVisitDate: setVisitDate || setVisitorId,
  };
}
