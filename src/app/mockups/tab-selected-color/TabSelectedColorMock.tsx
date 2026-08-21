"use client";

import Link from "next/link";
import { BarChart3, Database } from "lucide-react";
import { useState } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";

import "./tab-selected-color.css";

const SECTIONS = [
  { id: "data" as const, label: "대학별지표", Icon: Database },
  { id: "charts" as const, label: "통계분석", Icon: BarChart3 },
];

const COHORTS = [
  { id: "univ", label: "대학", count: "151" },
  { id: "grad", label: "대학원", count: "146" },
  { id: "combined", label: "대학통합", count: "151" },
  { id: "junior", label: "전문대학", count: "123" },
];

type SectionId = (typeof SECTIONS)[number]["id"];
type CohortId = (typeof COHORTS)[number]["id"];

function usePair() {
  const [section, setSection] = useState<SectionId>("data");
  const [cohort, setCohort] = useState<CohortId>("univ");
  return { section, setSection, cohort, setCohort };
}

function DemoRow({
  tone,
  section,
  setSection,
  cohort,
  setCohort,
}: {
  tone: string;
  section: SectionId;
  setSection: (id: SectionId) => void;
  cohort: CohortId;
  setCohort: (id: CohortId) => void;
}) {
  return (
    <div className="tsc-row">
      <div className="tsc-seg">
        {SECTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tsc-item ${tone}${section === tab.id ? " is-on" : ""}`}
            onClick={() => setSection(tab.id)}
          >
            <tab.Icon size={12} strokeWidth={2.6} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tsc-seg">
        {COHORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tsc-item ${tone}${cohort === item.id ? " is-on" : ""}`}
            onClick={() => setCohort(item.id)}
          >
            {item.label}
            <span className="tsc-count">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TabSelectedColorMock() {
  const green = usePair();
  const sky = usePair();
  const slate = usePair();
  const ink = usePair();
  const amber = usePair();

  return (
    <div className="tsc-page">
      <DashboardEmeraldHeader
        sectionLabel="목업 · 미적용"
        title="선택색 제안"
        subtitle="바깥 유리는 그대로, 선택된 칸만 색을 바꿉니다"
        note="헤더·표·DB down은 녹색으로 두고, 탭 선택만 다른 색으로 구분하는 안입니다."
      />

      <p className="text-[13px] text-muted">
        <Link
          href="/analysis/finance-analysis?tab=freshman-enrollment-rate"
          className="text-accent hover:underline"
        >
          신입생충원율로 돌아가기
        </Link>
      </p>

      <section className="tsc-card">
        <p className="tsc-kicker">지금</p>
        <h2 className="tsc-title">민트 선택</h2>
        <p className="tsc-desc">
          DB down과 같은 녹색입니다. 헤더·표 제목·버튼이 이미 녹색이라 선택이
          묻힙니다.
        </p>
        <DemoRow tone="tsc-green" {...green} />
      </section>

      <section className="tsc-card">
        <p className="tsc-kicker">추천</p>
        <h2 className="tsc-title">스카이 블루</h2>
        <p className="tsc-desc">
          테마에 이미 있는 보조색(#2d7fd6)입니다. 사이드바 선택도 파란 계열이라
          “지금 보고 있는 화면”과 맞습니다. 녹색 위 유일하게 또렷합니다.
        </p>
        <DemoRow tone="tsc-sky" {...sky} />
      </section>

      <section className="tsc-card">
        <p className="tsc-kicker">조용한 안</p>
        <h2 className="tsc-title">스틸 슬레이트</h2>
        <p className="tsc-desc">
          배경 회색-블루(#e9eef3)와 본문색에 가깝습니다. 색이 덜 튀고, 녹색과도
          싸우지 않습니다.
        </p>
        <DemoRow tone="tsc-slate" {...slate} />
      </section>

      <section className="tsc-card">
        <p className="tsc-kicker">또렷한 안</p>
        <h2 className="tsc-title">잉크 네이비</h2>
        <p className="tsc-desc">
          글자색(#1a2433)을 채운 선택입니다. 가장 단정하지만, 작게 보면 조금
          무거울 수 있습니다.
        </p>
        <DemoRow tone="tsc-ink" {...ink} />
      </section>

      <section className="tsc-card">
        <p className="tsc-kicker">대비 안</p>
        <h2 className="tsc-title">웜 앰버</h2>
        <p className="tsc-desc">
          녹색의 보색에 가깝습니다. 잘 보이지만, 경고·주의 색과 닮아 지표
          화면에는 덜 맞을 수 있습니다.
        </p>
        <DemoRow tone="tsc-amber" {...amber} />
      </section>
    </div>
  );
}
