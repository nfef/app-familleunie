import { AppShell } from '@/components/layout/app-shell';
import { requireSession, serverFetch } from '@/lib/auth';
import { AttendanceClient } from './attendance-client';

export const metadata = { title: 'Liste de Présences | Famille Unie' };

interface Meeting {
    id: number;
    meeting_date: string;
    cycle?: { label: string } | null;
}

export default async function AttendancePage() {
    const { roles, token } = await requireSession();

    const meetings = await serverFetch<Meeting[]>('/api/meetings', token);

    return (
        <AppShell title="Présences" roles={roles}>
            <AttendanceClient
                roles={roles}
                meetings={(meetings ?? []).map(m => ({
                    id: String(m.id),
                    label: `${new Date(m.meeting_date).toLocaleDateString('fr-FR')} ${m.cycle?.label ? `(${m.cycle.label})` : ''}`
                }))}
            />
        </AppShell>
    );
}
