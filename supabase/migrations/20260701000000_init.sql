-- count-upper 初期スキーマ
-- Supabase SQL Editor で実行する。

-- カウント対象（項目）
create table if not exists public.counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  unit text not null default '回',
  created_at timestamptz not null default now()
);

-- カウント記録
create table if not exists public.count_logs (
  id uuid primary key default gen_random_uuid(),
  counter_id uuid not null references public.counters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  count integer not null check (count > 0),
  logged_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists count_logs_counter_date_idx
  on public.count_logs (counter_id, logged_on);
create index if not exists counters_user_idx
  on public.counters (user_id);

-- RLS: 自分のデータのみ参照・操作可能
alter table public.counters enable row level security;
alter table public.count_logs enable row level security;

create policy "counters are owner-only"
  on public.counters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "count_logs are owner-only"
  on public.count_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
