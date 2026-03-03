'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { postFundType } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const schema = z.object({
  label: z.string().min(3, 'Le nom doit avoir au moins 3 caractères'),
  target_amount: z.coerce.number().positive('Le montant doit être positif').optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

export function FundTypeForm({ onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await postFundType(values);
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      toast.success(`Caisse "${values.label}" créée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
          Nom de la caisse
        </label>
        <Input {...register('label')} placeholder="Ex: Caisse Scolaire" />
        {errors.label && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.label.message}</p>}
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
          Objectif (FCFA)
        </label>
        <Input type="number" step="5000" {...register('target_amount', { valueAsNumber: true })} />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-6 font-black uppercase tracking-widest text-sm shadow-lg"
      >
        {loading ? "Création..." : "Ouvrir la caisse"}
      </Button>
    </form>
  );
}
