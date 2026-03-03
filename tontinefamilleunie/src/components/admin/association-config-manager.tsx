'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminConfigs, postAdminConfig } from '@/lib/api';
import useSWR from 'swr';
import {
    Settings,
    Save,
    Loader2,
    CheckCircle2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

export function AssociationConfigManager() {
    const { data: configs, mutate } = useSWR('admin-configs', getAdminConfigs);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const handleUpdate = async (config: any, newValue: any) => {
        setIsSaving(config.key);
        try {
            await postAdminConfig({
                ...config,
                value: newValue
            });
            mutate();
            toast.success("Configuration mise à jour");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setIsSaving(null);
        }
    };

    if (!configs) {
        return (
            <Card className="h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </Card>
        );
    }

    // Group configs
    const groups = Array.from(new Set(configs.map(c => c.group)));

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Réglages Généraux
            </h2>

            {groups.map(group => (
                <Card key={group} className="overflow-hidden">
                    <div className="bg-bg/40 px-4 py-2 border-b border-border/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink/60">
                            Groupe: {group}
                        </p>
                    </div>
                    <div className="divide-y divide-border/20">
                        {configs.filter(c => c.group === group).map(config => (
                            <div key={config.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg/5 transition-colors">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-ink uppercase tracking-tight">
                                        {config.label || config.key}
                                    </p>
                                    <p className="text-[9px] font-bold text-ink-muted uppercase">
                                        Clé: {config.key}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {config.type === 'boolean' ? (
                                        <button
                                            onClick={() => handleUpdate(config, config.value === '1' || config.value === true ? '0' : '1')}
                                            disabled={isSaving === config.key}
                                            className={clsx(
                                                "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                (config.value === '1' || config.value === true) ? "bg-primary" : "bg-gray-200"
                                            )}
                                        >
                                            <span
                                                className={clsx(
                                                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                                                    (config.value === '1' || config.value === true) ? "translate-x-7" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type={config.type === 'int' ? 'number' : 'text'}
                                                defaultValue={config.value}
                                                onBlur={(e) => {
                                                    if (e.target.value !== String(config.value)) {
                                                        handleUpdate(config, e.target.value);
                                                    }
                                                }}
                                                className="h-10 px-4 rounded-xl border-2 border-border/40 font-black text-sm w-32 focus:border-primary transition-all outline-none"
                                            />
                                            {config.type === 'int' && <span className="text-[9px] font-black text-ink-muted uppercase">Unité / Valeur</span>}
                                        </div>
                                    )}

                                    {isSaving === config.key && (
                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
        </section>
    );
}
