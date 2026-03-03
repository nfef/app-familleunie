import { BottomNav } from '@/components/navigation/bottom-nav';
import { SideMenu } from '@/components/navigation/side-menu';

interface AppShellProps {
  title: string;
  subtitle?: string;
  roles: string[];
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, roles, children }: AppShellProps) {
  console.log('AppShell - Title:', title, 'Roles:', roles);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* ── Top header ── Opaque for visibility */}
      <header className="sticky top-0 z-[50] border-b border-border bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-lg flex items-center gap-4">
          <div className="flex-shrink-0">
            <SideMenu roles={roles} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">
              Famille Unie
            </p>
            <h1 className="mt-0.5 text-lg font-black text-ink leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[11px] font-bold text-ink-muted/80 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto max-w-lg px-4 pt-6 pb-12">
        {children}
      </main>

      <BottomNav roles={roles} />
    </div>
  );
}
