import type { LucideIcon } from "lucide-react";

export function SidebarMenuIcon({
  icon: Icon,
  className = "shrink-0 text-emerald-600",
  size = 14,
  active = false,
}: {
  icon: LucideIcon;
  className?: string;
  size?: number;
  active?: boolean;
}) {
  if (!Icon) return null;

  return (
    <Icon
      className={active ? "shrink-0 text-current" : className}
      size={size}
      strokeWidth={2.2}
      aria-hidden
    />
  );
}
