'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Le mot de passe doit faire au moins 8 caractères.');
            return;
        }

        if (password !== confirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            await changePassword({
                password,
                password_confirmation: confirmation
            });
            setSuccess(true);
            // Wait a bit before redirecting
            setTimeout(() => {
                router.push('/profile');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl border-t-4 border-t-secondary animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="h-8 w-8 text-secondary" />
                    </div>
                    <h1 className="text-2xl font-black text-ink">Première Connexion</h1>
                    <p className="text-sm text-ink-muted mt-2">
                        Pour sécuriser votre compte, vous devez définir votre propre mot de passe avant de continuer.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-green-800 font-bold mb-1">Mot de passe enregistré !</h3>
                        <p className="text-green-600 text-sm">Redirection vers votre profil...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-ink-muted mb-2 block">Nouveau mot de passe</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="bg-bg/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-ink-muted mb-2 block">Confirmer le mot de passe</label>
                            <Input
                                type="password"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="bg-bg/50"
                            />
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 italic">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-6 font-black text-lg uppercase tracking-widest shadow-xl"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Activer mon compte'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
