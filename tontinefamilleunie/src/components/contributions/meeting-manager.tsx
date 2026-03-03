'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { getMeetings, postMeeting, deleteMeeting, getCycles } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Modal, ConfirmModal } from '@/components/ui/modal';

export function MeetingManager() {
    const { data: meetings, mutate } = useSWR('meetings', getMeetings);
    const { data: cycles } = useSWR('cycles', getCycles);

    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        cycle_id: '',
        meeting_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    // Auto-select active cycle if available
    const activeCycleId = cycles?.find(c => c.is_active)?.id;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const cycleId = formData.cycle_id || activeCycleId;

        if (!cycleId) {
            toast.error('Aucun tour actif. Veuillez ouvrir un tour dans la Configuration.');
            return;
        }

        setLoading(true);
        try {
            await postMeeting({
                cycle_id: Number(cycleId),
                meeting_date: formData.meeting_date,
                notes: formData.notes
            });
            toast.success('Séance créée avec succès');
            mutate();
            setShowModal(false);
        } catch (err) {
            toast.error('Erreur lors de la création de la séance');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMeetingId) return;
        setLoading(true);
        try {
            await deleteMeeting(selectedMeetingId);
            toast.success('Séance supprimée');
            mutate();
            setShowConfirm(false);
        } catch (err) {
            toast.error('Impossible de supprimer une séance contenant des données.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink-muted">Séances de Travail</h3>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full text-[10px] font-black uppercase"
                    onClick={() => {
                        setFormData(prev => ({ ...prev, cycle_id: String(activeCycleId || '') }));
                        setShowModal(true);
                    }}
                >
                    <Plus className="h-3 w-3 mr-1" /> Ouvrir Séance
                </Button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {meetings && meetings.length > 0 ? (
                    meetings.map((m) => (
                        <Card
                            key={m.id}
                            className="flex-shrink-0 w-40 p-4 border-2 border-border/20 group relative overflow-hidden bg-white/50"
                        >
                            <Calendar className="h-4 w-4 text-primary mb-2" />
                            <p className="font-extrabold text-sm text-ink leading-tight">
                                {format(new Date(m.meeting_date), 'dd MMM yyyy', { locale: fr })}
                            </p>
                            <p className="text-[9px] font-black text-secondary uppercase mt-1">
                                Tour: {m.cycle?.label}
                            </p>

                            <button
                                onClick={() => {
                                    setSelectedMeetingId(m.id);
                                    setShowConfirm(true);
                                }}
                                className="absolute -top-2 -right-2 p-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-bl-2xl"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </Card>
                    ))
                ) : (
                    <p className="text-[10px] font-bold text-ink-muted italic pl-1 uppercase">Aucune séance encore ouverte.</p>
                )}
            </div>

            {/* Modal de création */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Séance">
                <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Rattachement au Tour
                        </label>
                        <select
                            className="app-select h-12 text-xs font-bold"
                            value={formData.cycle_id || activeCycleId || ''}
                            onChange={(e) => setFormData({ ...formData, cycle_id: e.target.value })}
                            required
                        >
                            <option value="">Sélectionner un tour</option>
                            {cycles?.map(c => (
                                <option key={c.id} value={c.id}>{c.label} {c.is_active ? '(Actif)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Date de la séance
                        </label>
                        <Input
                            type="date"
                            value={formData.meeting_date}
                            onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                            required
                        />
                    </div>

                    <Button className="w-full py-6 font-black uppercase tracking-widest text-xs" disabled={loading}>
                        {loading ? 'Création...' : 'Valider la Séance'}
                    </Button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer Séance"
                message="Voulez-vous supprimer cette séance ? Note : Une séance contenant des données financières ne pourra pas être supprimée."
                variant="danger"
                loading={loading}
            />
        </section>
    );
}
