# デプロイ手順

**本番 URL**: https://edge-verify.pages.dev/

## 概要

EdgeVerify は Cloudflare Pages にデプロイする。フロントエンド（`dist/`）と Pages Functions（`functions/`）を wrangler が一括でアップロードする。

```
pnpm build   →   dist/ 生成（Vite）
                 functions/ はそのまま使用
pnpm ship  →   wrangler pages deploy dist
```

---

## 前提条件

| 必要なもの | 確認方法 |
|-----------|---------|
| Cloudflare アカウント | https://dash.cloudflare.com でサインアップ |
| wrangler CLI | `pnpm wrangler --version` |
| Node.js 20+ | `node --version`（v21 は可、v18 以下は不可）|

---

## 初回デプロイ

### 1. Cloudflare にログイン

```bash
pnpm wrangler login
```

ブラウザが開くので Cloudflare アカウントで認可する。成功すると `~/.wrangler/config/default.toml` に認証情報が保存される。

ログイン状態の確認：

```bash
pnpm wrangler whoami
```

### 2. Cloudflare Pages プロジェクトを作成

```bash
pnpm wrangler pages project create edge-verify
```

プロンプトが表示されたら以下を選択する：

- **Production branch**: `main`

> プロジェクト名は `wrangler.toml` の `name = "edge-verify"` と一致させる必要がある。

### 3. デプロイ

```bash
pnpm ship
```

内部では以下を順に実行する：

1. `tsc -b` — TypeScript 型チェック
2. `vite build` — `dist/` にバンドル生成
3. `wrangler pages deploy dist` — Cloudflare Pages にアップロード

デプロイ完了後、ターミナルにデプロイ先 URL が表示される：

```
✨ Deployment complete! Take a look over at https://edge-verify.pages.dev
```

本番 URL: **https://edge-verify.pages.dev/**

---

## 2回目以降のデプロイ

```bash
pnpm ship
```

これだけでビルドからデプロイまで完結する。

---

## デプロイの確認

### Pages ダッシュボード

Cloudflare ダッシュボード → **Workers & Pages** → `edge-verify` でデプロイ一覧・ログを確認できる。

### API 動作確認

```bash
curl https://edge-verify.pages.dev/api/info | python3 -m json.tool
```

`ip`・`network`・`geo` などのフィールドが返れば正常。

---

## カスタムドメイン

Cloudflare ダッシュボード → `edge-verify` → **Custom domains** → **Set up a custom domain** から設定する。

DNS が Cloudflare 管理の場合は自動で CNAME が追加される。

---

## 環境変数 / シークレット

Pages Functions でシークレットを使う場合は `wrangler pages secret` で設定する（現時点では本プロジェクトに必須のシークレットはない）。

```bash
# シークレットの追加
pnpm wrangler pages secret put SECRET_NAME

# シークレット一覧
pnpm wrangler pages secret list
```

ローカル開発用のシークレットは `.dev.vars` に記述する（`.gitignore` 対象）：

```ini
# .dev.vars
SECRET_NAME=value
```

---

## CI/CD（GitHub Actions）

`.github/workflows/deploy.yml` を作成することで、`main` ブランチへの push 時に自動デプロイできる。

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name edge-verify
```

**API トークンの発行手順：**

1. Cloudflare ダッシュボード → **My Profile** → **API Tokens**
2. **Create Token** → **Cloudflare Pages** テンプレートを選択
3. 生成されたトークンを GitHub リポジトリの **Settings → Secrets → Actions** に `CLOUDFLARE_API_TOKEN` として登録

---

## トラブルシューティング

### `wrangler pages project create` で「already exists」エラー

同名のプロジェクトが既にある。その場合はそのままデプロイすれば上書きされる。

```bash
pnpm wrangler pages deploy dist --project-name edge-verify
```

### ビルドエラー（`tsc -b` 失敗）

TypeScript の型エラーを修正してから再実行する。

```bash
pnpm build 2>&1 | grep "error TS"
```

### `dist/` が古い状態でデプロイされた

`pnpm ship` は毎回ビルドから実行するため通常は発生しない。手動で `dist/` を削除してから再実行する場合：

```bash
rm -rf dist && pnpm ship
```

### Pages Functions が動作しない（`/api/info` が 404）

`functions/` ディレクトリが `dist/` と同じ階層に存在するか確認する。wrangler は `dist/` の**兄弟ディレクトリ**として `functions/` を自動認識する。

```
EdgeVerify/
├── dist/          ← wrangler pages deploy dist で指定
└── functions/     ← 自動的に Pages Functions として認識される
```
