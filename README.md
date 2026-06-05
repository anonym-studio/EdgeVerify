# EdgeVerify

**Edge-based Network & Security Verification Platform**

アクセスユーザーの接続情報（IPアドレス・回線品質・VPN/プロキシ検知・位置情報など）をリアルタイムで可視化するWebツール。Cloudflare Pages + Pages Functions で動作するサーバーレス構成。

## 特徴

- **完全サーバーレス**: Cloudflare 無料枠のみで運用可能
- **高精度検知**: Cloudflare 独自の脅威インテリジェンス (`request.cf`) + `ip-api.com` ハイブリッド判定
- **ゼロログ**: バックエンドでユーザー接続情報を一切永続化しない

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| ホスティング | Cloudflare Pages |
| バックエンド | Cloudflare Pages Functions (ES Modules) |
| フロントエンド | HTML + Tailwind CSS (CDN) + Vanilla JS |
| 外部API | ip-api.com (逆引き・ISP補強、無料枠: 45 req/min) |

## プロジェクト構成

```
EdgeVerify/
├── index.html              # フロントエンド（SPA）
├── functions/
│   └── api/
│       └── info.js         # エッジ関数 → GET /api/info
├── package.json
├── wrangler.toml
└── spec/
    └── 高機能回線情報チェッカー「EdgeVerify」詳細設計ドキュメント.md
```

## ローカル開発

```bash
npm install
npm run dev    # http://localhost:8788 で起動
```

Wrangler が `functions/` ディレクトリを自動認識し、Pages Functions を含めた完全なローカル環境を提供します。

`request.cf` はローカルでは `{}` になるため、フォールバック値（`"Unknown"` / `0`）が表示されます。

## デプロイ

```bash
npm run deploy
```

初回は Cloudflare アカウントへのログインが必要です:

```bash
npx wrangler login
```

## API

### `GET /api/info`

アクセス元の接続情報を JSON で返します。ログ保存なし、キャッシュなし。

```jsonc
{
  "ip": "203.0.113.1",
  "version": "IPv4",
  "reverse": "example.isp.ne.jp",
  "network": {
    "asn": "AS1234",
    "org": "Example ISP",
    "isp": "Example ISP Co., Ltd.",
    "protocol": "HTTP/3",
    "tlsVersion": "TLSv1.3",
    "tlsCipher": "AEAD-AES256-GCM-SHA384",
    "edgeLocation": "NRT"
  },
  "security": {
    "isTor": false,
    "isVpnOrProxy": false,
    "vpnDetectionType": "未検出",
    "threatScore": 0,
    "botScore": "N/A"
  },
  "geo": {
    "country": "JP",
    "region": "Tokyo",
    "city": "Shinjuku",
    "postalCode": "160-0000",
    "timezone": "Asia/Tokyo",
    "latitude": "35.69",
    "longitude": "139.69"
  },
  "clientHeader": {
    "userAgent": "Mozilla/5.0 ...",
    "language": "ja,en-US;q=0.9"
  }
}
```

## ライセンス

MIT
