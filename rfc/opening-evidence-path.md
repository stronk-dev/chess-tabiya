# RFC: The opening evidence path — grounding a claim no tablebase can settle

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/04-content-architecture.md` §2 (opening packs) and §8 (production model);
  `planning/content-era/plan.md` §3b (the graduation bar, which names *"Stockfish at fixed depth on
  the concrete line"* as a grounding route and has had no format to express it);
  `design/BACKLOG.md` row **"Two of three phases have NO evidence-attachment path"** and rows
  **D33**, **"Grounding pass over the 15 ungrounded opening packs"** — *cited by title, not by line:
  the ledger's line numbers moved twice while this draft was written*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration
  gate, `:83-89`). This is a defect RFC against a shipped system plus the minimum additive format to
  close the defect; it opens no new product surface.
- **Depends on:** `rfc/archive/grounding-pair.md` (`verify-draft`, `assessmentGrounding`, the
  sidecar trio), `rfc/archive/content-sourcing-foundation.md` (the closed evidence-kind vocabulary,
  the prose-template crossing rule, the human-only field list), `rfc/archive/outcome-drill-grading.md`
  (`objective.grading`, the `ledger_verified` chain), `rfc/archive/authoring-frictions.md` §1 (the
  `tablebase-walk` authoring-time walker this RFC's §7b is the engine sibling of) — **this dependency
  is satisfied**: authoring-frictions landed as `ffc9817` (pack schema 0.16) and `tablebase-walk`
  ships at `apps/server/src/sourcing/tablebase-walk.ts` with a `Makefile:66-69` target
- **Parent / amends:** amends `apps/server/src/pack-validation.ts`,
  `apps/server/src/sourcing/{verify-draft,ledger-validation,check}.ts`,
  `apps/web/src/lib/outcome-presentation.ts`, and `schemas/drill_pack.schema.json`
- **Supersedes / superseded by:** —
- **Planning:** `planning/opening-evidence-path/` (once implementing)

**Reading note on line numbers.** Every citation below was **re-read and corrected against the tree
at `a15a708`**, on 2026-08-15 during cross-review — that is, **after `validator-integrity` landed as
`047de02`**, so its extraction is committed fact rather than work in progress. The tree moved three
times under this document: `OBJECTIVE_GRADING_UNSUPPORTED` went `:451` → `:516` during drafting,
then `:516` → **`:274`** when validator-integrity extracted
`objectiveIssues` into an exported per-objective function, and then the RFC itself moved to
`rfc/archive/validator-integrity.md`. **Line numbers here are locators, not
identities.** Every `pack-validation.ts` claim is anchored to its **code literal**, every schema
claim to its `$defs` name, and a reviewer should grep the literal rather than trust the number.

**One structural consequence of that extraction, and it is normative for §2b:** `objectiveIssues`
is now called once for the top-level objective and **once per trajectory leg**
(`pack-validation.ts:667-670`). Every admission rule in §2 therefore has a leg case, which §2c
states explicitly rather than inheriting by accident.


> **OPEN QUESTION 7 CLOSED by claude (register coordinator), 2026-08-15 — NEITHER draft owns
> `/deviations/{i}/cost` evidence admission, and that is now stated rather than assumed.**
> `deviation-classes` (0.21) delegates the admission to "the evidence-path RFC (0.20)";
> `opening-evidence-path` (0.20) declines it. Each believing the other owns it is precisely the
> flow-back failure the RFC completion protocol was written against, so it is resolved here
> instead of at implementation time.
>
> **Resolution: `cost` ships AUTHOR-DECLARED AND UNBACKED, explicitly.** No evidence record binds
> it in either wave. The declared-vs-executable law applies to the honest form of that: the field
> is declared, no capability claims it is verified, and **no surface may render a `cost` as
> engine-confirmed**. A later RFC binds it to the `engine` evidence record that 0.20 introduces —
> ledgered as its own row so the gap is visible rather than inherited.
> Rationale: 0.20's evidence record attaches to the pack ROOT (`assessedBy`), while `cost` is
> per-deviation; binding them is a real design question about per-move evidence linkage, and
> neither wave scoped it. Shipping the field unbacked is honest; shipping it while each RFC
> assumes the other verified it is not.


> **CROSS-FILE CORRECTION, claude 2026-08-15 — §5b's `HUMAN_ONLY_POINTERS` alternation is
> insufficient once `deviation-classes` (0.21) lands, and the reason is a real bug rather than a
> naming quibble.** That RFC makes `mistake` a **multi-valued array** on the owner's ruling. A
> JSON pointer into an array element — `/deviations/0/mistake/1` — is **resolvable**
> (`check.ts:117`'s `resolvePointer` walks numeric segments), so an alternation anchored as
> `(class|offObjective|mistake)$` would refuse the *field* and silently **admit the element**,
> letting an evidence record support one member of a set the format declares human-only. The
> other two pointers are scalars and cannot express this.
>
> **Whichever RFC lands second must carry the element suffix**, i.e. the `mistake` arm reads
> `/^\/deviations\/\d+\/mistake(?:\/\d+)?$/`. If 0.20 lands first, this file's list is correct
> as written for the two scalars and `deviation-classes` adds the third arm with its suffix; if
> 0.21 lands first, this file must not narrow the arm back to `$`. Recorded here so the
> implementer sees it in whichever file they open first — this is the same unowned-seam failure
> the `cost` hand-off produced, caught before it shipped rather than after.

## Summary

Two of the product's three phases have no way to attach evidence to a pack. All **20** opening packs
declare `follow_theory` or `play_until_checkpoint`; `pack-validation.ts` refuses (literal
`OBJECTIVE_GRADING_UNSUPPORTED`, `:274` at time of reading) `objective.grading` on any non-outcome,
non-trajectory objective; and `verify-draft.ts:124` refuses any pack whose `assessedBy.kind` is not
`syzygy`. So an opening pack
**cannot declare an assessment, cannot be `ledger_verified`, and cannot emit an `*.evidence.json`
sidecar** — the whole authoring-evidence machine is reachable only by outcome packs inside seven
pieces. Wave G1 hit this from the opening side after B+N hit the identical hole from the trajectory
side (D33), and G1's engine evidence — 387 depth-22 jobs that refuted eight authored claims,
including a piece blunder captioned as an even trade — went into `provenance.engineValidation`,
which validates only because `provenance` is `additionalProperties: true`. **Nothing validates its
shape and no registry reads it. Honest storage, not grounding.** Wave 4b then added the Scandinavian
pair by the same route, refuting six more claims into the same unread field.

This RFC specifies the opening half of the fix. It states what grounding can and cannot mean when
the instrument is a depth-limited search rather than a solved table (§1); admits `objective.grading`
carrying only an `assessedBy` on every **root** objective type — and refuses it on trajectory legs,
which have no static entry position — generalizing `rfc/archive/validator-integrity.md`'s
line that **`successConditions` are grading and `assessedBy` is grounding** (§2); adds an `engine`
member to `assessedBy` whose admission checks the *instrument*, not only the number (§3–§4); makes
the boundary of what may never be grounded machine-enforced on the path openings will actually use,
where today it is not enforced at all (§5); states how corpus and engine evidence coexist in one
ledger and fixes the merge bug that would destroy one with the other (§6); and turns `verify-draft`
into an instrument-dispatching admission grounder with an `engine-walk` authoring-time sibling (§7).

**Register claims, stated loudly and repeated in §0: pack schema 0.20.** No migration. No
run-schema change. No shape-entry schema change. One shipped refusal code is **retired**
(`VERIFY_ASSESSMENT_NOT_SYZYGY`), one is **narrowed to trajectory legs**
(`OBJECTIVE_GRADING_UNSUPPORTED`, §2c), and one shipped by the now-archived `validator-integrity`
is **generalized** (§11).

## Motivation

### The hole, attested twice from opposite directions on 2026-08-15

`planning/content-era/log.md` §"2026-08-15 — Grounding wave G1", under the heading *"The finding
that matters most: there is no grounding path for an opening claim"*:

> `make verify-draft FILE=content/drafts/anti-caro-advance.json` →
> `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY] objective.grading.assessedBy.kind must be syzygy`. That is
> not a tablebase-range accident that a Stockfish branch could fix later, because the slot itself
> does not exist.

Re-derived from the files during cross-review, on the tree at `ffc9817`: **23** pack documents in
`content/drafts/` carry `phase: "opening"`; three are browser fixtures
(`line-boundary.browser.json`, `outcome-hold.browser.json`, `outcome-resist.browser.json`), leaving
**20** content packs — 17 `follow_theory` and 3 `play_until_checkpoint`
(`opening-principles-white`, `opening-principles-black`, `opponent-intent-early-queen`). **Every one
of the 20 has no `objective.grading` and no `*.evidence.json` sidecar, and every one carries a
`provenance.engineValidation` block.**

**The count moved under this draft and the drafting number was 18.** G1 derived 18 and this RFC was
written against that; wave 4b then added `scandinavian-mainline-black` and `anti-scandinavian-white`
(commit `ae8aab7`, 2026-08-15), both engine-passed by the same throwaway harness and both landing
their numbers in `provenance.engineValidation`. **Every "18" in the rest of this document has been
corrected to 20**, and the migration in §8 is sized for 20. Where a number is G1's own measurement
of its own 18-pack pass — the 387 jobs, the 214 seconds, the eight refuted claims — it is left as
G1's and labelled as such, because re-attributing a measurement to a corpus it did not cover is the
forgery this RFC exists to prevent.

The trajectory side is D33, and `rfc/archive/validator-integrity.md` §4 fixed it — **it is no longer
a parallel draft; it landed as `047de02`**, extracting `objectiveIssues` and shipping
`TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED`. Its argument is adopted
here rather than restated: `assessedBy` is a claim about the **root position**, the client renders it
as *"Root assessment: …"* (`apps/web/src/lib/outcome-presentation.ts:42-53`), `assessmentGrounding`
matches it against a ledger record whose `supports` includes `/start/fen`
(`apps/server/src/sourcing/ledger-validation.ts:395-406`), and every pack has a static root. This
RFC generalizes that argument from one objective type to all of them **at the pack root**, and
supplies the second instrument the opening case needs. The generalization stops at the root: §2c
holds the line for legs, which have no static entry position and therefore no groundable claim.

### Why the evidence is urgent rather than tidy

G1's engine pass was the first mechanical instrument ever applied to opening content, and it refuted
**eight authored claims across the 18 packs it covered** (wave 4b refuted six more across the two it
added). The worst:

> `anti-caro-advance-early-c5` authored a piece blunder into a spine mainline, and annotated it as
> an even trade. The line 5.Be3 Bxc5 6.Bxc5 was captioned "Material is level again and the position
> is the receipt". It is not: after 6.Bxc5 Black has **no legal recapture on c5**, material is 38-35
> and the position evaluates **+4.54** for White.

That error survived authoring, `pack-check`, and every review the pipeline has, and was caught only
because a human read a number next to a caption. The format's job is to make that number *durable
and re-checkable* rather than a one-off. Today it is neither: `provenance.engineValidation` is a
convention one wave invented, `sourcing-check` does not know it exists, and the next author has no
way to tell a checked pack from an unchecked one.

### Scope boundary

**In scope:** the evidence-attachment path for non-outcome objectives; the `engine` assessment member
and its admission; the record-level boundary of what may be grounded, on the *draft* path; the
coexistence of corpus and engine evidence in one ledger; `verify-draft`'s instrument dispatch and its
authoring-time sibling; the migration of the 20 `provenance.engineValidation` blocks.

**Out of scope, explicitly:** everything `rfc/archive/validator-integrity.md` owns — total rule compilation,
per-leg parity, and the `run_trajectory` grading admission (§11 states the composition). Any change
to deviation classes, to the guard, or to what a rule *means* once compiled. Any new objective type,
predicate or condition kind. Any change to the syzygy path's queries, records or refusals. Any
runtime engine behaviour: `strong_engine` and D35 are untouched (§3d scopes the one determinism fix
to the authoring path and says so). And **authored prose is not made groundable by this RFC** — §5
is mostly a list of things this RFC refuses to pretend it can do.

## Specification

### §0. Register claims

- **Pack schema version: 0.20 is claimed here.** `$id` in `$id`, `schemas/drill_pack.schema.json:3` moves
  to `urn:chess-tabiya:schema:drill-pack:0.20`; `DRILL_PACK_SCHEMA_VERSION`
  (`packages/schema/src/index.ts:2`) and the pinned expectation in
  `packages/schema/src/drill-pack.test.ts` move with it. The lane is claimed on the reading that
  0.16 is `authoring-frictions` (**landed**, `ffc9817`; the tree reads `0.16` today), 0.17
  `tempo-vocabulary`, 0.18 `predicate-wave-3`, and 0.19 is
  `validator-integrity`'s contingent reservation which it declined and recommended to a follow-up.
  `rfc/deviation-classes.md` claims **0.21** and names this RFC as the 0.20 holder in its own §0,
  so the two lanes are agreed on both sides (§11).
  **This RFC does not edit `rfc/README.md`**; the register row is claimed in this text and the
  single writer of that file lands it.
- **The 0.20 change is exactly one and it is additive:** `$defs/objectiveGrading.assessedBy`
  (`$defs/objectiveGrading`, `schemas/drill_pack.schema.json:235`) gains a third `oneOf` member, `kind: "engine"`. No existing
  member changes. **Verified during cross-review against the current tree:** all 43 pack documents
  in `content/drafts/`, all 36 `content/candidates/*/pack.json` and every fixture in
  `schemas/fixtures/drill-pack/` are unaffected — none carries an `assessedBy` outside the two
  existing members, so adding a third `oneOf` arm cannot change any existing validation verdict.
  Pack digests are content digests and
  do not include the `$id` (`packages/schema/src/drill-pack/digest.ts`), so **no committed digest
  moves from the schema bump** — the 20 opening packs' digests move for a different reason, because
  §8 edits their `provenance`, and §8 says so.
- **No migration is claimed. No run-schema change.** Nothing persisted changes shape: this RFC adds
  no event, no event field and no vocabulary value to `schemas/drill_run.schema.json`.
  `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are untouched. Run schema 0.14 and migration 19
  are `resistance-spectrum`'s and are not contested.
- **No shape-entry schema change.** `shape_entry.schema.json` is not read or written by anything
  here.
- **One shipped refusal code is retired:** `VERIFY_ASSESSMENT_NOT_SYZYGY` (§7a). It is documented in
  `rfc/archive/grounding-pair.md:98`; retiring it is stated there rather than discovered later.
  **Verified in cross-review that nothing else depends on it:** the only production reference is the
  throw at `verify-draft.ts:124`. Every other occurrence is a *description of the pre-fix tree* and
  stays true of that tree — `rfc/archive/validator-integrity.md:99` and `:998` (acceptance assertions),
  `design/BACKLOG.md:121` (D33), `planning/content-era/log.md:1420` and `:1600`, and
  `graduationBlockers` prose in five committed drafts (`leningrad-dutch-black`,
  `opponent-intent-early-queen`, `italian-center-attack-white`, `london-system-white`,
  `trajectory-mate-bishop-knight`). §8's migration rewrites those five blockers in the same commit
  that makes their text false; the log entries are append-only and stay.
- **One shipped refusal code is narrowed, not retired:** `OBJECTIVE_GRADING_UNSUPPORTED` survives at
  the leg pointer (§2c). The draft claimed it was retired outright; that claim was wrong.
- **One new prose template id:** `engine-move-loss/v1` (§5c). Template ids are a compile-time table
  (`rfc/archive/content-sourcing-foundation.md` §3.3), not a schema version.
- **No new evidence kind.** `engine_eval` already exists in the closed vocabulary
  (`apps/server/src/sourcing/types.ts:57-65`) with a producer, a validator and a licence rationale.
  Adding a kind would require an RFC amendment; this RFC deliberately does not need one.

### §1. What grounding means for a claim no tablebase can settle

This is the question the RFC exists to answer, and getting it wrong in either direction is fatal.
Overclaiming produces the named anti-pattern — *"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5
centralizes the knight'"* is a dashboard, not a drill. Underclaiming leaves 20 packs permanently
ungroundable and the piece blunder in §Motivation permanently uncheckable.

#### 1a. A tablebase settles; an engine measures

The shipped syzygy path can be terse because a tablebase answer is a **result**: a total function of
the position, immutable, independent of the instrument that read it. The runtime caches a successful
probe with `expiresAt: Number.POSITIVE_INFINITY` (`apps/server/src/tablebase.ts:22`) precisely
because *a tablebase answer for a fixed FEN cannot change*. That is why `assessmentGrounding` can
match a declaration against a record on `category` and `pieceCount` alone
(`ledger-validation.ts:395-406`) and why `verify-draft` may refuse a spine move that worsens the
learner-perspective category (`verify-draft.ts:144-147`): the category *is* the truth, so a change
in it is an error in the content.

A depth-limited search produces no such thing. Stockfish 18 at depth 22 returns a **measurement**:
the output of a named binary, at a named budget, on a named position, at a named time. A deeper
search, a different binary, or a different net can return a different number without either number
being wrong. The number is not a fact about chess; it is a fact about an instrument reading chess.

**The rule this produces, and it is the RFC's central claim:**

> **A tablebase record grounds a claim by settling it. An engine record grounds a claim by making
> it falsifiable at a named cost.** The record must name an instrument, a budget, a comparison set
> and a date such that any reviewer can re-run exactly that measurement and get exactly that number
> or a refutation. A claim an engine record supports may assert no more than re-running can check.

Three consequences follow, and each is a normative constraint below:

1. **The assessment vocabulary must be an evaluation, not a result.** `category: "win" | "draw" |
   "loss"` is result vocabulary and the engine member does not get it (§3a). An engine mate score is
   recorded as a measurement like any other and is **never** converted into a category. The shipped
   rule that `engine_eval` cannot substitute for `tablebase_result` on the same ≤7-piece position
   (`apps/server/src/sourcing/check.ts:165-168`) is the same principle already in force; §4c extends
   it rather than restating it.
2. **The instrument must be part of the admission, not decoration.** It is not enough that a record
   exists with the right number: the record's linked manifest entry must be an
   `origin.kind: "engine"` entry whose budget and profile match what the declaration claims (§4b,
   condition 12). Otherwise "grounded" degrades to "someone typed a number into a JSON file", which
   is what `provenance.engineValidation` already is. **This raises the cost of a false claim; it
   does not make one impossible, and §4b(12) states exactly how far it reaches.**
3. **The limits must be *in* the record, because the engine cannot abstain.** The tablebase path
   signals ignorance structurally: out of range becomes an explicit `EvidenceAbstention` with reason
   `out_of_range` (`verify-draft.ts:160-161`). An engine evaluates any legal position, so an opening
   pack's ledger has **no holes by construction** — which removes the one signal the tablebase path
   uses to say "I don't know". The record must therefore carry its own limits explicitly, and the
   rendered sentence must carry them too (§5c).

#### 1b. The two limits G1 measured and the format does not carry

G1's own `provenance.engineValidation.unit` states both, in prose that no validator reads:

> centipawns from the side to move at the decision position; loss = the best evaluated candidate at
> that position minus this move. **Candidate-relative and therefore a lower bound on the true
> loss**: only authored moves plus the engine's depth-22 first move were evaluated, not all legal
> moves.

- **Perspective.** The shipped executor returns `centipawns` in **white** perspective —
  `whitePerspectiveScore` negates the UCI score when it is Black to move
  (`apps/server/src/evidence-queue.ts:76-80`). G1's sidecar recorded side-to-move. A number whose
  perspective is inferred rather than stated is the error class `rfc/archive/authoring-frictions.md` §1
  already names — *"the wave-5c enumeration errors were perspective errors"*. §3a pins
  `perspective` to the single value the shipped code produces, as a recorded `const`, so there is
  nothing to infer and nothing to convert.
- **Comparison set.** "This move loses 20cp" is unfalsifiable without the set it lost 20cp *to*.
  §5c's template therefore names the comparison set and the lower-bound qualifier **inside the
  rendered sentence**, not in a footnote a reader may not reach.

#### 1c. What an engine record still cannot ground, stated before anything is built

The root assessment of an opening pack — say, +0.40 at depth 22 for the position after
1.e4 c6 2.d4 d5 3.e5 c5 4.dxc5 — grounds the statement *"this binary at this depth on this date
evaluated this position at +0.40 for White"*. It does not ground the pack's teaching, its plan
classes, its deviation classes, or one word of its prose. **After this RFC an opening pack can be
`ledger_verified` and still have every strategic assertion in it ungrounded.** §5 makes that
boundary machine-enforced and §9 makes the rendered sentence say what was actually verified, so that
`ledger_verified` can never be read as "this pack is verified".

### §2. Where the assessment attaches

#### 2a. The trajectory RFC's line generalizes verbatim

`rfc/archive/validator-integrity.md` §4a draws the separation this RFC adopts:

> **`successConditions` are grading. `assessedBy` is grounding.**

Applied to `run_trajectory`, that argument admits a top-level `grading` on a type that grades
through its legs, because the *root* is static even though the grading is not. Applied to
`follow_theory` and `play_until_checkpoint`, the same argument admits a top-level `grading` on types
that do not grade to an outcome at all, for the same reason: the root is static.

The generalization is not a stretch, it is the same sentence with the type quantifier removed —
**but the quantifier that comes off is over *types*, not over *objectives*.** The premise is
`pack.start`, and `pack.start` belongs to the pack, not to the objective. So the correct
generalization is: **every objective type has exactly one static root *when it is the pack's root
objective*, so every root objective can carry a claim about that root.** A trajectory *leg* has no
static entry position (§2c). `pack.start` is required for every pack;
`assessedBy` is read by three shipped consumers
that never consult `objective.type` — `assessmentGrounding` (`ledger-validation.ts:380-407`),
`verify-draft` (`:123-124`), and `assessmentSentence` (`outcome-presentation.ts:42-53`) — plus
`projectPackDocument`, which injects the grounding verdict into the projected grading
(`apps/server/src/pack-registry.ts:92-95`). **All four read `document.objective` — the pack root —
and none of them has a leg form.**

#### 2b. The admission rule (root objectives)

`OBJECTIVE_GRADING_UNSUPPORTED` (literal at `pack-validation.ts:274`; the emitting block is the
`!outcomeObjective && !trajectoryObjective && grading !== undefined` arm, inside the exported
`objectiveIssues` that `validator-integrity` extracted) currently
fires whenever `grading` is present on any type outside `["win", "hold", "save", "resist"]` and
outside `run_trajectory`. It is
**retired and replaced** by a rule that separates the two halves of `grading`:

> On a **root** objective, `objective.grading` is admitted on **every** objective type.
> `grading.resolveAt.kind: "checkpoint"` is admitted **only** on the four outcome types — the only
> types whose compiled rule set consumes it (`apps/server/src/pack-orchestrator.ts:306-319`). On
> every other type it is refused with `OBJECTIVE_GRADING_RESOLUTION_INERT` at
> `/objective/grading/resolveAt`.

`OBJECTIVE_GRADING_REQUIRED` (literal at `pack-validation.ts:270`) is **unchanged**: the four outcome types
must still declare `grading`; every other type declares it only when it has root evidence, exactly as
a trajectory does under `archive/validator-integrity` §4b(2).

**Why `resolveAt` is refused rather than ignored.** This is the silent-no-op class
`rfc/archive/validator-integrity.md` §1 forbids, and it was checked type by type against the compiler rather
than assumed:

| Objective family | Count | Does `objectiveRules` read `grading.resolveAt`? | Where |
|---|---|---|---|
| `win` / `hold` / `save` / `resist` | 4 | **yes** — the `active → preserved` resolution rule, and `resist`'s loss exemption | `pack-orchestrator.ts:306-319`, `:289-300` |
| `follow_theory` | 1 | **no.** Resolution comes from the `atAuthoredBoundary` checkpoint, found independently of `grading` | `pack-orchestrator.ts:243-252` |
| `play_until_checkpoint`, the five plan types | 6 | **no.** The non-outcome arm returns `conditionRules` only | `pack-orchestrator.ts:261-266` |
| `run_trajectory` | 1 | **no** — returns `[]` | `pack-orchestrator.ts:214` |

`OBJECTIVE_TYPES` has **twelve** members (`packages/schema/src/drill-pack/types.ts:1-14`) and four
of them are outcome types, so the non-outcome set is **eight**: the five plan types
(`reach_structure`, `preserve_plan_window`, `execute_break`, `prevent_opponent_plan`,
`transition_to_endgame`), plus `play_until_checkpoint`, `follow_theory` and `run_trajectory`. **The
draft said "nine" throughout; the arithmetic is eight, and the table above was always the authority
— it sums to eight.** Corrected in cross-review everywhere it appeared.

So on eight of twelve types a checkpoint resolution compiles to nothing, fires never, and reads to an
author as though it configured something. Refusal is the only honest option.

**`resolveAt: {"kind": "terminal"}` remains required and inert on those eight types, and this is a
wart stated rather than hidden.** `$defs/objectiveGrading` requires both `assessedBy` and `resolveAt`
(`$defs/objectiveGrading`, `schemas/drill_pack.schema.json:233`). Making `resolveAt` optional was considered and **rejected**:
`apps/web/src/lib/outcome-presentation.ts` reads `grading.resolveAt.kind` through an optional chain
that guards only `grading` (`DrillScreen.svelte:252-256` reads `grading?.resolveAt.kind`), so an
absent `resolveAt` is a client `TypeError`. Requiring an inert `{"kind": "terminal"}` costs one line
of JSON per pack, matches what `archive/validator-integrity` §4b(3) requires of a trajectory, and breaks
nothing. The consolidation — lifting `assessedBy` out of `grading` entirely, which is where the
argument actually points — is named in §Open questions, deliberately not taken here, because taking
it would fork four shipped readers in the same RFC that is trying to unfork one.

#### 2c. Legs: the generalization stops here, and it must be said out loud

**Added in cross-review; the draft did not have this section and its absence was a defect.**

`validator-integrity` extracted `objectiveIssues` and now calls it **once per leg** as well as for
the root (`pack-validation.ts:667-670`). §2b as originally drafted retired
`OBJECTIVE_GRADING_UNSUPPORTED` outright, which — under the extracted call site — would have admitted
`objective.grading` on a **trajectory leg** of any type, including an `engine` assessment on a
`follow_theory` leg.

That would be a new instance of exactly the defect this RFC refuses:

- **A leg has no static root.** A leg's entry position is reached by play through the preceding legs.
  This is the stated reason `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` exists — *"leg entry positions are
  not statically bound to a Syzygy record"* (`pack-validation.ts:565`) — and nothing about swapping
  the tablebase for an engine changes it.
- **A leg assessment could never be `ledger_verified`.** §4b condition 3 requires
  `record.values.fen === document.start.fen`, and §4b condition 10 requires
  `supports.includes("/start/fen")`. Both are pack-root pointers. `assessmentGrounding` reads
  `input.document.objective.grading` (`ledger-validation.ts:385`) and has no leg form at all. A leg
  `assessedBy` would therefore be a declaration nothing can ever verify and nothing ever reads —
  the silent no-op class, in a section written to eliminate one.

**The rule.** `objective.grading` on a **leg** keeps the shipped outcome-only admission:

> A leg objective admits `grading` only on the four outcome types. A non-outcome leg with `grading`
> is refused with `OBJECTIVE_GRADING_UNSUPPORTED` at `/legs/{i}/objective/grading` — the shipped
> code, retained with its shipped meaning at the leg pointer only.
>
> A leg objective's `assessedBy` may not be `kind: "engine"`, refused with
> **`TRAJECTORY_LEG_ENGINE_UNSUPPORTED`** at `/legs/{i}/objective/grading/assessedBy`, the exact
> sibling of `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` (`pack-validation.ts:565`) and for the identical
> reason. A leg may still carry `kind: "authored"`, which claims no instrument.

So `OBJECTIVE_GRADING_UNSUPPORTED` is **not retired** after all; it is **narrowed to legs**. §0 and
§10 are corrected accordingly, and §11's composition with `validator-integrity` is restated on that
basis. `TRAJECTORY_LEG_ENGINE_UNSUPPORTED` is a **new code added in cross-review**; §10 carries the
full register and its collision sweep.

**Corpus impact: none, and this was derived rather than assumed.** Four committed documents carry
`legs` (`trajectory-mate-bishop-knight`, `trajectory-qgd-exchange-minority`,
`trajectory-caro-advance-chain-bishops`, `trajectory-legs.browser.json`), twelve legs in total. Every
leg that carries `grading` is a **final outcome leg** (`hold` / `win` ×3) and every one of them
declares `assessedBy.kind: "authored"`. **No non-outcome leg carries `grading`, and no leg carries
`syzygy` or would carry `engine`.** So the narrowed rule refuses nothing that exists — which is also
why `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` has never fired on committed content, and why it must stay
armed rather than be read as dead code.

### §3. The `engine` assessment member (pack schema 0.20)

#### 3a. The shape

`$defs/objectiveGrading.assessedBy` gains a third `oneOf` member. The two existing members are byte-
unchanged.

```json
{
  "type": "object",
  "required": ["kind", "score", "perspective", "depth", "engineId", "engineVersion",
               "sourceId", "retrievedAt"],
  "properties": {
    "kind": { "const": "engine" },
    "score": {
      "oneOf": [
        { "type": "object", "required": ["kind", "centipawns"],
          "properties": { "kind": { "const": "cp" },
                          "centipawns": { "type": "integer", "minimum": -10000, "maximum": 10000 } },
          "additionalProperties": false },
        { "type": "object", "required": ["kind", "movesToMate"],
          "properties": { "kind": { "const": "mate" },
                          "movesToMate": { "type": "integer", "minimum": -500, "maximum": 500 } },
          "additionalProperties": false }
      ]
    },
    "perspective": { "const": "white" },
    "depth": { "type": "integer", "minimum": 1, "maximum": 99 },
    "engineId": { "$ref": "#/$defs/nonEmptyString" },
    "engineVersion": { "$ref": "#/$defs/nonEmptyString" },
    "sourceId": { "$ref": "#/$defs/nonEmptyString" },
    "retrievedAt": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

Four shape decisions, each with its reason:

- **`score` is a discriminated union, not a nullable pair.** A cp score and a mate score are
  different measurements; a single `centipawns` field with a sentinel would invite arithmetic across
  the boundary. `movesToMate` carries the engine's sign convention unchanged and is **never** mapped
  to `category` (§1a, consequence 1).
- **`perspective` is a `const`, not an enum.** The one producer emits white-perspective scores
  (`evidence-queue.ts:76-80`). Recording the constant makes the record self-describing without
  admitting a second convention that would need conversion code, and it kills the wave-5c error
  class by construction rather than by discipline.
- **No `threads` / `hashMb` / `multiPv` / `timeoutMs`.** The instrument's profile belongs to the
  **source entry**, where it already lives as `SourceOrigin.engine.profile`
  (`apps/server/src/sourcing/types.ts:31-42`), and the ledger already binds record to entry through
  `linkage` on `(sourceId, retrievedAt)`. Duplicating the profile into the pack would create two
  places for it to disagree. §4b condition 12 checks the entry, which is the copy that came from the
  process that ran the search.
- **`sourceId` is a `nonEmptyString`, not a `const`.** The syzygy member pins `sourceId: "syzygy"`
  because there is exactly one tablebase source. There is not exactly one engine, which is the whole
  point of recording which one.

An example, matching what §7a's emitter writes for `anti-caro-advance-early-c5`:

```json
"objective": {
  "type": "follow_theory",
  "summary": "…",
  "grading": {
    "assessedBy": {
      "kind": "engine",
      "score": { "kind": "cp", "centipawns": 42 },
      "perspective": "white",
      "depth": 22,
      "engineId": "stockfish-authoring",
      "engineVersion": "18",
      "sourceId": "stockfish-authoring",
      "retrievedAt": "2026-08-15T09:41:12.004Z"
    },
    "resolveAt": { "kind": "terminal" }
  }
}
```

#### 3b. Refusals on the member itself

| Code | Fires when | Pointer |
|---|---|---|
| `ENGINE_ASSESSMENT_DEPTH_BELOW_FLOOR` | `depth` is below the authoring floor (`AUTHORING_PROFILE.depth`, `apps/server/src/sourcing/syzygy.ts:20`, currently 22) | `/objective/grading/assessedBy/depth` |
| `ENGINE_ASSESSMENT_ON_TABLEBASE_ROOT` | the root has ≤7 pieces, where a `syzygy` assessment is available and exact | `/objective/grading/assessedBy/kind` |

The second is the pack-level sibling of the shipped record-level rule that `engine_eval` cannot
substitute for `tablebase_result` on the same ≤7-piece position (`check.ts:165-168`). A measurement
may not stand in for a result where the result is obtainable. It is stated at the assessment level
because the record-level rule fires only when both records happen to be present, which is exactly
the case an author trying to shortcut would not produce. Piece count is machine-counted with the
shipped `countFenPieces` (`apps/server/src/sourcing/chess-facts.ts`).

The first is a floor, not a judgement: it fixes the instrument's minimum budget so that "grounded"
means one comparable thing across the corpus, and it is enforced against the repo's own constant so
raising the profile raises the floor.

#### 3c. What the member does **not** get

- **No `category`.** §1a, consequence 1.
- **No `movetimeMs` budget.** The shipped record validator already forbids `movetimeMs` and
  `requestedMovetimeMs` in `engine_eval` values (`check.ts:160-164`); the assessment inherits that by
  having no field for it. A movetime budget is wall-clock-dependent and therefore not re-runnable,
  which fails §1a's test outright.
- **No `bestMove` or PV.** A principal variation is a search artefact, not a claim about the root,
  and putting it in the pack would invite prose to be written from it.

#### 3d. Reproducibility: one scoped determinism fix

§1a's rule requires that re-running the measurement returns the same number. With `Threads: 1`, a
fixed `Hash`, `MultiPV: 1` and a fixed `depth` — the whole of `AUTHORING_PROFILE` — a Stockfish
search is deterministic **for a given binary and net**, except that a hash table retained from a
previous search changes the search. The server sends no `ucinewgame` and no hash clear anywhere
(this is the mechanism half of **D35**, which found it on the runtime `strong_engine` path).

**This RFC requires `ucinewgame` and a `Clear Hash` before every authoring evaluation**, in
`createPositionSeedEngineEvaluator` (`apps/server/src/sourcing/position-seeds.ts:68-83`) and
therefore in every consumer of it, including §7's engine path. Two boundaries, stated:

- **It does not close D35.** D35 is about `strong_engine` at runtime, whose non-determinism also has
  a `go movetime` half (`opponent-selector.ts`); nothing there is touched. This removes the shared
  mechanism from the *evidence* path only.
- **It does not make the number portable across binaries.** A different Stockfish version or net can
  return a different score at the same depth. That is why `engineVersion` is in the declaration, in
  the record and in the admission: a mismatch on re-verification is an **instrument change**, and
  the author is told so rather than told they were wrong about chess. `VERIFY_ASSESSMENT_CONTRADICTED`
  (§7a) is the shipped code for that, with a message that names the instrument.

Whether the NNUE net identity (`EvalFile`) must also be recorded is in §Open questions; it is a real
gap and the RFC does not paper over it.

### §4. The evidence record and the admission

#### 4a. No new record vocabulary

The `engine_eval` kind, its producer, its values contract and its licence rationale all ship. The
values shape is exactly what `createPositionSeedEngineEvaluator` already emits
(`position-seeds.ts:68-83`) — `{fen, engineId, requestedDepth, centipawns | mateIn, depth, threads,
hashMb, multiPv, timeoutMs, engineName, engineVersion}` — validated by `check.ts:160-164`, which
requires identity, depth, threads, hashMb, multiPv and timeoutMs and forbids movetime.

**One value is added:** `"perspective": "white"`, for the reason in §3a. `engine_eval` values are
validated by presence-of-required-keys rather than `exactKeys`, so this is additive and no committed
ledger becomes invalid.

Two record roles, both `kind: "engine_eval"`:

| Role | One per | `supports` | Extra values |
|---|---|---|---|
| **position record** | every position `enumerate` yields (`verify-draft.ts:62-82`): the root, every spine node's resulting position, every authored deviation's resulting position | the pointer that produced it — `/start/fen`, `/spine/…/moveUci`, `/deviations/{i}/moveUci` | — |
| **comparison record** | each templated `feedbackClaims[].text` (§5c) | exactly one `/feedbackClaims/{i}/text` | `atFen`, `moveSan`, `bestSan`, `lossCp`, `candidates[]`, and `templateId: "engine-move-loss/v1"` |

Position records are emitted for **every** enumerated position, so an engine-assessed pack's ledger
covers its whole authored surface by construction — the point from §1a consequence 3, made
structural. Comparison records are optional and author-driven, because deciding which claim is worth
a sentence is an authoring decision.

#### 4b. `assessmentGrounding` grows an engine arm

The shipped function returns `ledger_verified` only when `assessedBy.kind === "syzygy"`
(`ledger-validation.ts:385-386`) and exactly one record satisfies **nine** conditions (`:395-406`). The
engine arm is its sibling, with the same "exactly one match" discipline and **three additional
conditions that check the instrument**:

For `assessedBy.kind === "engine"`, `ledger_verified` requires exactly one `record` in the ledger
with:

1. `record.kind === "engine_eval"`
2. `record.grounds === "machine_validation"`
3. `record.values.fen === document.start.fen`
4. the score matches: `record.values.centipawns === assessedBy.score.centipawns` when
   `score.kind === "cp"`, or `record.values.mateIn === assessedBy.score.movesToMate` when
   `score.kind === "mate"` — and the *other* value key is absent
5. `record.values.perspective === "white"` and `assessedBy.perspective === "white"`
6. `record.values.depth === assessedBy.depth`
7. `record.values.multiPv === 1`
8. `record.values.engineId === assessedBy.engineId` and
   `record.values.engineVersion === assessedBy.engineVersion`
9. `record.sourceId === assessedBy.sourceId` and `record.retrievedAt === assessedBy.retrievedAt`
10. `record.supports.includes("/start/fen")`
11. `ledger.packId === document.id`
12. **the instrument conditions** — the manifest entry `linkage` binds this record to has
    `origin.kind === "engine"`, `origin.fen === document.start.fen`,
    `origin.budget.depth === assessedBy.depth` (and `origin.budget` has no `movetimeMs`),
    `origin.engineVersion === assessedBy.engineVersion`, and `origin.profile.multiPv === 1`

Conditions 1–11 mirror the shipped nine one for one, with the result vocabulary replaced by the
measurement vocabulary. **Condition 12 is the one that makes this grounding rather than bookkeeping**
(§1a, consequence 2): it is the only check that reads the entry written by the process that ran the
search.

**How far condition 12 actually reaches, tested rather than asserted (corrected in cross-review).**
The draft claimed a hand-typed number "cannot satisfy" condition 12 "without also forging a manifest
entry that `linkage` and the job digest would then have to agree with". That overstates it, and the
overstatement was traced through the shipped path:

- `linkage` binds a record to an entry on `(sourceId, retrievedAt)` only
  (`ledger-validation.ts:318-353`). A forger writes both sides of that pair, so it constrains
  nothing an author cannot arrange.
- `validateOrigin`'s engine arm (`ledger-validation.ts:143-180`) is **purely structural**: it checks
  that `profile` has exactly `{threads, hashMb, multiPv}` as positive integers and `budget` has
  exactly `{depth}` or `{movetimeMs}`. It has no way to know whether an engine ever ran.
- The job digest is `sha256({pipeline, args, sourceEtags})` (`canonical.ts:20-26`), and
  `verify-draft` passes `null` for every non-`http` origin's etag (`:179`). For an all-engine run
  **every etag is `null`**, so `emissionJobDigest` reduces to a hash of the pipeline name, the file
  path and the offline flag. **It binds nothing about the measurement.**

**So the honest claim, and it is the one the RFC stands on:** condition 12 raises the cost of a false
engine assessment from *typing one integer into a pack* to *hand-authoring a mutually consistent
three-file sidecar trio* — a pack declaration, a matching `engine_eval` record, and a matching
`origin.kind: "engine"` manifest entry, all agreeing on fen, depth, multiPv, engineVersion, sourceId
and retrievedAt. That defeats **accident, drift and the convenient shortcut**, which are the failure
modes `provenance.engineValidation` actually exhibits. It does **not** defeat a determined author,
and no check in this RFC does. Nothing in this repo attests that a named binary ran; the only true
defence is re-running `make verify-draft`, which is precisely why §1a's rule is
*falsifiable at a named cost* rather than *proved*. **A reviewer who wants proof re-runs the walk.**
That is stated here so the acceptance criteria are not read as claiming more than they test:
criterion 4's three condition-12 cases prove the check fires, not that forgery is impossible.

The pre-existing structural gates are unchanged and still run first: `validateLedger`,
`validateManifest`, `linkage`, and `issues.length > 0 → "unverified"` (`:388-393`).

`AssessmentGrounding` stays the two-valued union `"ledger_verified" | "unverified"`
(`pack-registry.ts:24`). Widening it is a wire change consumed by `rest.ts:818-822` and the client,
and there is no third verdict this RFC needs: coverage is a `sourcing-check` concern (§4c), not a
second grade.

#### 4c. Record-level checks, and the reason they do not run today

`evidenceSemantics` and `evidenceSupports` — the functions that enforce the whole evidence
boundary — are private to `apps/server/src/sourcing/check.ts` and are called only from
`checkSourcingDirectory`, which reads `pack.json` / `evidence.json` / `sources.json` from a
**candidate directory**. `verify-draft`'s `assertArtifacts` (`verify-draft.ts:107-114`) calls only
`validateLedger`, `validateManifest`, `linkage` and `assessmentGrounding`.

**So no draft sidecar has ever been checked for evidence overreach.** The **eleven** endgame drafts that
ship `.evidence.json` today — `lucena-bridge-convert`, `mate-bishop-knight`, `mate-k-q-technique`,
`mate-k-r-technique`, `mate-two-bishops`, `opposite-bishops-fortress-hold`,
`pawn-breakthrough-convert`, `pawn-opposition-convert`, `philidor-passive-rook-convert`,
`philidor-third-rank-hold`, `queen-vs-pawn-seventh-convert`, all `syzygy`-assessed — were emitted,
self-checked against four structural validators, and never
run past the rules in §5. That is a shipped hole, and it is load-bearing for this RFC: openings will
use the flat-draft path, so an overreach boundary that does not run there is decoration. (The draft
said "five" and `docs/tablebase-grounding.md` still says "six"; both are stale — §12 adds the docs
correction.)

**The fix:** export `evidenceSemantics` and `evidenceSupports` from `check.ts` and call both from
`assertArtifacts`, with the pack document in hand (it already is — `assertArtifacts` takes `pack`).
`make sourcing-check` additionally accepts `FILE=<pack.json>` and runs the same record-level checks
against the flat sidecar trio. No check changes meaning; two of them simply start running where they
always should have.

Three new record-level checks are added, all in `evidenceSemantics`:

| Code | Severity | Fires when |
|---|---|---|
| `ENGINE_INSTRUMENT_UNRECORDED` | error | an `engine_eval` record whose linked manifest entry is not `origin.kind: "engine"`, or whose entry's `budget.depth` / `engineVersion` / `profile.multiPv` disagree with the record's own `values` |
| `ENGINE_COVERAGE_INCOMPLETE` | warning | the pack declares `assessedBy.kind: "engine"` and some position `enumerate` yields has no `engine_eval` position record |
| `EVIDENCE_TEMPLATE_CONFLICT` | error | two records with a `templateId` support the same prose pointer |

`ENGINE_COVERAGE_INCOMPLETE` is a warning, not an error, because `verify-draft`'s emitter cannot
produce it (§4a emits every position), so it can only fire on a hand-assembled or hand-edited ledger,
where the honest response is to tell the author what is missing rather than to refuse a partially
sourced pack.

#### 4d. `SYZYGY_ASSESSMENT_UNGROUNDED` needs an engine sibling

**Found in cross-review; the draft did not mention this code.** `checkSourcingDirectory` carries a
strict-mode check keyed explicitly on `assessedBy.kind === "syzygy"` (`check.ts:241-261`,
`SYZYGY_ASSESSMENT_UNGROUNDED`): a candidate that declares a tablebase assessment which
`assessmentGrounding` returns `unverified` for is refused. After 0.20 an **engine** assessment
reaching the same path gets no such check — the `kind === "syzygy"` guard simply skips it, silently.
That is the same shape as the D33 hole this RFC is closing, arriving through the door this RFC opens.

**The fix, and it costs one condition:** the guard becomes
`assessedBy.kind === "syzygy" || assessedBy.kind === "engine"`, emitting the existing
`SYZYGY_ASSESSMENT_UNGROUNDED` for the syzygy kind and a new
**`ENGINE_ASSESSMENT_UNGROUNDED`** at the same pointer for the engine kind, with the message
*"engine assessment has no valid, manifest-linked engine_eval evidence record"*. Two codes rather
than one renamed code, because `SYZYGY_ASSESSMENT_UNGROUNDED` has shipped and a rename would break
the only thing that reads it. `ENGINE_ASSESSMENT_UNGROUNDED` is a **new code added in cross-review**;
§10 carries the full register and its collision sweep.

### §5. What can and cannot be grounded

#### 5a. The three tiers

**Groundable by an engine record** — measurements, and only measurements:

- a position's evaluation at a stated depth, in a stated perspective, by a stated binary;
- a move's evaluation, and its difference from the best **measured** candidate at that position,
  with the candidate set named;
- a mate score at a stated depth, **as a measurement**. Never as a category, never as "wins".

**Groundable by a corpus record** — via the shipped `explorer-move-share/v1` template only
(`apps/server/src/sourcing/explorer.ts:25`, `:208-210`): a move's frequency and share at a stated
rating band, speed set and date window. §6.

**Never groundable, by anything in this repo.** `rfc/archive/content-sourcing-foundation.md`
enumerates this list (§3.3, "Human-only, permanently"), and its ruling on the deviation class is the
one G1 obeyed at cost:

> the classes are relative to *this pack's objective*. Engine eval cannot separate
> `concept_violation` from `interesting_deviation`.

G1 declined to reclassify four deviations whose measured numbers plainly disagree with their authored
classes, and recorded the disagreement in the files instead. **That is the correct behaviour and this
RFC makes it the enforced behaviour** rather than a discipline each wave must rediscover.

#### 5b. The boundary is under-enforced today, in three specific places

`check.ts:122` refuses a record supporting a `PROSE_POINTERS` entry (`:30-36`: `/objective/summary`,
`/planClasses/{i}/description`, spine annotations, `/deviations/{i}/note`,
`/feedbackClaims/{i}/text`) unless it is the registered explorer template, and refuses
`/deviations/{i}/class` for every kind. Checked against the human-only list in
`content-sourcing-foundation.md` §3.3, three named human-only fields have **no** refusal:

| Field | Named human-only | Refused today |
|---|---|---|
| `/deviations/{i}/offObjective` | yes — *"same reason"* as `class` | **no** |
| `/difficulty/label` | yes — *"framing"* | only for `explorer_frequency` |
| checkpoint `label` | yes — *"framing"* | **no** |

An `engine_eval` record may today support `/deviations/{i}/offObjective` and be blessed by
`sourcing-check`. `offObjective` is not cosmetic: it is read by the compiler and drives the
`theory-deviation-{i}-{from}` degradation rules for every `follow_theory` pack
(`pack-orchestrator.ts:217-237`, ids built at `:227`) — which is to say it is precisely the field an opening pack would
be tempted to justify with a centipawn number, and precisely the one no number can justify.

**The fix:** a `HUMAN_ONLY_POINTERS` list, refused with the existing `EVIDENCE_OVERREACH` code for
**every** record kind including templated ones, containing `/^\/deviations\/\d+\/(class|offObjective)$/`,
`/^\/difficulty(?:\/|$)/` and `/^\/checkpoints\/\d+\/label$/`. `PROSE_POINTERS` keeps its current
meaning and its one registered crossing. No committed ledger in the tree supports any of these
pointers, so this refuses nothing that exists — it refuses the shortcut this RFC's new instrument
would otherwise make attractive.

#### 5c. The one permitted crossing for engine evidence: `engine-move-loss/v1`

The crossing rule is `content-sourcing-foundation.md` §3.3 and it is not relaxed: a machine record
may support a prose pointer **only** when its kind has a registered compile-time template and the
prose is **byte-equal** to a deterministic re-render of that template from the record's `values`.
`explorer-move-share/v1` is the shipped instance.

One engine template is registered:

- **`templateId`:** `engine-move-loss/v1`
- **kind:** `engine_eval`
- **`requiredValues`:** `moveSan`, `bestSan`, `atFen`, `candidates` (array of
  `{san, uci, centipawns}`, length ≥ 2), `lossCp`, `depth`, `perspective`, `engineName`,
  `engineVersion`
- **derived and recomputed exactly:** `lossCp === max(candidates.centipawns) − centipawns(moveSan)`
  in the mover's favour, and `bestSan === argmax` — a mismatch is `EVIDENCE_VALUES_INVALID`, the
  same discipline as the explorer template's `sharePct` recomputation (`check.ts:94`)
- **`supports`:** exactly one `/feedbackClaims/{i}/text` — enforced as for the explorer template
  (`check.ts:101-108`)
- **render:**

  > `{moveSan} evaluates {signedCp} for White at depth {depth} ({engineName} {engineVersion}). Of
  > the {n} moves measured at this position, the best, {bestSan}, evaluates {signedBestCp}; the
  > difference is {lossCp} centipawns. Only the listed moves were measured, so this is a lower
  > bound.`

The last sentence is not optional and is not a footnote. It is §1b's candidate-relative limit,
rendered to the same reader who reads the number, in the same breath — because a template that
renders the number without the limit would make the format imply more than the instrument
delivered, which §Motivation's whole indictment of `provenance.engineValidation` turns on.

Two things this template deliberately cannot express, both because they are §5a tier three: *why*
the difference exists, and whether the difference *matters* for this pack's objective.

#### 5d. The claim label is rendered to learners and nothing binds it

`feedbackClaims[].evidenceTypes` is a seven-value enum including `engine_validated`,
`tablebase_exact` and `corpus_observed` (`schemas/drill_pack.schema.json:802-808`, `$defs/feedbackClaim`). It is rendered
to the learner as an authority label: `apps/server/src/reasoning.ts:65` produces
`Author-declared claim (${claim.evidenceTypes.join(", ")}): ${claim.text}`. **Nothing in the repo
checks that a claim labelled `engine_validated` has any engine evidence.** A pack may assert the
label and the product will print it.

This is the manufactured-authority shape law 8 exists to prevent, arriving through the content door.
The RFC binds it in two graded steps rather than one, because the strong form is a content decision
this RFC has no standing to make:

1. **`EVIDENCE_TYPE_UNBACKED`, warning, in `sourcing-check`.** A claim whose `evidenceTypes` include
   `engine_validated`, `tablebase_exact` or `corpus_observed`, with no ledger record **of the
   matching kind** supporting that claim's `/feedbackClaims/{i}/text`, warns and names the claim
   **and the specific unbacked label**. The label-to-kind map is
   `engine_validated → engine_eval`, `tablebase_exact → tablebase_result`,
   `corpus_observed → explorer_frequency`. **Per-label, not per-claim** — corrected in cross-review;
   see the two-label case below.
2. **Error at graduation.** The same condition is an **error** when
   `provenance.reviewStatus === "published"`, joining the shipped graduation floor
   (`GRADUATION_REQUIRES_SOURCES`, literal at `pack-validation.ts:467`). Drafts may carry an aspirational
   label; a published pack may not, because §3b of `planning/content-era/plan.md` says every
   strategic assertion in a published pack is grounded or is *"named in the pack's own
   `graduationBlockers`"*.

The remaining four values — `author_principle`, `human_model_predicted`, `derived_feature`,
`hypothesis` — are untouched: they claim no external instrument and are honest labels for an
ungrounded claim, which is exactly what §3b's "stays ungrounded, permanently and in writing" needs.

**Blast radius, measured in cross-review rather than estimated.** Across all 43 pack documents in
`content/drafts/`: **131** `feedbackClaims`, carrying **67 strong labels** — 37 `tablebase_exact`,
23 `corpus_observed`, 7 `engine_validated` — spread over **29 packs**. **Zero committed ledgers
contain an `explorer_frequency` record**, and no ledger contains any record supporting a
`/feedbackClaims/{i}/text` pointer at all. So on the day this lands, **essentially all 67 warn.**
That is a large number and it is the correct number: it is the size of the gap, printed. It is also
why step 1 is a warning — a 67-error wall would force a content pass into an infrastructure commit.
**All 43 drafts are `reviewStatus: "draft"`, so step 2's error fires on nothing today**; it is a
gate on the first promotion, not a migration.

**The two-label case, and it is live content.** Wave 4b encoded the Scandinavian pair's strongest
claim — corpus and engine converging on 6.h3 — as `["corpus_observed", "engine_validated"]`, and
recorded in the same entry that *"there is no evidenceType for 'two independent instruments
agree'"*. Six claims in the corpus carry more than one strong label. Two consequences the draft did
not state:

- **A per-claim check would bless a half-backed claim.** One `engine_eval` record would satisfy a
  claim labelled with both. Step 1 is therefore per-label, as corrected above.
- **A doubly-labelled claim cannot currently be fully backed at all**, because §6's precedence rule
  2 (`EVIDENCE_TEMPLATE_CONFLICT`) allows exactly **one** templated record per prose pointer, and the
  crossing rule requires the prose to be byte-equal to that one template's render. A sentence cannot
  be byte-equal to both `explorer-move-share/v1` and `engine-move-loss/v1`. **So the Scandinavian
  claim will warn on its `corpus_observed` half forever, under this RFC as specified.** This is an
  admitted limit, not an oversight: the alternatives are a composite template (a new prose form no
  one has designed) or relaxing byte-equality (which dissolves the crossing rule). It is added to
  §Open questions as question 6 rather than solved here.

**The gap this leaves, admitted.** G1 deleted rather than rewrote `italian-center-attack-white`'s
`forcing-literacy` claim, because *"a replacement would be a new authored judgment this pass cannot
ground"*. Causal claims cannot be templated. After this RFC they can be labelled `author_principle`
or `hypothesis` and blocked from publication — which is an honest gap, not a closed one. §Open
questions carries the promotion decision.

### §6. Corpus and engine in one record set

They do not merge into one record. They coexist as separate records of separate kinds, from separate
manifest entries, in one ledger — which the shipped structure already supports: `linkage` binds every
record to a manifest entry by `(sourceId, retrievedAt)`, `sourcedAt` is the maximum consumed
`retrievedAt` (`ledger-validation.ts:352-377`), and `MANIFEST_ENTRY_UNUSED` keeps the entry set
minimal. An opening pack's `evidence.json` after this RFC holds `position_legality` (one, root),
`engine_eval` position records (one per enumerated position), optional `engine_eval` comparison
records, and optional `explorer_frequency` records, over two source entries.

**The division of labour, stated so neither is read as the other:**

> The corpus answers *what is played, by whom, how often*. The engine answers *what this binary
> measures at this depth*. **Neither answers what is good**, and no combination of the two produces
> a claim that either alone could not support.

Three precedence rules, one shipped and two new:

1. **Result over measurement, shipped.** `engine_eval` may not substitute for `tablebase_result` on
   the same ≤7-piece position (`check.ts:165-168`). §3b lifts the same rule to the assessment level.
2. **One templated pointer, one record.** A prose pointer may be supported by exactly one templated
   record — `EVIDENCE_TEMPLATE_CONFLICT` (§4c). A frequency sentence and an evaluation sentence
   cannot both be byte-equal to the same text, so today the conflict manifests as a confusing
   `EVIDENCE_OVERREACH` on whichever record lost; the new code says what actually happened.
3. **Neither kind may support the other's claim.** An `explorer_frequency` record may not support an
   `engine-move-loss/v1` pointer and vice versa; enforced by the shipped template-id-must-match-kind
   rule (`check.ts:125`).

#### 6a. The merge bug that would destroy corpus evidence

`verify-draft` writes the ledger with `writeCanonicalJson(paths.ledger, ledger)`
(`verify-draft.ts:177`), where `ledger.records` is built fresh from the walk (`:156-165`). **Any
record `verify-draft` did not produce is silently deleted on every run.** Today that is invisible
because the only packs with sidecars are tablebase-verified endgame drafts with no attached
explorer evidence. The moment an opening pack has both — which is the entire point of §6 — re-running
`verify-draft` after `candidate-attach` erases the corpus evidence and the pack quietly loses a
grounded sentence while still passing every check.

**The fix:** `verify-draft` **merges**. It reads any existing ledger and manifest, replaces only the
records it produced this run, and preserves the rest. The dedupe key is the one
`attachExplorerEvidence` already uses (`explorer.ts:256-257`):
`(kind, templateId, supports[0], sourceId, retrievedAt)`, with the record set sorted by the same
comparator so the output stays canonical and diffs stay readable. A preserved record whose
`supports` pointer no longer resolves after the pack was edited is refused with
`VERIFY_LEDGER_MERGE_CONFLICT`, naming the pointer — the author must re-attach, not silently lose
it.

#### 6b. Corpus evidence cannot reach a flat draft today

`attachExplorerEvidence` takes `{directory}` and reads `pack.json`, `evidence.json` and
`sources.json` from it (`explorer.ts:228-231`). Drafts are flat files with `<stem>.evidence.json`
siblings (`verify-draft.ts:92-95`, `pack-registry.ts:188-201`). So `make candidate-attach` cannot
attach a frequency sentence to any of the 20 opening packs, which is why G1 verified corpus claims
by hand against `content/candidates/priority/priority.json` and
`content/candidates/priority-wave4a/priority.json` — *"zero corpus refutations"*, and zero of them
recorded as evidence.

`attachExplorerEvidence` gains the same flat-file form: a `file` option resolving the sidecar trio
through the shipped `sidecars()` helper, with the directory form unchanged. The record it writes is
byte-identical either way.

**One dependency the draft understated, and it is why §6b must land with §4c, not before it.**
`attachExplorerEvidence` is not only directory-shaped in its *reads*: it gates on
`checkSourcingDirectory(options.directory, {strict: true})` before it starts (`explorer.ts:229`) and
re-runs the same directory check against a temporary staging directory before it commits
(`:260-266`). So the flat form needs the flat `sourcing-check` that §4c introduces
(`FILE=<pack.json>`) as its pre- and post-condition; without it the flat path would either skip the
gate entirely — losing the `ATTACH_CHECK_FAILED` guarantee — or keep staging into a scratch
directory, which defeats the point. **This is a path-resolution change plus one check-shape change**,
and the implementer lands §4c first.

**One behaviour that stays as-is and should be noticed:** `attachExplorerEvidence` **already merges**
correctly — it filters by the dedupe key and re-appends (`explorer.ts:257`), preserving records it
did not write. §6a's bug is `verify-draft`'s alone. That asymmetry is why the bug has been invisible:
the tool that merges is the one that has never run on a pack the tool that overwrites also runs on.

### §7. `make verify-draft` for openings

#### 7a. Extend `verify-draft` — it is the admission-time grounder

`rfc/archive/authoring-frictions.md` §1 already ruled the split, and it is right: `verify-draft` is the
**admission-time grounder** (walks a declared pack, writes sidecars, earns `ledger_verified`);
`tablebase-walk` is the **authoring-time walker** (writes a report, makes no chess judgement, never
writes a pack or a sidecar). A new admission-time command for openings would fork the grounder in
two, and the two halves would drift on exactly the checks that matter.

So `verify-draft` keeps its identity and grows an **instrument dispatch on `assessedBy.kind`**,
replacing the hard-wired refusal at `:124`:

| `assessedBy.kind` | Behaviour |
|---|---|
| `syzygy` | the shipped path, **byte-unchanged** — same queries, same records, same abstentions, same `VERIFY_SPINE_CATEGORY_REGRESSION` |
| `engine` | the engine path, §7a below |
| `authored`, or `grading` absent | refuse with **`VERIFY_ASSESSMENT_NOT_GROUNDABLE`**: there is no instrument to verify against |

**`VERIFY_ASSESSMENT_NOT_SYZYGY` is retired** (§0). Keeping it would mean shipping a code whose
message — *"objective.grading.assessedBy.kind must be syzygy"* — became false. §0 carries the
verified dependency list: one production reference (`verify-draft.ts:124`), and everything else is a
description of the pre-fix tree. `rfc/archive/validator-integrity.md:99` and `:998` assert it about that
tree and stay true of it; **this RFC lands second, so this RFC's implementer updates those assertion
texts** — the draft left the actor ambiguous ("the implementer landing second"), and the landing
order is now known.

The engine path, step by step, mirroring the syzygy path's structure so that the two read as one
function with two instruments:

1. `enumerate(pack)` — **unchanged and shared** (`verify-draft.ts:62-82`).
2. Evaluate every enumerated position through `createPositionSeedEngineEvaluator`
   (`position-seeds.ts:68-83`) at `AUTHORING_PROFILE`, with §3d's `ucinewgame` + `Clear Hash` before
   each. No piece-count gate: an engine has no range. Failure or timeout on a position becomes an
   `EvidenceAbstention` with reason `source_unavailable` (an existing value,
   `types.ts:67-73`) — the engine abstains for *unavailability*, never for range, and §1a
   consequence 3 is why that distinction is recorded rather than smoothed over.
3. **Root check.** The queried root's score must equal the declared `assessedBy.score` exactly;
   otherwise `VERIFY_ASSESSMENT_CONTRADICTED` — the shipped code, reused with its shipped meaning —
   with a message naming the instrument: `declared {score} at depth {d} by {engineId} {version};
   this run measured {score'} — re-declare, or re-check the engine build`.
4. **No evaluation-based refusal on spine moves.** This is the deliberate asymmetry with the syzygy
   path and the single most important behavioural decision in §7. The tablebase path refuses a
   learner spine move that worsens the learner-perspective **category** (`:144-147`) because a
   category change is a *result* change. A centipawn drop is not: it is a measurement difference,
   and the threshold that would turn it into a refusal does not exist anywhere in the product's
   vocabulary — `rfc/archive/content-sourcing-foundation.md`'s ruling on deviation classes says no
   evaluation separates the classes, and law 8 forbids inventing one here. **The engine path warns
   with the number and never refuses.** Every learner spine move whose evaluation drops by any
   amount produces `WARNING {pointer}: learner move {san} measured {cp}; best measured candidate
   {bestSan} at {cp'} ({loss}cp)`, on the shipped `warnings` channel (`:188`, printed by `main()` as `WARNING …`).

   This is exactly how G1's piece blunder was caught: not by a threshold, but by a human reading
   `+4.54` next to a caption claiming an even trade. The tool's job is to put the number where the
   human will read it, not to grade.
5. **Records.** One `engine_eval` position record per position (§4a), plus the shipped
   `position_legality` root record, which is instrument-independent and unchanged (`:156`).
6. **Emit and merge**, per §6a, then `assertArtifacts` — now including the record-level checks of
   §4c.

**`OFFLINE=1`** reads a committed fixture, `apps/server/src/sourcing/fixtures/verify-draft-engine.json`,
keyed by FEN exactly as `offlineQuery` does for tablebase results (`:97-105`), and **throws**
`TABLEBASE_SOURCE_UNAVAILABLE`'s engine sibling `VERIFY_ENGINE_UNAVAILABLE` on a miss. Throwing on a
miss is right here for the same reason it is right for `verify-draft`'s tablebase half and wrong for
`tablebase-walk`'s: the position set is bounded and authored, so a miss means the fixture is stale,
not that the walk found something new.

#### 7b. `engine-walk` — the authoring-time sibling

G1's second contract-gap:

> **No repo command evaluates a draft pack.** `make verify-draft` is tablebase-only; `make
> candidate-emit --engine-eval` evaluates *candidate seeds*, not an authored pack's spine and
> deviations. Every wave that wants engine numbers must bundle the repo's engine classes into a
> scratch harness itself — this wave did, with an esbuild `NODE_PATH` workaround.

That was the throwaway-harness friction at its **fifth** attestation when this draft was written. It
is now at its **sixth**: wave 4b (`planning/content-era/log.md`, friction #3) rebuilt a walker, a
firing census, a signature prober and an engine driver from scratch, and recorded *"No repo command
evaluates a draft pack, and none evaluates a shape entry against a corpus of positions."*
`verify-draft` does not answer it: an author needs numbers *before* they can declare an
assessment, and a tool that requires a declaration to run is unreachable at the moment of need.

`make engine-walk` is the exact sibling of `rfc/archive/authoring-frictions.md` §1's `tablebase-walk`.
**That dependency is now satisfied, not pending:** `apps/server/src/sourcing/tablebase-walk.ts` ships
with a `Makefile:66-69` target, so the walk core is there to be extracted rather than co-designed.

**The CLI and report shape are aligned to the shipped sibling (corrected in cross-review — the draft
diverged from it on three names).** `tablebase-walk` ships as
`make tablebase-walk FILE=<pack.json> [OUT=<report.json>] [OFFLINE=1] [ENUMERATE=decision|all|none] [MAX_QUERIES=N]`
and throws `WALK_QUERY_BUDGET_EXCEEDED`. So:

```
make engine-walk FILE=<pack.json>   [OUT=<report.json>] [DEPTH=22] [MAX_QUERIES=N] [ENUMERATE=decision|all|none]
```

- **Input:** a draft pack with **no declaration required**.
- **Walks:** the root, every spine node's position, every authored deviation's position, and — at
  every position where the learner is to move — the engine's own first choice, so the comparison set
  §5c needs exists. It does **not** enumerate all legal moves: at depth 22 that is a different order
  of machine time, and G1 measured that the authored-plus-best-move set is what actually finds
  errors. (`ENUMERATE` therefore admits `decision` and `none`; `all` is refused on the engine
  instrument with `WALK_ENUMERATE_UNSUPPORTED`, because at depth 22 it is not a budget question but
  a different tool.)
- **Writes:** a report to stdout or `--out`. **Never** a pack, never a sidecar — the same contract
  boundary `tablebase-walk` holds.
- **Fails on:** transport/engine failure, or **`WALK_QUERY_BUDGET_EXCEEDED`** — the **shipped** code,
  reused, not a new `WALK_ENGINE_BUDGET_EXCEEDED`. A second budget code for the same event on a
  sibling tool is exactly the fork §7a refuses elsewhere. **`WALK_ENGINE_BUDGET_EXCEEDED` is struck
  from the register in §10.** **No chess judgement at all**, per §7a step 4.
- **Report schema:** `tabiya.sourcing.walk.v1`, the shipped schema
  (`tablebase-walk.ts:127`). Its `subject` is **already occupied**:
  `{kind: "pack", packId, learnerSide}` or `{kind: "fens"}` — there is no `subject.instrument`
  today, so the draft's *"with `subject.instrument: "engine"`"* described a field that does not
  exist. The extension is: `subject` gains an **`instrument`** key valued `"tablebase" | "engine"`,
  defaulted to `"tablebase"` on read so every committed report stays valid; per-node
  `{learnerCategory, dtz, dtm, terminal}` is joined by `{cp | mateIn, depth, perspective}` on the
  engine instrument, with the tablebase keys absent rather than null. One schema, two instruments;
  the implementer extends that shape rather than minting a second.

G1 spent **85 minutes** of its 185 on `agent-engine-validation` plus **35** on
`agent-tooling-friction`; wave 4b spent **95** and **40**. `engine-walk` is aimed squarely at the
second number in both.

### §8. The migration: `provenance.engineValidation` becomes evidence

20 packs carry a `provenance.engineValidation` block that validates only because `provenance` is
`additionalProperties: true` (`$defs/provenance`, `schemas/drill_pack.schema.json:816`). It is a good-faith record of
real work and it is not evidence: no schema constrains it, no registry reads it, `sourcing-check`
does not know it exists, and `projectPackDocument` does not project it
(`pack-registry.ts:79-87` projects `reviewStatus`, `sources`, `licence`, `graduationBlockers` and
nothing else).

**`provenance` stops being an evidence store.** A new refusal, `PROVENANCE_EVIDENCE_INLINE` at
`/provenance/{key}`, fires on a reserved key set — `engineValidation`, `tablebaseValidation`,
`evidence`, `records` — with the message *"evidence belongs in the pack's `*.evidence.json` sidecar;
see `make verify-draft`"*.

**This makes 20 committed drafts fail `pack-check`, and it should.** The precedent is
`rfc/archive/validator-integrity.md` §3d, which makes two drafts fail for the same class of reason and
lands the content fix in the same commit. Here the content fix is: run `make verify-draft` with an
engine assessment over each of the 20 packs, and delete the `engineValidation` block.

**The migration re-measures; it does not transcribe.** Copying G1's numbers into records that claim
a `sourceId` / `retrievedAt` pair no manifest entry ever produced would forge provenance — the
`linkage` and instrument checks of §4b(12) would have to be satisfied with a fabricated source entry.
That is the manufactured-evidence shape this whole RFC is against, and it would be a strange way to
close a hole opened by honest storage. **Cross-review note on the strength of that argument:** §4b's
corrected forgery analysis shows a fabricated source entry *would* in fact satisfy the checks if
hand-authored consistently — so "cannot" is too strong here too. The reason to re-measure is not that
transcription is *blocked*; it is that transcription would produce a record asserting a `retrievedAt`
no process ever produced, which is a false statement in a file whose whole purpose is to be true.
**Re-measuring is a rule this RFC imposes on itself, not a constraint the validator enforces**, and
stating it that way is the only version consistent with §4b.

**Cost.** G1 measured **214 seconds** of machine time for its main pass across its **18** packs; the
corpus is now 20 and the migration must also cover `scandinavian-mainline-black` and
`anti-scandinavian-white`, so budget ~240 s. That is G1's measurement of G1's corpus, carried across
with the arithmetic shown rather than silently restated as the new number.

Two things the migration does **not** do, and G1 already established both:

- **No reclassification.** The places where a measured number disagrees with an authored
  deviation class stay disagreeing and stay visible (§5a): four in G1's 18, plus five more that wave
  4b recorded in the Scandinavian pair — *"no class was reclassified on a number anywhere in this
  wave"*. The migration records numbers; it does not move classes.
- **No new prose.** Where G1 deleted a refuted claim rather than rewriting it, the deletion stands.
  A comparison record and its `engine-move-loss/v1` sentence may be attached only where an author
  chooses to; nothing is auto-generated into a pack's prose.

Each pack's `provenance.graduationBlockers` gains the honest residue in the same commit: the pack's
prose, plan classes and deviation classes remain ungrounded, and after this RFC they remain
ungrounded *with a validator that knows it* (§5d step 2). **Five committed drafts additionally carry
blocker prose that names `VERIFY_ASSESSMENT_NOT_SYZYGY` and asserts no evidence slot can exist**
(`leningrad-dutch-black`, `opponent-intent-early-queen`, `italian-center-attack-white`,
`london-system-white`, and `trajectory-mate-bishop-knight` for the trajectory half). That text
becomes false the moment this lands, so rewriting those five blockers is part of the same commit,
not a follow-up.

### §9. Rendering: the sentence must say what was verified

`assessmentSentence` (`outcome-presentation.ts:42-53`) has two branches and a catch-all. With an
`engine` member reaching it, the catch-all would produce *"A tablebase result is declared but no
matching evidence record backs it"* — false in two ways at once. Two branches are added, before the
catch-all:

```
engine + ledger_verified:
  Root assessment: {signedCp} for White — {engineName} {engineVersion} at depth {depth},
  retrieved {retrievedAt}. An engine evaluation at a fixed depth, not a proof.

engine + unverified:
  Root assessment (declared, unproved): an engine evaluation is declared but no matching
  evidence record backs it, so it is shown as a claim.
```

Three constraints on that text, each a direct consequence of §1:

- **It names the instrument and the budget**, because the claim is about them.
- **It ends with the limit** — *"not a proof"* — mirroring the syzygy branch's *"Exact."*. The two
  sentences must be readable side by side and must not be confusable, because the whole difference
  between them is the difference between a result and a measurement.
- **It states a number, never a verdict.** No "White is better", no "equal", no "winning". Rendering
  validated evidence is permitted; grading from it is not.

**`projectedGrading` and `projectPackDocument` need no *behavioural* change** — both spread `grading`
and inject `grounding` without reading `assessedBy.kind` (`outcome-presentation.ts:27-40`,
`pack-registry.ts:92-95`). **But the draft's "need no change" was wrong in TypeScript, and this is a
compile error, not a nitpick.** `ProjectedAssessment` (`outcome-presentation.ts:9-17`) is a closed
two-arm union, `{kind: "authored", note}` | `{kind: "syzygy", category, pieceCount, sourceId,
retrievedAt}`. `projectedGrading` reaches its return through an `as ProjectedGrading` cast (`:39`),
so an `engine` member would flow through at runtime and then fail to typecheck the moment
`assessmentSentence` reads `grading.assessedBy.depth`. **`ProjectedAssessment` gains a third arm**
mirroring §3a's shape (`kind: "engine"`, `score`, `perspective`, `depth`, `engineId`,
`engineVersion`, `sourceId`, `retrievedAt`) — a type-level change in `apps/web`, no behaviour change,
and it must be in the same commit or the client does not build.

**The honesty corollary, and it is the spine of this RFC.** After 0.20 an opening pack can be
`ledger_verified` while every strategic assertion in it stays ungrounded (§1c). The two rendered
sentences are therefore required to differ at their last word, and they do:

| | Rendered tail |
|---|---|
| `syzygy` + `ledger_verified` (shipped, `outcome-presentation.ts:47`) | *"…retrieved {retrievedAt}. **Exact.**"* |
| `engine` + `ledger_verified` (§9) | *"…retrieved {retrievedAt}. An engine evaluation at a fixed depth, **not a proof.**"* |

**No pack-level "verified" badge may be derived from `assessmentGrounding`, and cross-review verified
that none exists today.** Every consumer was traced: `assessmentGrounding` is computed in
`pack-registry.ts:253`, stored as `PackSummary.assessmentGrounding` (`:46`, defaulted `"unverified"`
at `:374` and `:397`), passed to `projectPackDocument` by `rest.ts:818-822`, injected into the
projected grading at `pack-registry.ts:92-95`, and consumed by exactly one client reader —
`DrillScreen.svelte:243-245` → `assessmentSentence`. **There is no badge, no filter, no sort, no
list-view marker and no catalogue field derived from it.** That is the property §1c depends on, and
it is now recorded as a verified fact rather than an assumption, so a future reviewer can see what
would break it.

**One surface consequence, stated because it is a real behaviour change.** `DrillScreen.svelte:243-245`
derives the assessment sentence for any pack with a grading. Today no opening pack has one, so no
opening drill shows a root assessment; after §8, all 20 will. That is the intended outcome — the
learner sees what was checked — and it is also the reason §9's wording is normative rather than
suggested.

### §10. Refusal-code register for this wave

**Fourteen new codes** — the draft said twelve; cross-review struck one
(`WALK_ENGINE_BUDGET_EXCEEDED`, §7b) and added three (`TRAJECTORY_LEG_ENGINE_UNSUPPORTED` §2c,
`ENGINE_ASSESSMENT_UNGROUNDED` §4d, `WALK_ENUMERATE_UNSUPPORTED` §7b). Six are
`PackValidationIssue`s (`severity: "error"`, `source: "runtime"`, per
`pack-validation.ts:102-108`, `runtimeIssue`); five are `SourcingIssue`s, two of them warnings;
three are `SourcingError`s.

| Code | Layer | Fires when | Pointer |
|---|---|---|---|
| `OBJECTIVE_GRADING_RESOLUTION_INERT` | pack-validation | a non-outcome **root** objective declares `grading.resolveAt.kind: "checkpoint"`, which compiles to no rule | `/objective/grading/resolveAt` |
| `ENGINE_ASSESSMENT_DEPTH_BELOW_FLOOR` | pack-validation | `assessedBy.depth` below `AUTHORING_PROFILE.depth` | `/objective/grading/assessedBy/depth` |
| `ENGINE_ASSESSMENT_ON_TABLEBASE_ROOT` | pack-validation | an engine assessment on a ≤7-piece root | `/objective/grading/assessedBy/kind` |
| `TRAJECTORY_LEG_ENGINE_UNSUPPORTED` | pack-validation | a trajectory leg declares `assessedBy.kind: "engine"` (§2c) | `/legs/{i}/objective/grading/assessedBy` |
| `PROVENANCE_EVIDENCE_INLINE` | pack-validation | a reserved evidence key inside `provenance` | `/provenance/{key}` |
| `ENGINE_INSTRUMENT_UNRECORDED` | sourcing-check | an `engine_eval` record whose linked manifest entry is not an engine entry, or disagrees on budget / version / multiPv | `/records/{i}` |
| `ENGINE_ASSESSMENT_UNGROUNDED` | sourcing-check | strict mode; an `engine` assessment `assessmentGrounding` returns `unverified` for (§4d) | `/objective/grading/assessedBy` |
| `ENGINE_COVERAGE_INCOMPLETE` (**warning**) | sourcing-check | an engine-assessed pack missing a position record for an enumerated position | `/records` |
| `EVIDENCE_TEMPLATE_CONFLICT` | sourcing-check | two templated records support one prose pointer | `/records/{i}/supports/0` |
| `EVIDENCE_TYPE_UNBACKED` (**warning**; **error** when `reviewStatus: "published"`) | sourcing-check | a strong label with no record **of the matching kind** supporting the claim's text (§5d) | `/feedbackClaims/{i}/evidenceTypes` |
| `VERIFY_ASSESSMENT_NOT_GROUNDABLE` | `SourcingError` | `verify-draft` on a pack with `assessedBy.kind: "authored"` or no grading | — |
| `VERIFY_ENGINE_UNAVAILABLE` | `SourcingError` | engine failure, timeout, or an `OFFLINE=1` fixture miss | — |
| `VERIFY_LEDGER_MERGE_CONFLICT` | `SourcingError` | a preserved record's `supports` pointer no longer resolves after a pack edit | — |
| `WALK_ENUMERATE_UNSUPPORTED` | `SourcingError` | `engine-walk` with `ENUMERATE=all` (§7b) | — |

**Retired:** `VERIFY_ASSESSMENT_NOT_SYZYGY`. **Narrowed, not retired:**
`OBJECTIVE_GRADING_UNSUPPORTED`, which survives at `/legs/{i}/objective/grading` (§2c). **Reused with
unchanged meaning:** `VERIFY_ASSESSMENT_CONTRADICTED`, `EVIDENCE_OVERREACH`,
`EVIDENCE_VALUES_INVALID`, `EVIDENCE_KIND_MISMATCH`, `WALK_QUERY_BUDGET_EXCEEDED`,
`SYZYGY_ASSESSMENT_UNGROUNDED`.

**Law 8 check on the record shape, stated explicitly because it is the standing law nearest this
work.** An `engine_eval` record's `values` carry `fen`, `centipawns`/`mateIn`, `depth`, `threads`,
`hashMb`, `multiPv`, `timeoutMs`, `perspective` and engine identity — **facts about a search, not a
verdict about chess.** There is no `category`, no `assessment`, no `better`/`worse`, no
`goodMove` and no natural-language field anywhere in the record or the assessment member. The only
prose an engine record may ever reach is `engine-move-loss/v1`'s byte-exact render (§5c), which
states a number, a comparison set and its own lower-bound limit and asserts nothing about why. **No
engine record can smuggle a chess verdict, because there is no field for one.**

**Collision sweep, re-run at cross-review.** Each of the fourteen names above, plus `engine-move-loss`
and `ENGINE_ASSESSMENT_UNGROUNDED`, was grepped across `apps/`, `packages/`,
`schemas/`, `rfc/` (**including the parallel drafts `deviation-classes.md`, `tempo-vocabulary.md`,
`predicate-wave-3.md`, `resistance-spectrum.md`** and the archived `validator-integrity.md`), `docs/`,
`design/`, `planning/`, `content/`, `tests/` and
`tools/`: **the only file matching any of them is this RFC.** No existing code is renamed or given a
different meaning except the one retirement, the one narrowing, and the one draft-code
generalization in §11.

### §11. Cross-draft interactions

**`rfc/archive/validator-integrity.md` — no longer a parallel draft. It has LANDED** (`047de02`;
`rfc/README.md:211` reads `implemented`). **Every "either landing order" hedge below has therefore
collapsed to one order: validator-integrity first, this RFC second, and this RFC carries the whole
reconciliation.** Cite it at its archive path.

**This is also why §2c is not optional.** Its per-leg `objectiveIssues` call site
(`pack-validation.ts:667-670`) is shipped code now, not a proposal, so a §2b that retired
`OBJECTIVE_GRADING_UNSUPPORTED` outright would regress a shipped guarantee on the day it landed.

*Composition.* Its §4b admits top-level `grading` on `run_trajectory` by carving `run_trajectory` out
of `OBJECTIVE_GRADING_UNSUPPORTED` — **shipped** at `pack-validation.ts:273`, as the
`!outcomeObjective && !trajectoryObjective && grading !== undefined` arm. §2b **narrows** that code
to legs and admits `grading` on every **root** type, which subsumes the carve-out: the implementer
deletes `!trajectoryObjective` from the root path and re-arms the code at the leg pointer per §2c.
The composed result is exactly what validator-integrity asks for: a trajectory carries a root
assessment, and no leg carries a groundable one.

*Generalization, and the "unshipped" premise has expired.* validator-integrity §4b(3) mints
`TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED` for `run_trajectory` with a checkpoint resolution, on
exactly the argument §2b makes for eight types. **This RFC generalizes it to
`OBJECTIVE_GRADING_RESOLUTION_INERT` covering all eight non-outcome root types**, so the product does
not ship two codes for one shape. **The draft said "the code has never shipped, so nothing is broken
by the rename" — that is now false:** it is live and committed at `pack-validation.ts:276-277`, and
`rfc/archive/validator-integrity.md`'s acceptance criteria assert it. So the rename is a real rename
of shipped code, and this RFC's implementer owns it: replace the emission, update its tests, and
confirm no test still greps the old literal. Because validator-integrity is now **archived and
frozen**, its text is not edited — the reconciliation is recorded here and in the archived RFC's
successor note, per the archive rule. This RFC lands behind validator-integrity and **carries the reconciliation**, per that
RFC's own convention — *"Whichever lands second carries the one-line reconciliation."*

*Unaffected.* Its §4b(5)'s `SYZYGY_ASSESSMENT_MISMATCH` / `SYZYGY_ASSESSMENT_OUT_OF_RANGE`
substitution and its `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` retention are about the syzygy member and
are untouched. §3b's `ENGINE_ASSESSMENT_ON_TABLEBASE_ROOT` refuses an engine assessment where those
checks would apply, so the two never meet on one pack. Its §3a total-compilation pass and §3c per-leg
extraction touch code this RFC does not, and this RFC adds no success condition, so it inherits
`OBJECTIVE_RULES_UNCOMPILABLE` as a safety net for free.

**`rfc/archive/authoring-frictions.md` (pack schema 0.16, **landed** as `ffc9817`) — a hard dependency and no
conflict.** §7b depends on its §1 `tablebase-walk` landing first so the walk core and the
`tabiya.sourcing.walk.v1` report shape are extracted once. Its §8 widens the syzygy assessment's
`category` enum to five determinate values (`cursed-win`, `blessed-loss`) — that is the syzygy
member, which this RFC does not touch; §3a's engine member has no `category` at all, so the two
never interact. Its §7 keys candidate directories per emission, which is orthogonal to §6b's flat-
file attach form.

**`rfc/deviation-classes.md` (pack schema 0.21) — the draft omitted this RFC entirely, and it is the
one parallel draft that touches this RFC's code. Added in cross-review.** Three interactions, all
real, none blocking:

1. **Lane: agreed on both sides.** Its §0 states *"0.20 is `opening-evidence-path`'s"* and claims
   0.21 behind it. No renegotiation needed.
2. **Direct code collision on `check.ts:122`, and it resolves cleanly.** Its §3.3 says
   *"`sourcing-check` (`check.ts:122`) keeps refusing `/deviations/\d+/class` verbatim, and **this
   RFC adds `/deviations/\d+/mistake` to that same refusal**"*. §5b of this RFC **replaces** that
   inline regex with a `HUMAN_ONLY_POINTERS` list refused for every record kind. The two compose if
   and only if the landing order is respected: **if this RFC lands first**, deviation-classes adds
   one entry to `HUMAN_ONLY_POINTERS` instead of editing the inline condition, which is strictly
   simpler; **if deviation-classes lands first**, this RFC's `HUMAN_ONLY_POINTERS` must carry
   `/^\/deviations\/\d+\/(class|offObjective|mistake)$/` from the start. Either way the pointer set is
   the union. Stated here so whichever lands second does not silently drop `mistake`.
3. **`/deviations/{i}/cost` is explicitly delegated to this RFC and this RFC does not take it.**
   deviation-classes §3.3 says the admission contract for `cost` *"belongs to the evidence-path RFC
   (register lane 0.20) and is **not written here**"*. **This RFC declines the hand-off, deliberately
   and on the record.** `cost` does not yet exist in the schema, so specifying its evidence
   admission would be specifying against an unaccepted draft — and more importantly, §4b's
   admission is built around **one** claim (the root) matched to **one** record; a per-deviation cost
   admission is a per-pointer contract of a different shape. It is added to §Open questions as
   question 7. Until it is written, `/deviations/{i}/cost` remains a declaration with no evidence
   path, which is exactly what deviation-classes says it is. **`cost` is not added to
   `HUMAN_ONLY_POINTERS`** — refusing it would foreclose the very admission both RFCs want.

There is one substantive tension worth naming for the owner rather than resolving here:
deviation-classes §4.2 derives a warning (`GUARD_CANNOT_REACH_DEVIATION`) from an **authored,
unverified** centipawn number, while this RFC's §7a step 4 refuses to derive anything from a
centipawn number at all. Both are defensible — one is a consistency check between two authored
declarations, the other is a chess judgement — but they should not be read as one policy.

**`rfc/tempo-vocabulary.md` (0.17) and `rfc/predicate-wave-3.md` (0.18):** no interaction found.
Neither touches `objective.grading`, the sourcing pipeline or the evidence vocabulary. Note for
their reviewers: any draft adding a `feedbackClaims`-adjacent field inherits §5b's
`HUMAN_ONLY_POINTERS` list and should say which tier (§5a) its field belongs to.

**`rfc/resistance-spectrum.md` (run schema 0.14, migration 19):** no interaction. This RFC claims
neither.

### §12. Documentation the implementer updates

- `docs/tablebase-grounding.md` — its title and its opening line (*"Tabiya has two Syzygy paths"*)
  remain accurate for the syzygy path, but its §"Verifying an authored draft" states *"requires
  `objective.grading.assessedBy.kind: "syzygy"`"* (`:13`) and *"Evidence is limited to legality and
  tablebase-result facts"* (`:21`). Both become instrument-dispatched. The engine path is documented
  in a new `docs/engine-grounding.md` and cross-linked, rather than folded in, so the
  result-vs-measurement distinction stays visible at the top of each file. Its closing line of that
  section — *"all six verified endgame drafts exercise the closed loop in CI"* (`:23`) — is **already
  stale on the current tree: there are eleven**, and the implementer corrects it in passing.
- `docs/content-sourcing.md` — the evidence-kind table, the new template, and the flat-draft
  `sourcing-check` form.
- `docs/drill-pack-format.md` — the `engine` assessment member and the 0.20 bump.

## Deviations from design

**None from `design/`.** This RFC specifies no new product surface, no new vocabulary for the
learner and no new authored content type. It supplies the format for a grounding route
`planning/content-era/plan.md` §3b already names — *"engine/corpus/tablebase validation that actually
bears on the claim (Stockfish at fixed depth on the concrete line …)"* — and which has had no
expression in the pack format since that bar was written.

**Three deliberate divergences, listed here rather than buried in the sections that make them.** The
draft listed only the first; the other two are non-actions that a reader could otherwise mistake for
omissions.

1. **The engine path of `verify-draft` warns and never refuses** on a spine move's
   evaluation, where the syzygy path **refuses** on a spine move's category regression (§7a step 4).
   The asymmetry is the point — a category is a result and a centipawn is a measurement — and the
   alternative (a centipawn threshold that refuses) would be this repo's first machine-invented
   grading boundary, which law 8 and `rfc/archive/content-sourcing-foundation.md`'s deviation-class
   ruling (`:772`) both forbid. **There is no centipawn refusal threshold anywhere in this RFC**, and
   acceptance criterion 12 asserts that none exists anywhere in `apps/server/src/sourcing/` after it
   lands.
2. **§8's migration re-measures rather than transcribing G1's numbers.** The stated reason is not
   that the validator blocks transcription — §4b's corrected analysis shows it does not — but that a
   transcribed record would assert a `retrievedAt` no process produced. The RFC imposes this on
   itself. That is a weaker guarantee than the draft claimed and it is now stated as such in §8.
3. **The two non-actions above are asymmetric with each other and that is deliberate.** §7a step 4
   refuses to let a machine number *refuse* anything; §8 insists a machine number be *re-produced*
   rather than copied. One is a limit on what a measurement may decide; the other is a limit on what
   a record may claim. They pull in opposite directions on effort and the same direction on honesty.

## Acceptance criteria

1. **The hole is closed, on the pack that found it.** `make verify-draft
   FILE=content/drafts/anti-caro-advance.json OFFLINE=1` exits `0`, prints `ledger_verified`, and
   emits `.evidence.json` / `.sources.json` / `.job.json`. Asserted to fail on the pre-fix tree with
   `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY]`, with the pre-fix output recorded in a test comment.
   `PackRegistry` reports `assessmentGrounding: "ledger_verified"` for that pack.
2. **All 20 opening packs migrate, and the migration re-measured.** Every `phase: "opening"` pack in
   `content/drafts/` that is not a `*.browser.json` fixture — **20 on the tree at `ffc9817`; a test
   derives the list rather than hard-coding it, because it grew from 18 mid-draft** — carries an
   `engine` assessment, an `.evidence.json` with one `engine_eval` position record per
   enumerated position, and **no** `provenance.engineValidation`. A test asserts that each pack's
   root record's `retrievedAt` matches a manifest entry with `origin.kind: "engine"` whose
   `origin.fen` equals `/start/fen`. **That assertion proves the record and the entry agree; per
   §4b's corrected analysis it does not prove a binary ran, and the test name must not claim it
   does.**
3. **`PROVENANCE_EVIDENCE_INLINE` fires and lands with its content fix.** In the same commit as
   criterion 2: a fixture with `provenance.engineValidation` fails `pack-check` with the code at
   `/provenance/engineValidation`, and every document in `content/drafts/` (43) and
   `content/candidates/*/pack.json` (36) passes `pack-check`. **`schemas/fixtures/drill-pack/` is
   excluded and the draft was wrong to include it: seven of its eight files are `*.invalid.json`
   negative fixtures that must keep failing.** The fixture assertion is instead that each
   `*.invalid.json` fails with its own expected code and none of them starts failing with
   `PROVENANCE_EVIDENCE_INLINE` by accident.
4. **The instrument is part of the admission.** Twelve unit cases against
   `assessmentGrounding`: one that returns `ledger_verified`, and eleven each breaking exactly one of
   §4b's conditions 1–11 and asserting `unverified`. Plus **three for condition 12**: a ledger whose
   record is perfect but whose manifest entry is `origin.kind: "http"`; one whose entry's
   `budget.depth` disagrees with the declaration; one whose entry's `engineVersion` disagrees. All
   three return `unverified`. This is the criterion that distinguishes this RFC from a JSON field —
   **it proves the check fires, not that a false claim is impossible; §4b says why.**
5. **Two records, one root, still `unverified`.** Two matching `engine_eval` records for the root
   return `unverified`, preserving the shipped `matches.length === 1` discipline.
6. **Root grading is admitted everywhere; inert resolution is refused.** A `follow_theory` pack and a
   `play_until_checkpoint` pack each with `grading: {assessedBy, resolveAt: {kind: "terminal"}}` pass
   `pack-check`; the same packs with `resolveAt.kind: "checkpoint"` fail
   `OBJECTIVE_GRADING_RESOLUTION_INERT` at `/objective/grading/resolveAt`. A test iterates
   `OBJECTIVE_TYPES` (`packages/schema/src/drill-pack/types.ts`) and asserts that for **every** type
   a minimal document with a terminal-resolved grading validates, and with a checkpoint-resolved
   grading fails for exactly the eight non-outcome types. `OBJECTIVE_GRADING_REQUIRED` still fires for
   each of the four outcome types with no grading. **The count is asserted as
   `OBJECTIVE_TYPES.length - 4`, not as a literal, so the test cannot drift from the enum the way
   this document's prose did.**
6b. **Legs keep the old rule (§2c).** A trajectory whose non-outcome leg declares `grading` fails
   `OBJECTIVE_GRADING_UNSUPPORTED` at `/legs/{i}/objective/grading`; one whose leg declares
   `assessedBy.kind: "engine"` fails `TRAJECTORY_LEG_ENGINE_UNSUPPORTED` at
   `/legs/{i}/objective/grading/assessedBy`, beside the shipped
   `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` case which still fires unchanged. All four committed
   `legs`-bearing documents still pass `pack-check` — their only graded legs are final outcome legs
   with `assessedBy.kind: "authored"`.
7. **The syzygy path is byte-unchanged.** For all **eleven** tablebase-verified drafts (the draft
    said six; the directory holds eleven `.evidence.json` siblings), `verify-draft
   OFFLINE=1` produces `.evidence.json`, `.sources.json` and `.job.json` **byte-identical** to the
   committed files, before and after the dispatch. Any diff fails.
8. **The boundary refuses what it must.** One fixture ledger per human-only pointer —
   `/deviations/0/class`, `/deviations/0/offObjective`, `/difficulty/label`, `/checkpoints/0/label`
   — each with an `engine_eval` record supporting it, each failing `EVIDENCE_OVERREACH`. The
   `offObjective`, `difficulty` and checkpoint-label cases are asserted to **pass** on the pre-fix
   tree, so the gap is proven rather than described.
9. **Record-level checks now run on flat drafts.** A draft with an overreaching sidecar is refused by
   `verify-draft` (via `assertArtifacts`) and by `make sourcing-check FILE=<pack.json>`. Asserted to
   be accepted by both on the pre-fix tree — the §4c hole, proven.
10. **The template renders and recomputes.** `engine-move-loss/v1` renders byte-exactly to a
    `feedbackClaims[].text`; a ledger whose `lossCp` is off by one fails `EVIDENCE_VALUES_INVALID`; a
    record supporting two pointers, or a pointer that is not `/feedbackClaims/{i}/text`, fails
    `EVIDENCE_OVERREACH`; two templated records on one pointer fail `EVIDENCE_TEMPLATE_CONFLICT`. The
    rendered string is asserted to contain the lower-bound sentence verbatim.
11. **Corpus and engine coexist, and neither erases the other.** An opening pack gets an
    `explorer_frequency` record through the flat-file attach form (§6b), then `verify-draft` is
    re-run: the explorer record survives byte-identically, the engine records are replaced, the
    ledger is canonical, and `sourcedAt` equals the maximum consumed `retrievedAt`. **Asserted to
    fail on the pre-fix tree**, where the explorer record is deleted — §6a's bug, proven.
12. **The engine never refuses on evaluation.** A pack whose spine contains a move measured 400cp
    below the best measured candidate — G1's `anti-caro-advance-early-c5` line, before its fix —
    `verify-draft`s successfully and emits a `WARNING` naming the pointer, the move and the number.
    No refusal code fires. A companion test asserts no centipawn threshold exists anywhere in
    `apps/server/src/sourcing/`.
13. **Determinism.** The same pack verified twice under `OFFLINE=1` produces byte-identical sidecars
    apart from the author entry's `retrievedAt` (already injectable through `options.now`). A live
    test, skipped without an engine, evaluates one position twice through the evaluator and asserts
    equal scores — the observable §3d's `ucinewgame` + `Clear Hash` buys.
14. **The rendered sentence says what was verified.** `assessmentSentence` unit cases for
    `engine` + `ledger_verified` and `engine` + `unverified`; the verified sentence contains the
    engine name, version, depth and the words `not a proof`, and matches neither `/Syzygy/` nor
    `/Exact\./`; the unverified sentence does not name a tablebase.
15. **The claim label is bound.** A draft with `evidenceTypes: ["engine_validated"]` and no
    supporting record produces `EVIDENCE_TYPE_UNBACKED` as a **warning**; the same document with
    `provenance.reviewStatus: "published"` produces it as an **error**. `author_principle` and
    `hypothesis` never produce it.
16. **`make engine-walk` exists and writes nothing.** It walks a draft pack, reports a `cp` or
    `mateIn` with `depth` and `perspective` for the root and every enumerated position, exits
    non-zero with the shipped `WALK_QUERY_BUDGET_EXCEEDED` past `MAX_QUERIES`, and writes **no**
    `.evidence.json`, `.sources.json` or `.job.json` next to the draft. Its report validates as
    `tabiya.sourcing.walk.v1` with `subject.instrument: "engine"`, **and the committed
    `tablebase-walk` report fixtures still validate unchanged with `instrument` absent** (§7b's
    default-on-read). Asserted to fail before the file exists.
17. **Nothing else moves.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are unchanged; the
    shape-entry schema is unchanged; `EVIDENCE_KINDS` and `ABSTENTION_REASONS` are unchanged;
    `AssessmentGrounding` is still a two-valued union. Every non-opening pack digest is asserted
    identical before and after.
18. **`make verify` is green**, `apps/web` typechecks with the widened `ProjectedAssessment` (§9),
    and `make pack-check` passes on every document in
    `content/drafts/` and `content/candidates/*/pack.json`, with `schemas/fixtures/drill-pack/`
    handled per criterion 3.
19. **No pack-level verified badge appears.** A test greps `apps/web/src` and `apps/server/src` for
    consumers of `assessmentGrounding` / `grounding` and asserts the only client reader is
    `assessmentSentence` — the property §1c and §9 depend on, so a future badge cannot be added
    without turning this test red.

## Open questions

1. **Does the NNUE net identity have to be recorded?** §3d makes a search reproducible for a given
   binary and net, and records `engineVersion`. Stockfish's `EvalFile` can be overridden at runtime,
   in which case two runs of "Stockfish 18 at depth 22" can differ legitimately and
   `VERIFY_ASSESSMENT_CONTRADICTED` would fire with a message that names the wrong cause. Recording
   an `EvalFile` hash in `SourceOrigin.engine` closes it; whether the deployment can obtain that
   hash from a UCI handshake was not verified and this RFC does not guess. **Deferred to
   implementation**, with the fallback of recording the full `id name` handshake string verbatim.
2. **Should `EVIDENCE_TYPE_UNBACKED` be an error for drafts too?** §5d makes it a warning for drafts
   and an error at publication, because promotion to a hard error requires every affected claim to
   be rewritten into a template or relabelled — a content decision across 20 packs, on prose G1
   showed is often untemplatable. The counter-argument is that a label the product prints
   (`reasoning.ts:65`) should never be able to be false, draft or not. **Owner ruling wanted**;
   the code and both severities are specified either way.
3. **Does `ENGINE_ASSESSMENT_DEPTH_BELOW_FLOOR` belong in the format or in the tool?** A depth floor
   pinned to `AUTHORING_PROFILE` makes "grounded" comparable across the corpus, but it also means
   raising the profile retroactively unverifies every committed pack. The alternative is to record
   the depth and let readers judge. This RFC takes the floor because §1a's whole argument is that
   comparability requires a stated instrument; a reviewer may reasonably prefer the looser rule.
4. **What grounds a plan class?** §5a tier three says nothing does, and
   `content-sourcing-foundation.md` agrees for the deviation class. But `design/04` §3 builds the
   middlegame tier on structures and plans, and if plan classes are permanently ungroundable then a
   middlegame pack's central content is permanently ungrounded — a strictly larger version of the
   opening problem this RFC closes. **Out of scope and named**, because it is a design-tier question
   about what a plan class *is*, not a format question. It belongs in a `design/BACKLOG.md` row
   before it belongs in an RFC.
5. **Should `assessedBy` leave `grading` entirely?** §2b keeps it inside `grading` with an inert
   required `resolveAt` on eight of twelve objective types, because moving it would fork four shipped
   readers in the RFC that exists to unfork one. The wart is real and now applies to most packs
   rather than a few. A later consolidation RFC lifting `assessedBy` to `objective.assessedBy`, with
   `grading` reduced to the grading half, is the shape the argument actually points at. **Named, not
   taken.**
6. **How is a claim that two instruments agree on ever grounded?** Raised by cross-review from live
   content: the Scandinavian pair encodes its strongest claim as
   `["corpus_observed", "engine_validated"]`, and §5d shows such a claim can never be fully backed
   under §6's one-templated-record-per-pointer rule, because one sentence cannot be byte-equal to two
   templates. Six committed claims are in this shape. The options are a composite template, an
   ordered multi-record crossing rule, or accepting a permanent warning on the corpus half. **Owner
   ruling wanted**; this RFC ships the permanent warning, which is honest but noisy.
7. **Who writes the evidence admission for `/deviations/{i}/cost`?** `rfc/deviation-classes.md` §3.3
   explicitly delegates it to "the evidence-path RFC (register lane 0.20)" — this one — and this RFC
   **declines** (§11), because `cost` does not exist in the schema yet and its admission is a
   per-pointer contract of a different shape from §4b's one-claim/one-record root admission. **The
   hand-off is therefore unclaimed and must not be left implicit**: it needs either a
   `design/BACKLOG.md` row or a named follow-up RFC before deviation-classes lands, or the field
   ships with a documented-but-unbuilt evidence path.
8. **Does anything attest that a binary ran?** §4b's corrected analysis shows nothing in the repo
   does — `validateOrigin` is structural and `emissionJobDigest` hashes only `{pipeline, args,
   sourceEtags}` with all-`null` etags for engine origins. Options range from "nothing, re-running is
   the check" (this RFC's position) to recording a UCI handshake transcript hash in
   `SourceOrigin.engine`. **Named, not taken**, because the cheap versions attest a string and the
   expensive ones are a different project.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review (claude, not the author). Corpus census re-derived against
  `ffc9817`: **18 → 20 opening packs** (Scandinavian pair), 15 → 17 `follow_theory`, five → **eleven**
  drafts with sidecars. Arithmetic corrected: **"nine of twelve" non-outcome types → eight**, the
  draft's own table having always summed to eight. All `pack-validation.ts`,
  `pack-orchestrator.ts`, `verify-draft.ts`, `check.ts` and `outcome-presentation.ts` line citations
  re-anchored to the tree at `a15a708`, which moved again when `validator-integrity` landed as
  `047de02` (`OBJECTIVE_GRADING_UNSUPPORTED` `:516` → `:274`) and moved to `rfc/archive/`; all
  references to it re-pointed at the archive path. **New §2c**: retiring
  `OBJECTIVE_GRADING_UNSUPPORTED` outright would have admitted an ungroundable `engine` assessment on
  a trajectory leg now that `objectiveIssues` runs per leg — narrowed rather than retired, with
  `TRAJECTORY_LEG_ENGINE_UNSUPPORTED` added. **New §4d**: `SYZYGY_ASSESSMENT_UNGROUNDED` has no
  engine sibling. §4b's forgery-resistance claim corrected from "cannot satisfy" to a measured
  statement of what condition 12 actually defeats. §9 corrected: `ProjectedAssessment` is a closed
  two-arm union and does need widening; the no-badge property verified across every consumer. §5d
  gains the measured blast radius (67 strong labels / 29 packs / 0 backing records) and the
  two-label problem. §7b realigned to the shipped `tablebase-walk` CLI and report shape. §11 gains
  `rfc/deviation-classes.md`, omitted entirely by the draft despite editing the same `check.ts:122`
  refusal and delegating `/deviations/{i}/cost` here. Register: twelve codes → **fourteen** (one
  struck, three added), plus an explicit law-8 check on the record shape. Acceptance criteria 2, 3,
  4, 6, 7, 16, 18 corrected; 6b and 19 added. Open questions 6, 7, 8 added.
