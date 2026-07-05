-- Data API ロールへのテーブル権限付与。
-- Supabase の新しい既定（auto_expose_new_tables 無効）では、マイグレーションで作成した
-- テーブルは明示的な GRANT がないと PostgREST 経由で一切アクセスできず、
-- 「permission denied for table」となる。init.sql は RLS ポリシーのみで GRANT が無かった。
--
-- 認証済みユーザーのみがデータを操作する設計のため、authenticated にのみ権限を付与する。
-- anon には付与しない（未認証アクセスをテーブルレベルでも遮断する多層防御）。
-- 行単位のアクセス制御は既存の RLS ポリシー（owner-only）が引き続き担う。

grant select, insert, update, delete on public.counters to authenticated;
grant select, insert, update, delete on public.count_logs to authenticated;
