-- Private Telegram administration of the existing MANUAL subscription records.
-- No changes to StoreKit, RevenueCat, store_subscriptions, or app account RPCs.
begin;

create table if not exists public.telegram_system_audit (
  operation_id uuid primary key,
  actor_id bigint not null check (actor_id = 5549806778),
  target_user_id uuid not null,
  action text not null check (action in ('grant', 'expire')),
  before_state jsonb not null,
  after_state jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.telegram_system_rate_limits (
  bucket text primary key check (bucket in ('read', 'write')),
  window_start timestamptz not null,
  requests integer not null
);
alter table public.telegram_system_audit enable row level security;
alter table public.telegram_system_rate_limits enable row level security;
revoke all on public.telegram_system_audit, public.telegram_system_rate_limits from public, anon, authenticated, service_role;
grant select on public.telegram_system_audit, public.telegram_system_rate_limits to service_role;

create or replace view public.telegram_system_accounts as
select
  u.id as user_id, lower(trim(u.email)) as email,
  coalesce(nullif(trim(p.full_name), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)) as name,
  coalesce(p.activation_code, public.account_reference_code(coalesce(u.email, u.id::text))) as reference_code,
  coalesce(m.is_vip = true and m.vip_expires_at > now(), false) as manual_active,
  m.vip_expires_at as manual_expires_at,
  md5(coalesce(to_jsonb(m)::text, 'null')) as manual_revision
from auth.users u
left join public.profiles p on p.id = u.id
left join lateral (
  select s.* from public.user_subscriptions s
  where lower(trim(s.email)) = lower(trim(u.email))
  order by coalesce(s.is_vip and s.vip_expires_at > now(), false) desc,
    s.vip_expires_at desc nulls last, s.updated_at desc nulls last, s.id
  limit 1
) m on true
where u.email is not null and u.deleted_at is null
  and not exists (select 1 from public.deleted_accounts d where lower(trim(d.email)) = lower(trim(u.email)));
revoke all on public.telegram_system_accounts from public, anon, authenticated;
grant select on public.telegram_system_accounts to service_role;

create or replace function public.telegram_system_rate_limit(p_actor_id bigint, p_bucket text)
returns void language plpgsql volatile security definer set search_path = '' as $function$
declare
  used integer;
  budget integer;
  started timestamptz := date_trunc('minute', clock_timestamp());
begin
  if p_actor_id is distinct from 5549806778::bigint then raise sqlstate 'PT403' using message = 'OWNER_ONLY'; end if;
  if p_bucket not in ('read', 'write') or p_bucket is null then raise sqlstate 'PT400' using message = 'INVALID_BUCKET'; end if;
  budget := case p_bucket when 'write' then 15 else 90 end;
  insert into public.telegram_system_rate_limits as existing (bucket, window_start, requests)
    values (p_bucket, started, 1)
    on conflict (bucket) do update set window_start = started,
      requests = case when existing.window_start = started then existing.requests + 1 else 1 end
    returning requests into used;
  if used > budget then raise sqlstate 'PT429' using message = 'RATE_LIMITED'; end if;
end;
$function$;

create or replace function public.telegram_system_member(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $function$
  select to_jsonb(a) from public.telegram_system_accounts a where a.user_id = p_user_id;
$function$;

create or replace function public.telegram_system_lookup(p_reference text)
returns jsonb language plpgsql stable security definer set search_path = '' as $function$
declare
  matches integer;
  member jsonb;
begin
  if length(p_reference) not between 4 and 40 then raise sqlstate 'PT400' using message = 'INVALID_REFERENCE'; end if;
  select count(*), (jsonb_agg(to_jsonb(a)))->0 into matches, member
    from public.telegram_system_accounts a where upper(trim(a.reference_code)) = upper(trim(p_reference));
  if matches > 1 then raise sqlstate 'PT409' using message = 'AMBIGUOUS_REFERENCE'; end if;
  return member;
end;
$function$;

create or replace function public.telegram_system_members(p_search text default '', p_after uuid default null, p_limit integer default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $function$
declare
  result jsonb;
begin
  if p_limit not between 1 and 100 or p_limit is null or length(coalesce(p_search, '')) > 120 then
    raise sqlstate 'PT400' using message = 'INVALID_PAGE';
  end if;
  with active as materialized (
    select a.* from public.telegram_system_accounts a where a.manual_active
  ), page as materialized (
    select a.* from active a
    where (p_after is null or a.user_id > p_after)
      and (coalesce(trim(p_search), '') = '' or position(lower(trim(p_search)) in lower(a.email || ' ' || a.name || ' ' || a.reference_code)) > 0)
    order by a.user_id limit p_limit + 1
  ), visible as (
    select * from page order by user_id limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(v) order by v.user_id) from visible v), '[]'::jsonb),
    'nextCursor', case when (select count(*) from page) > p_limit then (select user_id from visible order by user_id desc limit 1) else null end,
    'stats', jsonb_build_object(
      'active', (select count(*) from active),
      'expiringSoon', (select count(*) from active where manual_expires_at <= now() + interval '7 days')
    )
  ) into result;
  return result;
end;
$function$;

create or replace function public.telegram_system_change_membership(
  p_actor_id bigint, p_action text, p_user_id uuid, p_operation_id uuid, p_expected_revision text
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $function$
declare
  actor_email text;
  current_record public.user_subscriptions%rowtype;
  member jsonb;
  before_state jsonb;
  after_state jsonb;
  previous public.telegram_system_audit%rowtype;
  result jsonb;
  matches integer;
  expires timestamptz;
  changed_at timestamptz;
begin
  if p_actor_id is distinct from 5549806778::bigint then raise sqlstate 'PT403' using message = 'OWNER_ONLY'; end if;
  if p_action is null or p_action not in ('grant', 'expire') or p_operation_id is null or p_user_id is null or p_expected_revision is null then
    raise sqlstate 'PT400' using message = 'INVALID_CHANGE';
  end if;

  -- Lock the account even when no subscription row exists. Simultaneous grants
  -- and expiration requests for one account are serialized in the database.
  select lower(trim(u.email)) into actor_email from auth.users u where u.id = p_user_id and u.deleted_at is null for update;
  if actor_email is null or exists (select 1 from public.deleted_accounts d where lower(trim(d.email)) = actor_email) then
    raise sqlstate 'PT404' using message = 'NOT_FOUND';
  end if;
  select * into previous from public.telegram_system_audit where operation_id = p_operation_id;
  if found then
    if previous.actor_id <> p_actor_id or previous.target_user_id <> p_user_id or previous.action <> p_action then
      raise sqlstate 'PT409' using message = 'MEMBERSHIP_CHANGED';
    end if;
    return previous.result;
  end if;

  select count(*) into matches from public.user_subscriptions where lower(trim(email)) = actor_email;
  if matches > 1 then raise sqlstate 'PT409' using message = 'DUPLICATE_EMAIL_RECORDS'; end if;
  select * into current_record from public.user_subscriptions where lower(trim(email)) = actor_email for update;
  if current_record.user_id is not null and current_record.user_id <> p_user_id then
    raise sqlstate 'PT409' using message = 'MEMBERSHIP_OWNER_MISMATCH';
  end if;
  member := public.telegram_system_member(p_user_id);
  if member is null then raise sqlstate 'PT404' using message = 'NOT_FOUND'; end if;
  if member->>'manual_revision' is distinct from p_expected_revision then
    raise sqlstate 'PT409' using message = 'MEMBERSHIP_CHANGED';
  end if;
  changed_at := clock_timestamp();
  before_state := jsonb_build_object('active', coalesce(current_record.is_vip, false), 'expiresAt', current_record.vip_expires_at);
  if p_action = 'grant' then
    expires := case when current_record.is_vip = true and current_record.vip_expires_at > changed_at
      then current_record.vip_expires_at else changed_at end + interval '30 days';
    if current_record.id is null then
      insert into public.user_subscriptions(user_id, email, is_vip, vip_expires_at, updated_at)
        values (p_user_id, actor_email, true, expires, changed_at);
    else
      update public.user_subscriptions set user_id = p_user_id, is_vip = true, vip_expires_at = expires, updated_at = changed_at
        where id = current_record.id;
    end if;
  else
    if current_record.is_vip is distinct from true or current_record.vip_expires_at is null or current_record.vip_expires_at <= changed_at then
      raise sqlstate 'PT409' using message = 'MANUAL_ACCESS_NOT_ACTIVE';
    end if;
    expires := changed_at;
    update public.user_subscriptions set is_vip = false, vip_expires_at = expires, updated_at = changed_at
      where id = current_record.id;
  end if;
  after_state := jsonb_build_object('active', p_action = 'grant', 'expiresAt', expires);
  result := jsonb_build_object('ok', true, 'action', p_action, 'userId', p_user_id, 'expiresAt', expires);
  insert into public.telegram_system_audit(operation_id, actor_id, target_user_id, action, before_state, after_state, result)
    values (p_operation_id, p_actor_id, p_user_id, p_action, before_state, after_state, result);
  return result;
end;
$function$;

revoke all on function public.telegram_system_rate_limit(bigint, text),
  public.telegram_system_member(uuid), public.telegram_system_lookup(text),
  public.telegram_system_members(text, uuid, integer),
  public.telegram_system_change_membership(bigint, text, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.telegram_system_rate_limit(bigint, text),
  public.telegram_system_member(uuid), public.telegram_system_lookup(text),
  public.telegram_system_members(text, uuid, integer),
  public.telegram_system_change_membership(bigint, text, uuid, uuid, text)
  to service_role;

notify pgrst, 'reload schema';
commit;
