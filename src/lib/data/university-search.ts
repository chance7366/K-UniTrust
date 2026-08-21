import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import { schoolMarkerId } from "@/lib/map/types";

/** 검색용 핵심 이름 (예: 단국대학교·단국대 → 단국) */
function normalizeCoreName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/대학교|대학|캠퍼스/g, "")
    .replace(/대$/u, "");
}

function schoolNameCore(school: UniversityLocationRow): string {
  return normalizeCoreName(school.schoolName);
}

function schoolSearchHaystack(school: UniversityLocationRow): string {
  return normalizeCoreName(
    `${school.schoolName} ${school.mainBranch} ${school.sido} ${school.sigungu}`,
  );
}

function matchesUniversitySearch(
  school: UniversityLocationRow,
  query: string,
): boolean {
  if (query.length < 1) return false;

  const nameCore = schoolNameCore(school);
  const haystack = schoolSearchHaystack(school);

  if (nameCore.includes(query) || query.includes(nameCore)) return true;
  if (haystack.includes(query) || query.includes(haystack)) return true;

  if (query.length >= 2) {
    if (nameCore.startsWith(query) || query.startsWith(nameCore)) return true;
  }

  return false;
}

function scoreUniversityMatch(
  school: UniversityLocationRow,
  query: string,
): number {
  const nameCore = schoolNameCore(school);
  const haystack = schoolSearchHaystack(school);

  if (nameCore === query) return 100;
  if (nameCore.startsWith(query)) return 90;
  if (query.startsWith(nameCore)) return 85;
  if (nameCore.includes(query)) return 80;
  if (haystack.startsWith(query)) return 70;
  if (haystack.includes(query)) return 60;
  if (query.includes(nameCore) && nameCore.length >= 2) return 50;
  return 0;
}

export function formatUniversitySearchLabel(school: UniversityLocationRow): string {
  const branch =
    school.mainBranch && school.mainBranch !== "본교"
      ? ` (${school.mainBranch})`
      : "";
  const region = school.sigungu
    ? `${school.sigungu} · ${school.sido}`
    : school.sido;
  return `${school.schoolName}${branch} · ${region}`;
}

export function searchUniversities(
  query: string,
  schools: UniversityLocationRow[],
  limit = 20,
): UniversityLocationRow[] {
  const normalizedQuery = normalizeCoreName(query);
  if (!normalizedQuery) return [];

  const scored: Array<{ school: UniversityLocationRow; score: number }> = [];
  const seen = new Set<string>();

  for (const school of schools) {
    const key = schoolMarkerId(school);
    if (seen.has(key)) continue;
    if (!matchesUniversitySearch(school, normalizedQuery)) continue;

    seen.add(key);
    scored.push({
      school,
      score: scoreUniversityMatch(school, normalizedQuery),
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const nameCmp = a.school.schoolName.localeCompare(b.school.schoolName, "ko");
    if (nameCmp !== 0) return nameCmp;
    return a.school.mainBranch.localeCompare(b.school.mainBranch, "ko");
  });

  return scored.slice(0, limit).map((item) => item.school);
}
