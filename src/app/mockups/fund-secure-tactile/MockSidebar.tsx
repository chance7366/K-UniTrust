"use client";

import { useState } from "react";

import {
  FINANCE_ANALYSIS_MENU_GROUPS,
} from "@/lib/analysis/finance-analysis-tabs";
import { UNIV_MAP_MENU_GROUPS } from "@/lib/analysis/univ-map-tabs";

type Props = {
  activeTabId?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={`fst-nav-chevron${open ? " open" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MockSidebar({ activeTabId = "fund-secure-rate" }: Props) {
  const [openSections, setOpenSections] = useState({
    univMap: true,
    financeAnalysis: true,
  });
  const [univGroupOpen, setUnivGroupOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(UNIV_MAP_MENU_GROUPS.map((g) => [g.id, true])),
  );
  const [financeGroupOpen, setFinanceGroupOpen] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        FINANCE_ANALYSIS_MENU_GROUPS.map((g) => [
          g.id,
          g.id === "univ-finance" || g.tabs.some((t) => t.id === activeTabId),
        ]),
      ),
  );

  return (
    <aside className="fst-sidebar">
      <div className="fst-sidebar-brand fst-soft-head">
        <div className="fst-brand-mark">K</div>
        <div>
          <p className="fst-brand-title">K-UniTrust</p>
          <p className="fst-brand-sub">Dashboard · Mockup</p>
        </div>
      </div>

      <nav className="fst-sidebar-nav">
        {/* 대학현황 */}
        <div className="fst-nav-section">
          <button
            type="button"
            className="fst-nav-section-btn"
            aria-expanded={openSections.univMap}
            onClick={() =>
              setOpenSections((s) => ({ ...s, univMap: !s.univMap }))
            }
          >
            <span className="fst-nav-dot" />
            <span className="fst-nav-section-label">대학현황</span>
            <span className="fst-nav-line" />
            <Chevron open={openSections.univMap} />
          </button>

          {openSections.univMap ? (
            <ul className="fst-nav-list">
              {UNIV_MAP_MENU_GROUPS.map((group) => {
                const isSingle = group.tabs.length === 1;
                const single = group.tabs[0];

                if (isSingle && single) {
                  return (
                    <li key={group.id}>
                      <button type="button" className="fst-nav-item" disabled title="목업 · 링크 없음">
                        <span className="fst-nav-icon">◈</span>
                        <span>{group.label}</span>
                      </button>
                    </li>
                  );
                }

                const open = univGroupOpen[group.id] ?? false;
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      className="fst-nav-item"
                      aria-expanded={open}
                      onClick={() =>
                        setUnivGroupOpen((prev) => ({
                          ...prev,
                          [group.id]: !prev[group.id],
                        }))
                      }
                    >
                      <span className="fst-nav-icon">◈</span>
                      <span className="fst-nav-item-label">{group.label}</span>
                      <Chevron open={open} />
                    </button>
                    {open ? (
                      <ul className="fst-nav-sub">
                        {group.tabs.map((tab) => (
                          <li key={tab.id}>
                            <button type="button" className="fst-nav-sub-item" disabled>
                              {tab.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {/* 대학재정분석 */}
        <div className="fst-nav-section">
          <button
            type="button"
            className="fst-nav-section-btn"
            aria-expanded={openSections.financeAnalysis}
            onClick={() =>
              setOpenSections((s) => ({
                ...s,
                financeAnalysis: !s.financeAnalysis,
              }))
            }
          >
            <span className="fst-nav-dot" />
            <span className="fst-nav-section-label">대학재정분석</span>
            <span className="fst-nav-line" />
            <Chevron open={openSections.financeAnalysis} />
          </button>

          {openSections.financeAnalysis ? (
            <ul className="fst-nav-list">
              {FINANCE_ANALYSIS_MENU_GROUPS.map((group) => {
                const isSingle = group.tabs.length === 1;
                const single = group.tabs[0];
                const groupActive = group.tabs.some((t) => t.id === activeTabId);

                if (isSingle && single) {
                  const active = single.id === activeTabId;
                  return (
                    <li key={group.id}>
                      <button
                        type="button"
                        className={`fst-nav-item${active ? " active" : ""}`}
                        disabled
                        title="목업 · 링크 없음"
                      >
                        <span className="fst-nav-icon">◇</span>
                        <span>{group.label}</span>
                      </button>
                    </li>
                  );
                }

                const open = financeGroupOpen[group.id] ?? groupActive;
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      className={`fst-nav-item${groupActive ? " active-group" : ""}`}
                      aria-expanded={open}
                      onClick={() =>
                        setFinanceGroupOpen((prev) => ({
                          ...prev,
                          [group.id]: !prev[group.id],
                        }))
                      }
                    >
                      <span className="fst-nav-icon">◇</span>
                      <span className="fst-nav-item-label">{group.label}</span>
                      <Chevron open={open} />
                    </button>
                    {open ? (
                      <ul className="fst-nav-sub">
                        {group.tabs.map((tab) => {
                          const active = tab.id === activeTabId;
                          return (
                            <li key={tab.id}>
                              <button
                                type="button"
                                className={`fst-nav-sub-item${active ? " active" : ""}`}
                                disabled={!active}
                                title={active ? "현재 메뉴" : "목업 · 링크 없음"}
                              >
                                {tab.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </nav>

      <div className="fst-sidebar-foot">목업 사이드바 · 실제 앱 미적용</div>
    </aside>
  );
}
