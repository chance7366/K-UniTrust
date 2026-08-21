"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ChartsSection } from "./ChartsSection";
import { DataDbSection } from "./DataDbSection";
import { MockSidebar } from "./MockSidebar";

type Section = "charts" | "data";

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") === "data" ? "data" : "charts") as Section;

  function setSection(next: Section) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="fst-banner fst-soft-head">
        <span>✦ Tactile Light 목업 v2.5 · KPI warm tones · 실제 앱 미적용</span>
        <Link href="/analysis/finance-analysis?tab=fund-secure-rate&year=2024&section=charts">
          현재 앱 보기 →
        </Link>
        <Link href="/mockups/fund-secure-light?section=charts">이전 목업(인디고) →</Link>
      </div>

      <div className="fst-shell">
        <MockSidebar activeTabId="fund-secure-rate" />

        <div className="fst-main">
          <div className="fst-page">
            <header className="fst-hero">
              <div className="fst-hero-bar fst-soft-head">
                <h1>자금확보율</h1>
                <p>등록금수입(수강료제외) 대비 자금 확보 현황</p>
              </div>
              <div className="fst-hero-body">
                <div className="fst-section-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={section === "charts"}
                    className={`fst-section-tab${section === "charts" ? " active" : ""}`}
                    onClick={() => setSection("charts")}
                  >
                    통계분석
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={section === "data"}
                    className={`fst-section-tab${section === "data" ? " active" : ""}`}
                    onClick={() => setSection("data")}
                  >
                    대학별DB
                  </button>
                </div>
              </div>
            </header>

            {section === "charts" ? <ChartsSection /> : <DataDbSection />}
          </div>
        </div>
      </div>
    </>
  );
}

export default function FundSecureTactilePage() {
  return (
    <Suspense fallback={<div className="fst-page">로딩…</div>}>
      <Content />
    </Suspense>
  );
}
