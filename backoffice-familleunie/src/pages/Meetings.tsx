import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getCycles, postCycle, getMeetings, postMeeting, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatDate } from '@/lib/utils';

const cycleSchema = z.object({ label: z.string().min(1, 'Requis'), start_date: z.string().min(1, 'Requis') });
type CycleValues = z.infer<typeof cycleSchema>;

const meetingSchema = z.object({ cycle_id: z.coerce.number().min(1, 'Cycle requis'), meeting_date: z.string().min(1, 'Requis'), notes: z.string().optional() });
type MeetingValues = z.infer<typeof meetingSchema>;

function NewCycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CycleValues>({ resolver: zodResolver(cycleSchema) });
  const mutation = useMutation({
    mutationFn: (data: CycleValues) => postCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Cycle créé');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });
  return (
    <Dialog open={open} onClose={onClose} title="Nouveau cycle">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Libellé</label>
          <Input {...register('label')} placeholder="Saison 2026" />
          {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Date de début</label>
          <Input {...register('start_date')} type="date" />
          {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? 'Création…' : 'Créer'}</Button>
      </form>
    </Dialog>
  );
}

function NewMeetingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: cycles } = useQuery({ queryKey: ['cycles'], queryFn: getCycles });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MeetingValues>({ resolver: zodResolver(meetingSchema) });
  const mutation = useMutation({
    mutationFn: (data: MeetingValues) => postMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Réunion créée');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });
  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle réunion">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Cycle</label>
          <select {...register('cycle_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {cycles?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors.cycle_id && <p className="mt-1 text-xs text-red-500">{errors.cycle_id.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Date</label>
          <Input {...register('meeting_date')} type="date" />
          {errors.meeting_date && <p className="mt-1 text-xs text-red-500">{errors.meeting_date.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Notes (optionnel)</label>
          <Input {...register('notes')} placeholder="Ordre du jour…" />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? 'Création…' : 'Créer'}</Button>
      </form>
    </Dialog>
  );
}

export function Meetings() {
  const { data: cycles } = useQuery({ queryKey: ['cycles'], queryFn: getCycles });
  const { data: meetings, isLoading } = useQuery({ queryKey: ['meetings'], queryFn: getMeetings });
  const [cycleOpen, setCycleOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Cycles"
          subtitle={cycles ? `${cycles.length} cycle(s)` : undefined}
          action={<Button variant="secondary" onClick={() => setCycleOpen(true)}><Plus className="h-4 w-4" />Nouveau cycle</Button>}
        />
        <Card className="p-0">
          <Table>
            <THead><Th>Libellé</Th><Th>Début</Th><Th>Fin</Th><Th>Statut</Th></THead>
            <TBody>
              {cycles?.length === 0 && <EmptyState label="Aucun cycle." />}
              {cycles?.map((c) => (
                <tr key={c.id} className="hover:bg-bg-input/60">
                  <Td className="font-semibold">{c.label}</Td>
                  <Td>{formatDate(c.start_date)}</Td>
                  <Td>{c.end_date ? formatDate(c.end_date) : '—'}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-bg-input text-ink-muted'}`}>
                      {c.is_active ? 'Actif' : 'Clôturé'}
                    </span>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <div>
        <PageHeader
          title="Réunions"
          subtitle={meetings ? `${meetings.length} réunion(s)` : undefined}
          action={<Button onClick={() => setMeetingOpen(true)}><Plus className="h-4 w-4" />Nouvelle réunion</Button>}
        />
        <Card className="p-0">
          <Table>
            <THead><Th>Date</Th><Th>Cycle</Th><Th>Notes</Th></THead>
            <TBody>
              {isLoading && <EmptyState label="Chargement…" />}
              {!isLoading && meetings?.length === 0 && <EmptyState label="Aucune réunion." />}
              {meetings?.map((m) => (
                <tr key={m.id} className="hover:bg-bg-input/60">
                  <Td className="font-semibold">{formatDate(m.meeting_date)}</Td>
                  <Td>{m.cycle?.label ?? '—'}</Td>
                  <Td>{m.notes ?? '—'}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <NewCycleDialog open={cycleOpen} onClose={() => setCycleOpen(false)} />
      <NewMeetingDialog open={meetingOpen} onClose={() => setMeetingOpen(false)} />
    </div>
  );
}
