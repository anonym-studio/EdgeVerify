import { useState, useEffect, useCallback } from 'react'
import type { ApiResponse, BrowserInfo, Snapshot } from '@/types/api'

function getLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      const timer = setTimeout(() => { pc.close(); resolve(null) }, 3000)

      pc.onicecandidate = (e) => {
        if (!e.candidate) return
        const m = /(\d{1,3}(?:\.\d{1,3}){3})/.exec(e.candidate.candidate)
        if (m && !m[1].startsWith('0.') && m[1] !== '127.0.0.1') {
          clearTimeout(timer)
          pc.close()
          resolve(m[1])
        }
      }

      pc.createOffer().then(o => pc.setLocalDescription(o))
    } catch {
      resolve(null)
    }
  })
}

function collectBrowserInfo(localIP: string | null): BrowserInfo {
  return {
    screenResolution: `${screen.width} × ${screen.height}`,
    windowSize: `${window.innerWidth} × ${window.innerHeight}`,
    colorDepth: `${screen.colorDepth} bit`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookies: navigator.cookieEnabled ? '有効' : '無効',
    doNotTrack: navigator.doNotTrack === '1' ? '有効' : '無効',
    touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? '対応' : '非対応',
    cpuCores: navigator.hardwareConcurrency ?? '—',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '非公開',
    localIP,
  }
}

export function useConnectionInfo() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [browser, setBrowser] = useState<BrowserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [apiData, localIP] = await Promise.all([
        fetch('/api/info').then(r => r.json() as Promise<ApiResponse>),
        getLocalIP(),
      ])
      setData(apiData)
      setBrowser(collectBrowserInfo(localIP))
    } catch {
      setError('接続情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const snapshot: Snapshot | null = data && browser ? { ...data, browser } : null

  return { data, browser, loading, error, snapshot, reload: load }
}
