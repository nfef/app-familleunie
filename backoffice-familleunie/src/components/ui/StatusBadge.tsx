import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Palette de statut réservée (skill dataviz) — jamais réutilisée pour des séries,
// toujours icône + libellé, jamais la couleur seule.
type Status = 'good' | 'warning' | 'serious' | 'critical';

const STATUS_STYLES: Record<Status, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  good: { bg: 'bg-[#0ca30c]/10', text: 'text-[#0ca30c]', icon: CheckCircle2 },
  warning: { bg: 'bg-[#fab219]/15', text: 'text-[#a66c00]', icon: Clock },
  serious: { bg: 'bg-[#ec835a]/15', text: 'text-[#c1552c]', icon: AlertTriangle },
  critical: { bg: 'bg-[#d03b3b]/10', text: 'text-[#d03b3b]', icon: XCircle },
};

export function StatusBadge({ status, label, className }: { status: Status; label: string; className?: string }) {
  const s = STATUS_STYLES[status];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', s.bg, s.text, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
