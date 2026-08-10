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

The implemented §1–4 surface includes run creation, legal move commits, implicit forks
after rewind, explicit empty branches, cursor-only rewind, checkpoint segment derivation,
event read-back/projection, typed errors, the engine-free objective state machine,
authoritative opponent read-back, branch comparison, legal PGN variation export, and the
rewind job-observer hook, invariant properties, and the deterministic vertical acceptance
scenario. Server lease enforcement belongs to §5. The normative wire shape is the living
`schemas/drill_run.schema.json` v0.2; `packages/schema` owns its version constant.

Objective transition rules use only deterministic local evidence: checkmate, stalemate,
runtime-provable draws, material balance in pawn units, FEN piece/pawn-structure/transpose-key
predicates, and checkpoint reach on the active path. State changes follow the RFC graph and
are rejected without evidence references. A data-only asynchronous upgrader interface marks
the future worker boundary; §2 does not apply worker proposals or introduce engines.

Opponent replay reads logged `opponent.move_selected` events and requires the next event to
be the matching opponent commit; it never invokes a policy. Comparison aligns branch nodes
after their last common fork and returns absent-side marking, objective timelines, and
checkpoint hits. PGN export uses chessops to verify every move, SAN, and resulting FEN before
writing selected branches as variations.

Latency instrumentation exercises full-log projection, rewind, and implicit fork+commit at
200 and 1000 events without making timing a flaky CI assertion. The dated measured values
and methodology live in `planning/branch-runtime/log.md`.

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
