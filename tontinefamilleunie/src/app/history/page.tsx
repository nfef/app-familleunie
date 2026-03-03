import { AppShell } from '@/components/layout/app-shell';
import { requireSession } from '@/lib/auth';
import { HistoryList } from '@/components/history/history-list';

export const metadata = { title: 'Historique | Famille Unie' };

export default async function HistoryPage() {
  const { roles } = await requireSession();

  return (
    <AppShell title="Historique" roles={roles}>
      <div className="pb-24">
        <HistoryList />
      </div>
    </AppShell>
  );
}
