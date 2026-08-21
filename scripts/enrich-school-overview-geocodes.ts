import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import { readCsvFile } from "../src/lib/csv/read.ts";
import {
  isCoordinateCacheHit,
  isGeocodeCacheHit,
} from "../src/lib/data/address-geocode.ts";
import {
  loadGeocodeCacheMap,
  mergeLotAddressFromCache,
  rebuildUniversityLocationsCsv,
  writeGeocodeCache,
  writeSchoolOverviewRows,
} from "../src/lib/ingest/address-geocode-pipeline.ts";
import {
  geocodeLotAddressFromCoords,
  geocodeRoadAddress,
  parseRoadAddressParts,
  sleep,
} from "../src/lib/vworld/geocode.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const apiKey = process.env.VWORLD_API_KEY?.trim();
if (!apiKey) {
  console.error("VWORLD_API_KEY is not set in .env");
  process.exit(1);
}

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const forceArg = process.argv.includes("--force");
const delayMs = 350;

type Failure = {
  schoolCodeStd: string;
  schoolName: string;
  roadAddress: string;
};

async function bootstrapCacheFromLocations(cache: Awaited<ReturnType<typeof loadGeocodeCacheMap>>) {
  const locations = await readCsvFile("univMapUniversityLocations").catch(() => []);
  let added = 0;

  for (const row of locations) {
    const schoolCodeStd = row.school_code_std?.trim();
    const roadAddress = row.road_address?.trim();
    const lng = Number(row.lng);
    const lat = Number(row.lat);
    if (!schoolCodeStd || !roadAddress || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      continue;
    }

    const existing = cache.get(schoolCodeStd);
    if (isGeocodeCacheHit(existing, roadAddress)) continue;

    cache.set(schoolCodeStd, {
      schoolCodeStd,
      roadAddress,
      lotAddress: row.lot_address?.trim() ?? existing?.lotAddress ?? "",
      lng,
      lat,
      sido: row.sido?.trim() ?? "",
      sigungu: row.sigungu?.trim() ?? "",
      geocodedAt: row.geocoded_at?.trim() ?? new Date().toISOString(),
    });
    added++;
  }

  if (added > 0) {
    console.log(`Bootstrapped ${added} rows from university locations CSV`);
  }
}

async function main() {
  const overviewRows = await readCsvFile("univMapSchoolOverview");
  const cache = await loadGeocodeCacheMap();
  await bootstrapCacheFromLocations(cache);
  const geocodedAt = new Date().toISOString();

  const targets = overviewRows.filter((r) => r.road_address?.trim());
  const work = limit > 0 ? targets.slice(0, limit) : targets;

  console.log(
    `Geocoding school overview addresses: ${work.length} targets (${targets.length} with road address, cache ${cache.size})`,
  );

  let apiCalls = 0;
  let cacheHits = 0;
  let ok = 0;
  const failures: Failure[] = [];

  for (let i = 0; i < work.length; i++) {
    const row = work[i]!;
    const schoolCodeStd = row.school_code_std?.trim() ?? "";
    const roadAddress = row.road_address?.trim() ?? "";
    const schoolName = row.school_name?.trim() ?? "";
    const cached = cache.get(schoolCodeStd);

    if (!forceArg && isGeocodeCacheHit(cached, roadAddress)) {
      cacheHits++;
      ok++;
      if ((i + 1) % 50 === 0 || i === work.length - 1) {
        console.log(`  ${i + 1}/${work.length} (ok: ${ok}, cache: ${cacheHits}, api: ${apiCalls})`);
      }
      continue;
    }

    const parsed = parseRoadAddressParts(roadAddress);
    let lng = cached?.lng;
    let lat = cached?.lat;
    let lotAddress = cached?.lotAddress ?? "";

    if (!isCoordinateCacheHit(cached, roadAddress)) {
      const geo = await geocodeRoadAddress(roadAddress, apiKey);
      apiCalls++;
      if (!geo) {
        failures.push({ schoolCodeStd, schoolName, roadAddress });
        if ((i + 1) % 20 === 0 || i === work.length - 1) {
          console.log(`  ${i + 1}/${work.length} (ok: ${ok}, cache: ${cacheHits}, api: ${apiCalls})`);
        }
        await sleep(delayMs);
        continue;
      }
      lng = geo.lng;
      lat = geo.lat;
      lotAddress = geo.lotAddress;
    } else if (!lotAddress) {
      const lot = await geocodeLotAddressFromCoords(lng!, lat!, apiKey);
      apiCalls++;
      lotAddress = lot ?? "";
    }

    if (lng != null && lat != null) {
      ok++;
      cache.set(schoolCodeStd, {
        schoolCodeStd,
        roadAddress,
        lotAddress,
        lng,
        lat,
        sido: parsed.sido || cached?.sido || "",
        sigungu: parsed.sigungu || cached?.sigungu || "",
        geocodedAt,
      });
    } else {
      failures.push({ schoolCodeStd, schoolName, roadAddress });
    }

    if ((i + 1) % 20 === 0 || i === work.length - 1) {
      console.log(`  ${i + 1}/${work.length} (ok: ${ok}, cache: ${cacheHits}, api: ${apiCalls})`);
    }
    await sleep(delayMs);
  }

  const mergedOverview = mergeLotAddressFromCache(overviewRows, cache);
  await writeGeocodeCache(cache);
  await writeSchoolOverviewRows(mergedOverview);
  const locationCount = await rebuildUniversityLocationsCsv(
    mergedOverview,
    cache,
    geocodedAt,
  );

  const lotFilled = mergedOverview.filter((r) => r.lot_address?.trim()).length;

  fs.mkdirSync(path.join(projectRoot, "data/logs"), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, "data/logs/geocode-school-overview-failures.json"),
    JSON.stringify(failures, null, 2),
    "utf8",
  );

  console.log("\nDone.");
  console.log(`  API calls: ${apiCalls}`);
  console.log(`  Cache hits: ${cacheHits}`);
  console.log(`  Geocode cache rows: ${cache.size}`);
  console.log(`  School overview lot_address filled: ${lotFilled}/${overviewRows.length}`);
  console.log(`  University locations rows: ${locationCount}`);
  console.log(`  Failures: ${failures.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
