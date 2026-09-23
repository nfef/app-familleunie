import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Check } from 'lucide-react';
import { getEvents, postEvent, getEventTypes, getMembers, getEventDetail, postEventContribution, ApiError, type ApiEvent } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatCFA, formatDate } from '@/lib/utils';

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
            {types?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.amount_mode === 'envelope' ? `${formatCFA(t.computed_share ?? 0)}/membre (enveloppe ${formatCFA(t.default_amount)})` : `${formatCFA(t.default_amount)}/membre`}
              </option>
            ))}
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

function EventDetailDialog({ event, onClose }: { event: ApiEvent | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['event-detail', event?.id],
    queryFn: () => getEventDetail(event!.id),
    enabled: !!event,
  });
  const [amounts, setAmounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (data) {
      setAmounts((prev) => {
        const next = { ...prev };
        for (const m of data.pending_members) {
          if (next[m.id] === undefined) next[m.id] = data.expected_share;
        }
        return next;
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (vars: { contributor_id: number; amount: number }) =>
      postEventContribution({ event_id: event!.id, contributor_id: vars.contributor_id, amount: vars.amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-detail', event?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Contribution enregistrée');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  if (!event) return null;

  return (
    <Dialog open={!!event} onClose={onClose} title={`${event.event_type?.label ?? 'Événement'} — ${event.member?.full_name ?? ''}`}>
      {isLoading || !data ? (
        <div className="py-8 text-center text-sm text-ink-muted">Chargement…</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-bg-input px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Collecté</p>
              <p className="mt-1 text-base font-bold text-ink">
                {formatCFA(data.total_collected)} <span className="text-xs font-medium text-ink-muted">/ {formatCFA(data.expected_total)}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-bg-input px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Contributeurs</p>
              <p className="mt-1 text-base font-bold text-ink">
                {data.contributors_count} <span className="text-xs font-medium text-ink-muted">/ {data.active_members_count}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-muted">Part attendue par membre : <strong className="text-ink">{formatCFA(data.expected_share)}</strong></p>

          {data.event.contributions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Ont contribué</p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {data.event.contributions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-bg-input/60 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      {c.contributor?.full_name ?? `#${c.contributor_id}`}
                    </span>
                    <span className="text-ink-muted">{formatCFA(c.amount)}{c.paid_at ? ` · ${formatDate(c.paid_at)}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.pending_members.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">En attente</p>
              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {data.pending_members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <span className="flex-1 truncate text-sm font-medium text-ink">{m.full_name}</span>
                    <input
                      type="number"
                      min={1}
                      value={amounts[m.id] ?? data.expected_share}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [m.id]: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-border bg-bg-input px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                    />
                    <Button
                      onClick={() => mutation.mutate({ contributor_id: m.id, amount: amounts[m.id] ?? data.expected_share })}
                      disabled={mutation.isPending}
                      className="px-3 py-1.5 text-xs"
                    >
                      Enregistrer
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.pending_members.length === 0 && data.event.contributions.length > 0 && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">Tous les membres actifs ont contribué.</p>
          )}
        </div>
      )}
    </Dialog>
  );
}

export function Events() {
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<ApiEvent | null>(null);

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
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && events?.length === 0 && <EmptyState label="Aucun événement." />}
            {events?.map((e) => (
              <tr key={e.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{e.member?.full_name ?? `#${e.member_id}`}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {e.event_type?.label ?? '—'}
                    {e.event_type?.category && (
                      <span className={`h-2 w-2 rounded-full ${e.event_type.category === 'heureux' ? 'bg-green-500' : 'bg-ink-muted'}`} title={e.event_type.category === 'heureux' ? 'Heureux' : 'Malheureux'} />
                    )}
                  </div>
                </Td>
                <Td>{formatDate(e.occurred_on)}</Td>
                <Td>{e.note ?? '—'}</Td>
                <Td>
                  <button
                    onClick={() => setViewing(e)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </button>
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CreateEventDialog open={open} onClose={() => setOpen(false)} />
      <EventDetailDialog key={`event-${viewing?.id ?? 'none'}`} event={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
