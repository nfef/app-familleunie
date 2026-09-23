import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, RefreshCw } from 'lucide-react';
import { getLoans, postLoan, payLoan, renewLoan, getMembers, ApiError, type Loan } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCFA, formatDate } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  user_id: z.coerce.number().min(1, 'Membre requis'),
  amount: z.coerce.number().min(1, 'Montant requis'),
  interest: z.coerce.number().min(0).optional(),
  contracted_at: z.string().min(1, "Date d'emprunt requise"),
  due_date: z.string().min(1, 'Date requise'),
});
type Values = z.infer<typeof schema>;

function CreateLoanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { contracted_at: today() },
  });
  const [interestTouched, setInterestTouched] = useState(false);
  const amount = watch('amount');

  // Suggère 10% du montant comme intérêt par défaut, tant que l'admin ne l'a pas modifié à la main.
  useEffect(() => {
    if (!interestTouched && amount > 0) {
      setValue('interest', Math.round(amount * 0.1));
    }
  }, [amount, interestTouched, setValue]);

  const mutation = useMutation({
    mutationFn: (data: Values) => postLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Prêt accordé');
      reset({ contracted_at: today() });
      setInterestTouched(false);
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nouveau prêt">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Membre</label>
          <select {...register('user_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {members?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Montant (FCFA)</label>
            <Input {...register('amount')} type="number" placeholder="50000" />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Intérêt (FCFA)</label>
            <Input {...register('interest')} type="number" placeholder="0" onChange={() => setInterestTouched(true)} />
            <p className="mt-1 text-[11px] text-ink-muted">Suggéré à 10% du montant — modifiable</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Date d'emprunt</label>
            <Input {...register('contracted_at')} type="date" />
            {errors.contracted_at && <p className="mt-1 text-xs text-red-500">{errors.contracted_at.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Date d'échéance</label>
            <Input {...register('due_date')} type="date" />
            {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date.message}</p>}
          </div>
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Accorder le prêt'}
        </Button>
      </form>
    </Dialog>
  );
}

function RenewLoanDialog({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState<'tacit' | 'partial'>('tacit');
  const [capitalRestant, setCapitalRestant] = useState('');
  const [nouvelInteret, setNouvelInteret] = useState('');
  const [mois, setMois] = useState('2');

  const handleClose = () => {
    setScenario('tacit');
    setCapitalRestant('');
    setNouvelInteret('');
    setMois('2');
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      renewLoan(loan!.id, {
        mois: Number(mois) || 2,
        ...(scenario === 'partial'
          ? { capital_restant: Number(capitalRestant), nouvel_interet: Number(nouvelInteret) }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Prêt reconduit');
      handleClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  if (!loan) return null;

  const partialValid = capitalRestant !== '' && nouvelInteret !== '' && Number(capitalRestant) <= loan.amount;

  return (
    <Dialog open={!!loan} onClose={handleClose} title={`Reconduire le prêt — ${loan.user?.full_name ?? ''}`}>
      <div className="space-y-4">
        <p className="rounded-2xl bg-bg-input px-4 py-3 text-xs text-ink-muted">
          Prêt initial : <strong className="text-ink">{formatCFA(loan.amount)}</strong>, échéance du {formatDate(loan.due_date)}.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScenario('tacit')}
            className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
              scenario === 'tacit' ? 'border-primary bg-primary text-white' : 'border-border text-ink-muted hover:border-primary/40'
            }`}
          >
            Rien remboursé
          </button>
          <button
            type="button"
            onClick={() => setScenario('partial')}
            className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
              scenario === 'partial' ? 'border-primary bg-primary text-white' : 'border-border text-ink-muted hover:border-primary/40'
            }`}
          >
            Remboursement partiel
          </button>
        </div>

        {scenario === 'tacit' ? (
          <p className="text-sm text-ink-muted">
            Reconduction tacite : même montant ({formatCFA(loan.amount)}) et même intérêt ({formatCFA(loan.interest)}).
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Capital restant (FCFA)</label>
              <Input value={capitalRestant} onChange={(e) => setCapitalRestant(e.target.value)} type="number" placeholder="30000" />
              {Number(capitalRestant) > loan.amount && (
                <p className="mt-1 text-xs text-red-500">Ne peut pas dépasser {formatCFA(loan.amount)}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Nouvel intérêt (FCFA)</label>
              <Input value={nouvelInteret} onChange={(e) => setNouvelInteret(e.target.value)} type="number" placeholder="3000" />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Durée de la reconduction (mois)</label>
          <Input value={mois} onChange={(e) => setMois(e.target.value)} type="number" min={1} />
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (scenario === 'partial' && !partialValid)}
          className="w-full"
        >
          {mutation.isPending ? 'Reconduction…' : 'Confirmer la reconduction'}
        </Button>
      </div>
    </Dialog>
  );
}

export function Loans() {
  const queryClient = useQueryClient();
  const { data: loans, isLoading } = useQuery({ queryKey: ['loans'], queryFn: getLoans });
  const [open, setOpen] = useState(false);
  const [renewing, setRenewing] = useState<Loan | null>(null);

  const payMutation = useMutation({
    mutationFn: (id: number) => payLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Prêt marqué remboursé');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <div>
      <PageHeader
        title="Prêts"
        subtitle={loans ? `${loans.length} prêt(s)` : undefined}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouveau prêt</Button>}
      />
      <Card className="p-0">
        <Table>
          <THead>
            <Th>Membre</Th>
            <Th>Montant</Th>
            <Th>Intérêt</Th>
            <Th>Emprunté le</Th>
            <Th>Échéance</Th>
            <Th>Statut</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && loans?.length === 0 && <EmptyState label="Aucun prêt." />}
            {loans?.map((l) => (
              <tr key={l.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">
                  {l.user?.full_name ?? `#${l.user_id}`}
                  {l.parent_loan_id && (
                    <div className="text-[11px] font-normal text-ink-muted">Reconduit du prêt #{l.parent_loan_id}</div>
                  )}
                </Td>
                <Td>{formatCFA(l.amount)}</Td>
                <Td>{formatCFA(l.interest)}</Td>
                <Td>{l.contracted_at ? formatDate(l.contracted_at) : '—'}</Td>
                <Td>{formatDate(l.due_date)}</Td>
                <Td>
                  {l.status === 'paid' ? (
                    <StatusBadge status="good" label="Remboursé" />
                  ) : l.status === 'renewed' ? (
                    <StatusBadge status="warning" label="Reconduit" />
                  ) : l.is_overdue ? (
                    <StatusBadge status="critical" label="En retard" />
                  ) : (
                    <StatusBadge status="warning" label="En cours" />
                  )}
                </Td>
                <Td>
                  {l.status === 'pending' && (
                    <div className="flex flex-col items-start gap-1">
                      <button onClick={() => payMutation.mutate(l.id)} className="text-xs font-semibold text-primary hover:underline">
                        Marquer remboursé
                      </button>
                      <button
                        onClick={() => setRenewing(l)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reconduire
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreateLoanDialog open={open} onClose={() => setOpen(false)} />
      <RenewLoanDialog loan={renewing} onClose={() => setRenewing(null)} />
    </div>
  );
}
