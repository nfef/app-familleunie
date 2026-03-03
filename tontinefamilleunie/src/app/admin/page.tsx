import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession } from '@/lib/auth';
import { AdminConfigClient } from '@/components/admin/admin-config-client';

export const metadata = { title: 'Configuration | Famille Unie' };

export default async function AdminPage() {
  const { roles } = await requireSession();
  const isAdmin = roles.includes('ADMIN');

  if (!isAdmin) {
    return (
      <AppShell title="Administration" roles={roles}>
        <Card className="p-10 text-center">
          <p className="text-ink-muted">Accès restreint aux administrateurs.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Configuration" roles={roles}>
      <AdminConfigClient />
    </AppShell>
  );
}
