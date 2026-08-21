"use client";

import { CircleHelp } from "lucide-react";

export function ChartToolbarHelpButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label={active ? "도움말 닫기" : "도움말 열기"}
      className={`chart-toolbar-help-btn${active ? " active" : ""}`}
    >
      <CircleHelp size={14} strokeWidth={2.4} aria-hidden />
      도움말
    </button>
  );
}
