'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, TrendingDown, Wallet, Landmark, Scale } from 'lucide-react';
import useSWR from 'swr';
import { getYearlyReport } from '@/lib/api';
import clsx from 'clsx';

export function YearlyReport() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const { data: report, isLoading } = useSWR(['yearly-report', year], () => getYearlyReport(year));

    if (isLoading) return <div className="p-10 text-center animate-pulse font-black text-ink-muted uppercase">Calcul des états...</div>;

    const summaryItems = [
        { label: 'Cotisations', value: report?.summary.total_contributions, icon: Wallet, color: 'text-primary' },
        { label: 'Sorties Tontines', value: report?.summary.total_payouts, icon: Landmark, color: 'text-secondary' },
        { label: 'Dépôts Caisses', value: report?.summary.total_fund_in, icon: TrendingUp, color: 'text-green-600' },
        { label: 'Dépenses Caisses', value: report?.summary.total_fund_out, icon: TrendingDown, color: 'text-red-500' },
        { label: 'Sanctions Encaissées', value: report?.summary.total_sanctions, icon: FileText, color: 'text-orange-500' },
        { label: 'Intérêts Prêts', value: report?.summary.total_interests, icon: TrendingUp, color: 'text-amber-600' },
    ];

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-ink">États Financiers Annuels</h3>
                    <p className="text-[10px] font-bold text-ink-muted uppercase">Bilan consolidé de l'exercice {year}</p>
                </div>
                <select
                    className="app-select h-10 w-32 text-xs font-black uppercase border-2"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {summaryItems.map((item, idx) => (
                    <Card key={idx} className="p-4 flex flex-col items-center text-center border-2 border-border/20 bg-white/50">
                        <div className={clsx("p-2 rounded-xl bg-gray-50 mb-3", item.color)}>
                            <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-black text-ink-muted uppercase tracking-tighter mb-1">{item.label}</span>
                        <span className="text-sm font-black text-ink">
                            {(item.value || 0).toLocaleString()} <span className="text-[10px] opacity-70">FCFA</span>
                        </span>
                    </Card>
                ))}
            </div>

            <Card className="p-6 bg-primary text-white border-0 shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <Scale className="h-8 w-8 mb-4 opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Trésorerie Nette</span>
                    <span className="text-4xl font-black">
                        {(report?.net_cash_flow || 0).toLocaleString()}
                        <span className="text-xl ml-2 font-bold opacity-60">FCFA</span>
                    </span>
                    <p className="text-[9px] font-bold mt-4 px-4 py-1.5 bg-white/20 rounded-full uppercase tracking-widest">
                        Solde courant consolidé
                    </p>
                </div>
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full -ml-16 -mb-16 blur-3xl"></div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-bg border-2 border-border/40">
                    <span className="text-[9px] font-black text-ink-muted uppercase block mb-1">Prêts Accordés</span>
                    <span className="text-base font-black text-ink">{(report?.summary.loans_disbursed || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="p-4 rounded-3xl bg-bg border-2 border-border/40">
                    <span className="text-[9px] font-black text-ink-muted uppercase block mb-1">Prêts Remboursés</span>
                    <span className="text-base font-black text-ink">{(report?.summary.loans_repaid || 0).toLocaleString()} FCFA</span>
                </div>
            </div>
        </section>
    );
}
