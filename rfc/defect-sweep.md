# RFC: Defect sweep — six open defects, and the one shape underneath five of them

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/00-thesis.md` §Target player (lines 84-89: the on-ramp band's
  three knobs, one of which is "pack-declared immediate blunder-guard feedback", line 86);
  `design/03-product-breadth.md` gate B1 (line 171: "met with residuals — … `phase` is
  never projected", restated at line 213) and the Play surface's "packs by phase"
  (line 144); `design/BACKLOG.md` open-defect rows D4 (line 117), D5 (118), D10 (132),
  D9 (133), D8 (134), D6 (136). **All six coordinates were re-read on 2026-08-13 after the
  parallel drafts appended rows D17–D20; the ledger's own D9 row was rewritten the same day
  and now states the severity this RFC verified (§1.1).**
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
  lives in `schemaBuildInfo.drillPackVersion` (`packages/schema/src/index.ts:2,8` — a
  different object from `runtimeBuildInfo`, `packages/runtime/src/index.ts:149`, which
  carries `runSchemaVersion`), is served at `/` as `serverBuildInfo.schema`
  (`apps/server/src/index.ts:103-107`), and is absent from the capabilities payload
  (`apps/server/src/capabilities.ts:163-172`, which publishes `runSchemaVersion` only, at
  `:166`).
  `digestDrillPack` canonicalizes the pack document's own bytes, so narrowing the schema
  changes no shipped pack's digest. `STORAGE_VERSION` and the run schema are untouched. **No
  number is claimed in `rfc/README.md`'s migration register.**
- **Planning:** `planning/defect-sweep/`

## Summary

Six defects sit open in `design/BACKLOG.md`, each small, each leaking into every new RFC as
a caveat. I re-verified all six against the tree. **All six are still real.** None was
incidentally fixed. Two have moved since they were written: D9's severity was raised in the
ledger on 2026-08-13 while this RFC was drafted, so the row and §1.1 now agree — the crash it
was filed for is unreachable and a silent inverted grading verdict sits underneath it; and
D8 is larger than its row says, because the schema declares **five** values the loader
rejects, not two.

Five of the six are one shape. A vocabulary is written down in two or more places — the JSON
Schema, a server constant, a runtime constant, an inline literal, a client `if`. Where the
copies happen to agree (D4) the defect is latent; where they disagree (D8) an author can
write a value that passes `make pack-check`'s schema stage and is refused at load; where one
copy says *optional* and the consumer assumes *present* (D9, D6) the boundary condition is
the bug. **One binding already exists** and is worth naming before proposing another:
`apps/server/src/pack-authoring.test.ts:41-61` asserts, as sets, that the schema's
opponent-mode enum is `SUPPORTED_POLICY_MODES ∪ DECLARED_UNIMPLEMENTED_POLICY_MODES` and
that the `feedbackPolicy` enum is the two executable values plus
`DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES`. So D8's divergence is deliberate and tested; what
is untested is that the two sides are **disjoint**, and the other three vocabularies
(checkpoint actions, objective types, phases) have no binding at all. This RFC closes all
six, extends the existing binding, and gives the unbound vocabularies exactly one writable
source with a test that fails on the next divergence.

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
| D6 | `PackSummary` omits `phase`; `grep -rn "phase" apps/web/src` finds only prose | **real; and the pack *detail* projection already ships it, which the row does not say** | `apps/server/src/pack-registry.ts:26-34` (summary type) and `:201-209` (construction) omit it; `pack-registry.ts:68` **does** project it on `GET /packs/:id`; `apps/web/src/lib/api.ts:16-24` mirrors the summary without it; the three `phase` hits in `apps/web/src` are `App.svelte:345`, `PackList.svelte:17` (prose) and `session-controller.test.ts:392` (an assertion that a `phase` key is absent) |
| D8 | two declared values validate and are rejected at load, citing `pack-validation.ts:104-129` | **real, and understated: five values, in two different vocabularies** | `immediate_blunder_guard` at `schemas/drill_pack.schema.json:50-56` vs `apps/server/src/pack-validation.ts:111-134` (the row's coordinates have drifted by seven lines); **four** opponent modes — `plan_defense`, `practical_resistance`, `perfect_tablebase`, `human_external` — at `schema:480-489` vs `pack-validation.ts:136-152`, because `SUPPORTED_POLICY_MODES` is `RUN_OPPONENT_MODES` and that is three members (`packages/runtime/src/types.ts:38-42`). The row's "two sources of truth for one vocabulary" is **half wrong**: `pack-authoring.test.ts:41-61` already binds both enums to the capability constants as sets |
| D9 | as rewritten in the ledger on 2026-08-13: schema-optional `side`, silent coercion at `pack-validation.ts:369`, unconditional Syzygy inversion | **real, and the ledger row and this RFC now say the same thing** — the row was raised in severity from the drafting of this section, so there is no remaining disagreement to reconcile | see §1.1 |
| D10 | both shipped Stockfish specs report `version: "unknown"` | **real, verbatim** | `apps/server/src/engine-supervisor.ts:111-140` (`parseIdentity`); `spec.name` is set at `apps/server/src/strong-engine.ts:50` and `apps/server/src/application.ts:188`, neither of which sets `version`, and `application.ts:282-283` constructs both without one; the B6b workaround — an authoring spec with no `name` — is `apps/server/src/sourcing/position-seeds.ts:67` |

**Nothing in this set was incidentally fixed.** The one thing that changed under D9 is a
mitigation added elsewhere, not a fix (§1.1).

*Motivation subsections are numbered `1.1`/`2.1` to keep them distinct from the
Specification's `§1a`/`§2a`/`§2b`/`§3a`, which four sibling drafts cite by number.*

### 1.1. D9's original symptom is unreachable; what is underneath it is worse

The defect was filed as a client crash. It is currently unreachable through the shipped
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
   `const learner = pack.start.side` (`:346`) and compares `learner === sideToMove` (`:349`)
   without any presence check; with `learner` undefined that comparison is always false, so
   the declared category is unconditionally passed through `opposite(...)` (declared at
   `:347-348`, applied at `:351`) and `SYZYGY_ASSESSMENT_MISMATCH` (`:358-364`) fires — or
   fails to fire — against the wrong side. A never-silent validator is silently choosing a
   colour and grading a tablebase claim from it.

   **Why the type system does not catch it.** `DrillPackDefinition["start"]` is
   `{ readonly fen: string; readonly [key: string]: unknown }`
   (`packages/schema/src/drill-pack/types.ts:83`), so `pack.start.side` is `unknown`
   everywhere in the server. There is no declared colour anywhere in the pack types for a
   compiler to check, which is why the coercion at `:369` and the presence-free comparison
   at `:349` both compile. §3a closes that too; the schema alone would leave the same hole
   open for the next reader.

So D9 is real, its consequence is an authoring-time lie rather than a runtime crash, and the
fix belongs in the schema rather than in the client guard.

### 2. The shape: seven copies of four vocabularies

`grep` for each vocabulary and count the places a human has to remember to edit.

| Vocabulary | Copies | Bound by a test? | Agree today? |
|---|---|---|---|
| Checkpoint actions | schema, by exclusion (`schema:462-470`: any non-empty string except `capture_intent`); `SUPPORTED_CHECKPOINT_ACTIONS` (`pack-validation.ts:18`); a literal in the client (`CheckpointSheet.svelte:78`) | **no** | yes — one member, `compare_branches`. This is D4 |
| Opponent modes | schema enum, 7 (`schema:480-489`); `RUN_OPPONENT_MODES`, 3 (`packages/runtime/src/types.ts:38-42`); `DECLARED_UNIMPLEMENTED_POLICY_MODES`, 4 (`capabilities.ts:12-23`); an inline triple in the server (`service.ts:189`); the selector's `switch`, 3 (`opponent-selector.ts:388-394`) | **partly** — `pack-authoring.test.ts:48-53` binds the schema enum to constants 2+3 as a set; nothing binds copies 4 and 5 | **by design** — half of D8, plus a fifth copy the ledger never named |
| Feedback policies | schema enum, 3 (`schema:50-56`); two literals plus one special case (`pack-validation.ts:111-134`); the `FeedbackPolicy` type, 2 (`pack-registry.ts:24`); a fourth literal pair inside the binding test itself (`pack-authoring.test.ts:56-57`) | **partly** — `pack-authoring.test.ts:54-60`, against a hand-written literal pair rather than an exported constant | **by design** — the other half of D8 |
| Objective types | schema enum, 11 (`schema:121-135`); `OBJECTIVE_TYPES`, 11 (`packages/schema/src/drill-pack/types.ts:1-13`) | **no** | yes — **and nothing tests it.** A fourth instance of D4's shape, one edit away from being D8 |

Two conclusions, and they point in opposite directions. `OBJECTIVE_TYPES` is the proof that
this repo already knows the right answer — a single exported constant in the shared schema
package — and the proof that the answer is incomplete without a test binding it to the JSON
Schema. `pack-authoring.test.ts:41-61` is the proof that the divergence in D8 is
**deliberate and already asserted**, which changes what D8's fix has to be: not "make them
agree", but decide per value whether declaring more than the loader accepts is honest (§2),
and then make the assertion say something it does not say today — that the supported set and
the declared-unimplemented set are disjoint.

### 2.1. Five boundary conditions, verified by execution

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

All six rows reproduce on the current tree; the probe script is disposable and is not
committed. The last row is not in this RFC's scope; it is D3's shape (an author writes
something, the validator blesses it, nothing happens) surviving in the pack format after D3
closed it for `POST /runs`. §8 proposes a BACKLOG row rather than widening this RFC.

Rows 3-5 are deliberate refusals with precise reasons, not accidents. That is the design
question §2 of the Specification answers: **when is "the schema declares it, the loader
refuses it" honest, and when is it a lie?**

**A seventh probe, which is where the required-`side` change bites.** Running the same
compiled validator with `$defs.start.required = ["fen", "side"]` against every pack-shaped
JSON in the tree: all twelve non-negative packs still validate; the five fixtures in
`drill-pack.test.ts`'s `negativeFixtures` list still fail (they already did); and
`schemas/fixtures/drill-pack/illegal-spine.invalid.json` **flips from `true` to `false`**.
That sixth `*.invalid.json` file is not in the negative list — it exists precisely to be
schema-valid and lint-invalid, and `drill-pack.test.ts:157-171` asserts
`validate(fixture) === true` before checking `ILLEGAL_SPINE_MOVE`. §3a amends it.

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
- **`opponentPolicy.additionalProperties: true`** (§2.1, last row) and the
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

All three constants and their three types are added to the existing export block in
`packages/schema/src/drill-pack/index.ts` (`:20-36`), beside `OBJECTIVE_TYPES` (`:21`). Both
apps already depend on `@chess-tabiya/schema` (`apps/web/package.json` dependencies;
`apps/server/src/pack-validation.ts:4-5`), so this is reachable from server and client
without a new dependency edge.

The same file's `DrillPackDefinition` (`types.ts:80-102`) declares `start` as
`{ readonly fen: string; readonly [key: string]: unknown }` (`:83`) — no colour, which is
why the D9 inversion compiles. §3a narrows it in the same edit.

**1b. The server consumes it.** `pack-validation.ts:18` deletes its local
`SUPPORTED_CHECKPOINT_ACTIONS` and imports `CHECKPOINT_ACTIONS`. The message at `:168` keeps
its current text and joins the imported constant, so the error an author sees is unchanged.
`pack-registry.ts:24` deletes its hand-written `FeedbackPolicy` union and re-exports the
shared type; `apps/server/src/index.ts:12` re-exports it onward and is unaffected.

**`RunFeedbackPolicy` is deliberately not folded in.** `packages/runtime/src/types.ts:37`
declares `"delayed_checkpoint" | "segment_end" | "attempt_end"` — a superset, because
`attempt_end` is the policy of a pack-less run (`service.ts:179`) and can never be authored.
It is a different vocabulary that happens to overlap, and the §1e test binds
`FEEDBACK_POLICIES` to the *pack* schema only. Noting it here so the next reader does not
"finish the job" by unifying two things that must stay apart.

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
divergence. The argument type matches what the sheet already holds: `CheckpointNotice.actions`
is `readonly string[]` (`screen-model.ts:41`), so no cast is introduced.
`CheckpointSheet.svelte:78` replaces its string literal with
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

- `opponentPolicy.mode` **has a negotiation surface and a record**, and all three conditions
  are satisfied today, not aspirationally: `/capabilities` publishes the selectable modes
  (`capabilities.ts:165` → `SUPPORTED_POLICY_MODES`), the client builds its policy config
  against that payload (`apps/web/src/lib/session-controller.ts:216-232`, applied at `:227`),
  the loader refuses an unselectable mode with the mode's own reason string
  (`pack-validation.ts:142-151`, sourced from `capabilities.ts:12-23`), and — since
  migration 5 — every selection records the policy actually applied
  (`PolicyModeApplied`, `packages/runtime/src/types.ts:44`, carried on
  `OpponentSelection.policyModeApplied` at `:80`). A pack naming a mode this deployment
  cannot select is told exactly that, by name, before anything runs.
- `feedbackPolicy` **has none of that.** It is a disclosure contract, not a capability:
  `feedbackDisclosed` gates what the learner is allowed to see
  (`packages/runtime/src/feedback.ts:3-18`, consumed by
  `apps/server/src/feedback-policy.ts:10-24,34-51`) under ADR-0006 anti-contamination.
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
  `is not a supported v1 feedback policy` message. **Stated honestly: that branch becomes
  dead code for every document that reaches it**, because `validatePackDocument` runs the
  schema first and returns on failure (`:420-427`), and there is no caller that skips it. It
  is kept rather than deleted as the fallback for a schema-versus-constant divergence — the
  exact divergence §1e's test now makes impossible — and that is the whole of its
  justification. The schema rejects the value first, at `/feedbackPolicy`, with a JSON
  Pointer, which is the earlier and better error. The import of
  `DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES` at `pack-validation.ts:11` goes with it.
- **`apps/server/src/pack-authoring.test.ts` is the binding test, and it is an edit site
  twice over.** It imports `DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES` (`:11`) and asserts the
  schema's `feedbackPolicy` enum equals the two executable values plus that constant
  (`:54-60`). With the constant gone, the assertion becomes
  `expect(schema.properties.feedbackPolicy.enum).toEqual([...FEEDBACK_POLICIES])` — an
  ordered-array equality, matching §1e, since there is no longer a declared remainder to
  union in. The opponent-mode half of the same test (`:48-53`) is unchanged here and extended
  in §2b.

**Two tests break structurally, not cosmetically, and the reason is the same one.**
`validatePackDocument` **returns after the schema stage when the schema stage fails**
(`pack-validation.ts:420-427`): it never runs `lintDrillPack` or `runtimeIssues` on a
document the schema rejected. So moving a refusal from the runtime stage to the schema stage
does not merely relabel the issue — it suppresses every other issue in the same document.

- `apps/server/src/pack-authoring.test.ts:80-111` (*"combines shipped chess lints and
  executable-policy checks"*) mutates one candidate three ways — an illegal spine move
  (`:82`), `immediate_blunder_guard` (`:83-84`) and `plan_defense` (`:85-88`) — and asserts
  all three issues appear together. After §2a that document dies at the schema stage and
  yields only `SCHEMA_ENUM` at `/feedbackPolicy`. **The test is split, and the split is the
  point of the change, not a workaround for it:** the combining case keeps the illegal spine
  and `plan_defense` (both still runtime/lint-stage refusals, so it still proves the two
  stages combine) and drops the feedback mutation; a new sibling case asserts that
  `immediate_blunder_guard` alone yields exactly one issue, `source: "schema"`, `code:
  "SCHEMA_ENUM"`, `path: "/feedbackPolicy"`, **and that no `source: "lint"` or `source:
  "runtime"` issue is present** — which is the honest statement of what a schema-stage
  refusal costs.
- `apps/server/src/drill-client-server.test.ts:206-219` constructs a pack with
  `feedbackPolicy: "immediate_blunder_guard"` and asserts the thrown `PACK_INVALID`'s
  **message** contains `"not supported in v1"` (`:218`). That string is the reason text this
  RFC deletes. `PackRegistry` builds the message by joining issue messages
  (`pack-registry.ts:92-99`), so the assertion becomes the Ajv enum message —
  `expect.stringContaining("must be equal to one of the allowed values")` — with the pack id
  still asserted through the existing `Pack ${source} is invalid` prefix. The case stays
  where it is and keeps proving that the registry refuses the value; only the reason it gives
  changes, which is the whole content of §2a.

**Why removal and not implementation.** Implementing it means: a per-move judge evaluation
on the learner's own moves (today judge evidence is enqueued once per committed node and then
withheld — `apps/server/src/service.ts:260,284` calling `#enqueueMoveEvidence` at `:627-636`,
with disclosure gated by `feedbackDisclosed`), a blunder-threshold vocabulary the pack format does
not have in any form, a client surface that interrupts play, and a rewrite of the
anti-contamination barrier it exists to open early. That is an RFC, with a design question
(what counts as a blunder, and who is allowed to say so under law 8) that this sweep must
not answer by implication. §8 proposes the BACKLOG row.

**What this costs, stated as a loss.** `design/00-thesis.md:84-89` defines the 1000–1400
on-ramp lane on three knobs and one of them — line 86, "pack-declared immediate blunder-guard
feedback … a per-pack override of the delayed-feedback default, ADR-0006" — is this one.
**After this RFC the on-ramp lane has two encodable knobs and one that the format cannot
express at all.** The runtime capability was already absent; what §2a removes is the *claim*
that a pack could ask for it, and with it the ability of an author to write the intent down
and have it survive to the day someone implements it. That is a real loss, not a
tidying-up: the two shipped on-ramp candidates currently carry a graduation blocker recording
the substitution (`content/candidates/onramp-00008/pack.json`, `onramp-0000d/pack.json`), and
after §6's rewording that blocker points at a BACKLOG row instead of at a value in the enum.
The alternative — leaving a value in the schema that the loader refuses and no deployment can
ever negotiate — is the lie §2's rule names. It is listed as a deviation (§Deviations 1) and
carries a proposed BACKLOG row (§8, row 3).

**2b. `perfect_tablebase` stays, and the declaration becomes checked.**

The schema's mode enum is unchanged (`schema:480-489`, seven members). The set-equality half
of the binding **already exists** — `apps/server/src/pack-authoring.test.ts:48-53` asserts
`new Set($defs.opponentPolicy.properties.mode.enum)` equals
`new Set([...SUPPORTED_POLICY_MODES, ...DECLARED_UNIMPLEMENTED_POLICY_MODES.map(e => e.mode)])`
and passes today. This RFC **does not add a second copy of it in `capabilities.test.ts`**;
duplicating the assertion would be the very shape §2 is closing. What is added is the half
that is missing:

- The same test gains a **disjointness** assertion: no member of
  `DECLARED_UNIMPLEMENTED_POLICY_MODES` appears in `SUPPORTED_POLICY_MODES`. Today set
  equality alone permits a mode that is both implemented and marked "declared unimplemented",
  which would leave a stale refusal reason overriding a working capability at
  `pack-validation.ts:142-151`. With both assertions: a schema mode with no implementation
  and no reason string fails the suite; a mode marked unimplemented that the runtime actually
  supports fails the suite; a supported mode missing from the schema fails the suite. All
  three currently pass, so this is a guard against the next edit, not a fix for today.
- The fifth copy dies. `apps/server/src/service.ts:189` currently reads
  `mode !== "human_common" && mode !== "strong_engine" && mode !== "theory_strict"`, on a
  `mode` whose static type is `unknown` (`:188`, read off a
  `Record<string, unknown>`). **The replacement must preserve narrowing**: the literal chain
  narrows `unknown` to `RunOpponentMode`, which is what makes the `RunOpponentPolicy` literal
  at `:192-197` typecheck, and `RUN_OPPONENT_MODES.includes(mode as RunOpponentMode)` does
  not narrow and hides the failure behind a cast. So `apps/server/src/capabilities.ts` gains,
  beside `SUPPORTED_POLICY_MODES` (`:10`):

  ```ts
  export function isRunOpponentMode(value: unknown): value is RunOpponentMode {
    return RUN_OPPONENT_MODES.some((mode) => mode === value);
  }
  ```

  and `service.ts:189` becomes `if (!isRunOpponentMode(mode))`, preserving the same
  `INVALID_REQUEST` message at `:190`. `RUN_OPPONENT_MODES` is already imported there
  (`capabilities.ts:1`), and `pack-validation.ts:140` — which today re-implements the same
  membership test with `SUPPORTED_POLICY_MODES.some(...)` — is left alone deliberately: it
  tests membership of the *published selectable* set, which is the same three values but a
  different question, and collapsing the two would erase the distinction §2 rests on.
- No behaviour changes for any pack. `perfect_tablebase` remains unselectable and is still
  refused at load with its own reason (`capabilities.ts:19-21`).

`docs/engine-workers.md:236` keeps `perfect_tablebase` as named follow-up, and
`docs/outcome-drill-grading.md:115` and `docs/content-sourcing.md:97` keep their statements
that it is declared and not selectable — those become true *by test* rather than by
coincidence.

### 3. D9 — `start.side` becomes required, and the silent default dies

**3a. Schema and type, together.** `schemas/drill_pack.schema.json:110` — the `$defs.start`
`"required": ["fen"]` becomes `"required": ["fen", "side"]`; the `side` property itself
already exists and already enumerates `["white", "black"]` (`:117`), so nothing widens.

`packages/schema/src/drill-pack/types.ts:83` narrows in the same edit:

```ts
readonly start: {
  readonly fen: string;
  readonly side: "white" | "black";
  readonly [key: string]: unknown;
};
```

**Both halves are load-bearing and neither substitutes for the other.** The schema stops a
side-less pack entering the system; the type stops the next reader writing another
presence-free comparison against `unknown` (§1.1, finding 2). The two shipped emitters use
`satisfies DrillPackDefinition` (`apps/server/src/sourcing/openings.ts:118`,
`position-seeds.ts:239`, `syzygy.ts:188`) and so are checked against the narrowed type; all
three already set `start.side` (`openings.ts:105`, `position-seeds.ts:233`, `syzygy.ts:182`).
Test literals that omit `side` reach the type through an assertion rather than an
assignment — `run-state.test.ts:39` uses `as unknown as DrillPackDefinition` — and are
unaffected.

Fixture blast radius, enumerated by execution rather than asserted:

- **Every non-negative pack already complies** — all twelve: the living fixture, four
  committed candidates, six committed drafts, and the browser fixture
  `terminal-outcome.browser.json` under `schemas/fixtures/drill-pack/`.
- **The five fixtures in `drill-pack.test.ts`'s `negativeFixtures` list (`:37-43`) already
  fail** for their own reasons and their test asserts only `false`
  (`packages/schema/src/drill-pack.test.ts:81-84`), so they keep passing and are not amended.
- **`schemas/fixtures/drill-pack/illegal-spine.invalid.json` is the exception, and it must be
  amended.** It is a sixth `*.invalid.json` file that is deliberately **not** in that list:
  `drill-pack.test.ts:157-171` asserts `validate(fixture)` is `true` and then that
  `lintDrillPack` reports `ILLEGAL_SPINE_MOVE`, i.e. it exists to prove the lint stage catches
  what the schema cannot. Requiring `side` flips that assertion to `false` and the case fails.
  The fixture gains `"side": "white"` in its `start` object; its FEN is the initial position
  with White to move, so the value is the only honest one and the lint under test is
  untouched.

**3b. The validator stops guessing.** `apps/server/src/pack-validation.ts:369` deletes
`pack.start.side === "black" ? "black" : "white"` and reads `pack.start.side` directly, which
now typechecks against `RunStart.side` (`packages/runtime/src/types.ts:47-50`) because of
§3a's type narrowing — without it the read is `unknown` and the `createRun` call would not
compile. The Syzygy perspective computation at `:345-351` is left structurally as-is and is
now correct by construction rather than by luck: `learner` (`:346`) is a colour, so
`learner === sideToMove` (`:349`) is a real comparison and `opposite(...)` (`:351`) applies
only when the learner is not the side to move. §Acceptance 4c pins the previously-inverted
case with a test.

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
unchanged. Under §3a's narrowed type its `side !== "white" && side !== "black"` branch is
statically unreachable and TypeScript accepts it without complaint; that is the intended
outcome, because the value it guards arrives over HTTP and the type is a claim about the
server, not a fact about the bytes. It is now defence in depth behind three checks — schema,
API boundary, and `service.ts:183-185` — and none of them is redundant: they cover authoring,
transport and run creation respectively.

### 4. D6 — `phase` reaches the client

**4a. Server.** `apps/server/src/pack-registry.ts:26-34` (`PackSummary`) gains
`readonly phase: PackPhase | null;` and `:201-209` sets
`phase: typeof raw.phase === "string" ? (raw.phase as PackPhase) : null`. The schema's enum
has already constrained the string by the time a document reaches this point. The detail
projection at `:68` is unchanged — it already ships `phase`.

**4b. Client type.** `apps/web/src/lib/api.ts:16-24` mirrors the field exactly, importing
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
  `compose.yaml:11`.
- `:17-19` — the `depends_on.maia` block gains `required: false`, matching
  `compose.yaml:21-24`, so the server starts with no Maia service present.
- The `maia` service (`:22`) gains `profiles: [engines]`, matching `compose.yaml:28`.
- Nothing else changes: image placeholders, healthcheck, port mapping and the `tabiya-data`
  volume are untouched, so `.github/workflows/release.yml:68-70`'s `sed` substitution still
  works unmodified.

`TABIYA_COOKIE_SECURE` is **not** added here even though `compose.yaml:12` sets it to
`"false"`: the release artefact is the hosted-deployment path, where defaulting the cookie to
secure is correct. The mismatch that bites a plain-HTTP self-hoster is a separate defect and
gets a BACKLOG row (§8, row 6) rather than a silent default change inside a defect sweep.

`docs/development.md:87-88` already tells a self-hoster that a tagged release attaches a
digest-pinned Compose file; the file it attaches is `release/compose.yaml`
(`.github/workflows/release.yml:70,75`), **not** the repository's `compose.yaml`, which
builds `:dev` images from source and is not what anyone downloads. So the two incantations
this RFC adds to `docs/development.md` name the downloaded artefact:
`docker compose -f compose.yaml up -d` **run against the release file** for the deterministic
mock opponent, and `ENGINE_MODE=maia docker compose -f compose.yaml --profile engines up -d`
for Maia — the same two shapes as `make up` / `make up-engines` (`docs/development.md:81-83`),
which is the point of §5, but written as release-artefact instructions and placed with the
release paragraph rather than the development one.

`tools/verify-packaging.mjs:23-32` extends to prove it rather than assert about text. The
existing `compose()` helper (`:10-17`) hardcodes `config --quiet` and discards stdout, so it
gains a sibling `composeConfig(args)` that runs `config --format json`, throws on a non-zero
exit with the same message shape, and returns `JSON.parse(result.stdout)`:

- `compose(["-f", releasePath, "--profile", "engines"])` joins the existing unprofiled
  `compose(["-f", releasePath])` call at `:32`.
- `composeConfig(["-f", releasePath])` — no profile — requires
  `Object.keys(config.services)` to be exactly `["server"]`. This is the executable form of
  "the published artefact does not require Maia", and it is only satisfiable because
  `required: false` lets Compose drop a dependency on a service the active profiles exclude,
  which is the same mechanism `make up` already relies on against `compose.yaml`.
- `composeConfig(["-f", releasePath, "--profile", "engines"])` requires `maia` to be present
  and `services.server.depends_on.maia.condition` to be `service_healthy`.

### 6. D10 — engine version is parsed whenever the spec does not supply one

`apps/server/src/engine-supervisor.ts:111-140` (`parseIdentity`). The defect is that version
derivation is nested inside `if (spec.name === undefined && advertised !== undefined)`
(`:120`), so naming the engine costs you its version. The fix separates the two decisions and
adds a mismatch guard:

```ts
const advertised = lines.find((line) => line.startsWith("id name "))?.slice(8).trim();
const advertisedName = advertised?.split(/\s+/u)[0];
const advertisedVersion =
  advertised === undefined ? undefined : advertised.slice(advertisedName!.length).trim() || undefined;
const nameAgrees =
  spec.name === undefined ||
  (advertisedName !== undefined &&
    advertisedName.toLowerCase() === spec.name.toLowerCase());

const name = spec.name ?? advertisedName ?? "unknown";
const version = spec.version ?? (nameAgrees ? advertisedVersion : undefined) ?? "unknown";
const mismatch = nameAgrees
  ? undefined
  : `identity mismatch: spec names ${spec.name!}, engine advertises ${advertised ?? "nothing"}`;
```

**Why `advertisedName` and not `advertised` for the unnamed case, and why the Stockfish
special case dies.** Today's `name = spec.name ?? advertised ?? "unknown"` keeps the *whole*
`id name` line, and the `/^Stockfish/` branch at `:121-125` exists solely to trim it back to
`"Stockfish"` for the one engine anyone hit. Splitting on the first token generalises that
trim to every engine and lets the special case go — but only if the same expression feeds
`name`. Left as `spec.name ?? advertised`, an unnamed non-Stockfish spec would become
`{name: "Lc0 v0.31.2", version: "v0.31.2"}` — the version duplicated inside the name, a new
defect introduced by the fix for D10. Splitting the whole line once and using both halves
consistently is the only form that has no such case.

**Where the mismatch note goes.** `parseIdentity` is a module-level function
(`engine-supervisor.ts:111`) with no access to the transcript ring; the ring is reachable
only from its single caller, `ManagedUciEngine`'s start path at `:232`, as `this.#transcript`.
So `parseIdentity`'s return type becomes
`{ readonly identity: EngineIdentity; readonly mismatch?: string }`, and `:232` becomes:

```ts
const parsed = parseIdentity(this.#spec, uciLines, optionNames);
if (parsed.mismatch !== undefined) this.#transcript.push("lifecycle", parsed.mismatch);
this.#identity = parsed.identity;
```

`TranscriptRing.push` already accepts `"lifecycle"` (`:87-89`, `TranscriptEntry.direction` at
`:49`), so no type or storage changes.

Behaviour, stated case by case:

| Spec | Advertised `id name` | Before | After |
|---|---|---|---|
| `{name: "Stockfish"}` (`strong-engine.ts:50`, `application.ts:188`) | `Stockfish 17.1` | `Stockfish` / `unknown` | `Stockfish` / `17.1` — **D10 closed** |
| `{}` (`position-seeds.ts:67`) | `Stockfish 17.1` | `Stockfish` / `17.1` | unchanged |
| `{name: "Maia3", version: MAIA3_SOURCE_COMMIT}` (`application.ts:195-200`) | anything | spec values | unchanged — an explicit `spec.version` always wins |
| `{name: "Stockfish"}` | `Lc0 v0.31.2` | `Stockfish` / `unknown` | `Stockfish` / `unknown`, **plus** a `lifecycle` transcript entry `identity mismatch: spec names Stockfish, engine advertises Lc0 v0.31.2` |
| `{}` (hypothetical unnamed non-Stockfish spec) | `Lc0 v0.31.2` | `Lc0 v0.31.2` / `unknown` | `Lc0` / `v0.31.2` — the generalised trim; no such spec ships after this RFC removes the last one |

The mismatch case is why the guard exists: recording another engine's version under the
spec's name would be worse provenance than `unknown`, and staying silent about it would be
worse still. **The guard is name-agreement, not version-plausibility, and that is the correct
test** — it compares the first token of the advertised `id name` with `spec.name`
case-insensitively, so the only way a foreign binary's version reaches `EngineIdentity.version`
is if that binary also advertises the spec's name, at which point the deployment has
substituted the binary and the identity is as honest as the filesystem allows. A version
string that merely *looks* wrong is not filtered, deliberately: this RFC does not encode what
a Stockfish version number should look like.

**The B6b workaround is removed.** `apps/server/src/sourcing/position-seeds.ts:67` gains
`name: "Stockfish"` back. Real Stockfish advertises a matching first token, so the version
still resolves and the authoring evidence at `:75-76` keeps a real `engineVersion`.

**A consequence to state, not hide.** `--engine-eval` emissions previously recorded
`engineVersion: "unknown"` uniformly (`position-seeds.ts:75-76`) and will now record the
operator's actual Stockfish version, so two operators on different Stockfish builds produce
different `evidence.json` bytes. That is the point of the defect being a defect — anonymous
provenance was "deterministic" only because it recorded nothing — and it does not touch the
deterministic-output rule's subject. Verified rather than assumed:
`emissionJobDigest(pipeline, args, sourceEtags)` (`apps/server/src/sourcing/canonical.ts:20`)
takes exactly three inputs and engine identity is not among them; the shipped
`content/candidates/onramp-00008/job.json` records
`{"args":{...,"engineEval":false,...},"sourceEtags":[...],"emissionJobDigest":"sha256:9596fd…"}`,
so the digest of the one committed job is unchanged by this RFC **and would be unchanged even
if the job had run with `engineEval: true`**. The skip-if-unchanged guard
(`position-seeds.ts:262`, `openings.ts:151`) compares that digest, so re-running the shipped
job on a new Stockfish still short-circuits and does not rewrite any committed candidate's
bytes. The version change reaches only newly emitted `evidence.json` source origins.

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
- `packages/schema/src/drill-pack.test.ts:49-56` — the `describe` title (`:49`) and both
  assertions (`:53`, `:55`) move to `0.5`. The frozen-v0.1 case at `:58-79` still passes,
  verified by execution against a required-`side` build of the schema: the frozen fixture
  produces a `missingProperty: "feedbackPolicy"` error among many others, and the case matches
  with `expect.arrayContaining`, which tolerates the additional `missingProperty: "side"` the
  frozen `start` block does not trigger — it declares `side: "white"` already.

The version claim is registered. `rfc/README.md` already records `defect-sweep.md` at pack
schema **0.5** with **no migration** (its status register and its pack-schema register), and
four sibling drafts have rebased above it — `return-and-progression.md` to 0.6,
`trajectory-drill.md` to 0.7, `pack-studio.md` to 0.8, `n-way-comparison.md` to 0.9. This RFC
claims no new number and needs no register edit.

No pack file's bytes change, so no pack digest changes, so no sidecar `packDigest` in
`content/candidates/` is invalidated (`content/candidates/onramp-00008/evidence.json` carries
`packDigest` alongside `packId` and `packVersion`). The one fixture whose bytes do change,
`illegal-spine.invalid.json` (§3a), has no digest sidecar and is never served.

### 8. Docs to reconcile, and BACKLOG rows to propose

**Docs the implementer updates** (these are `docs/`, the canonical description of what
exists — not `design/`):

- `docs/drill-pack-format.md` says **v0.3 in four places** — `:4` ("It describes format
  v0.3"), `:9` ("intentionally fails v0.3"), `:12` (the `## Implemented v0.3 shape` heading)
  and `:50` ("the format v0.3 amendment") — while the file has been v0.4 since the Line Drill
  RFC. All four move to v0.5 in the same edit; leaving three behind would reproduce the drift
  this RFC exists to close. `:17-18` drops `immediate_blunder_guard` from the
  `feedbackPolicy` list and `:44-46` keeps its structurally-open `actions` statement
  unchanged (§1d). A new `## v0.5 defect sweep` section, in the style of `## v0.4 Line Drill
  contract` (`:140-158`), states the required `side`, the removed policy value, and the
  executable-versus-declared vocabulary rule from §2. `pack-studio.md:1065` expects that
  section to sit before the v0.6/v0.7/v0.8 sections the parallel drafts add.
- `docs/drill-client.md:14-19` — `immediate_blunder_guard` moves from "remains cut" (`:15`) to
  "is not in the format"; add that `PackSummary` carries `phase` and that an unset phase
  renders `unclassified`.
- `docs/engine-workers.md:22,153,196,205` — state that `version` comes from `spec.version`,
  else from the advertised `id name` remainder when the advertised name agrees with the
  spec's, else `unknown`, and that a disagreement is recorded in the transcript.
- `docs/development.md:87-88` — the release-artefact incantations from §5, beside the existing
  sentence about the attached digest-pinned Compose file rather than beside `make up`.
- `docs/content-sourcing.md:95-98` and `docs/outcome-drill-grading.md:115-116` — keep their
  `perfect_tablebase` statements and note that the declaration is now bound by test (§2b).
  `content-sourcing.md:98` carries a bare `(D8)` reference that must go with the defect it
  names.

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

1. Mark D4 (`design/BACKLOG.md:117`), D5 (`:118`), D10 (`:132`), D9 (`:133`), D8 (`:134`) and
   D6 (`:136`) closed, each with the section of this RFC that closed it. Three of those rows
   carry stale coordinates that should be corrected in the same edit rather than frozen into
   a closure note: D4 cites `pack-validation.ts:11` (now `:18`), D8 cites `:104-129` (now
   `:111-134`), D6 cites `pack-registry.ts:16-24` (now `:26-34`).
2. Unblock the "Phase-oriented product discovery" row (`design/BACKLOG.md:60`), which reads
   "blocked on **D6**", and note that `design/03-product-breadth.md:171`'s B1 residual list
   loses its `phase` item, as does the restatement at `:213`.
3. **New — immediate blunder-guard feedback as a real policy.** What it needs: per-move judge
   evaluation of the learner's own moves, a blunder-threshold vocabulary the pack format does
   not have, an interrupting client surface, and a ruling on how the anti-contamination
   barrier opens early without contaminating the decision it is protecting. Until then the
   on-ramp band (`design/00-thesis.md:84-89`, the knob at `:86`) runs on two of its three
   declared knobs, and after §2a the format no longer implies otherwise. **This row is the
   ledger entry for a design capability this RFC removes the encoding of**; without it the
   sweep would be a silent narrowing of the target-band definition.
4. **New — `opponentPolicy` is `additionalProperties: true`** (`schema:496`): an author can
   write a policy field nothing reads and hear nothing, which is D3's shape surviving in the
   pack format after D3 closed it for `POST /runs`.
5. **New — `position-seeds` omits `phase`** when a puzzle carries zero or multiple phase
   themes (`position-seeds.ts:166-169,231`), so on-ramp packs can reach the library
   unclassified on the axis the Learn IA is organized around.
6. **New — `TABIYA_COOKIE_SECURE` defaults to true** (`main.ts:18`, `identity.ts:86`), so a
   self-hoster running §5's light profile over plain HTTP gets a login that silently fails.

## Deviations from design

1. **`design/00-thesis.md:86` names pack-declared immediate blunder-guard feedback as one
   of the three knobs that define the 1000-1400 on-ramp lane (`:84-89`).** §2a removes its
   encoding instead of implementing it. This does not change what the product can do today —
   the value was rejected at load and both shipped on-ramp candidates already carry a
   graduation blocker saying so (`content/candidates/onramp-00008/pack.json`,
   `onramp-0000d/pack.json`) — but it does remove an author's ability to record the intent in
   the pack, and that is a loss the design tier should weigh rather than absorb. The knob
   returns through the BACKLOG row in §8 (row 3), with the design question answered rather
   than assumed.
2. **`design/03-product-breadth.md:144` puts "packs by phase" on the Play surface and
   line 171 lists the missing projection as a B1 residual (restated at `:213`).** §4 ships
   the projection and one label; it does not ship "packs by phase" as an information
   architecture. B1's residual is removed; B1's successor work (program items #4 and #7) is
   not started.
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
   outside tests returns exactly **two** non-test sites and they are of different kinds: the
   declaration, `packages/schema/src/drill-pack/types.ts`, and the exhaustive mirror in
   `apps/web/src/lib/screen-model.ts` whose keys are checked against it by
   `Record<CheckpointAction, boolean>`. In particular `apps/server/src/pack-validation.ts` and
   `apps/web/src/lib/CheckpointSheet.svelte` no longer name the value at all. **A grep
   result of one would mean the exhaustiveness check had been removed**, so the criterion is
   two, not one. (b) The mirror is demonstrated to be load-bearing: the commit is accompanied
   by evidence that deleting the `compare_branches` key from that literal fails
   `pnpm typecheck` with a missing-property error, and that adding a member to
   `CHECKPOINT_ACTIONS` without adding a key fails the same way. (c) `screens.test.ts` asserts
   the checkpoint sheet renders the compare control for `actions: ["compare_branches"]`
   (as it does today at `:402`) and not for `actions: ["compare_branches_v2"]`.
2. **Schema and constants are bound, in both directions.** A `packages/schema` test asserts
   `$defs.objectiveType.enum` deep-equals `OBJECTIVE_TYPES`, `properties.feedbackPolicy.enum`
   deep-equals `FEEDBACK_POLICIES`, and `properties.phase.enum` deep-equals `PACK_PHASES`, as
   ordered arrays. **`apps/server/src/pack-authoring.test.ts:41-61` is extended rather than
   duplicated**: its opponent-mode set equality (`:48-53`) stays, gains a disjointness
   assertion between `SUPPORTED_POLICY_MODES` and `DECLARED_UNIMPLEMENTED_POLICY_MODES`, and
   its feedback-policy assertion (`:54-60`) becomes ordered equality with `FEEDBACK_POLICIES`.
   `grep -rn "opponentPolicy.properties.mode.enum" apps packages` returns exactly one test
   site. Each of the five assertions is demonstrated to fail under a one-sided mutation of its
   fixture copy.
3. **D8, per value.** (a) A pack whose only defect is
   `feedbackPolicy: "immediate_blunder_guard"` is rejected by `validatePackDocument` with
   **exactly one** issue: `source: "schema"`, `code: "SCHEMA_ENUM"`, `path: "/feedbackPolicy"`
   — the assertion that distinguishes removal from a renamed runtime refusal, and that pins
   the short-circuit at `pack-validation.ts:420-427` as understood rather than discovered.
   (b) The combining case at `pack-authoring.test.ts:80-111` still asserts a `source: "lint"`
   and a `source: "runtime"` issue from one document, using the illegal spine move and
   `plan_defense` only. (c) `DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES` no longer exists:
   `grep -rn "DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES" apps packages` returns nothing, and
   `drill-client-server.test.ts:206-219` still refuses the value, now on the Ajv enum message.
   (d) A pack with `opponentPolicy.mode: "perfect_tablebase"` still passes the schema and is
   still rejected at load with the reason string from `capabilities.ts:19-21`, unchanged.
   (e) `grep -n "human_common" apps/server/src/service.ts` shows no inline mode triple, and
   `isRunOpponentMode` narrows without a cast — demonstrated by the absence of any
   `as RunOpponentMode` in `service.ts` under `pnpm typecheck`.
4. **D9.** (a) The living fixture with `start.side` deleted fails schema validation with
   `keyword: "required"`, `missingProperty: "side"`, `path: "/start/side"`. (b) All twelve
   non-negative packs in the tree still validate — the living fixture, four committed
   candidates, six committed drafts, and `terminal-outcome.browser.json` — and
   `pack-authoring.test.ts:256-263` still loads the candidates directory into a registry of
   five entries (the living fixture plus four candidates), four of them `reviewStatus: draft`.
   (c) A Syzygy-graded fixture whose declared category is correct for a black learner passes,
   and the same fixture with `start.side` flipped to white fails with
   `SYZYGY_ASSESSMENT_MISMATCH` — the pair that cannot be written today, because a missing or
   mis-read side inverts the comparison at `pack-validation.ts:349`. (d) `grep -n
   '=== "black" ? "black" : "white"' apps/server/src/pack-validation.ts` returns nothing, and
   `DrillPackDefinition["start"]["side"]` is `"white" | "black"` rather than `unknown`.
   (e) `packages/schema/src/drill-pack.test.ts:157-171` still passes: the amended
   `illegal-spine.invalid.json` is still schema-valid and still reports `ILLEGAL_SPINE_MOVE`.
   (f) **Browser:** with Playwright `page.route` intercepting `GET /packs/*` to strip
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
   `services.server.depends_on.maia.condition === "service_healthy"` under
   `--profile engines`. (b) `docker compose -f <rendered> config --quiet` and the same with
   `--profile engines` both exit zero. (c) `grep -n "ENGINE_MODE" deploy/compose.release.template.yaml`
   shows the `${ENGINE_MODE:-mock}` default and `grep -n "required: false"` finds the
   `depends_on` relaxation. (d) The check is demonstrated to fail against the current
   template — specifically, the no-profile service-key assertion, which today yields
   `["maia", "server"]`.
7. **D10.** (a) A supervisor test drives a fake UCI process that advertises
   `id name Stockfish 17.1` against a spec with `name: "Stockfish"` and no `version`, and
   asserts the identity is `{name: "Stockfish", version: "17.1"}` — failing on the current
   tree. (b) The same advertisement against a spec with `version: "pinned"` yields
   `"pinned"`. (c) A spec named `Stockfish` against an engine advertising `Lc0 v0.31.2`
   yields `{name: "Stockfish", version: "unknown"}` **and** a `direction: "lifecycle"`
   transcript entry containing `identity mismatch`, read back through the supervisor's
   transcript accessor — the assertion that proves the note reaches the ring rather than a
   local variable. (d) A spec with no `name` against `id name Stockfish 17.1` still yields
   `{name: "Stockfish", version: "17.1"}`, and against `id name Lc0 v0.31.2` yields
   `{name: "Lc0", version: "v0.31.2"}` — the generalised trim, asserted so the removed
   Stockfish special case cannot silently regress the name. (e) `position-seeds.ts:67`
   declares `name: "Stockfish"` and its evaluator test asserts the emitted source origin
   carries a non-`unknown` `engineVersion` when the fake engine advertises one.
8. **No persisted shape moved.** `packages/runtime`'s `runSchemaVersion`, `STORAGE_VERSION`
   and `SelectionEngineIdentity` are byte-identical to `main`; `rfc/README.md`'s migration
   register gains no row; and `digestDrillPack` over every committed pack returns the digest
   recorded in its sidecar where one exists.
9. **`pnpm verify` and `pnpm test:browser` pass with `retries` unset**, per D14's closure
   condition (`design/BACKLOG.md:125`) — a green suite that needed a retry is not evidence.

## Open questions

None.

## Changelog

- 2026-08-13: accepted after independent adversarial review and moved to
  implementing with a dedicated planning job.

- 2026-08-13 (adversarial review, second pass): eleven corrections, all verified against the
  tree and several by execution. **Blast radius the first pass missed:**
  `schemas/fixtures/drill-pack/illegal-spine.invalid.json` is a sixth negative fixture that is
  deliberately schema-*valid* and asserted as such (`drill-pack.test.ts:157-171`), so required
  `side` breaks it — §3a now amends it; and because `validatePackDocument` returns after a
  failed schema stage (`pack-validation.ts:420-427`), removing `immediate_blunder_guard` from
  the schema suppresses every lint and runtime issue in the same document, which breaks
  `pack-authoring.test.ts:80-111` structurally and changes the message
  `drill-client-server.test.ts:218` asserts — §2a now splits the first and restates the
  second. **Corrections that make the spec compile:** `DrillPackDefinition["start"]` has no
  `side` at all (`types.ts:83`), so §3b's "read the side directly" needed §3a to narrow the
  type; `RUN_OPPONENT_MODES.includes(mode as RunOpponentMode)` does not narrow `unknown` and
  would break the `RunOpponentPolicy` literal at `service.ts:192-197`, so §2b now specifies an
  `isRunOpponentMode` predicate; `parseIdentity` is a free function with no access to the
  transcript ring, so §6 now returns the mismatch note and pushes it at the caller (`:232`);
  and §6's snippet left `name` as the whole `id name` line, which would have produced
  `{name: "Lc0 v0.31.2", version: "v0.31.2"}` for an unnamed spec — a new defect introduced by
  the fix for D10. **Claims that were wrong:** `pack-authoring.test.ts:41-61` already binds
  both enums to the capability constants as sets, so §2's "nothing binds the copies" was half
  false and §2b's "new test in `capabilities.test.ts`" would have duplicated it — the existing
  test is extended with the disjointness assertion instead; §5's self-hoster incantation named
  the repository's `compose.yaml` rather than the published `release/compose.yaml`; the
  Migration paragraph named `runtimeBuildInfo` where the field lives on `schemaBuildInfo`.
  **Coordinates re-verified:** the ledger's D10/D9/D8/D6 rows are at `design/BACKLOG.md`
  132/133/134/136 (not 128/129/130/132) and D9's row was itself rewritten on 2026-08-13, so
  the Summary no longer claims the ledger disagrees with this RFC; `design/03-product-breadth.md`
  B1 is line 171 and "packs by phase" line 144 (not 161/134); plus `service.ts:189`,
  `capabilities.ts:165`, `compose.yaml:11,21-24`, `pack-validation.ts:349,351`,
  `docs/drill-pack-format.md:44-46` and D14 at `BACKLOG.md:125`. Motivation subsections
  renumbered `1.1`/`2.1` so they no longer collide with the Specification's `§1a`/`§2a`, which
  four sibling drafts cite by number; Specification numbering is untouched.
- 2026-08-13: created. Re-verified all six open defects (all still real; D8 is five values
  rather than two, and D9's ledgered symptom has been made unreachable by a guard elsewhere
  while the format defect underneath it grew a second, sharper consequence in the Syzygy
  perspective check). Specifies one shared vocabulary constant with type-level and
  schema-agreement tests, the per-value D8 ruling (`immediate_blunder_guard` removed,
  `perfect_tablebase` kept and bound by test) with the executable-versus-declared rule that
  justifies the split, required `start.side` in pack schema v0.5, `phase` on `PackSummary`
  with an honest `unclassified` state, the light profile on the release Compose artefact, and
  engine version parsing that no longer depends on whether the spec names the engine.
