'use client';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

type Option = { id: string; label: string };

const schema = z.object({
  event_type_id: z.string().uuid(),
  member_id: z.string().uuid(),
  occurred_on: z.string(),
  custom_amount: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Values = z.infer<typeof schema>;

type Props = { members: Option[]; eventTypes: Option[] };

export function EventForm({ members, eventTypes }: Props) {
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
    // TODO: POST to Laravel API /api/events
    console.log('Event payload:', values);
    setMessage('API not connected yet');
    setLoading(false);
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm text-white/60">Type</label>
        <select className="w-full rounded-xl bg-slate-900/70 px-4 py-2" {...register('event_type_id')}>
          {eventTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-white/60">Bénéficiaire</label>
        <select className="w-full rounded-xl bg-slate-900/70 px-4 py-2" {...register('member_id')}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-white/60">Date</label>
        <Input type="date" {...register('occurred_on')} />
        {errors.occurred_on && <p className="text-sm text-red-400">Date requise</p>}
      </div>
      <div>
        <label className="text-sm text-white/60">Montant personnalisé</label>
        <Input type="number" step="5000" {...register('custom_amount', { valueAsNumber: true })} />
      </div>
      <div>
        <label className="text-sm text-white/60">Notes</label>
        <textarea className="w-full rounded-xl bg-slate-900/70 px-4 py-2" rows={2} {...register('notes')} />
      </div>
      {message && <p className="text-sm text-brand-light">{message}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        Créer l&apos;événement
      </Button>
    </form>
  );
}
