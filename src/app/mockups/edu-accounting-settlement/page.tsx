import { UNIV_ALIMI_SCREENS } from "@/lib/analysis/univ-alimi-raw/screens";
import { normalizeEduAccountingSheet } from "@/lib/analysis/edu-accounting";
import {
  loadUnivAlimiRawDashboard,
  parseUnivAlimiRawQuery,
} from "@/lib/data/univ-alimi-raw";
import { AppShell } from "@/components/layout/AppShell";

import { EduAccountingSettlementMock } from "./EduAccountingSettlementMock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "교비회계 결산 종합보고서 목업",
  description: "교비회계 탭 우측 종합보고서 버튼 시안 (프로덕션 미적용)",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EduAccountingSettlementMockPage({
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
      <EduAccountingSettlementMock
        data={data}
        screen={UNIV_ALIMI_SCREENS[sheetId]}
        sheetId={sheetId}
      />
    </AppShell>
  );
}
