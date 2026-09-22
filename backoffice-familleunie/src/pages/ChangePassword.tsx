import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import { changePassword, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z
  .object({
    password: z.string().min(8, 'Au moins 8 caractères'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });
type Values = z.infer<typeof schema>;

export function ChangePassword() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit(async ({ password, confirm }) => {
    setLoading(true);
    setError(null);
    try {
      await changePassword({ password, password_confirmation: confirm });
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-3xl bg-bg-card p-8 shadow-card-hover">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-ink">Première connexion</h1>
          <p className="mt-1 text-sm text-ink-muted">Définissez votre propre mot de passe avant de continuer.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Nouveau mot de passe</label>
            <Input {...register('password')} type="password" placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Confirmer le mot de passe</label>
            <Input {...register('confirm')} type="password" placeholder="••••••••" />
            {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>}
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Mise à jour…' : 'Activer mon compte'}
          </Button>
        </form>
      </div>
    </div>
  );
}
