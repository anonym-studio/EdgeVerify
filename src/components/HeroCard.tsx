import type { ApiResponse } from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'

interface HeroCardProps {
  data: ApiResponse | null
  loading: boolean
}

export function HeroCard({ data, loading }: HeroCardProps) {
  const isTor = data?.security.isTor
  const isVpn = data?.security.isVpnOrProxy
  const isAlert = isTor || isVpn

  return (
    <Card className={`border-2 ${isAlert ? 'border-destructive/30' : 'border-primary/20'}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">

          {/* IP情報 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Your IP Address
            </p>
            {loading ? (
              <>
                <Skeleton className="h-10 w-56 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className={`text-3xl md:text-4xl font-bold tracking-tight ${isAlert ? 'text-destructive' : 'text-primary'}`}>
                    {data?.ip}
                  </span>
                  <Badge variant="outline" className="text-xs">{data?.version}</Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground truncate">
                  {data?.reverse}
                </p>
              </>
            )}
          </div>

          {/* VPN ステータスバッジ */}
          <div className="flex-shrink-0">
            {loading ? (
              <Skeleton className="w-40 h-16 rounded-xl" />
            ) : isTor ? (
              <div className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl border-2 border-destructive/40 bg-destructive/5 text-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-bold text-sm text-destructive">Tor 検出</span>
                <span className="text-[10px] text-muted-foreground">匿名化ネットワーク</span>
              </div>
            ) : isVpn ? (
              <div className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl border-2 border-orange-300 bg-orange-50 text-center">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-sm text-orange-600">VPN / プロキシ</span>
                <span className="text-[10px] text-muted-foreground">{data?.security.vpnDetectionType}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl border-2 border-primary/30 bg-primary/5 text-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm text-primary">通常回線</span>
                <span className="text-[10px] text-muted-foreground">VPN / プロキシ 未検出</span>
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
