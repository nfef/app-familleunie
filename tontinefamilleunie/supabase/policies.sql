-- Enable row level security
alter table public.members enable row level security;
alter table public.member_roles enable row level security;
alter table public.fund_types enable row level security;
alter table public.cycles enable row level security;
alter table public.meetings enable row level security;
alter table public.contribution_types enable row level security;
alter table public.member_contributions enable row level security;
alter table public.fund_contributions enable row level security;
alter table public.tontine_payouts enable row level security;
alter table public.events enable row level security;
alter table public.event_contributions enable row level security;
alter table public.member_balances enable row level security;

create or replace view public.current_member as
select m.* from public.members m
where m.user_id = auth.uid();

-- Members table policies
create policy if not exists "read own profile" on public.members
  for select using (id = (select id from public.current_member));
create policy if not exists "update own profile" on public.members
  for update using (id = (select id from public.current_member))
  with check (id = (select id from public.current_member));
create policy if not exists "self register member" on public.members
  for insert with check (user_id = auth.uid());
create policy if not exists "admin manage members" on public.members
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

-- Member roles accessible only to admins
create policy if not exists "admin manage roles" on public.member_roles
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

-- Reference tables read-only for authenticated users
create policy if not exists "read fund types" on public.fund_types for select using (auth.role() = 'authenticated');
create policy if not exists "admin manage fund types" on public.fund_types
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

create policy if not exists "read cycles" on public.cycles for select using (auth.role() = 'authenticated');
create policy if not exists "admin manage cycles" on public.cycles
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

create policy if not exists "read meetings" on public.meetings for select using (auth.role() = 'authenticated');
create policy if not exists "tresorier manage meetings" on public.meetings
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));

create policy if not exists "read contribution types" on public.contribution_types for select using (auth.role() = 'authenticated');
create policy if not exists "admin manage contribution types" on public.contribution_types
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

-- Member contributions policies
create policy if not exists "member read own contributions" on public.member_contributions
  for select using (member_id = (select id from public.current_member) or exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER','COMMISSAIRE')));
create policy if not exists "tresorier insert contributions" on public.member_contributions
  for insert with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));
create policy if not exists "tresorier update contributions" on public.member_contributions
  for update using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));

-- Fund contributions
create policy if not exists "auditors read fund contributions" on public.fund_contributions
  for select using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER','COMMISSAIRE')));
create policy if not exists "tresorier insert fund contributions" on public.fund_contributions
  for insert with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));
create policy if not exists "tresorier update fund contributions" on public.fund_contributions
  for update using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));

-- Tontine payouts
create policy if not exists "members read payouts" on public.tontine_payouts
  for select using (auth.role() = 'authenticated');
create policy if not exists "tresorier manage payouts" on public.tontine_payouts
  using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')))
  with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));

-- Events + contributions
create policy if not exists "members read events" on public.events for select using (auth.role() = 'authenticated');
create policy if not exists "admin create events" on public.events for insert with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));
create policy if not exists "admin update events" on public.events for update using (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN')) with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role = 'ADMIN'));

create policy if not exists "members read event contributions" on public.event_contributions
  for select using (contributor_id = (select id from public.current_member) or exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));
create policy if not exists "admin insert event contributions" on public.event_contributions
  for insert with check (exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER')));

-- Member balances viewable per member
create policy if not exists "members read balances" on public.member_balances
  for select using (member_id = (select id from public.current_member) or exists(select 1 from public.member_roles mr where mr.member_id = (select id from public.current_member) and mr.role in ('ADMIN','TRESORIER','COMMISSAIRE')));
