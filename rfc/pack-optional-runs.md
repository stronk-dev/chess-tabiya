# RFC: Pack-optional run identity and the run-level withholding barrier

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/03-product-breadth.md` §The foundation edge (F2), §Play (Just Play, From position), gate B2; ADR-0006 (`archive/brief-v2/adrs/ADR-0006-delayed-middlegame-feedback.md`)
- **Exploration gate:** opened by owner ruling 2026-08-12 (breadth sequencing, `planning/exploration/log.md`)
- **Depends on:** `rfc/archive/branch-runtime.md` (implemented), `rfc/archive/drill-pack-format.md` (implemented), `rfc/archive/engine-workers.md` (implemented), `rfc/archive/authored-explanation-surface.md` (implemented — this RFC takes the D2 fix it explicitly handed back), `rfc/learner-identity-and-authorization.md` (F3, draft — **lands first**; §Landing order states every shape this RFC inherits from it)
- **Migration:** 3, `STORAGE_VERSION` 2 → 3, claimed in `rfc/README.md` §Migration register
- **Parent / amends:** amends the run schema (`schemas/drill_run.schema.json`, `packages/runtime/src/types.ts`), the withholding barrier (`apps/server/src/feedback-policy.ts`), and run creation (`apps/server/src/rest.ts`, `apps/server/src/service.ts`)
- **Supersedes / superseded by:** —
- **Planning:** `planning/pack-optional-runs/` (once implementing)

## Summary

A drill run cannot exist without a registered pack: six independent layers
require one. The consequence underneath them is worse than the requirement —
when no pack is registered the evidence barrier **fails open**.
`publicNodes`/`publicEvents` return everything
(`apps/server/src/feedback-policy.ts:21,48`) while no evidence is ever generated
(`apps/server/src/service.ts:197,216`), so the surface that would first use
pack-optional runs would also be the first to violate ADR-0006.

This RFC moves session identity and the feedback policy **from the pack document
onto the run**. After it, a run declares its own start, side, opponent policy and
feedback policy; `packId`/`packDigest` become a nullable pair; every withholding
surface reads the run instead of branching on registry state; and pack-less runs
generate evidence and can reveal it. It also closes D3 by making `POST /runs`
reject unknown keys with their JSON pointer, because this RFC doubles the size of
that body.

One combination the new shape would otherwise permit is refused at creation: a
position session may not request `theory_strict`. That mode needs a spine, the
spine has exactly one producer (`pack.spine`, sent by the client at
`apps/web/src/lib/session-controller.ts:368`), and with no spine the shipped
selector returns a Maia move without saying so
(`apps/server/src/opponent-selector.ts:453-457`). Invariant I6 in §1 rejects the
request instead of degrading it.

## Motivation

`planning/breadth/synthesis.md` §2 names F2 as one of three primitives blocking
work in areas that never talk to each other: Just Play and from-position starts
(B2), Arena leg import (B5), and the pack playtest harness (B6). Each is blocked
on the same change, and each would inherit D2 the moment that change lands.

### The six layers, re-verified in code

| # | Layer | Evidence (verified 2026-08-12) |
|---|---|---|
| 1 | Wire schema | `schemas/drill_run.schema.json:7-17` `required: [… "packId", "packDigest" …]`; `:22-25` `packDigest` pattern `^sha256:[0-9a-f]{64}$` |
| 2 | Runtime type | `packages/runtime/src/types.ts:188-189` `readonly packId: string; readonly packDigest: string` |
| 3 | Create input | `packages/runtime/src/runtime.ts:32-33` same two fields, non-optional |
| 4 | REST parse | `apps/server/src/rest.ts:198` `packId: requiredString(value.packId, "packId")` |
| 5 | Service + composition | `apps/server/src/service.ts:134` `this.#packRegistry?.required(input.packId)`; `pack-registry.ts:207-213` `required()` throws `PACK_NOT_FOUND`; `application.ts:303` always supplies the registry, so the pack-blind branch at `service.ts:149-156` is reachable only from tests that omit it (`server.test.ts:72`, `latency.test.ts:117`, `opponent-selector.test.ts:409`, `capabilities.test.ts:77`, `evidence-queue.test.ts:207,258,332,377`) |
| 6 | Browser transport | `apps/web/src/lib/api.ts:159-165` `CreateRunRequest` is `{id, packId, policyConfig, seed, createdAt?}` — the pack-less shape is inexpressible from the client |

### D2, re-verified, with the surface count corrected

`publicNodes` and `publicEvents` short-circuit on `pack === undefined`
(`feedback-policy.ts:21,48`), and `service.ts:329,355` gate staged evidence and
evidence application on `pack !== undefined`. `#registeredPack`
(`service.ts:417-420`) returns `undefined` for **two different situations that
are not the same fact**: a run with no pack at all, and a run naming a pack the
registry does not have at that digest. Today only the second exists, and it is
already wrong — a pack edited after a run started silently unlocks that run's
evidence.

The count is **six** surfaces, not five: `authoredFeedback` (`service.ts:335-345`)
also branches on `#registeredPack`, and it fails *closed* by throwing
`PACK_NOT_FOUND` (`service.ts:338-343`). §6 specifies all six.

### Landing order: F3 first, and what this RFC inherits from it

This RFC and `rfc/learner-identity-and-authorization.md` (F3) were drafted in
parallel and both claimed database migration 2. `rfc/README.md` §Migration
register resolves it: **F3 lands first as migration 2**; this RFC is
**migration 3**, `STORAGE_VERSION` 2 → 3.

The dependency is more than a number. F3 changes three shapes this RFC also
touches, so every quotation below is against F3's post-landing versions, not the
shipped ones:

| Shape | Shipped | After F3 | What this RFC then does |
|---|---|---|---|
| `RunStorage.create` | `create(run, activeWriterId, title?)` (`storage.ts:30`) | `create(run, lease: LeaseHolder, title?)` (F3 §7) | supplies the position title through the same third argument (§5) |
| `RunStorage.list` | `list(limit, offset)` (`storage.ts:33`) | `list(learnerId, limit, offset)`, joined to `run_grants` (F3 §7) | adds one predicate to the same statement (§8) |
| `RunSummary` | `activeWriterId: string` (`storage.ts:20`) | that field removed, `viewerRole: RunRole` added (F3 §9, row 3) | adds `sessionKind` and `sessionDigest` and widens `packId` (§8) |

`RunService.create` acquires a `LeaseHolder` parameter from F3 and an `async`
return from this RFC. They are two edits to one signature and must be made
together rather than merged blind.

`POST /runs/:id/reveal` (§4) is a **W** route in F3's endpoint table — writer
lease plus `mayWrite`, the same class as `/moves`, `/rewind`, `/fork` and
`/evidence` (F3 §8). F3's table was written before this route existed; stating
the class here keeps the authorization surface complete rather than leaving a
hole for whoever implements second.

F3 already records that D3 belongs to this RFC and that F3 hardens only the
parsers it adds (F3 §Motivation, Out of scope, D3 row), so §7 does not collide
with it.

### Why the D2 fix cannot be a boolean inversion

Inverting `pack === undefined` would withhold everything from a pack-less run
forever, because a pack-less run has no feedback policy and can never emit
`checkpoint.reached` — that event is produced only by `orchestratePackMove`
(`apps/server/src/pack-orchestrator.ts:131`, the sole caller of `reachCheckpoint`).
It would also break the evidence tests at `evidence-queue.test.ts:238,321,361`,
which use the packless path deliberately to test staging and application
independently of withholding. §3 gives pack-less runs a reveal condition they can
actually satisfy; acceptance criterion 12 states exactly how those three tests
change and what they keep asserting.

### Out of scope, each with a reason

| Out of scope | Why |
|---|---|
| Just Play entry UI, `/play/just`, the start form | This RFC builds the primitive the surface stands on. `DrillPackDefinition` reaches 13 files under `apps/web/src` — seven modules and six test files — and is a required parameter in the screens (`DrillScreen.svelte`, `CompareView.svelte`, `screen-model.ts`, `evidence-sentences.ts`). Substituting a session projection into them is a client change with its own review surface, and it cannot begin before the type it consumes exists. §9 states the one refusal the shipped client needs in the meantime |
| Binding `POST /select-move` to the run it plays for | The endpoint takes no run id (`rest.ts:406-417`) and reads the policy from the request body, so `run.opponentPolicy` is recorded, not enforced (§1). Adding a run id changes the selector's cache key, its request parse, and every client call site; I6 is enforced where sessions are created instead |
| FEN/PGN paste, `/drill` and `/fen` routes, duplicate-from-run | `router.ts:18-27` has no dynamic route but `/play/run/:runId`, and `parsePgn` appears in no non-test source (`packages/runtime/src/pgn.ts:1-10` imports `makePgn` only). Each is an entry that resolves to the session shape defined here |
| Share tokens and spectator projection | Rests on D1 (`assertActiveWriter` is string equality, `packages/runtime/src/errors.ts:37-44`), which is an identity problem (F3), not a session-identity one |
| Deterministic feature/phase recognition | No detector code exists (`grep -rniE "recogni|detector|\bECO\b" apps packages` returns four unrelated test titles). Its evidence namespace is a separate contract |
| Per-node reveal of engine evidence | Impossible on the event surface: `publicEvents` must return a **contiguous** prefix because `projectRun` rejects any gap (`packages/runtime/src/events.ts:43-46`) and the follower store rejects a non-adjacent first event (`apps/web/src/lib/run-state.ts:94-99`). Filtering individual events out of the stream would break every reader. §3 works within that constraint |
| `immediate_blunder_guard` | In the pack JSON enum (`schemas/drill_pack.schema.json` `feedbackPolicy`) and **rejected at registry load** (`apps/server/src/pack-validation.ts:104-112`), with a test asserting it (`drill-client-server.test.ts:206-220`). `PackRecord.feedbackPolicy` is therefore genuinely one of two values |
| N-way comparison | `BranchComparison` hard-codes `{a, b}` (`packages/runtime/src/compare.ts:49-64`); a runtime type change unrelated to session identity |

## Specification

### 1. Run schema v0.5 — five added fields, one nullable pair

Shipped (`packages/runtime/src/types.ts:185-195`):

```ts
export interface DrillRun {
  readonly schemaVersion: DrillRunSchemaVersion;
  readonly id: string;
  readonly packId: string;
  readonly packDigest: string;
  readonly policyConfig: PolicyConfig;
  readonly nodes: readonly Node[];
  readonly branches: readonly Branch[];
  readonly events: readonly DrillRunEvent[];
  readonly activeCursor: Cursor;
}
```

v0.5:

```ts
export type RunSessionKind = "pack" | "position";
export type RunFeedbackPolicy = "delayed_checkpoint" | "segment_end" | "attempt_end";
export type RunOpponentMode = "human_common" | "strong_engine" | "theory_strict";

export interface RunStart {
  readonly fen: string;
  readonly side: "white" | "black";
}

export interface RunOpponentPolicy {
  readonly mode: RunOpponentMode;
  readonly targetElo?: number;
  readonly temperature?: number;
  readonly topP?: number;
}

/** I6: a position session has no spine, so it cannot ask for theory. */
export type PositionOpponentMode = "human_common" | "strong_engine";
export interface PositionOpponentPolicy extends RunOpponentPolicy {
  readonly mode: PositionOpponentMode;
}

export interface DrillRun {
  readonly schemaVersion: DrillRunSchemaVersion;   // "0.5"
  readonly id: string;
  readonly sessionKind: RunSessionKind;
  readonly packId: string | null;
  readonly packDigest: string | null;
  readonly sessionDigest: string;
  readonly start: RunStart;
  readonly feedbackPolicy: RunFeedbackPolicy;
  readonly opponentPolicy: RunOpponentPolicy;
  readonly policyConfig: PolicyConfig;
  readonly nodes: readonly Node[];
  readonly branches: readonly Branch[];
  readonly events: readonly DrillRunEvent[];
  readonly activeCursor: Cursor;
}
```

`RunOpponentMode` is the same closed set as `SUPPORTED_POLICY_MODES`
(`apps/server/src/capabilities.ts:10-14`) and as `SelectorPolicy.mode`'s accepted
values, **not** the seven-value authored enum in `schemas/drill_pack.schema.json`
`$defs.opponentPolicy.mode`; the four unselectable authored values are already
rejected at registry load (`pack-validation.ts:125-138`).

`run.opponentPolicy` is the **recorded** session parameter, not a server-enforced
one. `POST /select-move` takes no run id (`apps/server/src/rest.ts:406-417`); the
policy it acts on arrives in the request body from the client
(`session-controller.ts:358-369`). This RFC therefore constrains what a run may
*declare*, which is what identity (§2) and resume (§Deviations 2) need, and
leaves selection unbound as it is today. Binding a selection to its run requires
a run id on that endpoint and is out of scope below.

**Invariants, enforced in `projectRun` (`packages/runtime/src/events.ts:33-151`) with a `TypeError`,
and by the JSON Schema:**

| # | Invariant | Why |
|---|---|---|
| I1 | `sessionKind === "pack"` **iff** `packId !== null` **iff** `packDigest !== null` | Nullable as a pair. A run that half-declares a pack is the half-supplied shape D3 exists to prevent |
| I2 | `sessionKind === "pack"` ⟹ `feedbackPolicy !== "attempt_end"` | A pack's reveal is authored; `attempt_end` would let a client override authored timing |
| I3 | `sessionKind === "position"` ⟹ `feedbackPolicy === "attempt_end"` | The other two are unreachable without a pack (`pack-orchestrator.ts:131` is the only producer of `checkpoint.reached`), so permitting them would encode permanent withholding |
| I4 | `start.fen === nodes[0].fen` | `createRun` canonicalizes the input FEN (`runtime.ts:131-132`), so the run start and the root node are one fact; two fields that can disagree is how the pack-digest staleness bug got in. §2 states the ordering that keeps this true and keeps the digest stable |
| I5 | `sessionDigest` matches `^sha256:[0-9a-f]{64}$` | Same shape as `packDigest` and as `DIGEST_PATTERN` (`apps/server/src/opponent-selector.ts:72`), so it can serve as `policy.policyConfigDigest` for a pack-less selection without a second format |
| I6 | `sessionKind === "position"` ⟹ `opponentPolicy.mode !== "theory_strict"` | `theory_strict` needs a spine, and `spineChildren` reads it from `policy.spine` (`opponent-selector.ts:337-346`), whose only producer is `pack.spine` (`session-controller.ts:368`). With no spine, `#theoryStrict` returns `this.#humanCommon(request)` (`opponent-selector.ts:453-457`) — a run that asked for opening theory and silently got a Maia move. A position session has no pack, so it has no source for that geometry; the honest answer is to refuse the request, not to serve a different one |

JSON Schema (`schemas/drill_run.schema.json`): `$id` becomes
`urn:chess-tabiya:schema:drill-run:0.5`, `schemaVersion` becomes `{"const": "0.5"}`,
`required` gains `sessionKind`, `sessionDigest`, `start`, `feedbackPolicy`,
`opponentPolicy`. `packId` and `packDigest` become nullable using the existing
`oneOf` idiom already used for `node.parentId` (`:160-165`):

```json
"packId": { "oneOf": [{ "$ref": "#/$defs/id" }, { "type": "null" }] },
"packDigest": {
  "oneOf": [
    { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    { "type": "null" }
  ]
},
"sessionKind": { "enum": ["pack", "position"] },
"sessionDigest": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
"start": {
  "type": "object",
  "required": ["fen", "side"],
  "properties": {
    "fen": { "$ref": "#/$defs/id" },
    "side": { "enum": ["white", "black"] }
  },
  "additionalProperties": false
},
"feedbackPolicy": { "enum": ["delayed_checkpoint", "segment_end", "attempt_end"] },
"opponentPolicy": { "$ref": "#/$defs/runOpponentPolicy" }
```

with

```json
"runOpponentPolicy": {
  "type": "object",
  "required": ["mode"],
  "properties": {
    "mode": { "enum": ["human_common", "strong_engine", "theory_strict"] },
    "targetElo": { "type": "integer" },
    "temperature": { "type": "number", "minimum": 0 },
    "topP": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "additionalProperties": false
}
```

`$defs.runStartedData` receives the identical five additions and the identical
nullability, because `projectRun` reconstructs the whole run from that one event
(`events.ts:140-150`) and `SQLiteRunStorage.read` replays from events alone
(`apps/server/src/storage.ts:236-242`). The schema-level invariants I1–I3 and I6
are expressed on both objects as `allOf` implications:

```json
"allOf": [
  { "if": { "properties": { "sessionKind": { "const": "position" } } },
    "then": { "properties": {
      "packId": { "type": "null" },
      "packDigest": { "type": "null" },
      "feedbackPolicy": { "const": "attempt_end" },
      "opponentPolicy": { "properties": {
        "mode": { "enum": ["human_common", "strong_engine"] } } } } } },
  { "if": { "properties": { "sessionKind": { "const": "pack" } } },
    "then": { "properties": {
      "packId": { "$ref": "#/$defs/id" },
      "packDigest": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
      "feedbackPolicy": { "enum": ["delayed_checkpoint", "segment_end"] } } } }
]
```

Both `if` clauses are sound only because `sessionKind` is in `required` on the run
object and on `$defs.runStartedData`: a JSON Schema `if` whose `properties` name
an absent key matches vacuously, so an omitted `sessionKind` would satisfy both
branches and constrain neither. That is the half-supplied shape D3 exists to
prevent, expressed in the schema rather than argued about.

`DRILL_RUN_SCHEMA_VERSION` (`packages/schema/src/index.ts:1`) becomes `"0.5"`,
which flows into `runtimeBuildInfo.runSchemaVersion` and thus into
`GET /capabilities` (`apps/server/src/capabilities.ts:150`) with no further change.

### 2. `sessionDigest` — what replaces `packDigest` as identity

`packDigest` does four jobs today: registry matching (`service.ts:419`),
optimistic staleness detection at creation (`service.ts:135-141`), provenance
inside `objectiveRequest` (`service.ts:315-316`), and the client's
`policy.policyConfigDigest` (`apps/web/src/lib/session-controller.ts:360`). For a
pack-less run the first three are vacuous and the fourth still needs a digest.

**A run's identity is the digest of its session source**, a closed document
canonicalized with the shipped RFC-8785 serializer and hashed with the same
routine as `digestDrillPack` (`packages/schema/src/drill-pack/digest.ts:54-66`):

```ts
// packages/runtime/src/session.ts
export type SessionSource =
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest: string }
  | {
      readonly kind: "position";
      readonly start: RunStart;
      readonly feedbackPolicy: "attempt_end";
      readonly opponentPolicy: PositionOpponentPolicy;   // I6: never theory_strict
    };

export type PackRun = DrillRun & {
  readonly sessionKind: "pack";
  readonly packId: string;
  readonly packDigest: string;
  readonly feedbackPolicy: "delayed_checkpoint" | "segment_end";
};

export function canonicalRunStart(start: RunStart): RunStart;
export function isPackSession(run: DrillRun): run is PackRun;
export function sessionSource(from: DrillRun | CreateRunSession): SessionSource;
export async function digestSessionSource(source: SessionSource): Promise<string>;
```

`isPackSession` is the type predicate that makes I1–I3 usable rather than merely
true. Every consumer that needs a non-null `packId` — `exportPackRunPgn` (§9),
`requestObjectiveEvidence` (§7), surface 6's pack branch (§6) — narrows through
it instead of asserting, so a caller that forgets the check does not compile.

`sessionSource` accepts either shape because both producers need it and neither
may derive the source differently: a run carries `sessionKind`, a create input
carries `kind` (§5), and the two are discriminated on that. Recomputing the
digest of a stored run must reproduce the value written at creation, which is
only guaranteed if one function reads both.

For `kind: "pack"` the source is only the pack identity pair, because everything
else on a pack run is derived from the pack document and `packDigest` already
covers it. For `kind: "position"` the source is every field that determines how
the session plays: the canonical start, the reveal rule, and the opponent policy.
`policyConfig` and `seed` are excluded — they are execution parameters recorded
on the run and in each `opponent.move_selected` payload, not session identity;
two runs of the same session at different seeds must share a digest for "the same
Just Play setup" to mean anything.

**Canonicalize the start, then digest it, then create the run.** The order is
load-bearing and it is the reverse of the obvious one. `createRun` does not store
the FEN it is given: it parses it and re-emits the canonical spelling
(`runtime.ts:131-132`, `positionFromFen` then `canonicalFen`,
`packages/runtime/src/chess.ts:4,12`) into `rootNode.fen`. Digesting the client's
raw FEN would therefore produce two session identities for one position — the
`rnbqkbnr/…/RNBQKBNR w KQkq - 0 1` a client types and the spelling chessops
returns for it — and would break I4 outright, because `start.fen` would hold the
raw string while `nodes[0].fen` holds the canonical one.

`canonicalRunStart(start)` is the single place that normalizes: it runs the same
two functions in the same order and returns `{fen: canonicalFen(positionFromFen(
start.fen)), side: start.side}`, throwing on an illegal position. Every producer
of a session — `RunService.create` for both kinds (§5) and `combinedRun` for the
PGN export (§9) — calls it **before** building the `SessionSource`, so the digest
is always over the canonical start. `createRun` re-canonicalizes idempotently and
throws a `TypeError` if the result differs from `session.start.fen`, so no caller
can smuggle a non-canonical start past the digest it was supposed to determine.

Optional keys are omitted, never nulled, before canonicalization — RFC-8785 sorts
keys but does not erase `"targetElo": null`, so an omitted-vs-null difference
would produce two digests for one session.

Consequences that make the field real rather than declared-and-inert (the failure
shape catalogued in `planning/breadth/synthesis.md` §1): `sessionDigest` is
returned in every `GET /runs` summary (§8), written into the exported PGN (§9),
and carried on `run.started` so a resumed run keeps it.

`digestSessionSource` is asynchronous (`crypto.subtle.digest`, the same API the
pack digest uses and the only one available in both the Node server and the
browser bundle). Therefore **`RunService.create` becomes `async`**; `createRun`
stays synchronous and takes the finished digest, validating its shape (I5) and
the canonicality of `session.start`. `canonicalRunStart` is synchronous, so the
whole ordering above runs before the single `await`. The one production call site
already sits in an async handler (`apps/server/src/rest.ts:396-400`).

### 3. Feedback policy — two predicates, one home

The policy source becomes the run. `feedbackIsRevealed(pack, run)`
(`feedback-policy.ts:11-15`) is replaced by two functions in the runtime, so the
server and the browser stop maintaining two copies of the rule — today
`apps/web/src/lib/run-state.ts:75-87` returns `false` for any unrecognized policy
while `feedback-policy.ts:12-14` treats any non-`delayed_checkpoint` value as
`segment_end`, which is a live divergence waiting for a third value:

```ts
// packages/runtime/src/feedback.ts
export function feedbackDisclosed(run: DrillRun): boolean {
  switch (run.feedbackPolicy) {
    case "delayed_checkpoint":
      return run.events.some((event) => event.type === "checkpoint.reached");
    case "segment_end":
      return run.events.some((event) => event.type === "segment.completed");
    case "attempt_end":
      return run.events.some((event) => event.type === "feedback.revealed");
  }
}

export function feedbackDeliveryOpen(run: DrillRun): boolean {
  if (run.feedbackPolicy !== "attempt_end") return feedbackDisclosed(run);
  let open = false;
  for (const event of run.events) {
    if (event.type === "feedback.revealed") open = true;
    else if (event.type === "move.committed") open = false;
  }
  return open;
}
```

| Policy | `feedbackDisclosed` (durable) | `feedbackDeliveryOpen` (live) | Set by |
|---|---|---|---|
| `delayed_checkpoint` | any `checkpoint.reached` | identical | copied from `PackRecord.feedbackPolicy` at creation |
| `segment_end` | any `segment.completed` | identical | copied from `PackRecord.feedbackPolicy` at creation |
| `attempt_end` | any `feedback.revealed` | a `feedback.revealed` with no later `move.committed` | mandatory for `sessionKind: "position"` |

**Why two predicates and not one.** `feedbackDisclosed` is monotonic: an engine
reference that has entered the append-only log was disclosed when it was written,
and hiding it afterwards would be theater — the writer's client already holds it,
and "a learner cannot unsee" is the same rule the authored surface adopted
(`rfc/archive/authored-explanation-surface.md` §Acceptance 7). `feedbackDeliveryOpen`
governs what is *newly handed over*: staged evidence and its application.

**Why `attempt_end` re-closes.** A monotonic pack-less latch would mean that after
the first reveal every subsequent move's evaluation is delivered and auto-applied
by the shipped polling loop (`run-state.ts:225-245`, which applies every staged
result whenever the policy reads revealed). A Just Play game would become live
eval from that point on — "an engine review screen with a rewind button", the
named failure the product must not become (`AGENTS.md` §Rejected). Closing the
window on the next committed move is the smallest rule that prevents it, and it
matches the shipped loop: commit → play the consequence → ask → compare → rewind
→ branch → play again, with the barrier back up.

Two further properties fall out and are intended:

- Revealing before playing is useless, because the next `move.committed` closes
  the window before that move's evidence job can be applied. There is no way to
  arm live evaluation ahead of a decision.
- `run.rewound`, `branch.forked` and `evidence.attached` do **not** close the
  window, so a learner can apply several staged results and compare branches
  inside one open window.

Rewind is deliberately **not** the reveal trigger, although it is the loop's
natural end-of-attempt: `rewind` reports every pruned node to the queue
(`packages/runtime/src/runtime.ts:310-331`) and the queue drops their staged
results (`apps/server/src/evidence-queue.ts:145-166`), so a policy that revealed
on rewind would open the window on exactly the evidence the same call discarded.

### 4. `feedback.revealed` and `POST /runs/:id/reveal`

New event, in the same `Event<TType, TData>` form as the shipped twelve
(`packages/runtime/src/types.ts:87-92`):

```ts
export type FeedbackRevealedEvent = Event<
  "feedback.revealed",
  { readonly nodeId: string }
>;
```

added to the `DrillRunEvent` union (`types.ts:165-177`), to the schema's event
`type` enum (`schemas/drill_run.schema.json:253-268`) and to its `oneOf` list with

```json
{ "properties": {
    "type": { "const": "feedback.revealed" },
    "data": { "type": "object", "required": ["nodeId"],
              "properties": { "nodeId": { "$ref": "#/$defs/id" } },
              "additionalProperties": false } } }
```

Projection: `projectRun` gains a case that verifies `nodeId` exists and otherwise
mutates nothing — the same shape as the existing `checkpoint.reached` node lookup
(`events.ts:84-86`), throwing `unknownNode` when it does not. It is **not** added
to the no-op group at `events.ts:131-136`, because an unresolvable node id in a
reveal event must fail replay rather than be ignored.

The existing `feedback.generated` event is deliberately **not** reused: its data
is `{nodeId, evidenceRefs}` (`types.ts:152-155`), a per-node claim with an
evidence list, and overloading it with a run-level act would make its shape lie
and would collide with the producer it is waiting for.

Replay adjacency: `readBackReplay` constrains only the
`opponent.move_selected` → `move.committed` pair (`packages/runtime/src/replay.ts:66-74`).
A `feedback.revealed` event appended between them would break that check, and it
cannot occur — both are appended inside one `commitMove` call (`runtime.ts:231-269`)
within a single request, while reveal is a separate request. Stated because it is
an invariant, not an accident.

```
POST /runs/:id/reveal      (writer)
  headers: x-writer-id
  body: { "at"?: string }
  -> 200 { run, emitted }        MutationResult, exactly like /fork
```

Register `reveal` in the run-route matcher (`apps/server/src/rest.ts:299`), whose
current alternation is
`(moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn)`.
The body is parsed with the closed-record helper of §7 (`at` is the only key).

`RunService.reveal(runId, writerId, at?)`:

1. `#forWrite` — a request with no `x-writer-id` header gets `INVALID_REQUEST`
   (400) from `writerId()` (`rest.ts:188-190`) and a follower holding a different
   id gets `NOT_ACTIVE_WRITER` (409) from the shipped lease check
   (`service.ts:411-415`). Both are the same responses `/fork` gives today.
2. If `run.feedbackPolicy !== "attempt_end"` → `INVALID_REQUEST` (400),
   message `Run <id> reveals feedback by its <policy> policy`. No new error code:
   `ServerErrorCode` (`apps/server/src/errors.ts:1-12`) stays as shipped.
3. If `feedbackDeliveryOpen(run)` is already true → append nothing, return
   `{run, emitted: []}` with 200. Idempotent, so a retried request cannot stack
   reveal events. An empty `emitted` is safe for the client applier, which
   compares lengths after appending nothing (`run-state.ts:270-277`).
4. Otherwise append `feedback.revealed` with `data.nodeId = run.activeCursor.nodeId`
   and save.

### 5. Run creation

```ts
// packages/runtime/src/runtime.ts
export type CreateRunSession =
  | {
      readonly kind: "pack";
      readonly packId: string;
      readonly packDigest: string;
      readonly start: RunStart;
      readonly feedbackPolicy: "delayed_checkpoint" | "segment_end";
      readonly opponentPolicy: RunOpponentPolicy;
    }
  | {
      readonly kind: "position";
      readonly start: RunStart;
      readonly feedbackPolicy: "attempt_end";
      readonly opponentPolicy: PositionOpponentPolicy;   // §1, I6
    };

export interface CreateRunInput {
  readonly id: string;
  readonly session: CreateRunSession;
  readonly sessionDigest: string;
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly createdAt?: string;
}
```

`startFen` is gone from `CreateRunInput` (it is `session.start.fen`), and
`createRun` writes the five new fields into both the run and `run.started.data`.
This is the **resolved** session: a pack session arrives here already carrying the
start, feedback policy and opponent policy the service read off the pack record.
The wire shape a client may send is narrower and forbids exactly those three keys
on a pack session (§7); the two types are named apart (`CreateRunSession` in the
runtime, `CreateRunSessionRequest` on the transport, §9).

`RunService.create(input, lease)` becomes `async` and runs four steps in this
order, for both kinds:

1. **Resolve** the wire session into a `CreateRunSession` (per kind, below).
2. **Canonicalize** its start: `session.start = canonicalRunStart(session.start)`.
3. **Digest**: `sessionDigest = await digestSessionSource(sessionSource(session))`.
4. **Create and store**: `createRun({...input, session, sessionDigest})`, then
   `storage.create(run, lease, title)`.

Steps 2 and 3 may not be swapped, and step 3 may not read anything `createRun`
would rewrite; §2 gives the reason. Steps 1–2 run inside the shipped try/catch
(`service.ts:158-172`), so an illegal or unparseable start FEN surfaces as the
same `INVALID_REQUEST` "Run definition is invalid" (`service.ts:168-172`) it does
today rather than as a new message.

**`kind: "pack"`** — `#requiredPackRegistry().required(packId)` (a pack session
with no registry configured is now `PACK_NOT_FOUND`, not a silent pack-blind run;
the pack-blind branch at `service.ts:149-156` is deleted). Then:

| Run field | Source | Failure |
|---|---|---|
| `packDigest` | `pack.digest`; if the client supplied one and it differs → `INVALID_REQUEST` "Client pack digest is stale" (shipped behaviour, `service.ts:135-141`) | — |
| `start.fen` | `canonicalRunStart` applied to `pack.document.start.fen` — the pack schema constrains it to a non-empty string (`$defs.start.fen`) and nothing canonicalizes it at registry load, so the pack path needs step 2 exactly as much as the position path does | illegal → `INVALID_REQUEST` "Run definition is invalid" |
| `start.side` | `pack.document.start.side` | absent → `INVALID_REQUEST` `Pack <id> does not declare start.side`. `start.side` is schema-optional (`schemas/drill_pack.schema.json` `$defs.start.required = ["fen"]`) while the client throws on its absence today (`apps/web/src/lib/screen-model.ts:54-60`); both shipped packs declare it |
| `feedbackPolicy` | `pack.feedbackPolicy` (`pack-registry.ts:30`) | — |
| `opponentPolicy` | `pack.document.opponentPolicy`, copied key by key: `mode` (already validated against `SUPPORTED_POLICY_MODES` at `pack-validation.ts:125-138`), plus `targetElo`/`temperature`/`topP` when they are numbers. Authored keys outside those four — including `stockfishGuardCp` and `seedMode`, both permitted by `additionalProperties: true` — are **not** copied; `seedMode` already reaches the run through `policyConfig.seedMode` | a copied number the run schema's `runOpponentPolicy` would reject → `INVALID_REQUEST` naming the pack and the key |

That last failure is not hypothetical. The pack schema's
`$defs.opponentPolicy.temperature` is a bare `{"type": "number"}` with no
minimum, while §1's `runOpponentPolicy.temperature` has `"minimum": 0`, and
`pack-validation.ts` checks `mode` alone — the strings `temperature`, `topP` and
`targetElo` appear nowhere in `pack-validation.ts` or `pack-registry.ts`. A pack
authored with `temperature: -1` therefore loads cleanly today and would mint a
run that its own schema rejects, persisted and unnoticed until something
validated it. Creation rejects the copy instead of widening the run schema to
match the looser authored one, because the run bound is the correct one.

**`kind: "position"`** — the client supplies `start`, `feedbackPolicy` and
`opponentPolicy`; the registry is not consulted. Two rejections beyond the wire
parse of §7:

- `opponentPolicy.mode === "theory_strict"` → `INVALID_REQUEST`
  `A position session cannot use theory_strict; it has no spine`, naming
  `/session/opponentPolicy/mode`. This is I6, enforced at the only point where a
  position session comes into existence.
- the same numeric bounds as the pack path, applied to the client's values.

The stored title (`storage.create`'s third argument, `service.ts:174-178`) is the
pack title for pack runs and the constant `Position session` for position runs;
`storage.create`'s default becomes `run.packId ?? run.id`.

**The silent fallback itself is also closed, one layer down.** I6 removes the
only *new* way to reach it, but `#theoryStrict` degrades to `#humanCommon`
(`opponent-selector.ts:453-457`) for shipped pack runs too, whenever play leaves
the authored spine and `spineChildren` returns `undefined`
(`opponent-selector.ts:337-346`). Leaving theory when theory runs out is correct
behaviour; doing it without a word is not. The selector logs
`DEGRADED_THEORY_SPINE: position is off the authored spine; falling back to
human_common` on that branch, exactly mirroring the shipped
`DEGRADED_POLICY_MASS` warning nine lines below it
(`opponent-selector.ts:465-468`). No change to `OpponentSelection`, so no change
to the event payload or the run schema.

### 6. The withholding surfaces — current and specified behaviour

Six surfaces branch on pack presence today. Every one of them stops doing so.
`#registeredPack` survives, but only for **pack semantics** — orchestration
(`service.ts:195,214`), pack PGN (`service.ts:400-402`) and authored feedback —
never for withholding.

| # | Surface | Current behaviour | Specified behaviour |
|---|---|---|---|
| 1 | `GET /runs/:id/graph` → `publicNodes(pack, run)` (`service.ts:259`, `feedback-policy.ts:17-32`) | `pack === undefined` → **every** node with **every** engine ref. Otherwise strips `engine:` refs until `feedbackIsRevealed` | `publicNodes(run)`. Strips `engine:` refs from every node unless `feedbackDisclosed(run)`. No pack argument, no registry lookup, identical filtering |
| 2 | `GET /runs/:id/events` → `publicEvents(pack, run, sinceSeq)` (`service.ts:280`, `feedback-policy.ts:42-60`) | `pack === undefined` → the **whole** event stream including `evidence.attached`. Otherwise truncates the returned page at the first engine-feedback event | `publicEvents(run, sinceSeq)`. Truncates at the first engine-feedback event unless `feedbackDisclosed(run)`. Truncation, not filtering, is retained: the page must stay a contiguous prefix (`events.ts:43-46`, `run-state.ts:94-99`) |
| 3 | `POST /runs/:id/compare` (`service.ts:269-276`) | Returns the full comparison whenever `pack === undefined`, including `evidence.a`/`evidence.b` | `feedbackDisclosed(run)` decides; `comparisonWithoutEngineFeedback` (`service.ts:64-93`) is unchanged |
| 4 | `GET /runs/:id/evidence` (staged) (`service.ts:326-333`) | `pack === undefined` → the staged page is returned in full. In practice empty, because nothing was ever enqueued (`service.ts:197,216`) | Returns `{results: [], nextSeq: sinceSeq}` unless `feedbackDeliveryOpen(run)`. Same empty-page shape as shipped (`service.ts:330`) |
| 5 | `POST /runs/:id/evidence` (apply) (`service.ts:347-395`) | `pack === undefined` → **no gate**: a writer may append `evidence.attached` and an objective upgrade into the durable log with nothing withheld | Throws `FEEDBACK_WITHHELD` (409) unless `feedbackDeliveryOpen(run)`. This is the write gate on the one HTTP path that appends `evidence.attached` |
| 6 | `GET /runs/:id/authored-feedback` (`service.ts:335-345`) | `pack === undefined` → `PACK_NOT_FOUND` (404) for **both** a pack-less run and a run whose pack is unregistered | Branch on `sessionKind`, not on the registry: `sessionKind: "position"` → `200 {items: [], hasWithheldAuthoredContent: false}`, because a position session has no authored content and a 404 would force every client to fork. `sessionKind: "pack"` with no registered pack keeps `PACK_NOT_FOUND` — the content exists and is unavailable, which is a different fact |

**The two layers are both necessary, and the scope of each is stated rather than
assumed.** Surface 5 gates a write; surfaces 1–4 gate reads. It would be
convenient to argue that gating the write makes the reads redundant, and that
argument is false. Its premise would be "`applyEvidence` is the only writer of
engine refs into the durable log", and the tree falsifies it: `attachEvidence` is
a public runtime export (`packages/runtime/src/index.ts:22`), and the shipped
suite calls it directly and then persists through `storage.save` — at
`apps/server/src/drill-client-server.test.ts:383-390` inside the test at `:359`
(`delayed_checkpoint hides engine feedback but not rules refs until a
checkpoint`), and again at `:484` and `:512` in the comparison test at `:458`.
Those writes bypass surface 5 entirely, and the tests assert that `/graph` and
`/events` still withhold.

The claim this RFC does make, bounded to what is checkable:
`RunService.applyEvidence` (`service.ts:370`) is the **only production caller** of
`attachEvidence` — the other four callers are test files
(`drill-client-server.test.ts`, `compare.test.ts`, `run-state.test.ts`,
`screens.test.ts`). So:

- Over the HTTP surface, no engine ref enters the durable log without passing
  `feedbackDeliveryOpen`. That is surface 5's guarantee and its whole extent.
- Over the log as a data structure, engine refs may be present at any time, put
  there by any in-process writer. Surfaces 1–3 hold anyway, because they read the
  run and its policy and never the path that wrote it.
- Surface 4 is neither: it gates *staged* results, which are queue state and have
  not entered the log at all. It is the only surface an in-process writer cannot
  route around, because there is no second way to reach the queue's page.

Neither layer alone is sufficient, and acceptance criterion 15 keeps the
production-caller claim true by checking it rather than restating it.

### 7. Evidence generation for every run, and `POST /runs` never-silent (D3)

**Generation.** `service.ts:190,197` and `:209,216` currently read
`if (pack !== undefined)`. Both guards become unconditional: every `move` and
`opponentPly` requires the evidence queue (`#requiredEvidenceQueue()`, which
throws `EVIDENCE_UNAVAILABLE` 503) and enqueues one `eval` job for the new cursor
node. A pack-less run that produced no evidence at all had nothing to withhold;
that is the other half of D2.

`#enqueueMoveEvidence` → `enqueueEvidence` builds `objectiveRequest` from
`run.packId`/`run.packDigest` (`service.ts:313-322`). `ObjectiveEvidenceRequest`
requires both as strings (`packages/runtime/src/objective.ts:83-92`), so for
`sessionKind: "position"` the `objectiveRequest` key is **omitted** — it is
optional on `EvidenceJobInput` (`apps/server/src/evidence-queue.ts:21`) and the
queue only calls the upgrader when it is present (`evidence-queue.ts:199-202`).
A position run therefore never produces `objective.state_changed`, which is
correct: objective rules come only from `pack.objective.successConditions`
(`pack-orchestrator.ts:102-117`). No upgrader is wired in the composed
application in any case (`application.ts:300-302`).

**`requestObjectiveEvidence` is the second producer of that request, and it does
not compile after the nullable change.** It builds an `ObjectiveEvidenceRequest`
directly from `run.packId`/`run.packDigest` (`objective.ts:300-316`, the fields at
`:307-308`) into an interface that requires both as `string` (`objective.ts:85-86`).
It has no production caller — the runtime re-exports it (`index.ts:40`) and
`objective.test.ts:383` is its only invocation — but a public export that would
silently start emitting `packId: null` into an upgrader contract is a defect
whether or not this repo currently calls it.

`ObjectiveEvidenceRequest` keeps both fields as required strings: it is a
pack-scoped contract, and an upgrader with no
`pack.objective.successConditions` has nothing to evaluate against
(`pack-orchestrator.ts:102-117`). `requestObjectiveEvidence` gains the matching
guard as its first statement — a run with `packId === null` throws
`RuntimeError("INVALID_RUN_SESSION", "Objective evidence requires a pack
session")` before touching the upgrader, which also narrows the two fields for
the type checker. `RuntimeErrorCode` (`packages/runtime/src/errors.ts:6-11`) gains
that one member. No REST mapping is added: the handler's `RuntimeError` arm is a
default-carrying conditional, not an exhaustive switch (`rest.ts:248-257`), so an
unmapped code answers 409 — which is the right status for "this run is the wrong
kind of session" if the function ever acquires a route.

**Never-silent (D3).** `parseCreateInput` (`rest.ts:192-211`) and
`parsePolicyConfig` (`rest.ts:156-177`) read known keys and construct fresh
objects, so unknown keys — at the top level and nested — are dropped without
error. A helper is added to `rest.ts`:

```ts
function closedRecord(
  value: unknown,
  pointer: string,
  allowed: readonly string[],
): Record<string, unknown>;
```

It calls the shipped `record()` (`rest.ts:45-50`), then throws
`INVALID_REQUEST` on the **lexicographically first** unknown key (deterministic
messages) with the exact JSON pointer, e.g.

```
{"error":{"code":"INVALID_REQUEST",
          "message":"Unknown field /policyConfig/locus/engineIds/0/name"}}
```

Applied to every object inside the create body and nowhere else — D3 names
`POST /runs`; the other POST bodies keep their current parsers, and the helper is
written so they can adopt it in the RFC that changes their shapes:

| Pointer | Allowed keys |
|---|---|
| `/` | `id`, `session`, `policyConfig`, `seed`, `createdAt` |
| `/session` (`kind: "pack"`) | `kind`, `packId`, `packDigest` |
| `/session` (`kind: "position"`) | `kind`, `start`, `feedbackPolicy`, `opponentPolicy` |
| `/session/start` | `fen`, `side` |
| `/session/opponentPolicy` | `mode`, `targetElo`, `temperature`, `topP` |
| `/policyConfig` | `seedMode`, `locus` |
| `/policyConfig/locus` | `executedAt`, `engineIds`, `modelIds` |
| `/policyConfig/locus/engineIds/{i}`, `/modelIds/{i}` | `id`, `version` |

The allowed set for `/session` is **kind-dependent**, so `packId` inside a
position session and `feedbackPolicy` inside a pack session are both rejected by
name rather than ignored. That is the authority rule of §5 made mechanical: a
client cannot weaken a pack's authored reveal timing by supplying a policy.

The new request body:

```jsonc
// pack session
{ "id": "run-1",
  "session": { "kind": "pack", "packId": "najdorf-transition-schema-example",
               "packDigest": "sha256:…" },        // optional staleness check
  "policyConfig": { … }, "seed": 73 }

// position session
{ "id": "run-2",
  "session": { "kind": "position",
               "start": { "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                          "side": "white" },
               "feedbackPolicy": "attempt_end",
               "opponentPolicy": { "mode": "human_common", "targetElo": 1500 } },
  "policyConfig": { … }, "seed": 73 }
```

`kind` is required and closed; an absent or unknown `kind` is
`INVALID_REQUEST` naming `/session/kind`. The response stays `201 {run}`.

### 8. Storage: summary widening and the v0.4 quarantine

`RunSummary.packId` is a required string (`apps/server/src/storage.ts:16`) and
`parseSummary` rejects a row without one (`:102-121`). Quoted against the shape
F3 leaves behind — `activeWriterId` removed, `viewerRole` added (F3 §9, row 3) —
v0.5 adds three of these nine lines:

```ts
export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly sessionKind: RunSessionKind;   // new
  readonly packId: string | null;         // widened
  readonly sessionDigest: string;         // new
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly viewerRole: RunRole;           // F3, untouched here
}
```

`summaryFields` (`storage.ts:129-141`) writes `sessionKind` and `sessionDigest`
and widens `packId`; `parseSummary` (`:102-121`) accepts `packId: string | null`
and requires both new fields.

Stored v0.4 snapshots cannot be upgraded in place. Their `run.started` event does
not contain the learner's side, the feedback policy or the opponent policy —
those lived only in the pack document, and `RunStorage` has no registry to
consult (`storage.ts:29-37`). Inventing them would mean guessing the two fields
that govern withholding and turn order. They are therefore **quarantined, not
deleted**:

- `STORAGE_VERSION` 2 → 3, per the migration register: F3's identity columns are
  migration 2, so this is **migration 3**, `quarantine pre-0.5 run snapshots`. It
  runs in the shipped `PRAGMA user_version` runner (`storage.ts:339-374`),
  unchanged: `ALTER TABLE drill_runs ADD COLUMN schema_version TEXT`, then for
  every row parse `snapshot_json` and write its `schemaVersion` — the field is
  part of the serialized run (`storage.ts:200`). A row whose snapshot has no
  parseable `schemaVersion` is stamped `'unknown'` rather than raising: a
  migration that throws leaves the database unopenable, which is a worse outcome
  than a quarantined row. It rewrites no summary, because only pre-0.5 rows can
  exist at that moment.
- `create()` and `save()` write `schema_version = run.schemaVersion` alongside
  `summary_json`.
- `read()` returns `undefined` for a row whose `schema_version` is not
  `DRILL_RUN_SCHEMA_VERSION`, so those runs answer `RUN_NOT_FOUND` (404) instead
  of `STORAGE_FAILURE` (500) from a failed replay.
- `list()` adds `schema_version = ?` to the predicate it already carries after F3
  (`WHERE` on the `run_grants` join, F3 §7).
- Nothing is destroyed; the rows stay on disk and remain exportable by hand.

**Migration 1 must stop replaying, or the ladder cannot reach migration 3.**
`#addRunSummaries` (`storage.ts:376-401`) is migration 1, and on a database still
at `user_version = 0` it runs *before* the quarantine. It calls
`readBackReplay(snapshot.events)` (`:394`), which is `projectRun`
(`packages/runtime/src/replay.ts:62`), and then titles the summary with
`run.packId` (`:397`). Under v0.5 both break on exactly the rows it exists to
handle: `projectRun` rejects a v0.4 `run.started` for its missing `sessionKind`,
`sessionDigest` and `start`, and `run.packId` is no longer a `string`. The result
would be `STORAGE_FAILURE` on open — an old database that this RFC's quarantine
was written to preserve, destroyed by a migration two steps earlier.

The fix is to remove the dependency, not to special-case it. `snapshot_json` is
`JSON.stringify(run)` (`storage.ts:200`), so every field `summaryFields` reads —
`packId`, `branches`, `nodes`, `activeCursor` — is already in the parsed object;
the replay recovers nothing the JSON does not already hold. Migration 1 reads
them directly, keeps its `snapshot.id !== row.id` check, and writes the same
summary JSON it writes today with `title = snapshot.packId ?? row.id`.
`activeObjectiveState` (`storage.ts:123-127`) is retyped to its structural
subset, `{nodes, activeCursor}`, so migration 1 and `summaryFields` keep sharing
one implementation.

The general rule this establishes, and the reason it belongs in this RFC rather
than a follow-up: **a migration may not depend on the current runtime's
projection**, because a migration exists precisely to handle shapes that
projection no longer accepts. Migration 3 already obeys it — it reads
`schemaVersion` out of the JSON and never replays.

### 9. PGN and the client transport

`pgnHeaders` (`packages/runtime/src/pgn.ts:55-70`) interpolates `run.packId` into
`Event` and `TabiyaPack`, which would render `null` for a position run. A
position run gets:

```
[Event "Tabiya session: position"]
[TabiyaRun "<run.id>"]
[TabiyaSession "<run.sessionDigest>"]
```

with `TabiyaPack` **omitted** rather than emitted empty. Pack runs keep every
header they emit today with the same values, and gain the one new
`TabiyaSession` key immediately after `TabiyaPack`, so one header identifies the
session for both kinds.

**`exportPackRunPgn` is not unchanged.** It is still selected only for runs with
a registered pack (`service.ts:399-403`), so it never *sees* a position run — but
it builds one. `combinedRun` (`pack-pgn.ts:121-144`) synthesizes a scratch run by
calling `createRun` with `packId`, `packDigest` and `startFen`
(`pack-pgn.ts:131-139`), three fields that §5 replaces. The call becomes:

```ts
let combined = createRun({
  id: `${source.id}:combined-pgn`,
  session: {
    kind: "pack",
    packId: source.packId,
    packDigest: source.packDigest,
    start: source.start,
    feedbackPolicy: source.feedbackPolicy,
    opponentPolicy: source.opponentPolicy,
  },
  sessionDigest: source.sessionDigest,
  policyConfig: source.policyConfig,
  seed: source.branches[0]?.seed ?? 0,
  ...(createdAt === undefined ? {} : { createdAt }),
});
```

Three choices in that block are deliberate:

- `start: source.start`, not `pack.start`. The source run's start is already
  canonical (§2), so I4 holds for the scratch run by construction. Re-deriving it
  from `pack.start.fen` would reintroduce the raw-vs-canonical gap in the one
  place the export can least afford it — and it is safe to drop, because
  `exportPackRunPgn` has already asserted that this pack is byte-identical to the
  one the run started from (id at `pack-pgn.ts:163-168`, digest at `:169-174`)
  and that the run root equals the canonicalized pack start (`:176-183`). That
  last check spells `canonicalFen(positionFromFen(pack.start.fen))` inline at
  `:177`; `canonicalRunStart` is that expression given a name and one home.
- `sessionDigest: source.sessionDigest`, copied rather than recomputed. For
  `kind: "pack"` the session source is exactly the identity pair (§2), which the
  scratch run reproduces, so recomputation is guaranteed to return the same
  string; copying avoids a second `await` in an export path.
- The scratch run is a pack session, so `pgnHeaders` emits `TabiyaPack` and a
  `TabiyaSession` equal to the source run's. The exported headers are unchanged
  from today apart from that one added key.

`combinedRun`'s `source` parameter narrows to `PackRun` (§2), which is what makes
`packId`, `packDigest` and `feedbackPolicy` assignable to the pack variant of
`CreateRunSession` without a non-null assertion. The narrowing happens once, in
`exportPackRunPgn`, through `isPackSession`.

`exportPackRunPgn` also gains an explicit guard for the shape its signature now
permits: a `run` for which `isPackSession` is false throws
`PackRunPgnError("PACK_ID_MISMATCH", \`Run ${run.id} is a position session and
has no pack\`)`. Without it the existing `pack.id !== run.packId` check
(`pack-pgn.ts:163-168`) would still reject, but with the message
`Pack X does not match run pack null`, which describes a mismatch that did not
happen. `PackRunPgnErrorCode` gains no member.

Client transport (`apps/web/src/lib/api.ts:159-165`):

```ts
export type CreateRunSessionRequest =
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest?: string }
  | {
      readonly kind: "position";
      readonly start: { readonly fen: string; readonly side: "white" | "black" };
      readonly feedbackPolicy: "attempt_end";
      readonly opponentPolicy: PositionOpponentPolicy;
    };

export interface CreateRunRequest {
  readonly id: string;
  readonly session: CreateRunSessionRequest;
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly createdAt?: string;
}
```

`RunApi` gains `reveal(runId, writerId, at?): Promise<MutationResult>` posting to
`/runs/:id/reveal`. `DrillSessionController.startPack` (`session-controller.ts:209-217`)
sends `{kind: "pack", packId}`, and `policyConfigDigest` keeps using the pack
digest (`session-controller.ts:360`) because no pack-less client entry exists
yet.

**One more controller change is required, because this RFC puts runs into
`GET /runs` that the shipped client cannot open.** `resume` fetches the pack
named by the `run.started` event without checking whether there is one
(`session-controller.ts:176-177`, `this.#api.pack(started.data.packId)`), so a
position run resolves to `GET /packs/null` and surfaces a 404 as the screen's
error string. That is reachable from the shell today: `App.svelte:128,132` fills
the run lists from `GET /runs`, `:139` calls `controller.resume(next.runId)` for
`/play/run/:runId`, and `:68` makes `runs[0]` the home screen's resume card — so
the newest position run in the deployment becomes the front page's offer.

`resume` therefore branches on `started.data.sessionKind` before the pack fetch:
`"position"` sets the error `This run is a position session; the position player
is not built yet` and returns, leaving `busy: false`. It is a refusal, not a
feature — the position player is out of scope below — but the alternative is a
404 on a URL containing the literal string `null`, which tells a learner nothing
and an operator less. Run-list rows render from the summary's `title`, which is
`Position session` for these runs (§5), so they are already identifiable without
a component change.

**`RunStateStore` stops taking a pack.** Its `#pack` field is used for exactly one
thing — `feedbackRevealed(this.#pack, …)` at `run-state.ts:229` and `:312` — so
the constructor and the `resume` static drop the parameter and call
`feedbackDeliveryOpen(run)` from the runtime instead. The local `feedbackRevealed`
(`run-state.ts:75-87`) is deleted, removing the client's private copy of the
policy rule. `DrillSessionController.#newStore` (`session-controller.ts:396-404`)
drops the argument. No Svelte component changes.

## Deviations from design

1. **No `GET /runs/:id/session` endpoint**, though `planning/breadth/session-contexts.md`
   §C2 pins one. Under §1 the run's own `run.started` event carries the complete
   session definition, and the shipped resume path already reads it
   (`session-controller.ts:171-177` fetches `/events?sinceSeq=0` before anything
   else). A second projection of the same fields would recreate exactly the
   defect this RFC removes: two sources of truth for `feedbackPolicy`. The
   projection type the client screens will consume is a client-side derivation,
   and it belongs to the change that substitutes it into those screens.
2. **The dossier's C1 pins `sessionKind: "pack" | "position"` plus a run-level
   `start` and `feedbackPolicy`; this RFC adds `opponentPolicy` and
   `sessionDigest` as well.** Without `opponentPolicy` a resumed position run
   cannot ask for the same opponent it started with — the value comes from the
   pack document today (`session-controller.ts:349,359`) — so "a resume path
   identical to a pack run's" would be false. `sessionDigest` answers the
   identity half of the same question.
3. **`start.fen` duplicates `nodes[0].fen`.** Kept, with invariant I4 enforced in
   projection, because the session source must be digestible as a document and a
   derived-only start could not appear in `run.started` for replay.
4. **ADR-0006 says "hide most feedback until a semantic checkpoint or segment
   end"; `attempt_end` adds a third boundary.** A pack-less run has no authored
   checkpoints, so the ADR's two boundaries are unreachable. The end of an
   attempt, declared by the learner, is the only semantic boundary a pack-less
   session has, and it preserves the ADR's rationale exactly: nothing is shown
   during the decision or its consequence. The owner ruling that Just Play's
   recognition is "a passive marker the player may open"
   (`design/03-product-breadth.md` §The foundation edge) is the same shape — the
   player chooses when to look — and this RFC applies it to engine evidence.

## Acceptance criteria

Against the shipped fixtures: `schemas/drill_pack.example.json`
(`najdorf-transition-schema-example`, `delayed_checkpoint`, `start.side: "white"`),
`content/drafts/anti-caro-advance.json`, and the standard initial FEN for
position sessions.

1. **A pack-less run plays the whole loop.** `POST /runs` with the §7 position
   body returns 201 with `packId: null`, `packDigest: null`,
   `sessionKind: "position"`, `feedbackPolicy: "attempt_end"` and a
   `sessionDigest` matching `^sha256:[0-9a-f]{64}$`. That run then commits six
   plies (three via `POST /moves`, three via `selection` payloads), rewinds to
   ply 2, plays a different move — which auto-forks (`runtime.ts:222-229`) —
   compares the two branches, exports a legal PGN whose headers
   carry `TabiyaSession` and no `TabiyaPack`, and is rebuilt identically from
   `GET /runs/:id/events?sinceSeq=0` through `projectRun` after
   `clearSnapshotCache()`.
2. **The leak test (the one this RFC exists for).** Build two runs over the same
   moves: (a) a `najdorf-transition-schema-example` run that has reached no
   checkpoint, (b) a position run that has never been revealed. Attach engine
   evidence to both by the bypass the shipped suite already uses
   (`attachEvidence` + `storage.save`, as at `drill-client-server.test.ts:383-390`).
   Assert for **both**, with identical expectations: `/graph` nodes carry
   `rules:` refs and no `engine:` ref; `/events` truncates before the
   `evidence.attached` event; `/compare` returns empty `evidence.a`/`evidence.b`;
   `GET /evidence` returns `{results: [], nextSeq: 0}`; `POST /evidence` returns
   409 `FEEDBACK_WITHHELD`. The test fails on today's code at every one of the
   five surfaces for run (b).
3. **Pack-run withholding is bit-identical.** `drill-client-server.test.ts:359`
   (`delayed_checkpoint hides engine feedback but not rules refs until a
   checkpoint`) and `:570` (`segment_end stays closed at the first checkpoint and
   opens on segment completion`, whose staged-evidence assertions begin at `:592`)
   pass **unmodified except for the create-body shape and the `await` on
   `service.create`**, including the exact event-type sequence
   `["run.started","move.committed","objective.state_changed"]`.
4. **Reveal opens and the next move closes.** On a position run: enqueue evidence
   after a move; `GET /evidence` is empty; `POST /reveal` → 200 with one
   `feedback.revealed` event; `GET /evidence` returns the staged result;
   `POST /evidence` applies it and `/graph` now shows the `engine:` ref; commit
   one more move; `GET /evidence` is empty again and `POST /evidence` returns 409;
   `/graph` still shows the previously applied ref (durable disclosure is
   monotonic). A second `POST /reveal` inside one open window returns 200 with
   `emitted: []` and appends nothing.
5. **Reveal is refused where it has no meaning.** `POST /reveal` on a
   `delayed_checkpoint` run → 400 `INVALID_REQUEST` naming its policy; from a
   non-writer → 409 `NOT_ACTIVE_WRITER`.
6. **Creation authority.** A pack session carrying `feedbackPolicy` → 400 naming
   `/session/feedbackPolicy`; a position session carrying `packId` → 400 naming
   `/session/packId`; a position session with `feedbackPolicy: "delayed_checkpoint"`
   → 400; a pack whose `start.side` is absent → 400 naming the pack; a stale
   `packDigest` → 400 "Client pack digest is stale" (unchanged).
   Also I6: a position session with `opponentPolicy.mode: "theory_strict"` → 400
   naming `/session/opponentPolicy/mode`, with no run row written. Also the
   authored-bounds gap: a pack carrying
   `opponentPolicy: {mode: "human_common", temperature: -1}` loads into the
   registry — the pack schema and `pack-validation.ts` both accept it — and then
   fails `POST /runs` with 400 naming the pack and `temperature`. That case needs
   its own fixture, because the whole point is that pack validation does not
   catch it. Separately, `OpponentSelector` logs one `DEGRADED_THEORY_SPINE`
   warning when a `theory_strict` request reaches a position off the spine, and
   still returns a legal Maia move.
7. **D3.** `POST /runs` with a valid body plus `policyConfigDigest` at the top
   level → 400 with message `Unknown field /policyConfigDigest`; plus
   `{"policyConfig":{"locus":{"engineIds":[{"id":"a","version":"1","name":"x"}]}}}`
   → 400 with `Unknown field /policyConfig/locus/engineIds/0/name`. Two unknown
   keys in one object report the lexicographically first.
8. **Identity.** Two position runs created from the same `start`,
   `feedbackPolicy` and `opponentPolicy` but different `id` and `seed` have the
   same `sessionDigest`; changing `opponentPolicy.targetElo` changes it. A unit
   test on `digestSessionSource` asserts that an omitted `targetElo` and an
   explicit `targetElo: null` produce different digests, which is why the builder
   omits absent optionals instead of nulling them. Two runs of the same pack
   at the same digest share a `sessionDigest`, and it changes when the pack
   document changes.
   **Canonicalization is asserted before the digest, not after.** Two position
   sessions whose `start.fen` differs only in a spelling `canonicalFen`
   normalizes away produce the **same** `sessionDigest` and the same
   `run.start.fen`; the stored `run.start.fen` equals `run.nodes[0].fen` in every
   run either kind creates, including the scratch run `combinedRun` builds.
   Digesting before canonicalizing fails this criterion, which is how it stays
   fixed.
9. **Schema.** `packages/schema/src/drill-run.test.ts` validates a v0.5 pack run
   and a v0.5 position run, and rejects, each with its own fixture under
   `schemas/fixtures/drill-run/`: `packId` set with `sessionKind: "position"`;
   `attempt_end` with `sessionKind: "pack"`; `packId` present with `packDigest`
   null; `opponentPolicy.mode: "theory_strict"` with `sessionKind: "position"`
   (I6); a `run.started` missing `sessionDigest`; and a run missing `sessionKind`
   entirely — which must fail on `required` rather than slip past both `allOf`
   branches vacuously.
10. **Projection invariants.** `projectRun` throws on a `run.started` whose
    `start.fen` differs from `rootNode.fen` (I4), on a half-null pack pair (I1),
    on a position session declaring `theory_strict` (I6), and on a
    `feedback.revealed` naming an unknown node.
11. **Evidence for every run.** `service.move` on a run of either kind enqueues
    exactly one `eval` job; a position run's job carries no `objectiveRequest`;
    a service constructed without an evidence queue throws
    `EVIDENCE_UNAVAILABLE` on `move` for both kinds. The nine test services that
    construct `new RunService(storage)` or `{evidenceQueue}` only
    (`server.test.ts:72,239`, `latency.test.ts:117`, `opponent-selector.test.ts:409`,
    `capabilities.test.ts:77`, `evidence-queue.test.ts:207,258,332,377`) are
    amended to supply a queue and to create **position** sessions, which is what
    they were always modelling. Every `service.create` call site gains `await`
    (`rest.ts:396`, `server.test.ts:240`, `authored-feedback.test.ts:262`,
    `drill-client-server.test.ts:328,372,471,588`, and the nine above);
    `authored-feedback.test.ts:262` needs no queue because it plays through the
    runtime helpers rather than `service.move`.
12. **The three evidence tests keep testing what they tested.**
    `evidence-queue.test.ts:238` (`stages over GET, enforces the writer lease,
    then appends evidence and its objective upgrade`) and `:321` (typed sources)
    gain one `service.reveal(runId, "writer-a", at)` before their first
    `GET /evidence`; every existing assertion on staging, `nextSeq`, the lease
    409, application order and payload sources is unchanged. `:361` (durable
    comparison) reveals once before each `applyEvidence`, demonstrating the
    re-closing window across its rewind, and its `compare` assertions are
    unchanged. `:192` (rewind cancellation) is unchanged apart from the create
    body.
13. **Storage, from both ends of the ladder.** A database written by the current
    code (v0.4 snapshots at `user_version = 2` after F3) opens without error,
    reports migration 3 once via `onMigration` (`storage.ts:362`), omits those
    rows from `GET /runs`, and answers 404 `RUN_NOT_FOUND` — not 500 — for
    `GET /runs/:id/graph` on one of them. A second open reports no migration and
    leaves `user_version = 3`. **And from the bottom:** a database at
    `user_version = 0` — v0.4 snapshots, no `summary_json` — opens under the new
    build, runs migrations 1, 2 and 3 in order, and ends with every legacy row
    quarantined and readable-as-absent. This is the criterion that fails if
    migration 1 still replays through `projectRun`, and it needs a checked-in
    fixture database because no current code path can produce a `user_version = 0`
    file. A v0.5 run round-trips through `list()` with `sessionKind`,
    `packId: null` and `sessionDigest`.
14. **Client.** `RunStateStore` compiles and its tests pass with no pack
    argument; `run-state.test.ts` asserts evidence polling starts only while
    `feedbackDeliveryOpen` is true and stops after the next committed move;
    `api.test.ts` asserts the new create body and the `/reveal` call.
    `session-controller.test.ts` asserts that resuming a position run sets the
    named refusal and never calls `GET /packs/…`. The Playwright pack walkthrough
    (`playwright.config.ts`) passes unchanged.
15. **One policy rule, one implementation; one durable writer.**
    `grep -rn "feedbackIsRevealed\|feedbackRevealed" apps packages` returns
    nothing outside the new runtime module's own tests, and
    `grep -rn "attachEvidence" apps packages` returns exactly one non-test,
    non-export production call site (`service.ts:370`) plus the runtime's own
    definition and re-export. The second grep is the checkable form of §6's
    bounded claim; if a future change adds a second production writer, §6's
    scoping is wrong and this criterion says so before the barrier does.
16. **The two pack-identity call sites.** `requestObjectiveEvidence` throws
    `INVALID_RUN_SESSION` on a position run and is otherwise unchanged
    (`objective.test.ts:383` passes as written against a pack run).
    `exportPackRunPgn` produces a byte-identical PGN to today's for a pack run
    apart from the added `TabiyaSession` header, and throws `PACK_ID_MISMATCH`
    naming the position session for a pack-less run.
17. `make verify` green; `docs/branch-runtime.md` updated with run schema v0.5,
    the two predicates and the reveal act; `docs/drill-client.md` §Feedback
    withholding updated to describe the run-level barrier.

## Open questions

None.

## Changelog

- 2026-08-12: created.
- 2026-08-12: revised after adversarial review; four blockers closed and three
  boundary conditions found while closing them.
  - **`theory_strict` no longer degrades silently.** Invariant I6 (§1) forbids it
    on a position session and creation rejects it by JSON pointer (§5), because
    the mode's spine has exactly one producer — `pack.spine` — and a pack-less
    session has no source for it. The shipped fallback at
    `opponent-selector.ts:453-457` is also made audible for pack runs that leave
    the spine, mirroring `DEGRADED_POLICY_MASS`. The reviewer's alternative
    ("specify where the geometry comes from") is circular: the geometry is an
    authored spine, which is a pack.
  - **The session digest is computed after canonicalization, not before** (§2, §5
    step order, §9's `combinedRun`). The bug was worse than a split identity: the
    raw client FEN would have been stored in `start.fen` while `createRun` wrote
    the canonical spelling into `nodes[0].fen`, so I4 would have thrown on replay
    for any non-canonical input. `canonicalRunStart` gives the normalization one
    home, and `createRun` now rejects a non-canonical start rather than fixing it
    silently.
  - **Both missed call sites are specified, and the false claim is withdrawn**
    (§7, §9). `requestObjectiveEvidence` (`objective.ts:300-314`) gains an
    explicit pack-session guard instead of emitting `packId: null` into a
    contract typed `string`. "`exportPackRunPgn` is unchanged" was wrong:
    `combinedRun` (`pack-pgn.ts:121-144`) calls `createRun` with the three fields
    §5 replaces. It now copies the source run's canonical start and its
    `sessionDigest` rather than re-deriving either.
  - **Rebased to migration 3, `STORAGE_VERSION` 2→3**, with F3 declared a
    dependency in the header and a new §Landing order stating every shape this
    RFC inherits from it — `RunStorage.create`, `RunStorage.list`, `RunSummary` —
    plus the authorization class of `POST /runs/:id/reveal`, which F3's endpoint
    table predates.
  - **Migration 1 must stop replaying** (§8). It calls `readBackReplay` and reads
    `run.packId`, so under v0.5 a database still at `user_version = 0` would fail
    to open before migration 3 could quarantine anything — destroying exactly the
    data the quarantine exists to preserve. Every field it needs is already in
    `snapshot_json`. General rule recorded: a migration may not depend on the
    current runtime's projection.
  - **A pack the registry accepts can mint a run its own schema rejects** (§5).
    `$defs.opponentPolicy.temperature` has no minimum, `runOpponentPolicy` sets
    `minimum: 0`, and `pack-validation.ts` mentions none of the numeric keys.
    Creation rejects the out-of-bounds copy rather than loosening the run schema.
  - **The shipped client cannot open the runs this RFC creates** (§9). `resume`
    fetches `/packs/${started.data.packId}`, and `App.svelte` puts the newest run
    on the home screen, so a position run would offer the front page a 404 on the
    string `null`. `resume` now refuses by name. The refusal is stated as a
    refusal; the position player remains out of scope.
  - **The two-predicate barrier's scope is bounded rather than asserted** (§6).
    The claim that a write gate makes the read filters redundant would rest on
    "`applyEvidence` is the only writer", which `drill-client-server.test.ts:383-390`
    falsifies. What is true and checkable — `applyEvidence` is the only
    *production* caller of `attachEvidence` — is stated, scoped to the HTTP
    surface, and pinned by acceptance criterion 15.
  - Coordinates re-verified against the tree throughout; corrected
    `service.ts:136-141`→`:135-141`, `:317-318`→`:315-316`,
    `authoredFeedback` `:338-343`→ surface `:335-345`,
    `runtime.ts:132`→`:131-132`, `drill-client-server.test.ts:379-390`→`:383-390`,
    the `segment_end` test's `it` line, and the loose "13 files" claim in
    §Out of scope.
