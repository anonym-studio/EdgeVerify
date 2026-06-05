# EdgeVerify (Edge-based Network & Security Verification Platform)

本ドキュメントは、Cloudflare Pages（静的ホスティング）および Cloudflare Pages Functions（エッジサーバーレス）を利用し、アクセスユーザーのIPアドレス、詳細な回線品質、VPN/プロキシ使用有無、セキュリティステータス、位置情報等を瞬時に可視化するWebツール「EdgeVerify」の要件・仕様・設計および実装コードをまとめたものです。

## 1. システム概要と特徴

従来の「確認君」が提供していた基本機能（IP、ホスト名、UA等）に加え、モダンなセキュリティチェック機能（VPN/プロキシ検知、Tor検出、通信暗号化強度）および優れたUI/UX（レスポンシブ、ダークモード、ワンクリックコピー、JSON出力）を備えた、サーバーレスで運用コストゼロのWebアプリケーション「EdgeVerify」を構築します。

### 本構成のメリット

- **完全サーバーレス**: サーバー維持費が一切不要（Cloudflareの無料枠で十分に運用可能）。
    
- **極めて高い応答性**: Cloudflareのグローバルエッジ（CDN）で処理が完結するため、超高速（ミリ秒単位）で判定結果を返却。
    
- **高精度の検知**: Cloudflare独自の脅威インテリジェンス（`request.cf`）を利用。
    

## 2. 要件定義 (Requirements)

### 2.1. 機能要件

|カテゴリ|要求機能|詳細|
|---|---|---|
|**IP/基本情報**|IPv4 / IPv6 判別表示|接続に使用されているIPアドレスを正確に判別・表示する。|
||リモートホスト（逆引き）|IPアドレスに対応するDNSの逆引きドメインを表示する。|
||ユーザーエージェント解析|ブラウザ、OS、デバイスタイプを解析してわかりやすく表示する。|
|**回線・ネットワーク**|プロバイダ (ISP) 判定|AS番号 (ASN) および組織名 (ASOrganization) からプロバイダを特定。|
||接続プロトコル判定|HTTP/1.1、HTTP/2、HTTP/3 のどれで接続しているかを表示。|
||暗号化 (TLS) ステータス|TLSバージョン（例: TLS 1.3）および暗号化スイート名を表示。|
|**VPN / セキュリティ**|ホスティング/VPN検出|データセンター（Hosting）回線や、主要なVPN・プロキシ経由かを自動判別。|
||Torネットワーク検出|アクセス元がTorの出口ノードに該当するかを判定。|
||脅威スコア (Threat Score)|Cloudflareが持つIPアドレスの脅威レベル（0〜100）を表示。|
|**位置情報**|位置情報の可視化|国名、都道府県、市区町村、緯度経度、タイムゾーンを表示。|
|**ブラウザ側計測**|クライアント情報取得|画面解像度、ウィンドウサイズ、JS有効性、システム言語設定。|
||ローカルIP (WebRTC)|(※技術的制限あり) 可能な範囲でプライベートIPのアドレスを取得。|
|**利便性 (UX)**|コピー & JSON出力|各項目を個別にコピー、または全データをJSONとして取得/コピー可能にする。|

### 2.2. 非機能要件

- **パフォーマンス**: ファースト・コンテンツフル・ペイント (FCP) 1秒未満。
    
- **セキュリティ・プライバシー**:
    
    - サーバー側でアクセスログやユーザーの接続情報を一切データベース等に永続化（保存）しない設計（利用者のプライバシーを完全保護）。
        
    - 全通信を強制的にHTTPS化。
        
- **可用性・スケーラビリティ**: Cloudflareのインフラに準拠（実質的にアクセス集中によるダウンは発生しない）。
    
- **レスポンシブ対応**: スマートフォン、タブレット、PCのすべての解像度で最適化されたレイアウト。
    

## 3. システムアーキテクチャ (Architecture)

サーバー不要で動作する、Jamstack（静的フロント + サーバーレスAPI）の標準的な構成を採用します。

```
[ブラウザ (Client)]
     │
     │ (1) ページ要求: GET /
     ├─────────────────────────────────┐
     │ (2) HTML/CSS/JS (静的ファイル)   │
     │                                 ▼
     │                      [Cloudflare Pages (Edge)]
     │                                 │
     │ (3) 接続情報API要求: GET /api/info  │
     ├─────────────────────────────────┘
     │ (4) 接続メタデータ JSON 返却 (request.cf 解析)
     ▼
[JavaScriptで画面描画、ローカル情報マージ]
```

## 4. 詳細仕様と技術的制限への対策

### 4.1. VPN/プロキシ判定の仕様

Cloudflareは無料枠でも `request.cf` を通じて極めて精度の高い判定属性を返します。

1. **データセンター判定**: 組織名（`asOrganization`）に "Amazon", "Google", "Microsoft", "DigitalOcean", "Hosting" などの名前が含まれる場合、あるいはASNタイプが `hosting` の場合は、一般回線ではなくVPN・プロキシである確率が極めて高いため警告を表示します。
    
2. **Tor検出**: Cloudflareは、Torからのアクセスをヘッダーや特定のルールで識別できます。
    なお、`request.cf.isTor` は Cloudflare の公式ドキュメントに記載のない非公式プロパティです。動作しない場合は `asOrganization` キーワードマッチをフォールバックとして使用します。
    
3. **さらに精度を高める拡張**: バックエンド（Functions）で、必要に応じて無料のVPN検出外部API（例: `ip-api.com` や `vpnapi.io`）を非同期 fetch してマージする設計とします。
    

### 4.2. リモートホスト（逆引き）の仕様

通常、Cloudflare Workers/Functionsの環境から直接DNSの逆引き（PTRレコードの解決）を行うことは標準APIではサポートされていません。

- **対策**: 本設計では、Cloudflare Pages Functionsから信頼性の高いパブリックDNS（例: `Cloudflare 1.1.1.1` の JSON over HTTPS API、または `ip-api.com` の逆引き情報）をバックエンドで呼び出すことで、プロキシ規制を回避しながら高速に逆引きホスト名を取得します。
    

### 4.3. WebRTC（ローカルIP）の取得制限について

かつてはWebRTCの `RTCPeerConnection` を利用してローカルIP（`192.168.x.x`等）を簡単に取得できましたが、近年の主要ブラウザ（Safari, Chrome, Firefox等）では、プライバシー保護の観点から「mDNS（マルチキャストDNS）」が導入され、ランダムなUUID（`.local`）にマスクされるようになっています。

- **対策**: フロントエンドの実装において、WebRTCを用いたローカルIP取得処理を実装しつつ、取得できない場合（UUIDが返る場合）は「ブラウザによって保護されています」と親切なメッセージを表示するUX設計にします。
    

## 5. UI/UX 設計 (User Interface)

- **テーマ**: 近未来的なサイバー/ダーク・テック調（深夜でも目が疲れにくいダークモード標準）。アクセントカラーには「インフォメーション＝エメラルド/シアン」「警告＝アンバー/レッド」を採用。
    
- **ダッシュボード形式**:
    
    - 上部に「IPアドレス」と「VPN検出ステータス」を巨大なバッジで最優先表示。
        
    - 下部に「基本情報」「回線・ネットワーク」「位置情報」「ブラウザ環境」の4つのグリッドカードを配置。
        
- **全コピー・JSONエクスポート**: 開発者やデバッガー向けに、ボタン一つで表示データ（マスク処理なしのプレーンデータ）をクリップボードにコピー可能。
    

## 6. 実装コード (Source Code)

Cloudflare Pagesでそのまま動かすための2つの主要ファイルを記述します。

1. **`functions/api/info.js`**: バックエンドとなるエッジ関数（サーバー側情報を取得）。エンドポイント: `GET /api/info`
    
2. **`index.html`**: フロントエンド（静的HTML、Tailwind CSSによるレイアウト、Vanilla JSによるAPI連携）。
    

### 6.1. バックエンド：`functions/api/info.js`

プロジェクトのルート直下に `functions/api/` ディレクトリを作成し、`info.js` として保存します（Cloudflare Pages Functions のファイルベースルーティングにより `GET /api/info` にマッピングされます）。

```
export async function onRequest(context) {
  const { request } = context;

  // 1. 基本的なIPアドレスとヘッダー情報の取得
  const ip = request.headers.get("cf-connecting-ip") || "Unknown";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const cf = request.cf || {};

  // 2. DNS逆引きホスト名の取得（ip-api.comの無料APIを利用してホスト名とプロバイダの詳細情報を補強）
  let rdns = "取得失敗";
  let ispDetail = cf.asOrganization || "Unknown";
  let isVpnOrProxy = false;
  let vpnProviderName = "未検出";

  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,reverse,isp,org,as,proxy,hosting`);
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData.status === "success") {
        rdns = geoData.reverse || "逆引きレコードなし";
        ispDetail = geoData.isp || cf.asOrganization || "Unknown";
        
        // VPN / Proxy / Hosting 判定のハイブリッドロジック
        if (geoData.proxy || geoData.hosting) {
          isVpnOrProxy = true;
          vpnProviderName = geoData.hosting ? "ホスティング/データセンター" : "プロキシ/VPN";
        }
      }
    }
  } catch (e) {
    console.error("External API lookup failed:", e);
    // フォールバック: 外部APIが失敗した場合はCloudflareのデータのみで判定
    rdns = "逆引きエラー（制限超過またはタイムアウト）";
  }

  // 3. 組織名やASNからVPNの特徴をキーワード検知（追加セキュリティ強化）
  // "cloudflare" を含める場合、Cloudflare WARP ユーザーが誤検知される点に注意
  const suspiciousKeywords = ["vpn", "mullvad", "nordvpn", "expressvpn", "surfshark", "tor", "ovh", "digitalocean", "linode", "aws", "amazon", "google cloud", "cloudflare"];
  const orgLower = (cf.asOrganization || "").toLowerCase();
  if (!isVpnOrProxy && suspiciousKeywords.some(keyword => orgLower.includes(keyword))) {
    isVpnOrProxy = true;
    vpnProviderName = "ホスティング回線/疑似VPN";
  }

  // 4. データ構造の構築
  const responseData = {
    ip: ip,
    version: ip.includes(":") ? "IPv6" : "IPv4",
    reverse: rdns,
    network: {
      asn: cf.asn ? `AS${cf.asn}` : "Unknown",
      org: cf.asOrganization || "Unknown",
      isp: ispDetail,
      protocol: cf.httpProtocol || "Unknown",
      tlsVersion: cf.tlsVersion || "N/A",
      tlsCipher: cf.tlsCipher || "N/A",
      edgeLocation: cf.colo || "Unknown" // Cloudflareのアクセスポイント（3文字コード）
    },
    security: {
      isTor: cf.isTor || false,
      isVpnOrProxy: isVpnOrProxy,
      vpnDetectionType: vpnProviderName,
      threatScore: cf.threatScore || 0, // 0-100 (0が安全)
      botScore: cf.botManagement?.score || "N/A" // 有料オプションのみ有効
    },
    geo: {
      country: cf.country || "Unknown",
      region: cf.region || "Unknown",
      city: cf.city || "Unknown",
      postalCode: cf.postalCode || "Unknown",
      timezone: cf.timezone || "Unknown",
      latitude: cf.latitude || "Unknown",
      longitude: cf.longitude || "Unknown"
    },
    clientHeader: {
      userAgent: userAgent,
      language: request.headers.get("accept-language") || "Unknown"
    }
  };

  // 5. CORSヘッダーおよびキャッシュ無効化を付与して返却
  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
```

> **注意**: `ip-api.com` の無料プランは HTTP のみ対応（HTTPS は有料）、かつレート制限は 45 リクエスト/分です。本番環境でのトラフィック増加時には上限超過によるフォールバック（Cloudflare データのみでの判定）が発生することを想定してください。

### 6.2. フロントエンド：`index.html`

> 📝 **TBD** — 実装仕様策定中。
>
> - Tailwind CSS（CDN版）によるスタイリング
> - Vanilla JS による `/api/info` へのフェッチとDOM描画
> - WebRTC を用いたローカルIP取得（失敗時は保護メッセージ表示）
> - 全データの JSON クリップボードコピー機能