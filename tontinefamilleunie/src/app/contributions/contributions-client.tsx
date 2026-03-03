'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ContributionForm } from '@/components/contributions/contribution-form';
import { FundForm } from '@/components/contributions/fund-form';
import { SessionReport } from '@/components/contributions/session-report';
import { MeetingManager } from '@/components/contributions/meeting-manager';
import { User, Users } from 'lucide-react';
import clsx from 'clsx';

type Option = { id: string; label: string };

interface Props {
    roles: string[];
    members: Option[];
    meetings: Option[];
    contributionTypes: (Option & { amount: number; has_parts: boolean; is_mandatory: boolean })[];
    fundTypes: Option[];
}

export function ContributionsClient({ roles, members, meetings, contributionTypes, fundTypes }: Props) {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const canRecordContributions = roles.some((role) => ['ADMIN', 'TRESORIER'].includes(role));
    const canRecordFunds = roles.some((role) => ['ADMIN', 'TRESORIER', 'COMMISSAIRE'].includes(role));

    return (
        <div className="space-y-6">
            {/* ── SESSION MANAGEMENT (ADMIN/TRESORIER ONLY) ── */}
            {canRecordContributions && <MeetingManager />}

            {/* ── CENTRAL MEMBER SELECTOR ── */}
            <Card className="border-b-4 border-b-primary shadow-lg overflow-visible">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-ink">Membre en Séance</h2>
                        <p className="text-[10px] font-bold text-ink-muted uppercase">Sélectionnez le membre à traiter</p>
                    </div>
                </div>

                <div className="relative">
                    <select
                        className={clsx(
                            "app-select pl-10 h-14 text-sm font-bold transition-all",
                            selectedMemberId ? "border-primary ring-2 ring-primary/10" : "border-border"
                        )}
                        value={selectedMemberId ?? ''}
                        onChange={(e) => setSelectedMemberId(e.target.value || null)}
                    >
                        <option value="">Saisie Collective / Aucun membre sélectionné</option>
                        {members.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <Users className={clsx(
                        "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                        selectedMemberId ? "text-primary" : "text-ink-muted/30"
                    )} />
                </div>

                {selectedMemberId && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setSelectedMemberId(null)}
                            className="text-[10px] font-black uppercase tracking-tighter text-primary hover:underline"
                        >
                            Réinitialiser pour saisie collective
                        </button>
                    </div>
                )}
            </Card>

            {/* ── FORMS ── */}
            <div className="grid grid-cols-1 gap-6">
                {canRecordContributions ? (
                    <Card>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Cotisations hebdomadaires
                        </p>
                        <ContributionForm
                            selectedMemberId={selectedMemberId}
                            meetings={meetings}
                            contributionTypes={contributionTypes}
                        />
                    </Card>
                ) : (
                    <Card>
                        <p className="text-sm text-ink-muted italic">Seuls les trésoriers peuvent enregistrer les cotisations.</p>
                    </Card>
                )}

                {canRecordFunds ? (
                    <Card>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Caisses &amp; fonds
                        </p>
                        <FundForm
                            members={members}
                            fundTypes={fundTypes}
                            selectedMemberId={selectedMemberId}
                        />
                    </Card>
                ) : (
                    <Card>
                        <p className="text-sm text-ink-muted italic">Accès requis: Trésorier ou Commissaire aux comptes.</p>
                    </Card>
                )}
            </div>

            {/* ── SESSION REPORT ── */}
            {(canRecordContributions || canRecordFunds) && (
                <SessionReport meetings={meetings} />
            )}
        </div>
    );
}
