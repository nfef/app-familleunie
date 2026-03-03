import { AppShell } from '@/components/layout/app-shell';
import { requireSession, serverFetch } from '@/lib/auth';
import { FinanceClient } from './finance-client';

export const metadata = { title: 'Gestion Financière | Famille Unie' };

interface Member { id: number; full_name: string }

export default async function FinancePage() {
    const { roles, token } = await requireSession(['ADMIN', 'TRESORIER', 'CENSEUR', 'COMMISSAIRE']);

    const members = await serverFetch<Member[]>('/api/members', token);

    return (
        <AppShell title="Finance" roles={roles}>
            <FinanceClient
                roles={roles}
                members={(members ?? []).map(m => ({ id: String(m.id), label: m.full_name }))}
            />
        </AppShell>
    );
}
