# EdgeVerify — AI Agent Instructions

## Project Overview

EdgeVerify is a serverless web app running on Cloudflare Pages + Pages Functions.
It visualizes a visitor's connection info (IP, ISP, VPN/proxy detection, geolocation) in real time.
No user data is persisted anywhere — backend is stateless by design.

## Repository Structure

```
EdgeVerify/
├── src/
│   ├── main.tsx / App.tsx       # React entry + root component
│   ├── index.css                # Tailwind CSS v4 + shadcn/ui vars (orange theme)
│   ├── types/api.ts             # API response type definitions
│   ├── lib/utils.ts             # cn() utility
│   ├── hooks/useConnectionInfo.ts
│   └── components/
│       ├── ui/                  # shadcn/ui components
│       ├── HeroCard.tsx
│       ├── InfoCard.tsx
│       ├── BrowserCard.tsx
│       └── CopyButton.tsx
├── functions/api/info.js        # Edge function → GET /api/info
├── dist/                        # Build output (gitignored)
├── docs/
├── index.html                   # Vite entry HTML
├── vite.config.ts
├── components.json              # shadcn/ui config (baseColor: orange)
└── wrangler.toml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Pages Functions (ES Modules, Workers runtime) |
| Frontend | React 19 + TypeScript + Vite 5 |
| UI | shadcn/ui + Tailwind CSS v4 (white base, orange accent) |
| External API | ip-api.com (reverse DNS, ISP enrichment) |

## Development

```bash
pnpm install

pnpm dev            # Vite + Wrangler concurrently → open http://localhost:8788
pnpm build          # tsc + vite build → dist/
pnpm ship         # build + wrangler pages deploy dist
```

## Coding Rules

- **Backend** (`functions/`): ES Modules only — `export async function onRequest(context)`
- **Frontend**: React function components + TypeScript. Do not add new dependencies.
- shadcn/ui components live in `src/components/ui/`.
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
