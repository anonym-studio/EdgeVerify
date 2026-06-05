export interface NetworkInfo {
  asn: string
  org: string
  isp: string
  protocol: string
  tlsVersion: string
  tlsCipher: string
  edgeLocation: string
}

export interface SecurityInfo {
  isTor: boolean
  isVpnOrProxy: boolean
  vpnDetectionType: string
  threatScore: number
  botScore: number | string
}

export interface GeoInfo {
  country: string
  region: string
  city: string
  postalCode: string
  timezone: string
  latitude: string
  longitude: string
}

export interface ApiResponse {
  ip: string
  version: 'IPv4' | 'IPv6'
  reverse: string
  network: NetworkInfo
  security: SecurityInfo
  geo: GeoInfo
  clientHeader: {
    userAgent: string
    language: string
  }
}

export interface BrowserInfo {
  screenResolution: string
  windowSize: string
  colorDepth: string
  language: string
  timezone: string
  cookies: string
  doNotTrack: string
  touch: string
  cpuCores: number | string
  memory: string
  localIP: string | null
}

export interface Snapshot extends ApiResponse {
  browser: BrowserInfo
}
