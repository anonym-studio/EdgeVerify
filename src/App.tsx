import { useConnectionInfo } from '@/hooks/useConnectionInfo'
import { HeroCard } from '@/components/HeroCard'
import { InfoCard } from '@/components/InfoCard'
import { BrowserCard } from '@/components/BrowserCard'
import { HelpDialog } from '@/components/HelpDialog'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RefreshCw, Copy, ShieldCheck } from 'lucide-react'

// ─── ツールチップ文言 ───────────────────────────────────────

const TT = {
  basic: {
    ip:       'ISPから割り当てられたグローバルIPアドレス。ウェブサイトや相手には通常このアドレスが見えています',
    version:  'IPプロトコルのバージョン。IPv4は32bit（約43億個）、IPv6は128bitのアドレス空間を持ちます',
    reverse:  'IPアドレスをDNSで逆引きして得たホスト名（PTRレコード）。プロバイダー名が含まれることが多いです',
    ua:       'ブラウザがサーバーに送信する識別文字列。ブラウザ種別・OS・バージョンが含まれます',
    lang:     'ブラウザの優先言語設定。サイトの言語切り替えや地域判定に使われます',
  },
  network: {
    asn:      'Autonomous System Number。インターネット上のネットワーク単位を識別する番号です',
    org:      'このASNを管理する組織名。ISPや企業・データセンター名が表示されます',
    isp:      'インターネットサービスプロバイダー（接続事業者）の名称',
    protocol: '使用中のHTTPバージョン。HTTP/3はUDP基盤のQUICプロトコルを使い最も高速です',
    tls:      '通信の暗号化バージョン。TLS 1.3が現行の最新規格で、より高速かつ安全です',
    cipher:   'TLS接続で使用している暗号化アルゴリズムの組み合わせ（暗号スイート）',
    colo:     'リクエストを処理したCloudflareエッジサーバーの拠点コード（IATA空港コード形式）',
  },
  security: {
    vpn:      'VPNサービス・商用プロキシ・データセンター回線を使用しているかをip-api.comとCloudflareデータで判定します',
    tor:      'Torネットワーク（匿名化ネットワーク）の出口ノード経由かどうかを判定します',
    threat:   'CloudflareがこのIPに付与するリスクスコア（0=安全、100=高リスク）。スパム・攻撃履歴のあるIPほど高くなります',
  },
  geo: {
    country:    'IPアドレスのジオロケーションデータベースから推定される接続元の国',
    region:     'IPから推定される都道府県・州。同一ISPのIPプールがまとめて登録されていることがあります',
    city:       'IPから推定される市区町村。精度は数十km程度で、実際の所在地と異なる場合があります',
    postal:     'IPから推定される郵便番号。エリア単位の推定のため実際と異なる場合があります',
    timezone:   'IPから推定されるタイムゾーン（IANA形式）',
    latlon:     'IPから推定される大まかな座標。実際の位置とは大きな誤差がある場合があります',
  },
}

// ─── コンポーネント ─────────────────────────────────────────

export default function App() {
  const { data, browser, loading, error, snapshot, reload } = useConnectionInfo()

  const handleCopyJson = async () => {
    if (!snapshot) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2))
    } catch { /* clipboard 非対応環境では無視 */ }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">

        {/* ヘッダー */}
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

            {/* ロゴ + キャッチコピー */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-bold tracking-tight">EdgeVerify</span>
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground border-l pl-3 truncate">
                IP・回線・セキュリティをリアルタイムで確認
              </span>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <HelpDialog />
              <Button variant="outline" size="sm" onClick={handleCopyJson} disabled={loading || !snapshot}>
                <Copy />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">更新</span>
              </Button>
            </div>

          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <HeroCard data={data} loading={loading} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoCard
              title="基本情報"
              loading={loading}
              rows={data ? [
                { label: 'IP アドレス',     value: data.ip,                      tooltip: TT.basic.ip },
                { label: 'バージョン',       value: data.version,                 tooltip: TT.basic.version },
                { label: '逆引きホスト',     value: data.reverse,                 tooltip: TT.basic.reverse },
                { label: 'User Agent',      value: data.clientHeader.userAgent,   tooltip: TT.basic.ua },
                { label: 'Accept-Language', value: data.clientHeader.language,    tooltip: TT.basic.lang },
              ] : []}
            />
            <InfoCard
              title="回線 / ネットワーク"
              loading={loading}
              rows={data ? [
                { label: 'ASN',          value: data.network.asn,          tooltip: TT.network.asn },
                { label: '組織名',       value: data.network.org,          tooltip: TT.network.org },
                { label: 'ISP',          value: data.network.isp,          tooltip: TT.network.isp },
                { label: 'プロトコル',   value: data.network.protocol,     tooltip: TT.network.protocol },
                { label: 'TLS',          value: data.network.tlsVersion,   tooltip: TT.network.tls },
                { label: '暗号スイート', value: data.network.tlsCipher,    tooltip: TT.network.cipher },
                { label: 'CFエッジ拠点', value: data.network.edgeLocation, tooltip: TT.network.colo },
              ] : []}
            />
            <InfoCard
              title="セキュリティ"
              loading={loading}
              security={data?.security}
              securityTooltips={{
                vpn:    TT.security.vpn,
                tor:    TT.security.tor,
                threat: TT.security.threat,
              }}
              rows={[]}
            />
            <InfoCard
              title="位置情報"
              loading={loading}
              geo={data?.geo}
              rows={data ? [
                { label: '国',           value: data.geo.country,   tooltip: TT.geo.country },
                { label: '地域',         value: data.geo.region,    tooltip: TT.geo.region },
                { label: '都市',         value: data.geo.city,      tooltip: TT.geo.city },
                { label: '郵便番号',     value: data.geo.postalCode, tooltip: TT.geo.postal },
                { label: 'タイムゾーン', value: data.geo.timezone,  tooltip: TT.geo.timezone },
                {
                  label: '緯度 / 経度',
                  value: data.geo.latitude !== 'Unknown' && data.geo.longitude !== 'Unknown'
                    ? `${data.geo.latitude}, ${data.geo.longitude}`
                    : '—',
                  tooltip: TT.geo.latlon,
                },
              ] : []}
            />
          </div>

          <BrowserCard browser={browser} loading={loading} />

          <footer className="text-center text-xs text-muted-foreground pb-4">
            EdgeVerify — 接続情報はサーバーに保存されません
          </footer>

        </main>
      </div>
    </TooltipProvider>
  )
}
