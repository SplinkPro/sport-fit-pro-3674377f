# Troubleshooting

Common issues observed during local setup and production rollout.

---

## Local development

### `bun: command not found`
Install Bun: `curl -fsSL https://bun.sh/install | bash`. On Windows, use
WSL2 or download from https://bun.sh.

### `bun install` fails with 401 / 403
Stale npm token in `.npmrc`. Remove `.npmrc`, retry `bun install`.

### Dev server starts but shows a blank page
1. Open browser devtools → Console.
2. If you see "Failed to fetch dynamically imported module", hard-refresh
   (Ctrl/Cmd + Shift + R). The app self-recovers from stale chunks.
3. If you see "Missing Supabase env", check `.env` exists and contains
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Port 8080 already in use
Edit `vite.config.ts` → `server.port` or run with a different port:
`bun run dev --port 5173`.

### Tests fail with "ReferenceError: window is not defined"
You added a browser-only API to a module that's imported by a test.
Either guard with `typeof window !== "undefined"` or move the code into
a component.

---

## Authentication

### Google sign-in opens, then redirects to login again
- The OAuth callback URL in Google Cloud Console must include your
  deployed origin (e.g. `https://pratibha.example.gov.in/auth/callback`
  AND the bare origin).
- The backend project's Site URL and Redirect URLs (Auth settings) must
  also include your deployed origin.

### "Sign-in failed: invalid token"
Backend `SUPABASE_URL` and the client `VITE_SUPABASE_URL` are pointing at
different projects. Re-check `.env` against the dashboard.

### Logged in but sidebar shows no admin panel
First-user auto-promote only triggers on the very first signup. Promote
manually via SQL:
```sql
update public.user_roles set role = 'admin' where user_id = '<uuid>';
```

---

## Data / database

### Explorer page shows "0 athletes" in production
- Confirm the database migrations have been applied.
- Confirm RLS policies allow the current user's role to `select` from
  the relevant tables. The default `viewer` role has read access.
- If using the Bihar demo dataset, confirm `seedAthletes.ts` data has
  been imported via Settings → Import.

### Imports silently drop rows
The import wizard rejects rows that fail plausibility gates (e.g. sprint
times outside 8–25 s). Check the rejection log shown after import.

### Charts show "No data" for sprint metrics
Sprint and 800m metrics use an inverted Y-axis (lower is better). If you
see no data, the underlying values are likely null — verify the import
mapped the right columns.

---

## Deployment

### Page refresh on a deep link returns 404
SPA fallback is not configured. Map all unknown paths to `/index.html`
(see [DEPLOYMENT.md](./DEPLOYMENT.md) for per-host snippets).

### Custom domain shows "Not Secure"
DNS is correct but the host hasn't issued a certificate yet. Wait 5–10
minutes after DNS propagates, then trigger a certificate refresh from the
host dashboard.

### Production build is slow / chunk size warning
Expected. The pose-analysis page (`PoseAnalysisPage`) ships TF.js and is
intentionally large. It is lazy-loaded — the warning does not affect
first-paint performance.

### LLM features (AI Query, summaries) return 500
- Confirm `LOVABLE_API_KEY` (or your replacement LLM gateway secret) is
  set in the backend's edge function secrets.
- Check edge function logs: dashboard → Edge Functions → Logs → filter by
  the failing function name.

---

## Reports / PDF generation

### Hindi text renders as boxes in the PDF
The PDF font does not include Devanagari glyphs. Use a Unicode font
(e.g. Noto Sans Devanagari) and embed it in the report template.

### Report shows wrong percentile
Percentiles are computed from the active benchmark cohort. Verify the
correct cohort is selected in Settings → Benchmarks (default: Khelo
India U14).

---

## Performance

### Initial load > 5 s on slow networks
- Confirm the host serves gzip / brotli on `*.js` and `*.css`.
- Confirm `/assets/*` is cached `1y immutable`.
- Confirm a CDN edge is geographically near your users.

### Pose analysis hangs at "Loading model"
TF.js needs WebGL. On older laptops, fall back to CPU backend by
appending `?backend=cpu` to the page URL. If it still hangs, the model
file may be blocked by a corporate proxy — whitelist
`storage.googleapis.com` and `tfhub.dev`.

---

## When all else fails

1. Capture the browser console output.
2. Capture the Network tab (filter by `Fetch/XHR`, export as HAR).
3. Capture the backend logs for the same time window.
4. File an issue or escalate per [HANDOVER.md §10](./HANDOVER.md#10-support-escalation).
