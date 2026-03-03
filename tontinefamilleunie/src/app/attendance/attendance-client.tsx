'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    getMeetingAttendance,
    postMeetingAttendance,
    getMeetingReport
} from '@/lib/api';
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    User,
    Search,
    Loader2,
    Check,
    FileText,
    TrendingDown,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'sonner';

interface AttendanceClientProps {
    meetings: { id: string; label: string }[];
    roles: string[];
}

interface AttendanceRecord {
    user_id: number;
    full_name: string;
    status: string;
    note: string | null;
    consecutive_absences: number;
}

export function AttendanceClient({ meetings, roles }: AttendanceClientProps) {
    const [selectedMeeting, setSelectedMeeting] = useState(meetings[0]?.id || '');
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [threshold, setThreshold] = useState(3);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState<number | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    const canMark = roles.includes('ADMIN') || roles.includes('CENSEUR');

    const fetchAttendance = async (meetingId: string) => {
        if (!meetingId) return;
        setIsLoading(true);
        try {
            const data = await getMeetingAttendance(Number(meetingId));
            setThreshold(data.threshold);
            setRecords(data.attendance);
        } catch (error) {
            toast.error("Erreur lors de la récupération des présences");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReport = async () => {
        setIsLoadingReport(true);
        setShowReport(true);
        try {
            const data = await getMeetingReport(Number(selectedMeeting));
            setReportData(data);
        } catch (error) {
            toast.error("Erreur lors du chargement du rapport");
        } finally {
            setIsLoadingReport(false);
        }
    };

    useEffect(() => {
        fetchAttendance(selectedMeeting);
        setReportData(null);
        setShowReport(false);
    }, [selectedMeeting]);

    const handleStatusChange = async (userId: number, status: string) => {
        if (!canMark) return;
        setIsSaving(userId);
        try {
            await postMeetingAttendance(Number(selectedMeeting), {
                user_id: userId,
                status
            });
            // Re-fetch to get updated consecutive_absences
            fetchAttendance(selectedMeeting);
            toast.success("Présence mise à jour");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setIsSaving(null);
        }
    };

    const filteredRecords = records.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase())
    );

    const statusOptions = [
        { value: 'present', label: 'Présent', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
        { value: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { value: 'late', label: 'Retard', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
        { value: 'excused', label: 'Excusé', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];

    return (
        <div className="space-y-6">
            <Card className="p-4 border-2 border-primary/10">
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted block">
                                Séance de réunion {canMark ? '(Mode Édition)' : '(Lecture seule)'}
                            </label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[9px] font-black uppercase tracking-widest border-secondary text-secondary hover:bg-secondary/5 rounded-full px-4"
                                onClick={fetchReport}
                            >
                                <FileText className="h-3 w-3 mr-1" />
                                Bilan financier
                            </Button>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedMeeting}
                                onChange={(e) => setSelectedMeeting(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 rounded-2xl border-2 border-border/40 font-black text-sm uppercase appearance-none focus:border-primary transition-all outline-none bg-white"
                            >
                                <option value="" disabled>Sélectionner une séance</option>
                                {meetings.map(m => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-muted" />
                        <input
                            type="text"
                            placeholder="RECHERCHER UN MEMBRE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-border/40 font-black text-[10px] uppercase tracking-widest focus:border-primary transition-all outline-none"
                        />
                    </div>
                </div>
            </Card>

            {/* ─── Modal Bilan ─── */}
            <AnimatePresence>
                {showReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            <Card className="max-h-[85vh] overflow-hidden flex flex-col border-4 border-secondary/20 shadow-2xl rounded-[2.5rem]">
                                <div className="p-6 border-b border-border/10 flex justify-between items-center bg-white">
                                    <h3 className="font-black text-ink uppercase tracking-tight flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-secondary" />
                                        Bilan financier
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowReport(false)} className="rounded-full h-8 w-8 p-0 hover:bg-red-50">
                                        <X className="h-5 w-5 text-red-500" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-bg/5">
                                    {isLoadingReport ? (
                                        <div className="py-20 flex flex-col items-center gap-4">
                                            <Loader2 className="h-10 w-10 text-secondary animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-muted">Calcul du bilan...</p>
                                        </div>
                                    ) : reportData?.report.map((item: any, idx: number) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-xs uppercase text-ink flex items-center gap-2">
                                                    <div className={clsx("w-2 h-5 rounded-full", item.type === 'contribution' ? 'bg-primary' : 'bg-secondary')}></div>
                                                    {item.label}
                                                </h4>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] font-black bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20 uppercase">
                                                        Payé: {item.stats.paid}
                                                    </span>
                                                    {item.type === 'contribution' && (
                                                        <span className="text-[9px] font-black bg-red-500/10 text-red-600 px-3 py-1 rounded-full border border-red-500/20 uppercase">
                                                            Échec: {item.stats.failure}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-[2rem] overflow-hidden border-2 border-border/10 shadow-sm">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-bg/10 border-b border-border/10">
                                                            <th className="p-4 text-[9px] font-black text-ink-muted uppercase tracking-widest pl-8">Membre</th>
                                                            <th className="p-4 text-[9px] font-black text-ink-muted uppercase tracking-widest text-center">Parts</th>
                                                            <th className="p-4 text-[9px] font-black text-ink-muted uppercase tracking-widest text-right pr-8">Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/5">
                                                        {item.details.map((det: any, dIdx: number) => (
                                                            <tr key={dIdx} className={clsx("hover:bg-bg/5 transition-colors", det.status === 'failure' && "bg-red-50/50")}>
                                                                <td className="p-4 pl-8 font-bold text-sm text-ink">{det.full_name}</td>
                                                                <td className="p-4 text-center font-black text-xs text-ink-muted">{det.parts || '-'}</td>
                                                                <td className="p-4 text-right pr-8">
                                                                    <span className={clsx(
                                                                        "text-[9px] font-black uppercase px-3 py-1 rounded-full border",
                                                                        det.status === 'paid' ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {det.status === 'paid' ? 'Payé' : 'Échec'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-muted">Chargement de la liste...</p>
                    </div>
                ) : filteredRecords.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredRecords.map((record, index) => (
                            <motion.div
                                key={record.user_id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card className="hover:border-primary/20 transition-all overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted border-2 border-white shadow-inner">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-ink text-sm uppercase leading-tight">
                                                    {record.full_name}
                                                </p>
                                                {record.status === 'absent' && record.consecutive_absences >= threshold && (
                                                    <p className="text-[9px] font-black text-red-500 uppercase mt-0.5 animate-bounce flex items-center gap-1">
                                                        <TrendingDown className="h-3 w-3" />
                                                        ⚠️ Sanction appliquée ({record.consecutive_absences} absences)
                                                    </p>
                                                )}
                                                {record.status === 'absent' && record.consecutive_absences < threshold && (
                                                    <p className="text-[9px] font-black text-orange-500 uppercase mt-0.5 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Série: {record.consecutive_absences}/{threshold}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 sm:flex gap-2">
                                            {statusOptions.map((opt) => {
                                                const isActive = record.status === opt.value;
                                                const Icon = opt.icon;

                                                // Si on n'a pas les droits, on ne montre que le statut actif
                                                if (!canMark && !isActive) return null;

                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleStatusChange(record.user_id, opt.value)}
                                                        disabled={isSaving !== null || !canMark}
                                                        className={clsx(
                                                            "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all disabled:opacity-50",
                                                            canMark && "hover:scale-105 active:scale-95",
                                                            isActive
                                                                ? `${opt.bg} ${opt.color} border-current ring-2 ring-current/20`
                                                                : "bg-white border-border/20 text-ink-muted grayscale hover:grayscale-0"
                                                        )}
                                                        title={opt.label}
                                                    >
                                                        {isSaving === record.user_id && isActive ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            <Icon className="h-5 w-5" />
                                                        )}
                                                        <span className="text-[8px] font-black uppercase mt-1 sm:hidden">
                                                            {opt.label.substring(0, 3)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <Card className="py-20 text-center border-dashed border-2">
                        <p className="font-black text-[10px] text-ink-muted uppercase tracking-widest italic">
                            Aucun membre trouvé
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
