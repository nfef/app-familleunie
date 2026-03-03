'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login as apiLogin } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type Values = z.infer<typeof schema>;



// ── Composants du formulaire ──────────────────────────────────────────────────
function InputLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-ink">{children}</label>;
}

export function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } =
    useForm<Values>({ resolver: zodResolver(schema) });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiLogin(values);
      if (res.user.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <InputLabel>Email</InputLabel>
          <input
            {...register('email')}
            type="email"
            placeholder="Entrez votre email"
            className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all placeholder:text-ink-light focus:border-primary focus:ring-4 focus:ring-primary/5"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 ml-4 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <InputLabel>Mot de passe</InputLabel>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Entrez votre mot de passe"
              className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all placeholder:text-ink-light focus:border-primary focus:ring-4 focus:ring-primary/5 pr-14"
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-6 text-ink-muted/40 transition hover:text-ink-muted"
            >
              {showPwd ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 ml-4 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between px-2">
          <label className="flex cursor-pointer items-center gap-2 group">
            <input type="checkbox" className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/20 cursor-pointer" />
            <span className="text-xs font-medium text-ink-muted group-hover:text-ink">Se souvenir de moi</span>
          </label>
          <Link href="#" className="text-xs font-bold text-ink hover:text-primary transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Message d'erreur */}
        {message && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-500 ring-1 ring-red-100">
            {message}
          </p>
        )}

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>



      {/* Lien vers l'inscription */}
      <div className="text-center text-sm font-medium">
        <span className="text-ink-muted">Vous n&apos;avez pas de compte ? </span>
        <Link href="/signup" className="font-bold text-ink hover:text-primary transition-colors">
          S&apos;inscrire
        </Link>
      </div>
    </div>
  );
}
