"use client";

import Link from "next/link";
import { BarChart3, Database } from "lucide-react";
import { useState } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";

import "./finance-tab-buttons.css";

const SECTIONS = [
  { id: "data" as const, label: "대학별DB", Icon: Database },
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

function VariantCard({
  kicker,
  title,
  desc,
  children,
}: {
  kicker: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ftb-card">
      <p className="ftb-card-kicker">{kicker}</p>
      <h2 className="ftb-card-title">{title}</h2>
      <p className="ftb-card-desc">{desc}</p>
      {children}
    </section>
  );
}

export function FinanceTabButtonsMock() {
  const a = usePair();
  const b = usePair();
  const c = usePair();
  const d = usePair();
  const e = usePair();

  return (
    <div className="ftb-page">
      <DashboardEmeraldHeader
        sectionLabel="목업 · 미적용"
        title="탭 버튼 제안"
        subtitle="대학별DB · 통계분석 · 코호트"
        note="실제 재정분석 화면은 바꾸지 않았습니다. 마음에 드는 안을 골라 주세요."
      />

      <p className="text-[13px] text-muted">
        <Link href="/analysis/finance-analysis?tab=freshman-enrollment-rate" className="text-accent hover:underline">
          신입생충원율로 돌아가기
        </Link>
      </p>

      <VariantCard
        kicker="A · 현재"
        title="박스 + 남색 선택"
        desc="지금 화면입니다. 바깥 테두리 두 개, 선택 색이 남색·민트로 갈라져 있습니다."
      >
        <div className="ftb-row">
          <div className="ftb-a-seg">
            {SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ftb-a-tab${a.section === tab.id ? " is-on" : ""}`}
                onClick={() => a.setSection(tab.id)}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ftb-a-seg">
            {COHORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ftb-a-chip${a.cohort === item.id ? " is-on" : ""}`}
                onClick={() => a.setCohort(item.id)}
              >
                {item.label} {item.count}
              </button>
            ))}
          </div>
        </div>
      </VariantCard>

      <VariantCard
        kicker="B · 추천"
        title="민트 글래스"
        desc="DB down·도움말과 같은 연한 민트 그라데이션. 선택만 밝게, 그룹은 한 덩어리로 묶습니다."
      >
        <div className="ftb-row">
          <div className="ftb-b-seg">
            {SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ftb-b-tab${b.section === tab.id ? " is-on" : ""}`}
                onClick={() => b.setSection(tab.id)}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ftb-b-seg">
            {COHORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ftb-b-chip${b.cohort === item.id ? " is-on" : ""}`}
                onClick={() => b.setCohort(item.id)}
              >
                {item.label}
                <span className="ftb-count">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </VariantCard>

      <VariantCard
        kicker="C"
        title="밑줄 탭"
        desc="박스를 없앱니다. 선택 항목만 녹색 밑줄. 가장 조용한 안입니다."
      >
        <div className="ftb-row">
          <div className="ftb-c-seg">
            {SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ftb-c-tab${c.section === tab.id ? " is-on" : ""}`}
                onClick={() => c.setSection(tab.id)}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ftb-c-chips">
            {COHORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ftb-c-chip${c.cohort === item.id ? " is-on" : ""}`}
                onClick={() => c.setCohort(item.id)}
              >
                {item.label} {item.count}
              </button>
            ))}
          </div>
        </div>
      </VariantCard>

      <VariantCard
        kicker="D"
        title="열린 칩"
        desc="바깥 프레임 없이 알약만 나열합니다. 선택은 연한 민트 배경입니다."
      >
        <div className="ftb-row">
          {SECTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ftb-d-tab${d.section === tab.id ? " is-on" : ""}`}
              onClick={() => d.setSection(tab.id)}
            >
              <tab.Icon size={14} />
              {tab.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {COHORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ftb-d-chip${d.cohort === item.id ? " is-on" : ""}`}
              onClick={() => d.setCohort(item.id)}
            >
              {item.label} {item.count}
            </button>
          ))}
        </div>
      </VariantCard>

      <VariantCard
        kicker="E"
        title="역할 분리"
        desc="화면 전환(대학별DB·통계분석)은 큰 글자+밑줄, 코호트는 작은 민트 칩으로 나눕니다."
      >
        <div className="ftb-row">
          {SECTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ftb-e-tab${e.section === tab.id ? " is-on" : ""}`}
              onClick={() => e.setSection(tab.id)}
            >
              <tab.Icon size={15} />
              {tab.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {COHORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ftb-e-chip${e.cohort === item.id ? " is-on" : ""}`}
              onClick={() => e.setCohort(item.id)}
            >
              {item.label} {item.count}
            </button>
          ))}
        </div>
      </VariantCard>
    </div>
  );
}
