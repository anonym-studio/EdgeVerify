# GitHub Copilot Instructions — EdgeVerify

## Project Summary

EdgeVerify is a **serverless network info checker** built on Cloudflare Pages + Pages Functions.
It shows visitors their IP address, ISP, VPN/proxy status, geolocation, and TLS details.
No data is ever stored — the backend is completely stateless.

## Stack

- **Backend**: Cloudflare Pages Functions (ES Modules, Workers runtime — not Node.js)
- **Frontend**: Plain HTML + Tailwind CSS (CDN) + Vanilla JavaScript
- **External**: ip-api.com for reverse DNS and ISP enrichment

## File Roles

| File | Role |
|------|------|
| `functions/api/info.js` | Edge function serving `GET /api/info` |
| `index.html` | Frontend SPA — fetches `/api/info` and renders results |

## What to Suggest

### Backend (`functions/`)

```js
// Correct pattern
export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf || {};  // Always guard: cf is {} in local dev
  // ...
  return new Response(JSON.stringify(data), { headers: { ... } });
}
```

- Use `context.request.cf` for Cloudflare metadata (ASN, geo, threat score, etc.)
- Use `fetch()` for external HTTP calls (Workers fetch API, not Node's)
- Always include `Cache-Control: no-store` in responses
- Handle ip-api.com failures gracefully — it rate-limits at 45 req/min and is HTTP-only

### Frontend

- Use `fetch('/api/info')` — same-origin, no auth needed
- Use `navigator.language`, `screen.width/height` for browser-side data
- WebRTC local IP detection: modern browsers mask it with mDNS UUIDs — show a friendly message on failure
- No framework imports. No `import` statements in HTML script tags.

## What NOT to Suggest

- Do not suggest `require()` — this is ES Modules
- Do not suggest Node.js built-ins (`fs`, `path`, `crypto` from Node) — Workers runtime only
- Do not suggest adding a database or any persistence layer
- Do not suggest logging user IPs or connection data to external services
- Do not suggest React, Vue, or any JS framework for the frontend
- Do not suggest HTTPS URLs for ip-api.com (free tier is HTTP only)

## Security Rules

- Never write code that persists user connection data
- Keep `Cache-Control: no-store` on all API responses
- Sanitize any data rendered to DOM to prevent XSS (use `textContent`, not `innerHTML`)
