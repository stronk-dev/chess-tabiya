# System architecture

This document is the stable map of the implemented Tabiya system: where responsibilities live,
which dependencies are allowed, and how the main flows cross the repository. It does not declare
product completion. See `features.md` for capability ownership and
`../planning/roadmap-to-done.md` for current 1.0 status.

## Sources of truth

| Tier | Question it answers |
|---|---|
| `design/` | What product are we trying to build? |
| `planning/roadmap-1.0.json` | Which 1.0 capability owns the remaining work? |
| `rfc/` | What accepted contract authorizes a product implementation? |
| `docs/` | What behavior exists in the current tree? |
| `schemas/` and shared-resource registers | Which persisted and exchanged shapes are versioned? |
| Tests and generated receipts | Does the implementation still satisfy those contracts? |

When these disagree, do not silently pick the most convenient document. Record the disagreement in
`design/BACKLOG.md` and follow the reconciliation rules in `AGENTS.md` and RFC-0000.

## System context

```text
learner / author / coach / spectator
                  |
                  v
        Svelte web application
                  |
             HTTP + JSON
                  |
                  v
        production application root
          |        |         |
          v        v         v
      services   SQLite   provider orchestration
          |                    |
          v                    v
   shared runtime       Stockfish / Maia / Syzygy /
   and schemas          Explorer / optional voice
          |
          v
  packs, shapes, principles and recorded evidence
```

The production application root is `apps/server/src/application.ts`. A handler, reducer, registry or
worker existing in isolation is not proof that a capability is available: it must be composed there,
cross the HTTP boundary where appropriate, and be exercised by a production-boundary or browser
test.

## Dependency direction

```text
schemas/*.json
     |
     v
packages/schema
     |
     +------------------+
     v                  v
packages/runtime    apps/server
     |                  ^
     +--------+---------+
              v
           apps/web  --HTTP-->  apps/server

workers and external providers are reached through server-owned adapters.
content is validated and projected by the server; the browser never receives private
answers or unrestricted source records merely because they exist on disk.
```

- `packages/schema` owns shared schema versions, schema-facing types and validation helpers.
- `packages/runtime` owns transport-independent chess and rehearsal semantics. It may depend on
  `packages/schema`, never on a server, browser or provider implementation.
- `apps/server` owns application composition, authorization, persistence, HTTP, content registries,
  provider scheduling and capability reporting.
- `apps/web` owns route state, interaction, local presentation state and accessible projections. It
  consumes server APIs and shared pure types/semantics; it does not reach SQLite, engine processes or
  private content directly.
- `workers` owns isolated engine or data processes. Provider-specific behavior remains behind a
  typed server boundary.
- `content` owns authored documents and evidence sidecars. `schemas` define their machine contract;
  server validators define the executable semantic contract.

## Major containers

| Container | Owns | Does not own |
|---|---|---|
| `packages/schema` | Version constants, closed schema-facing vocabularies, validation entry points | Product orchestration or UI policy |
| `packages/runtime` | Run graph, events, branching, comparison, chess predicates, pure policy compilers | HTTP, credentials, SQLite or process supervision |
| `apps/server` | `createApplication`, REST boundary, services, registries, storage, provider queues and health | Browser composition or ungrounded chess instruction |
| `apps/web` | Shell, routes, screens, board input, presentation and session controller | Authoritative persistence, secret-bearing providers or move grading |
| `workers/maia` | Containerized Maia UCI service | Product policy, learner-facing claims or durable run state |
| `content` | Draft/official packs, shapes, principles, evidence and sourcing metadata | Runtime behavior or implicit schema evolution |
| `tools` | Verification, migration planning, research instruments and authoring commands | Production behavior unless an accepted RFC explicitly promotes it |

## Core flows

### Rehearsal mutation

```text
board gesture
  -> web session controller
  -> authenticated REST request + writer identity
  -> RunService
  -> pure runtime event append/project
  -> SQLite transaction
  -> projected run graph
  -> board, timeline, branch rail and comparison
```

The immutable event-derived run graph is the source of rehearsal truth. Rewind moves the active
cursor; it does not erase the previous attempt. Forks, comparisons and replay therefore survive
resume. See `branch-runtime.md`, `drill-client.md` and `identity-and-authorization.md`.

### Evidence and assistance

```text
position or recorded event
  -> typed producer/source receipt
  -> evidence projection with operands and provenance
  -> consumer-specific eligibility and selection
  -> learner module / Review / bot policy
  -> typed presentation component
```

Each arrow is a contract boundary. A compiled producer is not automatically learner-visible, and a
fact being true does not make it relevant. Missing providers must produce an honest unavailability
or abstention state. Optional LLMs may render already-selected evidence; they may not select facts,
grade moves or create chess strategy. See `evidence-contract.md`, `semantic-evidence.md`,
`explanation-grounds.md` and `adaptive-guidance.md`.

### Content lifecycle

```text
source/candidate
  -> committed draft + provenance sidecars
  -> schema and semantic validation
  -> preview and playtest
  -> capability/migration/graduation checks
  -> immutable allow-listed release bundle
  -> browser-safe projection
```

Draft existence is not official content. Scale content work remains subject to Gate F in
`../planning/platform-alignment/plan.md`. See `content-sourcing.md`, `drill-pack-format.md`,
`pack-studio.md` and `pack-graduation.md`.

### External providers

Stockfish, Maia, Syzygy, Explorer and optional voice providers enter through server-owned adapters.
Requests carry the identity required by that source; results retain source/model/version/request
identity and do not silently widen confidence. Scheduling, timeouts, cancellation, caching and
provider-off behavior belong to the application boundary, not to a UI component.

## Cross-cutting invariants

1. **No manufactured chess truth.** Rules, authored declarations and instrument records stay
   attributable and typed.
2. **Disclosure is explicit.** Stored evidence does not imply that it may be shown at the current
   moment or assistance level.
3. **The production boundary is real.** Direct handler tests do not prove that `createApplication`
   serves a feature.
4. **State has an owner.** Persisted records carry learner/actor identity, revision and lifecycle;
   browser-local state is used only where loss and device scope are intended.
5. **Absence is modeled.** Provider-off, unavailable, withheld, unsupported and no-signal are not
   interchangeable.
6. **Schemas and migrations are registered.** A versioned shape or SQLite change cannot reserve or
   skip a lane informally.
7. **One play surface.** Packs, Just Play, campaign and social contexts compose the same rehearsal
   protocol rather than forking separate chess clients.

## Where changes belong

Use `extending.md` for concrete recipes and `../CONTRIBUTING.md` for the research/RFC workflow. The
short rule is:

- pure chess or run semantics -> `packages/runtime`;
- exchanged/persisted shape -> `schemas` + `packages/schema` + the relevant register;
- storage, orchestration, provider or HTTP behavior -> `apps/server`;
- interaction or presentation -> `apps/web`;
- authored chess material -> `content` and its sourcing/graduation tools;
- disposable measurement -> `tools`, explicitly marked as research;
- product intent -> owner-authored `design/`, never inferred from an implementation patch.

## Related documents

- `features.md` — capability ownership and what each area unlocks.
- `development.md` — toolchain, commands and workspace operation.
- `testing.md` — verification tiers and what each tier proves.
- `app-shell.md` — browser information architecture and route ownership.
- `branch-runtime.md` — event, branch and rewind semantics.
- `evidence-contract.md` — evidence registration and consumer boundaries.
- `drill-pack-format.md` — content format and executable validation.
