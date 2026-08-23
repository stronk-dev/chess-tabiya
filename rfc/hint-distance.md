# RFC: Hint distance

- **Status:** draft — 2026-08-23. The [[D1061]] ruling's document. Ready for review
- **Author:** claude (on the [[D1310]] mandate read; [[D1330]] live-debt rank 4)
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder), §3a (silence
  default, disclosure model), §3b (naming-never-recommending);
  `design/03-product-breadth.md` §Intelligence and explanation
- **Exploration gate:** owner ruling [[D1061]] of 2026-08-23 — *"hint DISTANCE ships as a real
  assistance axis"*, four increasing disclosures over one piece of evidence, vagueness **derived
  rather than authored per pack**. Research complete and landed:
  `design/research/bestline-is-not-hint-distance.md` (provider + code boundary) and
  `design/research/semantic-horizon-coverage.md` (reach, literal stage adapters, selector)
- **Depends on:** the implemented evidence contract
  (`archive/evidence-contract-manifest.md`, `archive/semantic-evidence-selection.md`) and the
  compiled catalogue at HEAD; **amends** `rfc/learner-modules.md` §4.8/A17 and its module
  registry (accepted 2026-08-22, not yet landed — this is an amendment to an unimplemented
  registry, not a change to shipped behaviour); consumes `rfc/intent-presets.md` §2's
  narrowing-only algebra and §3's `ContextContract`
- **Parent / amends:** `rfc/learner-modules.md` (§4.8 stage grammar, its `guided_hint` accepts
  list and answer ceiling, criterion A17); `rfc/intent-presets.md` (§3 `configClamp` value
  typing; the compiled config's version)
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/`

```tabiya-claims
none
```

## Summary

The owner ruled a hint whose vagueness is a **dial**: square → piece → ply-distance → move, four
increasing disclosures derived from **one** piece of evidence. Two measurement passes since then
found that the ruling is buildable and that every one of the three obvious ways to build it is
false. This RFC specifies the one that is not.

The primitive is **not a principal variation**. A PV supplies moves; it does not supply the event
that "square", "piece" and "distance" refer to. The primitive is a **selected semantic event on a
searched line** — `derived.hint.horizon.<family>@1` — one per eligible event family, each declared
as a derivation of the versioned Stockfish PV **and** that family's already-registered event
projection. The eligible family list *is* the precedence table *is* the module's accepts order:
`module-contract.ts:162` already machine-checks those three for literal equality, so the refusal
table [[D1070]] demands is enforced at compile time rather than living in selector code.

Three further findings changed the specification rather than decorating it:

1. **The four rungs are not four stages.** Rungs 1–3 (square, piece, ply-distance) all sit at the
   `fact` ceiling, so promoting them to module stages would make the stage machinery encode
   something it does not type. The accepted three-stage gate stays three stages; the rungs are a
   disclosure step **inside** stage 2. That resolves [[D1069]] without a fourth stage.
2. **The stage-3 ceiling must come *down*, not up.** `live.stockfish.pv@1`'s own declared
   limitation is *"Explicit Analyze consumer only; never a guidance binding"*
   (`evidence-catalog.ts:772`), and `learner-modules` §4.8 accepts it in a guidance module. This
   RFC removes it: rung 4 is the horizon's **first move**, one move, and `principal_variation`
   leaves `guided_hint` entirely. The horizon projection *cannot* carry a PV, so no ceiling
   mistake can leak the line.
3. **The dossier's grounding is mechanically wrong and the RFC corrects it.**
   `bestline-is-not-hint-distance.md:131` says the horizon "inherits the weakest grounding
   (`bounded_search`)". `evidence-contract.ts:493-495` says otherwise: when a derivation's inputs
   carry more than one grounding, the derived projection's grounding **must be
   `declared_convention`**. The finding survives — the horizon may not claim more than its inputs —
   the label was wrong.

The axis lands as a tenth `AssistanceConfig` field, `hintDistance`, which is what turns
`rfc/enforced-clocks.md` criterion 13 from honestly-red into satisfiable ([[D1290]]). And
[[D317]]'s criterion — *cheating iff `distance === "move"` while a committing decision depends on
it* — stops being prose: this RFC adds a compile-time refusal of any module that declares a
`pre_commit` timing while its answer ceiling admits `move`.

## Motivation

[[D113]] is the owner's own idea and [[D1061]] is the owner's own ruling, and between them sits
the reason it has never been built: the ruling's blocking fact was reported as *data* — "the
engine pass has never been run" — and it is not. Two passes of measurement replaced that premise
with four harder ones.

**The stale premise.** [[D1061]] says *"0 of 764 committed records are `bestline`"*. The durable
content census is **893** records — 415 `engine_eval`, 341 `tablebase_result`, 59
`position_legality`, 52 `opening_identity`, 26 `puzzle_provenance` — and zero bestline. Zero is
not an unrun pass; it is **enforced by type**: `EVIDENCE_KINDS` is a closed seven-member union
with no bestline member (`apps/server/src/sourcing/types.ts:57-66`). "Run a bestline collection
pass" names no writable path, which is [[D1064]].

**The primitive.** `beforeFen + movesUci` cannot derive the ruled axis. Measured over 64
deterministic positions: origin-square and exact-piece are **byte-for-byte the same** candidate
set (4.03 mean candidates remaining, both), role reveals *less* (8.44), and destination square is
frequently the move already (1.83 mean; 42.2% of positions have exactly one legal move to it). No
substitutive reading of "square → piece" increases. And "ply-distance" has no operand at all: an
index into a PV is a distance only once the product names *what happens there*. That is [[D1065]].

**The stability tax.** Depth 8 ↔ depth 12 first-move agreement is **65.6%** against a ≥90% gate —
54.2% cross-phase, 66.7% opening, 81.3% middlegame. Semantic identity compounds it: of the 44
positions where both the depth-12 and 100 ms arms stage an event, only 84.1% agree on the family.
Engine version and budget are therefore **material evidence identity**, not decorative
provenance, and two arms' horizons may never be merged as one fact.

**The reach.** With a literal actor/target adapter per family, a fixed four-ply window and R2's
same-family ceiling, **56/64 (87.5%)** depth-12 lines stage an event (91.7% opening, 81.3%
middlegame, 87.5% cross-phase); the production-budget 100 ms arm reaches **46/64 (71.9%)**. The
horizon is a strong source, never a sole source — theory, authored guidance, tablebase evidence
and an honest empty state stay required.

**The trap.** Stageable is not useful. The families that fire first are led by `developed`
(11/56), then castled / last-of-role / captured-zone-defender / pawn-contact (5 each) and generic
capture (4); double attack and loose piece together reach **4 lines**. That mix is not a defect in
the R2 policy — R2 measures counterfactual distinctiveness, and R3 already measured selectivity
against usefulness at ρ = −0.143. Calling that output "interesting" would recreate the
classifier-noise problem one layer up. That is [[D1070]], and it is why this RFC spends its
central section on a refusal table rather than on rendering.

## Specification

### §1 — The primitive: one horizon projection per eligible family

A new producer `derived.hint` (`packages/runtime/src/hint-horizon.ts`) registers one projection
per eligible event family:

```
derived.hint.horizon.<family>@1
  producer:      derived.hint@1
  plane:         derived
  role:          reading
  payloadType:   HintHorizon
  grounding:     declared_convention          // forced; see §1.3
  exactness:     convention
  confidence:    reported
  answerContent: [...<family>.answerContent, "move"]
  forms:         ["lit_squares", "piece_halo", "sentence", "list"]
  derivation:    { inputs: [live.stockfish.pv@1, <family>@1] }
  abstention:    { possible: true, reasons: ["input_abstained", "no_eligible_event",
                                             "no_typed_actor", "no_typed_target",
                                             "provider_unavailable"] }
```

The payload is the shape `bestline-is-not-hint-distance.md:119-127` proposed, with one deletion
and one addition:

```ts
export interface HintHorizon {
  readonly engineLineRef: VersionedEvidenceId;   // the exact PV evidence: engine, version, budget
  readonly eventRef: VersionedEvidenceId;        // the exact registered event selected on a PV edge
  readonly actor: PieceIdentity;                 // typed, from the sealed edge — never inferred
  readonly targetSquares: readonly Square[];     // typed by the selected event's own operands
  readonly occurrencePly: number;                // 1..HINT_HORIZON_PLIES, the first firing edge
  readonly firstMove: { readonly uci: string; readonly san: string };
}
```

`firstMove` is **one move**. The dossier's `movesUci` is deliberately absent: see §1.2.

#### 1.1 Why one projection per family, not one shared projection

`evidence-contract.ts:492-496` checks derivation widening **per member array**: a derived
projection's `answerContent` must be a subset of the union of *that member's* inputs. Eligible
families do not share answer content — `rules.tactic.event.double_attack@1` declares
`["threat"]`, transition events declare `["fact"]` — so a single shared horizon projection with
an `anyOf` derivation could declare only the intersection, which is empty. One projection per
family is therefore forced by the shipped contract, and it is the better shape anyway: the
eligible set becomes a **registry**, and a family is refused by not existing.

#### 1.2 The horizon cannot carry a principal variation

Ledger: [[D1343]] — the instance is repaired here; the class (a declared `limitations` string that no instrument reads) is not.

`live.stockfish.pv@1` carries `answerContent: ["move", "principal_variation"]`. Each horizon
projection declares `[...family, "move"]` and omits `principal_variation`, which the widening
check permits (subset) and which makes the PV **structurally unreachable** through this
projection. A rendering bug, a ceiling misconfiguration and a mistaken accepts row all fail the
same way: there are no PV bytes in the record to leak.

This is not a scope cut. The full PV remains available exactly where it already is — the explicit
Analyze inspector consuming `live.stockfish.pv@1` — under `full_inspector`'s own ceiling, which
this RFC does not touch.

#### 1.3 Grounding is `declared_convention`, and the dossier's label was wrong

`evidence-contract.ts:493-495`:

```js
const groundingWidens = inputGroundings.size === 1
  ? projection.grounding !== inputProjections[0].grounding
  : projection.grounding !== "declared_convention";
```

Every horizon derivation mixes `live.stockfish.pv@1` (`bounded_search`) with an event projection
(`position_rules` or `declared_convention`), so `inputGroundings.size === 2` and the contract
**requires** `declared_convention`. `bestline-is-not-hint-distance.md:131`'s "inherits the weakest
grounding (`bounded_search`)" would fail `EVIDENCE_DERIVATION_WIDENS` at compile time. The
dossier's *finding* is untouched and is the reason the rule exists: the horizon may not claim the
line is forced or best. `derived.story.last_level@1`, `.rank@1` and `.title@1`
(`evidence-catalog.ts:808-810`) are the shipped precedent for a mixed-input derived projection
carrying `declared_convention` / `convention`.

The user-visible consequence is a wording rule, not a caveat: a horizon sentence says *what would
happen in a line the engine searched*, never *what is best*. Law 8 is not weakened by rendering
this record; it is enforced by the record's inability to say more.

#### 1.4 Abstention is a first-class outcome

`live.stockfish.pv@1` declares `abstention.possible: true`, so `evidence-contract.ts:497` requires
every horizon projection to be abstainable **and** to list `input_abstained`. The four additional
reasons are the honest empty states the coverage measurement predicts: 8 of 64 depth-12 lines
stage nothing within four plies, and 18 of 64 do at the 100 ms budget. `guided_hint`'s
`emptyBehavior` stays `unavailable_source` — named, never faked, and never replaced by a generic
engine move.

### §2 — The eligible family set, the precedence table, and the refusal ([[D1070]])

Ledger: [[D1352]] — reach after the refusal table is a bounded range, not a number.

`module-contract.ts:162` already enforces:

```js
if (precedence.join("|") !== module.accepts.projections.map(refKey).join("|"))
  fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} family precedence must be its literal accepts order`);
```

So the eligible set, the precedence order and the module's accepts list are **one ordered list**,
checked byte-for-byte. This RFC adds no new refusal mechanism; it populates the one that ships.

**The drafted v1 list** (order is precedence, highest first):

| # | horizon projection | family it derives from | why it earns a hint |
|---|---|---|---|
| 1 | `derived.hint.horizon.mate_in_one@1` | `rules.tactic.consequence.mate_in_one@1` | the target square is the mate square; nothing outranks it |
| 2 | `derived.hint.horizon.forced_mate@1` | `rules.tactic.consequence.forced_mate_after_move@1` | typed mating net with an exact actor |
| 3 | `derived.hint.horizon.double_attack@1` | `rules.tactic.event.double_attack@1` | every retained target square is a declared operand |
| 4 | `derived.hint.horizon.fork_survives_reply@1` | `derived.tactic.fork_survives_reply@1` | the fork that is still there after the reply |
| 5 | `derived.hint.horizon.discovered_executed@1` | `derived.tactic.discovered_executed@1` | actor and revealed line are both typed |
| 6 | `derived.hint.horizon.loose_piece@1` | `rules.tactic.event.loose_piece@1` | the signed loose-piece identity is the target |
| 7 | `derived.hint.horizon.promotion_pressure@1` | `derived.tactic.promotion_pressure@1` | typed pawn identity and promotion square |

**Refused in v1, each with its reason** — the half of [[D1070]] that matters more than the
eligible list:

| refused | reason |
|---|---|
| `developed`, `castled`, `last_of_role`, bare `capture`, `trade_completed`, bare `check` | high-volume geometry. These are the families that actually lead the measured first-selection mix (11 + 5 + 5 + 4 of 56); admitting them lets a development move crowd out a named consequence three plies later, which is the exact defect [[D1070]] names |
| pawn-island count events | no exact changed-island identity in the payload — no typed target (`semantic-horizon-coverage.md:102`) |
| castling-right loss | no single declared square target (`:101`) |
| `derived.semantic_avoidance.*` | alternative-only; alternatives disagree on the target (`:103`), and `module-contract.ts:167` independently refuses avoidance evidence without a denominator |
| the four `recorded_run` sequence families — deflection, attraction, interference, check-zwischenzug, overload exploitation, both clearance forms | [[D1068]]: their grounding is `recorded_run` and their constructors require `run.record.move@1` inputs (`semantic-evidence.ts:907`). A Stockfish PV is hypothetical evidence. See §3 |

**The list is a drafted candidate, not a total** ([[D1240]]). Criterion 4 asserts the registry is
**set-equal to the output of a re-run** of `tools/d1066-semantic-horizon-harness/` under the
production table, not equal to the integer 7 or to this table. Two integers are baked in only as
drift tripwires: production reach must be **≤ 56/64** at depth 12 (refusal can only remove) and
the seven-row list must not grow without a re-run.

**Selection is precedence-dominant, then earliest.** Within a line, choose the highest-precedence
family that fires **anywhere** in the window, then that family's earliest occurrence ply, then the
lexicographically smallest canonical target square, then the smallest move UCI. Precedence
dominating ply is the whole point: *"a generic capture or development event must not crowd out a
later named consequence merely because it occurred first"* (`semantic-horizon-coverage.md:76-77`).

**The window is four plies and does not grow.** `HINT_HORIZON_PLIES = 4`, on the measured
distribution — 34 lines fire at ply 1, 11 at ply 2, 7 at ply 3, 4 at ply 4, 8 empty. Deepening the
search to find an event is explicitly refused: *"A long fallback search is neither required nor
licensed by this result"* (`:55-56`). An empty window renders the empty state.

### §3 — The source split: engine-line events are not observed-run events ([[D1068]])

The split is narrower than the dossier's phrasing implies, and the narrowing is load-bearing.

**One-edge rules events replay freely.** `localSemanticEvents(beforeFen, moveUci, afterFen)`
(`semantic-evidence.ts:920-923`) is a pure function of a position triple. A double attack on a
hypothetical position is a rules fact about that position; nothing about how the position was
reached enters the predicate. Every family in §2's eligible list is one-edge, so v1 needs **no new
event declarations at all** — only the seven horizon projections that join them to a PV.

**Multi-edge sequence events do not.** The Wave-C constructors seal `recorded_run` evidence and
`exactSequenceInputs(...)` rejects any input that is not a `run.record.move@1` chain
(`semantic-evidence.ts:907`). Relabelling them would launder the source. They are therefore
refused from v1's ladder, and the RFC states the cost rather than hiding it: the measured PV
population contains 21 square-clearance and 1 line-blocker-clearance witnesses over 8 lines that
v1 will not see. That is a real 8/64 of reach left on the table, and it is left there on purpose —
the engine-line twins are [[D1067]]'s work (the recorded-path compiler and the engine-horizon
compiler are two adapters, per `planning/evidence-foundation-ux/d1067-path-compiler-audit.md`),
not this RFC's.

**The mechanism that makes laundering impossible is already shipped**, which is why this section
adds no check: a derivation naming `run.record.move@1` and `live.stockfish.pv@1` as inputs would
mix `recorded_run` with `bounded_search`, and the constructors would reject the PV before the
contract ever ran.

### §4 — The rungs are a disclosure step, not a fourth stage ([[D1069]])

Ledger: [[D1351]] — a ceiling maps to exactly one answer image, so it reads as a lattice and is not one. [[D1353]] — the mapped-type clamp makes `AssistancePermission`'s `"legal"` member redundant.

**The contradiction, exactly.** `learner-modules` §4.8 and `module-contract.ts:155` hard-code
three stages and the literal join `"1:pattern|2:fact|3:principal_variation"`;
`ModuleAnswerContract.stages` types `stage` as `1 | 2 | 3`. [[D1061]] rules four rungs. Neither
"pattern" nor "occurrence ply" has a home in the other's vocabulary.

**Two readings were available.** `semantic-horizon-coverage.md:150-154` recommends the first.

*(a) Widen the stage machinery to four*, with a second grammar for the theory/authored flow. Cost:
`stage: 1|2|3` becomes `1|2|3|4`, the validator's literal join becomes a per-flow lattice, and
every module re-validates. **What decides against it**: the four engine rungs would carry the
ceilings `fact | fact | fact | move`. Three adjacent stages at one ceiling means the per-stage
compiler refusal — the entire purpose of the stage gate — enforces *nothing* between rungs 1, 2
and 3. The stage gate would grow by a third and check no more than it does now.

*(b) Keep three stages; make the rung a disclosure step inside stage 2.* The ceiling gate stays
where it types something, and the rung boundary is enforced by the projection's own disclosure
step. **Chosen**, on the buildability test.

**The ladder, whole.** Five rungs; the owner's four are the last four. Rung 0 is additive and
strictly vaguer than rung 1, so nothing in the ruling is substituted.

| rung | id | discloses | module stage | stage ceiling |
|---|---|---|---|---|
| 0 | `pattern` | the event family, no target ("there is a fork in this line") | 1 | `pattern` |
| 1 | `square` | + the target square(s) | 2 | `fact` |
| 2 | `piece` | + the actor piece | 2 | `fact` |
| 3 | `distance` | + the first-occurrence ply | 2 | `fact` |
| 4 | `move` | + `firstMove` (one move) | 3 | `move` |

Cumulative, never substitutive — the measurement is unambiguous that a substitutive reading does
not increase (§Motivation). Rung 2 **adds** an actor to rung 1's square; it does not replace it.

**One ladder serves both grounds.** `semantic-horizon-coverage.md:151-154` asks for two grammars —
engine-semantic and theory/authored. They are the same ladder under different ceilings: an
authored or cited-theory hint enters at rung 0 (the named pattern) and its ceiling stops at rung 2
(`piece`), because `occurrencePly` has no meaning without a searched line and `firstMove` is not
authored. Rung 3 **abstains** on that ground rather than being absent from it, which keeps one
vocabulary, one config field and one clamp instead of two of each.

**The amendment to `learner-modules`, in named edits:**

1. `module-contract.ts:12` — `ModuleAnswerCeiling` gains `"move"`.
2. `module-contract.ts:129-136` — `MODULE_ANSWER_IMAGE` gains `move: ["move"]`.
3. `module-contract.ts:155` — the literal join becomes `"1:pattern|2:fact|3:move"` and the guard
   becomes `ceiling !== "move"`.
4. `learner-modules` §4.8 — stage 3's ceiling drops from `candidate_move`/`principal_variation` to
   `move`; `live.stockfish.pv@1` leaves the accepts list; the seven horizon projections join it in
   precedence order; stage 2's *"at most the subject piece/square"* becomes *"the rungs of the
   selected horizon up to the requested rung"*; the mark budget goes **1 → 2** (rung 1 lights the
   target square, rung 2 haloes the actor — both are `ModuleForm` `square`, whose image is
   `["lit_squares", "piece_halo"]`, `module-contract.ts:122`).
5. `learner-modules` criterion A17 — rewritten as this RFC's criterion 6.

Every one of these **narrows** what a guidance module may print. That is the direction in which
amending an accepted-but-unlanded contract is safe.

**The rung is requested; the stage is derived.** `packages/runtime/src/hint-horizon.ts` exports
`HINT_RUNGS` (the ordered five), `HintRung`, and a total `stageOfRung(rung): 1 | 2 | 3`. The
guided-hint packet request carries a **rung**, never a stage. A stage cannot be requested
independently, so a stage and a rung can never disagree.

### §5 — The assistance axis ([[D1061]], [[D1290]])

**A tenth field.** `packages/runtime/src/assistance.ts:4-15`:

```ts
export interface AssistanceConfig {
  readonly version: 5;                                    // was 4
  // ... the nine existing fields, unchanged ...
  readonly hintDistance: "off" | "pattern" | "square" | "piece" | "distance" | "move";
}
```

`SILENT_ASSISTANCE` gains `hintDistance: "off"` (`assistance.ts:17-19`), and
`permittedAssistance`'s return (`assistance.ts:30-34`) gains a `hintDistance` entry — which
TypeScript **forces**, because the return type is
`Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>`. Omitting it is a compile
error, not a review miss.

**Version 5, with the shipped migration shape.** `apps/web/src/lib/assistance-preference.ts:40-51`
already carries one arm per prior version; v3→v4 added `boardLighting`/`arrows`/`ambient` the same
way. `validV4` becomes `validV5` with the `hintDistance` member check, and a new
`item.version === 4` arm returns `{ ...item, version: 5, hintDistance: "off" }`. The existing v3,
v2 and v1 arms retarget to 5 with the same default. `"off"` and not a rung is the file's own
convention: every field a migration adds arrives at its off value (`spoken: "off"`,
`arrows: "off"`, `ambient: "off"`), with the single exception of `boardLighting`, which arrives at
`"legal"` because the rules floor is a floor and not an assistance grant.
`rfc/intent-presets.md`'s *"the compiled `config` stays version 4"* is amended to 5.

**The clamp is a per-field value, which needs one line of typing.** `rfc/intent-presets.md` §3
declares:

```ts
readonly configClamp: Readonly<Partial<Record<keyof AssistanceConfig, AssistancePermission>>>;
```

`AssistancePermission` is `"free" | "locked_off" | "legal" | "sight" | "evidence"` — and three of
those five are already **field values** (`boardLighting`/`arrows` tokens), not permissions, which
is why §3 had to extend the union with `"legal"` and then add a prose invariant restricting it to
one field. A hint clamp cannot say "clamp to rung 2" in that vocabulary at all. The fix is the
mapped type the situation was always asking for:

```ts
readonly configClamp: Readonly<{
  [K in Exclude<keyof AssistanceConfig, "version">]?: AssistancePermission | AssistanceConfig[K]
}>;
```

One line, and TypeScript enforces per-field validity that §3 currently enforces in prose. A
`hintDistance` clamp carries a rung token denoting the range `["off", token]` — the same
range-token semantics §3 gave `"legal"`, now typed instead of described.

**The ∩ algebra is untouched and does the work.** Under `intent-presets` §2, every term only
narrows. The effective rung is the **minimum** over: the preset's projection, the learner's stored
`hintDistance`, the context's `configClamp` entry, and source availability (a `no_eligible_event`
abstention caps the effective rung at `off`). Requesting a rung above the effective ceiling is
**refused** — `HINT_RUNG_ABOVE_CEILING` — never silently downgraded, so a UI that offers an
unavailable rung fails loudly instead of quietly showing less than it promised.

**What this makes satisfiable.** `rfc/enforced-clocks.md` criterion 13 is honestly red because
"[[D1061]]'s hint-distance axis" is not a `keyof AssistanceConfig`. With `hintDistance` shipped
and clampable, both of its arms become assertable: every clock-admitting context declares an
explicit entry (absence fails), and at least two declare different values. This RFC does not
declare those entries — `enforced-clocks` owns its own table — it supplies the key they clamp.

### §6 — [[D317]]'s criterion becomes a compile-time refusal

[[D1132]] found the substantive residue [[D1061]] did not settle: D317's criterion is *cheating
iff `distance === "move"` while a committing decision depends on it*, which is about **pre-commit
availability of the top rung**. [[D1290]] ruled the response is a per-context ceiling term, §5.
This section adds the floor underneath that ruling.

**Today the top rung is unreachable pre-commit, by two independent accidents.** `guided_hint`
declares `checkpoint` timing, whose image is `["checkpoint", "attempt_end"]`
(`module-contract.ts:115`) — no pre-commit member. And the runtime path that produces a PV at all,
`DrillRunService.analysis`, calls `this.#refuseRatedAssistance(runId)` as its first statement
(`apps/server/src/service.ts:1481`), so a rated run cannot obtain a horizon at any rung.

Two accidents are not a guarantee. Both are single declarations away from reversal, and nothing
fails when they reverse. So:

```ts
// module-contract.ts, assertDeclaration
if (module.timings.some((t) => t.timing === "pre_commit") &&
    (module.answerCeiling.ceiling === "move" || module.answerCeiling.ceiling === "principal_variation"))
  fail("MODULE_ANSWER_WIDENS", `${module.id} offers move-distance content before commit`);
```

Checked against §4's eleven declarations as written: `guided_hint` is `checkpoint`-timed;
`full_inspector` is an explicit analysis mode, which §2's timing table defines as `review`;
`compare_coach` reads preserved attempts and is `review`/`checkpoint`; `blunder_prevention` is
`at_commit` and `module-contract.ts:170` already refuses it any other timing; and the modules that
do reach pre-commit — `sight_on_request`, `threat_radar`'s Support arm — top out at `threat`. So
the refusal costs nothing today, which is the point: it is the only thing that keeps it costing
nothing tomorrow. Criterion 8 asserts the green compile rather than assuming it.

Rung 4 is thereby unavailable pre-commit **structurally**, and the [[D1290]] clamp does the
remaining work — deciding, per context, whether rungs 1–3 are also too much under a running clock.
The clock lane and the hint lane meet at exactly one symbol, `configClamp.hintDistance`, and
nowhere else.

### §7 — Collection: the writable path is the runtime event path ([[D1064]])

There are three stores and only one of them can be written with a PV today.

| store | can it hold a PV? | evidence |
|---|---|---|
| durable sourcing ledger (893 records) | **no** — `EVIDENCE_KINDS` is a closed seven-member union with no bestline member | `apps/server/src/sourcing/types.ts:57-66` |
| `make engine-walk` | **no** — read-only; emits a cp/mate node and at most one best-move child score | `apps/server/src/sourcing/engine-walk.ts:72-88` |
| run events | **yes, today** — `DrillRunService.analysis` enqueues `kind: "bestline"` and the worker persists `movesUci` plus `searchProvenance` as an `evidence.attached` run event | `service.ts:1469-1496`; `evidence-queue.ts:436-449` |

**v1 uses the third and adds nothing to the first.** This is not only what is buildable, it is what
the feature needs: the run-event path already covers Just Play, imported games and arbitrary
campaign positions, none of which a bulk-authored pack sidecar could serve. And because
`searchProvenance` carries engine, version and budget, `engineLineRef` — which §Motivation's 65.6%
stability result makes mandatory — is satisfiable without a new field.

**A durable authoring bestline kind is explicitly out of scope**, and not deferred silently: it
would be a `EVIDENCE_KINDS` extension plus a sourcing-schema decision, it would churn on every
engine or budget change (65.6% depth-8↔12 agreement means a re-run rewrites a third of the first
moves and therefore a third of the squares, pieces and events), and it cannot serve a position no
author anticipated. If it is ever wanted, it is a `pack-population-provenance` question, and
Discharge D6 names it there.

**The latency the packet must fix.** Cold horizon compilation costs mean **329 ms / p95 799 ms**
per searched edge over 229 edges, at 1.79 searched edges per line — roughly 600 ms per hint cold,
against 38.7 ms mean warm. The horizon's declared latency is `{ mode: "interactive", maxMs: 1500 }`
with a pending state, and independent recomputation per consumer is refused: the shared
score-free candidate/event packet is [[D1071]], and Discharge D5 routes it.

### §8 — Rendering, and the boundary the LLM may not cross

Rung rendering is deterministic (`ModuleDeclaration.rendering: "deterministic"`, already required
by `module-contract.ts:143`). Rungs 0–3 render from typed operands only: the family's registered
display name, `targetSquares` as lit squares, `actor` as a piece halo, `occurrencePly` as an
integer count of moves. Rung 4 renders `firstMove.san`.

Budgets, amended in §4's edit 4: `maxMarks: 2`, `maxArrows: 1` (rung 4 only), and §4.8's existing
2 facts / 40 words per stage unchanged.

An enabled LLM may paraphrase the sentence of the **already-selected, already-sealed** rung. It may
not select the event, choose the rung, infer a target, name a move, fill an empty source, or
describe the line as best or forced. This is law 8 at its sharpest, and the record's own shape is
the enforcement: with `principal_variation` absent from every horizon projection (§1.2) and
grounding fixed at `declared_convention` (§1.3), the sealed payload contains nothing that could
ground a "best move" sentence even if a renderer tried to write one.

## Deviations from design

- `design/05-in-run-experience.md` §3's assistance ladder is described with rung 5 as an authored
  claim and rung 0 as a stated fact. This RFC's five rungs are the *disclosure* ladder of one
  module and are not that ladder renumbered; §4's table is scoped to `guided_hint`. No design-tier
  edit is proposed, and none is needed — but if the owner reads the two ladders as one vocabulary,
  that is a design-tier reconciliation this RFC would carry a BACKLOG row into rather than write
  itself (law 5).
- `semantic-horizon-coverage.md:150-154` recommends two grammars; §4 ships one ladder with two
  grounds and states the deciding argument. The dossier's recommendation is not dismissed, it is
  answered.
- `bestline-is-not-hint-distance.md:131`'s grounding label is corrected in §1.3. The dossier is
  living-tier and its erratum is Discharge D7.

## Acceptance criteria

> **Returned to research 2026-08-23.** [[D1377]] — eight buildability blockers. [[D1378]] — four of §2's seven eligible families are readings or predicates, not events, so `occurrencePly` has no referent for them. [[D1376]] — the measured reach of the eligible list is 4 of 64, not the band [[D1352]] reported.

1. **The seven horizon projections compile, and no eighth kind of thing does.** The compiled
   manifest contains `derived.hint.horizon.*@1` for exactly the registered eligible families, each
   with `grounding: "declared_convention"`, `exactness: "convention"`, an abstention listing
   `input_abstained`, and a derivation naming `live.stockfish.pv@1` plus one event projection.
   *Negative: a projection declaring `grounding: "bounded_search"` — the shape
   `bestline-is-not-hint-distance.md:131` proposed — fails `EVIDENCE_DERIVATION_WIDENS`.*
2. **No horizon projection can carry a PV.** For every `derived.hint.horizon.*@1`,
   `answerContent` excludes `principal_variation`, and `HintHorizon` has no field holding more than
   one move. *Negative: adding `movesUci` to the payload, or `principal_variation` to
   `answerContent`, fails — the latter at the widening check only if some input lacks it, so this
   arm is asserted directly over the registry, not left to the contract.*
3. **`guided_hint` no longer accepts `live.stockfish.pv@1`.** Its accepts list contains the seven
   horizon rows and the four non-engine rows §4.8 already names, and does not contain
   `live.stockfish.pv@1`, whose declared limitation is *"Explicit Analyze consumer only; never a
   guidance binding"*. `full_inspector`'s acceptance of it is unchanged. *Negative: the accepted
   §4.8 accepts list, unamended, fails this arm — which is the point.*
4. **The eligible registry is set-equal to a re-run, not to this RFC's table** ([[D1240]],
   [[D1070]]). Re-running `tools/d1066-semantic-horizon-harness/` under the production precedence/
   refusal table yields a family set **set-equal** to the compiled registry, and the resulting
   depth-12 reach is **≤ 56/64** (the upper bound; refusal only removes). Two tripwires, not
   targets: a registry that grew without a re-run fails; a reach above 56/64 means the refusal
   table was not applied. *Negative: an implementation that inherits R2's candidate policy
   unchanged admits `developed` and fails set-equality.*
5. **Precedence dominates occurrence ply.** On a fixture line where a `developed` event fires at
   ply 1 and a `double_attack` at ply 3, the selected horizon is the double attack.
   *Negative: an earliest-first selector returns the development event — the exact defect
   [[D1070]] names.* A second arm: on a line where two eligible families both fire, the
   higher-precedence one wins regardless of ply, and `familyPrecedence` is byte-equal to the
   accepts order (`module-contract.ts:162` already fails otherwise).
6. **The rung ladder is cumulative and gated (replaces `learner-modules` A17).** Against a position
   with an admitted horizon: the rung-0 packet names the family and contains no square; rung 1
   adds the target square(s) and no piece identity; rung 2 adds the actor and no ply integer;
   rung 3 adds the ply and no move or SAN; rung 4 adds `firstMove`. Each rung's packet is a
   **superset** of the previous rung's. *Negatives: a rung-2 packet carrying `firstMove.san` fails
   the per-stage compiler refusal; a rung-2 packet that has dropped rung 1's square fails the
   cumulative arm — the substitutive reading the disclosure census refuted.*
7. **The stage is derived, never requested.** The guided-hint request type has no stage field, and
   `stageOfRung` is total over `HINT_RUNGS`. *Negative: a request carrying both a rung and a stage
   does not typecheck.*
8. **Move-distance content is refused before commit** ([[D317]], [[D1132]]). `compileModuleRegistry`
   throws `MODULE_ANSWER_WIDENS` for any module declaring a `pre_commit` timing with an answer
   ceiling of `move` or `principal_variation`; the eleven-module registry compiles green today.
   *Negative: adding `{ timing: "pre_commit", initiative: "on_request" }` to `guided_hint` fails
   the compile — asserted as a red fixture, not as prose.*
9. **The axis exists as a config field and every consumer is forced to see it.**
   `AssistanceConfig` is version 5 with `hintDistance`; `SILENT_ASSISTANCE.hintDistance === "off"`;
   `permittedAssistance` returns a `hintDistance` entry (a compile error otherwise); `validV5`
   rejects an unknown rung token; the `version === 4` migration arm yields `hintDistance: "off"`.
   *Negative: a migration arm defaulting to any rung above `off` fails — every field a migration
   adds arrives off, `boardLighting`'s rules floor being the file's one deliberate exception.*
10. **The clamp narrows and cannot widen** ([[D1290]]). With `configClamp` typed per field, the
    effective rung is the minimum over preset projection, stored value, context clamp and source
    availability. *Negatives: a context clamp of `"move"` against a stored `"square"` yields
    `"square"`, not `"move"`; a request for a rung above the effective ceiling raises
    `HINT_RUNG_ABOVE_CEILING` rather than returning a lower rung's packet.*
11. **`enforced-clocks` criterion 13 turns green on this RFC's key and nothing else.** After
    landing, `keyof AssistanceConfig` includes `hintDistance`, so that criterion's completeness arm
    is expressible over the `ContextContract` table. This criterion asserts expressibility only;
    the table entries are that RFC's obligation.
12. **The empty state is named, and no fallback invents a move.** With `HINT_HORIZON_PLIES = 4` and
    no eligible event, the module renders its declared `unavailable_source` state. *Negatives: a
    deepened search to find an event fails (`semantic-horizon-coverage.md:55-56` licenses none); a
    fallback that renders the PV's first move as a bare "try this" fails, because rung 4 requires a
    horizon and there is none.*
13. **The horizon is unobtainable in a rated run.** A rated run's analysis request is refused at
    `service.ts:1481` before any job is enqueued, so no rung is reachable. Asserted as a fixture so
    that removing `#refuseRatedAssistance` breaks a hint test as well as a rating test.
14. **Latency is declared and measured, not assumed** ([[D1071]]). The horizon binding declares
    `{ mode: "interactive", maxMs: 1500 }`, and a cold/warm/provider-off measurement is recorded
    against the 329 ms mean / 799 ms p95 per-edge baseline before the module is offered by default
    in any context.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The seven horizon projections, `hint-horizon.ts`, the selector, the four `module-contract.ts` edits and the `AssistanceConfig` v5 field | codex | this RFC's implementing commit | |
| D2 | The `learner-modules` §4.8/A17 amendment landing in that RFC's text ([[D1069]]) | claude | `rfc/learner-modules.md` changelog | |
| D3 | The `intent-presets` §3 `configClamp` typing and the version-5 line | claude | `rfc/intent-presets.md` changelog | |
| D4 | The per-context `hintDistance` clamp entries and criterion 13's two arms ([[D1290]]) | claude | `rfc/enforced-clocks.md` | |
| D5 | The shared score-free candidate/event packet ([[D1071]]) | claude | `rfc/shared-candidate-evidence-packet.md` (unwritten; `planning/platform-alignment/dossier-remainder.md` rank 5) | |
| D6 | Engine-line twins for the `recorded_run` sequence families, and the two-adapter path compiler ([[D1067]], [[D1068]]) | claude | `planning/evidence-foundation-ux/d1067-path-compiler-audit.md` | |
| D7 | The grounding erratum on `design/research/bestline-is-not-hint-distance.md:131` ([[D1065]]) | claude | that dossier's erratum line | |
| D8 | The production-table re-run of `tools/d1066-semantic-horizon-harness/` that criterion 4 asserts against ([[D1066]], [[D1070]]) | claude | `planning/evidence-foundation-ux/` results file | |
| D9 | A durable authoring bestline evidence kind, if ever wanted ([[D1064]]) | OWNER | `rfc/pack-population-provenance.md` sourcing-schema question | |

## Open questions

1. **Rung 0 is additive to the owner's ruling.** [[D1061]] names four rungs; §4 ships five, with
   rung 0 (`pattern`) strictly vaguer than rung 1 and required by the theory/authored ground. It
   substitutes nothing and removes nothing, so it is drafted rather than escalated — but it is the
   one place this RFC's ladder is longer than the ruling's, and the owner may want it collapsed
   into rung 1. Cost of collapsing: the theory/authored ground loses its only expressible rung and
   needs the second grammar §4 rejected.
2. **The mapped-type `configClamp` versus five new `AssistancePermission` members.** §5 specifies
   the mapped type: one line, per-field validity enforced by the compiler, and it makes
   `AssistancePermission`'s `"legal"` member redundant (left in place; removing it is a separate
   cleanup). The alternative — extending `AssistancePermission` with `"pattern" | "square" |
   "piece" | "distance" | "move"`, following the precedent §3 set for `"legal"` — needs no
   accepted-type change but adds five field-specific tokens to a shared union and keeps the
   restriction in a prose invariant. Recommended as specified; recorded because it edits an
   accepted RFC's type.
3. **Whether `hintDistance` is offered as a learner-visible control or only as a ceiling.** §5
   specifies a learner-facing field, because [[D1061]] ruled it an assistance *axis* and the other
   nine fields are all learner-visible. If the owner wants the rung to be paced by the product
   rather than chosen, the field becomes clamp-only and the request always asks for the next rung
   up. Not acceptance-blocking either way: the type, the clamp and the ∩ algebra are identical.
4. **v1's reach after refusal is unmeasured.** 56/64 is the upper bound under the R2-derived
   candidate policy; the production table can only lower it, and by how much is D8's measurement.
   If the answer is low enough that the module is usually empty, the honest response is a wider
   eligible list justified by a *new* measurement — not a relaxed refusal table, and not a generic
   engine-move fallback, which criterion 12 refuses.

## Ledger rows

Proposed — ids assigned at landing; head was **D1332** at drafting.

- 🐞 **`learner-modules` §4.8 accepts a projection its own catalogue forbids there.**
  `live.stockfish.pv@1` declares the limitation *"Explicit Analyze consumer only; never a guidance
  binding"* (`evidence-catalog.ts:772`), and §4.8 lists it in `guided_hint`'s accepts (stage 3
  only) — `guided_hint` ships in the `guided` and `support` presets, both guidance. Nothing catches
  it: `limitations` is prose, checked only for non-emptiness (`evidence-contract.ts:452`). Fixed
  here by removing the row (§1.2, criterion 3); the class — a declared limitation with no
  enforcement — is unfixed and worth a check.
- 🐞 **A module accepts row cannot declare `answerContent` unless it equals the ceiling's single
  image.** `MODULE_ANSWER_IMAGE` maps each ceiling to exactly one `AnswerDistance`
  (`module-contract.ts:129-136`) and `:166` requires every row's `answerContent` to be a subset of
  it. So under a `principal_variation` ceiling, a row declaring `["fact"]` fails — meaning §4.8's
  seven rows must all omit the optional field. Not a defect in this RFC's path (the horizon rows
  omit it and the per-rung gate does the work), but the ceiling reads as a lattice and is not one.
- 📊 **Production horizon reach after the [[D1070]] refusal table is unmeasured.** 56/64 depth-12
  and 46/64 at 100 ms are upper bounds under the R2-derived candidate policy; the refused families
  lead the measured first-selection mix, so the true figure is bounded above by 56/64 and below by
  the 31/64 that would remain if refusal never re-selected — a range, not a number. D8.
- 💡 **The mapped-type `configClamp` makes `AssistancePermission`'s `"legal"` member redundant.**
  Once a clamp value may be the field's own type, `"legal"` is just `AssistanceConfig["boardLighting"]`
  and `intent-presets` §3's prose invariant becomes a compiler check. Cleanup, not a blocker.

## Changelog

- 2026-08-23: created. Drafted from the two landed dossiers on the [[D1061]] ruling, with three
  hard facts resolved in spec rather than deferred — [[D1069]]'s stage contradiction (§4: three
  stages, five rungs, the rung inside stage 2), [[D1064]]'s unbuildable collection path (§7: the
  runtime `evidence.attached` route, with the durable authoring kind explicitly out of scope), and
  [[D1065]]/[[D1068]]/[[D1070]]'s primitive mismatch (§1–§3: one horizon projection per eligible
  family, the accepts list as the refusal table, one-edge events only). Two corrections re-derived
  at HEAD: the dossier's `bounded_search` grounding is refused by
  `evidence-contract.ts:493-495` and must be `declared_convention`; and `guided_hint`'s stage-3
  ceiling must come **down** to `move`, because `live.stockfish.pv@1` forbids guidance bindings in
  its own declaration.
