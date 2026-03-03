'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ShieldAlert, Plus, CheckCircle2, History } from 'lucide-react';
import useSWR from 'swr';
import { getSanctions, postSanction, paySanction, getMeetings } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
    members: { id: string; label: string }[];
    roles: string[];
}

export function SanctionManager({ members, roles }: Props) {
    const { data: sanctions, mutate } = useSWR('sanctions', () => getSanctions());
    const { data: meetings } = useSWR('meetings', getMeetings);

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        user_id: '',
        meeting_id: '',
        label: '',
        amount: ''
    });

    const isCenseur = roles.some(r => ['ADMIN', 'CENSEUR', 'TRESORIER'].includes(r));
    const canPay = roles.some(r => ['ADMIN', 'TRESORIER'].includes(r));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await postSanction({
                user_id: Number(formData.user_id),
                meeting_id: formData.meeting_id ? Number(formData.meeting_id) : undefined,
                label: formData.label,
                amount: Number(formData.amount)
            });
            toast.success('Sanction enregistrée');
            mutate();
            setShowModal(false);
            setFormData({ user_id: '', meeting_id: '', label: '', amount: '' });
        } catch (err) {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (id: number) => {
        try {
            await paySanction(id);
            toast.success('Paiement enregistré');
            mutate();
        } catch (err) {
            toast.error('Erreur lors du paiement');
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-ink">Sanctions & Discipline</h3>
                </div>
                {isCenseur && (
                    <Button size="sm" className="h-8 rounded-full text-[10px] font-black uppercase" onClick={() => setShowModal(true)}>
                        <Plus className="h-3 w-3 mr-1" /> Infliger
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {sanctions?.length === 0 && (
                    <p className="text-xs text-ink-muted italic text-center py-6">Aucune sanction en cours.</p>
                )}
                {sanctions?.map((s) => (
                    <Card key={s.id} className={clsx(
                        "p-4 border-l-4 transition-all",
                        s.status === 'paid' ? "border-l-green-400 bg-green-50/30" : "border-l-red-400 bg-red-50/30"
                    )}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-ink uppercase">{s.user?.full_name}</p>
                                <p className="text-[10px] font-bold text-ink-muted">{s.label} • {s.amount.toLocaleString()} FCFA</p>
                                {s.meeting && (
                                    <p className="text-[9px] text-primary font-bold mt-0.5">
                                        Séance du {format(new Date(s.meeting.meeting_date), 'dd MMM yyyy', { locale: fr })}
                                    </p>
                                )}
                            </div>
                            {s.status === 'pending' ? (
                                canPay && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-[10px] font-black uppercase border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => handlePay(s.id)}
                                    >
                                        Encaisser
                                    </Button>
                                )
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase">
                                        <CheckCircle2 className="h-3 w-3" /> Payé
                                    </span>
                                    {s.paid_at && (
                                        <span className="text-[8px] text-ink-muted font-bold">
                                            le {format(new Date(s.paid_at), 'dd/MM/yyyy')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Sanction">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Membre concerné</label>
                        <select
                            className="app-select h-12 text-sm font-bold"
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            required
                        >
                            <option value="">Sélectionner un membre</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Séance (Optionnel)</label>
                        <select
                            className="app-select h-12 text-sm font-bold"
                            value={formData.meeting_id}
                            onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                        >
                            <option value="">Hors séance</option>
                            {meetings?.map(m => (
                                <option key={m.id} value={m.id}>
                                    Séance du {format(new Date(m.meeting_date), 'dd/MM/yyyy')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Motif de la sanction</label>
                        <Input
                            placeholder="Ex: Retard, Téléphone, etc."
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Montant (FCFA)</label>
                        <Input
                            type="number"
                            placeholder="500"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    <Button className="w-full py-6 font-black uppercase text-xs" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Valider la Sanction'}
                    </Button>
                </form>
            </Modal>
        </section>
    );
}
