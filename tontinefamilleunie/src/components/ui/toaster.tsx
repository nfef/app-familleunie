'use client';

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
    return (
        <SonnerToaster
            position="top-center"
            toastOptions={{
                style: {
                    borderRadius: '1.25rem',
                    padding: '1rem',
                    border: '2px solid rgba(0,0,0,0.05)',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                },
                className: "bg-white",
            }}
        />
    );
}
