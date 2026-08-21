"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ChartsSection } from "./ChartsSection";
import { DataDbSection } from "./DataDbSection";

type Section = "charts" | "data";

function FundSecureLightContent() {
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
      <div className="fsl-banner">
        <span>✦ Modern Light &amp; Tactile UI 목업 · 실제 앱 미적용</span>
        <Link href="/analysis/finance-analysis?tab=fund-secure-rate&year=2024&section=charts">
          현재 앱(다크) 보기 →
        </Link>
      </div>

      <div className="fsl-page">
        <header className="fsl-card fsl-card-pad fsl-page-header">
          <h1>자금확보율</h1>
          <p>등록금수입(수강료제외) 대비 자금 확보 현황</p>
        </header>

        <div className="fsl-section-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={section === "charts"}
            className={`fsl-section-tab${section === "charts" ? " active" : ""}`}
            onClick={() => setSection("charts")}
          >
            통계분석
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "data"}
            className={`fsl-section-tab${section === "data" ? " active" : ""}`}
            onClick={() => setSection("data")}
          >
            대학별DB
          </button>
        </div>

        {section === "charts" ? <ChartsSection /> : <DataDbSection />}
      </div>
    </>
  );
}

export default function FundSecureLightMockupPage() {
  return (
    <Suspense fallback={<div className="fsl-page">로딩…</div>}>
      <FundSecureLightContent />
    </Suspense>
  );
}
