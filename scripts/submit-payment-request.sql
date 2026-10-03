-- Run this in Supabase SQL Editor when provisioning the project.
-- The client calls this RPC instead of writing payment_requests directly.

create or replace function public.submit_payment_request(request_transaction_ref text default null)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_id uuid := auth.uid();
  activation_code text;
  request_row public.payment_requests;
  account_email text;
begin
  if actor_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select p.activation_code into activation_code
  from public.profiles p
  where p.id = actor_id;

  if activation_code is null then
    insert into public.profiles (id, activation_code)
    values (actor_id, public.generate_activation_code())
    on conflict (id) do nothing;

    select p.activation_code into activation_code
    from public.profiles p
    where p.id = actor_id;
  end if;

  if activation_code is null then
    raise exception 'Could not create account profile';
  end if;

  select lower(nullif(trim(u.email), '')) into account_email
  from auth.users u
  where u.id = actor_id;

  insert into public.payment_requests (
    user_id, code, email, status, transaction_ref
  ) values (
    actor_id,
    activation_code,
    account_email,
    'pending',
    coalesce(nullif(trim(request_transaction_ref), ''), activation_code)
  )
  on conflict (user_id) where (status = 'pending') do nothing
  returning * into request_row;

  if request_row.id is null then
    select * into request_row
    from public.payment_requests
    where user_id = actor_id and status = 'pending'
    order by created_at desc
    limit 1;
  end if;

  if request_row.id is null then
    raise exception 'Could not save activation request';
  end if;

  return request_row;
end;
$function$;

grant execute on function public.submit_payment_request(text) to authenticated;
