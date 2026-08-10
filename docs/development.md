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

`packages/runtime` owns the transport-independent run model from
`rfc/branch-runtime.md`. Runs are immutable projections of a sequenced event log. Nodes are
path-keyed, retain a normalized four-field FEN `transposeKey`, and link to their parent;
transpositions therefore remain distinct attempts without losing position matching.

The implemented §1 surface includes run creation, legal move commits, implicit forks after
rewind, explicit empty branches, cursor-only rewind, checkpoint segment derivation, event
read-back/projection, and typed errors. Objective evaluation, comparison, PGN export, and
server lease enforcement belong to later plan sections. The normative wire shape is the
living `schemas/drill_run.schema.json` v0.2; `packages/schema` owns its version constant.

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
