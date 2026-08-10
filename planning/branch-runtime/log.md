# branch-runtime — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted after adversarial review (BR-C1..C8 all resolved; rulings in
  `planning/exploration/log.md` and RFC changelog).
- Plan created. Doctrine: TS core + Go workers; Svelte 5; Maia = containerized
  UCI sidecar (not needed for this RFC — mock opponent only).
- Next: codex session 1 → scaffold (§0) + core tree (§1).

## 2026-08-12 (codex, session 1) — §0 scaffold

- Added the pnpm workspace: shared runtime/schema packages, Node server binding, Svelte 5
  web smoke app, future workers/content/schema directories, strict shared TypeScript config,
  and neutral module boundaries under the settled `@chess-tabiya/*` scope.
- Added the root `make verify` gate (typecheck + Vitest + scaffold/schema check), separate
  production build target, repository-local pnpm store/cache/state, pinned dependencies,
  AGPL-3.0 license, and a single GitHub Actions workflow.
- Tests exercise the shared runtime import in Node/browser consumers, the pinned chessops
  rules package, fast-check, manifests/layout, license, cache policy, Make target, lockfile,
  and CI commands.
- Concurrency note: the scaffold files were swept into Claude's simultaneous naming commit
  `da84056`; this follow-up carries the strengthened scaffold verifier and the §0 completion
  record rather than rewriting shared history.
- Next: §1 living `drill_run` v0.2 schema and path-keyed core tree/events.
