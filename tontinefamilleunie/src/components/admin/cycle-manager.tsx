'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, XCircle, Plus, LayoutGrid } from 'lucide-react';
import useSWR from 'swr';
import { getCycles, postCycle, updateCycle } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Modal } from '@/components/ui/modal';

export function CycleManager() {
    const { data: cycles, mutate } = useSWR('cycles', getCycles);
    const [loading, setLoading] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        start_date: format(new Date(), 'yyyy-MM-dd')
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await postCycle(formData);
            toast.success('Nouveau tour ouvert avec succès');
            mutate();
            setShowNewModal(false);
            setFormData({ label: '', start_date: format(new Date(), 'yyyy-MM-dd') });
        } catch (err) {
            toast.error('Erreur lors de la création du tour');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await updateCycle(id, { is_active: !currentStatus, end_date: !currentStatus ? null : format(new Date(), 'yyyy-MM-dd') });
            toast.success(currentStatus ? 'Tour clôturé' : 'Tour réactivé');
            mutate();
        } catch (err) {
            toast.error('Erreur lors de la modification du statut');
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Tours &amp; Cycles
            </h2>

            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-border/10 flex items-center justify-between bg-bg/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Cycles de gestion</p>
                    <Button
                        size="sm"
                        className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest"
                        onClick={() => setShowNewModal(true)}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Nouveau Tour
                    </Button>
                </div>

                <div className="divide-y divide-border/20">
                    {cycles && cycles.length > 0 ? (
                        cycles.map((cycle) => (
                            <div key={cycle.id} className="p-4 flex items-center justify-between hover:bg-bg/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${cycle.is_active ? 'bg-primary/10 text-primary' : 'bg-ink-muted/10 text-ink-muted'}`}>
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-ink leading-tight">{cycle.label}</h4>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-tight">
                                            Débuté le {format(new Date(cycle.start_date), 'dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full ${cycle.is_active ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                                        {cycle.is_active ? 'En cours' : 'Bouclé'}
                                    </span>
                                    <button
                                        onClick={() => handleToggleStatus(cycle.id, cycle.is_active)}
                                        className={`p-2 rounded-xl transition-all ${cycle.is_active ? 'text-red-400 hover:bg-red-50' : 'text-primary hover:bg-primary/5'}`}
                                        title={cycle.is_active ? 'Boucler le tour' : 'Réactiver'}
                                    >
                                        {cycle.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-ink-muted italic">Aucun tour configuré.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                title="Ouvrir un nouveau tour"
            >
                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Nom du cycle / tour
                        </label>
                        <Input
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="Ex: Tour d'Hiver 2025, Saison d'Huile..."
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Date de début
                        </label>
                        <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full py-6 font-black uppercase tracking-widest text-xs"
                        disabled={loading}
                    >
                        {loading ? 'Ouverture...' : 'Ouvrir ce tour'}
                    </Button>
                </form>
            </Modal>
        </section>
    );
}
