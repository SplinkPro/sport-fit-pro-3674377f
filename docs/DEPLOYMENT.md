# Deployment Guide

Pratibha is a static React/Vite SPA. The build artefact (`./dist`) can be
hosted on any CDN-backed static service.

## Build

```bash
bun install
bun run build
```

Output: `./dist` (~3 MB gzipped including the TF.js pose model).

## Generic static hosts

### Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name pratibha.example.gov.in;

  root /var/www/pratibha/dist;
  index index.html;

  # SPA fallback — serve index.html for unknown paths
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long-term cache for hashed assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # No-cache for the entry HTML
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
```

### Cloudflare Pages

1. Connect the Git repository.
2. Build command: `bun run build`
3. Build output directory: `dist`
4. Add the three `VITE_SUPABASE_*` variables under Settings → Environment
   variables.
5. SPA fallback is automatic.

### AWS S3 + CloudFront

1. Upload `dist/` contents to an S3 bucket (versioning on).
2. CloudFront distribution → custom error responses → map 403 and 404 to
   `/index.html` with HTTP 200 (SPA fallback).
3. Set cache behavior: `/assets/*` → 1y immutable, `/*` → no-cache.

### Self-hosted Docker

Create a `Dockerfile` at the project root:

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Inline a minimal SPA-fallback config so deep links survive page refresh.
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  location / { try_files $uri $uri/ /index.html; }' \
    '  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }' \
    '}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Build and run:

```bash
docker build -t pratibha-splink .
docker run --rm -p 8080:80 pratibha-splink
```

## Backend deployment

Database migrations live under `supabase/migrations/` and are applied via
the backend dashboard's SQL editor or the Supabase CLI:

```bash
supabase db push
```

Edge functions are auto-deployed when their source under
`supabase/functions/` changes (managed by the platform).

## DNS

Add a CNAME (or A record) for your domain pointing at the host. Allow up
to 24 hours for propagation.

## Monitoring & logging

- Frontend errors: configure your host's error reporting (e.g. Cloudflare
  Web Analytics, Sentry, GA4) by adding a small init snippet in `index.html`.
- Backend logs: available in the backend dashboard under Logs.
- Edge function logs: dashboard → Edge Functions → Logs.

## Rollback

Static deploys are immutable. Roll back by re-deploying the previous
`dist` artefact (keep the last 5 builds in versioned object storage).

## Performance budget

| Metric               | Target  |
| -------------------- | ------- |
| First Contentful Paint | < 1.5s |
| Time to Interactive    | < 3.5s |
| Largest Contentful Paint | < 2.5s |
| Initial JS (gzipped)   | < 200 KB |

The pose-analysis page lazy-loads TF.js (~412 KB gzipped) on demand only.
