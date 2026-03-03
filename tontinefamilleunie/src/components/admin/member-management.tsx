'use client';

import { useState } from 'react';
import { Member, ContributionType } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionManager } from './subscription-manager';
import { Users, Settings2, ShieldCheck, Mail, Phone } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    members: Member[];
    contributionTypes: ContributionType[];
}

export function MemberManagement({ members, contributionTypes }: Props) {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Liste des membres actifs ({members.length})
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                    <div key={member.id} className="bg-white p-5 rounded-3xl border-2 border-border/30 hover:border-primary/40 transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                                    {member.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-ink uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {member.full_name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        {member.phone && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-ink-muted">
                                                <Phone className="h-3 w-3" /> {member.phone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-ink-muted">
                                            <Mail className="h-3 w-3" /> {member.email.split('@')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMember(member)}
                                className="h-10 w-10 p-0 rounded-xl border-border/40 hover:bg-primary hover:text-white hover:border-primary transition-all"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 relative z-10">
                            {member.roles.map(role => (
                                <span key={role} className="bg-bg px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter text-ink-muted border border-border/20">
                                    {role}
                                </span>
                            ))}
                        </div>

                        {/* Background Icon Decor */}
                        <ShieldCheck className="absolute -bottom-4 -right-4 h-20 w-20 text-bg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>

            {selectedMember && (
                <SubscriptionManager
                    memberId={selectedMember.id}
                    memberName={selectedMember.full_name}
                    contributionTypes={contributionTypes}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </div>
    );
}
