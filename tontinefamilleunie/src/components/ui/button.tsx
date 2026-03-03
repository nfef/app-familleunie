'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 active:scale-[0.98]',
          {
            // Primary — navy #23347E
            primary:
              'bg-primary text-white hover:bg-primary-hover shadow-sm focus-visible:outline-primary',
            // Secondary — mauve #BD89B2
            secondary:
              'bg-secondary/15 text-secondary hover:bg-secondary/25 border border-secondary/30 focus-visible:outline-secondary',
            // Ghost — transparent
            ghost:
              'bg-transparent text-ink-muted hover:bg-bg-input focus-visible:outline-primary',
            // Danger
            danger:
              'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
            // Outline
            outline:
              'bg-transparent border-2 border-border/40 text-ink-muted hover:border-primary hover:text-primary',
          }[variant],
          {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-5 py-2.5 text-sm',
            lg: 'px-6 py-3.5 text-base',
            icon: 'h-10 w-10 p-0',
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Button.displayName = 'Button';
