'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { postEventContribution } from '@/lib/api';

type Option = { id: string; label: string };

const schema = z.object({
  event_id: z.string().min(1),
  contributor_id: z.string().min(1),
  amount: z.coerce.number().positive(),
});

type Values = z.infer<typeof schema>;

type Props = { events: Option[]; members: Option[] };

export function EventContributionForm({ events, members }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      await postEventContribution({
        event_id: Number(values.event_id),
        contributor_id: Number(values.contributor_id),
        amount: values.amount,
      });
      reset();
      setMessage('Contribution enregistrée avec succès.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="space-y-4 font-inter" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-semibold text-ink-muted">Événement ciblé</label>
        <select className="app-select mt-1" {...register('event_id')}>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-ink-muted">Membre donateur</label>
        <select className="app-select mt-1" {...register('contributor_id')}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-ink-muted">Montant (FCFA)</label>
        <Input type="number" step="5000" {...register('amount', { valueAsNumber: true })} placeholder="Montant du don" />
        {errors.amount && <p className="text-xs text-red-500 mt-1 ml-2">Montant requis</p>}
      </div>
      {message && <p className="text-sm font-medium text-primary mt-2">{message}</p>}
      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? 'Enregistrement...' : 'Enregistrer la contribution'}
      </Button>
    </form>
  );
}
