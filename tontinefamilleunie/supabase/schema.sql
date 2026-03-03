-- Supabase schema for Tontine Famille Unie
-- Run with: supabase db push --file supabase/schema.sql

create extension if not exists "uuid-ossp";

create type public.member_role as enum ('ADMIN','TRESORIER','COMMISSAIRE','MEMBRE');

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique,
  phone text unique,
  avatar_url text,
  join_date date not null default now(),
  initial_payment numeric(12,2) not null default 10000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_roles (
  member_id uuid references public.members(id) on delete cascade,
  role public.member_role not null,
  assigned_at timestamptz not null default now(),
  primary key (member_id, role)
);

create table if not exists public.fund_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  description text,
  target_amount numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.fund_types (label, description, target_amount)
  values ('fonds_caisse','Fonds principal',100000)
  on conflict (label) do nothing;
insert into public.fund_types (label, description, target_amount)
  values ('caisse_assurance','Caisse assurance',100000)
  on conflict (label) do nothing;

create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('open','closed','archived')) default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  meeting_date date not null,
  week_number int,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.contribution_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  amount numeric(12,2) not null,
  frequency text not null check (frequency in ('weekly','monthly','event','one_time')) default 'weekly',
  ration numeric(12,2),
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

insert into public.contribution_types (label, amount, frequency, ration)
  values ('tontine_principale',20000,'weekly',2500)
  on conflict (label) do nothing;
insert into public.contribution_types (label, amount, frequency)
  values ('tontine_huile_savon',2000,'weekly')
  on conflict (label) do nothing;

create table if not exists public.member_contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contribution_type_id uuid not null references public.contribution_types(id),
  parts int not null default 1 check (parts > 0),
  unit_amount numeric(12,2) not null,
  total_amount numeric(12,2) generated always as (unit_amount * parts) stored,
  paid_at timestamptz not null default now(),
  status text not null check (status in ('pending','validated','rejected')) default 'validated',
  notes text,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now()
);

create table if not exists public.fund_contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id),
  fund_type_id uuid not null references public.fund_types(id),
  meeting_id uuid references public.meetings(id),
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now()
);

create table if not exists public.tontine_payouts (
  id uuid primary key default gen_random_uuid(),
  contribution_type_id uuid not null references public.contribution_types(id),
  meeting_id uuid not null references public.meetings(id),
  beneficiary_id uuid not null references public.members(id),
  amount numeric(12,2) not null,
  status text not null check (status in ('scheduled','paid','cancelled')) default 'scheduled',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  label text unique not null,
  category text not null check (category in ('heureux','malheureux')),
  default_amount numeric(12,2) not null,
  created_at timestamptz default now()
);

insert into public.event_types (label, category, default_amount)
  values ('mariage','heureux',1000000)
  on conflict (label) do nothing;
insert into public.event_types (label, category, default_amount)
  values ('deces_parent','malheureux',600000)
  on conflict (label) do nothing;
insert into public.event_types (label, category, default_amount)
  values ('naissance','heureux',10000)
  on conflict (label) do nothing;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.event_types(id),
  member_id uuid not null references public.members(id),
  occurred_on date not null,
  custom_amount numeric(12,2),
  status text not null check (status in ('open','closed')) default 'open',
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.event_contributions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  contributor_id uuid not null references public.members(id),
  amount numeric(12,2) not null,
  paid_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.member_balances (
  member_id uuid primary key references public.members(id) on delete cascade,
  tontine_balance numeric(12,2) not null default 0,
  funds_balance numeric(12,2) not null default 0,
  events_balance numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_member_contrib_member on public.member_contributions(member_id);
create index if not exists idx_member_contrib_meeting on public.member_contributions(meeting_id);
create index if not exists idx_fund_contrib_fund on public.fund_contributions(fund_type_id);
create index if not exists idx_tontine_payout_beneficiary on public.tontine_payouts(beneficiary_id);
create index if not exists idx_events_member on public.events(member_id);
create index if not exists idx_event_contrib_event on public.event_contributions(event_id);
