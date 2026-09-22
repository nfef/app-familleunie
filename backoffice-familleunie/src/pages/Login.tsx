import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Landmark, Lock, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  login: z.string().min(1, 'Ce champ est requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type Values = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(values.login, values.password);
      navigate(user.must_change_password ? '/change-password' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-hover px-4">
      <div className="w-full max-w-md rounded-3xl bg-bg-card p-8 shadow-card-hover">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-ink">Back-office Famille Unie</h1>
          <p className="mt-1 text-sm text-ink-muted">Gestion de la tontine</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Email ou login</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
              <Input {...register('login')} className="pl-10" placeholder="admin@familleunie.com" autoComplete="username" />
            </div>
            {errors.login && <p className="mt-1 text-xs text-red-500">{errors.login.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Mot de passe</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
              <Input
                {...register('password')}
                type={showPwd ? 'text' : 'password'}
                className="pl-10 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
