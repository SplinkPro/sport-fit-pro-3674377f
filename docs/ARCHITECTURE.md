# Architecture

This document gives a high-level tour of the Pratibha codebase for new
engineers picking up the project.

## Overview

Pratibha is a single-page React application backed by a managed Postgres
database, file storage, and serverless edge functions. The client is fully
static and deployable to any CDN; all stateful work happens in the backend
layer.

```
                +----------------------+
   Browser ---> |   Vite SPA (this repo)
                +----------+-----------+
                           |
                  HTTPS / JWT (RLS)
                           |
                +----------v-----------+
                |  Postgres + Auth +   |
                |  Edge Functions +    |
                |  Object Storage      |
                +----------------------+
```

## Application layers

### 1. Routing (`src/App.tsx`)

`react-router-dom` v6, with route-level code splitting via `React.lazy`.
Three guards: `RootRoute` (public landing redirect), `RequireAuth`, and
`RequireAdmin` (RBAC).

### 2. Pages (`src/pages/`)

Top-level screens. Each page is small and delegates to feature components.
Pages do not contain business logic — they orchestrate.

### 3. Modules (`src/modules/`)

Self-contained verticals (e.g. `badminton/`) with their own routes, pages,
data, and engines. Modules can be developed and removed in isolation.

### 4. Engines (`src/engine/`, `src/modules/*/engine.ts`)

Pure functions that compute scores, percentiles, and recommendations. No
React, no I/O — fully unit-testable.

### 5. Data (`src/data/`)

Static reference data: SAI / Khelo India / IAP benchmarks, sport profiles,
seed athletes for demos. Treated as read-only.

### 6. Integrations (`src/integrations/`)

Thin wrappers around third-party SDKs. App code imports from these wrappers
rather than from the underlying packages, so providers can be swapped out
without rippling changes.

- `supabase/` — auto-generated database client and types.
- `auth/`     — OAuth bridge re-exports.

### 7. i18n (`src/i18n/`)

Two flat translation dictionaries (`en.ts`, `hi.ts`) consumed via
`useTranslation()`. All user-facing copy must round-trip through the
dictionaries.

### 8. UI (`src/components/ui/`)

shadcn-ui primitives. Do not edit these unless you are deliberately
forking the design system. Build app-specific components in sibling folders.

## Data flow

```
  user action
      |
      v
  React component  --(TanStack Query mutation/query)-->  Supabase client
      |                                                       |
      v                                                       v
  optimistic UI                                          Postgres + RLS
      ^                                                       |
      |                                                       v
   query cache <--(realtime channel or invalidation)----  changes
```

## Testing

- **Unit**: Vitest, `src/test/`. Engines and pure utilities are covered
  with high coverage; components only where they encode logic.
- **End-to-end**: Playwright, `tests/e2e/` (added on demand).

## Build pipeline

`vite build` produces:

- Hashed JS chunks (`vendor-react`, `vendor-radix`, `vendor-charts`,
  `vendor-query`, route chunks, app entry).
- Inlined assets under 4 KB.
- No sourcemaps in production.

The `PoseAnalysisPage` chunk is large by design — it ships the TF.js model
runtime and is only loaded when a user opens pose analysis.

## Conventions

- Design tokens, not raw colors.
- Named exports unless interop forces default exports.
- Files under 300 LOC where possible; split when they exceed that.
- Database changes go through timestamped migrations under `supabase/migrations/`.
