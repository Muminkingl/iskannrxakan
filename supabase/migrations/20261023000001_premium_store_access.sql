-- Apply AFTER scripts/security-hardening.sql. Existing manual subscriptions and
-- their legacy column names are preserved. No client can write Apple access.
begin;

create table if not exists public.store_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement_id text not null,
  product_id text,
  is_active boolean not null default false,
  expires_at timestamptz,
  is_sandbox boolean not null default false,
  checked_at timestamptz not null
);

alter table public.store_subscriptions enable row level security;
revoke all on public.store_subscriptions from public, anon, authenticated;
grant select on public.store_subscriptions to authenticated;
grant all on public.store_subscriptions to service_role;
drop policy if exists store_subscriptions_own_or_admin_read on public.store_subscriptions;
create policy store_subscriptions_own_or_admin_read on public.store_subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.record_store_subscription(p_user_id uuid, p_snapshot jsonb)
returns void language sql security definer set search_path = '' as $function$
  insert into public.store_subscriptions as existing (
    user_id, entitlement_id, product_id, is_active, expires_at, is_sandbox, checked_at
  ) values (
    p_user_id, p_snapshot->>'entitlement_id', p_snapshot->>'product_id',
    (p_snapshot->>'is_active')::boolean, (p_snapshot->>'expires_at')::timestamptz,
    (p_snapshot->>'is_sandbox')::boolean, (p_snapshot->>'checked_at')::timestamptz
  ) on conflict (user_id) do update set
    entitlement_id = excluded.entitlement_id, product_id = excluded.product_id,
    is_active = excluded.is_active, expires_at = excluded.expires_at,
    is_sandbox = excluded.is_sandbox, checked_at = excluded.checked_at
  where excluded.checked_at >= existing.checked_at;
$function$;
revoke all on function public.record_store_subscription(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_store_subscription(uuid, jsonb) to service_role;

-- Match generateUserCode() for accounts that have already displayed a reference
-- but never pressed the old Submit button. Existing stored codes are untouched.
create or replace function public.account_reference_code(identity text)
returns text language plpgsql immutable strict set search_path = '' as $function$
declare
  clean text := lower(trim(identity));
  hash bigint := 0;
  codepoint integer;
  unit integer;
  units integer[];
  positive bigint;
  encoded text := '';
begin
  for i in 1..char_length(clean) loop
    codepoint := ascii(substr(clean, i, 1));
    units := case when codepoint > 65535 then
      array[55296 + (codepoint - 65536) / 1024, 56320 + (codepoint - 65536) % 1024]
      else array[codepoint] end;
    foreach unit in array units loop
      hash := (hash * 31 + unit) % 4294967296;
      if hash > 2147483647 then hash := hash - 4294967296; end if;
      if hash < -2147483648 then hash := hash + 4294967296; end if;
    end loop;
  end loop;
  positive := abs(hash);
  if positive = 0 then encoded := '0'; end if;
  while positive > 0 loop
    encoded := substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (positive % 36)::integer + 1, 1) || encoded;
    positive := positive / 36;
  end loop;
  return 'ISKAN-' || substr(encoded || 'A7B8C9', 1, 6);
end;
$function$;
revoke all on function public.account_reference_code(text) from public, anon, authenticated;

create or replace function public.get_my_account_state()
returns jsonb language plpgsql volatile security definer set search_path = '' as $function$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  profile_code text;
  role_name text;
  manual_expiry timestamptz;
  store_expiry timestamptz;
  deleted boolean := false;
begin
  if actor_id is null then
    return jsonb_build_object('role', 'user', 'is_deleted', false, 'is_vip', false,
      'vip_expires_at', null, 'activation_code', null, 'pending_payment', false,
      'store_premium_active', false);
  end if;

  select lower(trim(email)) into actor_email from auth.users where id = actor_id;
  deleted := exists (select 1 from public.deleted_accounts where lower(trim(email)) = actor_email);
  role_name := public.current_user_role();

  select activation_code into profile_code from public.profiles where id = actor_id;
  if profile_code is null and not deleted then
    -- The removed request button used to provision the reference code. Ensure
    -- new accounts still get a database-backed code without submitting anything.
    begin
      insert into public.profiles as existing (id, activation_code)
        values (actor_id, public.account_reference_code(coalesce(actor_email, actor_id::text)))
        on conflict (id) do update set activation_code = coalesce(existing.activation_code, excluded.activation_code)
        returning activation_code into profile_code;
    exception when unique_violation then
      -- A reference is for identification only. Resolve a legacy hash collision
      -- using the project's existing unique-code generator.
      insert into public.profiles as existing (id, activation_code)
        values (actor_id, public.generate_activation_code())
        on conflict (id) do update set activation_code = coalesce(existing.activation_code, excluded.activation_code)
        returning activation_code into profile_code;
    end;
  end if;

  select vip_expires_at into manual_expiry from public.user_subscriptions
    where lower(trim(email)) = actor_email and is_vip = true and vip_expires_at > now()
    order by vip_expires_at desc limit 1;
  select expires_at into store_expiry from public.store_subscriptions
    where user_id = actor_id and is_active = true and expires_at > now();

  return jsonb_build_object(
    'role', role_name, 'is_deleted', deleted, 'activation_code', profile_code,
    'is_vip', not deleted and (manual_expiry is not null or store_expiry is not null),
    'vip_expires_at', case when not deleted then greatest(manual_expiry, store_expiry) else null end,
    'store_premium_active', not deleted and store_expiry is not null,
    'pending_payment', exists (select 1 from public.payment_requests where user_id = actor_id and status = 'pending')
  );
end;
$function$;
revoke all on function public.get_my_account_state() from public, anon;
grant execute on function public.get_my_account_state() to authenticated;

commit;
