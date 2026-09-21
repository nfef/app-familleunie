'use client';

import { useEffect, useState, useRef } from 'react';
import { getMyContributions, MemberContribution, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar,
    ChevronDown,
    CheckCircle2,
    History as HistoryIcon,
    Loader2
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type FilterType = 'default' | '3months' | '6months' | 'all';

export function HistoryList() {
    const [filter, setFilter] = useState<FilterType>('default');
    const [items, setItems] = useState<MemberContribution[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    const fetchContributions = async (targetPage: number, targetFilter: FilterType, isNewFilter: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const res = await getMyContributions({
                filter: targetFilter === 'all' ? undefined : targetFilter,
                page: targetPage
            });

            if (isNewFilter) {
                setItems(res.data);
            } else {
                setItems(prev => [...prev, ...res.data]);
            }

            setHasMore(res.current_page < res.last_page);
            setPage(res.current_page + 1);
        } catch (error) {
            console.error('Failed to fetch contributions', error);
        } finally {
            setIsLoading(false);
            setIsFirstLoad(false);
        }
    };

    // Handle filter change
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setIsFirstLoad(true);
        fetchContributions(1, filter, true);
    }, [filter]);

    // Handle scroll
    useEffect(() => {
        if (inView && hasMore && !isLoading && !isFirstLoad) {
            fetchContributions(page, filter);
        }
    }, [inView, hasMore, isLoading, isFirstLoad]);

    const filters = [
        { value: 'default', label: 'Dernières séances' },
        { value: '3months', label: '3 derniers mois' },
        { value: '6months', label: '6 derniers mois' },
        { value: 'all', label: 'Tout l\'historique' },
    ];

    return (
        <div className="space-y-6">
            {/* ── Filter Select ── */}
            <div className="relative">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="w-full h-12 pl-4 pr-10 rounded-2xl border-2 border-border/40 font-black text-[10px] uppercase tracking-widest appearance-none focus:border-primary transition-all outline-none bg-white shadow-sm"
                >
                    {filters.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                    <ChevronDown className="h-5 w-5" />
                </div>
            </div>

            {/* ── List ── */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: (index % 15) * 0.05 }}
                        >
                            <Card className="hover:border-primary/30 transition-all border-l-4 border-l-primary group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-ink text-sm uppercase leading-tight">
                                                {item.contribution_type?.label ?? 'Cotisation'}
                                            </p>
                                            <p className="text-[10px] font-bold text-ink-muted uppercase flex items-center gap-1">
                                                <HistoryIcon className="h-3 w-3" />
                                                {format(new Date(item.paid_at), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary">
                                            {item.total_amount.toLocaleString()} <span className="text-[9px]">FCFA</span>
                                        </p>
                                        <p className="text-[9px] font-black text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded-full inline-block">
                                            {item.parts} part(s)
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* ── Loading / Empty / End states ── */}
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                )}

                {!isLoading && items.length === 0 && (
                    <Card className="py-20 bg-bg/20 border-dashed text-center">
                        <p className="text-sm font-black text-ink-muted uppercase tracking-widest italic">
                            Aucune cotisation trouvée
                        </p>
                    </Card>
                )}

                <div ref={ref} className="h-10 w-full flex justify-center items-center">
                    {!hasMore && items.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-2 py-8"
                        >
                            <div className="h-px w-20 bg-border/40" />
                            <p className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em]">
                                Fin de l&apos;historique
                            </p>
                            <CheckCircle2 className="h-5 w-5 text-green-500/50" />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
