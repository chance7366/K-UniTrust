"use client";

import { useState } from "react";

import { TYPO_SPECTRUM } from "./typography-spec";
import "./freshman-enrollment-typography.css";

export function TypographySpectrumGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="typo-guide-root">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="typo-guide-toggle"
        aria-expanded={open}
      >
        {open ? "▾ L1~L10 타이포 가이드 숨기기" : "▸ L1~L10 타이포 가이드 보기"}
      </button>
      {open ? (
        <div className="typo-guide-panel">
          <h2 className="mb-3 text-base font-bold text-slate-900">
            L1 ~ L10 단계별 폰트 스펙트럼 비교 및 가이드
          </h2>
          <p className="mb-4 text-[13px] text-muted">
            와이드 모니터 가독성을 위해 구(Old) 대비 신(New) 크기로 확대 · 색상은 프로덕션 기존 유지
          </p>
          <div className="overflow-x-auto">
            <table className="typo-guide-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-sm font-bold text-slate-900">Level</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-slate-900">요소</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-red-500">구 (Old)</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-emerald-600">신 (New)</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-slate-900">Tailwind</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-slate-900">Weight / Color</th>
                  <th className="px-3 py-2.5 text-sm font-bold text-slate-900">적용 대상</th>
                </tr>
              </thead>
              <tbody>
                {TYPO_SPECTRUM.map((row) => (
                  <tr key={row.level} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 text-sm font-bold text-slate-900">{row.level}</td>
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-700">{row.element}</td>
                    <td className="px-3 py-2.5 text-sm text-red-500 line-through opacity-80">
                      {row.oldSize}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-bold text-emerald-600">{row.newSize}</td>
                    <td className="px-3 py-2.5">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                        {row.tailwind}
                      </code>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-slate-600">{row.weight}</td>
                    <td className="px-3 py-2.5 text-[13px] text-slate-500">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
