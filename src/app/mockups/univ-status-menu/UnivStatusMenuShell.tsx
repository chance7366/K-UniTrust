import Link from "next/link";

import { UnivStatusMenuMockSidebar } from "./UnivStatusMenuMockSidebar";

import "./univ-status-menu-mock.css";

export function UnivStatusMenuShell({
  children,
  activeTabLabel,
  activeGroupLabel,
  isNewScreen,
  prodReference,
}: {
  children: React.ReactNode;
  activeTabLabel: string;
  activeGroupLabel: string;
  isNewScreen?: boolean;
  prodReference?: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <UnivStatusMenuMockSidebar />
      <main className="bg-glow-main min-w-0 flex-1 overflow-auto p-6">
        <div className="usm-mock-banner" role="note">
          <strong>대학현황 메뉴 재구성 목업</strong>
          <p>
            현재 위치: <strong>대학현황 / {activeGroupLabel} / {activeTabLabel}</strong>
            {isNewScreen ? (
              <> · <span className="font-medium">신규 화면</span> (플레이스홀더)</>
            ) : prodReference ? (
              <> · 기존 화면과 동일 ({prodReference})</>
            ) : null}
            {" · "}
            <Link href="/analysis/univ-map" className="underline underline-offset-2">
              프로덕션 대학현황
            </Link>
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
