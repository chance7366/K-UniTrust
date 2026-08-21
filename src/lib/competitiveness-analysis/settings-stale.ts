/** 분석 실행 이후 기본설정이 저장·변경되었는지 */
export function isSettingsStaleSinceRun(
  hasRunResults: boolean,
  settingsSavedAt: string | null,
  runSettingsSavedAt: string | null,
): boolean {
  if (!hasRunResults) return false;
  if (!settingsSavedAt || !runSettingsSavedAt) return false;
  return (
    new Date(settingsSavedAt).getTime() >
    new Date(runSettingsSavedAt).getTime()
  );
}
