import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-light focus:border-primary focus:ring-4 focus:ring-primary/10',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
