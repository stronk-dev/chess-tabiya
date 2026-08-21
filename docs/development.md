# Development foundation

## Toolchain

- Node.js 24 or newer.
- pnpm 11.18.0, pinned by the root package manifest.
- TypeScript core packages shared by browser and Node consumers.
- Svelte 5 + Vite for the web client.
- Go is reserved for self-contained data-format workers; Python is confined to
  the Dockerized Maia sidecar.
- Docker Compose is required for the packaged engine-backed experience.
- Stockfish 18 is the supported judge version. Host development may use a native Stockfish 18;
  CI, the devcontainer, and production install the same official release through the shared,
  checksum-pinned `tools/install-stockfish-linux.sh` path.

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
`schemas/drill_run.schema.json` v0.9.

## Commands

```sh
pnpm install
make verify
make register-check
make status-parity
make build
make test-browser
make pack-check FILE=content/drafts/my-pack.json
make pack-preview FILE=content/drafts/my-pack.json
make tablebase-walk FILE=content/drafts/my-pack.json OFFLINE=1
make expression-census OUT=/tmp/expression-census.json
make up
make up-engines
make down
```

`make verify` is the required local/CI gate and runs strict type checking, Vitest (including
fast-check runtime invariants), and schema/scaffold plus deployment-manifest
verification. It also runs `make register-check`, which joins every active RFC's
`tabiya-claims` declaration to the six shared-resource registers, derives their landed heads
from the tree, refuses collisions, and prints the current next lanes. `make build` separately
proves the Svelte production bundle. `make status-parity` binds the Active and Archive tables to
their files, compares lifecycle tokens, and refuses malformed or ownerless surviving obligations.
`make test-browser` builds and starts the default mock-backed application and
runs the full Playwright episode in a separate browser CI job.

GitHub Actions pins the GA `ubuntu-24.04` runner instead of following `ubuntu-latest`, but it does
not use Ubuntu's Stockfish package: that package is version 16, Ubuntu 26.04's preview runner offers
version 17, and the production Bookworm package is version 15.1. Pinning the engine artifact rather
than the operating system keeps the UCI contract and chess output aligned with local Stockfish 18.
The real-engine test refuses every other reported Stockfish version.

Tests use committed artifacts when the production path consumes an artifact. When
an external instrument cannot run in the unit gate, its captured fixture carries
machine-readable instrument, request, model, image, and retrieval provenance.
Negative tests minimally mutate such an artifact when possible. Whole-tree refusal
discovery records existing unpinned debt beneath a frozen ceiling and rejects growth, while
`SourcingError.code` is a closed compile-time vocabulary.

Production functions whose inputs come directly from an external instrument carry the
`@instrument-fed` source marker. The fixture-realism gate discovers those declarations and
requires a register entry resolving to captured boundary evidence; a newly marked function
cannot be absorbed without such a fixture.

`make pack-check FILE=<path>` validates a draft against the living pack schema,
the shipped chess lints, and the policies the current server can execute. It
prints errors and warnings with JSON Pointer paths and exits non-zero on an
invalid draft. `make pack-preview FILE=<path>` first runs that check, then
starts the built application in development mode with the selected draft in
the registry; Node restarts the preview when that file changes. Drafts may
replace a reviewed pack with the same id during preview, so edits can be tested
without moving files into `content/packs/`.

`make tablebase-walk` is the read-only Syzygy authoring instrument. It accepts one pack or
a newline-delimited FEN file, can enumerate learner decisions, and writes only its report
when `OUT` is supplied. It never promotes or rewrites content.

`make expression-census` is the offline, report-only structural-expression instrument. It
separates corpus coverage from three-valued satisfiability and never treats a zero firing count
as a defect. See `docs/expression-census.md`. `shape-check` also accepts `PROBE=`, comma/glob
multi-file `FILE=`, and opt-in `CORPUS=` warnings.

Every pack-shaped JSON file beneath a served content directory is treated as a
pack unless its basename is reserved as a sourcing sidecar (`evidence.json`,
`sources.json`, `job.json`, or `priority.json`, including flat siblings) or it
ends in `.browser.json`. The registry and sidecar resolver share the sidecar
list; browser fixtures enter only through explicit development injection.
New sidecar kinds must join the single reserved list before placement beside
served packs.

`content/drafts/` is committed because the agent-authored, owner-reviewed
revision history is part of the content-production evidence. The registry
serves committed drafts in every environment as `community` content labelled
**unreviewed draft**. The Docker build therefore includes the directory.
Explicit extra draft paths remain development-only.

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
