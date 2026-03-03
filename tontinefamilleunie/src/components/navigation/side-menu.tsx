'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    Menu,
    X,
    History,
    Pencil,
    Calendar,
    Shield,
    Users,
    ChevronRight,
    Settings,
    BarChart3,
    CheckCircle2,
} from 'lucide-react';

interface SideMenuProps {
    roles?: string[];
}

const MENU_ITEMS = [
    { href: '/contributions', label: 'Saisie / Cotisations', icon: Pencil, roles: ['TRESORIER', 'ADMIN', 'COMMISSAIRE'] },
    { href: '/attendance', label: 'Présences', icon: CheckCircle2 },
    { href: '/events', label: 'Événements', icon: Calendar },
    { href: '/admin', label: 'Admin', icon: Settings, roles: ['ADMIN'] }, // Modified existing admin item
    { href: '/admin/members', label: 'Gestion Membres', icon: Users, roles: ['ADMIN'] },
    { href: '/finance', label: 'Finance', icon: BarChart3, roles: ['ADMIN', 'TRESORIER', 'COMMISSAIRE', 'CENSEUR'] }, // Added Finance link
    { href: '/finance/reports', label: 'Rapports Financiers', icon: History },
];

export function SideMenu({ roles }: SideMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, [roles]);

    const toggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    const currentRoles = Array.isArray(roles) ? roles : [];
    const allowed = MENU_ITEMS.filter(
        (item) => !item.roles || item.roles.some((r) => currentRoles.includes(r))
    );

    // Hydration safety: render a simple button before mounting
    if (!mounted) {
        return (
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center animate-pulse">
                <Menu className="h-6 w-6 text-gray-400" />
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={toggle}
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-primary/20 text-primary shadow-sm hover:bg-primary/5 active:scale-95 transition-all z-[60]"
            >
                <Menu className="h-7 w-7" />
            </button>

            {/* OVERLAY SOMBRE */}
            <div
                className={clsx(
                    'fixed inset-0 z-[999] bg-black/70 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={toggle}
            />

            {/* TIROIR LATÉRAL */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-[1000] w-[300px] h-full flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl bg-white',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* HEADER DU MENU */}
                <div className="flex items-center justify-between p-7 border-b border-border/10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Projet Unie</span>
                        <span className="text-xl font-black text-ink">SYSTEM V3.5</span>
                    </div>
                    <button
                        onClick={toggle}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 shadow-sm border border-red-100 active:scale-90 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-4">
                    {allowed.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href as any}
                                onClick={toggle}
                                className={clsx(
                                    'flex items-center justify-between gap-4 p-5 rounded-[2rem] transition-all group border-b-4',
                                    active
                                        ? 'bg-primary border-primary-hover text-white shadow-xl translate-y-[-1px]'
                                        : 'bg-bg/40 border-bg text-ink-muted hover:bg-white hover:border-primary/20 hover:text-primary'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        'p-3 rounded-2xl transition-all',
                                        active ? 'bg-white/20' : 'bg-white shadow-sm'
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <span className="font-black text-sm tracking-tight">{item.label}</span>
                                </div>
                                <ChevronRight className={clsx('h-5 w-5 opacity-40', active && 'opacity-100')} />
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-7 border-t border-border/10 bg-bg/10">
                    <p className="text-[9px] text-ink-muted/30 text-center uppercase tracking-[0.3em] font-black">
                        System Unified — v3.5
                    </p>
                </div>
            </aside>
        </div>
    );
}
