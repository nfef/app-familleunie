import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession, serverFetch } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Gestion des tontines | Famille Unie' };

interface Meeting { id: number; meeting_date: string; cycle?: { label: string } | null }
interface Payout { id: number; amount: number; status: string; meeting?: { meeting_date: string } | null; beneficiary?: { full_name: string } | null; contribution_type?: { label: string } | null }

async function schedulePayoutAction(formData: FormData) {
  'use server';
  // This is a placeholder — scheduling payout requires beneficiary selection
  // Redirect back to trigger a page refresh
  redirect('/tontines');
}

export default async function TontinesPage() {
  const { roles, token } = await requireSession();

  const [meetings, payouts] = await Promise.all([
    serverFetch<Meeting[]>('/api/meetings', token),
    serverFetch<Payout[]>('/api/payouts', token),
  ]);

  const canSchedule = roles.some((role) => ['ADMIN', 'TRESORIER'].includes(role));

  return (
    <AppShell title="Gestion des tontines" roles={roles}>
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Paiements programmés</p>
        {payouts && payouts.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between rounded-2xl border border-border/40 bg-bg p-4 shadow-sm">
                <div>
                  <p className="font-bold text-ink">{payout.beneficiary?.full_name}</p>
                  <p className="text-xs font-medium text-secondary">{payout.contribution_type?.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-primary">{payout.amount.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-[10px] font-bold text-ink-muted uppercase">
                    {payout.meeting?.meeting_date
                      ? new Date(payout.meeting.meeting_date).toLocaleDateString('fr-FR')
                      : '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted italic text-center">Aucun paiement enregistré.</p>
        )}
      </Card>

      {canSchedule && (
        <Card className="mt-8 space-y-4 pb-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Réunions récentes</p>
          {meetings && meetings.length > 0 ? meetings.map((meeting) => (
            <form key={meeting.id} action={schedulePayoutAction} className="rounded-2xl border border-border/40 bg-bg p-4 shadow-sm">
              <input type="hidden" name="meeting_id" value={meeting.id} />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-ink">{new Date(meeting.meeting_date).toLocaleDateString('fr-FR')}</p>
                  <p className="text-xs font-medium text-ink-muted">Cycle {meeting.cycle?.label}</p>
                </div>
                <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all">
                  Voir
                </button>
              </div>
            </form>
          )) : (
            <p className="text-sm text-ink-muted italic text-center">Aucune réunion enregistrée.</p>
          )}
        </Card>
      )}
    </AppShell>
  );
}
