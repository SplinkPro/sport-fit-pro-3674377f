# Pratibha by SPLINK

AI-powered athlete assessment and development platform built on Sports Authority
of India (SAI) research and Indian benchmarks. Bilingual (English / हिंदी),
DPDP Act 2023 compliant, with a zero data-access architecture.

> Status: production · Version: 1.0.0 · Maintainers: SPLINK Technologies

---

## Stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Frontend         | React 18, TypeScript 5, Vite 5                        |
| UI               | Tailwind CSS 3, Radix UI / shadcn-ui, Framer Motion   |
| State / Data     | TanStack Query, Supabase JS SDK                       |
| ML / Pose        | TensorFlow.js + MoveNet (pose detection)              |
| AI Services      | Hosted LLM gateway (Gemini 2.5 / GPT-class)           |
| Testing          | Vitest (unit), Playwright (e2e)                       |
| Tooling          | ESLint 9, TypeScript-ESLint, PostCSS, Autoprefixer    |

## Repository layout

```
src/
  components/      Reusable UI and feature components (shadcn-based)
  pages/           Route-level pages (lazy loaded via React.lazy)
  modules/         Self-contained verticals (e.g. badminton)
  engine/          Pure analytics / scoring engines
  data/            Static reference data (benchmarks, seed data, sports config)
  hooks/           Cross-cutting React hooks
  i18n/            English + Hindi translation dictionaries
  integrations/    Third-party SDK wrappers (Supabase, Auth)
  lib/             Generic utilities (csv parser, formatters, cn())
  test/            Vitest unit tests
docs/              Architecture and contributor documentation
supabase/          Database migrations and configuration
```

## Local development

Requirements: Node.js 20+ and [Bun](https://bun.sh) 1.x.

```bash
bun install
bun run dev          # http://localhost:8080
```

## Available scripts

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Start the Vite dev server with HMR       |
| `bun run build`      | Production build to `dist/`              |
| `bun run build:dev`  | Development-mode build (sourcemaps on)   |
| `bun run preview`    | Serve the production build locally       |
| `bun run lint`       | Run ESLint across the project            |
| `bun run test`       | Run the Vitest unit-test suite           |
| `bun run test:watch` | Vitest in watch mode                     |

## Environment

The runtime reads the following variables from `.env` (provisioned at deploy time):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

No server secrets are bundled into the client.

## Build & deploy

`bun run build` emits a static SPA into `dist/`. Deploy to any static host
(Nginx, Cloudflare Pages, S3 + CloudFront, MeghRaj, etc.). The platform
backend (database, storage, edge functions) is provisioned separately via
the migrations under `supabase/`.

## Documentation

- [Architecture overview](docs/ARCHITECTURE.md)
- [Contributing guide](CONTRIBUTING.md)

## License

Proprietary © SPLINK Technologies. All rights reserved. See [LICENSE](LICENSE).
