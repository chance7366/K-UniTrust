import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

import {
  isUniversityLogosManifest,
  type UniversityLogosManifest,
} from "@/lib/university-logos-manifest";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "public",
  "university-logos",
  "manifest.json",
);

export async function loadUniversityLogosManifest(): Promise<UniversityLogosManifest | null> {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isUniversityLogosManifest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
