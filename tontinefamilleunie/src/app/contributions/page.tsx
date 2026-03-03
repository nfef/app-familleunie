import { AppShell } from '@/components/layout/app-shell';
import { requireSession, serverFetch } from '@/lib/auth';
import { ContributionsClient } from './contributions-client';

export const metadata = { title: 'Saisie des cotisations | Famille Unie' };

interface Member { id: number; full_name: string }
interface Meeting { id: number; meeting_date: string }
interface ContributionType {
  id: number;
  label: string;
  amount: number;
  has_parts: boolean;
  is_mandatory: boolean;
}
interface FundType { id: number; label: string }

export default async function ContributionsPage() {
  const { roles, token } = await requireSession();

  const [members, meetings, contributionTypes, fundTypes] = await Promise.all([
    serverFetch<Member[]>('/api/members', token),
    serverFetch<Meeting[]>('/api/meetings', token),
    serverFetch<ContributionType[]>('/api/admin/contribution-types', token),
    serverFetch<FundType[]>('/api/admin/fund-types', token),
  ]);

  return (
    <AppShell title="Saisie" roles={roles}>
      <ContributionsClient
        roles={roles}
        members={(members ?? []).map((m) => ({ id: String(m.id), label: m.full_name }))}
        meetings={(meetings ?? []).map((meeting) => ({
          id: String(meeting.id),
          label: new Date(meeting.meeting_date).toLocaleDateString('fr-FR'),
        }))}
        contributionTypes={(contributionTypes ?? []).map((type) => ({
          id: String(type.id),
          label: type.label,
          amount: type.amount,
          has_parts: type.has_parts,
          is_mandatory: type.is_mandatory,
        }))}
        fundTypes={(fundTypes ?? []).map((fund) => ({ id: String(fund.id), label: fund.label }))}
      />
    </AppShell>
  );
}
