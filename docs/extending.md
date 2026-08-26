# Extending Tabiya

This guide answers “where does this change belong?” It complements `architecture.md` and the
research/RFC workflow in `../CONTRIBUTING.md`; it does not grant implementation authority.

## Placement at a glance

| Change | Primary home | Required joins |
|---|---|---|
| Pure run/chess semantics | `packages/runtime/src/` | Schema types where exchanged; runtime tests; owning implemented doc |
| Shared persisted/exchanged shape | `schemas/`, `packages/schema/src/` | Shared-resource claim/register, compatibility/migration, producer and consumer tests |
| HTTP or application capability | `apps/server/src/application.ts`, `rest.ts`, service module | Authorization, typed errors, production-boundary test, client API if exposed |
| Durable server state | `apps/server/src/storage.ts` and owning service | Registered migration order, rebuild/export/delete/backup lifecycle |
| Client route or interaction | `apps/web/src/lib/router.ts`, `App.svelte` or focused component | API contract, loading/empty/error states, keyboard/responsive/browser checks |
| Evidence source/projection | Server/runtime evidence catalogue and operations | Exact producer, projection, adapter, consumer, provenance, abstention and manifest checks |
| Learner assistance module | Runtime module declarations/reducers plus server operation and web component | Preset/context ceilings, disclosure, honest empty state and leakage tests |
| Opponent behavior | Server opponent policy/selector and engine adapter | Registered immutable profile, calibration, fallback and decision receipt |
| Authored pack/shape/principle | `content/drafts/` and sourcing sidecars | Schema/semantic check, preview/playtest, provenance and graduation policy |
| External process/provider | `workers/` or server-owned adapter | Health, timeout/cancellation, identity, resource/licence and provider-off behavior |
| Disposable research | `tools/<question>-harness/` | Ledger question, `DISPOSABLE` label, dossier, coverage matrix, gates and exploration log |

## Add or change runtime semantics

Use `packages/runtime` for deterministic behavior that should be identical in browser and server:
run events, branch projection, comparison, chess predicates, pure grading or policy compilation.

Checklist:

1. Identify the accepted RFC or existing implemented contract.
2. Put the narrow implementation beside the nearest existing semantic module.
3. Export public behavior deliberately from `packages/runtime/src/index.ts`; do not turn the barrel
   into an accidental API for internal helpers.
4. Add positive and negative tests at the semantic boundary.
5. If the value crosses a process or persists, update the schema path separately.
6. Update the owning `docs/` document.

Runtime code must not read environment variables, open SQLite, call HTTP providers or manufacture
learner-facing strategic prose.

## Add a schema field or versioned resource

Schema changes are shared-resource changes, not local type edits.

1. Confirm the RFC has a declared claim in `rfc/README.md` and that the lane is free.
2. Change the relevant file in `schemas/` and its schema-facing types/version in `packages/schema`.
3. Define compatibility: additive, migrated, refused or re-authored. “Old JSON still validates” is
   not enough when evaluator semantics changed.
4. Update every serializer, parser and consumer; add both-direction fixtures.
5. For persisted changes, add the registered SQLite migration and lifecycle coverage.
6. Run `make register-check` and the relevant schema/content tests.
7. Update the implemented format document only when the new version has landed.

Never reserve a lane from an unresolved research question or draft that is not eligible to claim it.

## Add an API family or endpoint

The production application—not a direct handler—is the availability boundary.

1. Define request/response/error types and authorization rules.
2. Implement the owning service operation.
3. Wire the route in `apps/server/src/rest.ts`.
4. Compose every dependency in `apps/server/src/application.ts` and ensure its path is admitted by
   the application router.
5. Add a production-boundary test through `createApplication`; direct REST tests remain useful but
   are not sufficient.
6. Add the web API method and typed states only if a client consumer exists.
7. Register new API-family ownership in `planning/roadmap-1.0.json` when its family is not already
   covered; refresh the receipt through the governed roadmap workflow.

Provider-backed endpoints must expose honest unavailability and bounded latency rather than hanging
or silently falling back to a different claim.

## Add a client route, screen or interaction

1. Confirm the route belongs to an accepted product composition.
2. Add its discriminated route type, parser and formatter in `apps/web/src/lib/router.ts`.
3. Add route tests for parsing, formatting, malformed input and history behavior.
4. Compose the screen in `App.svelte`, preferring a focused component under `apps/web/src/lib/`.
5. Provide loading, empty, error, unavailable and recovery states.
6. Preserve the one-board/one-viewport ownership rules in `app-shell.md` and `drill-client.md`.
7. Add keyboard, focus and viewport assertions; use a browser journey when the route represents a
   learner outcome.
8. Add the route obligation to the roadmap machine map if it is new.

Do not put provider credentials, hidden pack answers or authoritative state in the browser.

## Add durable state or a migration

1. Define the owner, identity, revision, idempotence and deletion behavior before the table.
2. Place storage operations behind the owning service rather than calling SQLite from REST code.
3. Claim the next migration position through the register; do not choose a number by inspection
   alone.
4. Cover creation, read, retry, restart, rebuild and malformed/duplicate input.
5. Extend account export, deletion preview/deletion, backup/restore and projection rebuild wherever
   the new object contains learner or operator state.
6. Verify migration from the previous head and the release upgrade path appropriate to the change.

## Add evidence

Read `evidence-contract.md` before changing the evidence graph. The minimum chain is:

```text
source or deterministic authority
  -> producer
  -> exact projection
  -> adapter/derivation
  -> declared consumer operation
  -> selection/disclosure
  -> typed rendering or policy decision
```

For every addition:

- retain operands, subject/object identity, squares, sign, source and confidence;
- distinguish local, recorded and provider-backed availability and latency;
- declare abstentions and test them set-equal to runtime results;
- provide genuine semantic positives and hard negatives, not labels generated from the declaration;
- test counterfactual population completeness where selection makes a comparative claim;
- register the real production operation, not only a file or consumer name;
- keep raw evidence inspector-only until a learner module or other consumer has explicit eligibility.

Run `make evidence-manifest-check` and `make semantic-evidence-check` in addition to focused tests.

## Add a learner module or assistance preset

Modules answer learner questions; they are not aliases for producers.

1. Use the accepted module/preset contracts in `rfc/README.md`; several 1.0 module contracts remain
   active, so an unused type is not permission to instantiate a new module.
2. Declare eligible projections, timing, answer ceiling, role/context ceiling, budgets, reduction
   policy and honest empty behavior.
3. Bind the module to a real server operation and typed presentation component.
4. Compose preset defaults, workflow policy, learner override, permissions and provider availability
   in one deterministic clamp.
5. Test information leakage, interruption, source-off/LLM-off behavior, touch/hover/focus parity and
   responsive layout.

Primitive source controls belong under Advanced. Ordinary workflows start from named, useful
presets.

## Add or change an opponent

1. Keep strength, repertoire, behavior traits, plausible-error policy, time behavior and voice as
   separate measured axes.
2. Register a named immutable profile; a loose caller-owned policy object is not a production bot.
3. Persist the model/profile digest, exact request identity, guard/fallback outcome and selected
   move receipt needed for resume and Review.
4. Test legality, severe-loss guard, trait observability, calibration, determinism and provider loss.
5. Expose an honest learner card and history/rematch behavior only after the profile is registered.

See `engine-workers.md` and `bot-policy.md`. Never present a generic Elo knob when the underlying
human-model bands do not mean Elo.

## Add authored content

1. Work under `content/drafts/`; do not write directly into the official pack directory.
2. Use the living schema and the semantic authoring checker:

   ```sh
   make pack-check FILE=content/drafts/my-pack.json
   make pack-preview FILE=content/drafts/my-pack.json
   ```

3. Add source/evidence sidecars through the shared reserved-sidecar rules.
4. Preserve provenance, licences, immutable revisions and source digests.
5. Exercise the pack in the actual run loop; validation alone is not a playtest.
6. Follow Gate F and the graduation workflow before promoting or launching a scale wave.
7. Close the relevant `design/BACKLOG.md` rows and append `planning/content-era/log.md` in the same
   shipping change set.

See `drill-pack-format.md`, `content-sourcing.md`, `pack-studio.md` and `pack-graduation.md`.

## Add a provider or worker

1. Put product policy in the server and the isolated protocol/process implementation in `workers`
   or a focused adapter.
2. Publish exact identity, health and capability state.
3. Bound queueing, execution, cancellation, retries and cache identity.
4. Treat every response as untrusted input: validate shape, chess legality and request/result join.
5. Define provider-off behavior and prove the core profile still behaves honestly.
6. Pin versions/digests and update licence notices, SBOM and resource documentation.

## Add documentation

- Implemented behavior belongs in `docs/`.
- Product intent belongs in protected `design/` only through the owner process.
- Active contracts belong in `rfc/`; do not describe a draft as shipped.
- Research evidence belongs in `design/research/` with its required labels and citations.
- Live status belongs in the roadmap/registers, not copied into a new rollup.
- Add every new `docs/*.md` file to `docs/README.md`; run `make docs-check`.

## Closeout checklist

Before handing off a completed change, ask:

- Is the idea/defect ledgered and accurately closed or left open?
- Did the accepted RFC criteria actually pass?
- Are schema and migration claims/registers consistent?
- Does the feature cross the production application boundary?
- Are failure, unavailable, empty and unauthorized cases covered?
- Did implemented docs change with behavior?
- Did the required append-only log receive a tail entry?
- Did the change falsify protected intent, requiring a proposed amendment?
- Did content or release work update its own closeout surface?

The repository checks many of these mechanically, but the checklist remains necessary for semantic
claims that a string or source-file census cannot prove.
