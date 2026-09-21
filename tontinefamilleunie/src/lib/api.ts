/**
 * API Service — Tontine Famille Unie
 * Connects the frontend to the Laravel backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Token storage (localStorage + cookie for SSR) ───────────────────────────
export const getToken = (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('api_token') : null;

export const setToken = (token: string): void => {
    localStorage.setItem('api_token', token);
    // Also set as cookie so Next.js server pages can read it via cookies()
    document.cookie = `api_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const removeToken = (): void => {
    localStorage.removeItem('api_token');
    document.cookie = 'api_token=; path=/; max-age=0';
};

// ─── Base fetch helper ───────────────────────────────────────────────────────
async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
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
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────
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

export interface AuthResponse {
    user: AuthUser;
    token: string;
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────
export async function register(data: {
    full_name: string;
    email: string;
    username?: string;
    phone?: string;
    password: string;
    password_confirmation: string;
}): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
}

export async function login(data: {
    login: string;
    password: string;
}): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
}

export async function logout(): Promise<void> {
    await apiFetch('/api/logout', { method: 'POST' });
    removeToken();
}

export async function changePassword(data: { password: string; password_confirmation: string }): Promise<{ user: AuthUser }> {
    return apiFetch('/api/profile/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>('/api/me');
}

export async function updateProfile(data: { full_name?: string; phone?: string }): Promise<{ user: AuthUser }> {
    return apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Member { id: number; full_name: string; email: string; username?: string | null; phone: string | null; roles: string[] }
export interface Cycle { id: number; label: string; start_date: string; end_date: string | null; is_active: boolean }
export interface Meeting { id: number; cycle_id: number; meeting_date: string; notes: string | null; cycle?: { label: string } }
export interface ContributionType { id: number; label: string; amount: number; frequency: string; has_parts: boolean; is_mandatory: boolean; is_active: boolean }
export interface FundType { id: number; label: string; target_amount: number | null; is_active: boolean; current_balance?: number }
export interface MemberContribution { id: number; user_id: number; contribution_type_id: number; meeting_id: number; parts: number; unit_amount: number; total_amount: number; paid_at: string; contribution_type?: { label: string }; meeting?: { meeting_date: string } }
export interface FundEntry { id: number; fund_type_id: number; member_id: number; amount: number; direction: string; created_at: string; fund_type?: { label: string }; meeting?: { meeting_date: string } }
export interface EventType { id: number; label: string; default_amount: number }
export interface ApiEvent { id: number; member_id: number; event_type_id: number; occurred_on: string; custom_amount: number | null; status: string; note: string | null; member?: { full_name: string }; event_type?: { label: string; default_amount: number } }

export interface Sanction {
    id: number;
    user_id: number;
    meeting_id: number | null;
    label: string;
    amount: number;
    status: 'pending' | 'paid';
    paid_at: string | null;
    user?: { full_name: string };
    meeting?: { meeting_date: string };
}

export interface Loan {
    id: number;
    user_id: number;
    amount: number;
    interest: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    is_overdue: boolean;
    paid_at: string | null;
    user?: { full_name: string };
}

export interface MemberReportStats {
    contributions_total: number;
    sanctions_paid: number;
    sanctions_pending: number;
    sanctions_list: Sanction[];
    payouts_received: number;
    active_loans_count: number;
    active_loans_amount: number;
    active_loans_list: Loan[];
    funds: {
        fund_type_id: number;
        label: string;
        balance: number;
        target: number;
        percentage: number | null;
        is_completed: boolean;
    }[];
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export interface MemberReport {
    member: string;
    year: string;
    stats: MemberReportStats;
}

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
export interface TontinePayout { id: number; beneficiary_id: number; meeting_id: number; amount: number; status: string; created_at: string; beneficiary?: { full_name: string }; meeting?: { meeting_date: string }; contribution_type?: { label: string } }
export interface DashboardStats { tontine_balance: number; events_balance: number; members_count: number }
export interface Subscription { id: number; user_id: number; contribution_type_id: number; parts: number; is_active: boolean; suspension_reason: string | null; contribution_type?: ContributionType }

// ─── Members ─────────────────────────────────────────────────────────────────
export const getMembers = () => apiFetch<Member[]>('/api/members');
export const getMemberSubscriptions = (id: number) => apiFetch<Subscription[]>(`/api/members/${id}/subscriptions`);
export const updateMemberSubscriptions = (id: number, subscriptions: any[]) => apiFetch(`/api/members/${id}/subscriptions`, { method: 'POST', body: JSON.stringify({ subscriptions }) });
export interface Failure { member_id: number; full_name: string; parts: number; amount: number }
export interface SessionReportType { contribution_type_id: number; label: string; failures: Failure[]; total_missing: number }
export interface SessionReport { meeting: Meeting; report: SessionReportType[]; grand_total_missing: number }

// ─── Meetings & Cycles ───────────────────────────────────────────────────────
export const getCycles = () => apiFetch<Cycle[]>('/api/cycles');
export const postCycle = (data: { label: string; start_date: string; end_date?: string | null }) =>
    apiFetch<Cycle>('/api/cycles', { method: 'POST', body: JSON.stringify(data) });
export const updateCycle = (id: number, data: { label?: string; start_date?: string; end_date?: string | null; is_active?: boolean }) =>
    apiFetch<Cycle>(`/api/cycles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const getMeetings = () => apiFetch<Meeting[]>('/api/meetings');
export const postMeeting = (data: { cycle_id: number; meeting_date: string; notes?: string }) =>
    apiFetch<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) });
export const deleteMeeting = (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/meetings/${id}`, { method: 'DELETE' });

// ─── Contributions ───────────────────────────────────────────────────────────
export const getMyContributions = (params?: { filter?: string; page?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiFetch<PaginatedResponse<MemberContribution>>(`/api/contributions/me${query}`);
};
export const getMyFunds = (params?: { filter?: string; page?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiFetch<PaginatedResponse<FundEntry>>(`/api/funds/me${query}`);
};
export const getMeetingReport = (id: number) => apiFetch<{ meeting: Meeting, report: any[] }>(`/api/contributions/report/${id}`);
export const getFinancialReportMeetings = () => apiFetch<{ id: number, meeting_date: string }[]>('/api/financial-reports');
export const getFinancialReport = (id: number) => apiFetch<{ meeting: any, report: any[], summary: any }>(`/api/financial-reports/${id}`);
export const postContribution = (data: { user_id: number; contribution_type_id: number; meeting_id: number; parts: number }) =>
    apiFetch<MemberContribution>('/api/contributions', { method: 'POST', body: JSON.stringify(data) });

// ─── Fund entries ─────────────────────────────────────────────────────────────
export const postFundEntry = (data: { fund_type_id: number; member_id?: number | null; amount: number; meeting_id?: number; direction?: 'in' | 'out'; note?: string }) =>
    apiFetch('/api/fund-entries', { method: 'POST', body: JSON.stringify(data) });

// ─── Sanctions ─────────────────────────────────────────────────────────────
export const getSanctions = (params?: { user_id?: number; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiFetch<Sanction[]>(`/api/sanctions${query}`);
};
export const postSanction = (data: { user_id: number; meeting_id?: number; label: string; amount: number }) =>
    apiFetch<Sanction>('/api/sanctions', { method: 'POST', body: JSON.stringify(data) });
export const paySanction = (id: number) =>
    apiFetch<Sanction>(`/api/sanctions/${id}/pay`, { method: 'PATCH' });

// ─── Loans ──────────────────────────────────────────────────────────────────
export const getLoans = (params?: { user_id?: number; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiFetch<Loan[]>(`/api/loans${query}`);
};
export const postLoan = (data: { user_id: number; amount: number; interest?: number; due_date: string }) =>
    apiFetch<Loan>('/api/loans', { method: 'POST', body: JSON.stringify(data) });
export const payLoan = (id: number) =>
    apiFetch<Loan>(`/api/loans/${id}/pay`, { method: 'PATCH' });

// ─── Reports ────────────────────────────────────────────────────────────────
export const getYearlyReport = (year?: string) =>
    apiFetch<YearlyReport>(`/api/reports/yearly${year ? `?year=${year}` : ''}`);

export const getMemberReport = (userId: number, year?: string) =>
    apiFetch<MemberReport>(`/api/reports/member/${userId}${year ? `?year=${year}` : ''}`);

export const getMyReport = (year?: string) =>
    apiFetch<MemberReport>(`/api/reports/me${year ? `?year=${year}` : ''}`);

// ─── Events ──────────────────────────────────────────────────────────────────
export const getEventTypes = () => apiFetch<EventType[]>('/api/event-types');
export const getEvents = () => apiFetch<ApiEvent[]>('/api/events');
export const postEvent = (data: { event_type_id: number; occurred_on: string; custom_amount?: number; note?: string; member_id?: number }) =>
    apiFetch<ApiEvent>('/api/events', { method: 'POST', body: JSON.stringify(data) });
export const postEventContribution = (data: { event_id: number; amount: number; contributor_id?: number }) =>
    apiFetch('/api/event-contributions', { method: 'POST', body: JSON.stringify(data) });

// ─── Tontine / Payouts ───────────────────────────────────────────────────────
export const getPayouts = () => apiFetch<TontinePayout[]>('/api/payouts');
export const postPayout = (data: { beneficiary_id: number; meeting_id: number; contribution_type_id: number; amount: number }) =>
    apiFetch<TontinePayout>('/api/payouts', { method: 'POST', body: JSON.stringify(data) });
export const markPayoutPaid = (id: number) =>
    apiFetch(`/api/payouts/${id}/mark-paid`, { method: 'PATCH' });

// ─── Admin ───────────────────────────────────────────────────────────────────
export const getDashboardStats = () => apiFetch<DashboardStats>('/api/admin/dashboard');
export const getContributionTypes = () => apiFetch<ContributionType[]>('/api/admin/contribution-types');
export const postContributionType = (data: { label: string; amount: number; frequency?: string; has_parts?: boolean; is_mandatory?: boolean }) =>
    apiFetch<ContributionType>('/api/admin/contribution-types', { method: 'POST', body: JSON.stringify(data) });
export const deleteContributionType = (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/contribution-types/${id}`, { method: 'DELETE' });
export const getFundTypes = () => apiFetch<FundType[]>('/api/admin/fund-types');
export const postFundType = (data: { label: string; target_amount?: number }) =>
    apiFetch<FundType>('/api/admin/fund-types', { method: 'POST', body: JSON.stringify(data) });
export const deleteFundType = (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/fund-types/${id}`, { method: 'DELETE' });
export const updateMemberRoles = (id: number, roles: string[]) =>
    apiFetch(`/api/admin/members/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ roles }) });

export const createMember = (data: { full_name: string; email: string; username?: string; phone?: string; roles: string[] }) =>
    apiFetch<{ message: string; temporary_password: string; user: AuthUser }>('/api/admin/members', { method: 'POST', body: JSON.stringify(data) });

// ─── Attendance ──────────────────────────────────────────────────────────────
export const getMeetingAttendance = (meetingId: number) =>
    apiFetch<{ meeting: Meeting, threshold: number, attendance: { user_id: number, full_name: string, status: string, note: string | null, consecutive_absences: number }[] }>(`/api/meetings/${meetingId}/attendance`);

export const postMeetingAttendance = (meetingId: number, data: { user_id: number, status: string, note?: string }) =>
    apiFetch(`/api/meetings/${meetingId}/attendance`, { method: 'POST', body: JSON.stringify(data) });


// ─── Configs ─────────────────────────────────────────────────────────────────
export const getAdminConfigs = () => apiFetch<any[]>('/api/admin/configs');
export const postAdminConfig = (data: any) => apiFetch('/api/admin/configs', { method: 'POST', body: JSON.stringify(data) });

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadProfileAvatar = async (file: File): Promise<{ avatar_url: string; avatar_full_url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
    });
};
// v2: force recompile

