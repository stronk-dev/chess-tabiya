# RFC: Tempo vocabulary — a timing window becomes a measured interval

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md` §Target mistake classes (`:144-150`) — *"right plan one move too slow"*, *"tension released too early or held too long"*, *"luxury move during a race"*; `design/04-content-architecture.md` §2d (`:228`, "one timing window where the tempo contract bites" per opening root) and §7 (`:309-311`, the three named first cases); `design/04-content-architecture.md` §0a (`:128-135`, the content-transfer audit); `design/03-product-breadth.md` B4 (`:284`, the *structural/temporal* evidence layer); `design/BACKLOG.md` rows **Tempo vocabulary encodes the wrong object (the E3 blocker)**, **B4 is blocked on tempo vocabulary, not on content effort**, **Tempo contract / timing windows (window opens/closes, luxury-move budget)**, **Authored explanation vocabulary**, **Declared-vs-executable vocabulary law**
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration gate). The specific opener is **E3** (`planning/exploration/gates.md:84`), ruled **partially met** on 2026-08-15: the boundary half met, *"the timing-window half unmet… the shipped format encodes the wrong object"*. The evidence base is `design/research/authored-transitions-and-features.md` (§4, §6 gap 3, §7). The withdrawn draft that deferred this named its own trigger: *"Pack A (anti-Caro) is where the tempo contract gets its encoding"* (`rfc/withdrawn/authoring-contracts-v03.md:118-124`). Pack A exists; the trigger has fired.
- **Depends on:** `rfc/authoring-frictions.md` (pack schema **0.16**; this RFC claims 0.17 and lands behind it), `rfc/archive/structural-reading.md` and `rfc/archive/predicate-wave-2.md` (`$defs/structuralExpression`, used by one closing-condition form), `rfc/archive/line-drill-theory-grading.md` (`authoredBoundary`, the `follow_theory` compiler branch this RFC's compiler branch is modelled on), `rfc/archive/open-answer-grading.md` (`stated_reasoning` key points and their `claim` ground, the only shipped path by which a `feedbackClaim` fires), `rfc/archive/defect-sweep.md` §2 (the declared-vs-executable law discharged in §6)
- **Parent / amends:** amends the shipped drill-pack format, `pack-orchestrator.ts`, `pack-validation.ts` and the runtime's derived projections. Introduces one new runtime module (`packages/runtime/src/tempo.ts`) and no new subsystem
- **Supersedes / superseded by:** supersedes the timing-window fragment of `rfc/withdrawn/authoring-contracts-v03.md` §Deferred (`:118-124`), which deferred exactly this to exactly this trigger
- **Planning:** `planning/tempo-vocabulary/` (once implementing)


> **OWNER RULING 2026-08-15 — `outpaced` grading is SPLIT by context; open question 2 is
> settled and this RFC's current refusal is only half right.** The owner: *"drill packs add
> primitives, then use them in tailored experiences, so they must have FULL flexibility. But in
> 'just play', one would argue that entering an outpaced race means you made a mistake."*
>
> - **Authored packs: a window MAY declare that `outpaced` grades.** Not a global refusal — an
>   author-declared per-window choice, defaulting to ungraded. The capability publication and the
>   named refusal stay exactly as specified; what changes is that the refusal becomes the DEFAULT
>   rather than the only option, and a pack may opt in.
> - **Just Play (and any unauthored context): `outpaced` grades as a failure by default**, because
>   entering a race a tempo behind is a real mistake made earlier, and no author is present to say
>   otherwise.
>
> The general principle the owner drew, now ledgered as "Authored contexts declare; unauthored
> contexts default": wherever the product must pick a semantic, an authored context supplies it
> and an unauthored context needs a *stated* default. The two must not collapse into one global
> answer. **Implementer: this is a real change to §1.6 and to the `tempoGradeable` capability —
> the declared-vs-executable law still applies to both branches, so the Just Play default needs
> its own applied record, not an implicit one.**

## Summary

Thirty-five authored packs declared a timing window **zero times across 135
checkpoints** (`design/research/authored-transitions-and-features.md` §3.2), and
two authors from two different phases recorded, in writing, that the field could
not say what they meant. This RFC accepts that verdict and replaces the object.

A timing window stops being **a pair of point triggers plus an unread integer**
and becomes **a measured interval over the path**: an opening commitment, an
ordered set of closing conditions, a *readiness set* of moves that constitutes
plan completion, an author-declared *tolerated* set, and a luxury budget counted
only over the learner's moves inside the interval while the plan is still
incomplete. It resolves to one of seven typed verdicts. The evaluator is a pure
derived projection over the run's node path — the same shape as `shapeFirings`
(`packages/runtime/src/shape-firing.ts:15-33`) — so it costs **no new event, no
run-schema change and no migration**, and it is correct under rewind-and-branch
by construction.

`preserve_plan_window` is **implemented**, not refused: it becomes the objective
type whose success conditions are window verdicts, and a pack that declares it
without a window is refused by name.

The vocabulary was not designed and then illustrated. It was authored against
three shipped packs first, and the authoring **changed the specification four
times** (§8.5). Every verdict in §8 is a number this draft computed by running
the specified algorithm over the committed pack files, not a claim about chess.

## Motivation

**The zero is a refusal, and the refusal is documented twice.** Pack A's author,
on day one (`planning/content-era/log.md:84-91`):

> **The timing window has no vocabulary for what I actually wanted to say.** The
> teaching point is: White's plan-readiness vs Black's break arrival. I needed to
> declare (a) which move constitutes "ready" (Be3/c3 — a SET of moves, not one),
> (b) which Black move is "arrival" (...c5), (c) that h4 is the discretionary
> spend… they need to accept a move SET and allow the same move to be
> plan-completion on one branch and irrelevant on another.

Pack C's author, from the opposite phase (`:489-496`):

> **Endgame errors are drifts, not moves.** … "You have not moved your king in
> four moves and White's has crossed the fifth rank" is unsayable.

Both complaints are about the same defect: the shipped `$defs/timingWindow`
(`schemas/drill_pack.schema.json:569-578`) takes `windowOpens` and `windowCloses`
as single `simpleTrigger`s and an integer `luxuryMoveBudget`. A `simpleTrigger`
is a **predicate on one position** (`:519-568`). Neither "a set of moves any of
which completes the plan" nor "nothing happened for four moves" is a predicate on
one position, so neither is sayable — and the budget, the one construct the
tempo contract is actually about, is read by nothing:

```ts
// apps/server/src/pack-orchestrator.ts:65-75
export function checkpointMatches(pack, run, checkpoint): boolean {
  const trigger = checkpoint.trigger;
  if ("windowOpens" in trigger) {
    return simpleTriggerMatches(pack, run, trigger.windowCloses);
  }
  return simpleTriggerMatches(pack, run, trigger);
}
```

`windowOpens` and `luxuryMoveBudget` appear in exactly four source files —
`packages/schema/src/drill-pack/types.ts:75-79`, `lint.ts:135-140`,
`schemas/drill_pack.schema.json`, and the guards in `pack-orchestrator.ts`,
`pack-validation.ts` and `distill.ts` that exist only to *skip* the form. None of
them evaluates either field. A timing window today is a strictly more verbose
alias for its own closing trigger, and `docs/drill-client.md:73-74` says so in
plain words: *"A timing window fires when its authored closing trigger matches."*

**Why this is worth an RFC and not a ledger row.** Three of the target mistake
classes named in `design/01-training-model.md:146-149` are tempo classes: *right
plan one move too slow*, *tension released too early or held too long*, *luxury
move during a race*. The product's own training model is load-bearing on a
contract that no author can express. `design/04-content-architecture.md:228`
*requires* one timing window per opening pack root and names three first cases at
`:309-311`; all three packs ship, none declares a window, and 18 of 18
opening-phase packs have none. That is a design requirement and a shipped corpus
in direct disagreement, and the corpus is right until this is fixed.

**Scope boundary — what is explicitly out.** This RFC specifies **timing** only.

- **Structural predicates** — king geometry (D34), an existence predicate,
  intent-relative success — are `rfc/predicate-wave-3.md`'s subject, drafted in
  parallel. Where a closing condition wants a structural fact, this RFC uses
  the **already-shipped** `$defs/structuralExpression` and names the dependency
  rather than adding a predicate (§2.4, §8.4).
- **Claim triggers.** `feedbackClaims` still have no trigger field. This RFC
  gives a tempo claim a *place* to fire — an `atWindow` checkpoint carrying a
  `stated_reasoning` key point grounded on the claim, which is shipped machinery
  (`schemas/drill_pack.schema.json:606`, resolved at
  `apps/server/src/reasoning.ts:64-66`) — and does not add the general claim
  trigger.
- **Automatic tempo detection.** Nothing here detects that a position *has* a
  timing window. Every window is authored. E3's clause "without automatic phase
  detection" is satisfied in the same way the boundary half satisfied it.
- **Grading intent.** A window scores what was played, never what the learner
  said they intended. The plan-exclusivity problem in the author's complaint is
  solved by *commitment-opened windows* (§1.3), which needs no intent capture.

## Specification

### §0. Register claims

- **Pack schema version: 0.17 is claimed here.** `$id`
  (`schemas/drill_pack.schema.json:3`) moves to
  `urn:chess-tabiya:schema:drill-pack:0.17`;
  `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) moves to
  `"0.17"`; the pinned expectations at `packages/schema/src/drill-pack.test.ts:56-62`
  (the `describe` title, the `$id` string, and the constant) move with them.
  **0.17 lands behind 0.16** (`rfc/authoring-frictions.md`). **State of the tree at
  cross-review, 2026-08-15:** 0.16 is *mid-landing* — `$id` and
  `DRILL_PACK_SCHEMA_VERSION` already read `0.16` and `simpleTrigger` already carries
  `atStart` (`schemas/drill_pack.schema.json:519-568`), while
  `drill-pack.test.ts:56-62` still pins `0.15`. Every schema line number in this RFC
  is quoted against the **0.16 tree**. If 0.16 is reverted, this RFC rebases to 0.16
  rather than renumbering unilaterally. This RFC does **not** edit `rfc/README.md`; the register row is
  claimed in this text and the single writer of that file lands it. The parallel
  drafts already sequence against this lane: `rfc/predicate-wave-3.md:34-37`
  records the order as **0.16 → 0.17 (`tempo-vocabulary`) → 0.18 → 0.19**, and
  `rfc/validator-integrity.md` §7 ("Note to vocabulary drafts") names this draft as the 0.17 holder with no
  conflict.
- **⚠ 0.17 is additive plus exactly one narrowing, and the narrowing is stated
  loudly.** `$defs/timingWindow` is **removed from the checkpoint trigger union**
  (`$defs/trigger`, `:579-584`) and re-purposed as the top-level window object.
  A pack that used a timing window as a checkpoint trigger becomes invalid.
  **Measured blast radius:** scanning all 264 JSON files under `content/`
  (35 authored packs and 6 browser fixtures in `content/drafts/` plus their
  evidence/job/sources sidecars, 150 files in `content/candidates/`, 23 shape
  entries, 17 source files), the strings `windowOpens`, `windowCloses` and
  `luxuryMoveBudget` occur **zero times** — re-verified independently at
  cross-review against the same 264 files. The only two documents affected are
  `schemas/drill_pack.example.json:94-102` and the negative fixture
  `schemas/fixtures/drill-pack/malformed-window-trigger.invalid.json`, both
  re-homed in §7.4. No authored pack changes; no content digest moves.
- **⚠ No migration is claimed. The migration register stays at 18.** Nothing
  persisted changes shape. Window verdicts are a **derived projection**, never an
  event (§3.1). The only persisted bytes this RFC influences are the
  `evidenceRefs` array of the existing `objective.state_changed` event, whose
  items are typed `$defs/id` — *"type: string, minLength: 1"* —
  in `schemas/drill_run.schema.json:87-90,452-458`. A new reference prefix needs
  no schema movement, exactly as `theory:` needed none.
- **⚠ No run-schema change.** `DRILL_RUN_SCHEMA_VERSION` stays `"0.13"`. No new
  event type, no new event field, no widened persisted enum.
- **Shape-entry schema is untouched.** Stays `"0.2"`.
- **Refusal codes claimed:** the eight in §7.5. Checked against every
  `"[A-Z_]{5,}"` literal in `apps/server/src`, `packages/schema/src`,
  `packages/runtime/src` and `apps/web/src`: none collides. The nearest
  neighbours are `WINDOW_REQUIRED` and `WINDOW_INVALID`
  (`apps/server/src/sourcing/candidate-emit.ts:59`,
  `apps/server/src/sourcing/explorer.ts:56`) — both are *date* windows in the
  explorer client and share no namespace with these.

### §1. What a timing window is

#### 1.1 Three candidate objects, weighed against the two attested complaints

| Candidate | Pack A: "readiness is a move SET; h4 is the discretionary spend; the same move is plan-completion on one branch and irrelevant on another" | Pack C: "you have not moved your king in four moves" |
|---|---|---|
| **(A) Interval with an opening condition, a closing condition and a budget** — keep the two triggers, add a counter between them | **fails.** Readiness is still a point predicate. A trigger that is true when Be3 *is on the board* is not the same claim as "Be3 was played inside this window", and it fires forever afterwards | **fails.** Absence over a span is not a position predicate at either edge |
| **(B) Readiness as a move set** — replace the opening trigger with a set of moves | **passes (a) and (c), fails the branch clause.** A move set alone cannot say that h4 is spend *here* and completion *there* | **fails.** Drift is the *absence* of a move, and a set of required moves cannot count what did not happen |
| **(C) A measured interval over the path slice** — an opening commitment, ordered closing conditions, and per-move ledgers (readiness / tolerated / spend) computed over the moves that fall between them | **passes all three.** Readiness is a set; spend is the default classification of every other learner move; and the branch clause is answered by *commitment-opened windows* — a move that commits to a different plan opens **that** plan's window instead of spending this one (§1.3) | **passes.** "Four moves without a king move" is `readiness` unsatisfied after four learner moves, which is exactly a deadline close over a slice |

**(C) is adopted.** The one-line statement of the change: **a timing window is
not a pair of events, it is a ledger kept between two events.**

#### 1.2 The object

A window is `{ id, label?, opens, closes[], readiness, tolerated?, luxuryMoveBudget, note? }`:

- **`opens`** — one condition. `fromStart` (the window is open from the pack's
  root), `onMove` (the first move on the path matching any of a list of move
  conditions opens it), or `onTrigger` (a shipped `simpleTrigger`, so a window
  may open on a structural fact, a spine node, a ply, or the authored boundary).
- **`closes`** — an **ordered array** of 1–4 conditions, first match wins:
  `arrival` (an **opponent** move — the race's other runner), `release` (a
  **learner** move — the act the window was timing), `position` (a
  `structuralExpression` becomes true), `deadline` (N learner moves have been
  made inside the window).
- **`readiness`** — `{ mode: "all" | "any", of: [moveCondition, …] }`. The moves
  that constitute plan completion. Either colour: a readiness item may be an
  **opponent** move, which is how "the hook only gains a tempo once a black
  knight has come to g6" becomes sayable (§8.3).
- **`tolerated`** — moves that are neither plan completion nor luxury. Recaptures,
  the prophylactic move order, the forced retreat. **This is a chess judgment and
  it is authored, not detected** (§1.5).
- **`luxuryMoveBudget`** — how many spent moves the window tolerates before
  `in_time` becomes `over_budget`.
- **`note`** — the author's stated reason for the tolerated set, ≤400 chars.

#### 1.3 Commitment-opened windows: the answer to the branch clause

Pack A's hardest sentence is *"allow the same move to be plan-completion on one
branch and irrelevant on another."* The naive fix is to make windows
intent-relative, which requires a consumer for `intent_capture` that does not
exist (`design/research/authored-transitions-and-features.md` §6 gap 1) and which
belongs to `rfc/predicate-wave-3.md`.

It is not needed. **A plan-specific window opens on that plan's commitment move.**
Then a learner who plays a different plan's commitment move opens a *different*
window and never enters this one, so the move is not spend — it is outside the
interval. `f3` in the Carlsbad tabiya is plan completion for the central break
and *unopened* for the minority attack, computed with no knowledge of what the
learner said (§8.2, §8.4 — verified: the `f3` branch reports
`minority-race → unopened`).

**Normative rule.** A window whose `readiness` is specific to one plan class
MUST use `opens.onMove` or `opens.onTrigger`. `opens.fromStart` is for windows
that apply to every plan the pack offers — a development race, an endgame drift.
This rule is not machine-checkable and is stated for authors and reviewers, not
for the validator.

#### 1.4 The seven verdicts, and which of the named mistake classes each carries

| Verdict | Meaning | `design/01:146-149` mistake class |
|---|---|---|
| `unopened` | the opening condition never matched on this path | — (not a judgment) |
| `open` | opened, not yet closed; `spend` and `ready` are live counters | *luxury move during a race*, while it is being made |
| `in_time` | closed with readiness satisfied and `spend ≤ budget` | — (the success case) |
| `over_budget` | closed ready, but `spend > budget` | *luxury move during a race* |
| `too_slow` | closed unready, the learner having had at least as many moves inside as readiness required | *right plan one move too slow*; *tension held too long* |
| `outpaced` | closed unready, with **fewer** learner moves inside than readiness required | — (**deliberately not a judgment**, §1.6) |
| `premature` | closed by the learner's own `release` move while unready | *tension released too early* |

Every one of the three tempo mistake classes named in the training model is now
a computed value. §8 reaches all seven verdicts against shipped pack files.

#### 1.5 The runtime counts; the author classifies

Whether a move is preparation or luxury is a chess judgment. Under law 8 (ADR-0005)
this RFC may not manufacture it, and it does not: `readiness` and `tolerated` are
authored lists, and the `note` field exists so the reason is written down next to
them. The runtime contributes exactly two mechanical facts — *which* moves fell
inside the interval, and *how many* of the learner's were neither readiness nor
tolerated — plus one rules fact, that a position with a single legal move cannot
have been a luxury (§3.2 step 3).

Every chess claim in §8 is **quoted from the pack that already ships it** —
`objective.summary`, `planClasses[].description`, `feedbackClaims[].text`,
`deviations[].note`. This RFC re-encodes claims the corpus already makes in prose;
it originates none.

#### 1.6 `outpaced` is computed and never graded

If the opponent's arrival closes the window before the learner has had as many
moves as readiness requires, the learner did not fail — the position was faster
than the plan. `anti-caro-advance`'s own spine contains this case: the
`c5-immediate` branch is Black breaking on move 3, before White has moved at all.
Grading it would be the "dashboard, not a drill" failure ADR-0005 names.

**Ruling: `outpaced` and `open` MAY drive a checkpoint — telling the learner what
happened — and MAY NOT drive an objective transition.** The refusal is
machine-checked (`TEMPO_VERDICT_UNGRADEABLE`, §7.5) and the gradeable set is
published in `/capabilities` (§6), so the line is a negotiated fact and not a
convention.

`unopened` is a third computed-but-ungraded verdict and is stricter still: it is
**not authorable at all** — neither by a checkpoint nor by a success condition —
because it is absent from the schema's `tempoVerdict` enum (§2.6). It exists only
in the runtime type and the projection. Three verdicts are therefore computed and
never graded, and two of the three are the ones a validator can ever be asked to
refuse.

### §2. Schema (pack 0.17)

#### 2.1 `$defs/moveCondition` — new

```json
"moveCondition": {
  "oneOf": [
    { "type": "object", "required": ["moveUci"],
      "properties": { "moveUci": { "$ref": "#/$defs/moveUci" } },
      "additionalProperties": false },
    { "type": "object", "required": ["piece"],
      "properties": {
        "piece": { "$ref": "#/$defs/piece" },
        "to": { "$ref": "#/$defs/square" }
      },
      "additionalProperties": false }
  ]
}
```

Two forms, both cheap and both position-independent within the run:

- `{ moveUci }` — that exact move. Castling uses the repo's existing
  king-to-destination convention: `parseUci("e1g1")` is legal and its from-role
  is `king` (verified against chessops 0.15.1 on the `anti-caro-advance` spine
  after `3...Bf5 4.Nf3 e6 5.Be2 c5`, which is where that pack already declares
  `e1g1` as a deviation).
- `{ piece, to? }` — any move by a piece of that colour and role, optionally to a
  named square. `{ piece: { color: "black", role: "king" } }` is *"the learner
  moved their king"*, which is the primitive Pack C needed. The role is read from
  the **from-square in the position before the move**, so a promotion matches
  `role: "pawn"`.

`maxItems` caps (6 readiness, 8 tolerated, 8 opens, 4 closes) exist so that a
window stays a claim an author can hold in their head, and so the projection's
per-node work is bounded.

#### 2.2 `$defs/windowOpening` — new

```json
"windowOpening": {
  "oneOf": [
    { "type": "object", "required": ["fromStart"],
      "properties": { "fromStart": { "const": true } }, "additionalProperties": false },
    { "type": "object", "required": ["onMove"],
      "properties": { "onMove": { "type": "array", "minItems": 1, "maxItems": 8,
        "items": { "$ref": "#/$defs/moveCondition" } } }, "additionalProperties": false },
    { "type": "object", "required": ["onTrigger"],
      "properties": { "onTrigger": { "$ref": "#/$defs/simpleTrigger" } },
      "additionalProperties": false }
  ]
}
```

`onTrigger` reuses `$defs/simpleTrigger` unchanged, so a window inherits every
trigger form the format already has — including `atStart` if
`rfc/authoring-frictions.md` §3 lands first, which is why this RFC sequences
behind it rather than minting its own start form.

#### 2.3 `$defs/windowClosing` — new

```json
"windowClosing": {
  "oneOf": [
    { "type": "object", "required": ["kind", "move"],
      "properties": { "kind": { "const": "arrival" }, "move": { "$ref": "#/$defs/moveCondition" } },
      "additionalProperties": false },
    { "type": "object", "required": ["kind", "move"],
      "properties": { "kind": { "const": "release" }, "move": { "$ref": "#/$defs/moveCondition" } },
      "additionalProperties": false },
    { "type": "object", "required": ["kind", "feature"],
      "properties": { "kind": { "const": "position" }, "feature": { "$ref": "#/$defs/structuralExpression" } },
      "additionalProperties": false },
    { "type": "object", "required": ["kind", "afterLearnerMoves"],
      "properties": { "kind": { "const": "deadline" },
        "afterLearnerMoves": { "type": "integer", "minimum": 1, "maximum": 40 } },
      "additionalProperties": false }
  ]
}
```

`arrival` matches only opponent moves and `release` only learner moves; the
distinction is what separates `too_slow` from `premature`, i.e. *held too long*
from *released too early*. `position` reuses `$defs/structuralExpression`
verbatim — no new predicate (§2.4).

#### 2.4 `position` closes reuse shipped predicates — the named dependency

Pack C's sentence has two halves. "You have not moved your king in four moves" is
`readiness` + `deadline`. "And White's has crossed the fifth rank" is a *position*
close, and it is expressible **today**:

```json
{ "kind": "position", "feature": {
  "kind": "quantified", "quantifier": "some",
  "over": { "squares": { "files": { "from": "a", "to": "h" }, "ranks": { "from": 5, "to": 8 } } },
  "feature": { "kind": "piece", "piece": { "color": "white", "role": "king" } } } }
```

Evaluated with the **shipped** `matchesStructuralExpression`
(`packages/runtime/src/structure.ts:351-365`, quantifier at `:288-294`), bundled
unmodified with esbuild: `false` with the white king on g1 (the pack's own start
FEN `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1`), `false` on rank 4, `true` on
rank 5. No predicate is added here.

**This route deliberately avoids D32, and the avoidance is load-bearing.**
D32 (`design/BACKLOG.md`, row **D32 — "A structural condition can pass
`pack-check` and throw at runtime"**) is that `conditionEvidenceRefs` throws a bare
`TypeError` for a structural condition whose expression yields no feature leaf
(`apps/server/src/pack-orchestrator.ts:126-140`, the throw at `:138`, reached because
`structuralFeatureKinds` returns nothing for `pieceOnSquare` nodes and for
`quantified` nodes whose template is `piece` —
`packages/runtime/src/structure.ts:449-465`, the `pieceOnSquare` early return at
`:453` and the `piece`-template exclusion at `:457`). **The expression above is
exactly that shape**: a `quantified` over squares with a `piece` template —
confirmed at cross-review by calling the shipped `structuralFeatureKinds` on it,
which returns `[]`. Routed through a `structural_feature` success condition it
would validate green and crash when played. Routed through a `position` close it
cannot, because a window's evidence reference is `tempo:<windowId>.<verdict>`
(§4.3) and is never derived from the expression. **The avoidance has one
implementation precondition, stated because it is easy to lose:**
`conditionEvidenceRefs` reaches `structuralFeatureKinds(condition.feature)` as an
*unguarded fall-through*, not behind an `if (condition.kind ===
"structural_feature")`. The `timing_window` arm must therefore be added **before**
that fall-through; added after it, a tempo condition reaches
`structuralFeatureKinds(undefined)` and throws for a different reason. This RFC
neither hits D32 nor fixes it; `rfc/validator-integrity.md` owns the fix, and
notes for this draft's reviewers (`rfc/validator-integrity.md` §7 ("Note to vocabulary drafts")) that any
draft widening `$defs/successCondition` inherits its
`SUCCESS_CONDITION_KIND_UNRECOGNISED` safety net once it lands.

**Dependency, stated not specified.** D34 (`design/BACKLOG.md`, row **D34 — "No
king-geometry vocabulary"**) records that
king geometry costs four quantified regions for an edge and that the objective
type is a pawn-structure word doing king-geometry duty. Richer king geometry is
`rfc/predicate-wave-3.md`'s scope. This RFC needs one rank band and uses the
shipped form; when wave 3 ships a king-geometry predicate, `position` closes get
it for free because the field is `$defs/structuralExpression`.

#### 2.5 `$defs/timingWindow` — replaced

```json
"timingWindow": {
  "type": "object",
  "required": ["id", "opens", "closes", "readiness", "luxuryMoveBudget"],
  "properties": {
    "id": { "$ref": "#/$defs/id" },
    "label": { "$ref": "#/$defs/nonEmptyString" },
    "opens": { "$ref": "#/$defs/windowOpening" },
    "closes": { "type": "array", "minItems": 1, "maxItems": 4,
      "items": { "$ref": "#/$defs/windowClosing" } },
    "readiness": { "type": "object", "required": ["mode", "of"],
      "properties": {
        "mode": { "enum": ["all", "any"] },
        "of": { "type": "array", "minItems": 1, "maxItems": 6,
          "items": { "$ref": "#/$defs/moveCondition" } }
      }, "additionalProperties": false },
    "tolerated": { "type": "array", "minItems": 1, "maxItems": 8,
      "items": { "$ref": "#/$defs/moveCondition" } },
    "luxuryMoveBudget": { "type": "integer", "minimum": 0, "maximum": 20 },
    "note": { "type": "string", "minLength": 1, "maxLength": 400 }
  },
  "additionalProperties": false
}
```

Top level gains, beside `checkpoints`:

```json
"timingWindows": { "type": "array", "minItems": 1, "maxItems": 8,
  "items": { "$ref": "#/$defs/timingWindow" } }
```

Optional. A pack without tempo content declares nothing and is unchanged.

#### 2.6 `$defs/trigger` — the narrowing, and `atWindow`

```json
"tempoVerdict": { "enum": ["open", "in_time", "over_budget", "too_slow", "outpaced", "premature"] },
"windowTrigger": {
  "type": "object", "required": ["atWindow"],
  "properties": { "atWindow": { "oneOf": [
    { "type": "object", "required": ["windowId", "verdict"],
      "properties": { "windowId": { "$ref": "#/$defs/id" }, "verdict": { "$ref": "#/$defs/tempoVerdict" } },
      "additionalProperties": false },
    { "type": "object", "required": ["windowId", "spendAtLeast"],
      "properties": { "windowId": { "$ref": "#/$defs/id" },
        "spendAtLeast": { "type": "integer", "minimum": 1, "maximum": 20 } },
      "additionalProperties": false }
  ] } },
  "additionalProperties": false
},
"trigger": { "oneOf": [ { "$ref": "#/$defs/simpleTrigger" }, { "$ref": "#/$defs/windowTrigger" } ] }
```

Three deliberate choices:

- **`atWindow` is not a member of `$defs/simpleTrigger`.** If it were, a window's
  `opens.onTrigger` could reference another window and windows could cycle.
  Keeping it out of `simpleTrigger` makes the cycle unrepresentable rather than
  refused at validation.
- **`unopened` is not in `tempoVerdict`.** A checkpoint that fires because nothing
  happened has nothing to say. `unopened` exists in the runtime type and in the
  projection; it is not authorable, by a checkpoint or by a success condition. The
  schema enum therefore has **six** members and binds to
  `AUTHORABLE_TEMPO_VERDICTS`, not to the seven-member `TEMPO_VERDICTS`
  (acceptance criterion 5).
- **`spendAtLeast` is the live form.** It fires the moment the ledger reaches N,
  which is what "you have just spent the tempo you need" requires — and it is the
  only form that fires while the window is still `open`.

Every site that today discriminates the window form asks `"atWindow" in trigger`
instead, and its meaning is unchanged. **The complete site list, swept at
cross-review against the 0.16 tree** (`grep -rn windowOpens --include='*.ts' apps
packages`):

| Site | Note |
|---|---|
| `pack-orchestrator.ts:71` | inside `checkpointMatches`; becomes the `windowTriggerMatches` branch (§3.4) |
| `pack-orchestrator.ts:198` | `follow_theory` boundary-checkpoint find |
| `pack-orchestrator.ts:300` | **added by 0.16** — the `atStart` checkpoint bootstrap. Not in this draft's first sweep; it exists only because 0.16 landed mid-review |
| `pack-validation.ts:101,229,231,354,375,411` | six guards that skip the form |
| `packages/schema/src/drill-pack/lint.ts:135-140` | `triggerNodeRefs` |
| `apps/server/src/distill.ts:54` | discriminates on **`windowCloses`**, not `windowOpens`; an `atWindow` trigger is pack-anchored and is dropped from a distilled pack for the same reason `atAuthoredBoundary` is |
| `packages/schema/src/drill-pack/types.ts:75-79` | `TimingWindowTrigger` becomes `WindowTrigger` |
| `packages/schema/src/drill-pack/index.ts:57` | the type re-export |
| `packages/schema/src/drill-pack.test.ts:183-186` | the trigger-variant fixture (§7.4) |

`TRAJECTORY_LEG_ENTRY_NOT_SIMPLE` (`pack-validation.ts:354`) keeps its message
(*"timing windows cannot open a trajectory leg"*, still accurate) and now refuses
`atWindow`.

#### 2.7 `$defs/successCondition` — a sixth kind

```json
{ "type": "object", "required": ["kind", "windowId", "verdict"],
  "properties": {
    "kind": { "const": "timing_window" },
    "windowId": { "$ref": "#/$defs/id" },
    "verdict": { "$ref": "#/$defs/tempoVerdict" },
    "to": { "$ref": "#/$defs/conditionBase/properties/to" },
    "from": { "$ref": "#/$defs/conditionBase/properties/from" }
  }, "additionalProperties": false }
```

**Ordinal note for the parallel wave.** `$defs/successCondition` has exactly
**five** arms on the 0.16 tree — `reach_checkpoint`, `outcome`,
`material_balance`, `rules_fact`, `structural_feature`
(`schemas/drill_pack.schema.json:294-355`) — so `timing_window` is the sixth for
whichever draft lands first. `rfc/predicate-wave-3.md` (pack schema **0.18**,
sequenced behind this draft at `:34-38`) also describes its `plan_consequence` arm
as a sixth kind, in four places: `:28-29`, `:260`, `:508`, `:968`. Landing order
resolves the substance without renegotiation — `timing_window` is the sixth at
0.17 and `plan_consequence` the seventh at 0.18 — but **it does not resolve the
text**: whichever of the two lands second carries a one-word correction in its own
draft, and this RFC has no authority to make it in wave 3's file. Flagged here for
the single reviewer of both. The two arms are otherwise disjoint — wave 3 states
at `:167` that *"nothing here reads or writes `timingWindow`"*, and
`rfc/validator-integrity.md` §7 ("Note to vocabulary drafts") records "no interaction found" with either — so
neither draft depends on the other landing, and if only one ships it ships
whole.

The `to`/`from` machinery is inherited unchanged, so a tempo condition composes
with the existing monotone outcome compiler exactly as `structural_feature` does.
`verdict` is schema-wide `tempoVerdict`; the **gradeable subset** is enforced by
the validator against a published constant, not by the schema, so the refusal can
carry a reason string (§6, §7.5).

### §3. The evaluator

#### 3.1 It is a derived projection, not an event — and why

`packages/runtime/src/tempo.ts` (new):

```ts
export type TempoVerdict =
  | "unopened" | "open" | "in_time" | "over_budget" | "too_slow" | "outpaced" | "premature";

export const TEMPO_VERDICTS: readonly TempoVerdict[];             // all seven
/** The subset a pack may name at all; the schema's `tempoVerdict` enum binds to this. */
export const AUTHORABLE_TEMPO_VERDICTS: readonly TempoVerdict[];  // the six minus `unopened` (§2.6)
/** The subset an objective transition may be driven by. */
export const TEMPO_GRADEABLE_VERDICTS: readonly TempoVerdict[];   // in_time, over_budget, too_slow, premature
/** Declared-but-ungradeable, with the reason the loader quotes. */
export const DECLARED_UNGRADEABLE_VERDICTS: readonly { readonly verdict: TempoVerdict; readonly reason: string }[];

export interface TempoMove {
  readonly nodeId: string;
  readonly moveUci: string;
  readonly mover: Color;
  readonly role: Role;          // piece on the from-square before the move
  readonly toSquare: SquareName;
  readonly beforeFen: string;
  readonly fen: string;
}

export interface TimingWindowState {
  readonly windowId: string;
  readonly verdict: TempoVerdict;
  readonly ready: boolean;
  readonly satisfied: number;
  readonly required: number;
  readonly spend: number;
  readonly budget: number;
  readonly learnerMoves: number;
  readonly openedAtNodeId: string | null;   // null for fromStart and unopened
  readonly closedAtNodeId: string | null;
  readonly closedBy: "arrival" | "release" | "position" | "deadline" | null;
}

/**
 * Resolves an `opens.onTrigger` window: given the trigger and a path index, does
 * the trigger hold at that node? Supplied by the caller, which owns the pack and
 * the run; `undefined` means the caller declares no `onTrigger` support and any
 * `onTrigger` window resolves `unopened`.
 */
export type TriggerResolver = (trigger: SimpleTrigger, pathIndex: number) => boolean;

export function windowStates(
  windows: readonly TimingWindowDefinition[],
  path: readonly TempoMove[],
  learner: Color,
  resolveTrigger?: TriggerResolver,
): readonly TimingWindowState[];
```

The signature deliberately mirrors `shapeFirings(entries, path)`
(`packages/runtime/src/shape-firing.ts:15-18`) — a pure function of the authored
declarations and the node path, holding no run object, reading no events and doing
no I/O.

**The one place that purity is not free, stated rather than hidden.** Two of the
three `opens` forms — `fromStart` and `onMove` — are decidable from `path` alone.
`opens.onTrigger` is not:
`simpleTriggerMatches` is **module-private** in
`apps/server/src/pack-orchestrator.ts:39-63`, it evaluates against
`run.activeCursor` rather than an arbitrary node, and
`packages/runtime`'s only dependencies are `@chess-tabiya/schema` and `chessops`
(`packages/runtime/package.json`), so `tempo.ts` cannot call it and must not try.
Hence the injected `resolveTrigger`, and hence three normative consequences:

1. **`tempo.ts` stays in the runtime package and stays pure.** It never imports
   from `apps/server` — the dependency edge does not exist and creating it is
   refused.
2. **The server supplies the resolver** by cursor substitution, the trick
   `insideAuthoredBoundary` already uses (`packages/runtime/src/line.ts:93-98`,
   `runAt(run, node)`): `resolveTrigger = (trigger, index) =>
   simpleTriggerMatches(pack, runAt(run, path[index]), trigger)`. This is
   deterministic and path-local, so the rewind argument below is unaffected.
3. **The objective compiler carries it by inlining data, not by reaching.**
   `evaluateObjectivePredicate` lives in `packages/runtime/src/objective.ts` and
   has the same reach problem: it holds a `run`, never a `pack`. So the
   `timingWindow` predicate that `objectiveRules` inlines (§3.4) carries the
   pack-derived *data* each trigger form needs, exactly as the `follow_theory`
   compiler already inlines `deviationAnchors(pack)` into a literal
   `fromTransposeKey` (`pack-orchestrator.ts:174-195`). All six `simpleTrigger`
   forms are inlinable this way and none needs a new predicate: `atStart` and
   `atPly` are path-local; `fenPredicate` and `materialBalance` are node-FEN-local
   and already have runtime evaluators; `atSpineNode` inlines
   `spinePositionIndex(pack)` as a `ReadonlyMap`; `atAuthoredBoundary` inlines
   `pack.authoredBoundary` plus that same map. No refusal code is needed and no
   `onTrigger` window is silently `unopened`.

**Why a projection and not an event.** Three reasons, in order of weight:

1. **Rewind is the product.** A window's verdict is a function of the path, so a
   branch created by rewinding recomputes its own verdict with no bookkeeping and
   two sibling branches disagree correctly. An event would have to be invalidated
   on fork, which is the class of bug the branch runtime exists to avoid.
   **Verified rather than argued by analogy:** `historyFrom` walks the `parentId`
   chain and nothing else (`runtime.ts:474-482`), so an abandoned sibling line is
   not an ancestor of the new branch's nodes and its moves cannot enter any slice
   — spend cannot be double-counted across a rewind. The graded half is
   branch-local for the same structural reason: `objectiveState` is a property of
   the **node**, inherited from the parent on commit (`runtime.ts:335`) and read
   per node by `evaluateObjective` (`objective.ts:320-325`), so a fork inherits the
   objective state of its fork node and diverges from there. One consequence of
   that is normative and is recorded in §5b.
2. **Migration 10 already ruled on this shape** — *"Run schema stays 0.8 by design
   (firings are derived projections, never events)"* (`rfc/README.md`, migration
   register). Window verdicts are the same kind of object as shape firings.
3. It is the only way to keep the §0 promise of no run-schema change and no
   migration.

**The cost of the choice, stated:** a verdict is not auditable from stored events
alone; it must be recomputed. See Open questions.

#### 3.2 The algorithm (normative)

Input: a window `w`, a path `path` (root-to-node, one `TempoMove` per committed
move), the learner colour `learner`.

**Step 0 — open.**
- `opens.fromStart` → the slice is the whole path; `openedAtNodeId = null`.
- `opens.onMove` → the first index `i` whose move matches any listed condition;
  the slice is `path[i+1…]`; `openedAtNodeId = path[i].nodeId`.
- `opens.onTrigger` → the first index `i` at which `resolveTrigger(trigger, i)`
  returns true; slice and `openedAtNodeId` as for `onMove`. The resolver is
  injected (§3.1) because the shipped `simpleTriggerMatches` is server-private and
  cursor-relative; on the checkpoint path it is `simpleTriggerMatches` under a
  substituted cursor, on the objective path it is the compile-time-inlined form.
  Both are deterministic functions of `path[0…i]` and the pack, which is what the
  rewind argument requires.
- No match → `{ verdict: "unopened" }` and stop. All counters are 0.

**Step 1 — walk the slice in order.** For each node, in this order:

1. **Readiness.** Record `wasReady` (the readiness state *before* this move). Then,
   for each unsatisfied readiness item in authored order, if the move matches it,
   mark that item satisfied and stop scanning items (**at most one item per move**,
   lowest index wins — this keeps the walk deterministic when two items overlap).
2. **Closing.** Evaluate `closes` in authored order, excluding `deadline`:
   `arrival` matches only if `mover !== learner`; `release` only if
   `mover === learner`; `position` evaluates `matchesStructuralExpression` against
   this node's FEN. First match wins and is recorded as `closedBy`.
3. **Spend ledger.** If `mover === learner`, increment `learnerMoves`. Increment
   `spend` if and only if **all five** hold: `!wasReady`; the move advanced no
   readiness item; the move matches no `tolerated` condition; the move did not
   close the window in step 2; and the position before the move had more than one
   legal move.
4. **Deadline.** If not yet closed, and any `deadline` has
   `learnerMoves >= afterLearnerMoves`, close with `closedBy = "deadline"` at this
   node. Deadline is evaluated **after** this node has been counted, so
   `afterLearnerMoves: 4` closes on the learner's fourth move and not before it.
5. If closed, stop.

**Step 2 — verdict.** `ready` is `satisfied === of.length` for `mode: "all"`, or
`satisfied >= 1` for `mode: "any"`. `required` is `of.length` for `all`, `1` for
`any`. Then, in this precedence order:

| # | Condition | Verdict |
|---|---|---|
| 1 | not closed | `open` |
| 2 | `closedBy === "release"`, not `ready`, **and the closing move was not forced** | `premature` |
| 3 | not `ready` and `learnerMoves < required` | `outpaced` |
| 4 | not `ready` | `too_slow` |
| 5 | `spend > budget` | `over_budget` |
| 6 | otherwise | `in_time` |

Rule 2 precedes rule 3 because a learner who closed the window themselves was not
outpaced by anything.

**The forced clause in rule 2 is the same rules fact as step 1 clause 3, and it is
here for the same reason.** `premature` means *you released the tension too
early* — a statement about a choice. If the position before the release move had
exactly one legal move there was no choice, and the accusation is false in
precisely the way §1.6 refuses for `outpaced`. A forced release therefore falls
through to rules 3–4: `outpaced` when the learner had fewer moves than readiness
required, `too_slow` otherwise. `too_slow` on such a path is still a statement
about the path rather than the choice; whether it should also be ungraded is
raised as an open question rather than decided here. Like step 1 clause 3, **no
line in §8 exercises this** — the replay confirms every position on every §8 line
has more than one legal move — so it costs nothing to specify and prevents a false
accusation the first time it does not.

#### 3.3 The three step-1 clauses that are not obvious, and where each came from

Each was wrong in this draft's first specification and was corrected by running
the algorithm over a real pack (§8.5):

- **`!wasReady`** — spend is *luxury during a race*. Once the plan is complete
  there is no race, so later moves are not luxury. Without this clause the
  `rook-4v3-same-side` main line, in which the defender's king walks on move 1 and
  then plays normally, scored `spend: 3` and `over_budget`.
- **"did not close the window"** — the `release` move is the act the window exists
  to time; charging it as luxury is a category error. Without this clause the
  `carlsbad-minority-attack` kingside branch scored `over_budget` for playing the
  correctly-timed `h4`.
- **"more than one legal move"** — a forced move cannot be a luxury. This is a
  rules fact (`Chess.allDests()`), computed lazily and only for learner moves
  while readiness is incomplete, so it is at most a handful of calls per
  evaluation. **Stated honestly: none of the three worked packs in §8 exercises
  this clause** — re-verified at cross-review by replaying all thirteen §8 lines
  with `Chess.allDests()` at every node: no position on any of them has a single
  legal move. It is specified because the alternative is a false accusation the
  first time one does, and it now guards rule 2 as well as the spend ledger
  (§3.2).

#### 3.4 Wiring, without changing a single public signature

- **Checkpoints.** `checkpointMatches(pack, run, checkpoint)`
  (`pack-orchestrator.ts:65-75`) gains a `windowTriggerMatches` branch that
  resolves `pack.timingWindows` by id, builds the `TempoMove[]` from
  `historyFrom(run, activeNodeId)` (`packages/runtime/src/runtime.ts:474-482`)
  **dropping the root node** — `historyFrom` returns the root first and the root
  carries no move, the same `.slice(1)` `lineMembership` already applies
  (`packages/runtime/src/line.ts:130`) — and calls `windowStates` with the
  cursor-substituting resolver of §3.1. The pack is already a parameter; nothing
  else changes. Existing dedupe (`reachedOnActivePath`, `:77-90`) means an `open`-
  or `spendAtLeast`-triggered checkpoint fires at the **first** node where it holds
  and not again on that path.
- **Objectives.** `ObjectivePredicate` (`packages/runtime/src/objective.ts:62-78`)
  gains
  `{ type: "timingWindow"; window: TimingWindowDefinition; learner: Color; verdict: TempoVerdict }`.
  The window definition **and every pack-derived fact its `opens` form needs** are
  **inlined at compile time** by `objectiveRules`, which has the pack — precisely
  the trick already used for deviations, where the
  compiler resolves `deviationAnchors(pack)` into a literal `fromTransposeKey`
  (`pack-orchestrator.ts:174-195`). `evaluateObjectivePredicate(run, predicate)`
  therefore needs no new parameter; it builds the path with the private
  `pathToNode` it already has (`objective.ts:174-185`), drops the root node, and
  calls `windowStates`.
- **Learner colour** is `pack.start.side`, required since
  `rfc/archive/defect-sweep.md` (`schemas/drill_pack.schema.json:179`).
- **Cost.** One `positionFromFen` per node on the active path, plus at most a few
  `allDests()` calls. For comparison, `insideAuthoredBoundary` already calls
  `spinePositionIndex(pack)` — a full spine replay — once per node
  (`packages/runtime/src/line.ts:109`), and it runs on every
  `atAuthoredBoundary` evaluation today. This is the cheaper of the two.

### §4. What the verdict drives

#### 4.1 Checkpoints — telling

`{ "atWindow": { "windowId": "c5-race", "spendAtLeast": 1 } }` on a checkpoint
labelled with the pack's own claim gives `anti-caro-advance`'s floating
`tal-tempo` claim — *"4.h4 gains space on the wing but spends the tempo you need
to meet ...c5 with a developed piece"*, shipped today with
`evidenceTypes: ["author_principle", "hypothesis"]` and **no trigger** — the
place it has never had. On the pack's own `h4-tal` branch this fires at ply 2,
the move after which `spend` reaches 1 (§8.1).

`feedbackClaims` still have no trigger field of their own. The shipped route from
a checkpoint to a claim is a `stated_reasoning` key point with
`ground: { kind: "claim", claimId }` (`schemas/drill_pack.schema.json:643`,
resolved to an attribution sentence at `apps/server/src/reasoning.ts:64-66`).
An `atWindow` checkpoint can use it on day one. A fifth ground kind
`{ kind: "timing", windowId }` is the obvious follow-up and is **not** shipped
here; it belongs to whichever RFC next opens `reasoningKeyPoint`.

#### 4.2 Objectives — grading

A `timing_window` success condition compiles through the existing
`conditionRules` path (`pack-orchestrator.ts:142-165`) with no change to its
shape. Only `successPredicate` (`:92-124`) and `conditionEvidenceRefs`
(`:126-140`) gain a branch — the latter **before** its unguarded structural
fall-through, for the reason spelled out in §2.4.

#### 4.3 Evidence references — the applied record

`packages/runtime/src/evidence-ref.ts` gains:

```ts
export type TempoEvidenceRef = `tempo:${string}`;
export function tempoEvidenceRef(windowId: string, verdict: TempoVerdict): TempoEvidenceRef;
// -> `tempo:${evidenceId(windowId, "Window id")}.${verdict.replaceAll("_", "-")}`
```

`evidenceId` takes `(value, label)` (`evidence-ref.ts:41-49`) — the label is the
one the `TypeError` quotes, as `packEvidenceRef` and `engineEvidenceRef` already
pass it. `.` and `-` are inside its accepted character class
(`/^[A-Za-z0-9._-]+$/`, `:43`) and window ids are `^[a-z0-9][a-z0-9-]*$`
(`schemas/drill_pack.schema.json:143-146`) — no dot — so the two
parts are unambiguously separable. The reference is persisted in the existing
`objective.state_changed` event's `evidenceRefs`, whose items are only required to
be non-empty strings (`schemas/drill_run.schema.json:87-90,452-458`) — this is why
§0 can promise no run-schema change.

`apps/web/src/lib/evidence-sentences.ts` builds tempo sentences the same way it
already builds per-checkpoint sentences from the pack
(`evidenceSentenceTable`, `:58-95`): for each declared window × each gradeable
verdict, one row. Sentence template, using the window's authored `label`:

> *Timing window "Be ready when ...c5 lands": the plan was complete before the
> window closed, within the declared budget of 1 luxury move.*

Unknown references still fall through to the existing generic
`"Evidence recorded."` (`:138-142`), so an older client rendering a newer run
degrades exactly as it does today.

### §5. `preserve_plan_window` — implemented, not refused

`preserve_plan_window` (`schemas/drill_pack.schema.json:193`) has sat in the
objective enum since the format's beginning with zero users. Pack A's author
recorded it as *"a declared objective with no runtime meaning"*
(`planning/content-era/log.md:92-95`) and wrote the pack against it anyway.

**Correction to the dossier, verified.**
`design/research/authored-transitions-and-features.md` §8.4 says
`preserve_plan_window` has "no evaluator… Same for `prevent_opponent_plan`,
`transition_to_endgame`, `save`, `resist`." That is imprecise in two directions
and the code is the arbiter. In `objectiveRules` (`pack-orchestrator.ts:167-282`):
`save` and `resist` **are** in `outcomeObjective` (`:216-218`) and `resist` has a
type-specific rule of its own (`:247-258`); `preserve_plan_window`,
`prevent_opponent_plan` and `transition_to_endgame` fall to the generic branch
(`:219-224`) and do evaluate authored `successConditions`. What all five lack is
**type-specific semantics** — nothing the type *means* is executed. That is the
accurate statement of the defect and the one this section fixes for one of them.

**Ruling: implement.** The reason to implement rather than refuse is that after
§§2–4 the type finally has something to mean.

**5a. Validation.** A `preserve_plan_window` objective MUST declare at least one
`timingWindows` entry — `PLAN_WINDOW_NEEDS_WINDOW`, error, path
`/timingWindows`. No mode constraint: the type is orthogonal to `line`/`plan`/
`outcome`.

**5b. Compiled rules.** `objectiveRules` gains a `preserve_plan_window` branch
sited beside the `follow_theory` branch (`:173-215`) and built the same way — a
type-specific rule set, then the authored `successConditions` appended (note the
generic branch it replaces returns `[]` when `successConditions` is absent, so the
new branch must build its rules first and append `Array.isArray(raw) ? … : []`,
exactly as `follow_theory` does at `:211-214`). For each
declared window `w`, in declaration order:

| from | to | when | evidenceRefs |
|---|---|---|---|
| `active`, `preserved` | `degraded` | verdict(`w`) is `too_slow` | `[tempoEvidenceRef(w, "too_slow")]` |
| `active`, `preserved` | `degraded` | verdict(`w`) is `premature` | `[tempoEvidenceRef(w, "premature")]` |
| `active`, `preserved` | `degraded` | verdict(`w`) is `over_budget` | `[tempoEvidenceRef(w, "over_budget")]` |
| `active`, `degraded` | `preserved` | verdict(`w`) is `in_time` | `[tempoEvidenceRef(w, "in_time")]` |

`outpaced`, `open` and `unopened` produce **no rule** (§1.6).

**When the recovery row can actually fire, stated because it constrains the
fixture.** A window's verdict is monotone along a path: the §3.2 walk stops at the
close, so every descendant of the closing node recomputes the *same* closed
verdict. Combined with per-node inheritance of `objectiveState` (§3.1 reason 1),
this means the `degraded → preserved` row **cannot fire from the same window** —
no path exists on which one window is first `too_slow` and later `in_time`. The
row is reachable in exactly two ways, and both are the intended ones:

- **A different window.** Window A closes `too_slow` and degrades; window B, later
  in declaration order, closes `in_time` and recovers. This is the common shape
  for the Carlsbad-style multi-plan pack of §8.2.
- **A degrade from elsewhere** — an authored `successCondition` with
  `to: "degraded"` — recovered by a window's `in_time`.

The single-window recovery case is **rewind**, and it is `active → preserved` on
the sibling branch, not `degraded → preserved`: forking above the closing node
inherits `active`, so the retry is graded from a clean state. That is the product
working, and it is what acceptance criterion 3 tests.

**5c. `degraded`, never `failed`.** `failed` is terminal —
`ALLOWED_TRANSITIONS.failed` is the empty array
(`packages/runtime/src/objective-state.ts:3-10`). A tempo error is exactly the
mistake this product exists to let you rewind and retry, so it degrades. A pack
that genuinely wants a tempo error to be terminal writes an explicit
`timing_window` success condition with `to: "failed"`; the type's defaults do not
choose that for the author.

**5d. The other four unused types are out of scope** and this RFC says so rather
than quietly leaving them. `prevent_opponent_plan` and `transition_to_endgame`
still have no type-specific semantics; `save` and `resist` have semantics and no
users. Neither is a tempo question.

### §6. The D8 law, discharged

The declared-vs-executable law (`rfc/archive/defect-sweep.md:296-299`, promoted
to a design-tier row **"Declared-vs-executable vocabulary law (promote from
defect-sweep)"** in `design/BACKLOG.md`, which is where the three-leg form is
written down — the archived RFC states the first two legs) admits a value into a
declared vocabulary only with **capability publication**, **a named refusal**, and
**an applied record**. This is the fourth design it has decided, after
`perfect_tablebase`, `immediate_guard` and `policyModeApplied`.

Most of the tempo vocabulary is **executable**: every verdict is computed by the
shipped projection. The declared-but-not-executable part is exactly one line —
the three verdicts that are computed but may not grade (§1.6), of which two
(`outpaced`, `open`) are authorable and can therefore be refused by name, and one
(`unopened`) is not in the schema at all. All three legs:

1. **Capability publication.** `Capabilities` (`apps/server/src/capabilities.ts:57-68`)
   gains two readonly arrays, `tempoVerdicts` (all seven the deployment computes)
   and `tempoGradeable` (the four that may drive a transition), sourced from
   `TEMPO_VERDICTS` / `TEMPO_GRADEABLE_VERDICTS` in the runtime — one writer, as
   `policyModes` is sourced from `RUN_OPPONENT_MODES` (`:15`). `/capabilities`
   therefore states the grading line rather than burying it in a validator.
2. **A named refusal.** `DECLARED_UNGRADEABLE_VERDICTS` carries a reason string
   per verdict, in the exact shape of `DECLARED_UNIMPLEMENTED_POLICY_MODES`
   (`capabilities.ts:17-24`). `pack-validation.ts` refuses a `timing_window`
   success condition naming one of them with `TEMPO_VERDICT_UNGRADEABLE` and
   quotes the reason — e.g. *"outpaced is computed but never graded: the window
   closed before the learner had enough moves to complete the plan, so no
   judgment about the learner is available."* A pack naming it is told exactly
   that, by name, before anything runs.
3. **An applied record.** Every objective transition a window drives carries
   `tempo:<windowId>.<verdict>` in the persisted `evidenceRefs` of
   `objective.state_changed`, at the node where it applied. The verdict that
   actually graded the run is on the record, not inferred.

### §7. Validation

#### 7.1 Reference integrity

- `TIMING_WINDOW_DUPLICATE_ID` — two `timingWindows[]` entries share an `id`
  (JSON Schema cannot express intra-array uniqueness on a key). Error, path
  `/timingWindows/<i>/id`.
- `TIMING_WINDOW_UNKNOWN` — an `atWindow.windowId` or a `timing_window.windowId`
  names no declared window. Error, at the referencing path. This is the exact
  shape of the existing `OBJECTIVE_RESOLUTION_UNKNOWN` check
  (`pack-validation.ts:456-466`).

#### 7.2 Windows that cannot mean anything

- `TIMING_WINDOW_OPEN_IS_CLOSE` — a `moveCondition` appears both in
  `opens.onMove` and in a `closes` entry. The window would open and close on one
  move and every verdict would be `outpaced`. Error.
- `TIMING_WINDOW_TOLERATES_READINESS` — a `moveCondition` appears in both
  `readiness.of` and `tolerated`. The two lists are contradictory instructions to
  the ledger. Error. (Structural equality of the two-form condition objects; both
  forms are closed and small.)
- `TIMING_WINDOW_NEVER_RESOLVES` — a window named by a `timing_window` **success
  condition** whose `closes` array contains no `deadline`. Without a deadline the
  window can stay `open` forever and the objective can never resolve. Error.
  Windows used only by checkpoints may legitimately omit a deadline.
- `TIMING_WINDOW_READINESS_UNREACHABLE` — `mode: "all"` and the count of
  readiness items that are **learner-coloured piece conditions** exceeds the
  smallest `deadline.afterLearnerMoves`. Such a window can only ever emit
  `too_slow` or `outpaced`. Error.
  **Stated limitation:** the check only counts `{ piece: { color: learner } }`
  items, because the mover of a `{ moveUci }` item is not statically known
  without replay. It is therefore incomplete and never false-positive — verified
  against all **five** windows authored in §8, none of which trips it
  (`c5-race` 2 ≤ 4; `minority-race` vacuous, both items `moveUci`;
  `kingside-hook` 0 learner items, readiness is Black's; `central-break`
  1 ≤ 3; `king-must-walk` `mode: "any"`, out of scope of the check).

#### 7.3 Grading

- `PLAN_WINDOW_NEEDS_WINDOW` — §5a.
- `TEMPO_VERDICT_UNGRADEABLE` — §6 leg 2.
- **No new code for the root case.** A checkpoint
  `{ atWindow: { windowId, verdict: "open" } }` against a `fromStart` window is
  true at the root, because a `fromStart` window is open with an empty slice
  before anything is played. The existing `CHECKPOINT_TRUE_AT_ROOT` probe
  (`pack-validation.ts:604-646`, which runs `checkpointMatches` against a
  freshly-created run) catches it unchanged. This is a real authoring trap and it
  is already covered; that is the reason to reuse the probe rather than write a
  tempo-specific one.
  **Coordination note with 0.16, found at cross-review.** The probe as it stands on
  the tree has no exemption for root-true triggers, so 0.16's new `atStart`
  (`simpleTriggerMatches`, `pack-orchestrator.ts:45`, returns true at the root)
  currently trips `CHECKPOINT_TRUE_AT_ROOT` for every `atStart` checkpoint. That is
  0.16's defect to close, not this RFC's, but whatever exemption 0.16 adds must be
  keyed on the *trigger form* and not on "true at root" in general — a
  form-agnostic exemption would silently disarm this section's reuse of the probe.

#### 7.4 The two documents the narrowing touches

- **`schemas/drill_pack.example.json`.** Its `timing-window` checkpoint
  (`:94-102`) keeps its **id**, for two independently sufficient reasons. First,
  the example's own objective names it in a `reach_checkpoint` success condition
  (`schemas/drill_pack.example.json:22`), so renaming it would break the document.
  Second, five test sites in four files reference `timing-window` or
  `pack:timing-window` (`apps/web/src/lib/screens.test.ts:123` and `:124`,
  `apps/web/src/lib/evidence-sentences.test.ts:42`,
  `apps/server/src/drill-client-server.test.ts:384`,
  `packages/runtime/src/evidence-ref.test.ts:39` — the last a bare string, not a
  reference to this document) and **none of them touches the trigger**. Only the
  trigger changes, to
  `{ "atWindow": { "windowId": "najdorf-race", "verdict": "in_time" } }`, with a
  matching `timingWindows` entry opening on `najdorf-f3` and closing on the
  arrival that `najdorf-b5` represents. Per the version-mints-identity rule
  (`rfc/withdrawn/authoring-contracts-v03.md:108-114`) the example's `version`
  moves `0.2.0` → `0.3.0`. Its digest moves; nothing pins it (it is loaded and
  parsed by ten test sites, never compared to a stored digest).
- **`schemas/fixtures/drill-pack/malformed-window-trigger.invalid.json`.** Its
  purpose — *a window trigger with a malformed inner trigger must be rejected* —
  no longer has a subject. It is **re-homed, not deleted**: it becomes a
  malformed `atWindow` (a `windowId` plus both `verdict` and `spendAtLeast`,
  which the `oneOf` refuses), keeping its filename and its slot in the negative
  fixture set. Two fixtures are **added**:
  `window-unknown-reference.invalid.json` and
  `window-open-is-close.invalid.json`, covering §7.1 and §7.2.
- **`packages/schema/src/drill-pack.test.ts:163-196`**, the only test asserting
  the trigger-variant list, swaps its window entry (`:182-186`) for an `atWindow`
  entry and gains a case asserting the **old** form is now rejected. If 0.16 has
  landed its `atStart` variant into that same list first, both entries coexist;
  neither RFC's edit to this test collides with the other's.

#### 7.5 Refusal-code register for this RFC

| Code | Section | Severity |
|---|---|---|
| `TIMING_WINDOW_DUPLICATE_ID` | §7.1 | error |
| `TIMING_WINDOW_UNKNOWN` | §7.1 | error |
| `TIMING_WINDOW_OPEN_IS_CLOSE` | §7.2 | error |
| `TIMING_WINDOW_TOLERATES_READINESS` | §7.2 | error |
| `TIMING_WINDOW_NEVER_RESOLVES` | §7.2 | error |
| `TIMING_WINDOW_READINESS_UNREACHABLE` | §7.2 | error |
| `PLAN_WINDOW_NEEDS_WINDOW` | §5a, §7.3 | error |
| `TEMPO_VERDICT_UNGRADEABLE` | §6, §7.3 | error |

Existing codes whose scope changes: `TRAJECTORY_LEG_ENTRY_NOT_SIMPLE` (refuses
`atWindow` instead of a window trigger, same message),
`CHECKPOINT_TRUE_AT_ROOT` (now also reachable via `atWindow`, §7.3).

### §8. The vocabulary, authored against shipped packs

`design/04-content-architecture.md:309-311` names three first cases: *the Caro
Advance c5-break race, the Sicilian attack race, the Carlsbad minority-attack
race*. Two of the three are authored below in full, plus the endgame drift case
that supplies the second independent attestation. Every verdict in every table
was **computed**, by running the §3.2 algorithm over the committed pack files
with chessops 0.15.1, replaying each pack's spine from its own `start.fen`. The
FENs and move lists are the packs'; nothing was hand-constructed except the
off-spine lines, which are marked and whose legality was checked by the same
replay.

**Independently re-checked at cross-review** by an agent that did not write this
draft: every cell of §8.1–§8.4 was re-derived from §3.2 without reference to these
tables and agreed on all of verdict, `ready`, `spend`, `learnerMoves` and
`closedBy`; all thirteen lines were replayed with chessops 0.15.1 from each pack's
committed `start.fen` and are legal, with the mover and the from-square role each
`moveCondition` reads confirmed at every node, and no position on any of them
having a single legal move (§3.3); and the §8.4 `position` close was evaluated
against the bundled `matchesStructuralExpression` at three positions — `false` on
the pack's own start FEN, `false` with the white king on rank 4, `true` on rank 5.
Every quoted pack sentence in this section was diffed against the committed file:
the `objective.summary` of `anti-caro-advance` and `rook-4v3-same-side`; the claims
`tal-tempo`, `plan-tempi-nonrefundable` and `kingside-hook`; the checkpoint label
`break-still-unprepared`; and the deviation notes on `11.a3`, `11.e4` and `c2c3`.
None was paraphrased.

#### 8.1 `anti-caro-advance` — the c5-break race (design/04 §7 case 1)

The pack's objective, verbatim: *"You played 3.e5 for space. Meet Black's ...c5
break with your pieces already placed, not with your king still in the centre."*
Learner is White; Black moves first from
`rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3`.

```json
{
  "id": "c5-race",
  "label": "Be ready when ...c5 lands",
  "opens": { "fromStart": true },
  "closes": [
    { "kind": "arrival", "move": { "moveUci": "c6c5" } },
    { "kind": "deadline", "afterLearnerMoves": 4 }
  ],
  "readiness": { "mode": "all", "of": [
    { "piece": { "color": "white", "role": "knight" }, "to": "f3" },
    { "piece": { "color": "white", "role": "bishop" }, "to": "e2" }
  ] },
  "luxuryMoveBudget": 1,
  "note": "Pieces already placed means the kingside knight and the light-squared bishop are developed before the break lands. One wing move is affordable; two are not."
}
```

`{ moveUci: "c6c5" }` as the arrival is the sharpest single argument that the old
object was wrong. ...c5 lands at **two different spine nodes** — `c5-break` (ply
5) and `c5-immediate` (ply 1). A `windowCloses: { atSpineNode: … }` needs one
window per branch; one move condition covers both, and covers the unauthored
branches too.

| Line | Source | Verdict | ready | spend/budget | learner moves | closed |
|---|---|---|---|---|---|---|
| 3…Bf5 4.Nf3 e6 5.Be2 c5 | spine | **`in_time`** | ✔ 2/2 | 0/1 | 2 | `c5-break`, arrival |
| 3…Bf5 4.h4 h5 | spine (branch ends) | **`open`** | ✘ 0/2 | **1/1** | 1 | — |
| 3…c5 4.dxc5 | spine | **`outpaced`** | ✘ 0/2 | 0/1 | **0** | `c5-immediate`, arrival |
| 3…Bf5 4.h4 h5 5.Nf3 c5 | off-spine | **`too_slow`** | ✘ 1/2 | 1/1 | 2 | arrival |
| 3…Bf5 4.h4 h5 5.a3 e6 6.Nf3 c5 | off-spine | **`too_slow`** | ✘ 1/2 | **2/1** | 3 | arrival |

Read the middle three rows as the pack's own prose becoming machine-keyed:

- **`open` with `spend 1/1` on the `h4-tal` branch** is `feedbackClaims.tal-tempo`
  — *"4.h4 gains space on the wing but spends the tempo you need to meet ...c5
  with a developed piece"* — which today is a floating sentence with no trigger.
  A checkpoint `{ atWindow: { windowId: "c5-race", spendAtLeast: 1 } }` fires at
  ply 2, immediately after h4.
- **`too_slow` on `4.h4 h5 5.Nf3 c5`** is *right plan one move too slow*,
  `design/01-training-model.md:147`, computed. Nf3 arrived; Be2 did not.
- **`outpaced` on `3…c5`** is the case §1.6 exists for: the learner has not moved
  and is not graded.

**The one place this diverges from the author's day-one sketch, stated.** The
author wrote that readiness was *"Be3/c3 — a SET of moves"*. Reading the pack as
shipped, Be3 and c3 are how White *answers* the break (`be3-hold` at ply 6; the
`c2c3` deviation at `c5-break` is classed `accepted_alternative` with the note
*"the break is met by preparation, not panic"*) — a one-move choice at a single
node, which is a checkpoint with intent capture, not an interval. The tempo claim
in the pack's *objective sentence* is the development race, and that is what is
encoded. **The move-set requirement is met regardless** — `readiness.of` is a set
with `all`/`any` — and `any`-mode sets are exercised in §8.3 and §8.4. This is a
finding, not a gap: the day-one sketch conflated a race with a choice, and only
one of the two is a timing window.

#### 8.2 `carlsbad-minority-attack` — the minority-attack race (design/04 §7 case 3)

Learner is White; the pack starts at the tabiya
`r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10` with three
mutually-exclusive plans. Its claim `plan-tempi-nonrefundable` states the pack's
whole tempo thesis: *"the three plans are close to mutually exclusive, and the
tempi spent on one are not refunded when you switch."* Three windows, one per
plan, each **opened by its own commitment move** (§1.3).

```json
{
  "id": "minority-race",
  "label": "b4-b5 before the queenside freezes",
  "opens": { "onMove": [
    { "piece": { "color": "white", "role": "rook" }, "to": "b1" },
    { "moveUci": "a2a3" }
  ] },
  "closes": [
    { "kind": "arrival", "move": { "moveUci": "a7a5" } },
    { "kind": "deadline", "afterLearnerMoves": 3 }
  ],
  "readiness": { "mode": "all", "of": [
    { "moveUci": "b2b4" }, { "moveUci": "b4b5" }
  ] },
  "tolerated": [ { "moveUci": "g5e7" } ],
  "luxuryMoveBudget": 1,
  "note": "Bxe7 is the answer to ...Ne4 attacking the bishop, not a luxury; the pack's line plays it and continues the plan. a3 and Rab1 are the same commitment in two move orders, which is why either opens the window."
}
```

| Line | Source | Verdict | ready | spend/budget | learner | closed |
|---|---|---|---|---|---|---|
| 11…Nf8 12.Rab1 Ne4 13.Bxe7 Qxe7 14.b4 a6 15.b5 | spine | **`in_time`** | ✔ 2/2 | 0/1 | 3 | `b5-strike`, deadline |
| 11…Nf8 12.Rab1 a5 | spine | **`outpaced`** | ✘ 0/2 | 0/1 | **0** | `a5-prophylaxis`, arrival |
| 11…Nf8 12.f3 Ne6 13.Bh4 | spine | **`unopened`** | — | — | — | — |
| 11…Nf8 12.Ng3 Ng6 13.h4 | spine | **`unopened`** | — | — | — | — |
| 11…Nf8 12.Rab1 Ne4 13.h3 Qc7 14.a4 Rd8 15.Qb3 | off-spine | **`too_slow`** | ✘ 0/2 | **3/1** | 3 | deadline |

Two rows carry the design content:

- **`unopened` on the f3 and Ng3 branches is the branch clause solved.** `f3` and
  `Ng3` are plan-completion moves for other plans; under the old object they
  would have been charged as luxury against the minority attack. Here they are
  outside the interval, and nothing about the learner's stated intent was
  consulted.
- **`outpaced` on `12.Rab1 a5`** is exactly the pack's own deviation note on
  `11.a3`: *"it is the move order to prefer if you dislike ...a5 answers."* The
  window scores the race and stays silent about the move order; the move-order
  judgment stays in the deviation, where the author put it.

#### 8.3 `carlsbad-minority-attack` — the kingside hook, where readiness is the *opponent's* move

The pack's claim `kingside-hook`, verbatim: *"The kingside attack is timed by
Black's regrouping, not by White's enthusiasm: h7 has three defenders in the
tabiya, and h4-h5 only gains time once a black knight has come to g6 to be hit."*

```json
{
  "id": "kingside-hook",
  "label": "The hook waits for the knight",
  "opens": { "onMove": [ { "piece": { "color": "white", "role": "knight" }, "to": "g3" } ] },
  "closes": [
    { "kind": "release", "move": { "moveUci": "h2h4" } },
    { "kind": "deadline", "afterLearnerMoves": 3 }
  ],
  "readiness": { "mode": "all", "of": [ { "piece": { "color": "black", "role": "knight" }, "to": "g6" } ] },
  "luxuryMoveBudget": 0,
  "note": "Readiness here is the opponent's move: the hook gains a tempo only once a black knight stands on g6 to be hit."
}
```

| Line | Source | Verdict | ready | closed |
|---|---|---|---|---|
| 11…Nf8 12.Ng3 Ng6 13.h4 | spine | **`in_time`** | ✔ 1/1 | `h4-hook`, release |
| 11…Nf8 12.Ng3 Ne6 13.h4 | off-spine | **`premature`** | ✘ 0/1 | release |

This is *tension released too early* (`design/01-training-model.md:147`),
computed, in a pack that ships today. It is also the case that forced the
"closing move is never spend" clause (§3.3): before that correction the correct
line scored `over_budget` for playing the correctly-timed hook.

The pack's fourth plan window, `central-break`, is authored the same way — opens
on `f2f3`, readiness `{ piece: { color: "white", role: "rook" }, to: "e1" }`,
closes on `release e3e4` or a 3-move deadline, budget 1 — and on the pack's own
`f3` branch it computes **`open`, not ready, spend 1/1**. That state *is* the
pack's existing checkpoint label `break-still-unprepared`, *"Two moves into the
central plan, e4 is not ready yet"*, which today is keyed on a spine node because
there was no way to key it on the fact it names. It is also the pack's
`concept_violation` deviation on `11.e4`, *"the right break played at the wrong
time"*, seen from the other side.

#### 8.4 `rook-4v3-same-side` — Pack C's drift, the second independent attestation

Learner is **Black**, defending `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1`. The
author's unsayable sentence was *"You have not moved your king in four moves and
White's has crossed the fifth rank."*

```json
{
  "id": "king-must-walk",
  "label": "The king has four moves to start walking",
  "opens": { "fromStart": true },
  "closes": [
    { "kind": "position", "feature": {
      "kind": "quantified", "quantifier": "some",
      "over": { "squares": { "files": { "from": "a", "to": "h" }, "ranks": { "from": 5, "to": 8 } } },
      "feature": { "kind": "piece", "piece": { "color": "white", "role": "king" } } } },
    { "kind": "deadline", "afterLearnerMoves": 4 }
  ],
  "readiness": { "mode": "any", "of": [ { "piece": { "color": "black", "role": "king" } } ] },
  "luxuryMoveBudget": 2,
  "note": "The defence is lost by drift, not by one move. The rook may reposition twice; by the fourth defensive move the king must have started walking, or White's king crosses first."
}
```

| Line | Source | Verdict | ready | spend/budget |
|---|---|---|---|---|
| 1.Kf1 Kf8 2.Ke2 Ke7 3.Rd1 Ra8 4.Rd5 Ra2+ | spine | **`in_time`** | ✔ | 0/2 |
| 1.Kf1 Rd2 2.Ra8+ Kh7 3.Ra7 f6 | spine | **`open`** | ✔ | 1/2 |
| 1.Kf1 Rd2 2.Ke1 Rd4 3.f3 Kf8 | spine | **`open`** | ✔ | **2/2** (at the budget edge) |
| 1.e5 Rd5 2.f4 Kf8 3.Kf2 Ke7 | spine | **`open`** | ✔ | 1/2 |
| 1.h3 Rd2 2.Rb1 Rd4 3.h4 Rd2 4.Rc1 Rd4 | off-spine | **`too_slow`** | ✘ 0/1 | **4/2** |

**All four authored defensive lines pass; the drift that no authored line
contains fails.** The last row is the author's sentence, computed: four
defensive moves, no king move, verdict `too_slow` at the fourth. The `position`
close was verified separately against the shipped
`matchesStructuralExpression` (§2.4) and does not fire on any of these lines,
because White's king never reaches the fifth rank on them — which is the point:
the deadline bites first on the drift, and the position close is the backstop for
the slower loss.

This is `mode: "any"` readiness (any king move, from any square, to any square) —
a form no point trigger can express at all.

#### 8.5 What the authoring changed in the specification

The vocabulary was drafted, then authored against the three packs above, then
corrected. Recording this because "specified beforehand is designing in the dark"
is the reason the previous attempt was withdrawn
(`rfc/withdrawn/authoring-contracts-v03.md:118-124`):

1. **The closing move must not count as spend.** Found by §8.3: the correctly
   timed `h4` was charged as luxury and the right answer scored `over_budget`.
2. **Spend counts only while readiness is incomplete.** Found by §8.4: the main
   defensive line, in which the king walks on move 1 and then plays normally,
   scored `spend 3` and `over_budget`.
3. **Readiness must name every step of the plan, not only its launch.** Found by
   §8.2: with `readiness: [b2b4]` alone, `b5` — the plan's completion — was
   charged as luxury.
4. **`outpaced` must be a distinct verdict from `too_slow`.** Found by §8.1's
   `c5-immediate` branch: the first draft blamed a learner who had not moved.

Four corrections in four hours of authoring against three files is the measure
of how far a timing vocabulary specified without content would have been from
usable — and it is the reason §8's tables, not §3's prose, are the acceptance
fixture (Acceptance criterion 2).

### §9. Documentation the implementer updates

`docs/` is canonical description of what exists; this RFC does not edit it, and
the implementing commit must:

- `docs/drill-pack-format.md:52-54` — the trigger list loses the timing-window
  sentence and gains `atWindow`; a new paragraph describes `timingWindows`, the
  seven verdicts and the ledger rules.
- `docs/drill-client.md:71-75` — *"A timing window fires when its authored closing
  trigger matches"* is **false after this RFC** and is replaced by the projection
  description and the checkpoint/objective seam.
- `docs/branch-runtime.md` — window states join shape firings in the list of
  derived projections, with the rewind argument of §3.1.
- `docs/explanation-grounds.md` — the `tempo:` evidence family and its sentences.
- `docs/outcome-drill-grading.md` — the `preserve_plan_window` compilation table
  of §5b and the `degraded`-not-`failed` rule.
- `docs/structural-reading.md` — one line noting that `structuralExpression` is
  now also consumed by `position` closes.

### §10. Ledger rows this RFC ships

`design/` is intent tier and this RFC does not write to it. On landing, the
ledger's single writer flips these rows — **cited by row title, because
`design/BACKLOG.md` line numbers move on every ledger edit and did move during
this draft's cross-review**:

- **Tempo vocabulary encodes the wrong object (the E3 blocker)**
  🐞 → ✅ — the object is replaced, the budget has an evaluator, and both attested
  complaints are authored in §8.
- **B4 is blocked on tempo vocabulary, not on content effort** 💡 → ✅ —
  unblocked; B4's *structural/temporal* evidence layer (`design/03:284`) gains its
  temporal half. B4's own residual (Syzygy runtime rendering, evidence-bound LLM
  rendering) is untouched.
- **Tempo contract / timing windows (window opens/closes, luxury-move budget)**
  📐 → ✅.
- **Authored explanation vocabulary — claim `when` triggers, timing-window
  semantics …** — the *timing move-set* clause, named there as one of the three
  contracts that "genuinely lack a pin", is
  discharged; the other two clauses stay open.
- **E3** (`planning/exploration/gates.md:84`) — the timing half moves from unmet
  to *specified, pending authored windows in content*. E3 is not claimed met by
  this RFC: it is met when packs ship windows, which is content-tier work this
  RFC makes possible and does not do.
- **K7** (`:70`) — the timing half of the split criterion has a remedy on record;
  the kill-criterion evidence stays logged, as law 6 requires.
- **`design/04-content-architecture.md:228` DESIGN-GAP** (dossier §8.1) — the
  design requirement and the corpus can now agree. Closing it is a content-tier
  act and an owner ruling on whether §2d's *"one timing window per opening root"*
  survives contact with the new object.

## Deviations from design

1. **`design/04-content-architecture.md:130` — the content-transfer audit gains a
   row in the "no" column, honestly.** The audit lists `fenPredicate` and
   `materialBalance` as *"the only triggers that do"* transfer to Just Play.
   `atWindow` does **not** transfer: a window is defined over a path relative to
   an authored commitment, so it is anchored to the pack exactly as
   `atSpineNode` is. This RFC does not pretend otherwise and does not add a
   transferable trigger. The audit's verdict (§0a: authoring a pack contributes
   nothing to an unauthored game) is unchanged by this RFC and is not this RFC's
   problem to solve.
2. **`design/04-content-architecture.md:228` says "one timing window where the
   tempo contract bites" per opening root; §8.2 authors three in one middlegame
   pack.** The plan-exclusivity structure of the Carlsbad tabiya needs one window
   per plan class, and the format permits up to eight. This is a widening of the
   design's expectation, not a contradiction of it; whether §2d's per-root count
   should change is an owner ruling, raised not taken.
3. **The author's day-one readiness sketch is not encoded as written** (§8.1,
   final paragraph). Recorded as a deviation because the sketch is quoted in the
   dossier and in this RFC's Motivation, and a reader comparing the two deserves
   the reason rather than the discrepancy.
4. Otherwise: none. The verdict vocabulary is derived from
   `design/01-training-model.md:146-149`; the three worked packs are the three
   `design/04` §7 names them or the second attestation the dossier names.

## Acceptance criteria

1. **Schema.** `schemas/drill_pack.schema.json` `$id` reads `:0.17` and
   `DRILL_PACK_SCHEMA_VERSION` is `"0.17"`. Every JSON document under `content/`
   validates **unchanged** — 264 files at cross-review: 35 authored packs and
   6 browser fixtures with their sidecars, 150 candidates, 23 shape entries,
   17 source files. The **five** §8 windows validate (`c5-race`, `minority-race`,
   `kingside-hook`, `central-break`, `king-must-walk`). The re-homed and two new
   negative fixtures fail with the expected pointers. A pack using the **old**
   timing-window trigger fails at `/checkpoints/0/trigger`.
2. **The §8 tables are the fixture.** A test in `packages/runtime/src/tempo.test.ts`
   replays each of `anti-caro-advance`, `carlsbad-minority-attack` and
   `rook-4v3-same-side` from its committed `start.fen`, runs `windowStates` over
   every root-to-leaf spine path plus the six named off-spine lines, and asserts
   **every cell** of §8.1–§8.4: verdict, `ready`, `spend`, `budget`,
   `learnerMoves`, `closedBy`. Any drift in the algorithm fails a named row.
3. **Determinism under rewind.** One run, forked at the Carlsbad tabiya into the
   `Rab1` and `f3` branches, reports `minority-race` as `in_time` on one branch
   and `unopened` on the other **from the same run object**, with no window
   bookkeeping in the event log.
4. **`preserve_plan_window` executes.** A fixture pack of that type with **two**
   windows transitions `active → degraded` on window A's `too_slow` verdict and
   `degraded → preserved` on window B's later `in_time`, and the persisted
   `objective.state_changed` events carry `tempo:<a>.too-slow` and
   `tempo:<b>.in-time`. Two windows and not one, because §5b establishes that a
   single window can never move `degraded → preserved`. A **second** fixture, with
   one window, forks above the closing node and asserts the rewind case:
   `active → degraded` on the first branch and `active → preserved` on the
   sibling, from the same run object. A `preserve_plan_window` pack with no window
   is refused with `PLAN_WINDOW_NEEDS_WINDOW`.
5. **D8, all three legs.** `/capabilities` returns `tempoVerdicts` (7) and
   `tempoGradeable` (4); a pack whose success condition names `outpaced` is
   refused with `TEMPO_VERDICT_UNGRADEABLE` **quoting the published reason
   string**, and so is one naming `open`; and criterion 4's evidence refs are the
   applied record. A test binds the schema's `tempoVerdict` enum to the exported
   `AUTHORABLE_TEMPO_VERDICTS` — the six of `TEMPO_VERDICTS` minus `unopened`,
   which §2.6 keeps out of the schema deliberately — as ordered arrays, in the
   style of `packages/schema/src/drill-pack.test.ts:65-72`, plus an assertion that
   `TEMPO_VERDICTS` is exactly `AUTHORABLE_TEMPO_VERDICTS` plus `unopened` and that
   `TEMPO_GRADEABLE_VERDICTS` is a subset of it, so no pair can drift. Binding the
   schema enum to `TEMPO_VERDICTS` directly is **not** the test: the two have
   different lengths by design.
6. **No persisted movement.** `DRILL_RUN_SCHEMA_VERSION` is still `"0.13"`,
   `STORAGE_VERSION` is still 18, no migration file is added, and every stored run
   replays byte-identically.
7. **Refusal codes.** Each of the eight in §7.5 has a negative test producing that
   code at the documented JSON Pointer.
8. **`ENGINES_REQUIRED=1 make verify` green**, and `docs/` amended per §9.

## Open questions

1. **Should a window verdict eventually become a persisted event?** This RFC
   deliberately makes it a projection (§3.1) and states the cost: a verdict cannot
   be audited from stored events without recomputation, and a future change to the
   ledger rules silently re-scores historical runs. That is acceptable now — the
   same is already true of shape firings and line membership — and it becomes
   unacceptable the first time a tempo verdict is used outside the run that
   produced it (progression scheduling, cross-run comparison, a published record).
   **Named trigger:** the first consumer of a tempo verdict outside its own run.
   That RFC pays for the run-schema version and the migration; this one must not
   pre-pay for it.
2. **Is `outpaced` correctly ungraded?** §1.6 rules that a learner who was given
   fewer moves than the plan required is not judged. The counter-argument is real:
   in `carlsbad-minority-attack` the learner *chose* the move order that invited
   `...a5`, and `outpaced` declines to say so. This RFC keeps the judgment in the
   deviation note where the author already wrote it, because grading a learner for
   a consequence they had no move to avoid is the ADR-0005 failure. **This is a
   grading-honesty ruling and the owner may overturn it**; if overturned, the
   change is one entry moving from `DECLARED_UNGRADEABLE_VERDICTS` to
   `TEMPO_GRADEABLE_VERDICTS` and one row in §5b, with no schema movement.
3. **Is `too_slow` honest on a forced-release path?** §3.2 rule 2 now exempts a
   forced closing move from `premature`, so a learner who had one legal move is
   not accused of releasing the tension early. The exempted case falls through to
   `outpaced` or `too_slow`, and `too_slow` is a graded verdict. It is defensible —
   it says the plan was not complete when the window shut, which is true of the
   path regardless of who chose what — but it is the same class of grading-honesty
   question as open question 2 and the owner may want it ungraded too. Raised at
   cross-review, unexercised by any §8 line, and changeable later as one clause in
   the precedence table with no schema movement.
4. **Does `reasoningKeyPoint.ground` want a fifth kind, `{ kind: "timing", windowId }`?**
   §4.1 shows the `claim` ground already carries a tempo claim to the learner, so
   nothing is blocked. A timing ground would attribute the sentence to the window
   itself rather than to the author's prose, which is the more honest attribution.
   Deferred to whichever RFC next opens that union; not blocking.

## Changelog

- 2026-08-15: created. Drafted against `design/research/authored-transitions-and-features.md`
  (2026-08-15) and authored against `anti-caro-advance`, `carlsbad-minority-attack`
  and `rook-4v3-same-side` before the specification was frozen; four specification
  corrections came out of that authoring and are recorded in §8.5.
- 2026-08-15: adversarial cross-review by a second agent. Independently re-verified
  and unchanged: the 0/264 blast radius, every §8 verdict cell (re-derived from
  §3.2 by hand and all thirteen lines replayed for legality, mover and role with
  chessops 0.15.1), §2.4's three `position`-close evaluations against the shipped
  `matchesStructuralExpression`, D32's empty leaf set, `failed`'s terminality, the
  five-arm `successCondition` ordinal, and the eight refusal codes against code and
  sibling drafts. Six substantive corrections: the evaluator gained an injected
  trigger resolver because `simpleTriggerMatches` is server-private and
  `packages/runtime` cannot reach it (§3.1, §3.2 step 0); §3.2 rule 2 gained the
  forced-move guard so `premature` cannot accuse a learner with one legal move
  (§3.2, open question 3); §1.6 no longer claims `unopened` can drive a checkpoint,
  which §2.6 forbids; acceptance criterion 5's enum binding was impossible as
  written and now binds `AUTHORABLE_TEMPO_VERDICTS`; acceptance criterion 4's
  `degraded → preserved` was unreachable for a one-window pack and is now specified
  as two fixtures (§5b); §2.6's site list gained `pack-orchestrator.ts:300`. All
  schema, orchestrator and ledger citations were re-pinned against the 0.16 tree,
  which landed mid-review; ledger rows are now cited by title.
