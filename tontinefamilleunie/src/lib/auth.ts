import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  username?: string | null;
  phone: string | null;
  roles: string[];
  avatar_url?: string | null;
  avatar_full_url?: string | null;
  must_change_password?: boolean;
}

/**
 * Server-side session check.
 * Reads the Bearer token from the `api_token` cookie (set at login).
 * If not authenticated, redirects to /login.
 * Returns { member, roles, token } so pages can make further server-side API calls.
 */
export async function requireSession(requiredRoles?: string[]): Promise<{ member: AuthUser; roles: string[]; token: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      redirect('/login');
    }

    const member = (await res.json()) as AuthUser;
    const roles = member.roles ?? ['MEMBRE'];

    // Redirection forcée si le mot de passe doit être changé
    if (member.must_change_password) {
      redirect('/change-password');
    }

    // Vérification des rôles si spécifiés
    if (requiredRoles && !roles.some(role => requiredRoles.includes(role))) {
      redirect('/dashboard'); // Ou une page "non autorisé"
    }

    return { member, roles, token };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('[requireSession] Catch Error:', err);
    redirect('/login');
  }
}

/**
 * Server-side authenticated fetch helper.
 * Use this inside server components after requireSession().
 */
export async function serverFetch<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
