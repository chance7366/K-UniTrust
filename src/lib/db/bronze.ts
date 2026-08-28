import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { RAW_DATA_DIR } from "@/lib/db/paths";
import { isVercelBlobEnabled } from "@/lib/vercel-blob-env";

export type WriteBronzeOptions = {
  domainId: string;
  submenuId?: string;
  statType?: string;
  year?: number;
  operation?: string;
  rows: Record<string, unknown>[];
  /** Raw CSV text — if provided, written as-is instead of serializing rows. */
  rawCsv?: string;
};

function timestampSuffix(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Append-only Bronze snapshot under data/01_raw/. */
export async function writeBronzeSnapshot(
  opts: WriteBronzeOptions,
): Promise<string> {
  const parts = [
    opts.domainId,
    opts.submenuId,
    opts.statType,
    opts.operation,
    opts.year != null ? String(opts.year) : undefined,
    timestampSuffix(),
  ].filter(Boolean);

  const dir = path.join(RAW_DATA_DIR, "api", opts.domainId);
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (isVercelBlobEnabled()) {
      console.warn("[bronze] skip snapshot (read-only fs)", err);
      return "";
    }
    throw err;
  }

  const fileName = `${parts.join("_")}.csv`;
  const filePath = path.join(dir, fileName);

  try {
    if (opts.rawCsv != null) {
      await writeFile(filePath, opts.rawCsv, "utf8");
      return filePath;
    }

    if (!opts.rows.length) {
      await writeFile(filePath, "", "utf8");
      return filePath;
    }

    const headers = Object.keys(opts.rows[0]!);
    const lines = [
      headers.join(","),
      ...opts.rows.map((row) =>
        headers
          .map((h) => {
            const v = row[h];
            const s = v == null ? "" : String(v);
            return s.includes(",") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(","),
      ),
    ];
    await writeFile(filePath, lines.join("\n"), "utf8");
    return filePath;
  } catch (err) {
    if (isVercelBlobEnabled()) {
      console.warn("[bronze] skip snapshot (read-only fs)", err);
      return "";
    }
    throw err;
  }
}
