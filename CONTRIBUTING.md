# Contributing

Thanks for taking the time to contribute to Pratibha.

## Workflow

1. Create a feature branch off `main`: `git checkout -b feat/<short-name>`.
2. Run `bun install` and verify `bun run dev` boots cleanly.
3. Write code + tests. Keep changes scoped — one feature per PR.
4. Before opening a PR run, in this order:
   ```bash
   bun run lint
   bun run test
   bun run build
   ```
   All three must pass.
5. Open a PR with a clear title, a short description of the change, and a
   screenshot or screen recording for any UI work.

## Coding conventions

- TypeScript strict where practical; avoid `any` outside SDK shims.
- React function components only; prefer hooks over class lifecycles.
- Tailwind utility classes; never inline raw colors — use the design tokens
  defined in `src/index.css` and `tailwind.config.ts`.
- One component per file; co-locate small helpers next to their consumer.
- Avoid implicit globals. All cross-cutting state lives in providers under
  `src/hooks/`.

## Commit style

Conventional commits are encouraged but not enforced:

```
feat(reports): add bilingual export
fix(import): trim leading zeros in NSRS IDs
chore(deps): bump @tanstack/react-query
```

## Reporting issues

File issues with: reproduction steps, expected vs actual behavior, browser
and OS, and any relevant console / network output.
