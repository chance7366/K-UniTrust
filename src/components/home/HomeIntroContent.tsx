"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { IntroLogoMarquee } from "@/components/home/IntroLogoMarquee";
import { HomeLogoutButton } from "@/components/home/HomeLogoutButton";
import { HomePasswordForm } from "@/components/home/HomePasswordForm";
import type { AccessRole } from "@/lib/auth/access";
import { accessRoleLabel } from "@/lib/auth/access";
import type { UniversityLogosManifest } from "@/lib/university-logos-manifest";
import { SidebarBrandLogoMark } from "@/components/layout/SidebarBrand";

import "./home-intro.css";

export function HomeIntroContent({
  showMockBanner = false,
  showLogoMarquee = true,
  logoMarqueeManifest = null,
  passwordGate = false,
  accessRole = null,
}: {
  showMockBanner?: boolean;
  showLogoMarquee?: boolean;
  logoMarqueeManifest?: UniversityLogosManifest | null;
  passwordGate?: boolean;
  accessRole?: AccessRole | null;
}) {
  return (
    <div className="him-page">
      <div className={`him-root${showLogoMarquee ? " him-root-with-marquee" : ""}`}>
        <div className="him-bg-dots" aria-hidden />
        <div className="him-bg-blur-green" aria-hidden />
        <div className="him-bg-blur-blue" aria-hidden />

        {showMockBanner ? (
          <div className="him-mock-banner" role="note">
            <span>
              <strong>UI 목업</strong> — 몰입형 인트로 · 프로덕션{" "}
              <code className="rounded bg-white/70 px-1">/</code> 에 적용됨
            </span>
            <span className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="font-semibold text-[#2a7a55] underline-offset-2 hover:underline"
              >
                프로덕션 홈 →
              </Link>
              <Link
                href="/mockups/home-landing"
                className="font-semibold text-[#2a7a55] underline-offset-2 hover:underline"
              >
                이전 랜딩 목업 →
              </Link>
            </span>
          </div>
        ) : null}

        <div
          className={`him-content${showLogoMarquee ? " him-content-with-marquee" : ""}`}
        >
          <div className="him-inner">
            <div className="him-brand-row him-animate him-delay-0">
              <div className="him-brand-mark-slot" aria-hidden>
                <SidebarBrandLogoMark size={40} />
              </div>
              <span className="him-brand-wordmark font-brand">K-UniTrust</span>
            </div>

            <h1 className="mb-0">
              <span className="him-title him-title-gradient-green-blue him-animate him-delay-1 block">
                사립 대학·전문대학의 현황과 재정경쟁력을
                <br />
                K-UniTrust에서 조회하고 분석하세요
              </span>
            </h1>

            <p className="him-sub him-animate him-delay-2">
              복잡한 공공 교육 데이터를 통합하여, 대학 기획·재무 담당자와
              정책 연구자를 위한 객관적인 지표 분석 및 경쟁력 평가를
              제공합니다.
            </p>

            {passwordGate && !accessRole ? (
              <HomePasswordForm />
            ) : (
              <div className="him-actions him-animate him-delay-3">
                <Link
                  href="/analysis/univ-map?tab=school-overview"
                  className="him-btn-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
                >
                  시작하기
                  <ArrowRight size={18} aria-hidden />
                </Link>
                {passwordGate && accessRole ? (
                  <span className="him-access-meta">
                    {accessRoleLabel(accessRole)}
                    <HomeLogoutButton />
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {showLogoMarquee ? (
            <IntroLogoMarquee initialManifest={logoMarqueeManifest} />
          ) : null}
        </div>

        {!showLogoMarquee ? (
          <p className="him-footer-hint">
            K-UniTrust Dashboard · Soft Mint / Tactile Light
          </p>
        ) : null}
      </div>
    </div>
  );
}
