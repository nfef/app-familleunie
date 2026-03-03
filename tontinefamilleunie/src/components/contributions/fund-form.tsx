'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { postFundEntry } from '@/lib/api';
import { CheckCircle2, Info, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import clsx from 'clsx';

const schema = z.object({
  fund_type_id: z.string().min(1, 'La caisse est requise'),
  member_id: z.string().nullable().optional(),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  direction: z.enum(['in', 'out']),
  note: z.string().min(3, 'Une description est requise pour la traçabilité'),
});

type FundPayload = z.infer<typeof schema>;

type Option = { id: string; label: string };

type Props = {
  members: Option[];
  fundTypes: Option[];
};

export function FundForm({ members, fundTypes, selectedMemberId }: Props & { selectedMemberId: string | null }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FundPayload>({
    resolver: zodResolver(schema),
    defaultValues: { direction: 'in', member_id: selectedMemberId ?? '' }
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const direction = watch('direction');

  // Sync member_id when parent selector changes
  useEffect(() => {
    setValue('member_id', selectedMemberId ?? '');
    setMessage(null);
  }, [selectedMemberId, setValue]);

  const selectedMemberName = members.find(m => m.id === selectedMemberId)?.label;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      await postFundEntry({
        fund_type_id: parseInt(values.fund_type_id),
        member_id: selectedMemberId ? parseInt(selectedMemberId) : null,
        amount: values.amount,
        direction: values.direction,
        note: values.note
      });
      setMessage({ type: 'success', text: 'Opération enregistrée avec succès.' });
      reset({ direction: 'in', amount: 0, fund_type_id: values.fund_type_id, note: '', member_id: selectedMemberId ?? '' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* Affichage du membre ou mode collectif */}
      <div className="bg-bg/50 p-4 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Cible de l'opération</span>
          <span className="text-sm font-bold text-ink">
            {selectedMemberName ?? 'Caisse Collective (Générale)'}
          </span>
        </div>
        <div className={clsx(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
          selectedMemberId ? "bg-primary/10 text-primary" : "bg-bg-dark/10 text-ink-muted"
        )}>
          {selectedMemberId ? 'Individuel' : 'Collectif'}
        </div>
      </div>

      {/* Type de Caisse */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
          Sélectionner la Caisse
        </label>
        <select className="app-select mt-1" {...register('fund_type_id')}>
          <option value="">Choisir la caisse...</option>
          {fundTypes.map((fund) => (
            <option value={fund.id} key={fund.id}>
              {fund.label}
            </option>
          ))}
        </select>
        {errors.fund_type_id && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.fund_type_id.message}</p>}
      </div>

      {/* Direction (Ajout / Retrait) */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-3 block">
          Nature de l'opération
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={clsx(
            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
            direction === 'in' ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-border text-ink-muted hover:border-primary/20"
          )}>
            <input type="radio" value="in" {...register('direction')} className="hidden" />
            <ArrowUpCircle className={clsx("h-5 w-5", direction === 'in' ? "text-primary" : "text-ink-muted/30")} />
            <span className="text-xs font-black uppercase tracking-tight">Ajout / Dépôt</span>
          </label>
          <label className={clsx(
            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
            direction === 'out' ? "bg-secondary/5 border-secondary text-secondary shadow-sm" : "bg-white border-border text-ink-muted hover:border-secondary/20"
          )}>
            <input type="radio" value="out" {...register('direction')} className="hidden" />
            <ArrowDownCircle className={clsx("h-5 w-5", direction === 'out' ? "text-secondary" : "text-ink-muted/30")} />
            <span className="text-xs font-black uppercase tracking-tight">Remboursement</span>
          </label>
        </div>
      </div>

      {/* Montant & Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
            Montant (FCFA)
          </label>
          <Input
            type="number"
            step="500"
            placeholder="Ex: 5000"
            {...register('amount')}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
            Description / Motif
          </label>
          <Input
            placeholder="Ex: Retour fonds de caisse"
            {...register('note')}
          />
          {errors.note && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.note.message}</p>}
        </div>
      </div>

      {message && (
        <div className={clsx(
          "p-4 rounded-2xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <Info className="h-5 w-5 mt-0.5" />}
          <p className="text-xs font-bold leading-relaxed">{message.text}</p>
        </div>
      )}

      <Button
        type="submit"
        variant={direction === 'out' ? 'secondary' : 'primary'}
        className="w-full py-6 font-black uppercase tracking-widest text-sm"
        disabled={loading}
      >
        {loading ? 'Enregistrement...' : direction === 'in' ? 'Confirmer l\'ajout' : 'Confirmer le remboursement'}
      </Button>
    </form>
  );
}
