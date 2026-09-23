import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Users, Eye, Check, X } from 'lucide-react';
import { getContributionsSummary, postContribution, getMembers, getMeetings, getContributionTypes, getMeetingReport, ApiError, type MeetingContributionSummary } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatCFA, formatDate } from '@/lib/utils';

const schema = z.object({
  user_id: z.coerce.number().min(1, 'Membre requis'),
  contribution_type_id: z.coerce.number().min(1, 'Type requis'),
  meeting_id: z.coerce.number().min(1, 'Réunion requise'),
  parts: z.coerce.number().min(0.5, 'Parts requises'),
});
type Values = z.infer<typeof schema>;

function CreateContributionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { data: meetings } = useQuery({ queryKey: ['meetings'], queryFn: getMeetings });
  const { data: types } = useQuery({ queryKey: ['contribution-types'], queryFn: getContributionTypes });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { parts: 1 },
  });

  const mutation = useMutation({
    mutationFn: (data: Values) => postContribution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions-summary'] });
      toast.success('Cotisation enregistrée');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Enregistrer une cotisation">
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
          <label className="mb-1.5 block text-sm font-semibold text-ink">Type de cotisation</label>
          <select {...register('contribution_type_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Sélectionner —</option>
            {types?.map((t) => <option key={t.id} value={t.id}>{t.label} ({formatCFA(t.amount)})</option>)}
          </select>
          {errors.contribution_type_id && <p className="mt-1 text-xs text-red-500">{errors.contribution_type_id.message}</p>}
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
          <label className="mb-1.5 block text-sm font-semibold text-ink">Nombre de parts</label>
          <Input {...register('parts')} type="number" step="0.5" />
          {errors.parts && <p className="mt-1 text-xs text-red-500">{errors.parts.message}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </Dialog>
  );
}

function MeetingReportDialog({ meeting, onClose }: { meeting: MeetingContributionSummary | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['meeting-report', meeting?.meeting_id],
    queryFn: () => getMeetingReport(meeting!.meeting_id),
    enabled: !!meeting,
  });

  if (!meeting) return null;

  return (
    <Dialog
      open={!!meeting}
      onClose={onClose}
      title={`Rapport — ${meeting.meeting ? formatDate(meeting.meeting.meeting_date) : `#${meeting.meeting_id}`}`}
    >
      {isLoading || !data ? (
        <div className="py-8 text-center text-sm text-ink-muted">Chargement…</div>
      ) : (
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {data.report.length === 0 && <EmptyState label="Aucune donnée pour cette réunion." />}
          {data.report.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-ink">{item.label}</p>
                {item.type === 'contribution' ? (
                  <span className="text-xs font-semibold text-ink-muted">
                    {item.stats.paid} payé(s) / {item.stats.failure ?? 0} en attente
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-ink-muted">{item.stats.paid} mouvement(s)</span>
                )}
              </div>
              <div className="space-y-1.5">
                {item.details.map((d) => (
                  <div key={d.user_id} className="flex items-center justify-between rounded-xl bg-bg-input/60 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      {d.status === 'paid' ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {d.full_name}
                    </span>
                    <span className="text-ink-muted">{formatCFA(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

export function Contributions() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['contributions-summary'], queryFn: getContributionsSummary });
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<MeetingContributionSummary | null>(null);

  return (
    <div>
      <PageHeader
        title="Cotisations"
        subtitle="Résumé des 10 dernières réunions"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Enregistrer une cotisation</Button>}
      />
      <Card className="p-0">
        <Table>
          <THead>
            <Th>Réunion</Th>
            <Th>Total collecté</Th>
            <Th>Membres ayant cotisé</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && summary?.length === 0 && <EmptyState label="Aucune cotisation enregistrée." />}
            {summary?.map((s) => (
              <tr key={s.meeting_id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{s.meeting ? formatDate(s.meeting.meeting_date) : `#${s.meeting_id}`}</Td>
                <Td>{formatCFA(s.total_amount)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <Users className="h-3.5 w-3.5" />
                    {s.members_count}
                  </span>
                </Td>
                <Td>
                  <button
                    onClick={() => setViewing(s)}
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
      <CreateContributionDialog open={open} onClose={() => setOpen(false)} />
      <MeetingReportDialog key={`report-${viewing?.meeting_id ?? 'none'}`} meeting={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
