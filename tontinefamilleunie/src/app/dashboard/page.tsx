import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession, serverFetch } from '@/lib/auth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MemberReport, DashboardStats } from '@/lib/api';
import {
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Clock,
  ChevronRight,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Tableau de bord | Famille Unie' };

interface Meeting { id: number; meeting_date: string; cycle?: { label: string } | null }
interface Payout { id: number; amount: number; status: string; created_at: string; meeting?: { meeting_date: string } | null; beneficiary?: { full_name: string } | null }

export default async function DashboardPage() {
  const { member, roles, token } = await requireSession();
  const isAdminOrTresorier = roles.some(r => ['ADMIN', 'TRESORIER', 'COMMISSAIRE'].includes(r));

  // Fetch data in parallel
  // Note: /api/admin/dashboard will fail with 403 for non-admins
  const [balance, myReport, meetings, payouts] = await Promise.all([
    isAdminOrTresorier ? serverFetch<DashboardStats>('/api/admin/dashboard', token).catch(() => null) : Promise.resolve(null),
    serverFetch<MemberReport>('/api/reports/me', token).catch(() => null),
    serverFetch<Meeting[]>('/api/meetings', token).catch(() => []),
    serverFetch<Payout[]>('/api/payouts', token).catch(() => []),
  ]);

  const stats = myReport?.stats;

  return (
    <AppShell
      title={`Bonjour, ${member?.full_name?.split(' ')[0] ?? 'Membre'} !`}
      subtitle="Bienvenue sur votre espace Famille Unie."
      roles={roles}
    >
      {/* ── Personal Quick View ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-ink">Ma Situation</h2>
          <Link href="/profile" className="text-[10px] font-bold text-primary flex items-center gap-0.5">
            Voir détails <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Fund balances - Carousel style or simple list */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {stats?.funds.map((fund) => (
              <Card key={fund.fund_type_id} className="min-w-[200px] flex-shrink-0 relative overflow-hidden bg-white border-b-4 border-b-primary/10">
                <p className="text-[9px] font-black uppercase text-ink-muted tracking-tighter mb-1">{fund.label}</p>
                <p className="text-xl font-black text-ink">{fund.balance.toLocaleString()} <span className="text-[10px]">FCFA</span></p>

                {fund.target > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${fund.is_completed ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${fund.percentage}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-bold mt-1 text-ink-muted">
                      {fund.is_completed ? 'Objectif atteint' : `${fund.percentage}% de ${fund.target.toLocaleString()}`}
                    </p>
                  </div>
                )}
                {fund.is_completed && <ShieldCheck className="absolute top-2 right-2 h-4 w-4 text-green-500" />}
              </Card>
            ))}

            <Card className="min-w-[200px] flex-shrink-0 bg-primary text-white border-b-4 border-b-primary-hover">
              <p className="text-[9px] font-black uppercase text-white/70 tracking-tighter mb-1">Total Cotisé</p>
              <p className="text-xl font-black">{stats?.contributions_total.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
              <TrendingUp className="absolute top-2 right-2 h-4 w-4 text-white/30" />
            </Card>
          </div>

          {/* Critical Alerts (Loans/Sanctions) */}
          {(stats?.sanctions_pending ?? 0) > 0 && (
            <Link href="/profile">
              <Card className="bg-red-50 border-red-100 flex items-center gap-3 py-3">
                <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-red-900 uppercase">Attention</p>
                  <p className="text-[10px] font-bold text-red-700">Vous avez {stats?.sanctions_pending.toLocaleString()} FCFA de sanctions en attente.</p>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* ── Admin View (Conditional) ── */}
      {isAdminOrTresorier && balance && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-ink">Global Association</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card accent="primary" className="flex flex-col gap-1 ring-2 ring-primary/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="h-3 w-3 text-primary" />
                <p className="text-[10px] font-black text-ink-muted uppercase">Tontine</p>
              </div>
              <p className="text-2xl font-black text-primary">
                {(balance.tontine_balance ?? 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-[9px] font-bold text-ink-muted uppercase">Solde Actuel (FCFA)</p>
            </Card>

            <Card accent="secondary" className="flex flex-col gap-1 ring-2 ring-secondary/5">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-3 w-3 text-secondary" />
                <p className="text-[10px] font-black text-ink-muted uppercase">Social</p>
              </div>
              <p className="text-2xl font-black" style={{ color: '#BD89B2' }}>
                {(balance.events_balance ?? 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-[9px] font-bold text-ink-muted uppercase">Fonds Événements</p>
            </Card>
          </div>
        </div>
      )}

      {/* ── Meetings ── */}
      <div className="mt-5">
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-ink">
          Réunions récentes
        </h2>
        <div className="space-y-3">
          {meetings && meetings.length > 0 ? meetings.slice(0, 3).map((meeting) => (
            <Card key={meeting.id} className="flex items-center justify-between hover:border-primary/30 transition-colors py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-bg flex flex-col items-center justify-center border border-border/10">
                  <span className="text-[8px] font-black uppercase text-ink-muted leading-none">{format(new Date(meeting.meeting_date), 'MMM', { locale: fr })}</span>
                  <span className="text-lg font-black text-ink leading-none">{format(new Date(meeting.meeting_date), 'dd')}</span>
                </div>
                <div>
                  <Link href={`/meetings/${meeting.id}`} className="font-bold text-ink hover:text-primary transition-colors">
                    {format(new Date(meeting.meeting_date), 'EEEE dd MMMM', { locale: fr })}
                  </Link>
                  {meeting.cycle?.label && (
                    <p className="text-[10px] font-black text-ink-muted uppercase">Cycle {meeting.cycle.label}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted opacity-30" />
            </Card>
          )) : (
            <Card className="py-8 bg-bg/20 border-dashed">
              <p className="text-xs text-ink-muted font-bold uppercase text-center tracking-widest">Aucune réunion planifiée</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Payouts ── */}
      <div className="mt-8 mb-10">
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-ink">
          Dernières tontines payées
        </h2>
        <div className="space-y-3">
          {payouts && payouts.length > 0 ? payouts.slice(0, 3).map((item) => (
            <Card key={item.id} className="flex items-center justify-between border-l-4 border-secondary/40 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-ink text-sm">{item.beneficiary?.full_name ?? 'Membre'}</p>
                  <p className="text-[9px] font-black text-ink-muted uppercase">
                    {format(new Date(item.meeting?.meeting_date ?? item.created_at), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-primary text-base">
                  {item.amount.toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
                </p>
              </div>
            </Card>
          )) : (
            <p className="text-[10px] text-ink-muted font-black uppercase text-center py-4">Aucun paiement enregistré.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
