# Development foundation

## Toolchain

- Node.js 24 or newer.
- pnpm 11.18.0, pinned by the root package manifest.
- TypeScript core packages shared by browser and Node consumers.
- Svelte 5 + Vite for the web client.
- Go is reserved for self-contained data-format workers; `workers/` is intentionally empty
  at scaffold time.

The project is licensed under GNU AGPL-3.0. JavaScript dependencies are installed into a
pnpm workspace; pnpm's store/cache/state remain under the ignored repository `.cache/`
directory.

## Workspace

| Path | Role |
|---|---|
| `packages/runtime` | Shared drill-semantics runtime; imported by browser and Node |
| `packages/schema` | Schema-facing types and validation tooling |
| `apps/server` | Node server binding around the shared runtime |
| `apps/web` | Svelte 5 browser client |
| `workers` | Future isolated Go or containerized engine workers |
| `content/packs` | Reviewed drill packs |
| `schemas` | Living JSON Schemas |

Internal package names use the private `@chess-tabiya/*` scope; they are not published
packages.

## Runtime core

`packages/runtime` owns the transport-independent semantics shared by browser and
Node, while `apps/server` supplies the REST, lease, and ratified SQLite binding.
The complete current behavior, wire surface, measured envelope, and limitations
are documented in `docs/branch-runtime.md`. The normative run shape remains
`schemas/drill_run.schema.json` v0.2.

## Commands

```sh
pnpm install
make verify
make build
```

`make verify` is the required local/CI gate and runs strict type checking, Vitest (including
fast-check runtime invariants), and schema/scaffold verification. `make build` separately
proves the Svelte production bundle; it is not part of the RFC-mandated three-part verify
target.
