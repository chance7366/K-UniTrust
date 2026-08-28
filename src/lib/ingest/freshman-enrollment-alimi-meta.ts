import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { readTextOverlayFile, writeTextOverlayFile } from "@/lib/csv/overlay-file";
import { FRESHMAN_ENROLLMENT_ALIMI_META_FILE } from "@/lib/ingest/freshman-enrollment-alimi-config";

export type FreshmanEnrollmentAlimiMeta = {
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  columnCount: number;
  uploadedAt: string | null;
  fileName: string | null;
};

function metaFileName(kind: FreshmanEnrollmentDatasetKind): string {
  return FRESHMAN_ENROLLMENT_ALIMI_META_FILE[kind];
}

export async function readFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<FreshmanEnrollmentAlimiMeta | null> {
  const raw = await readTextOverlayFile(metaFileName(kind));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FreshmanEnrollmentAlimiMeta;
  } catch {
    return null;
  }
}

export async function writeFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
  meta: FreshmanEnrollmentAlimiMeta,
): Promise<void> {
  await writeTextOverlayFile(
    metaFileName(kind),
    JSON.stringify(meta, null, 2),
    "application/json; charset=utf-8",
  );
}
