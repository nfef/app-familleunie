import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession, serverFetch } from '@/lib/auth';
import { MemberManagement } from '@/components/admin/member-management';
import { ContributionType, Member } from '@/lib/api';

export const metadata = { title: 'Gestion des Membres | Famille Unie' };

export default async function AdminMembersPage() {
    const { roles, token } = await requireSession();
    const isAdmin = roles.includes('ADMIN');

    if (!isAdmin) {
        return (
            <AppShell title="Gestion des Membres" roles={roles}>
                <Card className="p-10 text-center">
                    <p className="text-ink-muted">Accès restreint aux administrateurs.</p>
                </Card>
            </AppShell>
        );
    }

    const [members, contributionTypes] = await Promise.all([
        serverFetch<Member[]>('/api/members', token),
        serverFetch<ContributionType[]>('/api/admin/contribution-types', token),
    ]);

    return (
        <AppShell
            title="Membres"
            subtitle="Configuration des adhésions"
            roles={roles}
        >
            <div className="space-y-6 pb-20">
                <MemberManagement
                    members={members ?? []}
                    contributionTypes={contributionTypes ?? []}
                />
            </div>
        </AppShell>
    );
}
