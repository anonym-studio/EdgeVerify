# システムアーキテクチャ

## 概要

Jamstack 構成（静的フロントエンド + サーバーレス API）。すべての処理が Cloudflare のグローバルエッジで完結するため、オリジンサーバーは存在しない。

## リクエストフロー

```
[ブラウザ]
    │
    │ (1) GET / → 静的ファイル配信
    ▼
[Cloudflare Pages Edge]
    │
    │ (2) GET /api/info → Pages Functions 実行
    ▼
[info.js] ─── fetch ──▶ [ip-api.com] (逆引き・ISP補強)
    │
    │ (3) JSON レスポンス返却
    ▼
[ブラウザ JS]
    │
    ├── DOM 描画（サーバー取得データ）
    └── WebRTC でローカルIP取得試行（ブラウザ側計測）
```

## コンポーネント詳細

### Cloudflare Pages（静的ホスティング）

- `index.html` を CDN エッジから直接配信
- `functions/` ディレクトリをファイルベースルーティングで Pages Functions に変換
  - `functions/api/info.js` → `GET /api/info`

### Pages Functions（エッジ関数）

- Node.js ではなく **Cloudflare Workers ランタイム**（V8 ベース）で動作
- `context.request.cf` オブジェクトから Cloudflare 独自メタデータを取得
- `ip-api.com` を非同期 fetch して逆引き・ISP 情報を補強
- レスポンスにユーザーデータを保持しない（一時処理のみ）

### フロントエンド（React + TypeScript + Vite + shadcn/ui）

- React 19 + TypeScript で構築。Vite 5 でビルド（`dist/` に出力）
- shadcn/ui コンポーネント + Tailwind CSS v4 で白ベース・オレンジ差し色のデザイン
- `useConnectionInfo` フックで `/api/info` を fetch し、WebRTC ローカル IP 取得と並行実行
- 画面解像度・言語設定など、ブラウザ側のみで取得可能な情報を付加

**コンポーネント構成**

```
App.tsx
├── Header
│   ├── ロゴ + キャッチコピー（sm以上で表示）
│   ├── HelpDialog    — ヘルプモーダル（概要・使い方・注意事項）
│   ├── JSON コピーボタン
│   └── 更新ボタン
├── HeroCard          — IP アドレス + VPN ステータスバッジ
├── InfoCard × 4      — 基本情報 / 回線 / セキュリティ / 位置情報
│   └── 各ラベルにツールチップ（点線下線 → ホバーで説明表示）
└── BrowserCard       — ブラウザ環境（WebRTC ローカル IP 含む）
```

**ツールチップ設計**

各 InfoCard の行ラベルに `tooltip` プロパティを渡すことで、ラベルに点線アンダーラインを表示し、ホバー（タップ）で項目の説明を表示する。ツールチップ文言は `App.tsx` の `TT` オブジェクトに集約して管理する。

## データソース対応表

| 表示項目 | データソース |
|--------|------------|
| IPアドレス | `cf-connecting-ip` ヘッダー |
| IPv4/IPv6 判別 | IP 文字列の `:` 有無 |
| 逆引きホスト名 | ip-api.com |
| ASN / 組織名 | `request.cf.asn` / `cf.asOrganization` |
| ISP 名称 | ip-api.com（フォールバック: `cf.asOrganization`）|
| HTTP プロトコル | `request.cf.httpProtocol` |
| TLS バージョン / 暗号スイート | `request.cf.tlsVersion` / `cf.tlsCipher` |
| Cloudflare エッジ拠点 | `request.cf.colo`（3文字コード）|
| VPN / プロキシ判定 | ip-api.com `proxy`/`hosting` + キーワードマッチ |
| Tor 検出 | `request.cf.isTor`（非公式）+ キーワードマッチ |
| 脅威スコア | `request.cf.threatScore`（0–100）|
| 位置情報 | `request.cf` （country / region / city / 緯度経度）|
| ユーザーエージェント | `user-agent` ヘッダー |
| Accept-Language | `accept-language` ヘッダー |
| 画面解像度 / 言語 | ブラウザ JS（`screen`, `navigator`）|
| ローカル IP | WebRTC（取得できない場合は保護メッセージ）|

## 外部依存

### ip-api.com

- エンドポイント: `http://ip-api.com/json/{ip}?fields=status,message,reverse,isp,org,as,proxy,hosting`
- 無料プラン制約:
  - HTTP のみ（HTTPS 不可）
  - レート制限: 45 req/min
  - 超過時: HTTP 429。`info.js` は catch して Cloudflare データのみで返答する

## スケーラビリティ

Cloudflare のインフラ（数百のエッジ拠点）に依存するため、アクセス集中によるダウンは実質発生しない。ただし ip-api.com のレート制限超過時はフォールバック品質（逆引きなし）に低下する。
