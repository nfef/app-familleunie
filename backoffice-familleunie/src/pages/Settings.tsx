import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import {
  getContributionTypes, postContributionType, deleteContributionType,
  getFundTypes, postFundType, deleteFundType,
  getEventTypes, postEventType, deleteEventType,
  getAdminConfigs, postAdminConfig,
  ApiError,
} from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, Th, TBody, Td, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { formatCFA } from '@/lib/utils';

const ctSchema = z.object({ label: z.string().min(1, 'Requis'), amount: z.coerce.number().min(1, 'Requis'), frequency: z.enum(['weekly', 'monthly']) });
type CtValues = z.infer<typeof ctSchema>;

const ftSchema = z.object({ label: z.string().min(1, 'Requis'), target_amount: z.coerce.number().optional() });
type FtValues = z.infer<typeof ftSchema>;

const etSchema = z.object({
  label: z.string().min(1, 'Requis'),
  category: z.enum(['heureux', 'malheureux']),
  amount_mode: z.enum(['per_member', 'envelope']),
  default_amount: z.coerce.number().min(0).optional(),
});
type EtValues = z.infer<typeof etSchema>;

function CategoryBadge({ category }: { category: 'heureux' | 'malheureux' | null }) {
  if (!category) return <span className="text-ink-light">—</span>;
  const isHeureux = category === 'heureux';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
      isHeureux ? 'bg-green-50 text-green-700' : 'bg-ink/5 text-ink-muted'
    }`}>
      {isHeureux ? 'Heureux' : 'Malheureux'}
    </span>
  );
}

const cfgSchema = z.object({ key: z.string().min(1, 'Requis'), value: z.string().min(1, 'Requis'), label: z.string().optional() });
type CfgValues = z.infer<typeof cfgSchema>;

function ContributionTypesSection() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['contribution-types'], queryFn: getContributionTypes });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CtValues>({ resolver: zodResolver(ctSchema), defaultValues: { frequency: 'weekly' } });

  const createMutation = useMutation({
    mutationFn: (data: CtValues) => postContributionType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contribution-types'] });
      toast.success('Type créé');
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContributionType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contribution-types'] });
      toast.success('Type supprimé');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Types de cotisation</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Ajouter</Button>
      </div>
      <Table>
        <THead><Th>Libellé</Th><Th>Montant</Th><Th>Fréquence</Th><Th></Th></THead>
        <TBody>
          {isLoading && <EmptyState label="Chargement…" />}
          {!isLoading && types?.length === 0 && <EmptyState label="Aucun type." />}
          {types?.map((t) => (
            <tr key={t.id} className="hover:bg-bg-input/60">
              <Td className="font-semibold">{t.label}</Td>
              <Td>{formatCFA(t.amount)}</Td>
              <Td>{t.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}</Td>
              <Td>
                <button onClick={() => deleteMutation.mutate(t.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nouveau type de cotisation">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Libellé</label>
            <Input {...register('label')} placeholder="Cotisation hebdomadaire" />
            {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Montant (FCFA)</label>
            <Input {...register('amount')} type="number" placeholder="1000" />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Fréquence</label>
            <select {...register('frequency')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">{createMutation.isPending ? 'Création…' : 'Créer'}</Button>
        </form>
      </Dialog>
    </Card>
  );
}

function FundTypesSection() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['fund-types'], queryFn: getFundTypes });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FtValues>({ resolver: zodResolver(ftSchema) });

  const createMutation = useMutation({
    mutationFn: (data: FtValues) => postFundType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-types'] });
      toast.success('Type créé');
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFundType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-types'] });
      toast.success('Type supprimé');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Types de caisse</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Ajouter</Button>
      </div>
      <Table>
        <THead><Th>Libellé</Th><Th>Objectif</Th><Th></Th></THead>
        <TBody>
          {isLoading && <EmptyState label="Chargement…" />}
          {!isLoading && types?.length === 0 && <EmptyState label="Aucun type." />}
          {types?.map((t) => (
            <tr key={t.id} className="hover:bg-bg-input/60">
              <Td className="font-semibold">{t.label}</Td>
              <Td>{t.target_amount ? formatCFA(t.target_amount) : '—'}</Td>
              <Td>
                <button onClick={() => deleteMutation.mutate(t.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nouveau type de caisse">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Libellé</label>
            <Input {...register('label')} placeholder="Assurance" />
            {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Objectif (FCFA, optionnel)</label>
            <Input {...register('target_amount')} type="number" placeholder="500000" />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">{createMutation.isPending ? 'Création…' : 'Créer'}</Button>
        </form>
      </Dialog>
    </Card>
  );
}

function EventTypesSection() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['event-types'], queryFn: getEventTypes });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EtValues>({
    resolver: zodResolver(etSchema),
    defaultValues: { category: 'heureux', amount_mode: 'per_member' },
  });
  const amountMode = watch('amount_mode');

  const createMutation = useMutation({
    mutationFn: (data: EtValues) => postEventType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
      toast.success('Type créé');
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEventType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
      toast.success('Type supprimé');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Types d'événements</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Ajouter</Button>
      </div>
      <Table>
        <THead><Th>Libellé</Th><Th>Catégorie</Th><Th>Mode</Th><Th>Montant</Th><Th>Part / membre</Th><Th></Th></THead>
        <TBody>
          {isLoading && <EmptyState label="Chargement…" />}
          {!isLoading && types?.length === 0 && <EmptyState label="Aucun type." />}
          {types?.map((t) => (
            <tr key={t.id} className="hover:bg-bg-input/60">
              <Td className="font-semibold">{t.label}</Td>
              <Td><CategoryBadge category={t.category} /></Td>
              <Td className="text-xs text-ink-muted">{t.amount_mode === 'envelope' ? 'Enveloppe' : 'Par membre'}</Td>
              <Td>{t.default_amount ? formatCFA(t.default_amount) : '—'}</Td>
              <Td>
                {t.amount_mode === 'envelope' ? (
                  <span className="font-semibold text-primary">{formatCFA(t.computed_share ?? 0)}</span>
                ) : (
                  '—'
                )}
              </Td>
              <Td>
                <button onClick={() => deleteMutation.mutate(t.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nouveau type d'événement">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Libellé</label>
            <Input {...register('label')} placeholder="Naissance" />
            {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Catégorie</label>
            <select {...register('category')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
              <option value="heureux">Heureux</option>
              <option value="malheureux">Malheureux</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Mode de calcul</label>
            <select {...register('amount_mode')} className="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm text-ink outline-none focus:border-primary">
              <option value="per_member">Montant fixe par membre</option>
              <option value="envelope">Enveloppe totale divisée par le nombre de membres</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">
              {amountMode === 'envelope' ? 'Montant total de l\'enveloppe (FCFA)' : 'Montant par membre (FCFA)'}
            </label>
            <Input {...register('default_amount')} type="number" placeholder={amountMode === 'envelope' ? '1000000' : '5000'} />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">{createMutation.isPending ? 'Création…' : 'Créer'}</Button>
        </form>
      </Dialog>
    </Card>
  );
}

function AssociationConfigSection() {
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useQuery({ queryKey: ['admin-configs'], queryFn: getAdminConfigs });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CfgValues>({ resolver: zodResolver(cfgSchema) });

  const mutation = useMutation({
    mutationFn: (data: CfgValues) => postAdminConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      toast.success('Configuration enregistrée');
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'),
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Configuration de l'association</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Ajouter</Button>
      </div>
      <Table>
        <THead><Th>Clé</Th><Th>Valeur</Th><Th>Libellé</Th></THead>
        <TBody>
          {isLoading && <EmptyState label="Chargement…" />}
          {!isLoading && configs?.length === 0 && <EmptyState label="Aucune configuration." />}
          {configs?.map((c) => (
            <tr key={c.id} className="hover:bg-bg-input/60">
              <Td className="font-mono text-xs">{c.key}</Td>
              <Td>{c.value ?? '—'}</Td>
              <Td>{c.label ?? '—'}</Td>
            </tr>
          ))}
        </TBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nouvelle configuration">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Clé</label>
            <Input {...register('key')} placeholder="taux_interet" />
            {errors.key && <p className="mt-1 text-xs text-red-500">{errors.key.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Valeur</label>
            <Input {...register('value')} placeholder="5" />
            {errors.value && <p className="mt-1 text-xs text-red-500">{errors.value.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Libellé (optionnel)</label>
            <Input {...register('label')} placeholder="Taux d'intérêt (%)" />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </form>
      </Dialog>
    </Card>
  );
}

export function Settings() {
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Types de cotisation, de caisse, et configuration générale" />
      <div className="space-y-6">
        <ContributionTypesSection />
        <FundTypesSection />
        <EventTypesSection />
        <AssociationConfigSection />
      </div>
    </div>
  );
}
