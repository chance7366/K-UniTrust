import { Building2 } from "lucide-react";

import "./dashboard-emerald-header.css";

export function DashboardEmeraldHeader({
  sectionLabel,
  subtitle,
  title,
  note,
  action,
}: {
  sectionLabel: string;
  subtitle: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="deh-header">
      <div className="deh-header-left">
        <div className="deh-icon" aria-hidden>
          <Building2 size={20} strokeWidth={2.2} />
        </div>
        <span className="deh-badge">{sectionLabel}</span>
        <h1 className="deh-title">{title}</h1>
        <div className="deh-subtitle-wrap">
          <span className="deh-subtitle">{subtitle}</span>
          {note ? <p className="deh-note">{note}</p> : null}
        </div>
      </div>
      {action ?? null}
    </header>
  );
}
