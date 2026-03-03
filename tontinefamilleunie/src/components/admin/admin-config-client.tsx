'use client';

import { Card } from '@/components/ui/card';
import { FundTypeForm } from '@/components/admin/fund-type-form';
import { ContributionTypeForm } from '@/components/admin/contribution-type-form';
import Link from 'next/link';
import { Users, ListFilter } from 'lucide-react';
import { DeleteContributionTypeButton } from '@/components/admin/delete-contribution-type-button';
import { DeleteFundTypeButton } from '@/components/admin/delete-fund-type-button';
import useSWR from 'swr';
import { getContributionTypes, getFundTypes } from '@/lib/api';
import { CycleManager } from '@/components/admin/cycle-manager';
import { AssociationConfigManager } from '@/components/admin/association-config-manager';

export function AdminConfigClient() {
    const { data: contributionTypes, mutate: mutateCT } = useSWR('contribution-types', getContributionTypes, {
        revalidateOnFocus: false,
    });
    const { data: fundTypes, mutate: mutateFT } = useSWR('fund-types', getFundTypes, {
        revalidateOnFocus: false,
    });

    return (
        <div className="space-y-8 pb-20 mt-4">
            {/* Gestion des Cycles / Tours */}
            <CycleManager />

            {/* Réglages généraux (Présences, etc) */}
            <AssociationConfigManager />

            {/* Quick Links / Navigation to Members */}
            <section className="grid grid-cols-1 gap-4">
                <Link href={"/admin/members" as any}>
                    <Card className="group hover:border-primary transition-all border-l-4 border-l-primary cursor-pointer bg-white">
                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-ink">Gestion des Membres actifs</h3>
                                    <p className="text-[10px] font-bold text-ink-muted uppercase">Inscriptions, parts et suspensions</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                <ListFilter className="h-4 w-4" />
                            </div>
                        </div>
                    </Card>
                </Link>
            </section>

            {/* Section Types de Cotisations */}
            <section className="space-y-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                    Activités &amp; Cotisations
                </h2>

                <Card>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-4 pl-1">Catalogue des versements</p>
                    {contributionTypes && contributionTypes.length > 0 ? (
                        <ul className="space-y-3 text-sm">
                            {contributionTypes.map((type) => (
                                <li key={type.id} className="flex justify-between items-center border-b border-border/30 pb-3 last:border-0 hover:bg-bg/10 rounded-xl px-1 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <DeleteContributionTypeButton id={type.id} label={type.label} onSuccess={() => mutateCT()} />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-ink">{type.label}</span>
                                            <span className="text-[8px] font-black text-secondary uppercase tracking-widest">{type.frequency}</span>
                                        </div>
                                    </div>
                                    <span className="font-black text-primary bg-primary/5 px-3 py-1.5 rounded-xl text-xs">
                                        {type.amount.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : contributionTypes ? (
                        <p className="text-sm text-ink-muted italic">Aucun type de cotisation défini.</p>
                    ) : (
                        <div className="h-20 flex items-center justify-center">
                            <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}
                </Card>

                <Card accent="secondary" className="border-t-4 border-t-secondary">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 pl-1">+ Créer une nouvelle activité</p>
                    <ContributionTypeForm onSuccess={() => mutateCT()} />
                </Card>
            </section>

            {/* Section Caisses */}
            <section className="space-y-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    Fonds &amp; Caisses
                </h2>
                <Card>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-4 pl-1">Caisses actives</p>
                    {fundTypes && fundTypes.length > 0 ? (
                        <ul className="space-y-3 text-sm">
                            {fundTypes.map((fund) => (
                                <li key={fund.id} className="flex justify-between items-center border-b border-border/30 pb-3 last:border-0 hover:bg-bg/10 transition-colors px-1 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <DeleteFundTypeButton id={fund.id} label={fund.label} onSuccess={() => mutateFT()} />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-ink">{fund.label}</span>
                                            {fund.target_amount && (
                                                <span className="text-[9px] text-ink-muted uppercase font-bold">Objectif: {fund.target_amount.toLocaleString('fr-FR')} FCFA</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-primary bg-primary/10 px-3 py-2 rounded-xl block text-xs">
                                            {fund.current_balance?.toLocaleString('fr-FR') ?? '0'} FCFA
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : fundTypes ? (
                        <p className="text-sm text-ink-muted italic">Aucune caisse définie.</p>
                    ) : (
                        <div className="h-20 flex items-center justify-center">
                            <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}
                </Card>

                <Card accent="primary" className="border-t-4 border-t-primary">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 pl-1">+ Ouvrir un nouveau fonds</p>
                    <FundTypeForm onSuccess={() => mutateFT()} />
                </Card>
            </section>
        </div>
    );
}
