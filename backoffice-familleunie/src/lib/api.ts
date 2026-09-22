/**
 * API Service — Back-office Famille Unie
 * Consomme la même API Laravel que l'app membres (Sanctum, Bearer token).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Token storage ────────────────────────────────────────────────────────
const TOKEN_KEY = 'bo_api_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Erreur typée (statut HTTP propagé) ──────────────────────────────────
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ─── Base fetch helper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { message?: string }).message ??
      Object.values((body as { errors?: Record<string, string[]> }).errors ?? {})
        .flat()
        .join(' ') ??
      `Erreur ${res.status}`;
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types communs ─────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  username?: string | null;
  phone: string | null;
  roles: string[];
  avatar_url?: string | null;
  avatar_full_url?: string | null;
  must_change_password?: boolean;
}
export interface AuthResponse { user: AuthUser; token: string }

export interface Member { id: number; full_name: string; email: string; username?: string | null; phone: string | null; roles: string[] }
export interface Cycle { id: number; label: string; start_date: string; end_date: string | null; is_active: boolean }
export interface Meeting { id: number; cycle_id: number; meeting_date: string; notes: string | null; cycle?: { label: string } }
export interface ContributionType { id: number; label: string; amount: number; frequency: string; has_parts: boolean; is_mandatory: boolean; is_active: boolean }
export interface FundType { id: number; label: string; target_amount: number | null; is_active: boolean }
export interface MemberContribution { id: number; user_id: number; contribution_type_id: number; meeting_id: number; parts: number; unit_amount: number; total_amount: number; paid_at: string; user?: { full_name: string }; contribution_type?: { label: string }; meeting?: { meeting_date: string } }
export interface FundEntry { id: number; fund_type_id: number; member_id: number | null; amount: number; direction: 'in' | 'out'; note: string | null; created_at: string; fund_type?: { label: string }; member?: { full_name: string } }
export interface EventType { id: number; label: string; default_amount: number }
export interface ApiEvent { id: number; member_id: number; event_type_id: number; occurred_on: string; custom_amount: number | null; status: string; note: string | null; member?: { full_name: string }; event_type?: { label: string; default_amount: number } }
export interface Sanction { id: number; user_id: number; meeting_id: number | null; label: string; amount: number; status: 'pending' | 'paid'; paid_at: string | null; user?: { full_name: string }; meeting?: { meeting_date: string } }
export interface Loan { id: number; user_id: number; amount: number; interest: number; due_date: string; status: 'pending' | 'paid' | 'overdue'; is_overdue: boolean; paid_at: string | null; user?: { full_name: string } }
export interface TontinePayout { id: number; beneficiary_id: number; meeting_id: number; amount: number; status: string; created_at: string; beneficiary?: { full_name: string }; meeting?: { meeting_date: string }; contribution_type?: { label: string } }
export interface DashboardStats { tontine_balance: number; events_balance: number; members_count: number }
export interface Subscription { id: number; user_id: number; contribution_type_id: number; parts: number; is_active: boolean; suspension_reason: string | null; contribution_type?: ContributionType }
export interface YearlyReport {
  year: string;
  summary: {
    total_contributions: number;
    total_fund_in: number;
    total_fund_out: number;
    total_payouts: number;
    total_sanctions: number;
    loans_disbursed: number;
    loans_repaid: number;
    total_interests: number;
  };
  net_cash_flow: number;
}
export interface AssociationConfigItem { id: number; key: string; value: string | null; type: string; group: string; label: string | null }

// ─── Auth ────────────────────────────────────────────────────────────────
export async function login(data: { login: string; password: string }): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/api/login', { method: 'POST', body: JSON.stringify(data) });
  setToken(res.token);
  return res;
}
export async function logout(): Promise<void> {
  try { await apiFetch('/api/logout', { method: 'POST' }); } finally { removeToken(); }
}
export const getMe = () => apiFetch<AuthUser>('/api/me');
export const changePassword = (data: { password: string; password_confirmation: string }) =>
  apiFetch<{ user: AuthUser }>('/api/profile/change-password', { method: 'POST', body: JSON.stringify(data) });

// ─── Membres ────────────────────────────────────────────────────────────
export const getMembers = () => apiFetch<Member[]>('/api/members');
export const createMember = (data: { full_name: string; email: string; username?: string; phone?: string; roles: string[] }) =>
  apiFetch<{ message: string; temporary_password: string; user: AuthUser }>('/api/admin/members', { method: 'POST', body: JSON.stringify(data) });
export const updateMemberRoles = (id: number, roles: string[]) =>
  apiFetch(`/api/admin/members/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ roles }) });
export const getMemberSubscriptions = (id: number) => apiFetch<Subscription[]>(`/api/members/${id}/subscriptions`);
export const updateMemberSubscriptions = (id: number, subscriptions: unknown[]) =>
  apiFetch(`/api/members/${id}/subscriptions`, { method: 'POST', body: JSON.stringify({ subscriptions }) });

// ─── Cycles & réunions ────────────────────────────────────────────────────
export const getCycles = () => apiFetch<Cycle[]>('/api/cycles');
export const postCycle = (data: { label: string; start_date: string; end_date?: string | null }) =>
  apiFetch<Cycle>('/api/cycles', { method: 'POST', body: JSON.stringify(data) });
export const getMeetings = () => apiFetch<Meeting[]>('/api/meetings');
export const postMeeting = (data: { cycle_id: number; meeting_date: string; notes?: string }) =>
  apiFetch<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) });

// ─── Cotisations & caisses ─────────────────────────────────────────────────
export interface MeetingContributionSummary { meeting_id: number; total_amount: number; members_count: number; meeting?: { id: number; meeting_date: string } }
export const getContributionsSummary = () => apiFetch<MeetingContributionSummary[]>('/api/contributions/summary');
export const postContribution = (data: { user_id: number; contribution_type_id: number; meeting_id: number; parts: number }) =>
  apiFetch<MemberContribution>('/api/contributions', { method: 'POST', body: JSON.stringify(data) });
export const postFundEntry = (data: { fund_type_id: number; member_id?: number | null; amount: number; direction?: 'in' | 'out'; note?: string }) =>
  apiFetch('/api/fund-entries', { method: 'POST', body: JSON.stringify(data) });
// Pas d'endpoint pour lister TOUS les mouvements de caisse (seulement /funds/me, propre à l'utilisateur connecté) — voir evolution.md

// ─── Sanctions ─────────────────────────────────────────────────────────────
export const getSanctions = () => apiFetch<Sanction[]>('/api/sanctions');
export const postSanction = (data: { user_id: number; meeting_id?: number; label: string; amount: number }) =>
  apiFetch<Sanction>('/api/sanctions', { method: 'POST', body: JSON.stringify(data) });
export const paySanction = (id: number) => apiFetch<Sanction>(`/api/sanctions/${id}/pay`, { method: 'PATCH' });

// ─── Prêts ──────────────────────────────────────────────────────────────
export const getLoans = () => apiFetch<Loan[]>('/api/loans');
export const postLoan = (data: { user_id: number; amount: number; interest?: number; due_date: string }) =>
  apiFetch<Loan>('/api/loans', { method: 'POST', body: JSON.stringify(data) });
export const payLoan = (id: number) => apiFetch<Loan>(`/api/loans/${id}/pay`, { method: 'PATCH' });

// ─── Événements ────────────────────────────────────────────────────────────
export const getEventTypes = () => apiFetch<EventType[]>('/api/event-types');
export const getEvents = () => apiFetch<ApiEvent[]>('/api/events');
export const postEvent = (data: { event_type_id: number; occurred_on: string; custom_amount?: number; note?: string; member_id?: number }) =>
  apiFetch<ApiEvent>('/api/events', { method: 'POST', body: JSON.stringify(data) });

// ─── Tontine / Payouts ─────────────────────────────────────────────────────
export const getPayouts = () => apiFetch<TontinePayout[]>('/api/payouts');
export const postPayout = (data: { beneficiary_id: number; meeting_id: number; contribution_type_id: number; amount: number }) =>
  apiFetch<TontinePayout>('/api/payouts', { method: 'POST', body: JSON.stringify(data) });
export const markPayoutPaid = (id: number) => apiFetch(`/api/payouts/${id}/mark-paid`, { method: 'PATCH' });

// ─── Admin ───────────────────────────────────────────────────────────────
export const getDashboardStats = () => apiFetch<DashboardStats>('/api/admin/dashboard');
export const getContributionTypes = () => apiFetch<ContributionType[]>('/api/admin/contribution-types');
export const postContributionType = (data: { label: string; amount: number; frequency?: string; has_parts?: boolean; is_mandatory?: boolean }) =>
  apiFetch<ContributionType>('/api/admin/contribution-types', { method: 'POST', body: JSON.stringify(data) });
export const deleteContributionType = (id: number) =>
  apiFetch<{ message: string }>(`/api/admin/contribution-types/${id}`, { method: 'DELETE' });
export const getFundTypes = () => apiFetch<FundType[]>('/api/admin/fund-types');
export const postFundType = (data: { label: string; target_amount?: number }) =>
  apiFetch<FundType>('/api/admin/fund-types', { method: 'POST', body: JSON.stringify(data) });
export const deleteFundType = (id: number) => apiFetch<{ message: string }>(`/api/admin/fund-types/${id}`, { method: 'DELETE' });

// ─── Rapports ────────────────────────────────────────────────────────────
export const getYearlyReport = (year?: string) => apiFetch<YearlyReport>(`/api/reports/yearly${year ? `?year=${year}` : ''}`);

// ─── Configs association ───────────────────────────────────────────────────
export const getAdminConfigs = () => apiFetch<AssociationConfigItem[]>('/api/admin/configs');
export const postAdminConfig = (data: { key: string; value: string; type?: string; group?: string; label?: string }) =>
  apiFetch('/api/admin/configs', { method: 'POST', body: JSON.stringify(data) });
