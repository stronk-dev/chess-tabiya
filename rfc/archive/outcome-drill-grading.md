# RFC: Outcome Drill — objective grading for win / hold / save / resist

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` §Outcome types, §The four modes;
  `design/03-product-breadth.md` gate B2 and program item #4;
  `design/04-content-architecture.md` §4, §7
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened
  by owner ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. `rfc/archive/terminal-outcome-events.md` (D11) is
  implemented and supplies `outcome.reached`; `rfc/archive/content-sourcing-syzygy.md`
  (B6b) is implemented and supplies the `tablebase_result` ledger record this RFC binds a
  root assessment to
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.2 → 0.3:
  `objective.grading`, a closed `successConditions` union, a closed `objective` object)
  and **`rfc/archive/terminal-outcome-events.md`** (its `outcome.reached` gains its first
  consumer). It also extends behaviour frozen in `rfc/archive/branch-runtime.md`
  (objective evaluation, the segment rule, and the read-back pairing that
  `resistanceOnPath` consumes), `rfc/archive/drill-client.md` +
  `rfc/archive/authored-feedback-delivery.md` (the pack projection gains exactly one
  field and no authored-feedback prose), and `rfc/archive/content-sourcing-syzygy.md`
  (its ledger becomes the only thing that can ground an "exact" label, its ledger and
  manifest validators are extracted for reuse, and pack discovery gains reserved sidecar
  names so a ledger may sit beside a served pack at all)
- **Supersedes / superseded by:** —
- **Migration:** none. This RFC changes no persisted run shape and claims no migration
  number; see Specification §12.
- **Planning:** `planning/archive/outcome-drill-grading/`

## Summary

`mode: "outcome"` and `objective.type: "hold"` are strings that reach no consumer.
`objectiveRules()` compiles exactly one condition shape — `reach_checkpoint` — and
hardcodes `to: "achieved"` (`apps/server/src/pack-orchestrator.ts:102-117`), and
`pack-validation.ts:160-178` rejects everything else. So the only encodable statement
about an outcome objective is "a checkpoint fired, therefore you succeeded".

That is not merely insufficient. Applied to the one real `hold` pack in the tree it is
**actively broken**: `content/drafts/rook-4v3-same-side.json` is unplayable past White's
first move, verified by execution (Motivation §2). This RFC specifies the grading that
program item #4 owns and that `rfc/archive/terminal-outcome-events.md` explicitly left
out: how `win`, `hold`, `save` and `resist` resolve against `outcome.reached`, what
happens to a run that ends without a terminal position, what the product may say about a
root nobody can prove, and who it may say resisted.

## Motivation

### 1. The contract exists only in prose

`content/drafts/rook-4v3-same-side.json:515-519` ships a `feedbackClaim` that reads:

> "This is an outcome drill. You are graded on whether the result survived, not on
> whether you found the move an engine likes."

Nothing grades whether the result survived. The author wrote the WDL contract into a
paragraph because there was no field to write it into. That is the B2 gap for Outcome
Drill stated in one line.

### 2. D12 — the one real `hold` pack is unplayable (verified by execution)

Pack C's success condition is `reach_checkpoint: still-holding`
(`content/drafts/rook-4v3-same-side.json:20-25`), and `still-holding` triggers on
`materialBalance{perspective: black, comparison: atLeast, value: -1}` (lines 326-337).
Black starts a pawn down, so the balance **is already −1 at the root**. Driving the
shipped orchestrator over the pack's own first spine move produces:

```text
move.committed        Kf1 (opponent, ply 1)
checkpoint.reached    scheme-choice
checkpoint.reached    still-holding          <- true at the root
segment.completed     startNodeId == endNodeId
objective.state_changed  active -> achieved  evidenceRefs ["pack:still-holding"]
commitMove(black, g8f8) -> RuntimeError: Run is terminal at node: :node:1
feedbackDisclosed -> true
```

Four failures in one ply, all in shipped code, all ledgered
(`design/BACKLOG.md:120-124`):

- **D12a — nothing catches a trigger that is already true at the root.** `lint.ts`
  checks spine legality, SAN, node references and prose reachability
  (`packages/schema/src/drill-pack/lint.ts:209-261`); `runtimeIssues` checks policies,
  actions and condition shapes (`apps/server/src/pack-validation.ts:74-180`). Neither
  evaluates a `materialBalance` or `fenPredicate` trigger against `start.fen`. The pack's
  own graduation blocker suspected the trigger might be "inert"
  (`content/drafts/rook-4v3-same-side.json:539`); it is worse than inert.
- **D12b — `achieved` is absorbing, so grading a hold as "achieved" ends the drill.**
  `TERMINAL_OBJECTIVE_STATES` (`packages/runtime/src/runtime.ts:32`) makes `commitMove`
  throw `RUN_TERMINATED` (`runtime.ts:277-279`), and the client stops asking for
  opponent replies (`apps/web/src/lib/session-controller.ts:372-380`). The learner never
  moves. **A `hold` objective can never be "achieved" at a playable position** — that is
  the structural finding this RFC is built on.
- **D12c — the disclosure barrier opens at ply 1.** `delayed_checkpoint` discloses on
  any `checkpoint.reached` (`packages/runtime/src/feedback.ts:3-8`), so ADR-0006's
  uninterrupted-consequence stage is gone before the learner touches a piece.
- **D13 — a zero-length segment.** `reachCheckpoint` pairs each checkpoint with the
  previous one on the branch without checking node identity
  (`packages/runtime/src/runtime.ts:430-436`, `:448-466`), so two checkpoints on one node emit
  `segment.completed` with `startNodeId === endNodeId`. Under `segment_end` that is a
  premature-disclosure path, not just noise.

Pack C is the only pack in the tree with an outcome objective type; the other seven
(`schemas/drill_pack.example.json`, two drafts, four candidates) use
`play_until_checkpoint` or plan types, and Pack C is the only pack whose checkpoints
include a trigger evaluated against the *position* rather than a spine node or a ply. So
the blast radius of fixing this is exactly one authored file.

### 3. Scope boundary

**In scope:** the mapping from the four objective types to the six objective states; the
resolution contract for runs that never terminate; the termination invariant that makes a
grade independent of move parity; the pack-format encoding; the validation that makes the
encoding safe; the honest rendering of a grade whose ground truth does not exist, and of
the opponent that actually produced it.

**Out of scope,** with reasons:

| Out of scope | Why |
|---|---|
| A runtime tablebase client | `grep -rn "tablebase\|syzygy" apps packages workers tools`, excluding `apps/server/src/sourcing/` and build output, returns nothing. Syzygy is an **authoring-time** pipeline (`apps/server/src/sourcing/syzygy.ts:105-121`, called only from `emitSyzygyCandidates` at :123). Probing positions mid-run is network egress, caching, licence recording and an abstention path — an engine/sourcing RFC |
| Implementing `perfect_tablebase` (D8's capability half) | Same reason. §8 closes D8's **drift** half — the schema/validator disagreement — and makes the missing capability visible inside every grade instead of silently absent |
| Stockfish as a grading authority | An evaluation is not a result. Above 7 pieces Stockfish cannot prove a draw, and promoting its number to a verdict is the dashboard anti-pattern (`AGENTS.md` law 8) one provider away from an LLM doing it |
| Delivering unanchored `feedbackClaims` | `projectAuthoredFeedback` has three item kinds — annotation, deviation, plan_class (`apps/server/src/authored-feedback.ts:24-49`) — all anchored to a spine node or a checkpoint. A claim anchored to neither is authored, stored, and never deliverable. Real gap; a BACKLOG row to propose, not a thing this RFC widens (§4b) |
| Intent-relative success for Plan Drill | Ledgered separately in `design/BACKLOG.md` §Authoring-format friction; needs `checkpoints[].interaction` to have a consumer, which it does not |
| `play_until_checkpoint` freezing at its checkpoint | Existing behaviour on four emitted candidates and the served schema example. Correct for a play-it-out drill and deliberately untouched |

## Specification

### 1. What grading is allowed to know

Three facts, all machine-derivable with no evaluation:

1. **The result of a terminal position**, from the laws of chess, in the learner's
   perspective. Shipped: `terminalOutcome` (`packages/runtime/src/outcome.ts:5-11`),
   emitted once per terminal node inside `commitMove`
   (`packages/runtime/src/runtime.ts:338-343`) and re-validated on replay
   (`packages/runtime/src/events.ts:163-186`).
2. **Whether an authored checkpoint was reached on the active path**, and **whether one
   fired at this node**. Shipped: `checkpointWasReached`
   (`packages/runtime/src/objective.ts:176-184`); the per-node form is added in §6.
3. **Material balance and rules facts.** Shipped:
   `evaluateObjectivePredicate` (`packages/runtime/src/objective.ts:195-230`).

Everything else — "is this still drawn", "was that resistance practical", "did you have
a win" — is an assessment. This RFC never computes one. It requires the pack to
**declare** it, requires a machine-checkable ledger record before the word "exact" may
appear anywhere near it, and otherwise renders it as a claim.

### 2. The four objectives against a three-valued outcome

`outcome.reached` carries `win | loss | draw`
(`packages/runtime/src/types.ts:186-189`, `RunOutcome` at `types.ts:39`). The four
objective types are **claims about the starting position**, and the grade is whether the
run's result stayed at or above the floor that claim implies.

| `objective.type` | claims the root is | result floor | distinguished from its neighbour by |
|---|---|---|---|
| `win` | winning for the learner | `win` | — |
| `hold` | drawn | `draw` | vs `save`: **the root claim, not the ending** |
| `save` | worse for the learner, not proven lost | `draw` | vs `hold`: **the root claim, not the ending** |
| `resist` | lost | none | its success condition is survival, not result |

**`hold` and `save` produce identical result grading.** That is the honest answer to
"what distinguishes them": nothing at the terminal node. The distinction lives in the
type name, which is a claim about the root, and it is load-bearing in exactly three
places — the assessment sentence shown to the learner (§9), the failure sentence (§9),
and what an author is allowed to declare as `assessedBy` (§7's `SYZYGY_ASSESSMENT_MISMATCH`).
Encoding the difference anywhere else would require an evaluation the repo cannot ground.

**`resist` succeeds on a loss.** Its success condition is *survival to an authored
resistance checkpoint*, which is condition (2) of §1 — an authored fact about the path,
not an evaluation of difficulty. A `resist` objective whose `resolveAt` is not a
checkpoint is ungradable and is rejected at load (§7).

### 3. When an objective resolves — and when it does not

**On an outcome objective (`type ∈ {win, hold, save, resist}`), `achieved` and `failed`
require an `outcome.reached`.** No other condition kind may enter an absorbing state.
This is a law, not a default (§7 enforces it as `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`),
and it is the direct fix for D12b: a state that stops play may only be entered at a
position where play has already stopped.

**The law is scoped to outcome objectives, deliberately.** `play_until_checkpoint`
keeps `reach_checkpoint → achieved` exactly as it ships: it is correct for a play-it-out
drill, four emitted candidates and the served schema example rely on it, and the browser
assertion `active → achieved` (`tests/browser/drill.spec.ts:148`) must keep passing.
§7's validation code carries the same scope, and criterion 2 asserts both halves.

**Every non-terminal resolution grades `preserved`.** `preserved` is the state the
runtime already owns for "the objective is intact and the run continues"
(`packages/runtime/src/objective-state.ts:3-10`; it is non-absorbing and may transition
onward). It is also the only honest word available: reaching the end of a hold drill is
not a draw, and the product must not say it is.

Resolution is declared, not inferred. `objective.grading.resolveAt` is one of:

- `{"kind": "terminal"}` — the objective resolves only when the game ends.
- `{"kind": "checkpoint", "checkpointId": "<id>"}` — the commit at which that checkpoint
  fires on the active path resolves an `active` objective to `preserved`.

There is deliberately **no ply-horizon kind and no engine or Syzygy resolution.** A ply
horizon is written as a checkpoint with an `atPly` trigger, which the schema already
supports and which `emitSyzygyCandidates` already emits
(`apps/server/src/sourcing/syzygy.ts:186`); routing it through a checkpoint means every
resolution carries a `pack:<checkpointId>` evidence reference that the shipped renderer
turns into the checkpoint's authored label (`apps/web/src/lib/evidence-sentences.ts:44-53`)
instead of a new vocabulary. Engine and Syzygy resolution are refused for the reasons in
the out-of-scope table and §9.

#### 3a. The monotone law — why no grade depends on move parity

The runtime's `ALLOWED_TRANSITIONS` permits `preserved → degraded`, `degraded →
preserved` and both back to `active` (`packages/runtime/src/objective-state.ts:3-10`).
Those back-edges are what let a standing condition and a standing resolution take turns:
`evaluateObjective` re-evaluates every rule on every commit
(`packages/runtime/src/objective.ts:283-298`), so with `preserved ⇄ degraded` both
reachable from standing predicates the state alternates with each ply, and a terminal
rule keyed on `from: "preserved"` then grades **the same loss differently depending on
whether the game ended on an odd or an even ply.** A grading spec whose verdict depends
on move parity is not a grading spec.

Two independent guards, both required, both tested:

1. **Degradation is one-way within a path.** For outcome objectives the compiler emits
   no `degraded → preserved` and no `* → active` rule; the closed `to` enum of §5 makes
   `active` unauthorable at the schema layer and §7 rejects a `degraded → preserved`
   condition at the validator layer. The reachable per-path graph is exactly
   `active → preserved → degraded → {achieved, failed}` with every edge forward-only, so
   each transition strictly increases rank, and **at most two non-absorbing transitions
   can ever occur on one path.** Termination is structural, not a matter of which
   predicates happen to be sticky.
2. **The resolution rule is edge-triggered.** It fires on `checkpointReachedHere`
   (§6) — a checkpoint occurrence *at the current node* — not on the historical,
   path-sticky `checkpointWasReached`. It therefore cannot re-fire on any later commit
   even if guard 1 were weakened by a future rule.

**Precedence when degradation and resolution fire on the same commit: degradation
wins.** `evaluateObjective` takes the first matching rule and performs at most one
transition per commit (`objective.ts:289-297`), so precedence is expressed as compiled
rule order (§7): outcome rules, then authored `to: "degraded"` conditions, then the
derived resolution, then everything else. Conceding on the very move that reaches the
resolution horizon is not resolving intact; and because the resolution is edge-triggered,
it does not come back on the next ply. The run ends `degraded`, which is what happened.
The checkpoint occurrence itself is still emitted and still rendered — the resolution
block keys off `checkpoint.reached` (`apps/web/src/lib/session-controller.ts:418-428`),
not off a transition — so the learner sees "you reached the end of the drill" and
"you conceded on the way" as two sentences, because they are two facts.

**`resist` never reads the latch.** Its success rule tests the *path* directly —
`all(outcomeReached(loss), checkpointReached(resolveAt.checkpointId))` — using the
historical predicate on purpose: at a terminal node the question is "did this path
include the resistance checkpoint", which is monotone along a path and therefore
parity-free. `preserved` is not consulted (§7, and criteria 1a and 1b).

**A run that simply stops is not graded.** There is no timeout, no abandonment
inference, no background pass. The objective state of the last node on the path is the
answer, `active` included, and `RunSummary.objectiveState`
(`apps/server/src/storage.ts:51-62`) already carries it into history. `active` renders as
"unresolved" (§9). Grading only ever happens inside `orchestratePackMove`, on a commit
(`apps/server/src/service.ts:254-259`, `:278-283`).

**Rewind un-resolves, per path.** Objective state lives on nodes: `commitMove` copies the
cursor node's state onto the new node (`packages/runtime/src/runtime.ts:332`) and
`objective.state_changed` projects onto one node
(`packages/runtime/src/events.ts:122-143`). Checkpoint re-firing is path-scoped too
(`reachedOnActivePath`, `apps/server/src/pack-orchestrator.ts:73-86`), so a fork below
the resolution node can resolve on its own. Each branch is graded on its own path and a
later failure never rewrites the `preserved` grade recorded at the resolution node. This
is what makes "rewind and try again" mean anything for an outcome drill, and it is tested
(criterion 9).

### 4. Pack format v0.3 — `objective.grading`

`schemas/drill_pack.schema.json` bumps `$id` to `urn:chess-tabiya:schema:drill-pack:0.3`
and `DRILL_PACK_SCHEMA_VERSION` to `"0.3"`
(`packages/schema/src/index.ts:2`, asserted at `packages/schema/src/drill-pack.test.ts:49-56`).
`digestDrillPack` digests the document, not the schema version
(`packages/schema/src/drill-pack/digest.ts:59-66`), so **no pack digest changes from the
bump** and no stored run is orphaned by it.

```jsonc
"objective": {
  "type": "hold",
  "summary": "…",
  "grading": {
    "assessedBy": {
      "kind": "authored",
      "note": "Eleven pieces are on the board. Syzygy tablebases stop at seven, so …"
    },
    "resolveAt": { "kind": "checkpoint", "checkpointId": "still-holding" }
  },
  "successConditions": [ /* §5 */ ]
}
```

`assessedBy` is a closed union:

```ts
type RootAssessment =
  | {
      readonly kind: "authored";
      /** Required. Pre-play framing, in the author's words. maxLength 400. */
      readonly note: string;
    }
  | {
      readonly kind: "syzygy";
      readonly category: "win" | "loss" | "draw";  // side-to-move perspective, verbatim
      readonly pieceCount: number;                 // 2..7
      readonly sourceId: "syzygy";
      readonly retrievedAt: string;                // ISO 8601, from the evidence ledger
    };
```

The `syzygy` variant is a **transcription of a `tablebase_result` record** the shipped
pipeline writes into `evidence.json` (`apps/server/src/sourcing/syzygy.ts:160-168`). By
itself it is an assertion by whoever typed it. §4d is what turns a transcription into a
ground, and nothing else in this RFC does.

Three schema tightenings ship with it, the first two closing D4-shaped divergence:

- `$defs.objective` currently has `"additionalProperties": true`
  (`schemas/drill_pack.schema.json:135-147`), so `grading` already validates today while
  meaning nothing. It becomes `false` with `type`, `summary`, `grading`,
  `successConditions` declared. All eight packs in the tree use only the first three
  keys, so nothing breaks.
- `successConditions.items` is `{"type": "object"}` — anything at all. It becomes the
  closed union of §5.
- `objective.grading` itself is `additionalProperties: false`, and **`grounding` is not
  an authorable key anywhere in the document.** It is derived at load (§4d); a pack that
  writes it fails schema validation, which is the mechanical half of "a pack cannot
  declare itself proved".

#### 4a. What the learner sees before the first move, and why it is safe

`GET /packs/:id` returns `projectPackDocument`
(`apps/server/src/pack-registry.ts:47-74`), which deliberately omits `feedbackClaims`,
`deviations`, `planClasses` and every other authored payload; the omission is asserted at
`apps/server/src/drill-client-server.test.ts:155`. This RFC adds **one key** to that
projection:

```jsonc
"objective": { "type": …, "summary": …, "grading": { "assessedBy": …, "resolveAt": …, "grounding": … } }
```

The safety argument is structural, not editorial. `objective.summary` is already
projected before the first move (`pack-registry.ts:60-63`) and already carries authored
framing — Pack C's summary says the ending "is held with accurate defence and lost
constantly in practice". `assessedBy.note` is the **same surface class**: prose an author
writes into the objective knowing it is shown before play, capped at 400 characters by
the schema, delivered by the same projection, with no anchor and no reveal condition.
`feedbackClaims` is a *different* surface class: prose the author anchors inside the
drill, released only after its anchor occurs, or withheld. Nothing moves between the
classes and no claim text is projected. `resolveAt.checkpointId` names a checkpoint whose
id and label are already in the projection (`pack-registry.ts:67-72`).

Consequently this RFC **does not** restore `feedbackClaims` to any response, does not add
a `feedback_claim` item kind to `apps/server/src/authored-feedback.ts:24-49`, and does not
touch the withholding barrier that `rfc/archive/authored-feedback-delivery.md` shipped.
Criterion 12 asserts the projection still has no `feedbackClaims` after the change.

#### 4b. The claim that had nowhere to go

Pack C already contains the exact sentence this surface needs — `no-tablebase-here`
(`content/drafts/rook-4v3-same-side.json:484-490`) — and it is displayed nowhere,
because an unanchored `feedbackClaims` entry has no delivery path at all
(out-of-scope table). §11 **moves** that entry, byte for byte, into
`objective.grading.assessedBy.note`. The text is unchanged, no new chess claim is made,
and the sentence finally reaches the screen at the only moment it is useful: before the
learner has played a move. That undeliverable-claims gap is a defect the implementer
should **propose as a BACKLOG row**; it is not fixed here and not worked around by
widening a projection.

#### 4c. Sidecar admission, part one: which `.json` files are packs

`grounding` needs a sidecar beside the pack, and today a sidecar beside a pack is a
startup crash. `jsonFiles` walks the loaded directories recursively and treats **every**
`.json` file as a pack document (`apps/server/src/pack-registry.ts:97-112`; the decision is
the single `extname(entry.name) === ".json"` test at `:109`), `loadDefault` parses all of
them (`pack-registry.ts:188-193`), and `validatedDocument` throws `PACK_INVALID` on the
first one that is not a pack (`pack-registry.ts:76-87`). An `evidence.json` next to a
`pack.json` inside a loaded directory therefore takes the server down at boot.

The emitted four-file layout works today **only because `content/candidates/` is not
loaded**: `loadDefault` reads `schemas/drill_pack.example.json`, `content/packs/**` and, in
development, `content/drafts/**` plus an optional `DRAFT_PACK_FILE`
(`pack-registry.ts:162-187`). That is an accident of directory choice, not a contract, and
§4d would turn it into a bug the moment a ledger lands beside a draft.

**So discovery gets an exclusion rule before any sidecar is allowed into a loaded
directory,** and it is a rule about *names*, because a rule about content would mean
parsing a file to decide whether it is allowed to fail parsing.

`SIDECAR_BASENAMES` is exported from `pack-registry.ts` as a frozen list of the four names
the sourcing pipelines write beside a pack — `evidence.json`, `sources.json`, `job.json`,
`priority.json` (`apps/server/src/sourcing/syzygy.ts:199-202`,
`apps/server/src/sourcing/openings.ts:155-158`,
`apps/server/src/sourcing/position-seeds.ts:264-267`,
`apps/server/src/sourcing/explorer.ts:199-202`). `jsonFiles` skips a file when its basename
**is** one of them or **ends with `.` + one of them** — the flat form,
`rook-4v3-same-side.evidence.json`. Nothing else is excluded: any other `.json` in a loaded
directory is still a pack and still fails startup if it is not one. The failure this rule
removes is "a sidecar was mistaken for a pack", not "a broken pack was tolerated".

Three consequences, stated so they are not discovered later:

- The four names are **reserved**. A pack may not be called `evidence.json`, and
  `pack-check` pointed straight at one reports `PACK_FILE_IS_RESERVED_SIDECAR_NAME`
  instead of a confusing schema failure.
- The same constant is the **resolver**: §4d looks for exactly the names discovery skips.
  One list with two consumers, asserted equal by test — two hand-maintained lists for one
  vocabulary is the D4 shape (`design/BACKLOG.md:117`) and is not being reintroduced.
- `content/candidates/` stays unloaded. This rule does not promote candidates; it makes
  their layout admissible, and it makes `content/drafts/` and `content/packs/` able to
  carry sidecars now, which is what a grounded pack needs.

Criterion 12a is the regression, and it is written against the crash: pointing the loader
at `content/candidates/` today throws `PACK_INVALID`, and after this rule it registers the
four candidate packs and ignores the fifteen sidecar files beside them.

#### 4d. Sidecar admission, part two: `grounding`

Any JSON file can contain a plausible category, piece count and timestamp. Checking that
those three agree with each other and with `start.fen` proves only that the forger can
count — and checking them against one record in a file nobody validated proves only that
the forger can also type `"kind": "tablebase_result"`. So:

**The words "Syzygy" and "exact" may appear in the product only for an assessment whose
`grounding` is `ledger_verified`, and `grounding` is computed at load from a structurally
valid, manifest-linked evidence ledger the pack does not write.**

`PackRegistry` resolves two sidecars beside the pack file using `SIDECAR_BASENAMES`:
`evidence.json` and `sources.json` in the same directory when the pack is `pack.json` (the
emitted candidate layout, e.g. `content/candidates/endgame-rook-4v3-same-side-root/`),
otherwise `<basename>.evidence.json` and `<basename>.sources.json` beside a flat pack file.
`loadDefault` already reads every pack by path (`pack-registry.ts:188-193`), so this is two
more optional `readFile`/`JSON.parse` calls there. The parsed sidecars reach the registry
as two optional fields on the existing document descriptor —
`fromDocuments(documents: readonly { source, value, ledger?, manifest? }[], options)`
(`pack-registry.ts:121-153`) — so every current caller compiles unchanged and a caller that
supplies documents without a filesystem source simply has none. Missing sidecars mean
`grounding: "unverified"`, never an error. `PackRecord` gains `assessmentGrounding`, and
`projectPackDocument` projects it.

`grounding` is `ledger_verified` only when **all three** of the following hold. The first
two are the ones that make the third mean anything.

**(1) The ledger is structurally valid.** It parses and `validateLedger`
(`apps/server/src/sourcing/check.ts:141-158`) reports no issue against it: schema tag
`tabiya.sourcing.evidence.v1`, ISO `sourcedAt`, `records[]` and `abstentions[]` present,
and *every* record carrying a known `kind`, an `anchor`, a non-empty `sourceId`, an ISO
`retrievedAt`, `grounds ∈ {citable_source, machine_validation}`, a `values` object and
non-empty `supports` pointers. One malformed record anywhere in the file disqualifies the
whole ledger, which is the point: a document that is partly invented is not a record.

**(2) The ledger is linked to a source manifest.** A manifest sidecar resolves,
`validateManifest` (`check.ts:105-127`) reports no issue against it, and
`linkage(manifest, ledger)` (`check.ts:159-181`) reports none either — so the tablebase
record's `sourceId` + `retrievedAt` names a manifest entry with a real origin and a
licence, no manifest entry is unreferenced, and `sourcedAt` is the derived maximum
`retrievedAt`. A ledger with no manifest beside it is unverified, however well-formed it
is. Verified by running the shipped check against a committed candidate:
`make sourcing-check DIR=content/candidates/endgame-rook-4v3-same-side-root` reports
"Sourcing check passed (strict)", so genuine pipeline output satisfies (1) and (2) by
construction and this requirement costs the pipeline nothing.

**No pack in the tree can satisfy (3) today, and that is expected.** All four committed
candidates are out of Syzygy range — the endgame one is the same 11-piece root as Pack C
and its ledger carries a `tablebase_result` **abstention**, not a record
(`content/candidates/endgame-rook-4v3-same-side-root/evidence.json`, verified). A ledger
that does carry the record is produced offline and deterministically by the shipped
emitter at seven pieces via `fixtureTablebaseQuery`
(`apps/server/src/sourcing/syzygy.ts:90`, driven at
`apps/server/src/sourcing/syzygy.test.ts:54-65`), and that is what the positive controls in
criteria 7b and 7c use. The first genuinely grounded pack is therefore content work, not a
code change — which is the honest state of B6b's tablebase half.

**(3) A single record in that ledger matches the assessment**, by strict equality on the
raw parsed values:

| Field | Must equal |
|---|---|
| `record.kind` | `"tablebase_result"` |
| `record.grounds` | `"machine_validation"` |
| `record.values.fen` | `document.start.fen` |
| `record.values.category` | `assessedBy.category` |
| `record.values.pieceCount` | `assessedBy.pieceCount` |
| `record.sourceId` | `assessedBy.sourceId` |
| `record.retrievedAt` | `assessedBy.retrievedAt` |
| `record.supports` | contains `"/start/fen"` |
| `ledger.packId` | `document.id` |

Every one of those is written by the shipped emitter in one object literal
(`apps/server/src/sourcing/syzygy.ts:160-168`), so a genuine pipeline output matches by
construction and a hand-typed one matches only if it is a faithful copy of a record
someone actually retrieved — inside a ledger that also passes (1) and a manifest that also
passes (2).

**`ledger.packDigest` is deliberately not in the list.** Requiring it would make every
legitimate authoring edit — including adding this very `grading` block — indistinguishable
from a forgery, since the digest is computed over the whole document. Digest drift is
already owned by the sourcing check as `EVIDENCE_DIGEST_STALE`, a warning at
`apps/server/src/sourcing/check.ts:363`. The linkage here binds the *position* to the
*retrieval*, which is what the tablebase fact is about.

**One predicate, two callers.** `validateLedger`, `validateManifest` and `linkage` are
already pure over an `issues` array — they read their inputs, push issues, and mutate
nothing else — so they **move verbatim**, bodies unchanged, from `check.ts` into a new
`apps/server/src/sourcing/ledger-validation.ts`, together with the `issue`, `object`,
`nonEmpty`, `validIso`, `exactKeys`, `validateOrigin` and `validateLicence` helpers they
call. `check.ts` imports them back, so `checkSourcingDirectory`'s issue output is
byte-identical and `apps/server/src/sourcing/sourcing.test.ts` is the regression that says
so. The new module also exports the predicate itself:

```ts
export function assessmentGrounding(input: {
  readonly document: DrillPackDefinition;
  readonly ledger: unknown;    // parsed evidence sidecar, or undefined
  readonly manifest: unknown;  // parsed manifest sidecar, or undefined
}): "ledger_verified" | "unverified";
```

It applies (1), (2) and (3) and is called by **both** `PackRegistry` at load and
`checkSourcingDirectory` at promotion, so load-time and promotion-time can never disagree
about what "verified" means. The module imports only `./types.js`, so `pack-registry.ts`
and `check.ts` can both depend on it without a cycle.

Two enforcement points, and they differ on purpose:

- **At load:** an unverified `syzygy` assessment is not an error. It degrades to the
  authored rendering (§9) and says so. A draft that is waiting for its ledger is a normal
  state of authoring, and refusing to load it would push authors to delete the field
  rather than ground it.
- **At promotion:** `checkSourcingDirectory` in strict mode — which is exactly
  `content/candidates/**` (`apps/server/src/sourcing/check.ts:318-321`) — raises
  `SYZYGY_ASSESSMENT_UNGROUNDED` as an **error** whenever a pack declares a `syzygy`
  assessment for which `assessmentGrounding` returns `unverified`. Nothing ungrounded
  reaches `content/packs/`.

Criteria 7b and 7c are the two regressions: 7b that invented metadata cannot earn the
label, 7c that a byte-perfect record inside an invalid or unlinked ledger cannot either.

### 5. `successConditions` v0.3 — the widening

```ts
type ObjectiveState = "active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type AuthorableTarget = "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type NonTerminalState = "active" | "preserved" | "degraded";

interface SuccessConditionBase {
  /** Target state. Default "achieved". `active` is not authorable. */
  readonly to?: AuthorableTarget;
  /** Source states. Default: the compiled default below. */
  readonly from?: readonly NonTerminalState[];
}

type SuccessCondition =
  | (SuccessConditionBase & { readonly kind: "reach_checkpoint"; readonly checkpointId: string })
  | (SuccessConditionBase & { readonly kind: "outcome"; readonly result: "win" | "loss" | "draw" })
  | (SuccessConditionBase & {
      readonly kind: "material_balance";
      readonly perspective: "white" | "black";
      readonly comparison: "atLeast" | "atMost" | "equal";
      readonly value: number;
    })
  | (SuccessConditionBase & {
      readonly kind: "rules_fact";
      readonly fact: "checkmate" | "stalemate";
      readonly winner?: "white" | "black";
    });
```

Each maps onto a shipped `ObjectivePredicate` (`packages/runtime/src/objective.ts:60-69`)
except `outcome`, which needs §6. Evidence references are fixed per kind and never
authored free-form:

| kind | evidence ref |
|---|---|
| `reach_checkpoint` | `pack:<checkpointId>` |
| `outcome` | `rules:result-win` / `rules:result-loss` / `rules:result-draw` (§9) |
| `material_balance` | `rules:material` |
| `rules_fact` | `rules:checkmate` / `rules:stalemate` |

**`rules_fact` has no `draw` case, and cannot get one.** The runtime's `rulesFact: draw`
resolves to `drawIsAvailable` (`packages/runtime/src/objective.ts:186-193`), which
collapses stalemate, insufficient material, the 50-move rule and threefold repetition into
one boolean — while the evidence vocabulary keeps them as four distinct facts,
`rules:draw-threefold`, `rules:draw-50move`, `rules:draw-insufficient` and
`rules:stalemate` (`packages/runtime/src/evidence-ref.ts:1-8`), each with its own fixed
sentence (`apps/web/src/lib/evidence-sentences.ts:19-26`). A condition that fires on the
union cannot say which of the four occurred, so it cannot produce the reference it would
have to carry, and `assertObjectiveTransition` requires a non-empty reference on every
transition (`packages/runtime/src/objective-state.ts:47-49`). That is the same "an
evidence ref that does not identify its fact" ambiguity `rfc/archive/explanation-grounds.md`
removed from objective grounding, and it is not being reintroduced through a pack field.
The runtime predicate is left untouched and simply has no encoding in v0.3; splitting it
into four mechanically distinguishable facts is a BACKLOG row to propose, with a real
authored consumer, not a widening done on speculation here.

**Compiled defaults, and why they are not symmetric.** `ALLOWED_TRANSITIONS`
(`packages/runtime/src/objective-state.ts:3-10`) does not list any state as a successor of
itself, so `assertObjectiveTransition` throws `ObjectiveTransitionError` on a
self-transition (`objective-state.ts:44-46`) — and once a rule matches,
`evaluateObjective` reaches it unconditionally through `transitionObjective`
(`packages/runtime/src/objective.ts:296` → `:239`), as does replay
(`packages/runtime/src/events.ts:130-134`). A condition that keeps matching after it has
fired would therefore throw on the next commit and take the run down. So `from` is
compiled, never left implicit:

| `to` | default `from` (outcome objectives) | default `from` (other types) |
|---|---|---|
| `preserved` | `["active"]` — §3a guard 1 | `["active", "degraded"]` |
| `degraded` | `["active", "preserved"]` | `["active", "preserved"]` |
| `achieved` / `failed` / `transitioned` | `["active", "preserved", "degraded"]` | `["active", "preserved", "degraded"]` |

An explicit `from` that contains `to` is a load error, and on an outcome objective an
explicit `from` containing `degraded` for `to: "preserved"` is a load error (§7).

**Which layer enforces what matters, because they do not both run.**
`validatePackDocument` returns immediately on a JSON Schema failure and never reaches the
runtime checks (`apps/server/src/pack-validation.ts:182-189`). So each rule is stated in
exactly one layer: the closed enums above — `to` excluding `active`, `from` restricted to
the three non-terminal states, `rules_fact.fact` without `draw` — are enforced by the
schema and reported as `SCHEMA_ENUM`, and §7's runtime codes cover only the cross-field
rules the schema cannot express (they depend on `objective.type`, on `start.fen`, or on
another field's value). No rule is claimed twice, so no test can pass against a code the
validator can never emit.

### 6. Runtime: two predicates and one derivation

`ObjectivePredicate` gains exactly two members:

```ts
| { readonly type: "outcomeReached"; readonly result: "win" | "loss" | "draw" }
| { readonly type: "checkpointReachedHere"; readonly checkpointId: string }
```

```ts
case "outcomeReached": {
  const pathNodeIds = new Set(pathToNode(run, node).map((pathNode) => pathNode.id));
  return run.events.some(
    (event) =>
      event.type === "outcome.reached" &&
      event.data.outcome === predicate.result &&
      pathNodeIds.has(event.data.nodeId),
  );
}
case "checkpointReachedHere":
  return run.events.some(
    (event) =>
      event.type === "checkpoint.reached" &&
      event.data.checkpointId === predicate.checkpointId &&
      event.data.nodeId === node.id,
  );
```

**Path scoping is the whole correctness of `outcomeReached`.** `run.events` is global: a
branch that ended in mate leaves its `outcome.reached` in the log forever, so an unscoped
predicate would grade every later branch by the first branch's result. The implementation
mirrors `checkpointWasReached` (`objective.ts:176-184`) exactly, and criterion 5 tests it
directly. It reads events that `commitMove` has already appended by the time
`orchestratePackMove` runs (`runtime.ts:338-343`, `service.ts:254-259`), so no ordering
change is needed.

**`checkpointReachedHere` is the edge trigger of §3a guard 2.** `node` is the active
cursor node, and `orchestratePackMove` emits `checkpoint.reached` before evaluating
objective rules in the same call (`pack-orchestrator.ts:126-134`), so the predicate is
true on exactly the commit at which the checkpoint fires and false on every later commit
of that path. Node identity is path identity, so no separate scoping is required.

Both are engine-free and deterministic, so `docs/branch-runtime.md:117` stays true.

#### 6a. `resistanceOnPath` — and why it may not key on the selection's own `nodeId`

**`resistanceOnPath(run, nodeId)`** is added beside them, and its path scoping is the part
that has to be right, because the obvious implementation is wrong.

`opponent.move_selected.data.nodeId` is the **parent** — the cursor *before* the reply.
`commitMove` fills it from `run.activeCursor.nodeId`
(`packages/runtime/src/runtime.ts:301-316`, the field at `:307`) and only then creates the
child node (`runtime.ts:321-336`). A learner who rewinds to that parent and forks gets a
second reply from the *same* parent, so several selections on different branches carry the
same `data.nodeId`. Filtering selections by `nodeId ∈ path` therefore reports engines that
never played a move on this path — and under `theory_strict` sampling or a changed engine
build, siblings genuinely differ. The grade would name an opponent the learner never faced.

Identity comes from the **committed child** instead:

- `commitMove` appends `opponent.move_selected` (`runtime.ts:301-316`) and then the
  `move.committed` carrying the new node (`:338-343`), with only local `san`/`fen`/node
  construction between them (`:318-337`) and no intervening event append. The pair
  is adjacent by construction, and adjacency is already a **shipped, enforced invariant**:
  `readBackReplay` rejects a selection not immediately followed by a `move.committed`, an
  opponent commit with no preceding selection, and a pair disagreeing on parent, branch or
  move (`packages/runtime/src/replay.ts:31-59` and `:61-77`). It is documented as a
  contract at `docs/branch-runtime.md:152-156` and `docs/engine-workers.md:135-138`. This
  RFC adds no invariant here; it consumes one.
- The pairing loop of `readBackReplay` (`replay.ts:65-75`) is extracted unchanged as
  `opponentMovesFromEvents(events)`, and `readBackReplay` calls it — one pairing
  implementation, not two. `OpponentMoveReadback` (`replay.ts:18-24`) already carries
  `parentNodeId` and `committedNodeId`; it gains
  `readonly engine: SelectionEngineIdentity` copied from `selection.data.selection.engine`.
  Nothing persisted changes: this is a derived read-back shape, not an event shape.
- `resistanceOnPath` keeps a paired move **only when its `committedNodeId` is in
  `historyFrom(run, nodeId)`** — the exported root-to-node walk already used for this
  purpose (`packages/runtime/src/runtime.ts:471-479`) — and **never** its `parentNodeId`. A
  sibling's reply commits to a different child node, so it is excluded structurally rather
  than by a heuristic, and criterion 11a asserts exactly this against the shape that fails.
  A rewind that leaves a node off the active path removes its reply from the derivation for
  free, because the node is no longer in the walk.

It returns the run's requested `RunOpponentPolicy` (`packages/runtime/src/types.ts:225`)
and the distinct `SelectionEngineIdentity` values (`types.ts:63-69`) found on the path,
each with a ply count. It computes no chess, grades nothing, and — critically — infers no
policy: §8a is mostly about what may not be said from it.

### 7. Rule compilation and validation

`objectiveRules(pack)` (`apps/server/src/pack-orchestrator.ts:102-117`) is replaced. For
`objective.type ∈ {win, hold, save, resist}` it emits rules in the order below.
`evaluateObjective` takes the first rule whose `from` matches the current state and whose
predicate holds (`packages/runtime/src/objective.ts:289-297`) and performs at most one
transition per commit, **so this order is the precedence rule of §3a**.

For `win`, `hold`, `save` — floor `win` for `win`, `draw` for `hold` and `save`:

| # | `when` | `from` | `to` |
|---|---|---|---|
| 1 | `outcomeReached(win)` | active, preserved, degraded | `achieved` |
| 2 | `outcomeReached(draw)` | active, preserved, degraded | `achieved` if floor is `draw`, else `failed` |
| 3 | `outcomeReached(loss)` | active, preserved, degraded | `failed` |
| 4 | authored conditions with `to: "degraded"`, in authored order | per §5 | `degraded` |
| 5 | `checkpointReachedHere(resolveAt.checkpointId)` | **active** | `preserved` |
| 6 | remaining authored conditions, in authored order | per §5 | per §5 |

For `resist`:

| # | `when` | `from` | `to` |
|---|---|---|---|
| 1 | `outcomeReached(win)` | active, preserved, degraded | `achieved` |
| 2 | `outcomeReached(draw)` | active, preserved, degraded | `achieved` |
| 3 | `all(outcomeReached(loss), checkpointReached(resolveAt.checkpointId))` | active, preserved, degraded | `achieved` |
| 4 | `outcomeReached(loss)` | active, preserved, degraded | `failed` |
| 5 | authored conditions with `to: "degraded"` | per §5 | `degraded` |
| 6 | `checkpointReachedHere(resolveAt.checkpointId)` | **active** | `preserved` |
| 7 | remaining authored conditions | per §5 | per §5 |

Row 3 is the single row where losing is success, and it is written as a conjunction over
the *path* rather than as a source state: you reached the resistance checkpoint on the way
here, and then the position did what it was declared to do. Whether the objective happened
to be sitting in `preserved` or `degraded` when the mate landed — and therefore what the
ply count was — cannot change the verdict. The degradation rows can still record that the
defence conceded something; they change the sentence, not the grade. The resolution row is
why `resist` requires a checkpoint resolution.

The resolution row — row 5 for `win`/`hold`/`save`, row 6 for `resist` — is omitted when
`resolveAt.kind === "terminal"`, which `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` forbids on
`resist`.

For the other six objective types nothing is derived; rules come from
`successConditions` alone, exactly as today except that `to` and `from` are now
expressible. `objective.grading` on those types is a load error.

New `pack-validation.ts` runtime issues, all `severity: "error"`:

| Code | Rule |
|---|---|
| `OBJECTIVE_GRADING_REQUIRED` | `type ∈ {win,hold,save,resist}` without `objective.grading` |
| `OBJECTIVE_GRADING_UNSUPPORTED` | `objective.grading` on any other type |
| `OBJECTIVE_RESOLUTION_UNKNOWN` | `resolveAt.checkpointId` is not a checkpoint in this pack |
| `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` | `type: "resist"` with `resolveAt.kind: "terminal"` |
| `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` | a `successConditions` entry with `to ∈ {achieved, failed, transitioned}` whose `kind` is not `outcome`, **when `type ∈ {win,hold,save,resist}`** — the D12b law, scoped per §3 |
| `OBJECTIVE_OUTCOME_TARGET_INVALID` | an `outcome` condition on an outcome objective whose `to` is not `achieved` or `failed` |
| `OBJECTIVE_DEGRADED_IS_ONE_WAY` | on an outcome objective, a condition with `to: "preserved"` whose explicit `from` names `degraded` — §3a guard 1 |
| `OBJECTIVE_SELF_TRANSITION` | an explicit `from` containing `to` |
| `SYZYGY_ASSESSMENT_OUT_OF_RANGE` | `assessedBy.kind: "syzygy"` with `countFenPieces(start.fen) > 7`, or a `pieceCount` disagreeing with the FEN. `countFenPieces` is exported at `apps/server/src/sourcing/syzygy.ts:51-53` |
| `SYZYGY_ASSESSMENT_MISMATCH` | the category, flipped to the learner's perspective when `start.side` is not the FEN's side to move, does not match the type: `win`→`win`, `hold`→`draw`, `save`→`loss`, `resist`→`loss`. Categories outside `win\|loss\|draw` — `cursed-win`, `blessed-loss`, `maybe-*`, `unknown` — are rejected, because they encode 50-move-rule subtleties this product does not model and guessing at them would manufacture a chess claim |
| `CHECKPOINT_TRUE_AT_ROOT` | D12a — see below |
| `CHECKPOINT_UNREACHABLE_AT_ROOT` | D12a — see below |
| `START_POSITION_UNRUNNABLE` | the root run cannot be constructed at all — see below |

Note the `save` row: an author who declares `save` at ≤7 pieces is declaring the root
**lost by tablebase and savable in practice**, which is exactly what `design/01` means by
"start objectively worse". `hold` at ≤7 must be a tablebase draw. This is the one place
where the hold/save distinction becomes machine-checkable, and it is checkable only
because a tablebase covered it — and, per §4d, only says "exact" when a ledger record
backs it.

#### 7a. D12a becomes an error, and is checked with the orchestrator's own code

The root-truth check moves out of the lint package and into `runtimeIssues`
(`apps/server/src/pack-validation.ts:74-180`) for two reasons: `packages/schema` has no
material vocabulary (duplicating `MATERIAL_VALUES` there is a fresh D4), and the server
can call the shipped orchestrator directly. The check builds the run the pack would
actually start — `createRun` (`packages/runtime/src/runtime.ts:144`) with the pack's own
`start`, seed 0, `seedMode: "fixed"` and an all-zero synthetic session digest, and
placeholder policies — and asks `checkpointMatches`
(`apps/server/src/pack-orchestrator.ts:61-71`, exported by this RFC) whether each
checkpoint fires there. The placeholders are safe because `checkpointMatches` reads only
`node.ply`, the spine and the node FEN (`pack-orchestrator.ts:39-71`); using the pack's
own policies would make this check depend on values it is not testing, including ones
another rule in the same pass is about to reject.

- **`CHECKPOINT_TRUE_AT_ROOT`, error** — a `materialBalance` or `fenPredicate` trigger
  that already holds at the root. It is not inert: orchestration runs on the first commit
  (`service.ts:254-259`), so the checkpoint fires at ply 1 no matter what anyone plays,
  which is never what a checkpoint means. `design/BACKLOG.md:121` states the rule as
  "always an authoring error"; a warning leaves `pack-check` exiting 0
  (`apps/server/src/pack-check.ts:73-83`) and Pack C green, which is how D12 shipped.
  Error severity makes `validatePackDocument` return `valid: false`
  (`pack-validation.ts:205`), which fails `pack-check` and refuses the pack at load
  (`pack-registry.ts:76-87`).
- **`CHECKPOINT_UNREACHABLE_AT_ROOT`, error** — `atPly: 0`. Orchestration only ever runs
  after a commit (`service.ts:254-259`, `:278-283`) and every committed node has
  `ply ≥ 1` (`runtime.ts:328`), so an `atPly: 0` checkpoint can never fire. It is a
  distinct defect from the one above — unreachable rather than always-reached — and gets
  its own code and message.
- **Timing windows are covered for free**, because `checkpointMatches` evaluates
  `trigger.windowCloses` for a `windowOpens` trigger (`pack-orchestrator.ts:66-70`). The
  check inherits that instead of restating it, so a window whose close condition is true
  at the root is caught by the same code path that would have fired it.
- **`START_POSITION_UNRUNNABLE`, error** — `createRun` throws (non-canonical FEN,
  terminal start position). A pack whose root cannot start a run is broken, and the
  validator says so with the runtime's own message rather than crashing.

Blast radius, verified across every pack in the tree: only Pack C's `still-holding`
matches at the root, and no pack uses `atPly: 0` or a `windowCloses` that is true at the
root. §11 fixes Pack C in the same change.

### 8. Resistance policies, D8, and naming which engine actually played

`design/03-product-breadth.md:48-50` names perfect / strong / practical / annoying /
fallible. Verified in the tree today:

| Design name | Encoding | State |
|---|---|---|
| strong | `strong_engine` | ships — Stockfish (`apps/server/src/opponent-selector.ts:437-450`) |
| practical | `human_common` | ships — Maia at `targetElo` (`opponent-selector.ts:428-435`) |
| theory | `theory_strict` | ships (`opponent-selector.ts:453-486`) |
| perfect | `perfect_tablebase` | **unencodable.** Passes the JSON Schema (`schemas/drill_pack.schema.json:355-363`), rejected by `pack-validation.ts:125-138` against `SUPPORTED_POLICY_MODES` (`apps/server/src/capabilities.ts:10-14`), and absent from `#selectUncached` (`opponent-selector.ts:388-399`). D8 |
| — | `plan_defense`, `practical_resistance`, `human_external` | same divergence, three more values: in the schema enum (`drill_pack.schema.json:355-363`), in no validator, in no selector, and in no design name |
| annoying, fallible | — | no schema value, no mode, no design encoding |

**This RFC ships only the three that exist, and does not fix D8's capability half.** It
closes D8's *drift* half, which is inside its scope and costs ~20 lines:

`capabilities.ts` gains an exported `DECLARED_UNIMPLEMENTED_POLICY_MODES` — a frozen list
of `{mode, reason}` covering all four unimplemented enum values, not just the one the
design names — and a test asserts that the JSON Schema's `opponentPolicy.mode` enum
equals `SUPPORTED_POLICY_MODES ∪ DECLARED_UNIMPLEMENTED_POLICY_MODES` exactly. The
`UNSUPPORTED_OPPONENT_POLICY` message quotes the reason. A silent divergence becomes a
tested, documented one, and the next value added to either list fails the build instead
of drifting. `immediate_blunder_guard` gets the same treatment on the feedback-policy
enum (`drill_pack.schema.json:50-55`), since it is the other half of D8.

#### 8a. Two facts about the opponent, and the one the product does not have

A grade delivered without naming the resistance it was earned against says nothing, so
every rendered grade carries a resistance line. Exactly two facts are available to write
that line, and they are not the same fact.

**The request.** `run.opponentPolicy` (`packages/runtime/src/types.ts:225`, projected at
`packages/runtime/src/events.ts:203`) carries the mode and target rating copied from the
**pack's authored** `opponentPolicy` at run creation (`apps/server/src/service.ts:187-213`).
It is a request recorded once, not a record of what happened.

**The engine.** `opponent.move_selected.selection.engine` — `SelectionEngineIdentity` with
`id`, `name`, `version`, optional `modelId` and `containerDigest`, and `seedHonored`
(`packages/runtime/src/types.ts:63-69`, event at `:137-145`) — records which engine binary
produced each individual reply. It is authoritative, it is per-ply, and the client already
holds it, since `RunStateStore` projects the full event log locally
(`apps/web/src/lib/run-state.ts:86`, `:113`). `resistanceOnPath` (§6a) derives from it.

**Nothing persisted records which policy produced a move.** This is an epistemic gap, not
a plumbing one, and engine identity cannot close it:

- `theory_strict` falls back to `human_common` whenever the position leaves the authored
  spine (`apps/server/src/opponent-selector.ts:453-460`), and the fallback re-enters the
  *same* `#maia` call against the *same* `maiaEngineId`
  (`opponent-selector.ts:428-435`, `:401-426`). Both policies therefore stamp an
  **identical** engine identity, so no reader of the log can tell a theory-strict reply
  from its fallback, or from a plain `human_common` reply.
- The client downgrades the requested mode against `GET /capabilities` before every
  selection (`apps/web/src/lib/session-controller.ts:116-134`, used at `:391`), and that
  per-move mode is never written to the run at all.
- With `ENGINE_MODE=mock` — the default, and what Playwright uses — every mode is executed
  by `MockEngineClient`, identity `mock-opponent` / "Deterministic mock opponent"
  (`apps/server/src/application.ts:119-126`), wired in as both `maiaEngineId` and
  `strongEngineId` (`application.ts:293-296`). The engine identity is honest here; the
  policy is simply not represented anywhere.

**So the product does not know which policy produced any move, and this RFC says so rather
than guessing.** The resistance line states the request as a request and the engine as an
engine, and asserts no relationship between them. Deriving "the policy was `human_common`"
from "the engine was Maia" would be manufacturing a fact the system does not hold; law 8
of `AGENTS.md` governs claims about this product's own opponent exactly as it governs
claims about chess.

The line obeys five rules:

1. **The request is stated first and labelled as a request.** "Requested resistance:
   `human_common`, target Elo 1900 — the pack's request."
2. **Before any opponent move on the path** — `resistanceOnPath` returns no identities —
   the line adds "No opponent move has been played yet." and stops. It must not name an
   engine, a model or a strength that has not played.
3. **One identity on the path** — name it from the record, as an engine and nothing more:
   "Moves played by Deterministic mock opponent (`mock-opponent` v1)." or "Moves played by
   Maia3 (`maia-5m`, model …)." Under the mock this reads *mock*, in the browser test as
   much as anywhere else.
4. **More than one identity** — list each with its ply count and add "This path faced more
   than one engine." Selection failures are not inferred: a ply with no paired selection is
   a ply that was never played, and the line counts what is recorded rather than guessing
   at what failed.
5. **Whenever an engine is named, this sentence is printed verbatim and cannot be
   suppressed:** "The run records which engine played, not which policy it applied, so this
   names the engine, not proof that the requested policy produced these moves."

While `perfect_tablebase` is unimplemented (§8) every rendered grade ends "Not perfect
play." A `hold` graded `preserved` against Maia 1900 must never read as a hold against best
play, and a `hold` graded against a deterministic mock must never read as a hold against
Maia.

**The future path, named and refused here.** The report this cannot produce — "you
requested `theory_strict` and got the fallback for nine of these plies" — becomes possible
only by persisting the applied mode and the fallback reason on the selection itself.
`opponentSelection` is `additionalProperties: false`
(`schemas/drill_run.schema.json:128-141`), so that is a run-schema change, a
`DRILL_RUN_SCHEMA_VERSION` bump (`packages/schema/src/index.ts:1`) and a migration-register
row — precisely the scope §12 claims not to touch, and a change whose blast radius is every
stored run rather than this RFC's grading surface. It is the right eventual fix and it is
not made here: the implementer **proposes it as a BACKLOG row**, and this RFC ships the
honest rendering of what is recorded today.

### 9. The honesty boundary — what is gradable at what material count

| Material | Result grading | Root assessment | What the product says |
|---|---|---|---|
| any | **exact** — laws of chess, from `outcome.reached` | — | "The game ended drawn." |
| ≤7 pieces | exact | **exact**, if the pack's `syzygy` assessment is `ledger_verified` (§4d) | "Starting position: draw — Syzygy tablebase, 6 pieces, exact." |
| ≤7 pieces, assessment not ledger-verified | exact | authored claim | as below |
| >7 pieces | exact | **no shipped exact oracle covers it** — Syzygy stops at 7 and this product ships no other result oracle | "Starting position: the author claims this is drawn. No tablebase covers 11 pieces, so this is a claim, not a proof." |

Note what is *not* in the ≤7 row: per-node grading. Even at six pieces this RFC cannot
say "you are still holding at move 20", because that needs a runtime probe that does not
exist (out-of-scope table). Exactness at ≤7 buys the **root claim**, not a running
verdict.

Five rendering laws, each with a test:

1. **`preserved` is never rendered as a result.** Its sentence is
   "You reached *{checkpoint label}* without conceding the result. That is the end of
   this drill, not a proof of the position." The strings "draw", "held", "you drew" and
   "you won" are forbidden in the `preserved` presentation, asserted by test.
2. **`degraded` is never rendered as a result either.** Its sentence names the
   resolution when one occurred and the concession always: "You reached *{checkpoint
   label}*, but the objective had already been degraded on this path. That is a grade of
   this attempt, not a verdict on the position." Same forbidden strings.
3. **An `authored` assessment always renders its unproved marker**, prefixed
   "Root assessment (authored, unproved):" and followed by `assessedBy.note` verbatim.
4. **A `syzygy` assessment renders as exact only when `grounding` is `ledger_verified`.**
   Verified: "Root assessment: {category} — Syzygy tablebase, {pieceCount} pieces,
   retrieved {retrievedAt}. Exact." Unverified: law 3's "Root assessment (authored,
   unproved):" marker followed by the fixed sentence "A tablebase result is declared but
   no matching evidence record backs it, so it is shown as a claim." — the unverified
   variant has no `note` to render, and the strings "Syzygy" and "exact" are forbidden in
   that presentation, asserted by test.
5. **`active` renders as "unresolved"**, not as a neutral chip. A run that stopped has no
   grade and must say so.

Surfaces, all shipped and only extended:

- `projectPackDocument` (`apps/server/src/pack-registry.ts:47-74`) adds
  `objective.grading` with its derived `grounding`, and nothing else — §4a.
- `RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-8`) gains
  `result-win`, `result-loss`, `result-draw`. `RULES_SENTENCES` is typed
  `Record<RulesEvidenceFact, string>` (`apps/web/src/lib/evidence-sentences.ts:19-26`), so
  TypeScript forces the sentences to be added in the same change — the anti-D4 property,
  and the reason this widening is safe where a free-form string would not be.
  `docs/explanation-grounds.md:151-153` says no new sentence vocabulary was added for
  the compare feature; this RFC adds three, and they are rules facts — the result of a
  terminal position under the laws of chess — not strategic explanations.
- `WhyBanner` (`apps/web/src/lib/WhyBanner.svelte:11-21`) gains the assessment and
  resistance lines above its existing sentences.
- `CheckpointSheet` (`apps/web/src/lib/CheckpointSheet.svelte:8-16`) gains an optional
  resolution block, shown when the checkpoint that fired is the objective's `resolveAt`
  checkpoint — keyed on the checkpoint occurrence, not on a transition (§3a), so it
  appears even when the same commit graded `degraded`. The resolution is presented, not
  slipped past: the sheet already opens on every checkpoint via `#captureCheckpoint`
  (`apps/web/src/lib/session-controller.ts:418-428`), and Continue still continues,
  because neither `preserved` nor `degraded` stops play.
- `TerminalSheet` (`apps/web/src/lib/TerminalSheet.svelte:23-27`) shows the *result*
  ("You lost."). It gains the *grade* beneath it — "Objective: hold — failed" — plus the
  assessment and resistance lines. Result and grade are different sentences and are
  rendered as different sentences.

### 10. D13 — the zero-length segment

`reachCheckpoint` emits `segment.completed` whenever a previous checkpoint exists on the
branch, without comparing node ids (`packages/runtime/src/runtime.ts:448-466`). Two
checkpoints on one node produce a segment of length zero, which under `segment_end`
discloses feedback (`apps/server/src/authored-feedback.ts:190-218`). Fix: skip the
`segment.completed` append when `previous.data.nodeId === run.activeCursor.nodeId`. Three
lines, and it is on this RFC's path because outcome packs carry several checkpoints whose
triggers can coincide — Pack C emitted exactly this on ply 1.

### 11. Pack C is the fixture

`content/drafts/rook-4v3-same-side.json` becomes the executable fixture for B2's Outcome
Drill row. Changes are mechanical and make **no new chess claim**:

- `version` `0.1.0` → `0.2.0`.
- `still-holding`'s trigger becomes `{"atPly": 8}` — the pack's own
  `authoredBoundary.plyHorizon` and `difficulty.branchLengthTarget`
  (`content/drafts/rook-4v3-same-side.json:11,365`), so the grading horizon equals the
  authored support rather than running eight plies past it. The
  `materialBalance{atLeast: -1}` it used is deleted as a *trigger* and returns as a
  `degraded` condition at `{atMost: -2}`, which is false at the root and true only once a
  second pawn is gone.
- `still-holding`'s label becomes "The end of the authored defence" — the current label,
  "Still only a pawn down", described the material trigger being removed, and the label is
  what the `preserved` sentence renders (`apps/web/src/lib/evidence-sentences.ts:44-53`,
  §9 law 1). A label that describes a trigger the checkpoint no longer has would put a
  material claim into a sentence about a ply count. The new label states only what fired.
- The `no-tablebase-here` entry is removed from `feedbackClaims`
  (`rook-4v3-same-side.json:484-490`) and its text becomes
  `objective.grading.assessedBy.note`, byte for byte (§4b). One sentence, one home, and
  it is finally delivered.
- `objective` becomes:

```jsonc
"objective": {
  "type": "hold",
  "summary": "…unchanged…",
  "grading": {
    "assessedBy": {
      "kind": "authored",
      "note": "Eleven pieces are on the board. Syzygy tablebases stop at seven, so no position in this drill has exact ground truth behind it — every judgment you are shown here was authored, not proved."
    },
    "resolveAt": { "kind": "checkpoint", "checkpointId": "still-holding" }
  },
  "successConditions": [
    { "kind": "material_balance", "perspective": "black", "comparison": "atMost",
      "value": -2, "to": "degraded" }
  ]
}
```

- The stale graduation blocker at line 539 ("the `still-holding` checkpoint uses a
  materialBalance trigger whose runtime behaviour the author did not verify") is replaced
  with the verified finding, and the standing warning at line 526 keeps its tablebase
  sentence while its "Do not publish until the objective encoding lands" clause — which
  this RFC satisfies — is removed. The pack keeps `reviewStatus: "draft"`. None of the
  other blockers are touched: no engine pass has been run, no endgame reference has been
  cited, and this RFC does not pretend otherwise.

**`opponentPolicy` is not changed.** Pack C stays `human_common` at Elo 1900. Switching
it to `theory_strict` would make the drill deterministic and therefore easy to drive move
by move in a browser, and that is exactly why it is refused: which resistance a defence
drill should face is an authoring decision with chess content in it, and a test's
convenience is not a reason to make it. The consequence is stated plainly in the
acceptance criteria — Pack C carries the complete fixture run at the service layer, where
legal replies can be computed, and carries the pre-play surface in the browser, while the
move-by-move browser assertions run against purpose-built `theory_strict` fixtures
(criteria 4 and 14–16).

**Editing the pack changes its digest**, and `#registeredPack` returns `undefined` when a
stored run's `packDigest` no longer matches (`apps/server/src/service.ts:621-625`), which
makes `/runs/:id/authored-feedback` raise `PACK_NOT_FOUND` (`service.ts:452-457`) for runs
started against 0.1.0. Drafts load only in development
(`apps/server/src/pack-registry.ts:171-181`, guarded again at
`apps/server/src/main.ts:19-20`) and the pack is unplayable today, so the real population
is developer test runs. Stated rather than migrated, consistent with
`rfc/archive/terminal-outcome-events.md` §5.

### 12. No migration

No persisted run shape changes. `objective.state_changed` already carries `from`, `to`
and `evidenceRefs` (`schemas/drill_run.schema.json:418-433`), its `evidenceRefs` items are
plain non-empty strings (`drill_run.schema.json:78-81`, so `rules:result-draw` needs no
schema change), and no event type is added. `DRILL_RUN_SCHEMA_VERSION` stays `"0.6"`
(`packages/schema/src/index.ts:1`) and this RFC claims **no row in the migration
register**. The pack-schema bump to 0.3 is not a persisted shape: pack digests are content
digests, unaffected by the `$id`.

Two additions deserve explicit clearing, because both look like persisted shapes and
neither is. `OpponentMoveReadback.engine` (§6a) is a field of a **derived read-back
struct** computed from events, not a stored one; `opponentSelection` in
`drill_run.schema.json:128-141` is untouched, which is exactly why §8a cannot report the
applied policy. `objective.grading.grounding` (§4d) is derived at load from files the pack
does not contain and never enters a run or a pack digest — a pack that writes it fails
schema validation (§4).

## Deviations from design

1. **`design/01-training-model.md:85-86` defines `save` as reaching "a draw **or real
   counterplay**".** Counterplay is not gradable without an evaluation, so this RFC
   grades `save` on the draw floor only. Authors who want the counterplay half express it
   as a `degraded` condition over material or an authored checkpoint.
2. **`design/01-training-model.md:87-88` defines `resist` as "maximize practical
   difficulty".** Maximization is not a predicate. This RFC grades `resist` on the other
   half of the same sentence — "reach resistance checkpoints" — and says so in the
   rendered grade rather than implying difficulty was measured.
3. **`design/03-product-breadth.md:48-50` names five resistance policies.** Three are
   encodable; `perfect_tablebase` is D8 and `annoying`/`fallible` have no encoding at
   all — and the schema names three further modes the design does not
   (`plan_defense`, `practical_resistance`, `human_external`). This RFC ships three,
   declares all four unimplemented ones, and makes the absence visible in every grade
   (§8) instead of silently narrowing the design. Closing the remaining gaps is a BACKLOG
   row to be proposed, not an edit this RFC makes to `design/`.
4. **The compiled state machine is narrower than the runtime's.**
   `ALLOWED_TRANSITIONS` permits `degraded → preserved` and `* → active`
   (`packages/runtime/src/objective-state.ts:3-10`); §3a forbids both for outcome
   objectives — `* → active` at the schema layer, `degraded → preserved` at the validator
   and in what the compiler emits. The runtime table is left alone because it
   also serves the other six objective types and `applyObjectiveEvidenceProposal`
   (`objective.ts:255-281`); narrowing it globally is a separate change with its own blast
   radius.
5. **The design assumes a grade knows the resistance it was graded against; the product
   knows the engine, not the policy.** `design/03-product-breadth.md:48-50` names the
   policies as properties of the drill, but nothing persisted distinguishes a
   `theory_strict` reply from its `human_common` fallback (§8a). This RFC renders the
   requested policy and the actual engine as two facts and makes no claim about the policy
   that ran — narrower than the design implies, and the only honest reading of what is
   recorded. Persisting the applied mode is the fix and is a BACKLOG row to propose.
6. **D12, D12a, D12b, D12c and D13 are ledgered defects** (`design/BACKLOG.md:120-124`),
   specified and closed here. Marking those rows closed, and adding the four rows this RFC
   asks for — undeliverable unanchored `feedbackClaims` (§4b), splitting
   `drawIsAvailable` into distinguishable facts (§5), persisting the applied opponent
   policy and its fallback reason (§8a), and the discovery/trust hole this RFC closes in
   the sourcing contract so it is ledgered as a found defect rather than only fixed
   (§4c) — are `design/` edits: the implementer **proposes them as BACKLOG rows** and does
   not write them (`AGENTS.md` law 5).

## Acceptance criteria

1. **The four objectives resolve as specified.** A table-driven runtime/orchestrator test
   asserts, for each of `win`, `hold`, `save`, `resist` crossed with `win`, `loss`, `draw`,
   the exact target state from §7's tables.
   - **1a. Post-checkpoint `resist` grading.** A `resist` pack whose resistance checkpoint
     fires at ply 2 and whose learner is mated at ply 11: `achieved`. The same fixture
     with the mate at ply 12: `achieved`. The same fixture with a `degraded` condition
     that fires at ply 6 before either mate: still `achieved` in both. The same fixture
     mated at ply 1, before the checkpoint: `failed`. **The grade is asserted to be
     identical across parities**, which is the property blocker 1 was about.
   - **1b.** The `resist` success rule is asserted to match with the objective in
     `degraded` as well as in `preserved`, proving it reads the path and not the state.
2. **No non-terminal condition reaches an absorbing state.** A pack with
   `type: "hold"` and `{"kind": "reach_checkpoint", "to": "achieved"}` fails load with
   `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`; the same condition under
   `type: "play_until_checkpoint"` still loads and still grades `achieved`. Both asserted,
   because the second is the compatibility half.
3. **State oscillation is impossible.** A `hold` fixture whose resolution checkpoint fires
   at ply 4 and whose `material_balance → degraded` condition is true from ply 6 onward is
   driven for 16 plies. Asserted: exactly two `objective.state_changed` events on the path
   (`active → preserved` at ply 4, `preserved → degraded` at ply 6), no event after ply 6,
   no `ObjectiveTransitionError`, and the final state identical whether the run is stopped
   at ply 15 or ply 16. A second case drives the same fixture with the degradation true
   from ply 2 and asserts the resolution at ply 4 emits **no** transition (`degraded`
   stands) while `checkpoint.reached` is still emitted — the precedence rule and the
   one-way law in one test.
4. **A complete fixture run.** Pack C v0.2.0 is played end to end, root to its
   `still-holding` checkpoint at ply 8, through the real `Service.move` /
   `Service.opponentPly` path against the mock engine, with learner replies chosen as the
   first legal move. Asserted: `still-holding` fires exactly once, at ply 8; the run is
   still playable afterwards (one further move commits, the D12b regression); no
   transition occurs before the ply at which the pack's own conditions first hold; and the
   whole event log survives a round-trip through `projectRun` with identical node states.
   The expected objective state at ply 8 — `preserved` when the recorded material balance
   never reached −2, `degraded` with the `pack:still-holding` occurrence still emitted
   when it did — is **computed by the test from the node FENs on the path**, not
   hardcoded, because the mock's replies are not this RFC's contract. Exact transition
   sequences are asserted on the constructed fixtures of criterion 3, where they are
   deterministic.
5. **Path scoping of `outcomeReached`.** A run whose branch A ended in checkmate, then
   rewound to a pre-mate node and forked: branch B's objective state is unaffected by
   branch A's `outcome.reached`, asserted on a `resist` pack where the difference decides
   `achieved` versus `active`.
6. **Self-transition and back-edges cannot be authored.** A condition with `from`
   containing `to` fails load with `OBJECTIVE_SELF_TRANSITION`; `to: "preserved"` with
   `from: ["degraded"]` on a `hold` pack fails with `OBJECTIVE_DEGRADED_IS_ONE_WAY`;
   `to: "active"` and a `from` naming `achieved` fail at the schema layer with
   `SCHEMA_ENUM`, asserted against the codes each layer actually emits (§5); and a
   compiled default `from` never contains `to`, asserted by driving the same condition
   twice across two commits and proving the second commit does not throw
   `ObjectiveTransitionError`.
7. **Syzygy assessments.**
   - **7a. Declaration checks.** A `hold` pack declaring `assessedBy.kind: "syzygy"` at 11
     pieces fails with `SYZYGY_ASSESSMENT_OUT_OF_RANGE`; a `hold` declaring
     `category: "win"` fails with `SYZYGY_ASSESSMENT_MISMATCH`; a `category: "cursed-win"`
     fails; and a `save` pack at 6 pieces with `category: "loss"` and `start.side` opposite
     the FEN's side to move **passes**, proving the perspective flip is applied and not
     merely described.
   - **7b. Forged metadata cannot earn the exact label.** A 6-piece `hold` pack with
     internally consistent but entirely invented `category`, `pieceCount`, `sourceId` and
     `retrievedAt` and **no** sibling ledger loads, and its projected
     `objective.grading.grounding` is `"unverified"`; the same pack beside a ledger whose
     `retrievedAt` differs by one character is also `"unverified"`; and the same pack
     beside a **real** emitter output — the seven-piece candidate produced offline by
     `emitSyzygyCandidates` with `fixtureTablebaseQuery`
     (`apps/server/src/sourcing/syzygy.test.ts:54-65`), ledger and manifest together — is
     `"ledger_verified"`. A component test
     asserts the unverified rendering contains neither "Syzygy" nor "exact", and a sourcing
     test asserts `checkSourcingDirectory` in strict mode raises
     `SYZYGY_ASSESSMENT_UNGROUNDED` for the forged pack and passes for the verified one —
     so `make sourcing-check DIR=<candidate>` (`Makefile:51-54`) exits non-zero on the
     forgery. Written as a regression naming the forgery so it cannot be relaxed silently.
   - **7c. A matching record inside an invalid or unlinked ledger stays unverified.** The
     named regression the third review asked for, run against a record that is a **byte-
     perfect** copy of the emitter's output, so the only variable is the file around it.
     Four cases, each asserted `grounding: "unverified"` at load *and*
     `SYZYGY_ASSESSMENT_UNGROUNDED` at error severity from `checkSourcingDirectory` in
     strict mode:
     (a) the ledger's `schema` is not `tabiya.sourcing.evidence.v1`;
     (b) the ledger is well-tagged but a **different** record in `records[]` is malformed
     (its `grounds` removed), so `validateLedger` reports an issue — the "one matching
     record earns exact" hole, closed;
     (c) no manifest sidecar is present beside the ledger;
     (d) a manifest is present but its entry's `retrievedAt` differs, so `linkage` raises
     `EVIDENCE_RETRIEVED_AT_MISMATCH`.
     The record is the *same bytes* in all four, so only the surrounding file varies.
     Positive control in the same test: the untouched seven-piece emitter output, whose
     `tablebase_result` record, ledger and manifest all come from the pipeline, verifies. A
     further test asserts load-time and promotion-time agree by calling
     `assessmentGrounding` and `checkSourcingDirectory` on all five fixtures and comparing
     verdicts, so the two callers cannot drift.
8. **D12a fails the build.** `make pack-check FILE=<fixture>` **exits non-zero** for
   (a) a pack whose `materialBalance` trigger is true at `start.fen`, (b) a pack with
   `atPly: 0`, and (c) a pack whose `windowCloses` condition is true at `start.fen` —
   asserted on the process exit code, not only on the issue list, because a warning that
   exits 0 is how D12 shipped. Pack C at v0.1.0 (inline fixture, so the assertion survives
   the file being fixed) produces `CHECKPOINT_TRUE_AT_ROOT`; Pack C at v0.2.0 does not,
   and the registry loads it.
9. **Rewind preserves the grade per path.** After resolution to `preserved`, the learner
   plays on and is checkmated: the terminal node is `failed`, the resolution node is still
   `preserved`, and rewinding to it restores a playable `preserved` cursor. Asserted on a
   constructed `hold` fixture where mate is reachable, not on Pack C.
10. **D13.** Two checkpoints firing on one node emit no `segment.completed`, and a
    `segment_end` pack in that shape does not disclose feedback at that node.
11. **Resistance identity is derived from selection events, per path.**
    - **11a. No sibling leakage.** The regression for §6a, written against the shape that
      fails. A run where the opponent replies from parent node P; the learner rewinds to P
      and forks; a second reply is appended from P carrying a **different**
      `SelectionEngineIdentity`. Both selections carry `data.nodeId === P`
      (`packages/runtime/src/runtime.ts:307`), so a
      parent-keyed filter returns two identities on either branch. Asserted:
      `resistanceOnPath` at branch B's leaf returns branch B's identity **only**, and at
      branch A's leaf returns branch A's only; the ply counts are 1 on each; and the test
      states in a comment that keying on `opponent.move_selected.data.nodeId` is what it
      exists to prevent, so it cannot be "simplified" back into the bug. A second case
      asserts that a selection whose paired `move.committed` was pruned from the path by a
      rewind contributes to neither branch.
    - **11b. Rendering: request, engine, and no policy claim.** With `ENGINE_MODE=mock`, a
      pack declaring `human_common` at Elo 1900 played several plies renders the request
      labelled as a request, the **mock** identity from
      `opponent.move_selected.selection.engine` — `mock-opponent` / "Deterministic mock
      opponent" — never the string "Maia", and §8a rule 5's disclaimer verbatim. Before the
      first opponent move the line is asserted to state the request, to say no opponent
      move has been played, and to name no engine. A synthetic path carrying two distinct
      identities lists both with ply counts and the "more than one engine" sentence. And a
      `theory_strict` pack driven off its authored spine, so the fallback at
      `opponent-selector.ts:453-460` fires, is asserted to render **exactly the same two
      facts** — request and engine — with no sentence claiming which policy produced the
      move, and no fabricated "actually played `human_common`". That last assertion is the
      mechanical form of §8a's epistemic claim.
12. **The honesty strings, and no leak.** A component test asserts the `preserved`
    presentation contains the checkpoint label and the "not a proof of the position"
    clause and contains none of `draw`, `held`, `you drew`, `you won`; that the `degraded`
    presentation obeys the same rule; that an `authored` assessment renders its `note`
    verbatim behind the unproved marker; that `active` renders "unresolved". A server test
    asserts `projectPackDocument` output has no `feedbackClaims` key and contains none of
    the pack's claim texts after `objective.grading` is added; the existing top-level
    key-set assertion (`apps/server/src/drill-client-server.test.ts:137-153`) is unchanged
    because no top-level key is added, and the `projected.objective` equality at `:158-160`
    is updated to the three-key objective of §4a.
    - **12a. Sidecars are not packs.** The regression for §4c, asserted through
      `PackRegistry.loadDefault` and not only through the `jsonFiles` helper, because the
      crash is at startup. A temporary drafts directory containing `pack.json`,
      `evidence.json`, `sources.json` and `job.json` contributes **exactly one** pack and
      does not throw; a flat layout of `x.json`, `x.evidence.json` and `x.sources.json`
      contributes exactly one; and
      `loadDefault({development: true, draftsDirectory: "content/candidates"})` — the tree
      as it stands: four candidate directories with three sidecars each, plus
      `content/candidates/priority/`, which has three sidecars and no pack — contributes
      **the four candidate packs** (five records in the registry, with
      `schemas/drill_pack.example.json`) instead of throwing `PACK_INVALID`, which is the
      crash this rule removes and which the same test asserts against the current code
      shape in a comment. A further test asserts `SIDECAR_BASENAMES` is the same constant
      the §4d resolver consults, so discovery and resolution cannot name different files.
13. **Policy-mode single source of truth.** A test asserts the JSON Schema's
    `opponentPolicy.mode` enum equals `SUPPORTED_POLICY_MODES ∪
    DECLARED_UNIMPLEMENTED_POLICY_MODES` — all seven values — and that adding a value to
    the schema alone fails it. Same for the feedback-policy enum. D8's drift half.
14. **Browser test — the non-terminal grade reaches the screen, and the run is not
    frozen.** A new fixture `content/drafts/outcome-hold.browser.json`
    (`mode: "outcome"`, `type: "hold"`, `theory_strict` spine, `seedMode: "fixed"`,
    `resolveAt` a `{"atPly": 4}` checkpoint, `assessedBy: {"kind": "authored", "note": …}`)
    is played to its resolution in Playwright. **Its root has the learner to move**, so
    `startPack` skips `#playOpponentIfNeeded`
    (`apps/web/src/lib/session-controller.ts:372-380`) and the pre-play state is reachable
    in the browser. Asserted, before the first move: the resistance line states the request
    and says no opponent move has been played, naming no engine (§8a rule 2). Asserted at
    the resolution: the resolution block renders the `preserved` sentence with the
    checkpoint label and the "not a proof of the position" clause; the assessment line
    renders the unproved marker and the note; the resistance line now names the mock
    identity derived from the selection events, carries the §8a rule 5 disclaimer, and ends
    "Not perfect play."; and after pressing Continue the learner **makes one further move
    that commits** — the D12b regression asserted in the browser, where it was visible to
    the owner and invisible at the endpoint. `theory_strict` at a fixed seed is what makes
    the move sequence deterministic, the same mechanism
    `schemas/fixtures/drill-pack/terminal-outcome.browser.json` already relies on.
15. **Browser test — a terminal grade, and a loss that is a pass.** A second fixture
    `content/drafts/outcome-resist.browser.json`
    (`type: "resist"`, `resolveAt` a `{"atPly": 2}` resistance checkpoint, learner mated on
    a `theory_strict` spine) is played to checkmate: `TerminalSheet` shows the result
    "You lost." **and**, as a separate sentence, the grade "Objective: resist — achieved".
    Both fixtures make no chess claim beyond move legality and the mate itself, and carry
    a `graduationBlockers` entry saying so, as `terminal-outcome.browser.json` already
    does. **No Playwright configuration change is needed**: `NODE_ENV=development` loads
    every `.json` file in `content/drafts/` (`apps/server/src/pack-registry.ts:171-181`),
    and `DRAFT_PACK_FILE` adds one further file on top of that directory
    (`pack-registry.ts:176-181`, `apps/server/src/main.ts:19-29`) rather than replacing
    it. So `make test-browser` serves both new fixtures, Pack C, and the existing
    `DRAFT_PACK_FILE` fixture together. Both fixtures carry `reviewStatus: "draft"` and,
    like Pack C, are never served outside development (`pack-registry.ts:171-181`).
16. **Browser test — Pack C on the screen.** Pack C v0.2.0, served from
    `content/drafts/` in development, is opened and its objective rail is asserted
    **before the learner's first move** — which is not the same instant as "before any
    move". Pack C's `start.side` is `black` and its FEN has White to move
    (`content/drafts/rook-4v3-same-side.json:13-16`), so `startPack` obtains and commits
    White's reply and only then calls `onRunStarted`, which is what navigates to the drill
    screen (`apps/web/src/lib/session-controller.ts:235-237`,
    `apps/web/src/App.svelte:46`). The first render therefore already contains one opponent
    ply and its recorded selection. That ordering is correct and deliberate and this RFC
    does not touch it; the criterion adapts to the product instead.
    Asserted at that first render: the authored assessment line carrying the pack's own
    `no-tablebase-here` text, now delivered as `assessedBy.note`; and a resistance line
    that states `human_common` at Elo 1900 as the pack's *request*, **names the recorded
    mock identity** ("Deterministic mock opponent") because a move has been played, carries
    the §8a rule 5 disclaimer, ends "Not perfect play.", and contains no occurrence of
    "Maia". The pre-play form of the line — request stated, no engine named — is asserted
    in criterion 14 instead, whose fixture has the learner to move at the root.
    Move-by-move play is deliberately not asserted here, because Pack C's opponent is not
    fixed (§11).
17. **Existing packs unaffected.** `schemas/drill_pack.example.json`, the two plan drafts
    and the four `content/candidates/*/pack.json` load, validate and grade exactly as
    before, asserted by a test that loads every pack file in the repo through
    `validatePackDocument` — including the new root-trigger checks. The browser assertion
    `active → achieved` (`tests/browser/drill.spec.ts:148`) still passes unchanged.
18. **No migration.** A test asserts `DRILL_RUN_SCHEMA_VERSION === "0.6"` and that a run
    stored before this change replays unchanged; `rfc/README.md`'s migration register
    gains no row.
19. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green;
    `make pack-check FILE=content/drafts/rook-4v3-same-side.json` green.
20. **Docs.** `docs/drill-pack-format.md` documents v0.3, `objective.grading`, the widened
    `successConditions`, the derived `grounding` and the new validation codes;
    `docs/branch-runtime.md` documents the two new predicates, the monotone law of §3a, the
    D13 segment rule, and `resistanceOnPath`'s committed-child scoping against the
    already-documented selection/commit adjacency (lines 152-156);
    `docs/explanation-grounds.md` replaces its "grounding unshipped objective types such as
    `win` and `hold`" boundary item (line 207) with the shipped grounds and records the
    three new `rules:` facts against its no-new-vocabulary claim (lines 151-153);
    `docs/drill-client.md` documents the resolution block, the terminal grade line, the
    assessment line, the resistance line and the sentence that the product does not know
    which policy ran; `docs/content-sourcing.md` documents the reserved sidecar basenames,
    the ledger + manifest requirement for `ledger_verified`, and the move of
    `validateLedger` / `validateManifest` / `linkage` into `ledger-validation.ts`;
    `docs/development.md` records that a `.json` in a served content directory is a pack
    unless its name is a reserved sidecar.

## Open questions

None.

## Changelog

- 2026-08-12: implemented. Living pack schema advanced to v0.3; outcome grading,
  exact-assessment admission, path-scoped resistance reporting, Pack C repair,
  learner-facing presentation, and canonical docs shipped. Independent review
  approved 276 unit/integration tests and the browser suite. D14's private
  Chessground-element race was then reproduced and fixed without retries; five
  consecutive zero-retry browser gates passed before archival.
- 2026-08-12: created. Specifies WDL-preserving grading for `win`/`hold`/`save`/`resist`,
  closes D12 (Pack C unplayable, verified by execution), D12a (no root-truth check),
  D12c (ply-1 disclosure) and D13 (zero-length segment), and closes the drift half of D8
  while leaving its capability half open and visible.
- 2026-08-12: revised against review. (1) Killed the `preserved ⇄ degraded` oscillation
  and the parity-dependent `resist` verdict: §3a adds the one-way monotone law and the
  edge-triggered `checkpointReachedHere` predicate, fixes precedence as
  outcome > degradation > resolution, and rewrites `resist` success as a path conjunction
  that never reads `preserved`. (2) Replaced `assessedBy.claimId` with a capped
  `assessedBy.note` delivered by a one-key extension of the pack projection (§4a),
  restoring no `feedbackClaims` and adding no `feedback_claim` item kind; Pack C's
  `no-tablebase-here` text moves into that field, and its resolution checkpoint's label
  follows its new trigger. (3) §8a derives who actually resisted
  from `opponent.move_selected.selection.engine`, with rules for pre-play, mock,
  requested-vs-actual and multiple identities. (4) §4c makes the "exact" label conditional
  on a load-time byte-exact match against a `tablebase_result` ledger record, adds
  `grounding` as a derived, non-authorable field and `SYZYGY_ASSESSMENT_UNGROUNDED` at
  promotion. (5) Dropped `rules_fact: draw` from the widening, with the reason. (6) D12a
  became two error-severity runtime checks that fail `pack-check`, evaluated with the
  orchestrator's own `checkpointMatches` so timing windows are covered and `atPly: 0` is
  reported as unreachable. Also: scoped the absorbing-state law to outcome objectives,
  corrected `Parent / amends` to the archived RFCs, corrected the Playwright
  draft-loading claim, replaced the ">7 pieces, no source of truth anywhere" wording,
  extended D8's drift half to all four undeclared modes, and added the five acceptance
  tests the review named (criteria 1a, 3, 7b, 8, 11).
- 2026-08-12: revised against a third review, which accepted the grading mechanism and
  raised four integration blockers. Nothing in §3, §3a, §5 or §7's compiled order changed.
  (1) **Resistance scoping was leaking siblings.**
  `opponent.move_selected.data.nodeId` is the *parent* node
  (`packages/runtime/src/runtime.ts:301-316`), so several branches share it and a
  parent-keyed filter reported engines that never played on this path. New §6a derives
  identity through the required adjacent `opponent.move_selected` → `move.committed` pair —
  an invariant `readBackReplay` already enforces (`packages/runtime/src/replay.ts:31-77`)
  and the docs already state — extracts that pairing as `opponentMovesFromEvents`, and
  keeps a selection only when its **committed child** is on the path. Criterion 11a is the
  named non-leakage regression.
  (2) **Actual policy is not recoverable and this RFC no longer implies it is.** Maia
  executes `theory_strict` and its `human_common` fallback through the same call with the
  same engine identity (`apps/server/src/opponent-selector.ts:453-460`, `:428-435`), so
  engine identity cannot reveal a fallback or a requested-vs-actual policy mismatch. §8a is
  rewritten around two persisted facts — the pack's *requested* policy and the *actual
  engine* — states plainly that the product does not know which policy ran, and prints a
  fixed disclaimer whenever an engine is named. The alternative — persisting
  `policyModeApplied` and the fallback reason — is named as the future path and refused
  here, because `opponentSelection` is `additionalProperties: false`
  (`schemas/drill_run.schema.json:128-141`) and it would take a run-schema bump and a
  migration row out of §12's scope. It becomes a BACKLOG row to propose.
  (3) **Criterion 16's "before any move" was impossible.** Pack C starts with the opponent
  to move and `startPack` commits that reply *before* `onRunStarted` navigates
  (`apps/web/src/lib/session-controller.ts:235-237`, `apps/web/src/App.svelte:46`), so the
  first render already carries the mock identity. The criterion becomes "before the
  **learner's** first move" and expects the recorded identity; the pre-play form moves to
  criterion 14, whose fixture now has the learner to move at the root. Client
  orchestration is not changed — the existing behaviour is correct.
  (4) **The sidecar admission contract was incomplete, in two ways.** New §4c defines pack
  discovery exclusions: `jsonFiles` treats every `.json` under a loaded directory as a pack
  (`apps/server/src/pack-registry.ts:109`), so a sibling ledger crashes startup, and the
  four-file candidate layout survives only because `content/candidates/` is not loaded. A
  frozen `SIDECAR_BASENAMES` — `evidence.json`, `sources.json`, `job.json`, `priority.json`,
  plus the `<basename>.` forms — is excluded from discovery and is the same constant the
  resolver uses. New §4d requires a **structurally valid ledger and a linked source
  manifest** before `ledger_verified`, reusing `validateLedger`, `validateManifest` and
  `linkage` (`apps/server/src/sourcing/check.ts:141-158`, `:105-127`, `:159-181`), which
  move verbatim into `ledger-validation.ts` beside a single `assessmentGrounding` predicate
  called by both the registry and `checkSourcingDirectory`. Criterion 7c is the
  invalid/unlinked-ledger regression and 12a the discovery regression. Also: corrected
  drifted line citations throughout (`replay.ts`, `types.ts:63-69`, `runtime.ts:430-436`
  and `:448-466`, `events.ts:122-143` and `:130-134`, `objective-state.ts:44-46`,
  `service.ts:621-625`, `pack-registry.ts:76-87`, `check.ts:318-321` and `:363`,
  `opponent-selector.ts:428-435`, `drill-pack.test.ts:49-56`).
