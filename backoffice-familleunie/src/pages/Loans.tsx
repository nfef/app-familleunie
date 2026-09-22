import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getLoans, postLoan, payLoan, getMembers, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCFA, formatDate } from '@/lib/utils';

const schema = z.object({
  user_id: z.coerce.number().min(1, 'Membre requis'),
  amount: z.coerce.number().min(1, 'Montant requis'),
  interest: z.coerce.number().min(0).optional(),
  due_date: z.string().min(1, 'Date requise'),
});
type Values = z.infer<typeof schema>;

function CreateLoanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Values) => postLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Prêt accordé');
      reset();
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
            <Input {...register('interest')} type="number" placeholder="0" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Date d'échéance</label>
          <Input {...register('due_date')} type="date" />
          {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date.message}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Accorder le prêt'}
        </Button>
      </form>
    </Dialog>
  );
}

export function Loans() {
  const queryClient = useQueryClient();
  const { data: loans, isLoading } = useQuery({ queryKey: ['loans'], queryFn: getLoans });
  const [open, setOpen] = useState(false);

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
            <Th>Échéance</Th>
            <Th>Statut</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && loans?.length === 0 && <EmptyState label="Aucun prêt." />}
            {loans?.map((l) => (
              <tr key={l.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{l.user?.full_name ?? `#${l.user_id}`}</Td>
                <Td>{formatCFA(l.amount)}</Td>
                <Td>{formatCFA(l.interest)}</Td>
                <Td>{formatDate(l.due_date)}</Td>
                <Td>
                  {l.status === 'paid' ? (
                    <StatusBadge status="good" label="Remboursé" />
                  ) : l.is_overdue ? (
                    <StatusBadge status="critical" label="En retard" />
                  ) : (
                    <StatusBadge status="warning" label="En cours" />
                  )}
                </Td>
                <Td>
                  {l.status !== 'paid' && (
                    <button onClick={() => payMutation.mutate(l.id)} className="text-xs font-semibold text-primary hover:underline">
                      Marquer remboursé
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreateLoanDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
