import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
          size === 'md' ? 'px-5 py-2.5 text-sm' : 'px-3.5 py-1.5 text-xs',
          variant === 'primary' && 'bg-primary text-white shadow-card hover:bg-primary-hover',
          variant === 'secondary' && 'bg-secondary/15 text-primary hover:bg-secondary/25',
          variant === 'ghost' && 'bg-transparent text-ink-muted hover:bg-bg-input hover:text-ink',
          variant === 'danger' && 'bg-red-50 text-red-600 hover:bg-red-100',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
