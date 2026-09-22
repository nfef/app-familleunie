import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getEvents, postEvent, getEventTypes, getMembers, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  member_id: z.coerce.number().min(1, 'Membre requis'),
  event_type_id: z.coerce.number().min(1, 'Type requis'),
  occurred_on: z.string().min(1, 'Date requise'),
  note: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function CreateEventDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { data: types } = useQuery({ queryKey: ['event-types'], queryFn: getEventTypes });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Values) => postEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement créé');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nouvel événement">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Membre concerné</label>
          <select {...register('member_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {members?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          {errors.member_id && <p className="mt-1 text-xs text-red-500">{errors.member_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Type d'événement</label>
          <select {...register('event_type_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {types?.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.event_type_id && <p className="mt-1 text-xs text-red-500">{errors.event_type_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Date</label>
          <Input {...register('occurred_on')} type="date" />
          {errors.occurred_on && <p className="mt-1 text-xs text-red-500">{errors.occurred_on.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Note (optionnel)</label>
          <Input {...register('note')} placeholder="Détails" />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Création…' : "Créer l'événement"}
        </Button>
      </form>
    </Dialog>
  );
}

export function Events() {
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Événements"
        subtitle={events ? `${events.length} événement(s)` : undefined}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouvel événement</Button>}
      />
      <Card className="p-0">
        <Table>
          <THead>
            <Th>Membre</Th>
            <Th>Type</Th>
            <Th>Date</Th>
            <Th>Note</Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && events?.length === 0 && <EmptyState label="Aucun événement." />}
            {events?.map((e) => (
              <tr key={e.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{e.member?.full_name ?? `#${e.member_id}`}</Td>
                <Td>{e.event_type?.label ?? '—'}</Td>
                <Td>{formatDate(e.occurred_on)}</Td>
                <Td>{e.note ?? '—'}</Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreateEventDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
