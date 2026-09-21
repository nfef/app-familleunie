'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { postContribution, getMemberSubscriptions, Subscription } from '@/lib/api';
import { CheckCircle2, AlertCircle, Calendar, CheckSquare, Square, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const schema = z.object({
  meeting_id: z.string().min(1, 'Sélectionnez une séance'),
  items: z.array(z.object({
    contribution_type_id: z.string(),
    label: z.string(),
    amount: z.number(),
    has_parts: z.boolean(),
    is_mandatory: z.boolean(),
    selected: z.boolean(),
    parts: z.coerce.number().min(0.25, 'Min 1/4 (0.25)').default(1),
    is_subscribed: z.boolean().default(false),
    is_active: z.boolean().default(false),
    suspension_reason: z.string().nullable().default(null),
  })).min(1, 'Au moins une cotisation est requise'),
});

type FormValues = z.infer<typeof schema>;

type Option = { id: string; label: string };
type ContributionTypeOption = Option & {
  amount: number;
  has_parts: boolean;
  is_mandatory: boolean;
};

type Props = {
  selectedMemberId: string | null;
  meetings: Option[];
  contributionTypes: ContributionTypeOption[];
};

export function ContributionForm({ selectedMemberId, meetings, contributionTypes }: Props) {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingSubs, setFetchingSubs] = useState(false); // New state for fetching subscriptions

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue, // Added setValue
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meeting_id: meetings[0]?.id || '',
      items: [] // Empty at start, will be populated by useEffect
    }
  });

  const { fields, replace } = useFieldArray({ // Destructured replace
    control,
    name: "items",
  });

  // Fetch Subscriptions when member changes
  useEffect(() => {
    if (!selectedMemberId) {
      replace([]); // Clear items if no member is selected
      return;
    }

    async function loadSubs() {
      setFetchingSubs(true);
      try {
        const subs = await getMemberSubscriptions(parseInt(selectedMemberId!));

        // Map contribution types to subs
        const items = contributionTypes.map(type => {
          const sub = subs.find((s: Subscription) => s.contribution_type_id === parseInt(type.id));
          return {
            contribution_type_id: type.id,
            label: type.label,
            amount: type.amount,
            has_parts: type.has_parts,
            is_mandatory: type.is_mandatory,
            selected: sub ? sub.is_active : false, // Auto-select if active sub
            parts: sub ? sub.parts : 1,
            is_active: sub ? sub.is_active : false,
            is_subscribed: !!sub, // True if a subscription exists for this type
            suspension_reason: sub?.suspension_reason ?? null
          };
        });
        replace(items); // Update the form's items with fetched data
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des abonnements.' });
        replace([]); // Clear items on error
      } finally {
        setFetchingSubs(false);
      }
    }
    loadSubs();
  }, [selectedMemberId, contributionTypes, replace]); // Dependencies for useEffect

  const watchedItems = watch('items');

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedMemberId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un membre en haut de page.' });
      return;
    }

    const selectedItems = values.items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une cotisation.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // Loop to post each contribution (Backend is 1 by 1)
      for (const item of selectedItems) {
        await postContribution({
          user_id: parseInt(selectedMemberId),
          contribution_type_id: parseInt(item.contribution_type_id),
          meeting_id: parseInt(values.meeting_id),
          parts: item.has_parts ? item.parts : 1
        });
      }
      setMessage({ type: 'success', text: `${selectedItems.length} cotisation(s) enregistrée(s) avec succès.` });
      // We don't reset everything to keep the subscription view, just reset the selection if needed
      // or keep it for the next member. Actually, better reset but re-load subs will happen if member changes.
      // The useEffect will handle re-populating items when selectedMemberId changes.
      // For now, we'll let the form state persist until a new member is selected.
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* ── SEANCE / CALENDRIER ── */}
      <div className="bg-bg/40 p-5 rounded-3xl border-2 border-border/40 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <label className="text-[10px] font-black uppercase tracking-widest text-ink/70">
            Séance de Tontine
          </label>
        </div>
        <select className="app-select h-12 text-sm font-bold" {...register('meeting_id')}>
          {meetings.length > 0 ? meetings.map((m) => (
            <option value={m.id} key={m.id}> Séance du {m.label} </option>
          )) : (
            <option value="">Aucune séance disponible</option>
          )}
        </select>
        {errors.meeting_id && <p className="text-xs text-red-500 mt-2 font-bold">{errors.meeting_id.message}</p>}
      </div>

      {/* ── LISTE DES COTISATIONS ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted block">
            Versements attendus
          </label>
          {fetchingSubs && <span className="text-[9px] font-bold text-primary animate-pulse uppercase">Chargement profil...</span>}
        </div>

        {fields.length === 0 && !fetchingSubs && (
          <div className="p-10 border-2 border-dashed border-border/40 rounded-3xl text-center">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
              Sélectionnez un membre pour voir ses cotisations
            </p>
          </div>
        )}

        {fields.map((field, index) => {
          const isSelected = watchedItems[index]?.selected;
          const hasParts = watchedItems[index]?.has_parts;
          const isMandatory = watchedItems[index]?.is_mandatory;
          // Access new fields from the form state
          const isSubscribed = watchedItems[index]?.is_subscribed;
          const suspensionReason = watchedItems[index]?.suspension_reason;
          const isActive = watchedItems[index]?.is_active;

          return (
            <div key={field.id} className={clsx(
              "group relative p-4 rounded-2xl border-2 transition-all duration-300",
              isSelected
                ? "bg-white border-primary shadow-md translate-x-1"
                : "bg-bg/20 border-border/40 opacity-70 hover:opacity-100",
              !isSubscribed && "opacity-40 grayscale pointer-events-none" // Apply styles if not subscribed
            )}>
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-4 cursor-pointer flex-1 py-1">
                  <input
                    type="checkbox"
                    {...register(`items.${index}.selected` as const)}
                    className="hidden"
                  />
                  <div className={clsx(
                    "transition-colors",
                    isSelected ? "text-primary" : "text-ink-muted/30"
                  )}>
                    {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-sm font-black uppercase tracking-tight",
                        isSelected ? "text-ink" : "text-ink-muted"
                      )}>
                        {field.label}
                      </span>
                      {!isActive && isSubscribed && ( // Show suspended badge
                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Suspendu</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-primary">
                      {field.amount.toLocaleString('fr-FR')} FCFA
                      {isMandatory && " (Obligatoire)"}
                    </span>
                    {suspensionReason && ( // Show suspension reason
                      <span className="text-[9px] text-amber-600 font-bold italic mt-0.5">Motif: {suspensionReason}</span>
                    )}
                  </div>
                </label>

                {/* Champ Parts si actif */}
                {isSelected && hasParts && (
                  <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-ink-muted uppercase mb-1">Parts</span>
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        className="w-20 h-10 text-center font-bold border-primary/20 focus:border-primary"
                        {...register(`items.${index}.parts` as const)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className={clsx(
          "p-4 rounded-3xl border-2 flex items-start gap-4 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          <p className="text-sm font-bold leading-relaxed">{message.text}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full py-8 text-base font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-primary/20 group relative overflow-hidden"
        disabled={loading || !selectedMemberId || fetchingSubs} // Disable if fetching subscriptions
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {loading ? 'Enregistrement...' : 'Valider la Saisie'}
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </Button>

      {!selectedMemberId && (
        <p className="text-center text-[10px] font-black uppercase tracking-tighter text-amber-600 animate-pulse">
          Veuillez d&apos;abord sélectionner un membre en haut
        </p>
      )}
    </form>
  );
}
