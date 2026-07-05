-- カウンターに日次目標（1日あたりの目標回数）を追加する。任意（null 可）。
alter table public.counters
  add column if not exists daily_goal integer;

alter table public.counters
  drop constraint if exists counters_daily_goal_range;
alter table public.counters
  add constraint counters_daily_goal_range
  check (daily_goal is null or (daily_goal > 0 and daily_goal <= 100000));
