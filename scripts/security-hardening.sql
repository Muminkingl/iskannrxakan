-- Production security and account-state consolidation.
--
-- This migration removes public access from account and administration tables,
-- then exposes one authenticated, caller-scoped RPC for the app bootstrap.
-- It is safe to run more than once.

-- ---------------------------------------------------------------------------
-- Caller-scoped role and account state
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  role_name text;
begin
  if actor_id is null then
    return 'user';
  end if;

  select lower(trim(u.email))
    into actor_email
  from auth.users u
  where u.id = actor_id;

  select lower(trim(a.role))
    into role_name
  from public.app_admins a
  where lower(trim(a.email)) = actor_email
  order by case when lower(trim(a.role)) = 'owner' then 0 else 1 end
  limit 1;

  if role_name in ('owner', 'admin') then
    return role_name;
  end if;

  select lower(trim(p.role))
    into role_name
  from public.profiles p
  where p.id = actor_id;

  if role_name = 'owner' then
    return 'owner';
  end if;
  if role_name = 'admin' then
    return 'admin';
  end if;

  return 'user';
end;
$function$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.current_user_role() in ('owner', 'admin');
$function$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.get_my_account_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  subscription_row record;
  activation_code text;
  role_name text;
begin
  if actor_id is null then
    return jsonb_build_object(
      'role', 'user',
      'is_deleted', false,
      'is_vip', false,
      'vip_expires_at', null,
      'activation_code', null,
      'pending_payment', false
    );
  end if;

  select lower(trim(u.email))
    into actor_email
  from auth.users u
  where u.id = actor_id;

  select p.activation_code
    into activation_code
  from public.profiles p
  where p.id = actor_id;

  select us.is_vip, us.vip_expires_at
    into subscription_row
  from public.user_subscriptions us
  where lower(trim(us.email)) = actor_email
  order by us.updated_at desc nulls last
  limit 1;

  role_name := public.current_user_role();

  return jsonb_build_object(
    'role', role_name,
    'is_deleted', exists (
      select 1
      from public.deleted_accounts da
      where lower(trim(da.email)) = actor_email
    ),
    'activation_code', activation_code,
    'is_vip', coalesce(subscription_row.is_vip, false)
      and subscription_row.vip_expires_at is not null
      and subscription_row.vip_expires_at > now(),
    'vip_expires_at', case
      when coalesce(subscription_row.is_vip, false)
        and subscription_row.vip_expires_at is not null
        and subscription_row.vip_expires_at > now()
      then subscription_row.vip_expires_at
      else null
    end,
    'pending_payment', exists (
      select 1
      from public.payment_requests pr
      where pr.user_id = actor_id
        and pr.status = 'pending'
    )
  );
end;
$function$;

revoke all on function public.get_my_account_state() from public, anon;
grant execute on function public.get_my_account_state() to authenticated;

-- Existing destructive/payment helpers must never be callable anonymously.
revoke all on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;
revoke all on function public.submit_payment_request(text) from public, anon;
grant execute on function public.submit_payment_request(text) to authenticated;
revoke all on function public.generate_activation_code() from public, anon;

-- Pin the search path on the older privileged helpers as well.
alter function public.delete_user_account() set search_path = '';
alter function public.submit_payment_request(text) set search_path = '';
alter function public.generate_activation_code() set search_path = '';

-- ---------------------------------------------------------------------------
-- Remove all existing policies on private tables before rebuilding them.
-- ---------------------------------------------------------------------------

do $function$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'app_admins',
        'deleted_accounts',
        'payment_requests',
        'profiles',
        'subscriptions',
        'user_subscriptions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$function$;

-- No anonymous access to account, payment, subscription, profile, or admin
-- records. PUBLIC is revoked as well because anon/authenticated inherit from it.
revoke all on table public.app_admins from public, anon, authenticated;
revoke all on table public.deleted_accounts from public, anon, authenticated;
revoke all on table public.payment_requests from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.subscriptions from public, anon, authenticated;
revoke all on table public.user_subscriptions from public, anon, authenticated;

grant select, insert, update, delete on table public.app_admins to authenticated;
grant select on table public.deleted_accounts to authenticated;
grant select, update, delete on table public.payment_requests to authenticated;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.user_subscriptions to authenticated;

alter table public.app_admins enable row level security;
alter table public.deleted_accounts enable row level security;
alter table public.payment_requests enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_subscriptions enable row level security;

-- Administration is visible and mutable only to an existing administrator.
create policy app_admins_admin_select
  on public.app_admins for select to authenticated
  using (public.is_admin());
create policy app_admins_admin_insert
  on public.app_admins for insert to authenticated
  with check (public.current_user_role() = 'owner');
create policy app_admins_admin_update
  on public.app_admins for update to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');
create policy app_admins_admin_delete
  on public.app_admins for delete to authenticated
  using (public.current_user_role() = 'owner');

-- A signed-in user may check only their own deleted-account marker. The app's
-- normal path uses get_my_account_state(), while this keeps older builds safe.
create policy deleted_accounts_own_select
  on public.deleted_accounts for select to authenticated
  using (lower(trim(email)) = lower(trim((select auth.jwt() ->> 'email'))));

-- Payment requests are private to their owner and administrators.
create policy payment_requests_own_or_admin_select
  on public.payment_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy payment_requests_admin_update
  on public.payment_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy payment_requests_admin_delete
  on public.payment_requests for delete to authenticated
  using (public.is_admin());

-- Profiles are private to the profile owner and administrators. The payment
-- RPC remains the trusted path for first-time profile creation.
create policy profiles_own_or_admin_select
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
-- Subscription tables are readable only by the owner of the matching email or
-- by an administrator. Only administrators can write subscription records.
create policy user_subscriptions_own_or_admin_select
  on public.user_subscriptions for select to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or lower(trim(email)) = lower(trim((select auth.jwt() ->> 'email')))
  );
create policy user_subscriptions_admin_insert
  on public.user_subscriptions for insert to authenticated
  with check (public.is_admin());
create policy user_subscriptions_admin_update
  on public.user_subscriptions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy user_subscriptions_admin_delete
  on public.user_subscriptions for delete to authenticated
  using (public.is_admin());

create policy subscriptions_admin_select
  on public.subscriptions for select to authenticated
  using (public.is_admin());
create policy subscriptions_admin_insert
  on public.subscriptions for insert to authenticated
  with check (public.is_admin());
create policy subscriptions_admin_update
  on public.subscriptions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy subscriptions_admin_delete
  on public.subscriptions for delete to authenticated
  using (public.is_admin());

-- Normalize already-expired records so admin reports and legacy clients do not
-- display stale VIP flags. The RPC also checks the timestamp defensively.
update public.user_subscriptions
set is_vip = false,
    updated_at = now()
where is_vip = true
  and vip_expires_at is not null
  and vip_expires_at <= now();

update public.subscriptions
set is_vip = false,
    updated_at = now()
where is_vip = true
  and (
    (vip_expires_at is not null and vip_expires_at <= now())
    or (expires_at is not null and expires_at <= now())
  );

