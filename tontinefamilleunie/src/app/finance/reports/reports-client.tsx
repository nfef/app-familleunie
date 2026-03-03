'use client';

import { useState, useEffect } from 'react';
import { getFinancialReportMeetings, getFinancialReport } from '@/lib/api';
import { Card } from '@/components/ui/card';
import {
    ChevronDown,
    Loader2,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Users,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportsClientProps {
    roles: string[];
}

export function ReportsClient({ roles }: ReportsClientProps) {
    const [meetings, setMeetings] = useState<{ id: number, meeting_date: string }[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
    const [report, setReport] = useState<any>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    useEffect(() => {
        const fetchList = async () => {
            try {
                const data = await getFinancialReportMeetings();
                setMeetings(data);
                if (data.length > 0) {
                    setSelectedMeeting(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch meetings", error);
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchList();
    }, []);

    useEffect(() => {
        if (selectedMeeting) {
            const fetchReport = async () => {
                setIsLoadingReport(true);
                try {
                    const data = await getFinancialReport(selectedMeeting);
                    setReport(data);
                } catch (error) {
                    console.error("Failed to fetch report", error);
                } finally {
                    setIsLoadingReport(false);
                }
            };
            fetchReport();
        }
    }, [selectedMeeting]);

    if (isLoadingList) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-black text-[10px] uppercase tracking-widest text-ink-muted">Chargement des séances...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            {/* Selector Card */}
            <Card className="p-4 border-2 border-primary/10 rounded-[2rem] bg-white shadow-sm">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted block text-center">
                        Sélectionner une séance
                    </label>
                    <div className="relative">
                        <select
                            value={selectedMeeting || ''}
                            onChange={(e) => setSelectedMeeting(Number(e.target.value))}
                            className="w-full h-14 pl-6 pr-12 rounded-[2rem] border-2 border-border/40 font-black text-sm uppercase appearance-none focus:border-primary transition-all outline-none bg-white shadow-sm"
                        >
                            {meetings.map((m) => (
                                <option key={m.id} value={m.id}>
                                    Séance du {format(new Date(m.meeting_date), 'dd MMMM yyyy (EEEE)', { locale: fr })}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                            <ChevronDown className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </Card>

            <AnimatePresence mode="wait">
                {isLoadingReport ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 flex flex-col items-center gap-4"
                    >
                        <Loader2 className="h-12 w-12 text-secondary animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-muted">Analyse de la séance...</p>
                    </motion.div>
                ) : report ? (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        {/* ─── NEW SUMMARY CARDS ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-emerald-600 text-white border-none p-6 shadow-xl shadow-emerald-600/20 rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <TrendingUp className="h-24 w-24" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Encaissé</p>
                                    <h3 className="text-3xl font-black leading-none">
                                        {report.summary.total_collected.toLocaleString()} <span className="text-sm">FCFA</span>
                                    </h3>
                                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                        <ArrowUpRight className="h-3 w-3" />
                                        Mouvements Entrants
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-rose-600 text-white border-none p-6 shadow-xl shadow-rose-600/20 rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <AlertCircle className="h-24 w-24" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Impayés</p>
                                    <h3 className="text-3xl font-black leading-none text-rose-100">
                                        {report.summary.total_failure.toLocaleString()} <span className="text-sm">FCFA</span>
                                    </h3>
                                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                        <TrendingDown className="h-3 w-3" />
                                        Manque à Gagner
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Net Cash & Outflow Summary (Subtle) */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white border-2 border-border/10 p-5 rounded-[2.5rem] shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Total Sorties</p>
                                <h3 className="text-lg font-black mt-1 text-secondary">
                                    {report.summary.total_out.toLocaleString()} FCFA
                                </h3>
                            </Card>
                            <Card className="bg-ink text-white border-none p-5 rounded-[2.5rem] shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">En Caisse (Net)</p>
                                <h3 className="text-lg font-black mt-1 text-secondary">
                                    {report.summary.net_cash.toLocaleString()} FCFA
                                </h3>
                            </Card>
                        </div>

                        {/* ─── NEW STICKY LEDGER MATRIX ─── */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-6 bg-indigo-900 rounded-full" />
                                <h4 className="font-black text-[15px] uppercase tracking-tight text-ink">
                                    Grand Livre des Cotisations
                                </h4>
                            </div>

                            <Card className="overflow-hidden border-2 border-border/10 rounded-[2.5rem] bg-white shadow-lg">
                                <div className="overflow-x-auto scrollbar-hide">
                                    <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-border/10 bg-bg/40">
                                                {/* Sticky Column Header */}
                                                <th className="sticky left-0 z-20 bg-bg px-6 py-5 w-[180px] text-[10px] font-black uppercase tracking-widest text-ink border-r border-border/10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                    Membre
                                                </th>
                                                {report.contribution_headers.map((h: any) => (
                                                    <th key={h.id} className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-ink-muted/70 text-center border-r border-border/5">
                                                        {h.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/5">
                                            {report.matrix.map((row: any) => (
                                                <tr key={row.id} className="hover:bg-bg/20 transition-colors">
                                                    {/* Sticky Name Column */}
                                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 font-extrabold text-[12px] text-ink uppercase leading-tight border-r border-border/10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                        {row.name}
                                                    </td>
                                                    {row.contributions.map((c: any, cIdx: number) => (
                                                        <td key={cIdx} className="px-4 py-4 text-center border-r border-border/5">
                                                            {c.status === 'none' ? (
                                                                <span className="text-[10px] font-black text-ink-muted/20">—</span>
                                                            ) : (
                                                                <div className={clsx(
                                                                    "font-black text-[13px]",
                                                                    c.status === 'paid' ? "text-emerald-600" : "text-rose-600"
                                                                )}>
                                                                    {c.amount.toLocaleString()}
                                                                    <div className={clsx(
                                                                        "h-1.5 w-1.5 rounded-full mx-auto mt-1",
                                                                        c.status === 'paid' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 animate-pulse"
                                                                    )} />
                                                                </div>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-bg/10 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-ink-muted text-center italic">
                                    Faites glisser horizontalement pour voir toutes les rubriques <ArrowUpRight className="inline h-3 w-3 rotate-45" />
                                </div>
                            </Card>
                        </div>

                        {/* ─── OTHER FLOWS (Non-ledger items) ─── */}
                        {report.other_flows.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1.5 h-6 bg-secondary rounded-full" />
                                    <h4 className="font-black text-[15px] uppercase tracking-tight text-ink">
                                        Mouvements Bancaires & Prêts
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {report.other_flows.map((flow: any, fIdx: number) => (
                                        <div key={fIdx} className="space-y-3">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">{flow.label}</span>
                                                <span className={clsx(
                                                    "text-sm font-black",
                                                    flow.type === 'in' ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {flow.type === 'in' ? '+' : '-'}{flow.total.toLocaleString()} FCFA
                                                </span>
                                            </div>
                                            <Card className="divide-y divide-border/5 bg-white border-2 border-border/5 rounded-[2rem] overflow-hidden">
                                                {flow.details.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="px-6 py-4 flex justify-between items-center hover:bg-bg/20 transition-colors">
                                                        <div className="max-w-[70%]">
                                                            <p className="font-bold text-[13px] text-ink uppercase truncate">{item.name}</p>
                                                            <p className="text-[10px] font-black uppercase text-ink-muted/70 tracking-tighter">{item.info}</p>
                                                        </div>
                                                        <span className="font-black text-sm text-ink">
                                                            {item.amount.toLocaleString()} <span className="text-[10px] opacity-50">FCFA</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="py-20 text-center">
                        <AlertCircle className="h-12 w-12 text-ink-muted mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-black text-ink-muted uppercase tracking-widest">Aucun rapport disponible</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
