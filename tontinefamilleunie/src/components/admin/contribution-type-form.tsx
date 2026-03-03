'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { postContributionType } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const schema = z.object({
  label: z.string().min(3, 'Minimum 3 caractères'),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  has_parts: z.boolean().default(true),
  is_mandatory: z.boolean().default(false),
});

type Values = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

export function ContributionTypeForm({ onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { has_parts: true, is_mandatory: false }
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await postContributionType(values);
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      toast.success(`Activité "${values.label}" ajoutée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
          Nom du type
        </label>
        <Input {...register('label')} placeholder="Ex: Tontine, Ration, Huile..." />
        {errors.label && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.label.message}</p>}
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
          Montant de base (FCFA)
        </label>
        <Input type="number" step="500" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <label className="flex items-center gap-2 p-3 rounded-xl bg-bg border-2 border-border/40 cursor-pointer hover:border-primary/40 transition-colors">
          <input type="checkbox" {...register('has_parts')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-[10px] font-bold uppercase tracking-tight text-ink/80">Supporte parts (ex: Tontine)</span>
        </label>
        <label className="flex items-center gap-2 p-3 rounded-xl bg-bg border-2 border-border/40 cursor-pointer hover:border-primary/40 transition-colors">
          <input type="checkbox" {...register('is_mandatory')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-[10px] font-bold uppercase tracking-tight text-ink/80">Obligatoire (ex: Ration)</span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-6 font-black uppercase tracking-widest text-sm shadow-lg"
      >
        {loading ? "Création..." : "Ajouter l'activité"}
      </Button>
    </form>
  );
}
