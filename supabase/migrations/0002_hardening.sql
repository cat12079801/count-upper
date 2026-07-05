-- セキュリティ/整合性ハーデニング（多層防御）
-- Supabase SQL Editor で実行する。アプリ側のサーバアクションでも同等の検証を行っているが、
-- DB 側にも制約を置くことで直接アクセス経路に対する防御を固める。

-- count の上限（既存の count > 0 に上限を追加）
alter table public.count_logs
  drop constraint if exists count_logs_count_check;
alter table public.count_logs
  add constraint count_logs_count_range
  check (count > 0 and count <= 100000);

-- count_logs.counter_id と user_id の所有者一致を保証する。
-- 挿入/更新時に、参照する counter が同一 user_id の所有物であることを検証する。
create or replace function public.check_count_log_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.counters c
    where c.id = new.counter_id and c.user_id = new.user_id
  ) then
    raise exception 'counter_id does not belong to user_id';
  end if;
  return new;
end;
$$;

drop trigger if exists count_logs_owner_check on public.count_logs;
create trigger count_logs_owner_check
  before insert or update on public.count_logs
  for each row execute function public.check_count_log_owner();

-- name / unit の長さ制限
alter table public.counters
  drop constraint if exists counters_name_len;
alter table public.counters
  add constraint counters_name_len
  check (char_length(name) between 1 and 50);

alter table public.counters
  drop constraint if exists counters_unit_len;
alter table public.counters
  add constraint counters_unit_len
  check (char_length(unit) between 1 and 10);
