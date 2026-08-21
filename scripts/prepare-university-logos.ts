import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";

import sharp from "sharp";

import {
  INTRO_LOGO_PER_ROW,
  UNIVERSITY_LOGO_DIR,
  listUniversityLogoFiles,
  sampleEvenly,
  splitIndicesIntoThreeRows,
} from "../src/lib/university-logos-dir";

const OUT_DIR = path.join(process.cwd(), "public", "university-logos");
const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 64;
const WEBP_QUALITY = 72;

export type UniversityLogosManifest = {
  total: number;
  displayedPerRow: number;
  generatedAt: string;
  rows: string[][];
};

async function main() {
  const skipIfFresh = process.argv.includes("--if-fresh");
  const manifestPath = path.join(OUT_DIR, "manifest.json");

  if (skipIfFresh) {
    try {
      const existing = JSON.parse(
        await readFile(manifestPath, "utf8"),
      ) as UniversityLogosManifest;
      const ageMs = Date.now() - new Date(existing.generatedAt).getTime();
      if (ageMs < 7 * 24 * 60 * 60 * 1000 && existing.rows.every((r) => r.length)) {
        console.log(`[prepare-university-logos] manifest fresh (${existing.total} total)`);
        return;
      }
    } catch {
      /* regenerate */
    }
  }

  const names = await listUniversityLogoFiles();
  if (!names.length) {
    console.warn(`[prepare-university-logos] no logos in ${UNIVERSITY_LOGO_DIR}`);
    return;
  }

  const indices = names.map((_, index) => index);
  const sampledRows = splitIndicesIntoThreeRows(indices).map((row) =>
    sampleEvenly(row, INTRO_LOGO_PER_ROW),
  );

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const manifest: UniversityLogosManifest = {
    total: names.length,
    displayedPerRow: INTRO_LOGO_PER_ROW,
    generatedAt: new Date().toISOString(),
    rows: [[], [], []],
  };

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    const rowDir = path.join(OUT_DIR, `row-${rowIndex}`);
    await mkdir(rowDir, { recursive: true });

    for (let slot = 0; slot < sampledRows[rowIndex]!.length; slot++) {
      const sourceIndex = sampledRows[rowIndex]![slot]!;
      const sourceName = names[sourceIndex]!;
      const sourcePath = path.join(UNIVERSITY_LOGO_DIR, sourceName);
      const outName = `${String(slot).padStart(3, "0")}.webp`;
      const outPath = path.join(rowDir, outName);

      await sharp(sourcePath)
        .resize(THUMB_WIDTH, THUMB_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);

      manifest.rows[rowIndex]!.push(`/university-logos/row-${rowIndex}/${outName}`);
    }
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `[prepare-university-logos] wrote ${manifest.rows.flat().length} thumbnails → public/university-logos/`,
  );
}

main().catch((err) => {
  console.error("[prepare-university-logos] failed:", err);
  process.exit(1);
});
