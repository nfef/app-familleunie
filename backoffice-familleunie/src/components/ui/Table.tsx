import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-bg-input text-xs font-semibold uppercase tracking-wide text-ink-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-ink ${className ?? ''}`}>{children}</td>;
}

export function EmptyState({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-10 text-center text-sm text-ink-muted">
        {label}
      </td>
    </tr>
  );
}
