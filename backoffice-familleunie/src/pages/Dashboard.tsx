import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Landmark, PartyPopper, Users, TrendingUp, ShieldAlert, Wallet } from 'lucide-react';
import { getDashboardStats, getYearlyReport, getSanctions, getLoans } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCFA } from '@/lib/utils';

// Palette catégorielle validée (skill dataviz) — slots 1 & 2, série "entrées" / "sorties"
const COLOR_IN = '#2a78d6';
const COLOR_OUT = '#eb6834';

function compactCFA(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export function Dashboard() {
  const year = new Date().getFullYear().toString();

  const stats = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });
  const yearly = useQuery({ queryKey: ['yearly-report', year], queryFn: () => getYearlyReport(year) });
  const sanctions = useQuery({ queryKey: ['sanctions'], queryFn: getSanctions });
  const loans = useQuery({ queryKey: ['loans'], queryFn: getLoans });

  const s = yearly.data?.summary;
  const chartData = s
    ? [
        { label: 'Cotisations', value: s.total_contributions, group: 'Entrées' },
        { label: 'Entrées caisse', value: s.total_fund_in, group: 'Entrées' },
        { label: 'Sanctions payées', value: s.total_sanctions, group: 'Entrées' },
        { label: 'Prêts remboursés', value: s.loans_repaid, group: 'Entrées' },
        { label: 'Intérêts perçus', value: s.total_interests, group: 'Entrées' },
        { label: 'Sorties caisse', value: s.total_fund_out, group: 'Sorties' },
        { label: 'Tirages versés', value: s.total_payouts, group: 'Sorties' },
        { label: 'Prêts décaissés', value: s.loans_disbursed, group: 'Sorties' },
      ]
    : [];

  const pendingSanctions = sanctions.data?.filter((s) => s.status === 'pending').length ?? 0;
  const overdueLoans = loans.data?.filter((l) => l.is_overdue).length ?? 0;
  const activeLoans = loans.data?.filter((l) => l.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Tableau de bord</h1>
        <p className="text-sm text-ink-muted">Vue d'ensemble de l'association — {year}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Solde tontine"
          value={stats.data ? formatCFA(stats.data.tontine_balance) : '—'}
          icon={Landmark}
        />
        <StatTile
          label="Solde événements"
          value={stats.data ? formatCFA(stats.data.events_balance) : '—'}
          icon={PartyPopper}
          accent="secondary"
        />
        <StatTile
          label="Membres"
          value={stats.data ? String(stats.data.members_count) : '—'}
          icon={Users}
        />
        <StatTile
          label="Flux net annuel"
          value={yearly.data ? formatCFA(yearly.data.net_cash_flow) : '—'}
          icon={TrendingUp}
          accent="secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Flux financiers de l'année</h2>
              <p className="text-xs text-ink-muted">Entrées vs sorties, par catégorie ({year})</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_IN }} />
                Entrées
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_OUT }} />
                Sorties
              </span>
              <Wallet className="h-5 w-5 text-ink-light" />
            </div>
          </div>

          {yearly.isLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-ink-muted">Chargement…</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#e1e0d9" strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#69658F' }}
                  axisLine={{ stroke: '#C6C3E0' }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#69658F' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={compactCFA}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => formatCFA(Number(value))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E3E1F2', fontSize: 12 }}
                />
                <Bar dataKey="value" name="Montant" maxBarSize={24} radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.label} fill={d.group === 'Entrées' ? COLOR_IN : COLOR_OUT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div className="mb-6 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-ink-light" />
            <h2 className="text-base font-bold text-ink">À surveiller</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-bg-input px-4 py-3">
              <span className="text-sm font-medium text-ink">Sanctions en attente</span>
              <StatusBadge status={pendingSanctions > 0 ? 'warning' : 'good'} label={String(pendingSanctions)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-bg-input px-4 py-3">
              <span className="text-sm font-medium text-ink">Prêts actifs</span>
              <StatusBadge status="good" label={String(activeLoans)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-bg-input px-4 py-3">
              <span className="text-sm font-medium text-ink">Prêts en retard</span>
              <StatusBadge status={overdueLoans > 0 ? 'critical' : 'good'} label={String(overdueLoans)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
