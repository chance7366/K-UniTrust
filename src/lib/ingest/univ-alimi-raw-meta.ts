import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { CSV_DIR } from "@/lib/csv/paths";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type {
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
} from "@/lib/analysis/univ-alimi-raw/types";
import { UNIV_ALIMI_META_FILE } from "@/lib/ingest/univ-alimi-raw-config";

export type UnivAlimiRawMeta = {
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  columnCount: number;
  uploadedAt: string | null;
  fileName: string | null;
};

function metaPath(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): string {
  const file = UNIV_ALIMI_META_FILE[indicator][kind];
  if (!file) {
    throw new Error("이 지표는 해당 구분을 지원하지 않습니다.");
  }
  return path.join(CSV_DIR, file);
}

export async function readUnivAlimiRawMeta(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): Promise<UnivAlimiRawMeta | null> {
  try {
    const raw = await readFile(metaPath(indicator, kind), "utf8");
    return JSON.parse(raw) as UnivAlimiRawMeta;
  } catch {
    return null;
  }
}

export async function writeUnivAlimiRawMeta(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
  meta: UnivAlimiRawMeta,
): Promise<void> {
  await mkdir(CSV_DIR, { recursive: true });
  await writeFile(metaPath(indicator, kind), JSON.stringify(meta, null, 2), "utf8");
}
