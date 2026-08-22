import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

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

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

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
  const token = blobToken();
  if (!token) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_PATH, { access: "private", token });
    if (!result) return null;
    const text =
      "text" in result && typeof result.text === "function"
        ? await result.text()
        : "stream" in result && result.stream
          ? await new Response(result.stream).text()
          : null;
    if (!text) return null;
    return normalizeStats(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeBlobStats(stats: VisitorStats): Promise<void> {
  const token = blobToken();
  if (!token) return;

  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(stats, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
    contentType: "application/json; charset=utf-8",
  });
}

export async function loadVisitorStats(): Promise<VisitorStats> {
  try {
    const raw = await readFile(STATS_PATH, "utf8");
    return normalizeStats(JSON.parse(raw));
  } catch {
    return (await readBlobStats()) ?? emptyStats();
  }
}

async function saveVisitorStats(stats: VisitorStats): Promise<void> {
  const next: VisitorStats = {
    ...stats,
    updatedAt: new Date().toISOString(),
  };
  const payload = JSON.stringify(next, null, 2);

  try {
    await mkdir(path.dirname(STATS_PATH), { recursive: true });
    await writeFile(STATS_PATH, payload, "utf8");
  } catch {
    /* read-only FS (Vercel) */
  }

  await writeBlobStats(next);
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
