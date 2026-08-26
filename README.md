# Tabiya

[![verify](https://github.com/stronk-dev/chess-tabiya/actions/workflows/verify.yml/badge.svg)](https://github.com/stronk-dev/chess-tabiya/actions/workflows/verify.yml)
[![browser](https://github.com/stronk-dev/chess-tabiya/actions/workflows/browser.yml/badge.svg)](https://github.com/stronk-dev/chess-tabiya/actions/workflows/browser.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

Tabiya is a self-hostable chess rehearsal platform for openings, middlegames, and
endgames. Instead of ending at an engine verdict, it asks you to play a decision
through, rewind, try another plan, compare the consequences, and replay against
different resistance.

The name *tabiya* refers to a familiar position where established opening theory
gives way to play. The project applies that idea to every phase of the game.

## Implemented foundation

- Rewindable run trees: every attempt becomes a branch that can be replayed,
  compared, or exported.
- Line, plan, outcome, and trajectory drills built from validated drill packs.
- Human-oriented opposition infrastructure through Maia policies, with Stockfish
  and Syzygy used for attributed evidence rather than as the default actor.
- Grounded feedback with disclosure timing, authored provenance, structural
  observations, engine records, and human-game corpus facts.
- PGN and repertoire import, return scheduling, pack authoring tools, and shared
  live sessions.
- A Svelte web client, TypeScript runtime and server, SQLite persistence, and
  Docker Compose packaging.

## Project status

Tabiya is pre-1.0 and under active development. The core rehearsal runtime and
application are runnable, but the user experience, evidence selection, assistance
presets, opponent behaviour, content corpus, and release hardening are still being
audited and improved. APIs, schemas, and content may change without compatibility
guarantees.

Current status is maintained in the checked project artifacts rather than copied
into this README:

- [Exploration and release gates](planning/exploration/gates.md)
- [Defect and feature ledger](design/BACKLOG.md)
- [Active RFC register](rfc/README.md)
- [Implemented-system documentation](docs/README.md)
- [Authoritative 1.0 roadmap](planning/roadmap-to-done.md)

## Understand the project

- [Feature and capability map](docs/features.md) — what each work area owns and unlocks, without
  presenting partial machinery as a finished feature.
- [System architecture](docs/architecture.md) — dependency direction, container ownership and the
  main rehearsal, evidence, content and provider flows.
- [Extending Tabiya](docs/extending.md) — where routes, APIs, schemas, migrations, evidence,
  assistance, bots and content belong.
- [Contributing](CONTRIBUTING.md) — the human workflow from idea or defect through verification and
  closeout.

## Quick start with Docker

Requirements: Git and Docker with Compose v2.

```sh
git clone https://github.com/stronk-dev/chess-tabiya.git
cd chess-tabiya
make up
```

Open <http://localhost:3000>, create a local learner account, and choose a pack.
The default profile uses deterministic mock providers, so it does not need engine
downloads or external credentials.

To start the Maia-backed opponent profile instead:

```sh
make up-engines
```

The Maia image is substantially larger and can take longer to build and become
healthy. Stop either profile with:

```sh
make down
```

Set `TABIYA_PORT` to publish a different host port:

```sh
TABIYA_PORT=8080 make up
```

## Development

Requirements:

- Node.js 24
- pnpm 11.18.0
- Docker for packaged or Maia-backed operation
- Stockfish 18 for the real-engine verification path

On Homebrew systems the Makefile selects `node@24` and Stockfish 18 directly when
they are installed. Other platforms use the same `node` and `stockfish`/`SF_CMD`
resolution supplied by PATH or CI; the commands below do not require environment
prefixes.

Install dependencies and run the standard checks:

```sh
make setup
make verify
make build
make test-browser-ci
```

Useful content-authoring commands:

```sh
make pack-check FILE=content/drafts/carlsbad-minority-attack.json
make pack-preview FILE=content/drafts/carlsbad-minority-attack.json
make shape-check FILE=content/shapes/carlsbad.json
make graduation-report
make graduation-plan
```

See [docs/development.md](docs/development.md) for the complete toolchain, engine setup, release
images, and authoring instruments, and [docs/testing.md](docs/testing.md) for the test-tier and CI
contract.

## Architecture

```text
Svelte web client  --HTTP-->  application/server  -->  SQLite
       |                              |
       v                              v
shared runtime + schemas       engines and evidence providers
                                      |
                                      v
                         validated packs and source records
```

| Path | Responsibility |
|---|---|
| `apps/web` | Svelte 5 browser client |
| `apps/server` | HTTP API, persistence, pack registry, and provider orchestration |
| `packages/runtime` | Transport-independent chess rehearsal and branching semantics |
| `packages/schema` | Shared schema-facing types and validation |
| `workers` | Isolated engine and data workers, including the Maia sidecar |
| `content` | Reviewed packs, drafts, shapes, evidence, and sourcing metadata |
| `schemas` | Versioned JSON Schemas |
| `docs` | Canonical documentation for implemented behaviour |
| `design` | Product intent, research, and the shared backlog |
| `rfc` | Accepted implementation contracts and their archive |

Start with these technical documents:

- [System architecture and dependency map](docs/architecture.md)
- [Branch runtime](docs/branch-runtime.md)
- [Drill-pack format](docs/drill-pack-format.md)
- [Drill client](docs/drill-client.md)
- [Engine workers](docs/engine-workers.md)
- [Evidence and explanation grounds](docs/explanation-grounds.md)

## Design boundaries

Tabiya is not intended to become a conventional engine-review screen, a tactics
puzzle collection, or an LLM that invents chess instruction. A branch represents
a learner's attempt, machine-derived claims remain attributed, and generated prose
may render validated evidence but may not grade moves or manufacture chess truth.

The product thesis is documented in [design/00-thesis.md](design/00-thesis.md).

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). The project uses an evidence-first,
RFC-driven workflow: new ideas are ledgered, open product questions are researched,
and product implementations require an accepted RFC. The contributor guide includes
a change-placement decision tree, verification expectations and closeout rules.

## License

The software is licensed under the [GNU Affero General Public License v3.0](LICENSE).
Authored drill prose is published under CC BY-SA 4.0 as recorded in the content
metadata; imported evidence retains its declared source licence and provenance.
