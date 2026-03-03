import { AppShell } from '@/components/layout/app-shell';
import { requireSession } from '@/lib/auth';
import { ReportsClient } from './reports-client';

export const metadata = {
    title: 'Rapports Financiers | Famille Unie',
    description: 'Bilan financier détaillé des séances'
};

export default async function FinancialReportsPage() {
    const { roles } = await requireSession();

    return (
        <AppShell title="Bilan Financier" subtitle="Séance par séance" roles={roles}>
            <ReportsClient roles={roles} />
        </AppShell>
    );
}
