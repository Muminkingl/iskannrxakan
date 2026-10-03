-- Public rates are non-sensitive market data. The Cloudflare Worker uses the
-- anon key to read this table and serves a cached snapshot to customers.
grant usage on schema public to anon, authenticated;
grant select on table public.rates to anon, authenticated;

alter table public.rates enable row level security;

drop policy if exists "public can read rates" on public.rates;
create policy "public can read rates"
  on public.rates
  for select
  to anon, authenticated
  using (true);

-- Bounded chart queries stay fast as the history table grows.
create index if not exists rate_history_currency_created_idx
  on public.rate_history (base_currency_code, created_at);
