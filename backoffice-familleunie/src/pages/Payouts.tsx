import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getPayouts, postPayout, markPayoutPaid, getMembers, getMeetings, getContributionTypes, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCFA, formatDate } from '@/lib/utils';

const schema = z.object({
  beneficiary_id: z.coerce.number().min(1, 'Bénéficiaire requis'),
  meeting_id: z.coerce.number().min(1, 'Réunion requise'),
  contribution_type_id: z.coerce.number().min(1, 'Type requis'),
  amount: z.coerce.number().min(1, 'Montant requis'),
});
type Values = z.infer<typeof schema>;

function CreatePayoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { data: meetings } = useQuery({ queryKey: ['meetings'], queryFn: getMeetings });
  const { data: types } = useQuery({ queryKey: ['contribution-types'], queryFn: getContributionTypes });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Values) => postPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Tirage créé');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nouveau tirage">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Bénéficiaire</label>
          <select {...register('beneficiary_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {members?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          {errors.beneficiary_id && <p className="mt-1 text-xs text-red-500">{errors.beneficiary_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Réunion</label>
          <select {...register('meeting_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {meetings?.map((m) => <option key={m.id} value={m.id}>{formatDate(m.meeting_date)}</option>)}
          </select>
          {errors.meeting_id && <p className="mt-1 text-xs text-red-500">{errors.meeting_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Type de cotisation</label>
          <select {...register('contribution_type_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {types?.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.contribution_type_id && <p className="mt-1 text-xs text-red-500">{errors.contribution_type_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Montant (FCFA)</label>
          <Input {...register('amount')} type="number" placeholder="100000" />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Création…' : 'Créer le tirage'}
        </Button>
      </form>
    </Dialog>
  );
}

export function Payouts() {
  const queryClient = useQueryClient();
  const { data: payouts, isLoading } = useQuery({ queryKey: ['payouts'], queryFn: getPayouts });
  const [open, setOpen] = useState(false);

  const payMutation = useMutation({
    mutationFn: (id: number) => markPayoutPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Tirage marqué payé');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <div>
      <PageHeader
        title="Tirages tontine"
        subtitle={payouts ? `${payouts.length} tirage(s)` : undefined}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouveau tirage</Button>}
      />
      <Card className="p-0">
        <Table>
          <THead>
            <Th>Bénéficiaire</Th>
            <Th>Type</Th>
            <Th>Réunion</Th>
            <Th>Montant</Th>
            <Th>Statut</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && payouts?.length === 0 && <EmptyState label="Aucun tirage." />}
            {payouts?.map((p) => (
              <tr key={p.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{p.beneficiary?.full_name ?? `#${p.beneficiary_id}`}</Td>
                <Td>{p.contribution_type?.label ?? '—'}</Td>
                <Td>{p.meeting?.meeting_date ? formatDate(p.meeting.meeting_date) : '—'}</Td>
                <Td>{formatCFA(p.amount)}</Td>
                <Td>
                  <StatusBadge status={p.status === 'paid' ? 'good' : 'warning'} label={p.status === 'paid' ? 'Payé' : 'En attente'} />
                </Td>
                <Td>
                  {p.status !== 'paid' && (
                    <button onClick={() => payMutation.mutate(p.id)} className="text-xs font-semibold text-primary hover:underline">
                      Marquer payé
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreatePayoutDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
