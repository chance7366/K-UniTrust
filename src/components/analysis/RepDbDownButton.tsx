import { Download } from "lucide-react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./glass-help-button.css";

export function RepDbDownButton({
  href,
  download,
  variant = "plain",
}: {
  href: string;
  download: string;
  variant?: "plain" | "glass";
}) {
  if (variant === "glass") {
    return (
      <a
        href={href}
        download={download}
        className="glass-db-down-btn ml-auto shrink-0"
        aria-label="대표학교 합산 DB 내려받기"
      >
        <span className="glass-db-down-btn-core">
          <Download size={12} strokeWidth={2.6} aria-hidden />
          DB down
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      download={download}
      className={`ml-auto inline-flex h-[30px] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 hover:bg-surface ${FDB_TYPO.toolbarControl}`}
    >
      <Download size={13} strokeWidth={2.4} aria-hidden />
      DB down
    </a>
  );
}
