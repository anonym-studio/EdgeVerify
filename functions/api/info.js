export async function onRequest(context) {
  const { request } = context;

  const ip = request.headers.get("cf-connecting-ip") || "Unknown";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const cf = request.cf || {};

  let rdns = "取得失敗";
  let ispDetail = cf.asOrganization || "Unknown";
  let isVpnOrProxy = false;
  let vpnProviderName = "未検出";

  try {
    const geoResponse = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,reverse,isp,org,as,proxy,hosting`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData.status === "success") {
        rdns = geoData.reverse || "逆引きレコードなし";
        ispDetail = geoData.isp || cf.asOrganization || "Unknown";

        if (geoData.proxy || geoData.hosting) {
          isVpnOrProxy = true;
          vpnProviderName = geoData.hosting ? "ホスティング/データセンター" : "プロキシ/VPN";
        }
      }
    }
  } catch (e) {
    console.error("External API lookup failed:", e.message);
    rdns = "逆引きエラー（制限超過またはタイムアウト）";
  }

  // ip-api.com が未検出でも組織名キーワードで補足判定する
  // "cloudflare" を含むため Cloudflare WARP ユーザーは誤検知される（既知の仕様上の妥協点）
  if (!isVpnOrProxy) {
    const suspiciousKeywords = [
      "vpn", "mullvad", "nordvpn", "expressvpn", "surfshark",
      "tor", "ovh", "digitalocean", "linode",
      "aws", "amazon", "google cloud", "cloudflare",
    ];
    const orgLower = (cf.asOrganization || "").toLowerCase();
    if (suspiciousKeywords.some(kw => orgLower.includes(kw))) {
      isVpnOrProxy = true;
      vpnProviderName = "ホスティング回線/疑似VPN";
    }
  }

  const responseData = {
    ip,
    version: ip.includes(":") ? "IPv6" : "IPv4",
    reverse: rdns,
    network: {
      asn: cf.asn ? `AS${cf.asn}` : "Unknown",
      org: cf.asOrganization || "Unknown",
      isp: ispDetail,
      protocol: cf.httpProtocol || "Unknown",
      tlsVersion: cf.tlsVersion || "N/A",
      tlsCipher: cf.tlsCipher || "N/A",
      edgeLocation: cf.colo || "Unknown",
    },
    security: {
      isTor: cf.isTor || false,
      isVpnOrProxy,
      vpnDetectionType: vpnProviderName,
      threatScore: cf.threatScore || 0,
      botScore: cf.botManagement?.score || "N/A",
    },
    geo: {
      country: cf.country || "Unknown",
      region: cf.region || "Unknown",
      city: cf.city || "Unknown",
      postalCode: cf.postalCode || "Unknown",
      timezone: cf.timezone || "Unknown",
      latitude: cf.latitude || "Unknown",
      longitude: cf.longitude || "Unknown",
    },
    clientHeader: {
      userAgent,
      language: request.headers.get("accept-language") || "Unknown",
    },
  };

  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
