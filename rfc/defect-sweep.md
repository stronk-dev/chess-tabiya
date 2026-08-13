# RFC: Defect sweep — six open defects, and the one shape underneath five of them

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/00-thesis.md` §Target player (lines 84-86: the on-ramp band's
  three knobs, one of which is "pack-declared immediate blunder-guard feedback");
  `design/03-product-breadth.md` gate B1 (line 161: "met with residuals — … `phase` is
  never projected") and the Play surface's "packs by phase" (line 134);
  `design/BACKLOG.md` open-defect rows D4 (line 117), D5 (118), D10 (128), D9 (129),
  D8 (130), D6 (132)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by
  owner ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.4 → 0.5:
  `start.side` becomes required and `feedbackPolicy` loses one enum member),
  **`rfc/archive/drill-client.md`** (`PackSummary` gains `phase`; the pack fetch validates
  `start.side` at the API boundary), **`rfc/archive/engine-workers.md`** (identity version
  parsing stops depending on whether the spec names the engine; the release Compose file
  gains the `engines` profile), **`rfc/archive/content-sourcing-position-seeds.md`** and
  **`rfc/archive/content-sourcing-syzygy.md`** (two graduation-blocker strings change
  wording)
- **Supersedes / superseded by:** —
- **Migration:** **none, and this is a claim with a reason, not an omission.** Nothing this
  RFC changes is persisted. The pack schema version is not written into any run row: it
  lives in `runtimeBuildInfo.drillPackVersion` (`packages/schema/src/index.ts:2,8`) which is
  served at `/` (`apps/server/src/index.ts:104`) and is absent from the capabilities payload
  (`apps/server/src/capabilities.ts:160-170`, which publishes `runSchemaVersion` only).
  `digestDrillPack` canonicalizes the pack document's own bytes, so narrowing the schema
  changes no shipped pack's digest. `STORAGE_VERSION` and the run schema are untouched. **No
  number is claimed in `rfc/README.md`'s migration register.**
- **Planning:** none

## Summary

Six defects sit open in `design/BACKLOG.md`, each small, each leaking into every new RFC as
a caveat. I re-verified all six against the tree. **All six are still real.** None was
incidentally fixed, though one — D9 — has drifted far enough from its ledgered description
that the ledger now understates it in one direction and overstates it in another, and one —
D8 — is larger than its row says: the schema declares **five** values the loader rejects,
not two.

Five of the six are one shape. A vocabulary is written down in two or more places — the JSON
Schema, a server constant, a runtime constant, an inline literal, a client `if` — and
nothing binds the copies. Where the copies happen to agree (D4) the defect is latent; where
they disagree (D8) an author can write a value that passes `make pack-check`'s schema stage
and is refused at load; where one copy says *optional* and the consumer assumes *present*
(D9, D6) the boundary condition is the bug. This RFC closes all six, and closes the shape by
making each vocabulary have exactly one writable source with a test that fails on the next
divergence.

D8 is the one with design content and it is decided **per value**, not aligned silently.
`immediate_blunder_guard` is **removed from the schema** (§2a); `perfect_tablebase` **stays
and becomes an honest declaration** (§2b). The line between them is stated as a rule the
codebase can check, and the on-ramp band's third knob becomes an explicitly unencoded knob
with a proposed BACKLOG row, rather than a knob the format pretends to offer.

## Motivation

### 1. The verification pass: what is still real

Every row was re-checked against the current tree. Coordinates in the ledger had drifted in
four of six cases; corrected coordinates are given here and are the ones this RFC cites.

| # | Ledger says | Verified | Corrected coordinates |
|---|---|---|---|
| D4 | server allow-list and "the client's recognized-action switch" are two hand-maintained lists that agree | **real, and it is three lists, not two** | `apps/server/src/pack-validation.ts:18`; the client is not a switch but a string literal inside a template, `apps/web/src/lib/CheckpointSheet.svelte:78`; the schema is a third source that constrains the same field by exclusion, `schemas/drill_pack.schema.json:462-470` |
| D5 | release compose hardcodes `ENGINE_MODE: maia` with an unconditional Maia dependency | **real, verbatim** | `deploy/compose.release.template.yaml:8` and `:17-19`; the dev file's shape it should mirror is `compose.yaml:12,20-23,27` |
| D6 | `PackSummary` omits `phase`; `grep -rn "phase" apps/web/src` finds only prose | **real; and the pack *detail* projection already ships it, which the row does not say** | `apps/server/src/pack-registry.ts:26-34` (summary type) and `:201-209` (construction) omit it; `pack-registry.ts:68` **does** project it on `GET /packs/:id`; `apps/web/src/lib/api.ts:16-23` mirrors the summary without it; the three `phase` hits in `apps/web/src` are `App.svelte:345`, `PackList.svelte:17` (prose) and `session-controller.test.ts:392` (an assertion that a `phase` key is absent) |
| D8 | two declared values validate and are rejected at load | **real, and understated: five values, in two different vocabularies** | `immediate_blunder_guard` at `schemas/drill_pack.schema.json:50-56` vs `apps/server/src/pack-validation.ts:111-134`; **four** opponent modes — `plan_defense`, `practical_resistance`, `perfect_tablebase`, `human_external` — at `schema:480-489` vs `pack-validation.ts:136-152`, because `SUPPORTED_POLICY_MODES` is `RUN_OPPONENT_MODES` and that is three members (`packages/runtime/src/types.ts:38-42`) |
| D9 | `start.side` is schema-optional; `packStartSide` throws, so a validating pack can crash the drill screen | **the format defect is real and worse than stated; the stated symptom is currently unreachable** | see §1a |
| D10 | both shipped Stockfish specs report `version: "unknown"` | **real, verbatim** | `apps/server/src/engine-supervisor.ts:111-140` (`parseIdentity`); `spec.name` is set at `apps/server/src/strong-engine.ts:50` and `apps/server/src/application.ts:188`, neither of which sets `version`, and `application.ts:282-283` constructs both without one; the B6b workaround — an authoring spec with no `name` — is `apps/server/src/sourcing/position-seeds.ts:67` |

**Nothing in this set was incidentally fixed.** The one thing that changed under D9 is a
mitigation added elsewhere, not a fix (§1a).

### 1a. D9 has drifted, in both directions

The ledger's symptom is a client crash. It is currently unreachable through the shipped
server, because `apps/server/src/service.ts:183-185` refuses to create a run for a pack
without a valid `start.side`:

```ts
const side = pack.document.start.side;
if (side !== "white" && side !== "black") {
  throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} does not declare start.side`);
}
```

Both client entry paths call `POST /runs` before any drill screen renders
(`apps/web/src/lib/session-controller.ts:223-231` for a new run;
`session-controller.ts:189-201` for resume, where the run already exists and therefore
already passed that guard), and both wrap the call in a `catch` that routes to the error
banner (`:205-210`, `:238-240`). So `packStartSide`'s `TypeError`
(`apps/web/src/lib/screen-model.ts:56-62`), reached from a `$derived` at
`apps/web/src/lib/DrillScreen.svelte:174`, cannot currently fire from a served pack.

That is not a fix. It relocated the failure and left a worse one behind. Two findings, both
verified:

1. **A pack that passes `make pack-check` green cannot be run.** The schema does not require
   `side` (`schemas/drill_pack.schema.json:108-118` requires `fen` only), and I confirmed by
   execution that the living fixture with `start.side` deleted validates `true`. The author
   gets a green check and a 400 at run time.
2. **The validator silently substitutes a side, and one lint then grades the wrong
   perspective.** `apps/server/src/pack-validation.ts:369` builds its trial run with
   `pack.start.side === "black" ? "black" : "white"` — a missing side becomes *white*, with
   no issue raised. Upstream, the Syzygy assessment check reads
   `const learner = pack.start.side` (`:346`) and compares `learner === sideToMove` (`:348`)
   without any presence check; with `learner` undefined that comparison is always false, so
   the declared category is unconditionally inverted (`:347`, `opposite(...)`) and
   `SYZYGY_ASSESSMENT_MISMATCH` fires — or fails to fire — against the wrong side. A
   never-silent validator is silently choosing a colour and grading a tablebase claim from
   it.

So D9 is real, its consequence is an authoring-time lie rather than a runtime crash, and the
fix belongs in the schema rather than in the client guard.

### 2. The shape: seven copies of four vocabularies

`grep` for each vocabulary and count the places a human has to remember to edit.

| Vocabulary | Copies | Agree today? |
|---|---|---|
| Checkpoint actions | schema, by exclusion (`schema:462-470`: any non-empty string except `capture_intent`); `SUPPORTED_CHECKPOINT_ACTIONS` (`pack-validation.ts:18`); a literal in the client (`CheckpointSheet.svelte:78`) | yes — one member, `compare_branches`. This is D4 |
| Opponent modes | schema enum, 7 (`schema:480-489`); `RUN_OPPONENT_MODES`, 3 (`packages/runtime/src/types.ts:38-42`); `DECLARED_UNIMPLEMENTED_POLICY_MODES`, 4 (`capabilities.ts:12-23`); an inline triple in the server (`service.ts:188`); the selector's `switch`, 3 (`opponent-selector.ts:388-394`) | **no** — half of D8, plus a fifth copy the ledger never named |
| Feedback policies | schema enum, 3 (`schema:50-56`); two literals plus one special case (`pack-validation.ts:111-134`); the `FeedbackPolicy` type, 2 (`pack-registry.ts:24`) | **no** — the other half of D8 |
| Objective types | schema enum, 11 (`schema:121-135`); `OBJECTIVE_TYPES`, 11 (`packages/schema/src/drill-pack/types.ts:1-13`) | yes — **and nothing tests it.** A fourth instance of D4's shape, one edit away from being D8 |

`OBJECTIVE_TYPES` is the proof that this repo already knows the right answer — a single
exported constant in the shared schema package — and the proof that the answer is incomplete
without a test binding it to the JSON Schema.

### 2a. Five boundary conditions, verified by execution

The class the reviewer named is "shapes the schema permits". I probed the living schema
directly with the shipped Ajv configuration (`allErrors: true, strict: true`, the same
options as `pack-validation.ts:44`), mutating `schemas/drill_pack.example.json`:

| Mutation | Schema verdict | Loader verdict |
|---|---|---|
| `start.side` deleted | **valid** | `pack-check` green; `POST /runs` 400 (`service.ts:185`) |
| `phase` deleted | **valid** | accepted; nothing downstream notices |
| `feedbackPolicy: "immediate_blunder_guard"` | **valid** | rejected, `UNSUPPORTED_FEEDBACK_POLICY` (`pack-validation.ts:112-122`) |
| `opponentPolicy.mode: "perfect_tablebase"` | **valid** | rejected, `UNSUPPORTED_OPPONENT_POLICY` (`pack-validation.ts:138-152`) |
| `checkpoints[0].actions: ["stop"]` | **valid** | rejected, `UNSUPPORTED_CHECKPOINT_ACTION` (`pack-validation.ts:155-172`) |
| `opponentPolicy.nonsenseKnob: 42` | **valid** | accepted silently — `opponentPolicy` is `additionalProperties: true` (`schema:496`) |

The last row is not in this RFC's scope; it is D3's shape (an author writes something, the
validator blesses it, nothing happens) surviving in the pack format after D3 closed it for
`POST /runs`. §8 proposes a BACKLOG row rather than widening this RFC.

Rows 3-5 are deliberate refusals with precise reasons, not accidents. That is the design
question §2 of the Specification answers: **when is "the schema declares it, the loader
refuses it" honest, and when is it a lie?**

### 3. Scope boundary

Out of scope, explicitly:

- **Building the Learn IA.** D6 makes `phase` available to the client; `design/03` organizes
  Learn on that axis, and the Learn route is a reserved empty state
  (`apps/web/src/App.svelte:341-355`) whose contents are breadth program items #4 and #7.
  This RFC ships the field and one honest label. It does not group, filter, or route on it.
- **Implementing any of the five declared-but-unselectable values.** §2b keeps four opponent
  modes declared; it implements none of them.
- **The other four unimplemented opponent modes' fate.** `plan_defense`,
  `practical_resistance` and `human_external` ride along with `perfect_tablebase` under one
  rule because they are the same declaration; nothing about them changes.
- **`opponentPolicy.additionalProperties: true`** (§2a, last row) and the
  **`TABIYA_COOKIE_SECURE` default** (`apps/server/src/main.ts:18`,
  `apps/server/src/identity.ts:86`: a light-profile self-hoster on plain HTTP must set it or
  login fails). Both are BACKLOG rows to propose (§8), not work to do here.
- **Rewriting committed candidates.** §6 changes two emitter strings.
  `content/candidates/*/pack.json` are left byte-identical because their evidence sidecars
  pin the pack digest (`content/candidates/onramp-00008/evidence.json` field `packDigest`)
  and rewriting a pack without re-emitting its sidecar breaks the artifact triple.

## Specification

### 1. D4 — one vocabulary, one constant, and drift becomes a compile error

**1a. The constant moves to the shared package.** `packages/schema/src/drill-pack/types.ts`
gains, beside `OBJECTIVE_TYPES` (`:1-13`) and in the same style:

```ts
export const CHECKPOINT_ACTIONS = ["compare_branches"] as const;
export type CheckpointAction = (typeof CHECKPOINT_ACTIONS)[number];

export const FEEDBACK_POLICIES = ["delayed_checkpoint", "segment_end"] as const;
export type FeedbackPolicy = (typeof FEEDBACK_POLICIES)[number];

export const PACK_PHASES = ["opening", "middlegame", "endgame", "cross_phase"] as const;
export type PackPhase = (typeof PACK_PHASES)[number];
```

All three are re-exported from `packages/schema/src/drill-pack/index.ts` alongside
`OBJECTIVE_TYPES` (`:20-35`). Both apps already depend on `@chess-tabiya/schema`
(`apps/web/package.json` dependencies; `apps/server/src/pack-validation.ts:4-5`), so this is
reachable from server and client without a new dependency edge.

**1b. The server consumes it.** `pack-validation.ts:18` deletes its local
`SUPPORTED_CHECKPOINT_ACTIONS` and imports `CHECKPOINT_ACTIONS`. The message at `:168` keeps
its current text and joins the imported constant, so the error an author sees is unchanged.
`pack-registry.ts:24` deletes its hand-written `FeedbackPolicy` union and re-exports the
shared type.

**1c. The client's recognition becomes exhaustive, so drift fails `pnpm typecheck`.**
`apps/web/src/lib/screen-model.ts` gains:

```ts
export function recognizedCheckpointActions(
  actions: readonly string[],
): Readonly<Record<CheckpointAction, boolean>> {
  const declared = new Set(actions);
  const recognized: Record<CheckpointAction, boolean> = { compare_branches: false };
  for (const action of CHECKPOINT_ACTIONS) recognized[action] = declared.has(action);
  return Object.freeze(recognized);
}
```

The object literal is typed `Record<CheckpointAction, boolean>`, so adding a member to
`CHECKPOINT_ACTIONS` without adding a key here is a TypeScript error, not a silent
divergence. `CheckpointSheet.svelte:78` replaces its string literal with
`recognizedCheckpointActions(checkpoint.actions).compare_branches`; the rendered control and
its `HonestControl` reason (`CheckpointSheet.svelte:79-93`) are unchanged.

**1d. The schema stays structurally open, and this is now written down.** The schema does
not enumerate actions by design — `docs/drill-pack-format.md:43-45` already says the format
"intentionally leaves `checkpoints[].actions` structurally open" and that the registry and
`pack-check` close the executable set. That stays true. What changes is that the executable
set has one writable location.

**1e. The fourth instance is closed too.** A new case in
`packages/schema/src/drill-pack.test.ts` asserts, as ordered arrays, that the JSON Schema's
`$defs.objectiveType.enum` equals `OBJECTIVE_TYPES`, that `properties.feedbackPolicy.enum`
equals `FEEDBACK_POLICIES`, and that `properties.phase.enum` equals `PACK_PHASES`. These
pass on day one and fail on the next one-sided edit.

### 2. D8 — decided per value

The rule this RFC adopts, and writes into `docs/drill-pack-format.md`:

> **An executable vocabulary may contain only values the shipped runtime executes. A
> declared vocabulary may contain values it does not, provided every such value carries a
> machine-checked refusal reason and the deployment publishes what it can actually select.**
> `feedbackPolicy` is executable. `opponentPolicy.mode` is declared.

The line is not "how much work is it". It is what happens when a pack names the value.

- `opponentPolicy.mode` **has a negotiation surface and a record**: `/capabilities`
  publishes the selectable modes (`capabilities.ts:166` → `SUPPORTED_POLICY_MODES`), the
  client builds its policy config against that payload
  (`apps/web/src/lib/session-controller.ts:216-232`), the loader refuses an unselectable
  mode with the mode's own reason string (`pack-validation.ts:142-151`), and — since
  migration 5 — every selection records the policy actually applied
  (`packages/runtime/src/types.ts:44`). A pack naming a mode this deployment cannot select
  is told exactly that, by name, before anything runs.
- `feedbackPolicy` **has none of that.** It is a disclosure contract, not a capability:
  `feedbackDisclosed` gates what the learner is allowed to see
  (`packages/runtime/src/feedback.ts`, consumed by
  `apps/server/src/feedback-policy.ts:10-23,33-45`) under ADR-0006 anti-contamination.
  Nothing publishes feedback policies in `/capabilities`. Nothing records an applied policy.
  There is no honest degradation: substituting `delayed_checkpoint` for a pack that asked
  for immediate feedback does not weaken the drill, it **changes what the learner is shown
  and when**, which is the one thing the barrier exists to control.

**2a. `immediate_blunder_guard` is removed from the schema.**

- `schemas/drill_pack.schema.json:50-56` drops the third enum member, leaving
  `["delayed_checkpoint", "segment_end"]` — exactly `FEEDBACK_POLICIES` (§1a), bound by the
  test in §1e.
- `apps/server/src/capabilities.ts:25-30` deletes `DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES`
  entirely; it has one member and exists only to explain it.
- `apps/server/src/pack-validation.ts:111-134` collapses to the general branch: any value
  not in `FEEDBACK_POLICIES` raises `UNSUPPORTED_FEEDBACK_POLICY` with the existing
  `is not a supported v1 feedback policy` message. The schema now rejects it first, at
  `/feedbackPolicy`, with a JSON Pointer — which is the earlier and better error.
- `apps/server/src/drill-client-server.test.ts:212` currently constructs a pack with
  `feedbackPolicy: "immediate_blunder_guard"` to exercise the rejection path; it keeps doing
  exactly that, and now asserts the failure comes from the **schema** stage (`source:
  "schema"`) rather than the runtime stage. Same for `pack-authoring.test.ts:84`.

**Why removal and not implementation.** Implementing it means: a per-move judge evaluation
on the learner's own moves (today judge evidence is enqueued per node and withheld —
`apps/server/src/service.ts:186,205`), a blunder-threshold vocabulary the pack format does
not have in any form, a client surface that interrupts play, and a rewrite of the
anti-contamination barrier it exists to open early. That is an RFC, with a design question
(what counts as a blunder, and who is allowed to say so under law 8) that this sweep must
not answer by implication. §8 proposes the BACKLOG row.

**What this costs, stated plainly.** `design/00-thesis.md:84-86` defines the on-ramp band on
three knobs and one of them is this. After this RFC the on-ramp lane has **two encodable
knobs and one unencodable one**, which is what it has today — the difference is that the
format stops advertising the third. That is listed as a deviation (§Deviations 1) and
carries a proposed BACKLOG row, not a silent narrowing.

**2b. `perfect_tablebase` stays, and the declaration becomes checked.**

The schema's mode enum is unchanged (`schema:480-489`, seven members). What is added is the
binding that makes "declared" mean something:

- A new test in `apps/server/src/capabilities.test.ts` asserts, against the schema file
  read from disk, that the enum at `$defs.opponentPolicy.properties.mode.enum` equals, as a
  set, `SUPPORTED_POLICY_MODES ∪ DECLARED_UNIMPLEMENTED_POLICY_MODES.map(entry => entry.mode)`;
  and that the two are **disjoint**. Consequences: a schema mode with no implementation and
  no reason string fails the suite; a mode marked unimplemented that the runtime actually
  supports fails the suite; a supported mode missing from the schema fails the suite.
- The fifth copy dies. `apps/server/src/service.ts:188` currently reads
  `mode !== "human_common" && mode !== "strong_engine" && mode !== "theory_strict"`; it
  becomes `!RUN_OPPONENT_MODES.includes(mode as RunOpponentMode)` (the import already exists
  in the server via `capabilities.ts:1`), preserving the same `INVALID_REQUEST` message at
  `:189`.
- No behaviour changes for any pack. `perfect_tablebase` remains unselectable and is still
  refused at load with its own reason (`capabilities.ts:19-21`).

`docs/engine-workers.md:236` keeps `perfect_tablebase` as named follow-up, and
`docs/outcome-drill-grading.md:115` and `docs/content-sourcing.md:97` keep their statements
that it is declared and not selectable — those become true *by test* rather than by
coincidence.

### 3. D9 — `start.side` becomes required, and the silent default dies

**3a. Schema.** `schemas/drill_pack.schema.json:108-118`: `"required": ["fen"]` becomes
`"required": ["fen", "side"]`. Every non-negative pack in the tree already complies —
verified across all twelve: the living fixture, four committed candidates, six committed
drafts, and the browser fixture. The five `*.invalid.json` negative fixtures omit `side`,
and their test asserts only that validation returns `false`
(`packages/schema/src/drill-pack.test.ts:80-83`), so it keeps passing; they are not amended.

**3b. The validator stops guessing.** `apps/server/src/pack-validation.ts:369` deletes
`pack.start.side === "black" ? "black" : "white"` and reads the side directly, because the
schema stage now guarantees it. The Syzygy perspective computation at `:345-350` is left
structurally as-is and is now correct by construction rather than by luck; §Acceptance 4c
pins the previously-inverted case with a test.

**3c. The client stops being able to crash, at the API boundary.**
`apps/web/src/lib/api.ts:417-425` (`pack()`) gains, beside its existing digest check, a
shape check on the parsed document:

```ts
const side = (document as { readonly start?: { readonly side?: unknown } }).start?.side;
if (side !== "white" && side !== "black") {
  throw new ApiError(502, "INVALID_RESPONSE", `Pack ${packId} did not declare start.side`);
}
```

Both callers already catch and surface (`session-controller.ts:205-210`, `:238-240`), so a
malformed pack becomes a visible error banner on the library screen instead of a `TypeError`
thrown from a Svelte `$derived` during render.

**3d. `packStartSide` keeps its guard.** `apps/web/src/lib/screen-model.ts:56-62` is
unchanged. It is now defence in depth behind three checks — schema, API boundary, and
`service.ts:183-185` — and none of them is redundant: they cover authoring, transport and
run creation respectively.

### 4. D6 — `phase` reaches the client

**4a. Server.** `apps/server/src/pack-registry.ts:26-34` (`PackSummary`) gains
`readonly phase: PackPhase | null;` and `:201-209` sets
`phase: typeof raw.phase === "string" ? (raw.phase as PackPhase) : null`. The schema's enum
has already constrained the string by the time a document reaches this point. The detail
projection at `:68` is unchanged — it already ships `phase`.

**4b. Client type.** `apps/web/src/lib/api.ts:16-23` mirrors the field exactly, importing
`PackPhase` from `@chess-tabiya/schema/drill-pack`. The three `PackSummary` literals in tests
(`apps/web/src/lib/screens.test.ts:227-235`, `app-shell.test.ts:42-50`,
`session-controller.test.ts:134-141`) gain the field; the assertion at
`session-controller.test.ts:392` that the controller state has no `phase` key is about the
controller, not the summary, and stays.

**4c. Client surface — one honest label, no IA.** `apps/web/src/lib/PackList.svelte:33-36`
renders the phase in the existing `.card-meta` row, beside `mode` and `reviewStatus`, using
the same `replaceAll("_", " ")` treatment (`cross_phase` → `cross phase`). **When `phase` is
`null` the chip reads `unclassified`.** It does not default to a phase, it does not hide,
and it does not guess from the FEN — guessing a phase from a position is exactly the
manufactured chess claim law 8 forbids.

**4d. `phase` stays optional in the schema, deliberately.** Requiring it would be consistent
with §3 and it is the wrong call, for one verified reason: the shipped on-ramp emitter
cannot always determine a phase. `apps/server/src/sourcing/position-seeds.ts:166-169` derives
it from Lichess puzzle themes and returns `undefined` when the puzzle carries zero or two or
more phase themes, and `:231` then omits the key. Making the field required would force that
emitter to fabricate a phase for positions whose only evidence is silent. So the field stays
optional, the client says `unclassified` out loud, and §8 proposes a BACKLOG row to give the
emitter an honest phase signal. This is the difference between D9 and D6: `side` is a fact
every emitter already has, `phase` is a claim not every source makes.

### 5. D5 — the release compose gets the light profile

`deploy/compose.release.template.yaml` becomes the digest-pinned mirror of `compose.yaml`'s
shape rather than a different deployment:

- `:8` — `ENGINE_MODE: maia` becomes `ENGINE_MODE: ${ENGINE_MODE:-mock}`, matching
  `compose.yaml:12`.
- `:17-19` — the `depends_on.maia` block gains `required: false`, matching
  `compose.yaml:20-23`, so the server starts with no Maia service present.
- The `maia` service gains `profiles: [engines]`, matching `compose.yaml:28`.
- Nothing else changes: image placeholders, healthcheck, port mapping and the `tabiya-data`
  volume are untouched, so `.github/workflows/release.yml:70`'s substitution still works
  unmodified.

The resulting self-hoster incantations are the same two as development, and
`docs/development.md:81-84` gains them beside `make up` / `make up-engines`:
`docker compose -f compose.yaml up -d` for the deterministic mock opponent, and
`ENGINE_MODE=maia docker compose -f compose.yaml --profile engines up -d` for Maia.

`tools/verify-packaging.mjs:24-33` extends to prove it rather than assert about text:

- `compose(["-f", releasePath, "--profile", "engines"])` joins the existing unprofiled
  `config --quiet` call.
- A new check runs `docker compose -f <rendered> config --format json` with no profile and
  requires `Object.keys(config.services)` to be exactly `["server"]` — the executable form of
  "the published artefact does not require Maia".
- A second run with `--profile engines` requires `maia` to be present and
  `services.server.depends_on.maia.condition` to be `service_healthy`.

### 6. D10 — engine version is parsed whenever the spec does not supply one

`apps/server/src/engine-supervisor.ts:111-140` (`parseIdentity`). The defect is that version
derivation is nested inside `if (spec.name === undefined)` (`:120`), so naming the engine
costs you its version. The fix separates the two decisions and adds a mismatch guard:

```ts
const advertised = lines.find((line) => line.startsWith("id name "))?.slice(8).trim();
const advertisedName = advertised?.split(/\s+/u)[0];
const advertisedVersion = advertised?.slice(advertisedName?.length ?? 0).trim() || undefined;
const nameAgrees =
  spec.name === undefined ||
  (advertisedName !== undefined &&
    advertisedName.toLowerCase() === spec.name.toLowerCase());

let name = spec.name ?? advertised ?? "unknown";
if (spec.name === undefined && advertised !== undefined && /^Stockfish(\s|$)/u.test(advertised)) {
  name = "Stockfish";
}
const version = spec.version ?? (nameAgrees ? advertisedVersion : undefined) ?? "unknown";
```

Behaviour, stated case by case:

| Spec | Advertised `id name` | Before | After |
|---|---|---|---|
| `{name: "Stockfish"}` (`strong-engine.ts:50`, `application.ts:188`) | `Stockfish 17.1` | `Stockfish` / `unknown` | `Stockfish` / `17.1` — **D10 closed** |
| `{}` (`position-seeds.ts:67`) | `Stockfish 17.1` | `Stockfish` / `17.1` | unchanged |
| `{name: "Maia3", version: MAIA3_SOURCE_COMMIT}` (`application.ts:195-200`) | anything | spec values | unchanged — an explicit `spec.version` always wins |
| `{name: "Stockfish"}` | `Lc0 v0.31.2` | `Stockfish` / `unknown` | `Stockfish` / `unknown`, **plus** a `lifecycle` transcript entry `identity mismatch: spec names Stockfish, engine advertises Lc0 v0.31.2` |

The mismatch case is why the guard exists: recording another engine's version under the
spec's name would be worse provenance than `unknown`, and staying silent about it would be
worse still. The transcript ring already exists for exactly this
(`engine-supervisor.ts:87-89`, `TranscriptEntry.direction` includes `"lifecycle"` at `:49`).

**The B6b workaround is removed.** `apps/server/src/sourcing/position-seeds.ts:67` gains
`name: "Stockfish"` back. Real Stockfish advertises a matching first token, so the version
still resolves and the authoring evidence at `:75-76` keeps a real `engineVersion`.

**A consequence to state, not hide.** `--engine-eval` emissions previously recorded
`engineVersion: "unknown"` uniformly and will now record the operator's actual Stockfish
version, so two operators on different Stockfish builds produce different `evidence.json`
bytes. That is the point of the defect being a defect — anonymous provenance was
"deterministic" only because it recorded nothing — and it does not touch the
deterministic-output rule's subject: `emissionJobDigest` covers pipeline args and source
etags (`content/candidates/onramp-00008/job.json`), not engine identity, and the shipped
job runs with `engineEval: false`.

`EngineIdentity` (`engine-supervisor.ts:31-45`) gains no field, so
`SelectionEngineIdentity` (`packages/runtime/src/types.ts:69-76`), which is persisted inside
`opponent.move_selected.selection`, is unchanged. **This is why there is no migration.**

### 7. Pack schema v0.5

Two narrowings, both from this RFC, both satisfied by every pack in the tree:

- `start.required` gains `side` (§3a).
- `feedbackPolicy` loses `immediate_blunder_guard` (§2a).

Version handling follows the v0.4 precedent exactly:

- `schemas/drill_pack.schema.json:3` — `$id` becomes `urn:chess-tabiya:schema:drill-pack:0.5`;
  `:5`'s description becomes "Living v0.5 format …".
- `packages/schema/src/index.ts:2` — `DRILL_PACK_SCHEMA_VERSION` becomes `"0.5"`.
- `packages/schema/src/drill-pack.test.ts:49-56` — the `describe` title and both assertions
  move to `0.5`. The frozen-v0.1 case at `:58-78` still passes: the frozen fixture still
  fails on the missing `feedbackPolicy` it was written to fail on.

No pack file's bytes change, so no pack digest changes, so no sidecar `packDigest` in
`content/candidates/` is invalidated.

### 8. Docs to reconcile, and BACKLOG rows to propose

**Docs the implementer updates** (these are `docs/`, the canonical description of what
exists — not `design/`):

- `docs/drill-pack-format.md:4` currently says the schema "describes format v0.3" while the
  file has been v0.4 since the Line Drill RFC. Correct it to v0.5 in the same edit. `:18`
  drops `immediate_blunder_guard` from the `feedbackPolicy` list. A new `## v0.5 defect
  sweep` section, in the style of `## v0.4 Line Drill contract` (`:140-160`), states the
  required `side`, the removed policy value, and the executable-versus-declared vocabulary
  rule from §2.
- `docs/drill-client.md:15` — `immediate_blunder_guard` moves from "remains cut" to "is not
  in the format"; add that `PackSummary` carries `phase` and that an unset phase renders
  `unclassified`.
- `docs/engine-workers.md:22,153,196-205` — state that `version` comes from `spec.version`,
  else from the advertised `id name` remainder when the advertised name agrees with the
  spec's, else `unknown`, and that a disagreement is recorded in the transcript.
- `docs/development.md:81-84` — the release-artefact incantations from §5.
- `docs/content-sourcing.md:97` and `docs/outcome-drill-grading.md:115` — keep their
  `perfect_tablebase` statements and note that the declaration is now bound by test (§2b).

**Emitter strings** (`apps/server/src/sourcing/`), both of which name "defect D8" and must
stop, since D8 closes here:

- `position-seeds.ts:225` — replace with wording that says the on-ramp's immediate-feedback
  knob has no encoding in the pack format and `delayed_checkpoint` is what this pack means,
  citing the BACKLOG row proposed below rather than a closed defect.
- `syzygy.ts:173` — replace `(defect D8)` with a statement that `perfect_tablebase` is a
  declared mode this deployment cannot select. `syzygy.test.ts:143` asserts this string
  verbatim and is updated with it.
- Committed candidates keep their existing text and their pinned digests (§3, Scope
  boundary).

**BACKLOG rows the implementer proposes and never writes** (`AGENTS.md` law 5):

1. Mark D4, D5, D6, D8, D9 and D10 closed, each with the section of this RFC that closed it.
2. Unblock the "Phase-oriented product discovery" row (`design/BACKLOG.md:60`), which reads
   "blocked on **D6**", and note that `design/03-product-breadth.md:161`'s B1 residual list
   loses its `phase` item.
3. **New — immediate blunder-guard feedback as a real policy.** What it needs: per-move judge
   evaluation of the learner's own moves, a blunder-threshold vocabulary the pack format does
   not have, an interrupting client surface, and a ruling on how the anti-contamination
   barrier opens early without contaminating the decision it is protecting. Until then the
   on-ramp band (`design/00-thesis.md:84-86`) runs on two of its three declared knobs.
4. **New — `opponentPolicy` is `additionalProperties: true`** (`schema:496`): an author can
   write a policy field nothing reads and hear nothing, which is D3's shape surviving in the
   pack format after D3 closed it for `POST /runs`.
5. **New — `position-seeds` omits `phase`** when a puzzle carries zero or multiple phase
   themes (`position-seeds.ts:166-169,231`), so on-ramp packs can reach the library
   unclassified on the axis the Learn IA is organized around.
6. **New — `TABIYA_COOKIE_SECURE` defaults to true** (`main.ts:18`, `identity.ts:86`), so a
   self-hoster running §5's light profile over plain HTTP gets a login that silently fails.

## Deviations from design

1. **`design/00-thesis.md:84-86` names pack-declared immediate blunder-guard feedback as one
   of the three knobs that define the 1000-1400 on-ramp lane.** §2a removes its encoding
   instead of implementing it. This does not change what the product can do today — the
   value was rejected at load and two shipped candidates already carry a graduation blocker
   saying so (`content/candidates/onramp-00008/pack.json`) — it changes what the format
   claims to offer. The knob returns through the BACKLOG row in §8, with the design question
   answered rather than assumed.
2. **`design/03-product-breadth.md:134` puts "packs by phase" on the Play surface and
   line 161 lists the missing projection as a B1 residual.** §4 ships the projection and one
   label; it does not ship "packs by phase" as an information architecture. B1's residual is
   removed; B1's successor work (program items #4 and #7) is not started.
3. **The Learn IA is organized on an axis this RFC leaves optional.** §4d keeps `phase`
   optional because the shipped on-ramp emitter cannot always determine it, and a required
   field would be filled by fabrication. `unclassified` is a visible product state, which is
   narrower than a design that assumes every pack has a phase — and honest about the corpus
   that actually exists.
4. **This RFC edits no `design/` file.** D-row closures, the unblocked discovery row and the
   four new rows are proposed in §8 for the owner or for claude on the owner's ruling.

## Acceptance criteria

1. **The action vocabulary has one writable source.**
   (a) `grep -rn "compare_branches" apps packages --include="*.ts" --include="*.svelte"`
   outside tests and JSON returns exactly one definition site,
   `packages/schema/src/drill-pack/types.ts`. (b) A test adds a second member to a local copy
   of `CHECKPOINT_ACTIONS` and asserts `recognizedCheckpointActions` reports it — and the
   commit is accompanied by evidence that removing the corresponding key from the literal in
   `screen-model.ts` fails `pnpm typecheck` with a missing-property error on
   `Record<CheckpointAction, boolean>`. (c) `screens.test.ts` asserts the checkpoint sheet
   renders the compare control for `actions: ["compare_branches"]` and not for
   `actions: ["compare_branches_v2"]`, unchanged in behaviour from today.
2. **Schema and constants are bound, in both directions.** A `packages/schema` test asserts
   `$defs.objectiveType.enum` deep-equals `OBJECTIVE_TYPES`, `properties.feedbackPolicy.enum`
   deep-equals `FEEDBACK_POLICIES`, and `properties.phase.enum` deep-equals `PACK_PHASES`, as
   ordered arrays. A `apps/server` test asserts the schema's opponent-mode enum equals
   `SUPPORTED_POLICY_MODES ∪ declared-unimplemented` as sets and that those two are disjoint.
   Each of the four assertions is demonstrated to fail under a one-sided mutation of its
   fixture copy.
3. **D8, per value.** (a) A pack with `feedbackPolicy: "immediate_blunder_guard"` is rejected
   by `validatePackDocument` with an issue whose `source` is `"schema"` and whose `path` is
   `/feedbackPolicy` — the assertion that distinguishes removal from a renamed runtime
   refusal. (b) `DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES` no longer exists:
   `grep -rn "DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES" apps packages` returns nothing.
   (c) A pack with `opponentPolicy.mode: "perfect_tablebase"` still passes the schema and is
   still rejected at load with the reason string from `capabilities.ts:19-21`, unchanged.
   (d) `grep -n "human_common" apps/server/src/service.ts` shows no inline mode triple.
4. **D9.** (a) The living fixture with `start.side` deleted fails schema validation with
   `keyword: "required"`, `missingProperty: "side"`. (b) All twelve non-negative packs in the
   tree still validate: the living fixture, the four committed candidates (still loaded by
   `pack-authoring.test.ts:256-263`, still five packs, four drafts), the six committed drafts,
   and the browser fixture. (c) A Syzygy-graded fixture whose declared category is correct
   for a black learner passes, and the same fixture with `start.side` flipped to white fails
   with `SYZYGY_ASSESSMENT_MISMATCH` — the pair that fails today, because a missing or
   mis-read side inverts the comparison at `pack-validation.ts:348`. (d) `grep -n
   '=== "black" ? "black" : "white"' apps/server/src/pack-validation.ts` returns nothing.
   (e) **Browser:** with Playwright `page.route` intercepting `GET /packs/*` to strip
   `start.side` from the response body, clicking a pack card shows the error banner text
   `did not declare start.side`, the library remains visible and interactive, and a
   `page.on("pageerror")` collector recorded zero uncaught errors. This is the criterion that
   proves the client cannot be crashed by a malformed pack, and it must be written so it
   fails on the current tree.
5. **D6.** (a) `GET /packs` returns `phase` for every summary; a server test asserts
   `"middlegame"` for the Carlsbad draft and `null` for a pack constructed without the field.
   (b) **Browser:** in the dev registry, the library cards for the Carlsbad, rook-endgame and
   anti-Caro drafts and the Najdorf fixture display phase chips reading `middlegame`,
   `endgame`, `opening` and `cross phase` respectively, asserted by visible text within each
   `article`. (c) A client unit test asserts a summary with `phase: null` renders
   `unclassified` and never a phase name.
6. **D5.** (a) `node tools/verify-packaging.mjs` passes and its rendered-release check
   reports service keys exactly `["server"]` with no profile, and includes `maia` with
   `--profile engines`. (b) `docker compose -f <rendered> config --quiet` and the same with
   `--profile engines` both exit zero. (c) `grep -n "ENGINE_MODE" deploy/compose.release.template.yaml`
   shows the `${ENGINE_MODE:-mock}` default. (d) The check is demonstrated to fail against
   the current template.
7. **D10.** (a) A supervisor test drives a fake UCI process that advertises
   `id name Stockfish 17.1` against a spec with `name: "Stockfish"` and no `version`, and
   asserts the identity is `{name: "Stockfish", version: "17.1"}` — failing on the current
   tree. (b) The same advertisement against a spec with `version: "pinned"` yields
   `"pinned"`. (c) A spec named `Stockfish` against an engine advertising `Lc0 v0.31.2`
   yields `version: "unknown"` and a transcript entry containing `identity mismatch`.
   (d) `position-seeds.ts` declares `name: "Stockfish"` and its evaluator test asserts the
   emitted source origin carries a non-`unknown` `engineVersion` when the fake engine
   advertises one.
8. **No persisted shape moved.** `packages/runtime`'s `runSchemaVersion`, `STORAGE_VERSION`
   and `SelectionEngineIdentity` are byte-identical to `main`; `rfc/README.md`'s migration
   register gains no row; and `digestDrillPack` over every committed pack returns the digest
   recorded in its sidecar where one exists.
9. **`pnpm verify` and `pnpm test:browser` pass with `retries` unset**, per D14's closure
   condition (`design/BACKLOG.md:124`) — a green suite that needed a retry is not evidence.

## Open questions

None.

## Changelog

- 2026-08-13: created. Re-verified all six open defects (all still real; D8 is five values
  rather than two, and D9's ledgered symptom has been made unreachable by a guard elsewhere
  while the format defect underneath it grew a second, sharper consequence in the Syzygy
  perspective check). Specifies one shared vocabulary constant with type-level and
  schema-agreement tests, the per-value D8 ruling (`immediate_blunder_guard` removed,
  `perfect_tablebase` kept and bound by test) with the executable-versus-declared rule that
  justifies the split, required `start.side` in pack schema v0.5, `phase` on `PackSummary`
  with an honest `unclassified` state, the light profile on the release Compose artefact, and
  engine version parsing that no longer depends on whether the spec names the engine.
