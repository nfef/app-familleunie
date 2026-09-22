import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'primary' | 'secondary';
}) {
  return (
    <Card className="flex items-center gap-4">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
          accent === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary'
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}
