'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SanctionManager } from '@/components/admin/sanction-manager';
import { LoanManager } from '@/components/admin/loan-manager';
import { YearlyReport } from '@/components/admin/yearly-report';
import { ShieldAlert, Banknote, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    roles: string[];
    members: { id: string; label: string }[];
}

export function FinanceClient({ roles, members }: Props) {
    const [activeTab, setActiveTab] = useState<'sanctions' | 'loans' | 'reports'>('sanctions');

    const tabs = [
        { id: 'sanctions' as const, label: 'Sanctions', icon: ShieldAlert, show: roles.some(r => ['ADMIN', 'CENSEUR', 'TRESORIER'].includes(r)) },
        { id: 'loans' as const, label: 'Prêts', icon: Banknote, show: roles.some(r => ['ADMIN', 'TRESORIER'].includes(r)) },
        { id: 'reports' as const, label: 'Bilans', icon: BarChart3, show: roles.some(r => ['ADMIN', 'TRESORIER', 'COMMISSAIRE'].includes(r)) },
    ];

    const visibleTabs = tabs.filter(t => t.show);

    return (
        <div className="space-y-6 pb-20 mt-4">
            {/* ── TAB NAVIGATION ── */}
            <div className="flex bg-white/50 p-1.5 rounded-2xl border-2 border-border/20 shadow-sm overflow-x-auto scrollbar-hide">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 min-w-[120px]",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                : "text-ink-muted hover:bg-white"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'sanctions' && (
                    <Card className="p-6 border-b-4 border-b-red-400">
                        <SanctionManager members={members} roles={roles} />
                    </Card>
                )}

                {activeTab === 'loans' && (
                    <Card className="p-6 border-b-4 border-b-amber-400">
                        <LoanManager members={members} roles={roles} />
                    </Card>
                )}

                {activeTab === 'reports' && (
                    <Card className="p-6 border-b-4 border-b-primary shadow-xl">
                        <YearlyReport />
                    </Card>
                )}
            </div>

            <p className="text-[9px] text-center font-bold text-ink-muted uppercase tracking-widest px-10 leading-relaxed">
                Les rapports financiers sont calculés en temps réel sur la base des saisies validées.
            </p>
        </div>
    );
}
