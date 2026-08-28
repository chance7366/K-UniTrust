/**
 * 운영(Vercel)에 올린 대학알리미 CSV를 로컬 data/csv 로 가져온다.
 * Usage:
 *   npx tsx --env-file=.env scripts/pull-prod-univ-alimi.ts enrolled-students grad
 *   npx tsx --env-file=.env scripts/pull-prod-univ-alimi.ts enrolled-students
 */
import { ingestUnivAlimiRawUpload } from "../src/lib/ingest/univ-alimi-raw-upload.ts";
import {
  getUnivAlimiDatasets,
  isUnivAlimiIndicator,
  parseUnivAlimiDataset,
} from "../src/lib/analysis/univ-alimi-raw/screens.ts";
import type { UnivAlimiDatasetKind } from "../src/lib/analysis/univ-alimi-raw/types.ts";

const PROD = (
  process.env.KUNITRUST_PROD_URL ?? "https://k-uni-trust-six.vercel.app"
).replace(/\/$/, "");

function cookieHeader(res: Response): string {
  const cookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""];
  return cookies
    .map((c) => c.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}

async function login(): Promise<string> {
  const password = process.env.KUNITRUST_ADMIN_PASSWORD ?? "";
  if (!password) {
    throw new Error(".env 에 KUNITRUST_ADMIN_PASSWORD 가 없습니다.");
  }
  const res = await fetch(`${PROD}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new Error(`운영 로그인 실패 (${res.status})`);
  }
  const cookie = cookieHeader(res);
  if (!cookie.includes("kunitrust_access=")) {
    throw new Error("운영 로그인 쿠키를 받지 못했습니다.");
  }
  return cookie;
}

async function pullOne(
  cookie: string,
  indicator: string,
  dataset: UnivAlimiDatasetKind,
) {
  const url = `${PROD}/api/ingest/univ-map/alimi/${indicator}/${dataset}/export`;
  const res = await fetch(url, { headers: { cookie } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `${indicator}/${dataset} 내보내기 실패 (${res.status}): ${text.slice(0, 300)}`,
    );
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const result = await ingestUnivAlimiRawUpload(
    indicator as never,
    dataset,
    buffer,
    `${indicator}_${dataset}_prod.xlsx`,
  );
  console.log(
    `${indicator}/${dataset}: rows=${result.rowCount} years=${result.years.join(",")}`,
  );
}

async function main() {
  const indicatorRaw = process.argv[2] ?? "enrolled-students";
  const datasetRaw = process.argv[3];

  if (!isUnivAlimiIndicator(indicatorRaw)) {
    throw new Error(`알 수 없는 지표: ${indicatorRaw}`);
  }

  const datasets: UnivAlimiDatasetKind[] = datasetRaw
    ? [parseUnivAlimiDataset(datasetRaw)!].filter(Boolean)
    : [...getUnivAlimiDatasets(indicatorRaw)];

  if (!datasets.length) {
    throw new Error(`잘못된 dataset: ${datasetRaw}`);
  }

  const cookie = await login();
  for (const dataset of datasets) {
    await pullOne(cookie, indicatorRaw, dataset);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
