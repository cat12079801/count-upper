# count-upper

腕立て伏せ等、日々の「数えたい何か」をカウントし、いつどれだけ行ったかを見返せるカウントアップ記録アプリ。

**本番環境**: https://count-upper.vercel.app

## 概要

- 任意の対象（腕立て、腹筋、読書ページ数 等）を登録し、日々の回数をカウントアップ記録する
- ログインしてクラウドに保存し、複数端末で同期する
- 記録を日単位・月単位の棒グラフで可視化する

## 機能要件

### アカウント / 同期
- Google ログインによる認証
- データはクラウド保存し、複数端末間でリアルタイム同期する
- 端末非依存（PC / スマホ / タブレット）

### カウント対象（項目）管理
- カウント対象を複数登録・編集・削除できる（例: 腕立て、腹筋）
- 項目ごとに単位・名称を設定する

### 記録
- 対象を選び、当日の回数をカウントアップ記録する（+1、任意数値の加算）
- 過去日付の記録の追加・修正ができる
- 記録は「どの項目を・いつ・いくつ」を保持する

### 可視化
- **日単位ビュー**: 1か月を範囲に、日ごとの合計を棒グラフ表示（添付参考画像の見た目に準拠）
  - 平均ライン、期間合計、記録日数などのサマリを併記
  - 月の切り替え（前月 / 翌月）
- **月単位ビュー**: 1年を範囲に、月ごとの合計を棒グラフ表示
  - 年の切り替え
- 項目ごとにビューを切り替える

### 非機能要件
- レスポンシブ表示（モバイルファースト）
- ランニングコストを極力抑える（無料枠中心の構成）
- 個人利用規模を想定

## 技術構成（確定）

ランニングコスト最小化を優先し、無料枠で完結する構成を採用する。

| 領域 | 採用 | 理由 |
| --- | --- | --- |
| フロントエンド | Next.js (App Router) + TypeScript | レスポンシブ・PWA化が容易 |
| UI | Tailwind CSS | 実装速度・レスポンシブ対応 |
| グラフ | Recharts | 棒グラフ・レスポンシブ対応が容易 |
| 認証 | Supabase Auth (Google OAuth) | Google ログインを利用 |
| DB / 同期 | Supabase (Postgres + RLS) | 無料枠でDB・同期を提供 |
| ホスティング | Vercel (Hobby) | 無料枠 |

## データモデル（案）

```
users        : Supabase Auth 管理
counters     : id, user_id, name, unit, created_at
count_logs   : id, counter_id, user_id, count, logged_on (date), created_at
```

- 日単位集計: `count_logs` を `logged_on` で日別 SUM
- 月単位集計: `logged_on` を月別 SUM

## ディレクトリ構成

```
src/
  app/
    login/            ログイン画面（Google）
    auth/callback/    OAuth コールバック
    auth/signout/     ログアウト
    app/              保護領域（ダッシュボード・サーバアクション）
  components/         CounterBar / StatsChart / RecordPanel / EmptyState
  lib/
    supabase/         server / client / middleware(session更新)
    date.ts           日付・期間ユーティリティ
  types/db.ts
  proxy.ts            ルート保護（Next.js 16 proxy 規約）
supabase/migrations/  DBスキーマ + RLS
```

## セットアップ

### 1. Supabase プロジェクト

1. [Supabase](https://supabase.com) で無料プロジェクトを作成する
2. `supabase/migrations/` のマイグレーションを適用する（後述「DB マイグレーション」）
3. Authentication > Providers で **Google** を有効化する
   - Google Cloud で OAuth クライアントを作成し、client id / secret を設定する
   - 承認済みリダイレクト URI に `https://<project-ref>.supabase.co/auth/v1/callback` を追加する
4. Project Settings > API から `URL` と `anon key` を控える

### 2. 環境変数

`.env.example` を `.env.local` にコピーし、値を設定する。

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. ローカル開発

```
npm install
npm run dev
```

http://localhost:3000 を開く。

### 4. Vercel デプロイ

1. GitHub リポジトリを Vercel に連携する
2. 環境変数（上記3つ、`NEXT_PUBLIC_SITE_URL` は本番URL）を設定する
3. Supabase Authentication > URL Configuration に本番URL（`https://<app>.vercel.app/auth/callback`）を追加する

## DB マイグレーション

マイグレーションは `supabase/migrations/<timestamp>_name.sql` に置く。適用は [Supabase CLI](https://supabase.com/docs/guides/cli) で行い、main へマージすると CI（`.github/workflows/db-migrate.yml`）が自動適用する。

### CI 自動適用に必要な設定（初回のみ）

1. Supabase で **Access Token** を発行（Account > Access Tokens）
2. GitHub リポジトリの Secrets に登録
   - `SUPABASE_ACCESS_TOKEN`: 上記トークン
   - `SUPABASE_DB_PASSWORD`: プロジェクト作成時の DB パスワード
3. 既存スキーマを CLI 管理下へ移す **ベースライン**（`0001` 相当を手動適用済みのため一度だけ必要）
   ```
   export SUPABASE_ACCESS_TOKEN=... SUPABASE_DB_PASSWORD=...
   supabase link --project-ref zssprbyaxjosxbkabsbt
   supabase migration repair --status applied 20260701000000
   supabase db push   # 20260705000000_hardening 以降が適用される
   ```

### ローカルでの手動適用

```
npx supabase link --project-ref zssprbyaxjosxbkabsbt
npx supabase db push
```

新しいマイグレーションは `npx supabase migration new <name>` で作成する。

## ステータス

MVP 公開済み（https://count-upper.vercel.app ）。認証・カウンター管理・記録・日/月グラフが動作する。今後のタスクは GitHub Issues を参照。
