'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx('app-input mt-1', className)}
      {...props}
    />
  )
);

Input.displayName = 'Input';
