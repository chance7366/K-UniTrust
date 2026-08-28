import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type {
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
} from "@/lib/analysis/univ-alimi-raw/types";
import { readTextOverlayFile, writeTextOverlayFile } from "@/lib/csv/overlay-file";
import { UNIV_ALIMI_META_FILE } from "@/lib/ingest/univ-alimi-raw-config";

export type UnivAlimiRawMeta = {
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  columnCount: number;
  uploadedAt: string | null;
  fileName: string | null;
};

function metaFileName(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): string {
  const file = UNIV_ALIMI_META_FILE[indicator][kind];
  if (!file) {
    throw new Error("이 지표는 해당 구분을 지원하지 않습니다.");
  }
  return file;
}

export async function readUnivAlimiRawMeta(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): Promise<UnivAlimiRawMeta | null> {
  const raw = await readTextOverlayFile(metaFileName(indicator, kind));
  if (!raw) return null;
  try {
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
  await writeTextOverlayFile(
    metaFileName(indicator, kind),
    JSON.stringify(meta, null, 2),
    "application/json; charset=utf-8",
  );
}
