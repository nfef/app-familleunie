import { NavLink } from 'react-router-dom';
import { Landmark as LogoIcon, X } from 'lucide-react';
import { NAV_ITEMS } from './nav-items';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasRole } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.roles || hasRole(item.roles));

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-nav-bg text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <LogoIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Famille Unie</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-nav-idle">Back-office</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-nav-idle hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'bg-white text-nav-bg shadow-card' : 'text-nav-idle hover:bg-white/10 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
