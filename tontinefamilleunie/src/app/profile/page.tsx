import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession, serverFetch } from '@/lib/auth';
import { ProfileForm } from '@/components/profile/profile-form';
import { MyFinances } from '@/components/profile/my-finances';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Profil | Famille Unie' };

interface Contribution { id: number; total_amount: number; parts: number; paid_at: string; contribution_type?: { label: string } }

async function signOutAction() {
  'use server';
  // Clear the auth cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value;
  if (token) {
    // Fire-and-forget logout call to invalidate Sanctum token
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch { /* ignore */ }
  }
  // Delete the cookie
  (await cookies()).set('api_token', '', { maxAge: 0, path: '/' });
  redirect('/login');
}

export default async function ProfilePage() {
  const { member, roles, token } = await requireSession();

  const contributions = await serverFetch<Contribution[]>('/api/contributions/me', token);

  return (
    <AppShell title="Profil" roles={roles}>
      <Card>
        <div className="mb-6">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest text-center">Informations personnelles</p>
        </div>

        <ProfileForm
          avatarUrl={member?.avatar_full_url}
          defaultValues={{
            id: String(member?.id ?? ''),
            full_name: member?.full_name ?? '',
            email: member?.email ?? '',
            phone: member?.phone ?? '',
          }}
        />
      </Card>

      <div className="mt-8">
        <MyFinances />
      </div>

      <Card className="mt-8 border-t-4 border-ink">
        <form action={signOutAction}>
          <Button variant="ghost" className="w-full py-4 font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-50" type="submit">
            Quitter la session
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
