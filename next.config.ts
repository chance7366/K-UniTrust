import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: ["192.168.6.111"],
  // Vercel serverless: fs.readFile로 읽는 data/reports·data/json을 번들에 포함
  outputFileTracingIncludes: {
    "/api/competitiveness-analysis/**": [
      "./data/reports/competitiveness/**/*",
      "./data/json/competitiveness-editions/**/*",
    ],
    "/api/financial-projection/**": [
      "./data/reports/financial-projection/**/*",
      "./data/json/financial-projection/**/*",
    ],
    "/api/analytics/**": ["./data/json/visitor-stats.json"],
  },
};

export default nextConfig;
