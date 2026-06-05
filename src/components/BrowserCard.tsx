import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BrowserInfo } from '@/types/api'

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xs break-all">{value}</span>
    </div>
  )
}

export function BrowserCard({ browser, loading }: { browser: BrowserInfo | null; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          ブラウザ環境
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !browser ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <Cell label="画面解像度" value={browser.screenResolution} />
            <Cell label="ウィンドウサイズ" value={browser.windowSize} />
            <Cell label="色深度" value={browser.colorDepth} />
            <Cell label="言語" value={browser.language} />
            <Cell label="タイムゾーン" value={browser.timezone} />
            <Cell label="Cookie" value={browser.cookies} />
            <Cell label="Do Not Track" value={browser.doNotTrack} />
            <Cell label="タッチ" value={browser.touch} />
            <Cell label="CPU コア数" value={String(browser.cpuCores)} />
            <Cell label="デバイスメモリ" value={browser.memory} />
            <Cell label="ローカル IP" value={browser.localIP ?? 'ブラウザによって保護されています'} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
