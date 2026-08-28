import { NextResponse } from "next/server";

import { computeStudentFillEdition } from "@/lib/analysis/student-fill-analysis/compute-run";
import { attachStudentFillAux } from "@/lib/analysis/student-fill-analysis/load-join";
import {
  listStudentFillEditionYears,
  readStudentFillEdition,
  writeStudentFillEdition,
} from "@/lib/analysis/student-fill-analysis/store";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listStudentFillSourceYears } from "@/lib/analysis/student-fill-analysis/load-freshman";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parseYear(value: unknown, years: number[]): number | null {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (years.length && !years.includes(year)) return null;
  if (year < 2000 || year > 2100) return null;
  return year;
}

function mergeYears(sourceYears: number[], editionYears: number[]): number[] {
  return [...new Set([...sourceYears, ...editionYears])].sort((a, b) => b - a);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceYears = await listStudentFillSourceYears();
    const editionYears = await listStudentFillEditionYears();
    const years = mergeYears(sourceYears, editionYears);
    const year =
      parseYear(url.searchParams.get("year"), years) ??
      editionYears[0] ??
      sourceYears[0] ??
      null;
    const includeHistory = url.searchParams.get("history") === "1";
    if (year == null) {
      return NextResponse.json({
        years,
        analysisYear: null,
        edition: null,
        ...(includeHistory ? { history: [] } : {}),
      });
    }
    const stored = await readStudentFillEdition(year);
    const edition = stored
      ? {
          ...stored,
          schools: await attachStudentFillAux(stored.schools, year),
        }
      : null;

    let history: { year: number; schools: Awaited<ReturnType<typeof attachStudentFillAux>> }[] | undefined;
    if (includeHistory) {
      history = [];
      for (const y of editionYears) {
        const item = await readStudentFillEdition(y);
        if (!item) continue;
        history.push({
          year: y,
          schools: await attachStudentFillAux(item.schools, y),
        });
      }
    }

    return NextResponse.json({
      years,
      analysisYear: year,
      edition,
      ...(history ? { history } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석결과를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as { analysisYear?: unknown };
    const years = await listStudentFillSourceYears();
    const year = parseYear(body.analysisYear, years);
    if (year == null) {
      return NextResponse.json(
        { error: "분석연도가 올바르지 않습니다. 신입생충원 자료가 있는 연도를 고르세요." },
        { status: 400 },
      );
    }
    const edition = await computeStudentFillEdition(year);
    await writeStudentFillEdition(edition);
    return NextResponse.json({
      ok: true,
      analysisYear: year,
      lastRunAt: edition.lastRunAt,
      schoolCount: edition.schoolCount,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석실행에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
