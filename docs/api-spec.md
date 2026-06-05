# API仕様: GET /api/info

## エンドポイント

```
GET /api/info
```

認証不要。ログ保存なし。キャッシュなし（`Cache-Control: no-store`）。

## レスポンス

### ヘッダー

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Access-Control-Allow-Origin: *
```

### ボディ（JSON）

```jsonc
{
  "ip": "203.0.113.1",          // アクセス元 IP アドレス
  "version": "IPv4",             // "IPv4" or "IPv6"
  "reverse": "example.isp.ne.jp", // 逆引きホスト名（取得失敗時は固定文字列）

  "network": {
    "asn": "AS1234",             // AS番号（例: "AS4713"）
    "org": "NTT Communications", // Cloudflare が持つ組織名
    "isp": "NTT Docomo",        // ip-api.com から取得した ISP 名称
    "protocol": "HTTP/3",        // "HTTP/1.1" | "HTTP/2" | "HTTP/3"
    "tlsVersion": "TLSv1.3",    // "TLSv1.2" | "TLSv1.3" | "N/A"
    "tlsCipher": "AEAD-AES256-GCM-SHA384", // TLS 暗号スイート名
    "edgeLocation": "NRT"        // Cloudflare エッジ拠点コード（3文字）
  },

  "security": {
    "isTor": false,              // Tor 出口ノードかどうか
    "isVpnOrProxy": false,       // VPN / プロキシ / ホスティング回線かどうか
    "vpnDetectionType": "未検出", // 検出種別（後述）
    "threatScore": 0,            // Cloudflare 脅威スコア 0–100（0 = 安全）
    "botScore": "N/A"            // Cloudflare Bot Management スコア（有料プランのみ）
  },

  "geo": {
    "country": "JP",             // ISO 3166-1 alpha-2 国コード
    "region": "Tokyo",           // 都道府県・州
    "city": "Shinjuku",          // 市区町村
    "postalCode": "160-0000",    // 郵便番号
    "timezone": "Asia/Tokyo",    // IANA タイムゾーン
    "latitude": "35.69",         // 緯度
    "longitude": "139.69"        // 経度
  },

  "clientHeader": {
    "userAgent": "Mozilla/5.0 ...", // User-Agent ヘッダー原文
    "language": "ja,en-US;q=0.9"   // Accept-Language ヘッダー原文
  }
}
```

## フィールド詳細

### `reverse` の値パターン

| 値 | 意味 |
|---|------|
| `"example.isp.ne.jp"` | 逆引き成功 |
| `"逆引きレコードなし"` | PTR レコード未設定 |
| `"取得失敗"` | ip-api.com 呼び出し前にエラー |
| `"逆引きエラー（制限超過またはタイムアウト）"` | ip-api.com fetch 失敗 |

### `security.vpnDetectionType` の値パターン

| 値 | 検出根拠 |
|---|--------|
| `"未検出"` | VPN/プロキシ非検出 |
| `"プロキシ/VPN"` | ip-api.com `proxy: true` |
| `"ホスティング/データセンター"` | ip-api.com `hosting: true` |
| `"ホスティング回線/疑似VPN"` | 組織名キーワードマッチ |

### `security.threatScore`

Cloudflare が IP アドレスに付与するリスクスコア。

- `0` : 安全
- `1–20` : 低リスク
- `21–50` : 中リスク  
- `51–100` : 高リスク（スパム・攻撃履歴あり）

### `network.edgeLocation`

Cloudflare のエッジ POP（Point of Presence）を表す 3 文字の IATA 空港コード。

例: `NRT`（成田）、`KIX`（関西）、`ITM`（伊丹）

## エラー時の挙動

HTTP ステータスは常に `200` を返す。エラーは各フィールドのフォールバック値で表現する。

| 障害 | 挙動 |
|-----|------|
| ip-api.com タイムアウト | `reverse` を固定エラー文字列に。`isVpnOrProxy` は Cloudflare データのキーワードマッチのみで判定 |
| ip-api.com レート超過（429）| 同上 |
| `request.cf` が空（ローカル開発） | 各フィールドが `"Unknown"` / `0` / `false` になる |
