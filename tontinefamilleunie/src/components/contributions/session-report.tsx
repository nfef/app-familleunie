'use client';

import { useState } from 'react';
import { getMeetingReport, SessionReport as SessionReportData } from '@/lib/api';

function buildFailuresReport(data: Awaited<ReturnType<typeof getMeetingReport>>): SessionReportData {
    const report = data.report
        .filter((item) => item.type === 'contribution')
        .map((item, idx) => {
            const failures = item.details
                .filter((d) => d.status === 'failure')
                .map((d) => ({ member_id: d.user_id, full_name: d.full_name, parts: d.parts ?? 0, amount: d.amount }));
            return {
                // L'API ne renvoie pas d'identifiant de type ici ; non utilisé pour l'affichage (seul idx sert de clé React).
                contribution_type_id: idx,
                label: item.label,
                failures,
                total_missing: failures.reduce((sum, f) => sum + f.amount, 0),
            };
        });

    return {
        meeting: data.meeting,
        report,
        grand_total_missing: report.reduce((sum, r) => sum + r.total_missing, 0),
    };
}
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    meetings: { id: string; label: string }[];
}

export function SessionReport({ meetings }: Props) {
    const [selectedMeetingId, setSelectedMeetingId] = useState(meetings[0]?.id || '');
    const [report, setReport] = useState<SessionReportData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        if (!selectedMeetingId) return;
        setLoading(true);
        try {
            const data = await getMeetingReport(parseInt(selectedMeetingId));
            setReport(buildFailuresReport(data));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-ink text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileBarChart className="h-40 w-40" />
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                            <FileBarChart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Rapport de Séance</h2>
                            <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">Suivi des recouvrements &amp; échecs</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            className="bg-white/10 border-white/20 text-white text-xs font-bold rounded-xl h-12 px-4 focus:ring-primary focus:border-primary outline-none"
                            value={selectedMeetingId}
                            onChange={(e) => setSelectedMeetingId(e.target.value)}
                        >
                            {meetings.map(m => (
                                <option key={m.id} value={m.id} className="text-black">Séance du {m.label}</option>
                            ))}
                        </select>
                        <Button
                            onClick={fetchReport}
                            disabled={loading || !selectedMeetingId}
                            className="h-12 w-12 p-0 rounded-xl bg-primary hover:bg-primary-dark transition-all"
                        >
                            <RefreshCw className={clsx("h-5 w-5", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {!report && !loading && (
                    <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
                        <p className="text-sm font-bold text-ink-muted uppercase tracking-widest">
                            Cliquez sur le bouton pour générer le rapport
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Analyse des données en cours...</p>
                    </div>
                )}

                {report && !loading && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* ── TOTAL GENERA ── */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted mb-1">Total Général Manquant</p>
                                <p className="text-4xl font-black text-primary">
                                    {report.grand_total_missing.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
                                </p>
                            </div>
                            {report.grand_total_missing === 0 ? (
                                <div className="flex flex-col items-end">
                                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                                    <span className="text-[10px] font-black uppercase text-green-400 mt-2">Séance Parfaite</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <AlertTriangle className="h-10 w-10 text-amber-400" />
                                    <span className="text-[10px] font-black uppercase text-amber-400 mt-2">Dettes à recouvrer</span>
                                </div>
                            )}
                        </div>

                        {/* ── DETAILS PAR TYPE ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {report.report.map((item, idx) => (
                                <div key={idx} className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:border-white/20 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-black uppercase tracking-widest text-primary group-hover:scale-110 transition-transform origin-left">
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-lg">
                                            {item.failures.length} échec(s)
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                        {item.failures.map((f, fIdx) => (
                                            <div key={fIdx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                <span className="text-xs font-bold text-ink-muted">{f.full_name}</span>
                                                <span className="text-xs font-black text-amber-400">-{f.amount.toLocaleString('fr-FR')}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-ink-muted">Sous-total</span>
                                        <span className="text-sm font-black text-white">{item.total_missing.toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                </div>
                            ))}

                            {report.report.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <CheckCircle2 className="h-16 w-16 text-green-500/20 mx-auto mb-4" />
                                    <p className="text-lg font-black uppercase text-green-500/40">Aucun échec pour cette séance</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
