import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function DashboardPageTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`${FDB_TYPO.pageTitle} tracking-wide text-[#1a5c3a] [text-shadow:0_1px_0_rgba(255,255,255,0.65)] ${className}`}
    >
      {children}
    </h1>
  );
}
