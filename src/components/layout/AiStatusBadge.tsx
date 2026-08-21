import type { AiStatus } from "@/lib/ai-status";

const statusLabel: Record<AiStatus, string> = {
  connected: "AI Connected",
  idle: "AI Idle",
  error: "AI Error",
};

const statusColor: Record<AiStatus, string> = {
  connected: "bg-success",
  idle: "bg-warning",
  error: "bg-danger",
};

export function AiStatusBadge({ status = "idle" }: { status?: AiStatus }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted">
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusColor[status]}`}
        aria-hidden
      />
      <span className="whitespace-nowrap">{statusLabel[status]}</span>
    </div>
  );
}
