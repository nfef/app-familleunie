import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Copy, KeyRound, ShieldCheck, TriangleAlert, UserCog, UserPlus } from 'lucide-react';
import { createMember, getMembers, resetMemberPassword, updateMember, updateMemberRoles, updateMemberStatus, ApiError, type Member, type MemberStatus } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

const ALL_ROLES = [
  'MEMBRE', 'ADMIN', 'TRESORIER', 'COMMISSAIRE', 'SECRETAIRE', 'CENSEUR',
  'PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_ADJOINT', 'FONDATEUR',
];

const schema = z.object({
  full_name: z.string().min(3, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  username: z.string().trim().min(3, 'Au moins 3 caractères').optional().or(z.literal('')),
  phone: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const editSchema = z.object({
  full_name: z.string().min(3, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  username: z.string().trim().min(3, 'Au moins 3 caractères').optional().or(z.literal('')),
  phone: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {role}
    </span>
  );
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Actif',
  pause: 'En pause',
  exclu: 'Exclu',
  demissionnaire: 'Démissionnaire',
};

const STATUS_STYLES: Record<MemberStatus, string> = {
  active: 'bg-green-50 text-green-700',
  pause: 'bg-amber-50 text-amber-700',
  exclu: 'bg-red-50 text-red-600',
  demissionnaire: 'bg-ink/5 text-ink-muted',
};

function MemberStatusBadge({ status }: { status?: MemberStatus }) {
  const s = status ?? 'active';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s]}`}>
      {STATUS_LABELS[s]}
    </span>
  );
}

function CreateMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const [roles, setRoles] = useState<string[]>(['MEMBRE']);
  const [result, setResult] = useState<{ name: string; password: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Values) =>
      createMember({ ...data, username: data.username || undefined, roles }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setResult({ name: variables.full_name, password: res.temporary_password });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur lors de la création.'),
  });

  const handleClose = () => {
    reset();
    setRoles(['MEMBRE']);
    setResult(null);
    onClose();
  };

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const copyPassword = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.password);
    toast.success('Mot de passe copié');
  };

  return (
    <Dialog open={open} onClose={handleClose} title={result ? 'Membre créé' : 'Nouveau membre'}>
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
            <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>{result.name}</strong> a été créé avec succès.
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Mot de passe temporaire — à communiquer maintenant, non récupérable ensuite
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-input px-4 py-3">
              <code className="flex-1 text-sm font-semibold text-ink">{result.password}</code>
              <button onClick={copyPassword} className="text-ink-muted hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Button onClick={handleClose} className="w-full">Terminer</Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Nom complet</label>
            <Input {...register('full_name')} placeholder="Jean Dupont" />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
              <Input {...register('email')} type="email" placeholder="jean@exemple.com" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Login (optionnel)</label>
              <Input {...register('username')} placeholder="jean" />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Téléphone (optionnel)</label>
            <Input {...register('phone')} placeholder="+225 00 00 00 00" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Rôles</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    roles.includes(role)
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-ink-muted hover:border-primary/40'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Création…' : 'Créer le membre'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}

function RolesDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<string[]>(member?.roles ?? []);

  const mutation = useMutation({
    mutationFn: () => updateMemberRoles(member!.id, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Rôles mis à jour');
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  if (!member) return null;

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  return (
    <Dialog open={!!member} onClose={onClose} title={`Rôles — ${member.full_name}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                roles.includes(role)
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-ink-muted hover:border-primary/40'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || roles.length === 0} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </Dialog>
  );
}

function EditMemberDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const mutation = useMutation({
    mutationFn: (data: EditValues) => updateMember(member!.id, { ...data, username: data.username || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Informations mises à jour');
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  if (!member) return null;

  return (
    <Dialog
      open={!!member}
      onClose={onClose}
      title={`Modifier — ${member.full_name}`}
    >
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Nom complet</label>
          <Input {...register('full_name')} defaultValue={member.full_name} placeholder="Jean Dupont" />
          {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
            <Input {...register('email')} defaultValue={member.email} type="email" placeholder="jean@exemple.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Login (optionnel)</label>
            <Input {...register('username')} defaultValue={member.username ?? ''} placeholder="jean" />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Téléphone (optionnel)</label>
          <Input {...register('phone')} defaultValue={member.phone ?? ''} placeholder="+225 00 00 00 00" />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resetMemberPassword(member!.id),
    onSuccess: (res) => setResult(res.temporary_password),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const copyPassword = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success('Mot de passe copié');
  };

  if (!member) return null;

  return (
    <Dialog open={!!member} onClose={handleClose} title={result ? 'Mot de passe réinitialisé' : 'Réinitialiser le mot de passe'}>
      {result ? (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Nouveau mot de passe temporaire — à communiquer maintenant, non récupérable ensuite
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-input px-4 py-3">
              <code className="flex-1 text-sm font-semibold text-ink">{result}</code>
              <button onClick={copyPassword} className="text-ink-muted hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Button onClick={handleClose} className="w-full">Terminer</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
            <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Un nouveau mot de passe temporaire sera généré pour <strong>{member.full_name}</strong>, et
              ses sessions actives seront déconnectées. À sa prochaine connexion, il devra en définir un
              nouveau avant de pouvoir continuer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} className="flex-1">Annuler</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Réinitialisation…' : 'Confirmer'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function StatusDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<MemberStatus>(member?.member_status ?? 'active');
  const [note, setNote] = useState(member?.status_note ?? '');

  const mutation = useMutation({
    mutationFn: () => updateMemberStatus(member!.id, { member_status: status, status_note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Statut mis à jour');
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  if (!member) return null;

  return (
    <Dialog open={!!member} onClose={onClose} title={`Statut — ${member.full_name}`}>
      <div className="space-y-4">
        {status !== 'active' && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Un membre non actif n'est plus compté dans le calcul des enveloppes (mariage, décès…) réparties par membre.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as MemberStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                status === s ? 'border-primary bg-primary text-white' : 'border-border text-ink-muted hover:border-primary/40'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Note (optionnel)</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Raison, date de départ…" />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </Dialog>
  );
}

export function Members() {
  const { data: members, isLoading } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<Member | null>(null);
  const [editingInfo, setEditingInfo] = useState<Member | null>(null);
  const [resettingPassword, setResettingPassword] = useState<Member | null>(null);
  const [editingStatus, setEditingStatus] = useState<Member | null>(null);

  return (
    <div>
      <PageHeader
        title="Membres"
        subtitle={members ? `${members.length} membre(s)` : undefined}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Nouveau membre
          </Button>
        }
      />

      <Card className="p-0">
        <Table>
          <THead>
            <Th>Nom</Th>
            <Th>Email / Login</Th>
            <Th>Téléphone</Th>
            <Th>Statut</Th>
            <Th>Rôles</Th>
            <Th></Th>
          </THead>
          <TBody>
            {isLoading && <EmptyState label="Chargement…" />}
            {!isLoading && members?.length === 0 && <EmptyState label="Aucun membre." />}
            {members?.map((m) => (
              <tr key={m.id} className="hover:bg-bg-input/60">
                <Td className="font-semibold">{m.full_name}</Td>
                <Td>
                  <div>{m.email}</div>
                  {m.username && <div className="text-xs text-ink-muted">@{m.username}</div>}
                </Td>
                <Td>{m.phone ?? '—'}</Td>
                <Td><MemberStatusBadge status={m.member_status} /></Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {m.roles.map((r) => <RoleBadge key={r} role={r} />)}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setEditingInfo(m)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Infos
                    </button>
                    <button
                      onClick={() => setEditingRoles(m)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Rôles
                    </button>
                    <button
                      onClick={() => setEditingStatus(m)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <UserCog className="h-3 w-3" />
                      Statut
                    </button>
                    <button
                      onClick={() => setResettingPassword(m)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <KeyRound className="h-3 w-3" />
                      Mot de passe
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <CreateMemberDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditMemberDialog key={`edit-${editingInfo?.id ?? 'none'}`} member={editingInfo} onClose={() => setEditingInfo(null)} />
      <RolesDialog key={`roles-${editingRoles?.id ?? 'none'}`} member={editingRoles} onClose={() => setEditingRoles(null)} />
      <ResetPasswordDialog member={resettingPassword} onClose={() => setResettingPassword(null)} />
      <StatusDialog key={`status-${editingStatus?.id ?? 'none'}`} member={editingStatus} onClose={() => setEditingStatus(null)} />
    </div>
  );
}
