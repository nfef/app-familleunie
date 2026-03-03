import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireSession, serverFetch } from '@/lib/auth';
import { EventForm } from '@/components/events/event-form';
import { EventContributionForm } from '@/components/events/event-contribution-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const metadata = { title: 'Événements | Famille Unie' };

interface Member { id: number; full_name: string }
interface EventType { id: number; label: string; default_amount: number }
interface ApiEvent { id: number; occurred_on: string; status: string; custom_amount?: number | null; event_type?: { label: string; default_amount?: number } | null; member?: { full_name: string } | null }

export default async function EventsPage() {
  const { roles, token } = await requireSession();

  const [events, members, eventTypes] = await Promise.all([
    serverFetch<ApiEvent[]>('/api/events', token),
    serverFetch<Member[]>('/api/members', token),
    serverFetch<EventType[]>('/api/event-types', token),
  ]);

  const canManage = roles.some((role) => ['ADMIN', 'TRESORIER'].includes(role));

  return (
    <AppShell title="Événements" roles={roles}>
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Historique des événements</p>
        {events && events.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm">
            {events.map((event) => (
              <li key={event.id} className="rounded-2xl border border-border/40 bg-bg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink">{event.event_type?.label}</p>
                    <p className="text-xs font-medium text-ink-muted">
                      {event.member?.full_name} — {format(new Date(event.occurred_on), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-secondary">
                    {event.status}
                  </span>
                </div>
                <p className="mt-2 text-right text-lg font-extrabold text-primary">
                  {(event.custom_amount ?? event.event_type?.default_amount ?? 0).toLocaleString('fr-FR')} FCFA
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted italic">Aucun événement enregistré.</p>
        )}
      </Card>

      {canManage && (
        <div className="mt-8 space-y-6 pb-20">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Créer un événement</p>
            <div className="mt-4">
              <EventForm
                members={(members ?? []).map((m) => ({ id: String(m.id), label: m.full_name }))}
                eventTypes={(eventTypes ?? []).map((type) => ({ id: String(type.id), label: type.label }))}
              />
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Contribution exceptionnelle</p>
            <div className="mt-4">
              <EventContributionForm
                events={(events ?? []).map((event) => ({
                  id: String(event.id),
                  label: `${event.event_type?.label} - ${event.member?.full_name}`,
                }))}
                members={(members ?? []).map((m) => ({ id: String(m.id), label: m.full_name }))}
              />
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
