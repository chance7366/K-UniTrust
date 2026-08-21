import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { SettingsPanel } from "@/components/analysis/competitiveness-analysis/panels/SettingsPanel";
import { parseCompetitivenessTargetUnivQuery } from "@/lib/analysis/competitiveness-target-univ-mock-view";
import { loadCompetitivenessTargetUnivMock } from "@/lib/data/competitiveness-target-univ-mock";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CompetitivenessSettingsPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const targetUnivData = await loadCompetitivenessTargetUnivMock(
    parseCompetitivenessTargetUnivQuery(sp),
  );

  return (
    <CompetitivenessShell activeTab="settings">
      <SettingsPanel targetUnivData={targetUnivData} />
    </CompetitivenessShell>
  );
}
