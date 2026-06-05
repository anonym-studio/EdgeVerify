# VPN / プロキシ検知ロジック

## 判定フロー

```
リクエスト受信
    │
    ├─① ip-api.com API 呼び出し
    │       │
    │       ├─ geoData.proxy === true  → isVpnOrProxy = true, type = "プロキシ/VPN"
    │       └─ geoData.hosting === true → isVpnOrProxy = true, type = "ホスティング/データセンター"
    │
    └─② キーワードマッチ（①で未検出の場合のみ）
            │
            └─ asOrganization に疑わしいキーワードを含む
                → isVpnOrProxy = true, type = "ホスティング回線/疑似VPN"
```

### ① ip-api.com ハイブリッド判定（優先）

`ip-api.com` の `proxy` フィールドと `hosting` フィールドを使用する。

- `proxy: true` — 商用 VPN・プロキシサービスと識別
- `hosting: true` — AWS / GCP / Azure 等のデータセンター IP と識別

外部 API に依存するため、レート超過・タイムアウト時は ② のみで判定する。

### ② Cloudflare asOrganization キーワードマッチ（フォールバック）

`request.cf.asOrganization` を小文字化し、以下のキーワードのいずれかを含む場合に検出とする。

```js
const suspiciousKeywords = [
  "vpn", "mullvad", "nordvpn", "expressvpn", "surfshark",
  "tor", "ovh", "digitalocean", "linode",
  "aws", "amazon", "google cloud", "cloudflare"
];
```

**注意**: `"cloudflare"` を含めているため、Cloudflare WARP ユーザーが誤検知される。
これは仕様上の妥協点であり、WARP はトンネリングサービスとして扱う。

## Tor 検出

```js
isTor: cf.isTor || false
```

`cf.isTor` は Cloudflare 公式ドキュメント未記載の非公式プロパティ。将来削除される可能性がある。動作しない環境では常に `false` になる。

フォールバックとして、キーワードマッチ（`"tor"`）が機能する。

## 脅威スコア

`cf.threatScore`（0–100）は Cloudflare が独自のインテリジェンスで算出する。

- Project Honeypot 等の脅威データベースを参照
- スパム送信・DDoS 参加・総当たり攻撃の履歴を持つ IP ほどスコアが高い
- `0` の IP でも VPN/プロキシであることはある（スコアと VPN 判定は独立）

## 精度の限界

| ケース | 挙動 |
|-------|------|
| 企業 NAT 出口 IP | 組織名によっては誤検知あり |
| 個人宅 VPS | `hosting: true` で検出されるが、VPN ではない場合も |
| Cloudflare WARP | キーワードマッチで `isVpnOrProxy: true` になる（既知の誤検知）|
| 新興 VPN プロバイダ | キーワードに登録されていない場合は未検出 |
| ip-api.com レート超過 | Cloudflare データのみで判定（精度低下）|

## 拡張案（現時点で未実装）

精度をさらに高めるには、以下の有料・外部サービスとの連携が考えられる。

- `vpnapi.io` — VPN / プロキシ / Tor / ホスティングを統合判定
- `ipqualityscore.com` — フィッシング・詐欺関連スコアも提供
- Cloudflare Bot Management（有料）— `cf.botManagement.score` が `"N/A"` 以外になる
