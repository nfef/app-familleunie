-- Utility
create or replace function public.current_member_id()
returns uuid language sql stable security definer as $$
  select id from public.members where user_id = auth.uid();
$$;

create or replace function public.ensure_role(target_role public.member_role)
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from public.member_roles
    where member_id = public.current_member_id()
      and role = target_role
  );
$$;

-- Balances RPC
create or replace function public.compute_member_balances(target_member uuid default null)
returns table(
  member_id uuid,
  tontine_balance numeric,
  funds_balance numeric,
  events_balance numeric
) language sql security definer as $$
  with contributions as (
    select member_id, sum(total_amount) as total
    from public.member_contributions
    where ($1 is null or member_id = $1)
    group by member_id
  ), payouts as (
    select beneficiary_id as member_id, sum(amount) as total
    from public.tontine_payouts
    where status = 'paid' and ($1 is null or beneficiary_id = $1)
    group by beneficiary_id
  ), funds as (
    select member_id, sum(amount) as total
    from public.fund_contributions
    where ($1 is null or member_id = $1)
    group by member_id
  ), event_paid as (
    select contributor_id as member_id, sum(amount) as total
    from public.event_contributions
    where ($1 is null or contributor_id = $1)
    group by contributor_id
  )
  select m.id,
    coalesce(c.total,0) - coalesce(p.total,0) as tontine_balance,
    coalesce(f.total,0) as funds_balance,
    -coalesce(e.total,0) as events_balance
  from public.members m
  left join contributions c on c.member_id = m.id
  left join payouts p on p.member_id = m.id
  left join funds f on f.member_id = m.id
  left join event_paid e on e.member_id = m.id
  where ($1 is null or m.id = $1);
$$;

-- Schedule payouts helper
create or replace function public.schedule_weekly_payouts(target_meeting uuid)
returns void language plpgsql security definer as $$
declare
  main_type uuid;
  oil_type uuid;
  main_amount numeric;
  oil_amount numeric;
  principal_beneficiaries uuid[];
  oil_beneficiary uuid;
begin
  select id, amount into main_type, main_amount from public.contribution_types where label='tontine_principale' limit 1;
  select id, amount into oil_type, oil_amount from public.contribution_types where label='tontine_huile_savon' limit 1;
  if main_type is null or oil_type is null then
    raise exception 'Contribution types missing';
  end if;

  principal_beneficiaries := array(
    select member_id from public.members order by random() limit 2
  );

  insert into public.tontine_payouts (contribution_type_id, meeting_id, beneficiary_id, amount)
  select main_type, target_meeting, b, main_amount from unnest(principal_beneficiaries) as b;

  select member_id into oil_beneficiary from public.members order by random() limit 1;
  insert into public.tontine_payouts (contribution_type_id, meeting_id, beneficiary_id, amount)
  values (oil_type, target_meeting, oil_beneficiary, oil_amount);
end;
$$;

create or replace function public.close_cycle(target_cycle uuid)
returns void language plpgsql security definer as $$
begin
  update public.cycles set status='closed'
  where id = target_cycle;
  update public.tontine_payouts set status='paid', paid_at = coalesce(paid_at, now())
  where meeting_id in (select id from public.meetings where cycle_id = target_cycle);
end;
$$;

create or replace function public.close_event(target_event uuid)
returns void language plpgsql security definer as $$
begin
  update public.events
  set status = 'closed',
      custom_amount = coalesce(custom_amount, 0)
  where id = target_event;
end;
$$;

create or replace view public.member_reporting as
select m.id as member_id,
       m.full_name,
       (select sum(total_amount) from public.member_contributions mc where mc.member_id = m.id) as total_contributed,
       (select count(*) from public.tontine_payouts tp where tp.beneficiary_id = m.id and tp.status='paid') as payouts_received,
       (select sum(amount) from public.event_contributions ec where ec.contributor_id = m.id) as events_paid
from public.members m;

create or replace view public.meeting_contribution_summary as
select meeting_id,
       sum(total_amount) as total_amount,
       count(distinct member_id) as members_count
from public.member_contributions
group by meeting_id;
