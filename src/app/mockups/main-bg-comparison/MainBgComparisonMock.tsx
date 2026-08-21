"use client";

import Link from "next/link";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./main-bg-comparison.css";

type BgOption = {
  id: string;
  title: string;
  subtitle: string;
  canvasClass: string;
  note: string;
};

const OPTIONS: BgOption[] = [
  {
    id: "option1",
    title: "1안 · 쿨 캔버스 + 웜 카드",
    subtitle: "블루-슬레이트 바닥 · 에메랄드 헤더 대비 ↑",
    canvasClass: "mbg-canvas--option1",
    note: "민트 glow를 줄이고 차가운 회청색 그라데이션. 흰 패널·에메랄드 헤더가 가장 또렷하게 떠 보입니다.",
  },
  {
    id: "option2",
    title: "2안 · 소프트 민트 + 깊이",
    subtitle: "브랜드 민트 유지 · 가장자리 어둡게",
    canvasClass: "mbg-canvas--option2",
    note: "Soft Mint 톤을 유지하면서 중앙은 밝고 가장자리는 살짝 어둡게. 기존 테마와 가장 가깝습니다.",
  },
  {
    id: "option3",
    title: "3안 · 대각 그라데이션",
    subtitle: "좌상 민트 → 우하 블루-그레이",
    canvasClass: "mbg-canvas--option3",
    note: "135° 대각 흐름으로 긴 페이지에서 단조로움이 줄어듭니다. 헤더와 업로드 패널 모두 무난히 어울립니다.",
  },
];

function UploadPanelMock({ opaque }: { opaque?: boolean }) {
  return (
    <section
      className={`mbg-upload-panel${opaque ? " mbg-upload-panel--opaque" : ""}`}
    >
      <p
        className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}
      >
        엑셀업로드
      </p>
      <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>학령인구</h4>
      <p className={`mt-2 ${FDB_TYPO.bodyText}`}>
        고등·중등·초등 학년별 학생수 엑셀 업로드 패널 (목업)
      </p>
      <p className={`mt-2 ${FDB_TYPO.legend}`}>
        최근 업로드: 2026. 8. 10. · 90행 · 18건 저장
      </p>
      {opaque ? (
        <p className="mbg-note">패널: bg-surface 불투명 (대비 강화 예시)</p>
      ) : (
        <p className="mbg-note">패널: 현행 bg-surface/60 + glow-panel-kpi</p>
      )}
    </section>
  );
}

function SampleDataCard() {
  return (
    <div className="mbg-sample-card">
      <h3>시도별자료 · 미리보기</h3>
      <div className="mbg-sample-row">
        <span>전국 · 고3</span>
        <strong>439,660</strong>
      </div>
      <div className="mbg-sample-row">
        <span>서울 · 고3</span>
        <strong>69,635</strong>
      </div>
      <div className="mbg-sample-row">
        <span>경기 · 고3</span>
        <strong>121,195</strong>
      </div>
    </div>
  );
}

function OptionColumn({ option }: { option: BgOption }) {
  return (
    <article className="mbg-column">
      <div className="mbg-column-label">
        {option.title}
        <span>{option.subtitle}</span>
      </div>
      <div className={`mbg-canvas ${option.canvasClass}`}>
        <div className="flex flex-col gap-3">
          <DashboardEmeraldHeader
            sectionLabel="재정분석"
            title="학령인구"
            subtitle="교육통계연보 · 초·중·고 학년별 학생수"
          />
          <UploadPanelMock opaque={option.id === "option1"} />
          <SampleDataCard />
          <p className={`${FDB_TYPO.legend} text-muted`}>{option.note}</p>
        </div>
      </div>
    </article>
  );
}

export function MainBgComparisonMock() {
  return (
    <div className="mbg-page">
      <div className="mbg-banner">
        <span>✦ main 배경 3안 비교 목업 · 실제 AppShell/bg-glow-main 미적용</span>
        <Link href="/analysis/finance-analysis?tab=school-age-population">
          현재 앱(학령인구) 보기 →
        </Link>
      </div>

      <div className="mbg-intro">
        <h1>본문(main) 배경색 3안 비교</h1>
        <p>
          각 열은 동일한{" "}
          <code className="text-accent-cyan">DashboardEmeraldHeader</code> ·
          업로드 패널 · 데이터 카드를{" "}
          <strong className="text-foreground">main 배경만</strong> 바꿔 놓은
          시안입니다. 1안은 업로드 패널을 불투명(white)으로 보여 대비 강화
          예시도 함께 표시합니다.
        </p>
      </div>

      <div className="mbg-grid">
        {OPTIONS.map((option) => (
          <OptionColumn key={option.id} option={option} />
        ))}
      </div>

      <div className="mbg-current-strip">
        <div className="mbg-current-inner">
          <strong>현재 프로덕션</strong> —{" "}
          <code>bg-glow-main</code>: radial 민트 12% + radial 블루 6% + linear{" "}
          <code>#f2f6fa → #e9eef3 → #dde5ee</code>
          (패널과 명도 차이가 작아 박스가 덜 도드라지는 편)
        </div>
      </div>
    </div>
  );
}
