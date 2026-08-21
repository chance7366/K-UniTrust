import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "node_modules", "cesium", "Build", "Cesium");
const dest = path.join(root, "public", "cesium");

if (!fs.existsSync(src)) {
  console.warn("[copy-cesium-assets] cesium package not found, skipping");
  process.exit(0);
}

fs.cpSync(src, dest, { recursive: true });
console.log("[copy-cesium-assets] copied Cesium assets to public/cesium");
