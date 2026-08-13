# Development foundation

## Toolchain

- Node.js 24 or newer.
- pnpm 11.18.0, pinned by the root package manifest.
- TypeScript core packages shared by browser and Node consumers.
- Svelte 5 + Vite for the web client.
- Go is reserved for self-contained data-format workers; Python is confined to
  the Dockerized Maia sidecar.
- Docker Compose is required for the packaged engine-backed experience.

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
| `workers` | Isolated data workers and the containerized Maia sidecar |
| `content/packs` | Reviewed drill packs |
| `content/drafts` | Versioned author/reviewer workspace; development-only serving |
| `schemas` | Living JSON Schemas |

Internal package names use the private `@chess-tabiya/*` scope; they are not published
packages.

## Runtime core

`packages/runtime` owns the transport-independent semantics shared by browser and
Node, while `apps/server` supplies the REST, lease, and ratified SQLite binding.
The complete current behavior, wire surface, measured envelope, and limitations
are documented in `docs/branch-runtime.md`. The normative run shape remains
`schemas/drill_run.schema.json` v0.8.

## Commands

```sh
pnpm install
make verify
make build
make test-browser
make pack-check FILE=content/drafts/my-pack.json
make pack-preview FILE=content/drafts/my-pack.json
make up
make up-engines
make down
```

`make verify` is the required local/CI gate and runs strict type checking, Vitest (including
fast-check runtime invariants), and schema/scaffold plus deployment-manifest
verification. `make build` separately proves the Svelte production bundle.
`make test-browser` builds and starts the default mock-backed application and
runs the full Playwright episode in a separate browser CI job.

`make pack-check FILE=<path>` validates a draft against the living pack schema,
the shipped chess lints, and the policies the current server can execute. It
prints errors and warnings with JSON Pointer paths and exits non-zero on an
invalid draft. `make pack-preview FILE=<path>` first runs that check, then
starts the built application in development mode with the selected draft in
the registry; Node restarts the preview when that file changes. Drafts may
replace a reviewed pack with the same id during preview, so edits can be tested
without moving files into `content/packs/`.

Every JSON file beneath a served content directory is treated as a pack unless
its basename is reserved as a sourcing sidecar: `evidence.json`, `sources.json`,
`job.json`, or `priority.json`, including `<pack>.{reserved-name}` flat siblings.
The registry and sidecar resolver share this list. New sidecar kinds must join
that single list before they are placed beside served packs.

`content/drafts/` is committed because the agent-authored, owner-reviewed
revision history is part of the content-production evidence. The registry
reads it only in development mode, rejects an explicit draft in production,
and the Docker build context excludes it entirely.

`make up` starts the production bundle with the deterministic mock opponent.
`make up-engines` adds the healthchecked Maia sidecar and uses Stockfish from
the server image; `make down` stops either profile. The devcontainer references
the same root Compose file and includes Stockfish, so its post-create gate can
run `ENGINES_REQUIRED=1 make verify`.

Tag releases build amd64/arm64 server and Maia images, publish both version and
commit-SHA tags to GHCR, and attach a Compose file with digest-pinned images.
Run that downloaded release file with `docker compose -f compose.yaml up -d`
for the deterministic mock profile, or with
`ENGINE_MODE=maia docker compose -f compose.yaml --profile engines up -d` for
the health-gated Maia profile.
