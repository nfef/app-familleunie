'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register as apiRegister } from '@/lib/api';

const schema = z
  .object({
    full_name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm: z.string().min(8, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type Values = z.infer<typeof schema>;

// ── Composants ───────────────────────────────────────────────────────────────
function InputLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-ink">{children}</label>;
}

export function SignupForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } =
    useForm<Values>({ resolver: zodResolver(schema) });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = handleSubmit(async ({ confirm, ...values }) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiRegister({ ...values, password_confirmation: confirm });
      router.push('/dashboard');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5">

        {/* Nom */}
        <div>
          <InputLabel>Nom complet</InputLabel>
          <input
            {...register('full_name')}
            placeholder="Jean Dupont"
            className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
            autoComplete="name"
          />
          {errors.full_name && <p className="mt-1 ml-4 text-xs text-red-500">{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <InputLabel>Email</InputLabel>
          <input
            {...register('email')}
            type="email"
            placeholder="jean.dupont@exemple.com"
            className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 ml-4 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <InputLabel>Numéro de téléphone</InputLabel>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+225 00 00 00 00 00"
            className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
            autoComplete="tel"
          />
          {errors.phone && <p className="mt-1 ml-4 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <InputLabel>Mot de passe</InputLabel>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 pr-14"
              autoComplete="new-password"
            />
            <button
              type="button" tabIndex={-1}
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

        {/* Confirmation */}
        <div>
          <InputLabel>Confirmer le mot de passe</InputLabel>
          <input
            {...register('confirm')}
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-full border border-border/50 bg-white px-6 py-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
            autoComplete="new-password"
          />
          {errors.confirm && <p className="mt-1 ml-4 text-xs text-red-500">{errors.confirm.message}</p>}
        </div>

        {/* Erreur */}
        {message && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-500 ring-1 ring-red-100">
            {message}
          </p>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Création en cours…' : 'S\'inscrire'}
        </button>
      </form>

      {/* Lien pied de page */}
      <div className="text-center text-sm font-medium">
        <span className="text-ink-muted">Vous avez déjà un compte ? </span>
        <Link href="/login" className="font-bold text-ink hover:text-primary transition-colors">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
