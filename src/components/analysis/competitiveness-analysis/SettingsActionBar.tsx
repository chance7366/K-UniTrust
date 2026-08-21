"use client";

import "@/components/analysis/glass-help-button.css";
import type { ReactNode } from "react";

export function SettingsSaveBar({
  onSave,
  savePending,
  saveError,
  saveMessage,
  extraActions,
}: {
  onSave: () => void;
  savePending: boolean;
  saveError: string | null;
  saveMessage: string | null;
  extraActions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      {saveError ? (
        <p className="w-full text-right text-xs text-danger">{saveError}</p>
      ) : null}
      {saveMessage ? (
        <p className="w-full text-right text-xs text-accent">{saveMessage}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={savePending}
          className="glass-save-btn"
        >
          <span className="glass-save-btn-core">
            {savePending ? "저장 중…" : "설정 저장"}
          </span>
        </button>
        {extraActions}
      </div>
    </div>
  );
}
