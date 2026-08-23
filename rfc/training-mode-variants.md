# RFC: Training-mode variants — the encounter-kind widening and the solitaire family

- **Status:** draft 2026-08-23 — the rank-1 live-debt lane ([[D1330]]). Two accepted-or-drafted documents currently refuse the owner's ask: `rfc/variants.md:667` **names and ejects** solitaire chess ("its own lane, in parallel"), and `rfc/campaign-core.md:115` keeps `encounter.kind` **closed at one member**. This is that lane. It widens the encounter vocabulary by **exactly two members** — the two `campaign-core.md` itself names as belonging to its Discharge D2 — resolves the law-8 seal collision D2 demands rather than inheriting it, and prices the **whole family** ([[D1230]]), not the one format that happens to be cheapest.
- **Author:** claude (drafted from `design/research/training-mode-variants.md` — the 30-format catalogue — and `planning/variants/rfc-derivation.md` §5, §7 gaps 16–17, §8 rank 2)
- **Created:** 2026-08-23
- **Design refs:** `design/06-campaign.md:461-464` (the four-row encounter vocabulary, closed at four by [[D1152]]); `design/06-campaign.md` §5's authored-boundary arithmetic; `design/00-thesis.md` §§70, 93-94 (the play-the-consequence constraint)
- **Exploration gate:** [[D1310]] — the drafting mandate read as general: *"[[D1093]] covers EVERY lane the owner has asked for, not the three it happened to enumerate."* [[D1093]] itself records the owner's instruction (*"dont defend shit just ensure we do it well going forward. check the research. make sure we have all the DEPTH and BREADTH"*) as the owner ruling RFC-0000's exploration gate requires. The lane was opened by [[D1031]], which names [[D869]]/[[D870]] among the five idea rows it consolidates.
- **Depends on:** `rfc/campaign-core.md` (implementing — owns `$defs/encounter`; this RFC is the successor amendment its Discharge D2 names), `rfc/variants.md` (draft — owns the rule-variant axis and §8.1's reduced-army admission, cited here, never duplicated)
- **Parent / amends:** amends `rfc/campaign-core.md` §1's encounter union and `schemas/campaign.schema.json` `$defs/encounter`
- **Supersedes / superseded by:** —
- **Planning:** `planning/variants/` (`rfc-derivation.md` §5, §7, §8)

```tabiya-claims
none
```

## Summary

The owner asked for two things a day apart and neither shipped. [[D869]]: *"I really like the idea
of 'solitaire chess'… THAT sounds like a variant that fits within our campaign mode and as a
separate mode."* [[D870]]: *"shouldn't our campaign mode have more variants like that??? what other
novel chess variations there be???"* — recorded in the ledger as *"the campaign wants a FAMILY of
training-mode variants, not one."* This RFC specifies the family.

It does three things. **(1)** It opens `encounter.kind` from `const: "pack"` to a three-member
union by adding `prediction` and `survival` — the two members `rfc/campaign-core.md:115` names as
*"a schema change belonging to the Discharge rows"*, each mapped to a verdict producer that already
exists in `design/06-campaign.md:461-464`. **No fifth producer is invented**; [[D1152]] closed that
vocabulary at four on the finding that the 30-row catalogue *"needed exactly this one producer and
no fifth"*, and this RFC's family table reproduces that result rather than re-opening it.
**(2)** It resolves the collision `campaign-core.md` Discharge D2 demands and does not inherit it:
a prediction encounter is sealed by **agreement with the move actually played in the recorded
game** — a fact about that game — while Maia's policy mass is **colour and never seal**, which
leaves format v0.9's no-verdict rule (`docs/drill-pack-format.md:15-17`) untouched rather than
bent, and gains a lint that makes the separation falsifiable. **(3)** It lifts the prediction pack
gate at `apps/server/src/service.ts:1512-1514`, which this draft measured **dead in both
directions** at HEAD — not merely closed to imported games — and which is the producer
`rfc/longitudinal-store.md:229`'s `decision_class='predicted'` has been waiting on.

The rest of the family — survival/streak (unblocked by [[D1152]]), avoid-the-blunder, threat-radar,
defender-chain, play-the-structure, hold-under-shrinking-clock, band-split solitaire, brain-with-a-
banded-hand — is priced here in full, each with its verdict shape, its learner act, its surviving
evidence and, where deferred, **a named home and a named owner** ([[D1230]]).

## Motivation

**The ask is live debt, and the debt is measurable.** [[D1330]]'s per-dossier classification of all
118 artifacts ranks `training-mode-variants` **first of ten live-debt dossiers**, ranked by owner
interest, with the refusal named precisely: *"`variants.md:667` names and **ejects** solitaire,
`campaign-core.md:115` keeps `encounter.kind` closed at one member."* Both statements are true at
HEAD and were verified for this draft. The research landed on 2026-08-22; the ledger rows
[[D883]]–[[D891]] have sat `💡 open` since; and [[D1091]] already diagnosed the mechanism —
*"research whose consumer is an EVIDENCE COLLECTOR reaches an RFC reliably; research whose consumer
is a PRODUCT SURFACE stalls at 'lane opened'"* — naming training-mode variants among the ten owner
asks with no RFC. An RFC is what discharges that class, so this is one.

**Why it is not `rfc/variants.md`.** [[D870]] draws the axis line and this RFC keeps it: *"the
distinction to keep crisp: **training-mode variants** (different ways of engaging standard chess —
solitaire, hand-and-brain, tempo cycles, avoid-the-blunder) are campaign-encounter material and
mostly law-8-clean over existing primitives; **rule variants** (Chess960 etc.) are a different axis
already parked under [[D327]]/[[D328]] and stay parked."* `rfc/variants.md` owns the rule axis; its
§9 deferral row for solitaire already points here (*"its own lane, in parallel (claude)"*). The two
documents share no schema surface: `variants.md` claims run-schema lane 0.20 (`DrillRun.rules`),
this one claims no lane at all (§2.4). The consequence worth stating plainly, because it makes the
family cheap: **a training-mode variant is not a variant.** Every format specified here is standard
chess on a standard board, so every rung of the evidence stack survives it unchanged — the
degradation-tier reasoning that governs `variants.md` has nothing to bite on here.

**Explicitly out of scope.** The `position` encounter kind (`rfc/campaign-core.md` Discharge D1,
the Act II rated boss) — this RFC widens the union by two members and leaves the third to its
owner. Rule variants of every tier. Cross-learner surfaces of any kind (R10). The offered-choice
draft and prestige contents (campaign-core D3/D6). Anything that would author a *grading rule* into
a pack's prediction interaction, which §3.3 makes a refusal rather than an omission.

## Specification

### §1 — The family, and the one law it all runs on

Thirty formats were catalogued across Lucas Chess, chess.com, Lichess, ChessKid, Aimchess, Magnus
Trainer, Listudy, Chess Hero and the teaching tradition
(`design/research/training-mode-variants.md` §§1–3, §5.2). The catalogue's own accounting: **21 of
30 rows seal under the shapes that already existed; 4 rows want the survival producer; 5 rows
should not be encounters at all.** *"No format demands a fifth shape."*

[[D870]] is the ask this section answers — *"the campaign wants a FAMILY of training-mode variants,
not one"* — and §6's table is its inventory: every format the catalogue admits as an encounter,
plus the four candidates [[D870]] itself ideated *"so they are not lost"* (avoid-the-blunder,
threat-radar, hold-under-shrinking-clock, play-the-structure), each with a kind, a seal and a home.

That result is the spine of this RFC and it is the reason the family is nearly free. What
distinguishes these formats from each other is **what the learner is asked to do** and **which
already-measured quantity seals it** — not new instruments. Law 8 is therefore satisfiable format
by format, and §6's table states the seal for every one of them; a format whose seal would be an
LLM judgement or an engine's opinion of a move is not deferred here, it is refused (§6.3).

### §2 — The encounter-kind vocabulary opens by exactly two members

#### §2.1 What is closed today

`schemas/campaign.schema.json:47-55` at HEAD:

```json
"encounter": {
  "type": "object",
  "required": ["kind", "packId"],
  "properties": {
    "kind": { "const": "pack" },
    "packId": { "$ref": "#/$defs/id" }
  },
  "additionalProperties": false
}
```

`rfc/campaign-core.md:115` states the rule in prose: the union is *"**closed at one member in
v1**; adding `position` (rated boss), `prediction` or `survival` is a schema change belonging to
the Discharge rows."* Discharge D2 owns two of those three, and this RFC is D2's successor
amendment.

#### §2.2 The widening

`$defs/encounter` becomes a three-arm `oneOf`, each arm closed:

```json
"encounter": {
  "oneOf": [
    { "type": "object", "required": ["kind", "packId"],
      "properties": { "kind": { "const": "pack" }, "packId": { "$ref": "#/$defs/id" } },
      "additionalProperties": false },

    { "type": "object", "required": ["kind", "sourceGameId", "anchors", "threshold"],
      "properties": {
        "kind": { "const": "prediction" },
        "sourceGameId": { "$ref": "#/$defs/id" },
        "anchors": { "$ref": "#/$defs/predictionAnchors" },
        "threshold": { "$ref": "#/$defs/predictionThreshold" },
        "bandContext": { "$ref": "#/$defs/maiaBand" }
      },
      "additionalProperties": false },

    { "type": "object", "required": ["kind", "counter", "threshold", "maxPlies"],
      "properties": {
        "kind": { "const": "survival" },
        "counter": { "$ref": "#/$defs/survivalCounter" },
        "threshold": { "type": "integer", "minimum": 1 },
        "maxPlies": { "type": "integer", "minimum": 1 },
        "packId": { "$ref": "#/$defs/id" }
      },
      "additionalProperties": false }
  ]
}
```

The existing `pack` arm is **unchanged, byte for byte**, so every campaign document valid at HEAD
stays valid: this is an additive widening of a `const` into a discriminated union, and
`schemas/fixtures` needs no migration. The TS type in `rfc/campaign-core.md` §1 widens in step.

#### §2.3 Which producer seals which kind — and why there is no fifth

Which producer seals a node is a **property of the node**, not a computation over another
producer. The mapping is total and it introduces nothing:

| `encounter.kind` | Object | Bounded by | Sealed by (the producer, unchanged from `design/06-campaign.md:461-464`) |
|---|---|---|---|
| `pack` | a drill pack | `plyHorizon` | an `ObjectiveState` from `successConditions`, stored as `sealedState` |
| `prediction` | a fixed recorded game | the game's own length | a **prediction-score threshold** over `prediction.recorded` events (§3) |
| `survival` | an unbounded run | **nothing but failure**, ply-ceilinged for envelope arithmetic only (§5.3) | a **score threshold over the run's declared grounded counter** |
| *(`position`)* | a `position` session | the rules of chess | `terminalOutcome` — **not this RFC's**; `rfc/campaign-core.md` Discharge D1 |

[[D1152]] ruled the fourth producer in and, in the same breath, **closed** the vocabulary: *"The
catalogue's 30-row format mapping needed **exactly this one and no fifth**."* §6's family table is
the check on that claim rather than a restatement of it — every format in it names a kind from this
closed set, and criterion 3 makes a fifth kind a lint failure rather than a judgement call.

#### §2.4 The claims decision, argued

**This RFC claims no register lane, and the argument is the interesting part.**

The pack-schema register governs `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`,
`"0.27"`) and `schemas/drill_pack.schema.json`'s `$id`. Neither moves here: §3.3 leaves the pack's
prediction interaction — `{ type: "prediction", flipBoard? }` with `additionalProperties: false`,
`schemas/drill_pack.schema.json:841-849` — exactly as format v0.9 left it. The run-schema register
governs `DRILL_RUN_SCHEMA_VERSION` (`"0.17"`); it does not move either, because
`prediction.recorded` with `predictedMass`/`predictedRank` already ships
(`schemas/drill_run.schema.json:619-625`, `packages/runtime/src/types.ts:233-234`). Lanes 0.28–0.32
are live claims and 0.33 is next free (`node tools/register-check.mjs`); **taking 0.33 for a change
that touches no pack document would corrupt the register**, which exists to serialise a single
shared resource, not to number RFCs.

But the resource this RFC *does* touch has no register at all. `schemas/campaign.schema.json`
ships at HEAD with `"$id": "urn:chess-tabiya:schema:campaign:1"` — **a major integer, not a `0.x`
lane** — and `rfc/README.md` carries registers for pack-schema, run-schema, shape-entry,
principle-entry, evidence-kinds and migrations, and **none for campaign**. Two drafts already
write to `$defs/encounter`: campaign-core's Discharge D1 owns `position`, this RFC's D2 owns
`prediction` and `survival`. That is exactly the collision class the pack-schema register was
instituted for in the first place — *"a shared, single-writer resource"* — appearing on a surface
no instrument watches.

The correct instrument for a shared *implementation surface* rather than a shared *number* is the
one `rfc/README.md` §Cross-draft ownership pins already institutes, and this RFC takes one:

> **Pin, 2026-08-23:** `rfc/campaign-core.md` owns `$defs/encounter` and the `position` arm
> (its Discharge D1). `rfc/training-mode-variants.md` adds the `prediction` and `survival` arms
> (campaign-core Discharge D2) and touches no other campaign `$def`. Landing order follows the
> dependency: campaign-core, then this.

The missing register is a real gap and is **not** silently absorbed: Open question 1 puts it to
the register owner, and the proposed ledger row (§9) records it whatever the answer.

### §3 — Solitaire chess: the seal, and the v0.9 collision resolved

[[D869]] verbatim, from `design/BACKLOG.md:274`:

> **OWNER 2026-08-22 — Solitaire Chess becomes both a standalone mode and a campaign encounter
> class.** *"I really like the idea of 'solitaire chess'… THAT sounds like a variant that fits
> within our campaign mode and as a separate mode."* The mechanism already ships dead ([[D860]]):
> predictions against the Maia distribution, law-8-clean scoring by construction, imported master
> games as the free corpus. As a campaign encounter it slots into the just-amended `design/06` §5
> vocabulary as a third verdict shape — sealed by **prediction-score threshold** over a fixed game,
> bounded by the game's own length — distinct from both authored objectives and boss
> `terminalOutcome`. **Note: this would add a third verdict producer to the two the amendment just
> enumerated; the encounter-vocabulary table gains a row rather than an exception.**

#### §3.1 What the learner does

The learner is shown a position from a recorded game with the continuation hidden, and commits a
move. The move is recorded, the game's own continuation is revealed, and the run advances along the
**recorded mainline** — not along the learner's guess. The learner then plays the consequence of
the position the game actually reached. This is the 80-year-old Purdy protocol and it is
play-the-consequence by construction: at no point is the learner asked to *find the best move*,
which is the form `design/00-thesis.md` §§70, 93-94 rejects.

Both surfaces the owner asked for run the same mechanism:

- **Standalone mode** — any imported PGN, `sessionKind: "imported"` (`service.ts:809`), no campaign
  and no threshold. Per-anchor agreement and Maia context are shown; nothing is sealed, credited or
  gated. This is the mode `training-mode-variants.md` §7 ranks the **best standalone mode** in the
  catalogue.
- **Campaign encounter** — `encounter.kind: "prediction"` over a fixed `sourceGameId`, with an
  authored `threshold`. The node seals when the run reaches the end of the recorded game.

#### §3.2 The seal, pinned to law 8

Law 8 requires the score come from a measurement, never from a judgement. The derivation
(`planning/variants/rfc-derivation.md` §5.2) pinned the four elements at HEAD; this RFC picks
which is the seal:

| Element | Symbol at HEAD | Role here |
|---|---|---|
| The prediction record | `prediction.recorded`; `predictedMass`, `predictedRank` (`packages/runtime/src/types.ts:233-234`; `schemas/drill_run.schema.json:619-625`) | the event stream the counter reads |
| **The move actually played in the source game** | the imported PGN mainline via `parsePgnMainline` (`apps/server/src/pgn-import.ts:16`) and `service.importGame` (`:788`) | **THE SEAL** |
| Maia policy mass at the selected band | capability `Maia / policy mass`, `disposition: "reached"`, *"Recorded on opponent selections"* (`apps/server/src/capabilities.ts:135`) | **COLOUR ONLY** — never the seal |
| Stockfish `bestmove` / MultiPV rank | `disposition: "refused"`, *"Move verdicts are not condition measurements"* (`capabilities.ts:124`) | refused, and stays refused |

**The counter is `agreementCount`: the number of anchors at which the learner's committed move
equals the move played in the recorded game.** Its denominator is the anchor count and both are
always shown. That quantity is a **fact about a specific historical game**, not an opinion about a
move: it makes no claim that the played move was best, and it survives unchanged if an engine later
disagrees with the game. This is what [[D869]] means by *"law-8-clean by construction"*, and it is
the half of the reconciliation `campaign-core.md` Discharge D2 demanded be **stated**, not assumed.

Maia's mass supplies the sentence beside the number — *"the 1500 band finds this move 12% of the
time"* — and the band is authored per node as `bandContext` within the ruled `[1000,2400]` range.
It renders. It never enters `agreementCount` and never moves a threshold.

#### §3.3 The v0.9 no-verdict rule: resolved, not bent

`docs/drill-pack-format.md:15-17` is the wall:

> *"Version 0.9 removes prediction `grading`. A prediction interaction carries only
> `type: prediction` and optional `flipBoard`; **recorded policy mass and rank are shown as numbers
> and never turned into a correctness verdict**."*

A naive prediction-score threshold walks straight into it, and the derivation was explicit that
this *"must not be papered over."* Three clauses resolve it, and each is checkable:

1. **The pack schema does not change.** `$defs` for the prediction interaction stays
   `{ type, flipBoard }`, `additionalProperties: false` (`schemas/drill_pack.schema.json:841-849`).
   No author regains a per-move grading rule. v0.9's deletion holds, which is why §2.4 claims no
   pack-schema lane — the rule is honoured by *not moving the version*, and that is the strongest
   available evidence that it was honoured.
2. **The rule's subject is mass and rank, and the seal is neither.** v0.9 forbids turning
   *recorded policy mass and rank* into a correctness verdict. `agreementCount` reads neither; it
   reads the source game's mainline. A threshold over it is not the forbidden operation — it is a
   different measurement with a different subject.
3. **The separation is enforced, not promised.** `$defs/predictionThreshold` is a closed object
   whose only counter term is `agreement` — `{ "kind": "agreement", "atLeast": <integer>, "of":
   <"anchors"> }`. A validator rule **`CAMPAIGN_PREDICTION_THRESHOLD_SOURCE` (error)** refuses any
   threshold expression naming `predictedMass`, `predictedRank`, or any Maia quantity. Without
   clause 3 the reconciliation is a sentence in a document; with it, the collision cannot be
   re-introduced by a later author without failing a lint.

The scope of the resolution, stated so it is not over-read: **per-move correctness remains
forbidden everywhere.** A solitaire run never says "wrong". It says *the game went 24.Rxf7*, and it
counts.

#### §3.4 Anchors

`$defs/predictionAnchors` selects which plies are asked, closed at two authored forms —
`{ "kind": "every_move_of", "side": "white" | "black" }` and `{ "kind": "plies", "list": [<integer>] }`
— with the second refused if any ply is outside the source game's length
(**`CAMPAIGN_PREDICTION_ANCHOR_RANGE`**, error). The bound is the game's own length, exactly as
`design/06-campaign.md:463` states; an encounter's contribution to the run envelope is its anchor
count, which is authored and finite.

### §4 — The pack gate: dead in both directions, and the unblock

#### §4.1 What was measured at HEAD

The gate, `apps/server/src/service.ts:1512-1514`:

```ts
const pack = this.#requiredRegisteredPack(stored.run);
if (pack === undefined || !pack.document.checkpoints.some((checkpoint) => checkpoint.id === input.checkpointId && checkpoint.interaction?.type === "prediction")) {
  throw new ServerError("INVALID_REQUEST", "Unknown prediction checkpoint");
}
```

[[D1303]] found *"the omitted fourth is `prediction`: 0 packs"* and corrected the site of record —
`rfc/longitudinal-store.md:229` still cites `service.ts:1204`, a stale number **sitting inside an
accepted RFC**, whose `decision_class='predicted'` *"waits on the producer that gate blocks."*
This draft re-derived both facts and found one sharper and one drifted.

**Sharper:** the gate is unreachable in *both* of its clauses, not just for imported runs. Counted
at HEAD over `content/drafts/` (unit: pack documents, i.e. `*.json` excluding the `.evidence.json`,
`.job.json` and `.sources.json` sidecars): **56 pack documents, all 56 declaring `checkpoints`, of
which 0 declare an interaction of `type: "prediction"`** — the same 56-pack denominator
`design/06-campaign.md` §5 counts `plyHorizon` over, so the unit is the design's own. (Interaction
types actually authored, by
frequency: `intent_capture` 51, `follow_theory` 20, `win` 12, `reach_structure` 9,
`play_until_checkpoint` 6, `hold` 5, `execute_break` 5, `run_trajectory` 4,
`preserve_plan_window` 4, `prevent_opponent_plan` 2, `stated_reasoning` 1, `resist` 1 — no
`prediction`.) So the second clause refuses every pack run *as well as* the first clause refusing
every imported run: **no call to this endpoint can succeed at HEAD by any route.** [[D860]]'s
*"quadruply dead"* is, at the gate itself, doubly dead.

**Drifted:** D1303 records the gate as `service.ts:1514/:1515`. Re-measured at this HEAD the
`#requiredRegisteredPack` call is `:1512`, the predicate `:1513` and the throw `:1514` — a two-line
drift in the same direction the `:1204 → :1512` drift ran. Criterion 8 asserts the site by
**symbol** rather than by line, so the next drift costs a grep and not a false citation.

#### §4.2 The unblock

Solitaire chess is the producer this gate blocks, and it produces on imported games — which by
construction have no pack. The gate widens to admit a **prediction anchor** from either source:

- **Pack runs** (unchanged): the anchor is an authored checkpoint whose `interaction.type` is
  `prediction`. The existing predicate stands verbatim.
- **Imported runs** (new): when `run.sessionKind === "imported"` (`service.ts:809`, `:863`) and no
  pack is registered, the anchor is the **mainline node itself**. `input.checkpointId` must equal
  `input.nodeId`; a mismatch is refused with a new code
  **`PREDICTION_ANCHOR_NOT_NODE` (`INVALID_REQUEST`)**.
- **Neither** — a pack-less run that is not imported — keeps today's refusal, with today's message.

The active-cursor rule at `service.ts:1515-1517` is untouched: a prediction is recordable only at
the run's active cursor, on any route. Nothing here widens *what* may be predicted; it widens
*where a prediction may be anchored*, from "an authored checkpoint" to "an authored checkpoint or
the imported mainline node the learner is standing on".

#### §4.3 What this unblocks downstream

`rfc/longitudinal-store.md:229-232` is explicit that it is waiting: a single imported run holds the
source game's own moves (`decision_class='game'`), the learner's rewound rehearsal (`'played'`)
and — *"once [[D860]]/[[D869]] lift the pack gate"* — the learner's guesses (`'predicted'`). The
third class has been unproducible since the store was accepted. §4.2 is the lift; criterion 9
requires the stale `:1204` citation in that accepted RFC be repaired to the symbol form in the same
commit that lands the widening, so the correction does not become its own piece of debt.

### §5 — Survival: the counter, and the bound campaign-core D2 demands

[[D1152]] ruled the producer in; `design/06-campaign.md:464` states it: *"a **score threshold over
an unbounded run** (plies survived / correct count / avoidance streak, each with its declared
grounded counter)."*

#### §5.1 The counter must be declared and grounded

`$defs/survivalCounter` is a closed union. Each arm names the measurement that produces the number
and — where that measurement does not ship — the blocker is named in §7 rather than hidden in an
authoring convention:

| `counter.kind` | The number | Grounding at HEAD |
|---|---|---|
| `plies_survived` | plies played before the stop condition fires | the run's own node count — ships |
| `correct_count` | anchors agreeing with the recorded game (§3.2) | ships once §4.2 lands; this is survival composed with prediction |
| `avoidance_streak` | consecutive moves creating no loose piece | **does not ship** — needs `moved_piece_en_prise` (§7, D883) |

A survival node whose counter is not one of these arms fails schema validation. There is no
free-text counter, because *"each with its declared grounded counter"* is the ruling's operative
clause and an undeclared counter is how law 8 gets breached politely.

#### §5.2 The stop condition

A survival run ends on **failure**, and failure is the counter's own negation: the ply after which
`plies_survived` cannot increase (the run is lost or drawn by the rules of chess), the first
disagreement for a one-miss `correct_count` form, the first loose piece for `avoidance_streak`.
The verdict is then the threshold test — `counter >= threshold` — and **not** the fact of stopping.
This is what [[D1152]] bought: an authored-bounded survival encounter is *"survive exactly N"*
wearing the name of *"survive as long as you can"*, and the ruling's whole point was to stop
shipping the first while saying the second.

#### §5.3 The bound — the amendment clause D2 makes mandatory

`rfc/campaign-core.md` Discharge D2, amended 2026-08-23 on [[D1152]], states the obligation this
section discharges:

> *"survival breaks the run's minute bound, and the amendment must carry it."* Every v1 encounter
> is bounded by the shipped `authoredBoundary.plyHorizon`, so a run's minute envelope is the sum of
> its nine horizons. A survival encounter is bounded by *"nothing but failure"*, which makes shape 4
> **the one class device D does not bound**… *"The successor amendment specifies survival's own
> bound (a ply cap, a wall-clock cap, or an explicit statement that the class is unbounded and the
> run frame excludes it) — it may not simply inherit the horizon language."*

**This RFC specifies a ply cap: `maxPlies`, required on every survival encounter.** Reasons, in
order: a wall-clock cap is unavailable — `clockState` is an untyped passthrough and time controls
are campaign-core's own Discharge D4, so a wall-clock bound would depend on a surface that does not
exist; and declaring the class unbounded would delete the *"~35–55 minutes"* frame the run design
rests on rather than pay for it.

The cap is a **stop, not a success condition**, and the distinction is the whole reason this does
not re-create authored-bounded survival:

- Reaching `maxPlies` ends the encounter **capped**, and the verdict is still `counter >= threshold`
  — a capped run that met its threshold **passed**.
- `maxPlies` never appears in the verdict. A validator rule
  **`CAMPAIGN_SURVIVAL_CAP_ABOVE_THRESHOLD` (error)** requires `maxPlies` to exceed the
  threshold's ply equivalent for the ply-denominated counters, so a cap can never be the thing the
  learner is actually racing.
- The node's contribution to the run envelope is `maxPlies`, and the envelope arithmetic is
  therefore total again: sum of `plyHorizon` over authored nodes, plus anchor count over prediction
  nodes (§3.4), plus `maxPlies` over survival nodes.

An author who wants the encounter to feel unbounded sets a cap far above the threshold; the
envelope stays computable because the cap exists, and the learner never meets it.

### §6 — The rest of the family

#### §6.1 The table

Every row names a kind from §2.3's closed set. **Status** is `v1` (specified here and buildable
now), `deferred` (priced, with the home and owner in §7), or `refused` (§6.3).

| Format | Kind | What the learner does | What seals it, and what survives | Status |
|---|---|---|---|---|
| **Imported-game solitaire** ([[D869]]/[[D860]], catalogue row 1) | `prediction` + standalone | commits a move at each anchor, then plays the consequence of the game's actual continuation | `agreementCount` vs the recorded mainline (§3.2); Maia mass as colour. Full stack — it *is* standard chess | **v1** |
| **Play-out-and-survive / resistance** (row 4) | `survival` | holds a losing or difficult position against the opponent for as long as possible | `plies_survived` against the rules-of-chess stop (§5.2); every rung survives | **v1** |
| **Streak / rush counts** (rows 5–6) | `survival` | works consequence episodes back to back until the first miss | `correct_count`, one-miss stop; carries §6.2's cautions in full | **v1**, cautions binding |
| **Band-split solitaire** ([[D888]], row 28) | `prediction` | predicts the strong band's move *and* names the weak band's trap move | per-band Maia policy mass — a comparison of two **measured model outputs**, not a judgement. Needs a multi-rung query | deferred — §7 |
| **Avoid-the-blunder runs** ([[D883]], row 24) | `survival` (open) / `pack` (bounded) | plays N plies creating no loose piece | `avoidance_streak` with the denominator always shown ([[D745]]); grounded in the measured `moved_piece_en_prise` lift ([[D733]] `[V]`) | deferred — collector | 
| **Threat-radar hunt** ([[D889]], row 25) | `pack` | finds the one real threat among quiet moves | `threat@1` enumeration with its declared convention and abstentions ([[D741]]/[[D751]]) | deferred — §7 |
| **Defender-chain hunt** ([[D890]], row 29) | `pack` | says which piece just lost its defender and what lands in two plies | exact observed three-ply sequences — 29 defender-loss and 13 defender-displacement windows in 6,775 `[V]` | deferred — §7 |
| **Play-the-structure** (row 27) | `pack` | plays toward a named structural arrangement | the attested shape entry matching, via the shipped `shapeRecommendations` rung-0 detector `[V]` | deferred — §7 |
| **Hold-under-shrinking-clock** ([[D862]], row 26) | `pack` | holds the same objective across acts under a tightening authored budget | objective verdict plus `TempoVerdict` | deferred — §7 |
| **Brain with a banded hand** ([[D891]], row 20) | `position` | names a piece type; Maia's distribution restricted to that type supplies the move | `terminalOutcome`; the restriction is mechanical over a measured model, so no chess truth is manufactured. Unrated | deferred — campaign-core D1 |
| **Reduced armies / pawns-only** ([[D873]]) | `pack` | plays legal standard positions with fewer pieces | already admitted, **cited not duplicated**: `rfc/variants.md` §8.1 — *"not a variant… needs nothing from this RFC: no lint change, no schema change, no lane"*, and the tablebase turns **on** below seven units | **usable today** |

#### §6.2 The cautions that ride the survival family

Non-negotiable, carried from `design/research/training-mode-variants.md` §5.3 and binding on the
`survival` rows above:

- **Scores are per-run and learner-private.** `rfc/learner-rating.md`'s shipped copy — milestones
  *"never add a skill percentage, score, streak, rating, ranking, or cross-learner comparison"*
  (`docs/return-and-progression.md:48-49`) — means no cross-learner table, no leaderboard, and **no
  daily-streak retention lever**. A survival threshold seals one node; it is not a number the
  learner carries around.
- **Head-to-head is refused, not deferred.** Puzzle Battle / Racer (row 7) is refused by R10.
- **Re-cut, always.** The CC0 puzzle corpus is usable only as play-the-consequence, never as
  find-the-tactic (`design/00-thesis.md` §§70, 93-94; restated by `campaign-core.md` D2's own
  *"each re-cuts its formats as play-the-consequence, never find-the-tactic"*). A streak run is a
  run of **consequence episodes**, which is a slower animal than three-minute tactics, and the
  catalogue says so plainly.

#### §6.3 Refused here, with the reason

- **Cross-learner formats of any kind** (Battle, Racer, vote-chess as an encounter) — R10.
- **Any format whose seal would be an engine's opinion of a move** — `capabilities.ts:124` already
  refuses it and law 8 makes it structural.
- **Memory/board-vision arcade and visualization drills** (rows 11–12) — not encounters: nothing in
  the evidence stack grounds them, and board-display modes are parked under [[D717]].
- **Consultation / Hand-and-Brain with human pairs** (rows 18–19) — social surfaces, not encounter
  classes; `design/03-product-breadth.md` owns them.

### §7 — What v1 defers, and to whom

Per [[D1230]] a deferral without both a home and an owner is not a deferral, and **document size is
never a reason.** Each row states the blocker that actually exists.

| Deferred | The actual blocker | Home and owner |
|---|---|---|
| **Avoid-the-blunder** ([[D883]]) | `moved_piece_en_prise` **does not exist in the runtime at HEAD** — repo-wide it appears only in research dossiers and `tools/d730-see-harness/`. The format is one collector away, not one design away | the 2c collector wave (codex); this RFC's Discharge D3 |
| **Threat-radar hunt** ([[D889]]) | `rules.tactic.consequence.threat` ships with `disposition: { kind: "inspector_only" }` — *"D794 measured threat presence near background; module admission waits on Phase 3"* (`packages/runtime/src/evidence-catalog.ts:390-396`). An inspector-only projection may not seal an encounter | Phase 3 module admission (claude); Discharge D3 |
| **Defender-chain hunt** ([[D890]]) | the census→fixture pipeline: 29+13 attested windows exist as a measurement, not as content | `planning/content-era/` (claude); Discharge D4 |
| **Play-the-structure** (row 27) | nothing technical — the detector and the 16 attested shape entries ship. It is authored content, and content is the content era's | `planning/content-era/` (claude); Discharge D4 |
| **Hold-under-shrinking-clock** ([[D862]]) | both halves ship pointed the wrong way — the tempo scheduler needs a shrinking direction — and the Woodpecker cycle is **already owned elsewhere**: `rfc/pack-training-forms.md` (lane 0.32) is the training-methods lane's pack-format half | `rfc/pack-training-forms.md` (claude) |
| **Band-split solitaire** ([[D888]]) | the multi-rung Maia query is new; and it should follow §3's seal rather than race it | this RFC's Discharge D5 (claude), after v1 lands |
| **Brain with a banded hand** ([[D891]]) | needs the `position` arm, which this RFC does not own, plus piece-restricted sampling; collides with the rated-game contract, so it is unrated by construction | `rfc/campaign-core.md` Discharge D1 (`planning/campaign/`) |
| **A campaign-schema register** | no register governs `schemas/campaign.schema.json`, and two drafts write to it (§2.4) | Open question 1 (register owner) |

Not deferred and not this RFC's: rule variants of every tier (`rfc/variants.md`), the `position`
arm (campaign-core D1), prestige contents (campaign-core D3/D6).

### §8 — The surface law is unchanged

[[D1042]] is the owner's ruling on where weirdness may live, and it is **surface-scoped, not
variant-scoped**. This RFC changes none of it; it is restated once because §6's formats touch four
of the five surfaces and a reader must be able to check them against the law without leaving the
document:

| Surface | The law | This RFC |
|---|---|---|
| Drill packs | standard chess only | unchanged — every §6 `pack` row is standard chess |
| Just Play | any variant the learner wants | unchanged — untouched here |
| Import / analysis | accepts weird games | **widened for prediction anchors only** (§4.2); the import allow-list itself is `rfc/variants.md`'s |
| Campaign | *"as crazy as we want to"* | two encounter kinds added, both standard chess |
| The educational run | **remains MAIN** | unchanged, and load-bearing — §6.2's cautions exist to keep the survival family from becoming a retention product |

The observation worth making once: because every training-mode variant is standard chess, this
family passes all five surfaces **without spending any of the law's latitude**. The latitude
[[D1042]] grants is for rule variants, and none is drawn down here.

## Deviations from design

1. **`design/06-campaign.md:463` describes the prediction seal as *"a prediction-score threshold
   over `prediction.recorded` events against the human distribution"*; §3.2 seals against the
   **recorded game** and demotes the human distribution to colour.** The design sentence is a
   description of the mechanism's inputs, written before the v0.9 collision was reconciled; sealing
   *against the distribution* is the operation `docs/drill-pack-format.md:15-17` forbids. The
   events read are exactly the ones named; the quantity thresholded is the one law 8 permits.
   [[D869]] itself supplies the licence — *"law-8-clean scoring by construction"* — and
   `campaign-core.md` Discharge D2 required the author to *"state which of the two is the seal and
   which is the colour."* This is that statement, and it is a design-tier correction owed under
   law 5: **Discharge D1 carries it to the owner rather than this draft editing `design/06`.**
2. **`design/06-campaign.md:464` bounds survival by *"nothing but failure"*; §5.3 requires a
   `maxPlies` cap.** Not a contradiction in the verdict — the *seal* remains failure plus threshold,
   and the cap seals nothing — but the design sentence, read alone, forbids the cap. The cap is
   mandated by campaign-core's D2 amendment (*"it may not simply inherit the horizon language"*)
   and is the only one of the three options that RFC offers which is buildable at HEAD. Same
   handling: Discharge D1.
3. **No other deviation.** The four-producer vocabulary is reproduced, not extended; the surface
   law is quoted, not adjusted; the reduced-army admission is cited to `rfc/variants.md` §8.1
   rather than restated.

## Acceptance criteria

Numeric criteria carry the number computed at this HEAD, baked as a **drift tripwire** only; set
membership is asserted against a derivation, never against a hand-summed integer ([[D1240]]).

1. **`make encounter-vocabulary` exists and is wired into `make verify`.** It derives two sets: the
   arm discriminants of `$defs/encounter` in `schemas/campaign.schema.json`, and the producer rows
   of the encounter-vocabulary table in `design/06-campaign.md` (the table whose header names
   *Class / Object / Bounded by / Sealed by*). It prints both, plus their difference. It exits
   non-zero if the discriminant set is not a **subset** of the producer set.
2. **The kinds are set-equal to the producers minus the outstanding arm.** `make
   encounter-vocabulary` reports `outstanding = {position}` — exactly one element, whose owner is
   asserted by the same run to be `rfc/campaign-core.md` Discharge D1. Tripwire: producers **4**,
   discriminants **3** at this RFC's landing. A fifth producer row appearing in `design/06` without
   a corresponding RFC fails this criterion, which is how [[D1152]]'s closure is kept honest.
3. **No fifth kind reaches the schema.** `$defs/encounter` is a `oneOf` of exactly the arms in
   §2.2, each with `additionalProperties: false`, and every arm's `kind` is a `const`. A campaign
   document naming any other `kind` fails `make schema-check`.
4. **Every campaign document valid before the widening is valid after it.** `make schema-check`
   passes over `schemas/fixtures` unchanged, and the `pack` arm's four bytes-of-shape — `required`,
   `kind`, `packId`, `additionalProperties` — are identical to HEAD. Tripwire: **0** fixture edits
   in the landing commit.
5. **`CAMPAIGN_PREDICTION_THRESHOLD_SOURCE` fires.** A campaign document whose prediction threshold
   names `predictedMass`, `predictedRank` or any Maia quantity is refused with that code; a
   document whose threshold is `{ kind: "agreement", atLeast: n, of: "anchors" }` validates. Both
   directions are tested — a lint asserted only in the passing direction is [[D984]]'s vacuous
   class.
6. **The pack format does not move.** `DRILL_PACK_SCHEMA_VERSION` is `"0.27"` and
   `DRILL_RUN_SCHEMA_VERSION` is `"0.17"` after the landing commit, and
   `schemas/drill_pack.schema.json`'s prediction interaction is byte-identical to HEAD. This is the
   machine-checkable form of §3.3 clause 1.
7. **`CAMPAIGN_SURVIVAL_CAP_ABOVE_THRESHOLD` fires**, and a survival encounter that reaches
   `maxPlies` with `counter >= threshold` seals as **passed** — the capped-and-passed case is a
   named test, because it is the case that distinguishes §5.3's cap from the authored bound
   [[D1152]] removed.
8. **The gate widens by symbol, and both new routes are tested.** In `apps/server/src/service.ts`,
   the method containing the string `"Unknown prediction checkpoint"` admits (a) a pack run with an
   authored prediction checkpoint — the existing test, unchanged; (b) an imported run
   (`sessionKind === "imported"`, no pack) whose `checkpointId` equals its `nodeId`; and refuses
   (c) an imported run with a mismatched `checkpointId`, code `PREDICTION_ANCHOR_NOT_NODE`; and
   (d) a pack-less non-imported run, with today's message. Tripwire for the drift D1303 recorded:
   the string sits at `service.ts:1514` at this HEAD, two lines below D1303's `:1514/:1515` reading
   of the same gate.
9. **The stale citation is repaired in the landing commit.** `rfc/longitudinal-store.md:229`'s
   `service.ts:1204` is replaced by the symbol form, and `grep -rn "service.ts:1204" rfc/ docs/
   planning/ design/` returns **0** matches outside `design/BACKLOG.md` (which is append-only for
   this purpose and whose D860 cell records the number as found).
10. **`decision_class='predicted'` becomes producible.** An end-to-end test imports a PGN, records a
    prediction at a mainline node, and reads back a longitudinal row with `decision_class` =
    `'predicted'` alongside `'game'` and `'played'` rows from the same run. This is the criterion
    that proves §4.2 discharged the dependency `longitudinal-store.md:229-232` declares rather than
    merely editing its citation.
11. **The prediction corpus is real.** At least **1** prediction encounter and **1** survival
    encounter exist as fixtures, and the prediction fixture's source game is an imported PGN, not
    an authored pack — the case the gate refused. Tripwire: **0** of the **56** pack documents in
    `content/drafts/` carry a prediction interaction at this HEAD, so a fixture that is a pack would
    not exercise the widening at all.
12. **Every §6 row routes.** `node tools/work-index.mjs` stays green, and each of [[D883]],
    [[D888]], [[D889]], [[D890]], [[D891]] resolves to this RFC or to the home §7 names for it.
13. **All four instruments stay green** — `node tools/status-parity.mjs` (P1–P7), `node
    tools/register-check.mjs` (C1–C6), `make work-index`, `make intent-parity` — before and after
    the landing commit.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The two design-tier corrections in Deviations 1–2 — `design/06-campaign.md:463`'s seal sentence (the recorded game is the seal, the distribution is colour) and `:464`'s *"nothing but failure"* against §5.3's envelope cap. Law 5: `design/` is the owner's or claude-on-an-owner-ruling; this draft states the reconciliation and does not edit the design doc | OWNER (or claude on the ruling) | the ruling's log entry in `planning/exploration/log.md` and the `design/06` amendment citing it | |
| D2 | Implementation of §2.2, §3, §4.2 and §5 per the acceptance criteria, including `make encounter-vocabulary` and the three new validator codes | codex | the implementing commits; ledger flips per §9 | |
| D3 | **Avoid-the-blunder ([[D883]]) and threat-radar ([[D889]])** — both blocked on evidence that is not admitted at HEAD (`moved_piece_en_prise` absent from the runtime; `rules.tactic.consequence.threat` `inspector_only` pending Phase 3 module admission), not on anything in this specification | claude | the 2c collector wave's landing commit and the Phase 3 admission decision | |
| D4 | **Defender-chain hunt ([[D890]]) and play-the-structure** — both are authored content over shipped detectors: the census→fixture pipeline for the 29+13 attested windows, and shape-arrangement objectives over the 16 attested entries | claude | `planning/content-era/` and the wave's log entry per the content-wave closeout | |
| D5 | **Band-split solitaire ([[D888]])** — the multi-rung Maia policy query, sequenced deliberately behind §3's seal so the second format inherits a settled reconciliation instead of racing it | claude | the follow-up RFC or amendment citing this row | |

**Discharged BY this RFC's registration:** `rfc/campaign-core.md` Discharge D2 (prediction and
survival encounter classes, and the survival-bound amendment its 2026-08-23 clause requires) —
its cell names *"that amendment's registration"* as the recording site; the SHA is written into
that table by the register owner at acceptance, outside this draft's write set.
`rfc/variants.md` §9's solitaire deferral row (*"its own lane, in parallel (claude)"*) resolves to
this document.

## Open questions

1. **Should `schemas/campaign.schema.json` have a register in `rfc/README.md`?** (§2.4.) It ships
   at HEAD with `"$id": "urn:chess-tabiya:schema:campaign:1"` — a major integer, not a lane — and
   two drafts write to `$defs/encounter`. This RFC takes a cross-draft ownership pin, which is the
   right instrument for a shared *surface*; a register would be the right instrument if the `$id`
   integer is meant to move. **Owner: the register owner**, resolved before `accepted`. Whatever
   the answer, the gap is recorded as a ledger row (§9) rather than absorbed.
2. **Does a standalone solitaire session belong to `sessionKind: "imported"` or to a fifth session
   kind?** §3.1 uses `imported`, which is true and costs nothing. A distinct kind would make
   solitaire runs queryable as a cohort, at the price of a run-schema lane. Deferred to the
   implementing commit's first measurement — if the projection layer needs the distinction, it
   claims a lane then. **Owner: codex**, at implementation.
3. **Does the `correct_count` survival counter (§5.1) compose with prediction anchors across
   *several* games, or only within one?** A one-miss streak over a sequence of recorded games is
   the natural rush form and needs no new producer, but it does need a source-game *list* rather
   than a `sourceGameId`. Deferred to Discharge D5 with band-split, where the same authoring
   surface is already being opened. **Owner: claude.**

## Ledger rows (proposed — id assigned at landing; head was **D1332** when drafted)

- **💡 The campaign schema is a single-writer resource with no register**, and two drafts write to
  `$defs/encounter` (`rfc/campaign-core.md` D1 owns `position`; `rfc/training-mode-variants.md`
  owns `prediction`/`survival`). The pack-schema register exists for exactly this class; the
  campaign schema shipped without one. Open question 1 puts it to the register owner. Destination:
  `rfc/README.md` §Cross-draft ownership pins (taken now) and, if ruled, a sixth register.
- **🐞 [[D1303]]'s gate citation drifted again, and the same gate is dead in both clauses.**
  Re-measured at HEAD: `#requiredRegisteredPack` at `service.ts:1512`, throw at `:1514` (D1303
  recorded `:1514/:1515`); and **0 of 56** pack documents in `content/drafts/` carry a prediction
  interaction, so the second clause refuses every pack run as well. Acceptance criterion 8 asserts
  the site by symbol so the next drift costs a grep. Destination: this RFC §4.1.
- **✅ (at landing)** [[D869]] — solitaire chess as standalone mode and campaign encounter class:
  specified in §3, sealed by comparison to the recorded game, Maia mass as colour.
- **✅ (at landing)** [[D870]] — the FAMILY: §6 prices all ten formats plus the reduced-army row,
  each with a verdict shape, a learner act, its surviving evidence and — where deferred — a named
  home and owner.
- **✅ (at landing)** [[D860]] — the quadruply-dead mechanism: §4.2 lifts the gate; criterion 10
  proves `decision_class='predicted'` producible.

## Changelog

- 2026-08-23: created. Widens `encounter.kind` by two members (`prediction`, `survival`), resolves
  the v0.9 no-verdict collision by sealing on the recorded game rather than the distribution, lifts
  the prediction pack gate for imported runs, specifies survival's ply cap per `campaign-core.md`
  Discharge D2's amendment clause, and prices the full family with named homes for every deferral.
