import { AppShell } from "@/components/layout/AppShell";

export default function TabSelectedColorMockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
