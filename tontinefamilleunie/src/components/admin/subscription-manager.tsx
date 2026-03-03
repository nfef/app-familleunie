'use client';

import { useState, useEffect } from 'react';
import {
    getMemberSubscriptions,
    updateMemberSubscriptions,
    Subscription,
    ContributionType
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X, Activity, User } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
    memberId: number;
    memberName: string;
    contributionTypes: ContributionType[];
    onClose: () => void;
}

export function SubscriptionManager({ memberId, memberName, contributionTypes, onClose }: Props) {
    const [subs, setSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getMemberSubscriptions(memberId);
                const mapped = contributionTypes.map(type => {
                    const existing = data.find(s => s.contribution_type_id === type.id);
                    return {
                        contribution_type_id: type.id,
                        label: type.label,
                        parts: existing ? existing.parts : 1,
                        is_active: existing ? existing.is_active : false,
                        is_subscribed: !!existing,
                        suspension_reason: existing?.suspension_reason ?? ''
                    };
                });
                setSubs(mapped);
            } catch (err) {
                toast.error('Erreur lors du chargement des adhésions');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [memberId, contributionTypes]);

    const toggleSub = (index: number) => {
        const newSubs = [...subs];
        newSubs[index].is_subscribed = !newSubs[index].is_subscribed;
        if (newSubs[index].is_subscribed) {
            newSubs[index].is_active = true;
        }
        setSubs(newSubs);
    };

    const updateSub = (index: number, field: string, value: any) => {
        const newSubs = [...subs];
        newSubs[index] = { ...newSubs[index], [field]: value };
        setSubs(newSubs);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const toSave = subs
                .filter(s => s.is_subscribed)
                .map(s => ({
                    contribution_type_id: s.contribution_type_id,
                    parts: s.parts,
                    is_active: s.is_active,
                    suspension_reason: s.suspension_reason
                }));

            await updateMemberSubscriptions(memberId, toSave);
            toast.success('Adhésions mises à jour');
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header - Sticky */}
                <div className="bg-primary p-5 sm:p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <User className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight line-clamp-1">{memberName}</h2>
                            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/70">Gestion des adhésions aux activités</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 sm:p-8 space-y-4 overflow-y-auto flex-1 bg-bg/10">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Activity className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-primary">Chargement du profil...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subs.map((s, idx) => (
                                <div key={idx} className={clsx(
                                    "p-4 sm:p-5 rounded-[1.5rem] border-2 transition-all",
                                    s.is_subscribed ? "border-primary bg-white shadow-md scale-[1.01]" : "border-border/40 bg-white/20 opacity-60"
                                )}>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="flex items-center gap-3 sm:gap-4 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={s.is_subscribed}
                                                onChange={() => toggleSub(idx)}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-ink">{s.label}</p>
                                                <p className="text-[9px] font-bold text-ink-muted uppercase">Participation à l'activité</p>
                                            </div>
                                        </label>

                                        {s.is_subscribed && (
                                            <button
                                                onClick={() => updateSub(idx, 'is_active', !s.is_active)}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all shrink-0",
                                                    s.is_active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 underline"
                                                )}
                                            >
                                                {s.is_active ? 'Actif' : 'Suspendu'}
                                            </button>
                                        )}
                                    </div>

                                    {s.is_subscribed && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/10 animate-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-ink-muted block mb-1">Nombre de parts</label>
                                                <Input
                                                    type="number"
                                                    step="0.25"
                                                    value={s.parts}
                                                    onChange={(e) => updateSub(idx, 'parts', e.target.value)}
                                                    className="h-10 font-bold bg-bg/20"
                                                />
                                            </div>
                                            {!s.is_active && (
                                                <div className="animate-in fade-in duration-300">
                                                    <label className="text-[9px] font-black uppercase text-amber-600 block mb-1">Motif de suspension</label>
                                                    <Input
                                                        placeholder="Motif..."
                                                        value={s.suspension_reason}
                                                        onChange={(e) => updateSub(idx, 'suspension_reason', e.target.value)}
                                                        className="h-10 text-[10px] italic border-amber-200"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Sticky */}
                <div className="p-4 sm:p-6 bg-white flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t border-border/40 shrink-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] h-10 sm:h-12 order-2 sm:order-1"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-8 h-10 sm:h-12 shadow-lg shadow-primary/20 order-1 sm:order-2"
                    >
                        {saving ? 'Sauvegarde...' : 'Enregistrer les adhésions'}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
