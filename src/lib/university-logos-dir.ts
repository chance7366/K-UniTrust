import { readdir } from "fs/promises";
import path from "path";

/** 대학 로고 원본 폴더 — `UNIVERSITY_LOGO_DIR` 환경 변수로 override 가능 */
export const UNIVERSITY_LOGO_DIR =
  process.env.UNIVERSITY_LOGO_DIR ?? "D:\\대학DB\\대학로고\\사립대학";

const LOGO_EXT = /\.(png|jpe?g|webp)$/i;

let cachedIndices: number[] | null = null;
let cachedNames: string[] | null = null;

export async function listUniversityLogoFiles(): Promise<string[]> {
  if (cachedNames) return cachedNames;
  const entries = await readdir(UNIVERSITY_LOGO_DIR);
  cachedNames = entries
    .filter((name) => LOGO_EXT.test(name))
    .sort((a, b) => a.localeCompare(b, "ko"));
  return cachedNames;
}

export async function listUniversityLogoIndices(): Promise<number[]> {
  if (cachedIndices) return cachedIndices;
  const names = await listUniversityLogoFiles();
  cachedIndices = names.map((_, index) => index);
  return cachedIndices;
}

export async function getUniversityLogoPath(index: number): Promise<{
  filePath: string;
  fileName: string;
} | null> {
  const names = await listUniversityLogoFiles();
  const fileName = names[index];
  if (!fileName) return null;
  return {
    fileName,
    filePath: path.join(UNIVERSITY_LOGO_DIR, fileName),
  };
}

export function universityLogoMime(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function splitIndicesIntoThreeRows(indices: number[]): number[][] {
  const rows: number[][] = [[], [], []];
  for (const index of indices) {
    rows[index % 3]!.push(index);
  }
  return rows;
}

export function sampleEvenly(indices: number[], maxCount: number): number[] {
  if (indices.length <= maxCount) return indices;
  const result: number[] = [];
  const step = indices.length / maxCount;
  for (let i = 0; i < maxCount; i++) {
    result.push(indices[Math.floor(i * step)]!);
  }
  return result;
}

export const INTRO_LOGO_PER_ROW = 36;
