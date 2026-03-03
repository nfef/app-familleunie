'use client';

import { useState } from 'react';
import { createMember } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Shield, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const TIRES = [
    { value: 'MEMBRE', label: 'Membre Standard' },
    { value: 'TRESORIER', label: 'Trésorier' },
    { value: 'COMMISSAIRE', label: 'Commissaire aux comptes' },
    { value: 'SECRETAIRE', label: 'Secrétaire' },
    { value: 'ADMIN', label: 'Administrateur' },
];

export function MemberForm() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['MEMBRE']);
    const [loading, setLoading] = useState(false);

    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            if (selectedRoles.length > 1) {
                setSelectedRoles(selectedRoles.filter(r => r !== role));
            }
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createMember({
                full_name: fullName,
                email,
                phone: phone || undefined,
                roles: selectedRoles
            });
            toast.success(`Membre ${fullName} inscrit avec succès`);
            router.refresh();
            setFullName('');
            setEmail('');
            setPhone('');
            setSelectedRoles(['MEMBRE']);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-black text-ink uppercase tracking-tight">Nouveau Membre</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                        Nom Complet
                    </label>
                    <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="jean@exemple.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-1.5 block">
                            Téléphone (Optionnel)
                        </label>
                        <Input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+225..."
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink-muted ml-1 mb-3 block">
                        Rôles & Accès
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TIRES.map(role => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => toggleRole(role.value)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                    selectedRoles.includes(role.value)
                                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                        : "bg-white border-border text-ink-muted hover:border-primary/30"
                                )}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full py-6 font-black uppercase tracking-widest text-sm shadow-lg"
                    disabled={loading}
                >
                    {loading ? 'Création...' : 'Inscrire le membre'}
                </Button>
            </form>
        </div>
    );
}
