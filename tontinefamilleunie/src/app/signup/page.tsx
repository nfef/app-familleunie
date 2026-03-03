import { SignupForm } from '@/components/auth/signup-form';
import { LogoImage } from '@/components/auth/logo-image';

export const metadata = { title: 'Inscription | Famille Unie' };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-30 w-30 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/50">
            <span className="absolute text-2xl font-bold text-primary opacity-20 select-none">FU</span>
            <LogoImage />
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-ink">Créer un compte</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Rejoignez l&apos;association Famille Unie dès aujourd&apos;hui.
          </p>
        </div>

        {/* ── Form ── */}
        <SignupForm />

      </div>
    </main>
  );
}
