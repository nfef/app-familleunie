import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { getYearlyReport } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td } from '@/components/ui/Table';
import { formatCFA } from '@/lib/utils';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

export function Reports() {
  const [year, setYear] = useState(String(currentYear));
  const { data, isLoading } = useQuery({ queryKey: ['yearly-report', year], queryFn: () => getYearlyReport(year) });
  const s = data?.summary;

  const rows = s
    ? [
        { label: 'Cotisations', value: s.total_contributions, sign: '+' as const },
        { label: 'Entrées caisse', value: s.total_fund_in, sign: '+' as const },
        { label: 'Sanctions payées', value: s.total_sanctions, sign: '+' as const },
        { label: 'Prêts remboursés (principal)', value: s.loans_repaid, sign: '+' as const },
        { label: 'Intérêts perçus', value: s.total_interests, sign: '+' as const },
        { label: 'Sorties caisse', value: s.total_fund_out, sign: '-' as const },
        { label: 'Tirages versés', value: s.total_payouts, sign: '-' as const },
        { label: 'Prêts décaissés', value: s.loans_disbursed, sign: '-' as const },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Rapports financiers"
        subtitle="Détail annuel des flux"
        action={
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {isLoading ? (
        <p className="text-sm text-ink-muted">Chargement…</p>
      ) : (
        <>
          <Card className="mb-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${(data?.net_cash_flow ?? 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {(data?.net_cash_flow ?? 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Flux net de trésorerie — {year}</p>
              <p className="text-2xl font-semibold text-ink">{data ? formatCFA(data.net_cash_flow) : '—'}</p>
            </div>
          </Card>

          <Card className="p-0">
            <Table>
              <THead><Th>Catégorie</Th><Th>Montant</Th></THead>
              <TBody>
                {rows.map((r) => (
                  <tr key={r.label} className="hover:bg-bg-input/60">
                    <Td className="font-semibold">{r.label}</Td>
                    <Td className={r.sign === '+' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                      {r.sign} {formatCFA(r.value)}
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
