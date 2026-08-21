import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { CSV_DIR } from "@/lib/csv/paths";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { FRESHMAN_ENROLLMENT_ALIMI_META_FILE } from "@/lib/ingest/freshman-enrollment-alimi-config";

export type FreshmanEnrollmentAlimiMeta = {
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  columnCount: number;
  uploadedAt: string | null;
  fileName: string | null;
};

function metaPath(kind: FreshmanEnrollmentDatasetKind): string {
  return path.join(CSV_DIR, FRESHMAN_ENROLLMENT_ALIMI_META_FILE[kind]);
}

export async function readFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<FreshmanEnrollmentAlimiMeta | null> {
  try {
    const raw = await readFile(metaPath(kind), "utf8");
    return JSON.parse(raw) as FreshmanEnrollmentAlimiMeta;
  } catch {
    return null;
  }
}

export async function writeFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
  meta: FreshmanEnrollmentAlimiMeta,
): Promise<void> {
  await mkdir(CSV_DIR, { recursive: true });
  await writeFile(metaPath(kind), JSON.stringify(meta, null, 2), "utf8");
}
