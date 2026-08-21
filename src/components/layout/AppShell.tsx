import { AccessRoleProvider } from "@/components/auth/AccessRoleProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { readAccessRole } from "@/lib/auth/session";
import { resolveAiStatus } from "@/lib/ai-status";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const aiStatus = resolveAiStatus();
  const accessRole = await readAccessRole();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar aiStatus={aiStatus} accessRole={accessRole} />
      <main className="bg-glow-main flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-6">
        <AccessRoleProvider role={accessRole}>{children}</AccessRoleProvider>
      </main>
    </div>
  );
}
