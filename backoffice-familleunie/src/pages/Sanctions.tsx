import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getSanctions, postSanction, paySanction, getMembers, ApiError } from '@/lib/api';
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
  label: z.string().min(2, 'Motif requis'),
  amount: z.coerce.number().min(1, 'Montant requis'),
});
type Values = z.infer<typeof schema>;

function CreateSanctionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Values) => postSanction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      toast.success('Sanction créée');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle sanction">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Membre</label>
          <select {...register('user_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {members?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Motif</label>
          <Input {...register('label')} placeholder="Retard à la réunion" />
          {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Montant (FCFA)</label>
          <Input {...register('amount')} type="number" placeholder="1000" />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Création…' : 'Créer la sanction'}
        </Button>
      </form>
    </Dialog>
  );
}

export function Sanctions() {
  const queryClient = useQueryClient();
  const { data: sanctions, isLoading } = useQuery({ queryKey: ['sanctions'], queryFn: getSanctions });
  const [open, setOpen] = useState(false);

  const payMutation = useMutation({
    mutationFn: (id: number) => paySanction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      toast.success('Sanction marquée payée');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <div>
      <PageHeader
        title="Sanctions"
        subtitle={sanctions ? `${sanctions.length} sanction(s)` : undefined}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouvelle sanction</Button>}
      />
      <Card className="p-0">
        <Table>
          <THead>
            <Th>Membre</Th>
            <Th>Motif</Th>
            <Th>Montant</Th>
            <Th>Statut</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && sanctions?.length === 0 && <EmptyState label="Aucune sanction." />}
            {sanctions?.map((s) => (
              <tr key={s.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{s.user?.full_name ?? `#${s.user_id}`}</Td>
                <Td>{s.label}</Td>
                <Td>{formatCFA(s.amount)}</Td>
                <Td>
                  <StatusBadge
                    status={s.status === 'paid' ? 'good' : 'warning'}
                    label={s.status === 'paid' ? `Payée le ${s.paid_at ? formatDate(s.paid_at) : ''}` : 'En attente'}
                  />
                </Td>
                <Td>
                  {s.status === 'pending' && (
                    <button
                      onClick={() => payMutation.mutate(s.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Marquer payée
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreateSanctionDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
