# EdgeVerify — AI Agent Instructions

## Project Overview

EdgeVerify is a serverless web app running on Cloudflare Pages + Pages Functions.
It visualizes a visitor's connection info (IP, ISP, VPN/proxy detection, geolocation) in real time.
No user data is persisted anywhere — backend is stateless by design.

## Repository Structure

```
EdgeVerify/
├── index.html              # Frontend SPA (Tailwind CSS CDN + Vanilla JS)
├── functions/
│   └── api/
│       └── info.js         # Edge function → GET /api/info
├── docs/
│   ├── architecture.md     # System architecture
│   ├── api-spec.md         # API response fields reference
│   └── vpn-detection.md    # VPN/proxy detection logic
├── spec/                   # Original design spec (Japanese)
├── package.json
└── wrangler.toml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Pages Functions (ES Modules, Workers runtime) |
| Frontend | HTML + Tailwind CSS (CDN) + Vanilla JS |
| External API | ip-api.com (reverse DNS, ISP enrichment) |

## Development

```bash
npm install
npm run dev     # Starts at http://localhost:8788
npm run deploy  # Deploys to Cloudflare Pages
```

## Coding Rules

- **Backend** (`functions/`): ES Modules only — `export async function onRequest(context)`
- **Frontend**: Vanilla JS only. No JS libraries beyond Tailwind CDN.
- Comments only when the *why* is non-obvious (not what the code does).
- On error: never throw unhandled exceptions; set fallback values and return a valid response.

## Key Constraints

| Constraint | Detail |
|-----------|--------|
| `request.cf` in local dev | Always `{}` — fallback values (`"Unknown"`, `0`, `false`) will appear |
| ip-api.com free tier | HTTP only (no HTTPS), rate limit: 45 req/min |
| `cf.isTor` | Unofficial Cloudflare property — may not work; fall back to keyword match |
| `cf.botManagement.score` | Cloudflare paid plan only — always `"N/A"` on free tier |

## Security Requirements

- Never log or persist user connection data on the backend.
- All responses must include `Cache-Control: no-store`.
- HTTPS is enforced by Cloudflare infrastructure.

## Reference Docs

- `docs/architecture.md` — request flow, component breakdown, data source table
- `docs/api-spec.md` — full response schema with field descriptions
- `docs/vpn-detection.md` — VPN/proxy detection logic and known limitations
