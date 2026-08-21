"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  Landmark,
  LineChart,
  PieChart,
  SlidersHorizontal,
  TrendingUp,
  Upload,
} from "lucide-react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./home-landing.css";

const KPI_ITEMS = [
  {
    label: "분석 대상",
    value: "272개교",
    sub: "4년제·전문대학 통합",
  },
  {
    label: "데이터 기간",
    value: "2021~2026",
    sub: "연도별 시계열 비교",
  },
  {
    label: "핵심 지표",
    value: "8개",
    sub: "학생충원·재정·법인 지표",
  },
] as const;

const FEATURES = [
  {
    title: "대학현황",
    description:
      "학교개황·대학알리미·재정알리미·지역인구 등 기초자료 DB와 대학 위치·분석대상을 조회합니다.",
    href: "/analysis/univ-map?tab=school-overview",
    icon: Landmark,
    tone: "blue" as const,
  },
  {
    title: "재정분석지표",
    description:
      "자금확보율·등록금의존율 등 대학·법인재정 비율 지표로 건전성을 분석합니다.",
    href: "/analysis/finance-analysis?tab=fund-secure-rate",
    icon: PieChart,
    tone: "mint" as const,
  },
  {
    title: "대학경쟁력분석",
    description:
      "동적 백분위 기반 3단계 분석을 통해 동종 집단 내 종합 등급(S~E)을 산출합니다.",
    href: "/analysis/competitiveness-analysis/settings",
    icon: TrendingUp,
    tone: "green" as const,
  },
  {
    title: "재정추계분석",
    description:
      "대상대학·기초자료·시나리오를 설정하고 사립대학 중장기 재정추계를 실행·조회합니다.",
      href: "/analysis/financial-projection/settings",
    icon: LineChart,
    tone: "mint" as const,
  },
] as const;

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: "데이터 업로드",
    description:
      "학교개황·재정 지표 Excel/CSV를 업로드하고 CSV 저장소에 반영합니다.",
    icon: Upload,
  },
  {
    num: 2,
    title: "가중치·지표 설정",
    description: "대상대학, 적용 지표, 카테고리 가중치와 분석방법을 설정합니다.",
    icon: SlidersHorizontal,
  },
  {
    num: 3,
    title: "종합점수·등급 도출",
    description:
      "1~3단계 분석 실행 후 종합지수·순위·진단 등급(S~E)을 확인합니다.",
    icon: Award,
  },
] as const;

export function HomePageContent({ showMockBanner = false }: { showMockBanner?: boolean }) {
  return (
    <div className={`hlm-root ${FDB_TYPO.tableBody}`}>
      {showMockBanner ? (
        <div className="hlm-mock-banner" role="note">
          <span>
            <strong>UI 목업</strong> — 메인(랜딩) 페이지 시안 · 프로덕션{" "}
            <code className="rounded bg-white/70 px-1">/</code> 에 적용됨
          </span>
          <Link
            href="/"
            className="font-semibold text-[#2a7a55] underline-offset-2 hover:underline"
          >
            프로덕션 홈 →
          </Link>
        </div>
      ) : null}

      <section className="hlm-hero" aria-labelledby="hlm-hero-title">
        <div className="hlm-hero-pattern" aria-hidden />
        <div className="hlm-hero-inner">
          <div className="hlm-hero-top">
            <div className="hlm-hero-icon" aria-hidden>
              <Building2 size={20} strokeWidth={2.2} />
            </div>
            <span className="hlm-hero-badge">K-UniTrust Dashboard</span>
          </div>
          <h1 id="hlm-hero-title" className="hlm-hero-title">
            대한민국 사립·전문대학의 현황과 재정 경쟁력을
            <br className="hidden sm:block" />
            한곳에서 조회하고 분석하세요.
          </h1>
          <p className="hlm-hero-sub">
            복잡한 공공 교육 데이터를 통합하여, 대학 기획·재무 담당자와 정책
            연구자를 위한 객관적인 지표 분석 및 경쟁력 평가를 제공합니다.
          </p>
          <div className="hlm-hero-actions">
            <Link
              href="/analysis/competitiveness-analysis/settings"
              className="hlm-btn-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
            >
              <TrendingUp size={16} aria-hidden />
              경쟁력 분석 시작
            </Link>
            <Link
              href="/analysis/univ-map?tab=school-overview"
              className="hlm-btn-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b9a6a]"
            >
              <Landmark size={16} aria-hidden />
              대학현황 둘러보기
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="hlm-kpi-heading">
        <h2 id="hlm-kpi-heading" className="hlm-section-title">
          Data Overview
        </h2>
        <div className="hlm-kpi-grid mt-3">
          {KPI_ITEMS.map((item) => (
            <article key={item.label} className="hlm-kpi-card">
              <p className="hlm-kpi-label">{item.label}</p>
              <p className="hlm-kpi-value">{item.value}</p>
              <p className="hlm-kpi-sub">{item.sub}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="hlm-features-heading">
        <h2 id="hlm-features-heading" className="hlm-section-title">
          핵심 기능
        </h2>
        <div className="hlm-feature-grid mt-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="hlm-feature-card">
                <div
                  className={`hlm-feature-icon ${feature.tone}`}
                  aria-hidden
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="hlm-feature-title">{feature.title}</h3>
                <p className="hlm-feature-desc">{feature.description}</p>
                <Link href={feature.href} className="hlm-feature-link">
                  바로가기
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="hlm-workflow" aria-labelledby="hlm-workflow-heading">
        <h2 id="hlm-workflow-heading" className="hlm-section-title">
          분석 워크플로
        </h2>
        <div className="hlm-workflow-steps">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="contents">
                <div className="hlm-workflow-step">
                  <span className="hlm-workflow-step-num">{step.num}</span>
                  <p className="hlm-workflow-step-title">
                    <Icon
                      size={14}
                      className="mr-1 inline -translate-y-px"
                      aria-hidden
                    />
                    {step.title}
                  </p>
                  <p className="hlm-workflow-step-desc">{step.description}</p>
                </div>
                {index < WORKFLOW_STEPS.length - 1 ? (
                  <div className="hlm-workflow-arrow" aria-hidden>
                    <ArrowRight size={18} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <p className="hlm-footer-note">
        K-UniTrust Dashboard · Soft Mint / Tactile Light · CSV store · data/csv
      </p>
    </div>
  );
}
