/**
 * 운영(Vercel) 대학알리미 CSV를 로컬 data/csv 로 가져온다.
 *
 *   npx tsx --env-file=.env scripts/pull-prod-univ-alimi.ts
 *   npx tsx --env-file=.env scripts/pull-prod-univ-alimi.ts enrolled-students grad
 */
import { ingestFreshmanEnrollmentAlimiUpload } from "../src/lib/ingest/freshman-enrollment-alimi-upload.ts";
import { ingestSchoolCodeUpload } from "../src/lib/ingest/school-code-upload.ts";
import { ingestUnivAlimiRawUpload } from "../src/lib/ingest/univ-alimi-raw-upload.ts";
import {
  getUnivAlimiDatasets,
  isUnivAlimiIndicator,
  parseUnivAlimiDataset,
  UNIV_ALIMI_SCREENS,
} from "../src/lib/analysis/univ-alimi-raw/screens.ts";
import type { UnivAlimiDatasetKind } from "../src/lib/analysis/univ-alimi-raw/types.ts";
import type { UnivAlimiIndicatorId } from "../src/lib/analysis/univ-alimi-raw/types.ts";

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

async function download(
  cookie: string,
  url: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; status: number; detail: string }> {
  const res = await fetch(url, { headers: { cookie } });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, detail: text.slice(0, 240) };
  }
  return { ok: true, buffer: Buffer.from(await res.arrayBuffer()) };
}

async function pullAlimi(
  cookie: string,
  indicator: UnivAlimiIndicatorId,
  dataset: UnivAlimiDatasetKind,
) {
  const url = `${PROD}/api/ingest/univ-map/alimi/${indicator}/${dataset}/export`;
  const got = await download(cookie, url);
  if (!got.ok) {
    console.log(`skip ${indicator}/${dataset} (${got.status}) ${got.detail}`);
    return;
  }
  const result = await ingestUnivAlimiRawUpload(
    indicator,
    dataset,
    got.buffer,
    `${indicator}_${dataset}_prod.xlsx`,
  );
  console.log(
    `${indicator}/${dataset}: rows=${result.rowCount} years=${result.years.join(",")}`,
  );
}

async function pullFreshman(cookie: string, dataset: UnivAlimiDatasetKind) {
  const url = `${PROD}/api/ingest/finance-analysis/freshman-enrollment-rate/${dataset}/export`;
  const got = await download(cookie, url);
  if (!got.ok) {
    console.log(`skip freshman-enrollment/${dataset} (${got.status}) ${got.detail}`);
    return;
  }
  const result = await ingestFreshmanEnrollmentAlimiUpload(
    dataset,
    got.buffer,
    `freshman_enrollment_${dataset}_prod.xlsx`,
  );
  console.log(
    `freshman-enrollment/${dataset}: rows=${result.rowCount} years=${result.years.join(",")}`,
  );
}

async function pullSchoolCode(cookie: string) {
  const url = `${PROD}/api/ingest/finance-analysis/school-code/export`;
  const got = await download(cookie, url);
  if (!got.ok) {
    console.log(`skip school-code (${got.status}) ${got.detail}`);
    return;
  }
  const result = await ingestSchoolCodeUpload(
    got.buffer,
    "school_code_prod.xlsx",
  );
  console.log(
    `school-code: rows=${result.rowCount} years=${result.years.join(",")}`,
  );
}

async function pullAllAlimiIndicators(cookie: string) {
  const indicators = Object.keys(UNIV_ALIMI_SCREENS) as UnivAlimiIndicatorId[];
  for (const indicator of indicators) {
    for (const dataset of getUnivAlimiDatasets(indicator)) {
      try {
        await pullAlimi(cookie, indicator, dataset);
      } catch (err) {
        console.log(
          `skip ${indicator}/${dataset}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}

async function main() {
  const cookie = await login();
  const indicatorRaw = process.argv[2];
  const datasetRaw = process.argv[3];

  if (!indicatorRaw) {
    await pullSchoolCode(cookie);
    await pullFreshman(cookie, "undergrad");
    await pullFreshman(cookie, "grad");
    await pullAllAlimiIndicators(cookie);
    return;
  }

  if (indicatorRaw === "school-code") {
    await pullSchoolCode(cookie);
    return;
  }

  if (indicatorRaw === "freshman-enrollment") {
    const datasets: UnivAlimiDatasetKind[] = datasetRaw
      ? [parseUnivAlimiDataset(datasetRaw)!].filter(Boolean)
      : ["undergrad", "grad"];
    for (const dataset of datasets) {
      await pullFreshman(cookie, dataset);
    }
    return;
  }

  if (!isUnivAlimiIndicator(indicatorRaw)) {
    throw new Error(`알 수 없는 지표: ${indicatorRaw}`);
  }

  const datasets: UnivAlimiDatasetKind[] = datasetRaw
    ? [parseUnivAlimiDataset(datasetRaw)!].filter(Boolean)
    : [...getUnivAlimiDatasets(indicatorRaw)];

  if (!datasets.length) {
    throw new Error(`잘못된 dataset: ${datasetRaw}`);
  }

  for (const dataset of datasets) {
    await pullAlimi(cookie, indicatorRaw, dataset);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
