import { HelpCircle, Shield, Info, AlertTriangle, MousePointer2, Copy, RefreshCw } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-foreground">
        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="pl-6 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="ヘルプを開く"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            EdgeVerify について
          </DialogTitle>
          <DialogDescription>
            IPアドレス・回線品質・セキュリティ状態をリアルタイムで可視化する接続情報チェッカーです。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Section icon={Info} title="確認できる情報">
            <ul className="space-y-1 list-disc list-inside marker:text-primary/60">
              <li>グローバル IP アドレスと接続回線の詳細（ASN・ISP）</li>
              <li>HTTP プロトコルバージョンと TLS 暗号化の状態</li>
              <li>VPN・プロキシ・Tor ネットワークの使用有無</li>
              <li>IP から推定される位置情報（国・都市・座標）</li>
              <li>ブラウザ・端末の環境情報（解像度・言語・CPU コア数など）</li>
            </ul>
          </Section>

          <Section icon={MousePointer2} title="使い方">
            <ol className="space-y-1.5 list-decimal list-inside marker:text-primary/60">
              <li>ページを開くと自動で情報を取得します</li>
              <li>
                <span className="underline decoration-dashed underline-offset-2 decoration-muted-foreground/50">
                  点線下線のあるラベル
                </span>
                にマウスを重ねると項目の説明が表示されます
              </li>
              <li>値の右側に表示されるアイコンから個別にコピーできます</li>
              <li>
                <span className="inline-flex items-center gap-0.5 align-middle font-medium text-foreground">
                  <Copy className="w-3 h-3" /> JSON
                </span>
                {' '}ボタンで全データを JSON 形式でコピーできます
              </li>
              <li>
                <span className="inline-flex items-center gap-0.5 align-middle font-medium text-foreground">
                  <RefreshCw className="w-3 h-3" /> 更新
                </span>
                {' '}ボタンで情報を再取得できます
              </li>
            </ol>
          </Section>

          <Section icon={AlertTriangle} title="注意事項">
            <ul className="space-y-1 list-disc list-inside marker:text-orange-400">
              <li>位置情報は IP から推定されるため、実際の位置と数十 km 程度の誤差があります</li>
              <li>取得した情報はサーバーに一切保存されません</li>
              <li>VPN・プロキシ判定は完全ではなく、誤検知の可能性があります</li>
              <li>ローカル IP はブラウザのプライバシー保護により取得できない場合があります</li>
            </ul>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
