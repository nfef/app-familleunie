'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Banknote, Plus, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import useSWR from 'swr';
import { getLoans, postLoan, payLoan } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import clsx from 'clsx';
import { format } from 'date-fns';

interface Props {
    members: { id: string; label: string }[];
    roles: string[];
}

export function LoanManager({ members, roles }: Props) {
    const { data: loans, mutate } = useSWR('loans', () => getLoans());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        user_id: '',
        amount: '',
        interest: '0',
        due_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
    });

    const canManage = roles.some(r => ['ADMIN', 'TRESORIER'].includes(r));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await postLoan({
                user_id: Number(formData.user_id),
                amount: Number(formData.amount),
                interest: Number(formData.interest),
                due_date: formData.due_date
            });
            toast.success('Prêt enregistré');
            mutate();
            setShowModal(false);
            setFormData(prev => ({ ...prev, user_id: '', amount: '', interest: '0' }));
        } catch (err) {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (id: number) => {
        try {
            await payLoan(id);
            toast.success('Remboursement validé');
            mutate();
        } catch (err) {
            toast.error('Erreur lors du remboursement');
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-ink">Gestion des Prêts</h3>
                </div>
                {canManage && (
                    <Button size="sm" className="h-8 rounded-full text-[10px] font-black uppercase" onClick={() => setShowModal(true)}>
                        <Plus className="h-3 w-3 mr-1" /> Accorder
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {loans?.length === 0 && (
                    <p className="text-xs text-ink-muted italic text-center py-6">Aucun prêt en cours.</p>
                )}
                {loans?.map((l) => (
                    <Card key={l.id} className={clsx(
                        "p-4 border-l-4 transition-all",
                        l.status === 'paid' ? "border-l-green-400 bg-green-50/10" : "border-l-amber-400 bg-amber-50/10"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-black text-ink uppercase">{l.user?.full_name}</p>
                                    {l.is_overdue && (
                                        <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Retard</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-ink-muted uppercase">Principal</span>
                                        <span className="text-sm font-bold">{l.amount.toLocaleString()} FCFA</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-amber-600 uppercase">Intérêts</span>
                                        <span className="text-sm font-bold text-amber-600">+{l.interest.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Calendar className="h-3 w-3 text-ink-muted" />
                                    <span className="text-[10px] font-bold text-ink-muted">
                                        Échéance : {format(new Date(l.due_date), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            </div>

                            {l.status !== 'paid' ? (
                                canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-4 text-[10px] font-black uppercase border-primary text-primary hover:bg-primary/5"
                                        onClick={() => handlePay(l.id)}
                                    >
                                        Rembourser
                                    </Button>
                                )
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase">
                                        <CheckCircle2 className="h-3 w-3" /> Remboursé
                                    </span>
                                    {l.paid_at && (
                                        <span className="text-[8px] text-ink-muted font-bold">
                                            le {format(new Date(l.paid_at), 'dd/MM/yyyy')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau Prêt">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Bénéficiaire</label>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Principal (FCFA)</label>
                            <Input
                                type="number"
                                placeholder="Montant prêté"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Intérêt (FCFA)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.interest}
                                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1 block">Date d&apos;échéance</label>
                        <Input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            required
                        />
                    </div>

                    <Button className="w-full py-6 font-black uppercase text-xs" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Valider le Prêt'}
                    </Button>
                </form>
            </Modal>
        </section>
    );
}
