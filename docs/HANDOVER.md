# Production Handover

This document walks the receiving team from a fresh laptop to a production
deployment of Pratibha by SPLINK.

---

## 1. What you are receiving

| Item                | Description                                            |
| ------------------- | ------------------------------------------------------ |
| Source code         | This Git repository                                    |
| Backend instance    | Managed Postgres + Auth + Storage + Edge Functions     |
| Domain(s)           | Custom domain(s) configured in DNS (see section 6)     |
| Admin credentials   | Owner email for the backend project (delivered out-of-band) |
| Environment values  | Production `VITE_SUPABASE_*` (delivered out-of-band)   |

> Anything marked "out-of-band" is sent over a separate secure channel —
> never paste secrets into chat, tickets, or this repo.

## 2. Toolchain

| Tool       | Version | Notes                                         |
| ---------- | ------- | --------------------------------------------- |
| Node.js    | 20+     | LTS recommended; only required for tooling    |
| Bun        | 1.x     | Primary package manager and runtime           |
| Git        | 2.30+   | -                                             |
| A modern browser | Chrome 120+ / Firefox 120+ / Safari 17+ | -                          |

## 3. One-command local setup

```bash
git clone <repo-url>
cd pratibha-splink
./scripts/setup.sh
```

The script will: verify the toolchain, copy `.env.example` to `.env`,
install dependencies, run unit tests, and build for production. After it
finishes, edit `.env` with the values you received out-of-band.

## 4. Manual setup (if the script can't run)

```bash
cp .env.example .env       # then edit with real values
bun install
bun run test               # 117 unit tests must pass
bun run build              # produces ./dist
bun run dev                # http://localhost:8080
```

## 5. Environment variables

See [.env.example](../.env.example) for the full template with comments.

| Variable                          | Where it lives | Required |
| --------------------------------- | -------------- | -------- |
| `VITE_SUPABASE_URL`               | client `.env`  | yes      |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | client `.env`  | yes      |
| `VITE_SUPABASE_PROJECT_ID`        | client `.env`  | yes      |
| `SUPABASE_SERVICE_ROLE_KEY`       | backend secret | yes      |
| `SUPABASE_DB_URL`                 | backend secret | yes      |
| `LOVABLE_API_KEY`                 | backend secret | yes (LLM features) |
| `PLAYWRIGHT_BASE_URL`             | CI env         | no       |

## 6. Production deploy

Pratibha is a static SPA. The recommended host is any CDN-backed static
service (Cloudflare Pages, AWS S3 + CloudFront, Nginx, Azure Static Web
Apps, MeghRaj, etc.).

```bash
bun run build      # outputs ./dist
# upload ./dist to your host of choice
```

DNS — point your domain (e.g. `pratibha.example.gov.in`) to the host with
either a CNAME or A record. Enable HTTPS via the host's certificate
manager. SPA fallback (serve `index.html` for unknown paths) must be
enabled or page refreshes on deep links will 404.

For a step-by-step walkthrough see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 7. Backend operations

- Database migrations live under `supabase/migrations/`. Apply via the
  managed dashboard's SQL editor or the Supabase CLI.
- Edge functions auto-deploy when their source under `supabase/functions/`
  changes.
- Secrets are managed in the backend dashboard under Project Settings →
  Edge Functions → Secrets. The client never sees them.

## 8. First-user admin

The first user to sign up is auto-promoted to `admin` via the
`promote_first_user_to_admin` database trigger. Subsequent users default
to `viewer` and can be promoted from the in-app Admin panel by an
existing admin.

## 9. Smoke test after deploy

1. Open the production URL — landing page renders.
2. Sign in with Google — redirected to `/explorer`.
3. Open Explorer (`/explorer`) — the locked Bihar U14 demo dataset loads.
4. Open one athlete profile — radar chart, recommendations, and report
   tabs render.
5. Open Analytics (`/analytics`) — National Band distribution chart renders.
6. Switch language EN → हिं in the top header — UI strings translate.
7. Open Reports (`/reports`) → generate one PDF — downloads successfully.

If any step fails, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## 10. Support escalation

| Layer             | Owner                         | Channel                |
| ----------------- | ----------------------------- | ---------------------- |
| Frontend / UX     | Receiving engineering team    | Internal ticketing     |
| Backend / DB      | Receiving DevOps team         | Internal ticketing     |
| Authentication    | OAuth provider (Google)       | Google Cloud Console   |
| Hosted LLM        | LLM gateway provider          | Provider dashboard     |
| Compliance / DPDP | SPLINK Technologies (90-day handover support) | <support@splink>  |
