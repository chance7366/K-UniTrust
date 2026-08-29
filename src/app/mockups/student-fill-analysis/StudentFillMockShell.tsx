import Link from "next/link";

import { StudentFillMockSidebar } from "./StudentFillMockSidebar";

import "./student-fill-mock.css";

export function StudentFillFrame({
  production,
  activeLabel,
  children,
}: {
  production?: boolean;
  activeLabel: string;
  children: React.ReactNode;
}) {
  if (production) return children;
  return (
    <StudentFillMockShell activeLabel={activeLabel}>{children}</StudentFillMockShell>
  );
}

export function StudentFillMockShell({
  children,
  activeLabel,
}: {
  children: React.ReactNode;
  activeLabel: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <StudentFillMockSidebar />
      <main className="bg-glow-main min-w-0 flex-1 overflow-auto p-6">
        <div className="sfa-mock-banner" role="note">
          <strong>학생충원분석 목업 · 프로덕션 사이드바 미적용</strong>
          <p>
            현재 위치: <strong>학생충원분석 / {activeLabel}</strong>
            {" · "}
            국공립·사립 학부 · 외국인 기본값 학위과정 · 분석연도 Y의 탈락은 Y−1
            {" · "}
            <Link href="/mockups/student-fill-analysis/run" className="underline underline-offset-2">
              분석결과 제안 목업
            </Link>
            {" · "}
            <Link href="/mockups/student-fill-analysis/university" className="underline underline-offset-2">
              대학별분석 제안 목업
            </Link>
            {" · "}
            <Link href="/mockups/student-fill-analysis/university-result-stats" className="underline underline-offset-2">
              대학별분석 분석결과 통계 목업
            </Link>
            {" · "}
            <Link href="/mockups/student-fill-analysis/university-report" className="underline underline-offset-2">
              심층보고서 목업
            </Link>
            {" · "}
            <Link
              href="/mockups/student-fill-analysis/comprehensive-report"
              className="underline underline-offset-2"
            >
              종합보고서 목업
            </Link>
            {" · "}
            <Link
              href="/mockups/student-fill-analysis/comprehensive-report-extended"
              className="underline underline-offset-2"
            >
              종합보고서 확장 목업
            </Link>
            {" · "}
            <Link href="/analysis/student-fill-analysis/settings" className="underline underline-offset-2">
              프로덕션 학생충원분석
            </Link>
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
