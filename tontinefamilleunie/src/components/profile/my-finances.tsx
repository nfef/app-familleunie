'use client';

import { getMyReport, MemberReport } from '@/lib/api';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import {
    Wallet,
    ShieldCheck,
    AlertCircle,
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingUp,
    Clock
} from 'lucide-react';
import clsx from 'clsx';

export function MyFinances() {
    const { data: report, isLoading } = useSWR('my-report', () => getMyReport());

    if (isLoading) return <div className="animate-pulse space-y-4">
        <div className="h-20 bg-bg rounded-3xl" />
        <div className="h-40 bg-bg rounded-3xl" />
    </div>;

    if (!report) return null;

    const { stats } = report;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-ink">Mes Finances</h3>
            </div>

            {/* ── Fonds / Caisses Progress ── */}
            <div className="grid grid-cols-1 gap-4">
                {stats.funds.map((fund) => (
                    <Card key={fund.fund_type_id} className="relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">{fund.label}</p>
                                <p className="text-xl font-black text-ink">
                                    {fund.balance.toLocaleString()} <span className="text-[10px] text-ink-muted">FCFA</span>
                                </p>
                            </div>
                            {fund.target > 0 && (
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-ink-muted uppercase">Objectif</p>
                                    <p className="text-xs font-bold text-ink-muted">{fund.target.toLocaleString()} FCFA</p>
                                </div>
                            )}
                        </div>

                        {fund.target > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                    <span className={fund.is_completed ? "text-green-600" : "text-primary"}>
                                        {fund.is_completed ? 'Objectif atteint' : `${fund.percentage}% complété`}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-bg rounded-full overflow-hidden border border-border/10">
                                    <div
                                        className={clsx(
                                            "h-full transition-all duration-1000 ease-out rounded-full",
                                            fund.is_completed ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "bg-primary"
                                        )}
                                        style={{ width: `${fund.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {fund.is_completed && (
                            <div className="absolute top-2 right-2">
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* ── Dettes & Sanctions ── */}
            {(stats.sanctions_pending > 0 || stats.active_loans_count > 0) && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> À régulariser
                    </p>

                    {stats.sanctions_list.map((s) => (
                        <Card key={'s' + s.id} className="bg-red-50/50 border-red-100 p-4 border-l-4 border-l-red-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black text-ink uppercase">{s.label}</p>
                                    <p className="text-[10px] font-bold text-ink-muted">Sanction disciplinaire</p>
                                </div>
                                <p className="text-sm font-black text-red-600">{s.amount.toLocaleString()} FCFA</p>
                            </div>
                        </Card>
                    ))}

                    {stats.active_loans_list.map((l) => (
                        <Card key={'l' + l.id} className="bg-amber-50/50 border-amber-100 p-4 border-l-4 border-l-amber-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black text-ink uppercase">Prêt en cours</p>
                                    <p className="text-[10px] font-bold text-ink-muted flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Échéance : {new Date(l.due_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-amber-700">{(l.amount + l.interest).toLocaleString()} FCFA</p>
                                    <p className="text-[9px] font-bold text-amber-600 uppercase">Principal + Intérêts</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Résumé Global ── */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="flex flex-col gap-1 py-4">
                    <div className="bg-green-100 p-1.5 rounded-lg self-start">
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-[10px] font-black text-ink-muted uppercase">Paiements reçus</p>
                    <p className="text-lg font-black text-green-600">{stats.payouts_received.toLocaleString()} <span className="text-[9px]">FCFA</span></p>
                </Card>

                <Card className="flex flex-col gap-1 py-4">
                    <div className="bg-primary/10 p-1.5 rounded-lg self-start">
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] font-black text-ink-muted uppercase">Total cotisé</p>
                    <p className="text-lg font-black text-primary">{stats.contributions_total.toLocaleString()} <span className="text-[9px]">FCFA</span></p>
                </Card>
            </div>
        </div>
    );
}
