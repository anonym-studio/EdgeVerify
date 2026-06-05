import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CopyButton } from '@/components/CopyButton'
import type { SecurityInfo, GeoInfo } from '@/types/api'

interface Row {
  label: string
  value: string
  tooltip?: string
}

interface InfoCardProps {
  title: string
  rows: Row[]
  loading: boolean
  security?: SecurityInfo
  securityTooltips?: Record<string, string>
  geo?: GeoInfo
}

function ThreatScore({ score }: { score: number }) {
  const { label, className } =
    score === 0  ? { label: '安全',    className: 'text-green-600' } :
    score <= 20  ? { label: '低リスク', className: 'text-green-500' } :
    score <= 50  ? { label: '中リスク', className: 'text-orange-500' } :
                   { label: '高リスク', className: 'text-destructive' }

  return (
    <span className={className}>
      <span className="font-bold">{score}</span>
      <span className="text-muted-foreground text-[10px] ml-1">/ 100 — {label}</span>
    </span>
  )
}

function Label({ text, tooltip }: { text: string; tooltip?: string }) {
  if (!tooltip) {
    return <span className="text-xs text-muted-foreground flex-shrink-0 leading-5">{text}</span>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground flex-shrink-0 leading-5 cursor-help underline decoration-dashed decoration-muted-foreground/40 underline-offset-2">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-60 text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function DataRow({ label, value, tooltip }: Row) {
  return (
    <div className="flex items-start justify-between gap-3 group min-h-5">
      <Label text={label} tooltip={tooltip} />
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-xs text-right break-all leading-5">{value || '—'}</span>
        {value && value !== '—' && <CopyButton text={value} />}
      </div>
    </div>
  )
}

function SecurityLabel({ text, tooltip }: { text: string; tooltip?: string }) {
  return <Label text={text} tooltip={tooltip} />
}

export function InfoCard({ title, rows, loading, security, securityTooltips = {}, geo }: InfoCardProps) {
  const hasMap = geo && geo.latitude !== 'Unknown' && geo.longitude !== 'Unknown'

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))
        ) : (
          <>
            {security && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <SecurityLabel text="VPN / プロキシ" tooltip={securityTooltips['vpn']} />
                  <span className={`text-xs font-medium ${security.isVpnOrProxy ? 'text-orange-500' : 'text-green-600'}`}>
                    {security.isVpnOrProxy ? `検出 — ${security.vpnDetectionType}` : '未検出'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <SecurityLabel text="Tor" tooltip={securityTooltips['tor']} />
                  <span className={`text-xs font-medium ${security.isTor ? 'text-destructive' : 'text-green-600'}`}>
                    {security.isTor ? '検出' : '未検出'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <SecurityLabel text="脅威スコア" tooltip={securityTooltips['threat']} />
                  <ThreatScore score={security.threatScore} />
                </div>
              </>
            )}
            {rows.map(row => <DataRow key={row.label} {...row} />)}
            {hasMap && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${geo.latitude}&mlon=${geo.longitude}&zoom=12`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-primary hover:underline pt-1"
              >
                地図で見る ↗
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
