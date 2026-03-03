'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm overflow-hidden bg-white rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-border/5">
                                <h3 className="text-lg font-black uppercase tracking-tight text-ink">
                                    {title}
                                </h3>
                                <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {description && (
                                <p className="text-xs font-semibold text-ink-muted leading-relaxed mb-6 italic">
                                    {description}
                                </p>
                            )}
                            <div className="pb-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = 'primary',
    loading = false
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-3xl bg-bg border-2 border-border/20">
                    <div className={variant === 'danger' ? "text-red-500" : "text-primary"}>
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-ink/80">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={onConfirm}
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        disabled={loading}
                        className="py-6 font-black uppercase tracking-widest text-xs"
                    >
                        {loading ? "Chargement..." : confirmText}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        disabled={loading}
                        className="font-black uppercase tracking-widest text-[10px] text-ink-muted"
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
