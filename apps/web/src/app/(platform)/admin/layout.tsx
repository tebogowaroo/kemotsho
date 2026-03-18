import { AdminShell } from "@/shared/ui/layouts/admin-shell"
import { requireAdmin } from "@kemotsho/core/lib/auth-dal"
import { getTenantConfig } from "@kemotsho/core/config/tenant";
import { getActiveModules } from "@kemotsho/core/config/modules";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enforce ADMIN authentication for the entire Admin Shell
  await requireAdmin()

  const config = getTenantConfig();
  const activeModules = getActiveModules(config);
  const moduleLinks = activeModules.flatMap(m => m.adminNavInfo || []);

  return (
    <AdminShell moduleLinks={moduleLinks}>
      {children}
    </AdminShell>
  )
}
