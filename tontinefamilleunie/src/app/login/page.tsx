import { LoginForm } from '@/components/auth/login-form';
import { LogoImage } from '@/components/auth/logo-image';

export const metadata = { title: 'Connexion | Famille Unie' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/50">
            {/* Fallback initials FU if no image */}
            <span className="absolute text-3xl font-bold text-primary opacity-20 select-none">FU</span>
            <LogoImage />
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-ink">Bienvenue chez Famille Unie</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Connectez-vous pour accéder à votre espace tontine.
          </p>
        </div>

        {/* ── Form ── */}
        <LoginForm />

      </div>
    </main>
  );
}
