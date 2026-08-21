import { UNIV_ALIMI_SCREENS } from "@/lib/analysis/univ-alimi-raw/screens";
import { normalizeEduAccountingSheet } from "@/lib/analysis/edu-accounting";
import {
  loadUnivAlimiRawDashboard,
  parseUnivAlimiRawQuery,
} from "@/lib/data/univ-alimi-raw";
import { AppShell } from "@/components/layout/AppShell";

import { EduAccountingTabStyleMock } from "./EduAccountingTabStyleMock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "교비회계 탭 스타일 시안",
  description: "교비회계 본문 탭 박스 색상 시안 (프로덕션 미적용)",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EduAccountingTabStyleMockPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const sheetId = normalizeEduAccountingSheet(sp.sheet);
  const data = await loadUnivAlimiRawDashboard(
    sheetId,
    parseUnivAlimiRawQuery(sp),
  );

  return (
    <AppShell>
      <EduAccountingTabStyleMock
        data={data}
        screen={UNIV_ALIMI_SCREENS[sheetId]}
        sheetId={sheetId}
      />
    </AppShell>
  );
}
