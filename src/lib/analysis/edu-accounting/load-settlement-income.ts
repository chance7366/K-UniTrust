import {
  financeAlimiNameMatchesCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  numByAccountCodes,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
import { loadFinanceAlimiHeaders } from "@/lib/analysis/finance-alimi-headers-server";
import { parseAlimiEnrolledStudentsUndergrad } from "@/lib/analysis/enrolled-students-rep-count";
import {
  ANALYTICS_ZONES,
  zoneForSido,
} from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS, matchSidoRegion } from "@/lib/analysis/korea-sido-regions";
import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import {
  normalizeSchoolCodeText,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { readCsvFile } from "@/lib/csv/read";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type { SchoolCodeRow } from "@/lib/ingest/school-code-config";

import type {
  SettlementCohort,
  SettlementIncomeAmounts,
  SettlementIncomeReportData,
  SettlementMatchStats,
  SettlementSchoolYear,
} from "./settlement-income-types";
import { SETTLEMENT_INCOME_KEYS } from "./settlement-income-types";

const FALLBACK = {
  totalIncome: 80,
  operating: 40,
  assetLiability: 70,
  carryover: 79,
  tuitionAndFees: 10,
  tuition: 11,
  undergradFee: 12,
  gradFee: 13,
  transferGift: 20,
  transfer: 21,
  donation: 25,
  grant: 28,
  ancillary: 35,
  otherEdu: 38,
} as const;

type FundRow = SettlementIncomeAmounts & {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
};

function emptyAmounts(): SettlementIncomeAmounts {
  return {
    totalIncome: 0,
    operating: 0,
    assetLiability: 0,
    carryover: 0,
    tuitionAndFees: 0,
    tuition: 0,
    undergradFee: 0,
    gradFee: 0,
    transferGift: 0,
    transfer: 0,
    donation: 0,
    grant: 0,
    ancillary: 0,
    otherEdu: 0,
  };
}

function addAmounts(
  a: SettlementIncomeAmounts,
  b: SettlementIncomeAmounts,
): SettlementIncomeAmounts {
  const out = emptyAmounts();
  for (const key of SETTLEMENT_INCOME_KEYS) out[key] = a[key] + b[key];
  return out;
}

function parseFundRow(
  raw: Record<string, string>,
  headers: string[],
): FundRow | null {
  const year = parseYearText(raw.year_text ?? raw.year ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    totalIncome: numByAccountCode(cells, headers, "1135", FALLBACK.totalIncome),
    operating: numByAccountCode(cells, headers, "1086", FALLBACK.operating),
    assetLiability: numByAccountCode(cells, headers, "1126", FALLBACK.assetLiability),
    carryover: numByAccountCode(cells, headers, "1127", FALLBACK.carryover),
    tuitionAndFees: numByAccountCode(cells, headers, "1001", FALLBACK.tuitionAndFees),
    tuition: numByAccountCode(cells, headers, "1002", FALLBACK.tuition),
    undergradFee: numByAccountCode(cells, headers, "1008", FALLBACK.undergradFee),
    gradFee: numByAccountCode(cells, headers, "1009", FALLBACK.gradFee),
    transferGift: numByAccountCode(cells, headers, "1013", FALLBACK.transferGift),
    transfer: numByAccountCode(cells, headers, "1014", FALLBACK.transfer),
    donation: numByAccountCode(cells, headers, "1035", FALLBACK.donation),
    grant: numByAccountCode(cells, headers, "1048", FALLBACK.grant),
    ancillary: numByAccountCodes(cells, headers, ["1060", "1006"], FALLBACK.ancillary),
    otherEdu: numByAccountCode(cells, headers, "1071", FALLBACK.otherEdu),
  };
}

function parseSchoolCodeRaw(raw: Record<string, string>): SchoolCodeRow | null {
  const year = parseYearText(raw.year ?? raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  const schoolName = (raw.school_name ?? "").trim();
  if (!year || !schoolCodeStd || !schoolName) return null;
  return {
    year,
    schoolCodeStd,
    schoolName,
    mainBranchName: raw.main_branch_name ?? "",
    schoolRepCode: normalizeSchoolCodeText(raw.school_rep_code ?? "") || schoolCodeStd,
    schoolRepName: (raw.school_rep_name ?? "").trim() || schoolName,
    parentSchoolName: raw.parent_school_name ?? "",
    schoolDivision: raw.school_division ?? "",
    schoolKind: raw.school_kind ?? "",
    region: raw.region ?? "",
    estb: raw.estb ?? "",
    relatedLaw: raw.related_law ?? "",
    corpName: raw.corp_name ?? "",
    status: raw.status ?? "",
  };
}

/** 대학 = 일반대학·산업대학(대학교·산업대학). 전문대학. 대학원·사이버·각종 제외. */
export function settlementCohortOf(
  schoolKind: string,
  schoolDivision: string,
): SettlementCohort | null {
  const kind = schoolKind.trim();
  const div = schoolDivision.trim();
  if (kind.includes("대학원") || div.includes("대학원")) return null;
  if (kind.includes("사이버") || div.includes("사이버")) return null;
  if (kind.includes("각종") || kind.includes("방송통신")) return null;
  if (kind === "산업대학" || kind.includes("일반대학") || kind === "대학교") {
    return "university";
  }
  if (kind.includes("전문") || kind === "기능대학" || kind === "기술대학") {
    return "junior-college";
  }
  const resolved = resolveSchoolDivisionFromFields(kind, div);
  if (resolved === "전문대학") return "junior-college";
  if (resolved === "대학" && !kind.includes("교육")) return "university";
  return null;
}

function sidoOf(region: string): string {
  const hit = matchSidoRegion(region, region.trim());
  return hit?.shortLabel ?? (region.trim() || "기타");
}

function findSchoolCodeForFund(
  fund: { schoolCodeStd: string; schoolName: string },
  roster: SchoolCodeRow[],
  used: Set<SchoolCodeRow>,
): SchoolCodeRow | undefined {
  const byCode = roster.find(
    (row) => row.schoolCodeStd === fund.schoolCodeStd && !used.has(row),
  );
  if (byCode) {
    used.add(byCode);
    return byCode;
  }
  const byName = roster.find(
    (row) =>
      !used.has(row) && financeAlimiNameMatchesCampus(fund.schoolName, row),
  );
  if (byName) {
    used.add(byName);
    return byName;
  }
  return undefined;
}

function pickPrimaryCampus(rows: SchoolCodeRow[]): SchoolCodeRow {
  const main = rows.find((row) => row.mainBranchName === "본교");
  if (main) return main;
  const codeMatch = rows.find(
    (row) => row.schoolRepCode && row.schoolCodeStd === row.schoolRepCode,
  );
  if (codeMatch) return codeMatch;
  return [...rows].sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  )[0]!;
}

function emptyMatch(): SettlementMatchStats {
  return {
    fundRows: 0,
    matchedRows: 0,
    unmatchedRows: 0,
    matchedByCode: 0,
    matchedByName: 0,
    schools: 0,
    schoolsWithScale: 0,
  };
}

export function defaultSettlementYear(fundYears: number[]): number | null {
  const years = [...new Set(fundYears)].sort((a, b) => a - b);
  for (let i = years.length - 1; i >= 1; i -= 1) {
    if (years.includes(years[i]! - 1)) return years[i]!;
  }
  return years.at(-1) ?? null;
}

export async function loadSettlementIncomeReport(
  requestedYear: number | null,
): Promise<SettlementIncomeReportData> {
  const [fundRaw, schoolRaw, enrolledRaw, fundHeaders] = await Promise.all([
    readCsvFile("univMapEduFund").catch(() => []),
    readCsvFile("financeAnalysisSchoolCode").catch(() => []),
    readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []),
    loadFinanceAlimiHeaders("edu-fund"),
  ]);

  const fund = fundRaw
    .map((row) => parseFundRow(row, fundHeaders))
    .filter((row): row is FundRow => row != null);
  const rosterAll = schoolRaw
    .map(parseSchoolCodeRaw)
    .filter((row): row is SchoolCodeRow => row != null);
  const enrolledAll = enrolledRaw
    .map(parseAlimiEnrolledStudentsUndergrad)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const fundYears = [...new Set(fund.map((r) => r.year))].sort((a, b) => a - b);
  const settlementYear =
    requestedYear != null && fundYears.includes(requestedYear)
      ? requestedYear
      : defaultSettlementYear(fundYears);
  const priorYear = settlementYear != null ? settlementYear - 1 : 0;
  const trendYears =
    settlementYear != null
      ? Array.from({ length: 5 }, (_, i) => settlementYear - 4 + i).filter((y) =>
          fundYears.includes(y),
        )
      : [];

  const warnings: string[] = [];
  if (settlementYear == null) {
    throw new Error("교비자금(수입) 원본이 없습니다.");
  }
  if (!fundYears.includes(priorYear)) {
    throw new Error(`${settlementYear}년 전년도(${priorYear}) 교비자금(수입)이 없습니다.`);
  }
  if (trendYears.length < 5) {
    warnings.push(
      `5개년 시계열은 ${trendYears.join("·") || "없음"}만 있습니다. 없는 연도는 표에 넣지 않습니다.`,
    );
  }

  const rosterYears = [...new Set(rosterAll.map((r) => r.year))].sort((a, b) => a - b);
  const enrolledYears = [...new Set(enrolledAll.map((r) => r.year))].sort((a, b) => a - b);

  const schools: SettlementSchoolYear[] = [];
  const matchByYear: Record<number, SettlementMatchStats> = {};

  const yearsToBuild = [...new Set([...trendYears, settlementYear, priorYear])].sort(
    (a, b) => a - b,
  );

  for (const year of yearsToBuild) {
    const stats = emptyMatch();
    const yearFund = fund.filter((row) => row.year === year);
    stats.fundRows = yearFund.length;
    const rosterYear = pickNearestYear(rosterYears, year);
    const roster = rosterYear != null ? rosterAll.filter((r) => r.year === rosterYear) : [];
    const enrolledYear = pickNearestYear(enrolledYears, year);
    const enrolledYearRows =
      enrolledYear != null ? enrolledAll.filter((r) => r.year === enrolledYear) : [];

    const enrolledByCampus = new Map<string, number>();
    for (const row of enrolledYearRows) {
      enrolledByCampus.set(
        row.schoolCodeStd,
        (enrolledByCampus.get(row.schoolCodeStd) ?? 0) + row.enrolledA,
      );
    }

    const used = new Set<SchoolCodeRow>();
    type Acc = {
      campuses: SchoolCodeRow[];
      amounts: SettlementIncomeAmounts;
      matchBy: "code" | "name";
      campusHit: number;
    };
    const byRep = new Map<string, Acc>();

    for (const fundRow of yearFund) {
      const campus = findSchoolCodeForFund(fundRow, roster, used);
      if (!campus) {
        stats.unmatchedRows += 1;
        continue;
      }
      if (campus.estb.trim() !== "사립") {
        stats.unmatchedRows += 1;
        continue;
      }
      const cohort = settlementCohortOf(campus.schoolKind, campus.schoolDivision);
      if (!cohort) {
        stats.unmatchedRows += 1;
        continue;
      }
      stats.matchedRows += 1;
      const byCode = campus.schoolCodeStd === fundRow.schoolCodeStd;
      if (byCode) stats.matchedByCode += 1;
      else stats.matchedByName += 1;

      const rep = campus.schoolRepCode || campus.schoolCodeStd;
      const prev = byRep.get(rep);
      if (!prev) {
        byRep.set(rep, {
          campuses: [campus],
          amounts: { ...fundRow },
          matchBy: byCode ? "code" : "name",
          campusHit: 1,
        });
      } else {
        prev.campuses.push(campus);
        prev.amounts = addAmounts(prev.amounts, fundRow);
        prev.campusHit += 1;
        if (!byCode) prev.matchBy = "name";
      }
    }

    for (const [rep, acc] of byRep) {
      const primary = pickPrimaryCampus(acc.campuses);
      const cohort = settlementCohortOf(primary.schoolKind, primary.schoolDivision);
      if (!cohort) continue;
      const sido = sidoOf(primary.region);
      const zone = zoneForSido(primary.region) ?? zoneForSido(sido);
      let enrolledA = 0;
      let hasEnrolled = false;
      const rosterCampuses = roster.filter(
        (row) => (row.schoolRepCode || row.schoolCodeStd) === rep,
      );
      const seenCampus = new Set<string>();
      for (const campus of rosterCampuses.length ? rosterCampuses : acc.campuses) {
        if (seenCampus.has(campus.schoolCodeStd)) continue;
        seenCampus.add(campus.schoolCodeStd);
        const n = enrolledByCampus.get(campus.schoolCodeStd);
        if (n != null) {
          enrolledA += n;
          hasEnrolled = true;
        }
      }
      const scaleKind = cohort === "junior-college" ? "전문대" : "4년제";
      const scale = hasEnrolled
        ? schoolScaleFromEnrolled(enrolledA, scaleKind)
        : null;
      schools.push({
        year,
        schoolRepCode: rep,
        schoolRepName: primary.schoolRepName,
        cohort,
        estb: primary.estb,
        region: primary.region,
        sido,
        zone,
        scale,
        enrolledA: hasEnrolled ? enrolledA : null,
        campusCount: acc.campusHit,
        matchBy: acc.matchBy,
        amounts: acc.amounts,
      });
    }

    const yearSchools = schools.filter((s) => s.year === year);
    stats.schools = yearSchools.length;
    stats.schoolsWithScale = yearSchools.filter((s) => s.scale != null).length;
    matchByYear[year] = stats;

    if (year === settlementYear && stats.unmatchedRows > 0) {
      warnings.push(
        `${year}년 교비자금 ${stats.fundRows}행 중 학교코드·사립·학제 매칭 ${stats.matchedRows}행(코드 ${stats.matchedByCode}·이름 ${stats.matchedByName}), 제외 ${stats.unmatchedRows}행.`,
      );
    }
    if (year === settlementYear && stats.schools > 0 && stats.schoolsWithScale < stats.schools) {
      warnings.push(
        `${year}년 매칭 ${stats.schools}교 중 재학생(A) 규모 ${stats.schoolsWithScale}교. 규모 없는 학교는 규모 표에서 제외합니다.`,
      );
    }
  }

  const yearSchools = schools.filter((s) => s.year === settlementYear);
  if (!yearSchools.length) {
    throw new Error(
      `${settlementYear}년 사립 대학·전문대학에 매칭된 교비자금(수입)이 없습니다.`,
    );
  }

  const unusedZones = ANALYTICS_ZONES.filter(
    (z) => !yearSchools.some((s) => s.zone === z),
  );
  if (unusedZones.length) {
    warnings.push(`결산연도 매칭교가 없는 권역: ${unusedZones.join("·")}.`);
  }
  const usedSido = new Set(yearSchools.map((s) => s.sido));
  const missingSido = KOREA_SIDO_REGIONS.map((r) => r.shortLabel).filter(
    (label) => !usedSido.has(label),
  );
  if (missingSido.length) {
    warnings.push(`결산연도 매칭교가 없는 시·도: ${missingSido.join("·")}.`);
  }

  return {
    settlementYear,
    priorYear,
    trendYears,
    generatedAt: new Date().toISOString(),
    matchByYear,
    schools,
    warnings,
  };
}
