import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { getFundTypes, postFundEntry, getMembers, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatCFA } from '@/lib/utils';

const schema = z.object({
  fund_type_id: z.coerce.number().min(1, 'Type requis'),
  member_id: z.coerce.number().optional(),
  amount: z.coerce.number().min(1, 'Montant requis'),
  direction: z.enum(['in', 'out']),
  note: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function EntryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { direction: 'in' },
  });

  const mutation = useMutation({
    mutationFn: (data: Values) => postFundEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-types'] });
      toast.success('Mouvement enregistré');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nouveau mouvement de caisse">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Sens</label>
          <select {...register('direction')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="in">Entrée</option>
            <option value="out">Sortie</option>
          </select>
        </div>
        <FundTypeSelect />
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Membre concerné (optionnel)</label>
          <select {...register('member_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
            <option value="">— Aucun —</option>
            {members?.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Montant (FCFA)</label>
          <Input {...register('amount')} type="number" placeholder="5000" />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Note (optionnel)</label>
          <Input {...register('note')} placeholder="Détails" />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </Dialog>
  );

  function FundTypeSelect() {
    const { data: fundTypes } = useQuery({ queryKey: ['fund-types'], queryFn: getFundTypes });
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Type de caisse</label>
        <select {...register('fund_type_id')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
          <option value="">— Sélectionner —</option>
          {fundTypes?.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        {errors.fund_type_id && <p className="mt-1 text-xs text-red-500">{errors.fund_type_id.message}</p>}
      </div>
    );
  }
}

export function Funds() {
  const { data: fundTypes, isLoading } = useQuery({ queryKey: ['fund-types'], queryFn: getFundTypes });
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Caisses"
        subtitle="Types de caisse et mouvements"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouveau mouvement</Button>}
      />

      <p className="mb-4 rounded-2xl bg-secondary/10 px-4 py-3 text-xs text-primary">
        L'API ne fournit pas encore de liste globale des mouvements de caisse (seulement les
        montants cumulés par type) — voir <code>evolution.md</code>. Cette page affiche les
        types de caisse existants et permet d'enregistrer de nouveaux mouvements.
      </p>

      {isLoading && <p className="text-sm text-ink-muted">Chargement…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fundTypes?.map((f) => (
          <Card key={f.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-ink">{f.label}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${f.is_active ? 'bg-green-50 text-green-600' : 'bg-bg-input text-ink-muted'}`}>
                {f.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {f.target_amount && (
              <p className="text-sm text-ink-muted">Objectif : {formatCFA(f.target_amount)}</p>
            )}
            <div className="mt-4 flex gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5 text-green-500" /> Entrée</span>
              <span className="flex items-center gap-1"><ArrowDownCircle className="h-3.5 w-3.5 text-red-400" /> Sortie</span>
            </div>
          </Card>
        ))}
      </div>

      <EntryDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
