# RFC: Opponent contracts — what a mode executes, what it may claim, and what it must refuse

- **Status:** draft
- **Author:** claude (agent)
- **Created:** 2026-08-16
- **Design refs:** `design/01-training-model.md` §Outcome types (`:81-91`) and the mode
  table (`:118`); `design/02-product-shape.md:170` (the `practical_resistance` cost);
  `design/06-campaign.md:104,110,195` (band bosses and the "scoped to decided positions"
  ruling)
- **Exploration gate:** **E4** (`planning/exploration/gates.md:95`) — *"at least one
  runnable opponent policy produces sufficiently believable multi-ply resistance for a
  slice"*, **unmet**, with the standing note that *"E4 will be met by
  `human_common`/`perfect_tablebase` in v1, or not at all."*
  `design/research/maia-endgame-fidelity.md` §6 is the first measurement of
  `human_common`'s multi-ply resistance. This RFC does not flip E4; it specifies the
  contract surface E4 would have to be claimed **through**.
- **Depends on:** `rfc/archive/defect-sweep.md` §2 (the declared-vs-executable law);
  `rfc/archive/format-surface.md` §§1–2 (`FORMAT_DISPOSITIONS`, the register and its
  gate); `rfc/archive/engine-request-contract.md` §3 (the *record* obligation);
  `rfc/archive/grounding-pair.md` §2c (the shipped `perfect_tablebase` selection
  semantics); `rfc/archive/resistance-spectrum.md` (`practical_resistance`,
  `eloApplied`)
- **Parent / amends:** amends `rfc/archive/grounding-pair.md` §2c — the drawn-root
  tiebreak it specified is replaced, and the reason is a measurement that RFC could not
  have had. Amends nothing in `resistance-spectrum`; §2.1 records why.
- **Supersedes / superseded by:** —
- **Planning:** `planning/opponent-contracts/` (once implementing)

## Summary

`design/research/maia-endgame-fidelity.md` (2026-08-16; 1,095 probes, 0 errors, 507
tablebase-probed positions from 11 of the 14 endgame packs) measured two things about the
shipped opponent modes that no contract states. **D370:** `human_common`'s actual job in
twelve endgame packs is *resistance* — only **5.1%** of corpus positions on Maia's side of
a pack are decisions at all — and at that job it is measurably good (DTZ percentile
**0.72–0.75** against uniform **0.38**; slowest-losing move **61–69%** against **23%**;
fastest-losing **3.3%** against **31%**), while nothing in the pack format, the capability
registers, or any test names the property. **D371:** `perfect_tablebase` has no DTZ term at
all in a drawn root, so its comparator resolves entirely on `left.uci.localeCompare(right.uci)`
— and the census measured that this alphabetical pick is enriched **2.6×** toward
capture-or-pawn (zeroing) moves relative to a uniform pick among the same preserving moves.

This RFC names the direction of the law that D370 runs in — **executed, load-bearing, and
unclaimed**, the *silent dependency*, distinct from both the excess D8 found and the
deficit D29/D96 found — and specifies three things: a published resistance property for
`human_common` that is a corpus frequency and never a move verdict; a **named refusal to
order** a drawn root plus a neutral replacement for the arbitrary pick, because arbitrary
is unavoidable there and *geometry-correlated* arbitrary is not; and a totality gate over
`/opponentPolicy/mode` in `FORMAT_DISPOSITIONS`, which is the instrument that would have
caught D370 without a research dossier.

## Motivation

### M1. The law has run in two directions; this is the third

The declared-vs-executable law (`rfc/archive/defect-sweep.md` §2, quoted verbatim in
`rfc/archive/format-surface.md:171-173`):

> An executable vocabulary may contain only values the shipped runtime executes. A declared
> vocabulary may contain values it does not, provided every such value carries a
> machine-checked refusal reason and the deployment publishes what it can actually select.

Two directions are on the record:

| Direction | Named by | Shape |
|---|---|---|
| **excess** — declared, not executed | D8 (`perfect_tablebase` in schema, rejected at load) | The law's own text |
| **deficit** — executed, not declarable | D29, extended by D96 (`rfc/archive/format-surface.md:188`) — *"a declared-vs-executable **inversion** … here the runtime executes more than the format can declare"* | Ruled a member of the same family; `authoring-frictions` §8b shipped the fix |

D370 is neither. `human_common` is declared, is executed, and the resistance behaviour is
**perfectly declarable** — it is a frequency against tablebase ground truth, of exactly the
shape the registers already carry. It was simply never claimed.

**The name, and the reason it needs one.** Call this direction **unclaimed**, and the defect
it produces a **silent dependency**: the runtime executes a property, authored content
depends on it, and no register row, schema field, or test names it. Its failure mode is not
a broken promise — nothing promised anything. It is an **invisible regression**: a change to
the opponent that removed the property would break twelve packs' content while failing no
test and contradicting no document. The excess direction is loud (a value that does nothing
is findable by grep); the unclaimed direction is silent by construction, which is why it took
1,095 probes to find one instance.

**A three-part test, so this is an instrument and not a slogan.** A behaviour is a silent
dependency when all three hold:

1. **executed** — a named runtime site produces it;
2. **depended upon** — authored content's declared objective is changed by its absence;
3. **unnamed** — no `FORMAT_DISPOSITIONS` row, no `CAPABILITY_DISPOSITIONS` row, no schema
   field, and no test refers to it.

All three are verified for Maia's endgame resistance in §2. `format-surface` already named
the **fifth/sixth silent state** for a declaration that is *unclassified*
(`rfc/archive/format-surface.md:239-246`); this is the same disease one layer down — not an
unclassified declaration but an **undeclared behaviour**, which no register can hold a row
for because no row exists to be blank.

### M2. Why now, and what is out of scope

The measurement exists (`design/research/maia-endgame-fidelity.md`, D366 ✅) and it produced
exactly two rows this RFC owns: **D370** and **D371**.

**Explicitly out of scope: D369.** Twelve endgame packs declare a `targetElo` spanning
1150–1900 that moves the sampled move on 2 of 45 positions (43 tied, sign p = 0.5). That row
is **owner-gated**, and the evidence that would decide it is `tools/d333-band-outcome-harness/`
(D333), measuring whether the band moves the **result** at game level. This RFC touches the
band nowhere. It does interact with D369 in one direction only, and states it rather than
pre-empting it: the resistance property published in §2 is **band-independent**, because
that is what was measured (3.3% fastest-losing at all three bands; 0.751 / 0.719 / 0.729 DTZ
percentile), and §2.4 makes the band-independence a **declared refusal** rather than an
omission. If D333 later finds the band moves results at game level, the resistance profile
must be re-measured per band **before** any band-conditioned resistance claim is published;
the flat record stands until then. That is the whole of the dependency.

**Also out of scope:** D57 (closed 2026-08-16 by `format-surface`), D106
(`targetElo` beside `strong_engine`), and the two-packs-outside-the-tablebase content
question. §2.5 gives the latter a disposition; it does not change the packs.

## Specification

### 1. Vocabulary

Three terms are used normatively and are defined here rather than assumed.

- **Ordering basis** — the property by which a selector ranks the moves it is willing to
  play. A mode that ranks by DTZ has one; a mode that picks among moves it has declared
  equal does not.
- **Tiebreak** — the rule applied to a set the ordering basis has declared equal. A tiebreak
  is required to be **deterministic** and a **pure function of the position** (both already
  required by `grounding-pair` §2c for the reply journal) and, by this RFC, **neutral**:
  uncorrelated with move type, origin square, and destination square.
- **Silent dependency** — M1's three-part test.

### 2. D370 — `human_common`'s resistance, declared without becoming a chess claim

#### 2.1 First: is any of this already served by `practical_resistance`?

It is not, and the check is worth recording because the two look adjacent. Verified in the
shipped selector (`OpponentSelector#practicalResistance`,
`apps/server/src/opponent-selector.ts:641-734`):

| | `practical_resistance` | the measured `human_common` property |
|---|---|---|
| objective function | `humanConcessionMass` (`packages/runtime/src/practical-difficulty.ts`) — the fraction of the *learner's* Maia policy mass that lies on replies dropping the learner's category | |DTZ| after the move — how long the loss is made to take (`design/research/maia-endgame-fidelity.md` §6) |
| what it maximises | the chance the learner **errs** | the number of plies before the position **zeroes** |
| behaviour when nothing concedes | **refuses**: `PRACTICAL_RESISTANCE_UNDECIDABLE` when every measured candidate has `ratio === 0` (`:715-717`), `PRACTICAL_RESISTANCE_UNMEASURED` when no candidate returns measured mass (`:712-714`) | plays on |
| cost per move | 1 + 4 tablebase probes and 4 Maia calls (`:668-709`) | one Maia call |
| availability | tablebase only; refused above 7 pieces at authoring (`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `apps/server/src/pack-validation.ts:933-935`) | everywhere |

They are **different objectives on an overlapping domain**, and the overlap fails in the
direction that matters: in a position lost so plainly that no learner reply concedes,
`practical_resistance` throws `PRACTICAL_RESISTANCE_UNDECIDABLE` and selects nothing, while
that is exactly the sub-domain where dragging the loss out is the only thing left to do.
**How often that refusal fires on the twelve packs' Maia-side positions is unmeasured** — the
dossier did not run `practical_resistance` — and §6 carries it as an open question rather
than an assumption. What *is* verified is the code path.

So `practical_resistance` does not absorb D370, and no new **mode** is proposed here. D370 is
a declaration defect, not a missing capability: the behaviour ships.

#### 2.2 The property, stated exactly

The publishable object is a **frequency of an instrument against a named ground truth over a
named corpus**, with the corpus, the probe count, and the null it was compared against
carried alongside it. Every number below is `[V]` from
`design/research/maia-endgame-fidelity.md` §6 (arm B: 15 lost positions on Maia's own side of
a pack, × 3 bands × 6 repeats = 270 probes; the uniform baseline is computed exactly from the
tablebase's own move list, never simulated):

| statistic | Maia (1100 / 1500 / 1900) | uniform legal move |
|---|---|---|
| mean |DTZ| percentile of the selected move | 0.751 / 0.719 / 0.729 | 0.380 |
| selects the **slowest**-losing move | 68.9% / 61.1% / 64.4% | 22.7% |
| selects the **fastest**-losing move | 3.3% / 3.3% / 3.3% | 31.3% |

#### 2.3 The law-8 line, drawn where it actually falls

Law 8 / ADR-0005 forbids ungrounded strategic claims and **grading moves**. The line this
RFC draws, and which every clause below respects:

- **Admissible:** *"over a named 15-position corpus, this mode's selected move sat at |DTZ|
  percentile 0.72–0.75 against 0.38 for a uniform legal move."* This is arithmetic over an
  exact external instrument (Syzygy), aggregated across positions. It says **what happened**,
  never **what was good**. It is structurally the same object as the explorer result splits
  the owner ruled admissible as `corpus_observed` on 2026-08-15 (`design/BACKLOG.md`, D332
  row) and the same object as `dtz / precise_dtz as a recorded measurement`, already
  `reached` in `CAPABILITY_DISPOSITIONS` (`apps/server/src/capabilities.ts:116`).
- **Inadmissible, and therefore refused by name in §2.4:** attaching the property to an
  **individual live move**. *"Maia found the slowest-losing move here"* rendered beside a
  played move is a verdict on that move, and the fact that a tablebase supplied it does not
  make it less of a verdict — `CAPABILITY_DISPOSITIONS` already refuses Stockfish's
  `bestmove / MultiPV rank` on precisely this ground (`capabilities.ts:96`: *"Move verdicts
  are not condition measurements"*). The scope of the claim is the mode, not the move.
- **Inadmissible:** *"`human_common` defends well"*, *"resists like a human"*, or any
  rendering that converts the frequency into an adjective.

The one-sentence form of the rule this RFC adds: **a resistance property is publishable at
mode scope as a measured frequency and is never publishable at move scope as a label.**

#### 2.4 The three legs, applied

**(a) Capability publication.** Two rows, in the two registers that already exist, because
the property is both a deployment fact and a format fact.

1. `CAPABILITY_DISPOSITIONS` (`apps/server/src/capabilities.ts:92-129`) gains:

```ts
{ instrument: "Maia", capability: "|DTZ| percentile of the selected move in a decided position",
  disposition: "reached",
  reason: "Measured 0.72-0.75 against 0.38 for a uniform legal move over 270 probes on 15 in-pack lost positions (design/research/maia-endgame-fidelity.md §6); recorded at mode scope, never rendered as a move verdict",
  surface: "opponent selection" },
{ instrument: "Maia", capability: "band-conditioned resistance", disposition: "refused",
  reason: "Measured flat across 1100/1500/1900 (fastest-losing 3.3% at every band); a per-band resistance figure would assert a difference the measurement did not find" },
{ instrument: "Maia", capability: "resistance above seven pieces", disposition: "unmeasured",
  reason: "No exact DTZ ground truth exists outside the Syzygy range; conversion-up-a-piece (17 pieces) and rook-4v3-same-side-hold (11) are outside it at every authored position",
  experiment: "D370-b realized-ply-count-to-conversion against a fixed converting opponent on the two out-of-range packs" },
```

The `unmeasured` row carries the experiment obligation the existing gate already enforces
(`assertAdvertisedCapabilityDispositions`, `capabilities.ts:147-151`, throws on an
`unmeasured` row with no experiment). None of the three rows carries `advertisedOptions`,
so none widens the advertised-option coverage assertion (`:135-146`).

2. `FORMAT_DISPOSITIONS` (`packages/schema/src/drill-pack/dispositions.ts`) gains a
`(pointer: "/opponentPolicy/mode", value: "human_common")` row — see §4, which makes such a
row **mandatory for every mode** rather than optional for this one.

**(b) A named refusal.** Three, all above, all machine-checkable: band-conditioned
resistance is `refused`; resistance outside the tablebase is `unmeasured` with a named
experiment; per-move rendering is refused by §2.3's rule, enforced as a test in §5.

**(c) An applied record — at mode scope, and the reason it is not per selection.**
The engine-request contract's *record* obligation is *"every value applied and the answer
taken appear in the persisted record"* (`rfc/archive/format-surface.md:177`). Its remedy
clause is **vacuous here**, because `human_common` *applies no value* when it resists — it
runs one Maia call and takes the sample; there is no knob whose setting could be recorded.
`format-surface` §3.2 already established the handling for a law whose remedy clause does
not fit its case (D85: *"applies the law's principle … and not its remedy, and says so"*),
and this RFC does the same.

The applied record is therefore at **mode scope**, on `/capabilities`, alongside the band
profile that is already published there. `Capabilities.policyProfiles.human_common`
(`capabilities.ts:71-76`, populated at `:310-313`) gains a sibling to `elo`:

```ts
readonly human_common: {
  readonly elo: EngineBandProfile;
  readonly resistance: {
    readonly basis: "measured";
    readonly metric: "dtz_percentile";
    readonly scope: "positions of at most seven pieces in which every legal move preserves the mover's tablebase category";
    readonly corpus: { readonly dossier: "design/research/maia-endgame-fidelity.md#6"; readonly positions: 15; readonly probes: 270; readonly measuredAt: "2026-08-16" };
    readonly bands: readonly [1100, 1500, 1900];
    readonly bandConditioned: false;
    readonly dtzPercentile: { readonly min: 0.719; readonly max: 0.751; readonly uniformBaseline: 0.380 };
    readonly slowestLosingRate: { readonly min: 0.611; readonly max: 0.689; readonly uniformBaseline: 0.227 };
    readonly fastestLosingRate: { readonly value: 0.033; readonly uniformBaseline: 0.313 };
  };
};
```

It is a **frozen literal**, not a runtime computation: nothing probes a tablebase to fill it
in. Two reasons, and both are load-bearing:

1. **Cost.** A per-selection resistance record needs a tablebase probe on every
   `human_common` move. `human_common` costs one Maia call today; §2.1's table prices the
   only mode that does probe per move at 5 probes + 4 Maia calls. Paying that on the default
   opponent to record a number nothing consumes is not a trade this RFC will make.
2. **Law 8.** A per-selection DTZ-percentile field *is* a per-move quality number attached
   to a move, sitting in the run record where every renderer can reach it. §2.3 refuses that
   at the source rather than adding a rendering rule downstream and hoping it holds.

`policyProfiles` is part of the `/capabilities` payload and **not** the run schema, so leg
(c) costs no run-schema version and no migration.

#### 2.5 The two packs nothing measures

`conversion-up-a-piece` (17 pieces at every authored position) and `rook-4v3-same-side-hold`
(11 pieces, no deviations) are outside the Syzygy range everywhere, and pack validation
refuses both tablebase modes there (`PERFECT_TABLEBASE_OUT_OF_RANGE` /
`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `apps/server/src/pack-validation.ts:930-935`, gated on
`countFenPieces` alone). `human_common` is not a choice for them; it is the only mode that
exists. The `unmeasured` row in §2.4(a) is the honest disposition and it names an
experiment. **This RFC does not touch either pack** and does not add an authoring refusal
for them: refusing the only available mode would make two shipped packs unloadable to buy a
disposition the register already carries.

### 3. D371 — the drawn root

#### 3.1 A correction the brief is owed: this was specified

The framing that `perfect_tablebase` *"falls through to lexicographic order in a case nobody
specified"* is **wrong at the RFC tier**, and getting it right changes the remedy.
`rfc/archive/grounding-pair.md` §2c (`:236-244`) specified it, deliberately, with a stated
reason:

> …when the category is drawn, every category-preserving move ties by definition; **all ties
> — equal DTZ, null DTZ, or the drawn case — break to the lexicographically least UCI**, so
> two runs, or two branches of one group, replaying the same position always receive the same
> reply. No seed participates — the selection is a pure function of the position…

The shipped comparator is that specification, executed
(`OpponentSelector#perfectTablebase`, `apps/server/src/opponent-selector.ts:636`):

```ts
const ordered=[...preserving].sort((left,right)=>winning?metric(left)-metric(right)||left.uci.localeCompare(right.uci):losing?metric(right)-metric(left)||left.uci.localeCompare(right.uci):left.uci.localeCompare(right.uci));
```

with `metric = Math.abs(move.preciseDtz ?? move.dtz ?? 0)` (`:635`), `winning =
position.category.includes("win")` and `losing = position.category.includes("loss")`
(`:634`). So a `draw` root takes the third arm and no DTZ term participates — as designed.

And `grounding-pair`'s premise is **true**: from a `draw` root the preserving filter admits
only moves whose inverted category is exactly `draw` (`:629-632`, using
`invertTablebaseCategory`, `apps/server/src/tablebase.ts`), the tablebase is exhaustive at
≤ 7 men, and every such move holds the same result with best play. There is genuinely
nothing to order by. DTZ is distance to *zeroing* and in a drawn position it is not a
distance to anything the objective cares about.

**So D371 is not an unspecified fall-through. It is a specified tie whose declaration never
left the RFC, plus a tiebreak whose one unstated assumption the census refuted.**

#### 3.2 What the measurement adds: determinism is not neutrality

`grounding-pair` required the tiebreak to be **deterministic** and a **pure function of the
position**. `localeCompare` is both. It implicitly assumed a third property — that a tiebreak
over moves declared equal is **neutral**, i.e. does not systematically prefer one *kind* of
move. The census refutes that (`design/research/maia-endgame-fidelity.md` §7, over the
507-position corpus, reading move type from the SAN the tablebase itself returned):

| root | n | mode's pick is a capture or pawn move | expected if picked uniformly among the same preserving moves | ratio |
|---|---:|---:|---:|---:|
| winning | 218 | 32 (14.7%), Wilson [10.6%, 20.0%] | 9.34% | 1.57× |
| **drawn** | **66** | **7 (10.6%), Wilson [5.2%, 20.3%]** | **4.02%** | **2.6×** |
| losing | 223 | 14 (6.3%), Wilson [3.8%, 10.3%] | 2.99% | 2.1× |

The winning row is a **DTZ effect and is intended**: minimising |DTZ| means moving toward the
next zeroing move, and captures and pawn moves *are* the zeroing moves. The drawn row cannot
be a DTZ effect — no DTZ term acts there — so it is an artifact of alphabetical order alone,
and its interval excludes the uniform expectation.

**The mechanism, stated without judgment:** UCI strings sort by origin file then origin rank,
so `localeCompare` systematically prefers moves originating on the a- and b-files and on low
ranks. In the endgames these packs contain, that correlates with pawn moves and with captures
by the lowest-lettered piece. Captures and pawn moves are, by the definition of DTZ, exactly
the irreversible-simplification class. So the shipped tiebreak systematically simplifies a
drawn position, and it does so for no reason the tablebase supplies.

**Why that is a product consequence and not a curiosity.** `perfect_tablebase` is
pack-only — non-pack sessions are refused it outright (`packages/runtime/src/events.ts:160-162`:
*"Non-pack sessions cannot use pack-only opponent modes"*) — and the pack objective whose root
is drawn is `hold` (`design/01-training-model.md:84`: *"preserve a draw against strong or
perfect resistance"*). A drill whose entire content is holding a draw, played against an
opponent that liquidates a1-ward, is a drill whose content is removed by its own opponent.
The claim here is about **which moves get played**, measured; it makes no assertion about
which moves are better.

#### 3.3 The decision

**There is no defensible ordering of a drawn root, and this RFC does not invent one.** The
tablebase publishes exactly one fact about a drawn position — that it is drawn — and its
exhaustive move list assigns every category-preserving move the same value of that fact. Any
ordering imposed on that set is either arbitrary or is a chess claim the tablebase did not
make. Ordering by a downstream "sharpness" statistic (how many of the learner's replies drop
the draw) was considered and is **rejected**: it is an ordering by *difficulty*, which is
`practical_resistance`'s declared objective (§2.1) and not `perfect_tablebase`'s, it costs a
tablebase probe per candidate, and folding it in would make one mode mean two things.

So the normative decision is a **named refusal to order, not a refusal to move**:

> **`perfect_tablebase` declares that a drawn root has no ordering basis.** Where the root
> category is neither a win nor a loss for the selector side, the mode publishes
> `orderingBasis: "none"` and selects by the declared neutral tiebreak. It does **not**
> refuse the position, and it does **not** claim its pick is better than any other
> category-preserving move.

**The pick must still be made, and this RFC changes what it is made by**, on the narrow
ground that if a choice is arbitrary, *arbitrary-and-uncorrelated* is honest while
*arbitrary-and-geometry-correlated* wears the appearance of a preference. Normative:

1. The DTZ comparator is **unchanged**: ascending |DTZ| when the selector side's category
   `includes("win")`, descending when it `includes("loss")`. `grounding-pair` §2c's
   DTZ-optimality argument stands untouched.
2. **Every residual tie** — equal |DTZ|, both-null DTZ, and the whole drawn root — is broken
   by `neutralTiebreak`, defined as ascending hex order of
   `sha256(fen + "\0" + uci)`, where `fen` is the same string the mode already probes with
   (`makeFen(currentPosition(request).toSetup())`, `:626`, carrying the true halfmove clock),
   with `uci.localeCompare` retained as a final total-order guarantee that is unreachable in
   practice.
3. `neutralTiebreak` uses **no seed and no history**. It is a pure function of the position,
   exactly as `grounding-pair` §2c requires, so the branch-group fixed-resistance reply
   journal is satisfied by the same argument as before: a pure function cannot disagree with
   itself. The primitive already ships — `createHash("sha256")` is used for `historyHash` and
   `unitInterval` in the same file (`opponent-selector.ts:175-189`, `:313-316`) — so nothing
   new is introduced but the key.

**What is deliberately given up:** legibility. `localeCompare` lets an author predict the
reply by reading the move list; a digest order does not. That is a real cost and it is
accepted, because an inspectable-but-biased order is worse than an opaque-but-neutral one
precisely when the set being ordered has been declared equal — and because `orderingBasis`
plus the recorded `candidates` array (which already carries the full ranked list,
`:637`) makes the actual order visible in the run record, where an author debugging a pack
will look anyway.

**What this does not migrate.** Nothing persisted is recomputed: `resistanceOnPath`
(`packages/runtime/src/replay.ts:113`) derives resistance from recorded events, never by
re-running the selector. The observable consequence is stated rather than hidden: **a branch
group created before the change and extended after it may receive a different reply at a
tied position**, which is the ordinary consequence of changing a pure selector and is why the
change lands with a run-schema stamp (§5) rather than silently.

#### 3.4 The applied record — and the precedent that makes it mandatory

Today a drawn-root selection persists `policyModeApplied: "perfect_tablebase"` for a move
chosen entirely by `localeCompare`. **That is the D57 defect shape, exactly**, and
`format-surface` already ruled on it (`rfc/archive/format-surface.md:187`):

> The mode *is* published, *is* selectable, and the runtime *does* execute it. The defect is
> that the persisted `policyModeApplied` reads `practical_resistance` for a move chosen by
> `left.move.uci.localeCompare(right.move.uci)`. *record* is *"every value applied and the
> answer taken appear in the persisted record"*; the answer taken was lexicographic and the
> record says otherwise.

Same mode family, same law, same sentence — and it was ruled `implement`. So:

`OpponentSelection` (`packages/runtime/src/types.ts:102-107`) gains one optional field:

```ts
readonly orderingBasis?: "dtz_ascending" | "dtz_descending" | "none";
```

- `#perfectTablebase` sets it on every selection: `"dtz_ascending"` when the root category
  `includes("win")`, `"dtz_descending"` when it `includes("loss")`, `"none"` otherwise.
- **No other mode emits it.** `practical_resistance` already records its basis per candidate
  as `concessionRatio` (`SelectionCandidate.concessionRatio`,
  `packages/runtime/src/types.ts:83`); `human_common`, `theory_strict` and `strong_engine`
  have no ordering basis to record and the field stays absent.
- Historical selections have no `orderingBasis` and it is **never inferred** — the same rule
  `policyModeApplied` shipped under (D15, migration 5).

#### 3.5 The authoring signal, and why it is static and a warning

An authoring-time check that the root *is* drawn is **not implementable in the shipped
validator**: `validatePackDocument` is synchronous and every existing tablebase-mode check
runs off `countFenPieces` alone (`apps/server/src/pack-validation.ts:930-935`); nothing in the
authoring path probes a tablebase (probe sites are `opponent-selector.ts:626,647,671`,
`evidence-queue.ts:309`, `service.ts:1074`). The signal must therefore be derived from the
document.

The static predicate is `objective.type`, and it is narrower than it first looks. Correcting
a plausible reading: **`save` and `resist` roots are not drawn.** `OBJECTIVE_ASSESSMENT_SETS`
(`apps/server/src/tablebase.ts:8-13`) gives `save` and `resist` the learner categories
`["loss", "blessed-loss"]` — a root the learner is *losing* is a root the **opponent is
winning**, so `perfect_tablebase` takes the ascending-DTZ arm there, fully ordered. Only
`hold` (`["draw", "cursed-win", "blessed-loss"]`) can put the mode in the unordered arm, and
even then only for the `draw` member: a `cursed-win` root inverts to `blessed-loss` for the
opponent, which `includes("loss")` and takes the descending arm.

So, normative:

> `validatePackDocument` emits the **warning** `PERFECT_TABLEBASE_UNORDERED_OBJECTIVE` at
> `/opponentPolicy/mode` when `opponentPolicy.mode === "perfect_tablebase"` and
> `objective.type === "hold"`, with the message: *"a hold objective may present
> perfect_tablebase with a drawn root, where it has no ordering basis and its reply is a
> declared-neutral pick among category-preserving moves; practical_resistance is the mode
> written for difficulty in a decided position."*

A **warning**, not an error, and the reason matters: in a drawn root `perfect_tablebase` is
still exactly correct about the result — it holds the draw with certainty. Refusing it would
be a stronger claim than the measurement supports. The code is free-form
(`runtimeWarning(code: string, …)`, `pack-validation.ts:133-135`), so no `ServerErrorCode`
member is added and `rest.ts`'s 422 mapping is untouched. **No shipped pack is affected:**
the only two packs declaring `perfect_tablebase` are `mate-bishop-knight` and
`trajectory-mate-bishop-knight`, both mating techniques, neither `hold`
(`design/research/maia-endgame-fidelity.md` §2.1).

**There is no runtime refusal.** A won root becomes a drawn root the moment the learner errs
— which in a mate-technique pack is the single most likely thing to happen — and a mode that
threw at that moment would kill the run on the learner's mistake. Declaring is the remedy;
refusing is not.

### 4. The gate: `FORMAT_DISPOSITIONS` totality over `/opponentPolicy/mode`

D370 was found by 1,095 tablebase probes. It should have been findable by a test, and the
register built to end the silent state does not currently reach it.

**Verified state of the register** (`packages/schema/src/drill-pack/dispositions.ts`, 8 rows):
it carries `(pointer: "/opponentPolicy/mode", value:)` rows for **`plan_defense`,
`human_external` and `practical_resistance` only**. `human_common`, `theory_strict`,
`strong_engine` and `perfect_tablebase` have **no row**, and the gate does not notice:
`apps/server/src/format-surface.test.ts:66-88` asserts key uniqueness, three named pointers,
and that `DECLARED_UNIMPLEMENTED_POLICY_MODES` round-trips — nothing that requires coverage
of the enum. **The register that exists to make the silent state hard to occupy is silent
about four of the seven declared opponent modes**, including the default one.

Normative addition to that test:

1. Read the seven-member `enum` at `$defs/opponentPolicy/properties/mode` in
   `schemas/drill_pack.schema.json`.
2. **Fail** when any member has no `(pointer: "/opponentPolicy/mode", value: <member>)` row
   in `FORMAT_DISPOSITIONS`.
3. **Fail** when a member of `RUN_OPPONENT_MODES` (`packages/runtime/src/types.ts:41-48`) has
   a row whose disposition is not `reached`, or when a schema member absent from
   `RUN_OPPONENT_MODES` has a row whose disposition is not `refused` — the two halves of the
   declared-vs-executable law, checked in both directions.
4. Every `reached` row names a `site` (`{module, symbol}`), as the shipped
   `practical_resistance` row already does.

The four missing rows this forces:

| value | disposition | reason | site |
|---|---|---|---|
| `human_common` | `reached` | Samples the Maia policy head at the requested band; in a decided position its selected move sits at |DTZ| percentile 0.72–0.75 against 0.38 for a uniform legal move (`design/research/maia-endgame-fidelity.md` §6), measured at mode scope and never rendered per move | `apps/server/src/opponent-selector.ts` · `humanCommon` |
| `theory_strict` | `reached` | Samples Maia restricted to authored spine children; records the off-spine transition to `human_common` | `apps/server/src/opponent-selector.ts` · `theoryStrict` |
| `strong_engine` | `reached` | Stockfish under a reproducible search bound; `targetElo` is not honoured here (**D106**, open) | `apps/server/src/opponent-selector.ts` · `strongEngine` |
| `perfect_tablebase` | `reached` | Category-preserving and DTZ-optimal in a won or lost root; in a drawn root it declares `orderingBasis: "none"` and picks by the neutral tiebreak | `apps/server/src/opponent-selector.ts` · `perfectTablebase` |

The `human_common` row is the one that would have caught D370: writing a `reason` for the
default opponent forces the author to state what it does, and *"resists a decided loss"* is
the first thing anyone writing that sentence discovers is missing.

### 5. Register claims — stated loudly, per the lane rules

| Register | Claim | Body |
|---|---|---|
| **Pack schema** | **0.28** | `FORMAT_DISPOSITIONS` gains five rows (§2.4a·2, §4) and the totality gate lands. **No `$defs` are touched, no committed pack bytes change, no digests move, and no pack migration exists.** The lane is claimed because `FORMAT_DISPOSITIONS` is a **schema-version fact** by `format-surface`'s own ruling (*"a fact about that schema version and … deliberately absent from `/capabilities`"*, `rfc/archive/format-surface.md:287-290`) and because `claim-backing` set the precedent that a validator-and-register-only change claims a lane. **0.25 is at HEAD; 0.26 is claimed by `claim-backing`; 0.27 by `pack-graduation`** (`rfc/README.md:73-75`), so **0.28 is the next free lane**. If cross-review rules that register rows are not a schema-version change, this claim is **released**, not rebased — say so in `rfc/README.md`, which this RFC does not edit. |
| **Run schema** | **0.17** | `OpponentSelection.orderingBasis` (§3.4). Additive and optional; historical selections omit it and it is never inferred. **0.16 is claimed by `engine-leverage` (implementing)** (`rfc/README.md:154`), so 0.17 is the next position. |
| **Storage migration** | **position `STORAGE_VERSION + 1`** | Stamp-only: frozen run-schema literals `"0.16"` → `"0.17"`. No table, no index, no data rewrite — the same body as migrations 16–20. `STORAGE_VERSION` is **22** at `apps/server/src/storage.ts:407`; the **integer is assigned at landing**, never claimed here, and the migration body uses frozen literals rather than the moving constant. |
| **`/capabilities` payload** | **changed** | `policyProfiles.human_common.resistance` (§2.4c) and three `CAPABILITY_DISPOSITIONS` rows (§2.4a). Not a versioned register; client types widen with the server type. |

The loudest of the four is the **run-schema claim**: this RFC is more likely to be read as a
pack change than it is one, and the pack lane it takes is defensive rather than substantive.

## Deviations from design

1. **`grounding-pair` §2c is amended, not extended.** Its drawn-case tiebreak
   (*"break to the lexicographically least UCI"*) is replaced for every tie. Its two stated
   requirements — determinism and purity — are preserved exactly; a third, neutrality, is
   added on a measurement that RFC did not have. This is an RFC-tier amendment of an archived,
   implemented RFC and is flagged for the owner rather than assumed.
2. **`design/01-training-model.md:84`** describes hold as *"preserve a draw against strong or
   **perfect** resistance"*. This RFC records that in a drawn root "perfect" has no ordering
   content — the mode is perfect about the *result* and silent about the *choice* — and
   attaches a warning to the pairing rather than proposing a change to the design text. Any
   change to `design/01` is the owner's.
3. **No new opponent mode, no change to any pack, no change to any `targetElo`.**
4. **D369 is untouched** and remains owner-gated behind D333 (§M2).

## Acceptance criteria

**Registers and gates**

- A1. `FORMAT_DISPOSITIONS` has one row per member of the seven-member schema mode enum; the
  new gate **fails** when a row is deleted, when an executable mode's row is not `reached`,
  when a schema-only mode's row is not `refused`, and when a `reached` row omits `site`.
  A mutation test demonstrates each of the four failures.
- A2. `assertAdvertisedCapabilityDispositions` still passes with the three new
  `CAPABILITY_DISPOSITIONS` rows, and still throws when the `unmeasured` resistance row's
  `experiment` is blanked.
- A3. `format-surface.test.ts`'s existing assertion that `capabilities.ts` does not contain
  `formatDispositions` still passes — the two registers stay separate.

**D370**

- A4. `/capabilities` returns `policyProfiles.human_common.resistance` with every field of
  §2.4(c), and a test asserts each numeric literal against the value quoted in
  `design/research/maia-endgame-fidelity.md` §6, so the dossier and the payload cannot drift.
- A5. **The law-8 guard, and it must not be vacuous.** A test asserts that no field named
  `dtz`, `dtzPercentile`, `resistance`, or `slowestLosing` appears on `OpponentSelection` or
  `SelectionCandidate`, and a client-source scan asserts that the resistance figures are
  rendered only on a mode-scope surface and never inside a move list or move detail. The test
  is written so that adding a per-move resistance field fails it.
- A6. `human_common` selection cost is unchanged: one Maia call per move, asserted by call
  count against the mock engine client.

**D371**

- A7. Given a drawn root, `#perfectTablebase` returns `orderingBasis: "none"`; given won and
  lost roots, `"dtz_ascending"` / `"dtz_descending"`. A fixture covers a `cursed-win` root
  (`"dtz_ascending"`, since it `includes("win")`) and a `blessed-loss` root
  (`"dtz_descending"`).
- A8. **Determinism and purity survive.** The same position with two different seeds, two
  different histories reaching it, and two branches of one group all produce the identical
  reply — the existing branch-group fixed-resistance assertions pass unchanged.
- A9. **Neutrality is measured, not asserted.** Re-run the census arm of
  `tools/d366-endgame-fidelity-harness/` over the same 507-position corpus under the new
  tiebreak. Required: the **drawn-root** capture-or-pawn rate becomes statistically
  indistinguishable from the uniform-among-preserving expectation of **4.02%** (Wilson
  interval covering it), against the shipped **10.6%**.
- A10. **The won-root enrichment must not move.** The same re-run must leave the winning row
  at **1.57×** within its interval. If it moves materially, the winning-row enrichment was
  partly lexicographic rather than wholly a DTZ effect, and §3.2's reading of the census is
  wrong — this criterion exists to be able to fail.
- A11. `PERFECT_TABLEBASE_UNORDERED_OBJECTIVE` fires for a `perfect_tablebase` + `hold` pack,
  does **not** fire for `save`, `resist`, or `win`, and all committed packs still validate
  with zero new errors and zero new warnings.
- A12. Run schema reads `0.17`; the stamp-only migration is idempotent; historical selections
  read back with `orderingBasis` absent and nothing infers it.

## Open questions

1. **Is the pack-schema lane claim right at all?** §5 claims 0.28 defensively because
   `FORMAT_DISPOSITIONS` is a schema-version fact, while touching no `$defs` and moving no
   digest. `claim-backing` is the precedent in one direction and its own register row has
   flipped between *claimed* and *released* twice. **Owner or cross-review call**; if the
   answer is "no lane", 0.28 is released rather than rebased.
2. **Is the digest tiebreak the right trade, or is legibility worth the measured bias?**
   §3.3 accepts opacity to buy neutrality. The alternative — keep `localeCompare`, publish
   the 2.6× enrichment as a declared property of the mode, and change nothing — is coherent,
   cheaper, and preserves an author's ability to predict the reply by reading. This RFC
   chose against it because the bias is toward *irreversible simplification* in exactly the
   objective (`hold`) whose content is the opposite. **Owner-facing.**
3. **How often does `practical_resistance` refuse on the twelve packs' Maia-side positions?**
   §2.1 verifies the `PRACTICAL_RESISTANCE_UNDECIDABLE` code path but nothing measures its
   frequency, and that frequency decides whether `practical_resistance` is a real alternative
   for the two `hold` packs inside the tablebase range
   (`philidor-third-rank-hold`, `opposite-bishops-fortress-hold`) or a mode that refuses when
   they need it. Cheap to measure with the existing corpus; **deferred to a follow-up
   measurement, not to a future RFC**.
4. **Does resistance actually lengthen a drill?** §6's DTZ percentile is a per-move
   measurement. The product claim implied by "the resistance is load-bearing" is that the
   drill runs longer and the technique gets rehearsed, and **nothing measures realized ply
   count**. The D370-b experiment named in §2.4(a) would answer it for the out-of-range packs;
   it should be run for the in-range ones too before E4 is claimed on this evidence.
5. **`perfect_tablebase` excludes a `cursed-win` reply from a drawn root** — the preserving
   filter demands exact category equality, so a move converting a draw into a cursed win (a
   real win, drawn only by the 50-move rule) is treated as non-preserving and discarded. This
   is consistent with `OBJECTIVE_ASSESSMENT_SETS` (`win` counts only `win`) and with
   `grounding-pair`'s full-lattice rule, and the dossier could not test it: **zero of the 507
   corpus positions carry a `cursed-win` or `blessed-loss` category at the root or on any
   legal move** (§9, limit 2). Flagged as unmeasured, not as a defect, and deliberately not fixed
   here.
6. **Should the neutral tiebreak also apply to `practical_resistance`'s
   `.slice(0, 4)`?** That mode truncates to the four *lexicographically first* preserving
   moves before scoring (`opponent-selector.ts:656-657`) — the same a1-ward bias, on a
   surface where it is not a tiebreak among equals but a **candidate filter**, and therefore
   a stronger defect. The dossier flags it (§8.2). It is a different mode with a different
   objective and this RFC does not scope it; it needs its own ledger row (§reported rows).
7. **Does `orderingBasis` deserve a client surface, or is the run record enough?** §3.4
   specifies the record. Whether the drill client should *show* "no ordering basis — the
   opponent's reply here is one of N equally drawing moves" is a `design/05` question and is
   the owner's, not this RFC's.

## Changelog

- 2026-08-16: created.
