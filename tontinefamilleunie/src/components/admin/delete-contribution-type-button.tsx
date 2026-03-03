'use client';

import { Trash2 } from 'lucide-react';
import { deleteContributionType } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from 'sonner';

interface Props {
    id: number;
    label: string;
    onSuccess?: () => void;
}

export function DeleteContributionTypeButton({ id, label, onSuccess }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteContributionType(id);
            toast.success(`Activité "${label}" supprimée`);
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
            setShowConfirm(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Supprimer"
            >
                <Trash2 className="h-4 w-4" />
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer"
                message={`Voulez-vous vraiment supprimer "${label}" ? Cette action est irréversible.`}
                variant="danger"
                confirmText="Supprimer"
                loading={loading}
            />
        </>
    );
}
