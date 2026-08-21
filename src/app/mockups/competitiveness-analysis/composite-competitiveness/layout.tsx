import { AppShell } from "@/components/layout/AppShell";

export default function CompositeCompetitivenessMockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
