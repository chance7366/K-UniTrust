import { clearLocalWorkspaceRole } from "@/lib/auth/local-workspace";
import { resetCompetitivenessClientCache } from "@/lib/competitiveness-analysis/store";
import { clearCaUserDraftWorkspaces } from "@/lib/competitiveness-analysis/user-workspace";
import { clearFpUserDrafts } from "@/lib/competitiveness-analysis/financial-projection/clear-fp-user-drafts";
import { clearFpPublishedRunCache } from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";

/** 로그아웃 시 사용자 임시 분석·추계 초안을 제거하고, 다음 접속 때 배포된 관리자 기준값을 보게 합니다. */
export async function clearUserAnalysisDrafts(): Promise<void> {
  clearLocalWorkspaceRole();
  resetCompetitivenessClientCache();
  clearFpPublishedRunCache();
  await Promise.all([clearCaUserDraftWorkspaces(), Promise.resolve(clearFpUserDrafts())]);
}
