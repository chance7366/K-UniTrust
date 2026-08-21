export type UniversityLogosManifest = {
  total: number;
  displayedPerRow: number;
  generatedAt: string;
  rows: string[][];
};

export function isUniversityLogosManifest(
  value: unknown,
): value is UniversityLogosManifest {
  if (!value || typeof value !== "object") return false;
  const v = value as UniversityLogosManifest;
  return (
    typeof v.total === "number" &&
    Array.isArray(v.rows) &&
    v.rows.length === 3 &&
    v.rows.every((row) => row.every((src) => typeof src === "string"))
  );
}
