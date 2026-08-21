"use client";

import type { ReactNode } from "react";
import { Tooltip } from "recharts";

export type SoftMintTipTone = "green" | "orange" | "blue" | "red" | "violet";

export type SoftMintTooltipFormatter = (
  value: number | string | undefined,
  name?: string,
) => string;

type PayloadLike = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  stroke?: string;
  payload?: Record<string, unknown>;
};

function normalizeColor(color?: string): string {
  if (!color) return "";
  return color.trim().toLowerCase();
}

/** 시리즈 색상 → Soft Mint 칩 톤 */
export function toneFromSeriesColor(color?: string): SoftMintTipTone {
  const c = normalizeColor(color);
  if (!c) return "orange";

  if (
    c.includes("f59e0b") ||
    c.includes("ff9f1a") ||
    c.includes("f08a24") ||
    c.includes("ffd24a") ||
    c.includes("amber") ||
    c.includes("orange")
  ) {
    return "orange";
  }
  if (
    c.includes("3b82f6") ||
    c.includes("2d7fd6") ||
    c.includes("sky") ||
    c.includes("blue")
  ) {
    return "blue";
  }
  if (
    c.includes("f43f5e") ||
    c.includes("d93a48") ||
    c.includes("rose") ||
    c.includes("red")
  ) {
    return "red";
  }
  if (
    c.includes("8b5cf6") ||
    c.includes("7c5cfc") ||
    c.includes("violet") ||
    c.includes("purple")
  ) {
    return "violet";
  }
  if (
    c.includes("10b981") ||
    c.includes("3b9a6a") ||
    c.includes("2a7a55") ||
    c.includes("146c43") ||
    c.includes("emerald") ||
    c.includes("green") ||
    c.includes("mint")
  ) {
    return "green";
  }

  return "orange";
}

function yoyTone(value: number): SoftMintTipTone {
  if (value < 0) return "red";
  if (value >= 2) return "orange";
  return "green";
}

function formatSignedYoy(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0%p";
  return `${value > 0 ? "+" : ""}${value}%p`;
}

type SoftMintChartTooltipProps = {
  formatter?: SoftMintTooltipFormatter;
  /** ComposedChart 막대 hover 배경 */
  cursorFill?: string;
};

/**
 * Soft Mint / Tactile 칩형 Recharts Tooltip
 * — 시리즈 색(주황·파랑·민트 등)에 맞춰 배경·글자색 매칭
 */
export function SoftMintChartTooltip({
  formatter,
  cursorFill = "rgba(255, 176, 32, 0.12)",
}: SoftMintChartTooltipProps) {
  return (
    <Tooltip
      cursor={{ fill: cursorFill }}
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const items = payload as unknown as PayloadLike[];
        const row = (items[0]?.payload ?? {}) as {
          region?: string;
          avgRate?: number;
          yoy?: number;
          schoolCount?: number;
        };

        const rateEntry = items.find((p) => String(p.dataKey) === "avgRate");
        const yoyEntry = items.find((p) => String(p.dataKey) === "yoy");

        if (rateEntry || yoyEntry) {
          const chips: ReactNode[] = [];
          if (rateEntry) {
            const rate =
              typeof row.avgRate === "number"
                ? row.avgRate
                : Number(rateEntry.value);
            const display = formatter
              ? formatter(rate, String(rateEntry.name ?? "평균"))
              : `${rate}%`;
            chips.push(
              <div
                key="avgRate"
                className={`chart-tip-chip ${toneFromSeriesColor(
                  rateEntry.color ?? rateEntry.fill ?? rateEntry.stroke,
                )}`}
              >
                <span>{String(rateEntry.name ?? "평균")}</span>
                <strong>
                  {label != null && label !== "" ? `${label} ` : ""}
                  {display}
                </strong>
              </div>,
            );
          }
          if (yoyEntry) {
            const yoy =
              typeof row.yoy === "number" ? row.yoy : Number(yoyEntry.value);
            const schoolPart =
              row.schoolCount != null
                ? ` · ${row.schoolCount.toLocaleString("ko-KR")}개교`
                : "";
            chips.push(
              <div key="yoy" className={`chart-tip-chip ${yoyTone(yoy)}`}>
                <span>전년 대비</span>
                <strong>
                  {formatSignedYoy(yoy)}
                  {schoolPart}
                </strong>
              </div>,
            );
          }
          return <div className="chart-tip-stack">{chips}</div>;
        }

        return (
          <div className="chart-tip-stack">
            {items.map((entry) => {
              const tone = toneFromSeriesColor(
                entry.color ?? entry.fill ?? entry.stroke,
              );
              const raw = entry.value;
              const display = formatter
                ? formatter(raw, entry.name)
                : String(raw ?? "—");
              const title = entry.name ?? String(entry.dataKey ?? "");
              return (
                <div
                  key={String(entry.dataKey ?? entry.name)}
                  className={`chart-tip-chip ${
                    items.length > 1 ? "chart-tip-chip-inline" : ""
                  } ${tone}`}
                >
                  {items.length > 1 ? (
                    <strong>
                      {label != null && label !== "" ? `${label} · ` : ""}
                      {title} {display}
                    </strong>
                  ) : items.length === 1 && label != null && label !== "" ? (
                    <>
                      <span>{title}</span>
                      <strong>
                        {label} {display}
                      </strong>
                    </>
                  ) : (
                    <>
                      <span>{title}</span>
                      <strong>{display}</strong>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      }}
    />
  );
}
