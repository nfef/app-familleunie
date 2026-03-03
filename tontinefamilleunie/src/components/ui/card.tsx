import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  /** Accent left border color — 'primary' | 'secondary' | 'none' (default: none) */
  accent?: 'primary' | 'secondary' | 'none';
}

export function Card({ className, children, accent = 'none' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border bg-bg-card p-4 shadow-card',
        accent === 'primary' && 'border-l-4 border-l-primary',
        accent === 'secondary' && 'border-l-4 border-l-secondary',
        className
      )}
    >
      {children}
    </div>
  );
}
