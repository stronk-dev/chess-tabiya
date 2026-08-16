# RFC: Opponent contracts — what a mode executes, what it may claim, and what it must refuse

- **Status:** draft — **adversarially cross-reviewed 2026-08-16 (see Changelog).** The pack
  **0.28** claim is **RELEASED** by the cross-review (§5, open question 1); the run-schema
  0.17 claim, the migration position, the `/capabilities` change, and both substantive
  findings survive. Six line references were corrected against the tree, one precedent
  claim was found false, one applied-value claim was found overstated, and the D333
  evidence that landed after drafting is folded in.
- **Author:** claude (agent)
- **Cross-review:** claude (agent), 2026-08-16 — all figures re-derived at HEAD `790a4de`;
  every code reference relocated by symbol rather than by line
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
- **Ledger rows this RFC owns** (cited by row title; `design/BACKLOG.md` is claude's to land,
  because concurrent agents collide on it):
  - *"Maia's real endgame job is resistance, and `human_common` never declares, measures or
    guards it"* — §2, flips at closeout
  - *"`perfect_tablebase` degenerates to alphabetical order in drawn roots"* — §3, flips at
    closeout
  - *"The register built to end the silent state is itself silent about the default opponent"*
    — §4 closes it; the row already exists and this RFC **closes rather than opens** it
  - *"The UNCLAIMED direction of the declared-vs-executable law"* — §M1 names it; promotion to
    design tier is the owner's
- **Ledger rows this RFC references and does not own:** *"Twelve endgame packs declare a
  `targetElo` that does nothing measurable"* (owner-gated, untouched — §M2); *"`practical_resistance`
  truncates to the four lexicographically-first preserving moves"* (already open, deliberately
  unscoped — open question 6); *"`targetElo` is accepted beside `strong_engine` and silently
  dropped"* (untouched)
- **Ledger rows this cross-review opens** (2026-08-16; reported here for claude to land, not
  written by this RFC):
  1. **A register-only change does not claim a pack-schema lane, and the precedent should be
     written down before the next draft re-litigates it.** §5.1 had to derive it from scratch
     because `rfc/README.md`'s pack register records *what* each lane bought and never *what
     qualifies as a lane*. One sentence in that register would have saved this round.
  2. **`rest.ts`'s selection parser silently drops any field it does not name**
     (`apps/server/src/rest.ts:255-282` rebuilds `OpponentSelection` field by field rather
     than passing it through). This is a latent *record* hazard for **every** future selection
     field, not only `orderingBasis` — a field can ship in the type, in storage, and in the
     JSON schema, and still never reach a client. There is no gate that would catch it.
  3. **`SelectionCandidate.rank` is a ranking word for a set that may have no ordering basis.**
     §3.3 fixes it normatively for `perfect_tablebase`; the general question — whether `rank`
     should be optional, or renamed, wherever the producing mode declares no basis — is wider
     than this RFC.
  4. **Two drafts claim the same migration position** (`opponent-contracts` and
     `teacher-surface`, both `STORAGE_VERSION + 1`) and **three drafts carry a stale
     `STORAGE_VERSION`** — `teacher-surface` says 21, `engine-leverage` says 20,
     `evidence-at-runtime` says 20/21; it is **22**. The register's "position, not integer"
     rule works, but nothing re-checks the constant a draft quotes beside it.
  5. **`resistance` becomes the fourth distinct meaning of that token on the server surface**
     (branch-group `GroupResistance`; the flip/repertoire policy-mode alias; the
     `practical_resistance` mode; and now a measured DTZ-percentile profile). Naming only, but
     it is the first one that is a measurement rather than a policy selector.
  6. **Adding three Maia rows grows the divergence already ledgered as *"Two capability
     registers now describe the same instruments and nothing makes them agree"***
     (`evidence-at-runtime`'s proposed `recordedReadingKinds` against `CAPABILITY_DISPOSITIONS`).
     Coherence risk, not a write collision.
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

**It takes exactly one register version: run schema 0.17.** The pack lane the draft claimed
defensively is **released** by cross-review (§5.1) — register rows are not a schema-version
event, and no lane in the register's history was ever claimed without a schema-document
change. `0.28 remains free.`

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
is **owner-gated**. This RFC touches the band nowhere. It interacts with D369 in one
direction only: the resistance property published in §2 is **band-independent**, because that
is what was measured (3.3% fastest-losing at all three bands; 0.751 / 0.719 / 0.729 DTZ
percentile), and §2.4 makes the band-independence a **declared refusal** rather than an
omission.

**The dependency this section originally deferred has since resolved, and it resolved in this
RFC's favour** `[cross-review 2026-08-16]`. The draft was written expecting
`tools/d333-band-outcome-harness/` to be pending, and hedged: *"if D333 later finds the band
moves results at game level, the resistance profile must be re-measured per band."* D333 has
landed — `design/research/maia-band-outcome-transfer.md`, 16,660 complete games — and the
literal antecedent fired while the consequent does not follow, because the finding is
**material-conditioned**:

- the band **does** move the result, at every gap tested down to 100 points, with a transfer
  ratio of **0.289 [0.269, 0.309]** over the corpus and **0.400 [0.379, 0.421]** at full
  material (ledger row *"The band's TRANSFER RATIO is 0.29 over the corpus and 0.40 at full
  material"*);
- but the attenuating variable is **pieces remaining, not the declared phase**, and **below
  ten pieces the dial stops working** — an 800-point gap is worth +292 Elo at ≥ 21 pieces and
  **+53 at ≤ 10**, with the 100-point arms' CIs straddling parity in both low-material arms;
  transfer falls to **≈ 0.07 in reduced endgames** (ledger row *"The band's effect tracks
  PIECES REMAINING, not the declared phase — and it explains D366 exactly"*).

Every position this RFC's resistance property is measured over is 3–7 pieces
(`design/research/maia-endgame-fidelity.md` §2.2), i.e. **entirely inside the regime where the
band demonstrably does not transfer**. So `bandConditioned: false` is no longer an
endgame-only null result awaiting a game-level check; it now has a **game-level cause**,
measured on a different instrument against different ground truth, that predicts the flat
endgame reading rather than merely failing to contradict it. The refusal is **stronger than
drafted**, and §2.4(a)'s `reason` string is amended to say so. The re-measurement obligation
this section imposed on itself is **discharged, not deferred**.

That evidence also narrows D369 without this RFC touching it: the question is no longer
*"is the dial real"* (it is, at ≈0.29 overall) but *"should an endgame pack declare a band at
all"*, which remains the owner's.

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
| availability | tablebase only; refused above 7 pieces at authoring (`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `apps/server/src/pack-validation.ts:1003-1005`) | everywhere |

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
  reason: "Measured flat across 1100/1500/1900 (fastest-losing 3.3% at every band, design/research/maia-endgame-fidelity.md §6); the band's game-level transfer ratio falls from 0.40 at full material to ~0.07 below ten pieces (design/research/maia-band-outcome-transfer.md §7, 16,660 games), so the flat endgame reading has a measured cause and a per-band resistance figure would assert a difference no instrument finds" },
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
experiment; per-move rendering is refused by §2.3's rule, enforced as a test by **A5**
(the draft pointed at §5, which is the register-claims table and carries no test)
`[cross-review 2026-08-16]`.

**(c) An applied record — at mode scope, and the reason it is not per selection.**
The engine-request contract's *record* obligation is *"every value applied and the answer
taken appear in the persisted record"* (`rfc/archive/format-surface.md:187`).

**Stated precisely, because the draft overstated it** `[cross-review 2026-08-16]`. The draft
read *"`human_common` applies no value when it resists"*, and that is **false as written**:
`human_common` does apply a value — the band — and `resistance-spectrum` already records it
as `eloApplied` on every Maia selection, which `CAPABILITY_DISPOSITIONS` publishes as
`reached` (*"Applied band is recorded on every new Maia selection"*, `capabilities.ts:110`).
The true and narrower claim is about the **resistance property specifically**: resistance is
not a knob the selector sets, it is an emergent property of the policy head that no request
parameter carries. There is no *value applied* for resistance to record, because nothing was
applied — one Maia call is issued at the band already recorded, and the sample is taken. The
*record* obligation is discharged for everything `human_common` applies; it has no purchase
on a property that is measured rather than requested.

That is the same shape as D85, and `format-surface` §3.2 already established the handling for
a law whose remedy clause does not fit its case (*"applies the law's principle … and not its
remedy, and says so"*, `rfc/archive/format-surface.md:186`). This RFC does the same, and the
distinction matters for the blast radius: the amendment is **not** that `human_common` escapes
the record obligation, only that the resistance figure is not a member of the set the
obligation ranges over.

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
`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `apps/server/src/pack-validation.ts:1000-1005`, gated on
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

**Two honesty corrections to the paragraph above, both added by cross-review, and neither
changes the remedy** `[cross-review 2026-08-16]`:

1. **The harm is prospective, not realized, and §3.5 already knew it.** No shipped pack pairs
   `perfect_tablebase` with `hold` — the only two declaring the mode are `mate-bishop-knight`
   and `trajectory-mate-bishop-knight`, both mating techniques whose roots are *won*
   (`design/research/maia-endgame-fidelity.md` §2.1), which §3.5 states plainly as *"No
   shipped pack is affected."* The paragraph above was written as though the drill it
   describes exists. It does not yet. The drawn arm is reachable today only **mid-run, after
   a learner error in a mate pack** — which §3.5's last paragraph correctly identifies as the
   single most likely thing to happen in such a pack, and which is why the remedy is a
   declaration rather than a refusal.
2. **The census is a counterfactual over a corpus that is mostly not this mode's domain.**
   §7's 507 positions come from 11 packs, **10 of which declare `human_common`**
   (`maia-endgame-fidelity.md` §2.1–2.2); the harness ran `perfect_tablebase`'s comparator
   over all of them. So the 2.6× is a measured property of **the shipped comparator**, not an
   observed rate of shipped `perfect_tablebase` selections — of which, in a drawn root, there
   have been none. This does not weaken the finding, because the mechanism is analytic rather
   than empirical: UCI strings sort by origin file, the drawn arm has no other term, and that
   holds at every position regardless of which pack supplied it. It does mean the honest
   magnitude is small and should be stated: **66 drawn roots, 7 capture-or-pawn picks against
   an expected 2.65 — about four excess simplifying replies in the entire measured corpus**,
   and zero of them in a shipped `hold` drill.

**So the case for the remedy is not magnitude, and §3.3 should be read as making the argument
it actually makes:** an ordering declared equal must not wear the appearance of a preference.
That argument is indifference-proof — it holds at four excess picks exactly as it would at
forty — and it is the argument the repo's own doctrine already runs on everywhere else.

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

**One consequence of that array the draft did not state** `[cross-review 2026-08-16]`.
`SelectionCandidate.rank` is written for every candidate from the `ordered` array
(`:637`), so under `orderingBasis: "none"` the record persists `rank: 1 … n` over a set the
mode has just declared unordered. A `rank` field is read as a ranking; a consumer that renders
"rank 1" beside a move has been handed a verdict by a mode that refused to make one — which
is §2.3's inadmissible case arriving through the back door. `orderingBasis` is exactly what
disambiguates it, so the field is the fix rather than a new problem, but the disambiguation
has to be **normative and not merely available**:

> Where `orderingBasis` is `"none"`, `candidates[].rank` is a **presentation order and not a
> ranking**. No surface may render it as a preference, an ordinal, or a "best/first" label,
> and no consumer may derive one from it. The neutral tiebreak's whole content is that the
> mode has no opinion about this order.

A5 is extended to test it.

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

**Three further surfaces the draft omitted, and they are what make the run-schema claim real**
`[cross-review 2026-08-16]`. The draft named only the TypeScript interface. A field added
there and nowhere else would be **silently dropped before it ever reached a record**, which is
the same *record* defect this RFC exists to fix:

1. **`schemas/drill_run.schema.json`, `$defs/opponentSelection`** (`:144-160`) is
   `"additionalProperties": false` over exactly `moveUci`, `policyModeApplied`, `candidates`,
   `engine`. `orderingBasis` must be added as an optional property with the three-member
   enum, and the document's `$id` moves `urn:chess-tabiya:schema:drill-run:0.16` →
   `:0.17`. **This is the change that earns the run lane** — an actual schema-document edit
   with an `$id` bump — and it is worth naming beside §5's pack claim, which has no such
   counterpart.
2. **`apps/server/src/rest.ts`'s selection parser** (`:255-282`) does not pass the object
   through; it **rebuilds it field by field** and drops anything it does not name. It must
   gain an optional `orderingBasis` arm, narrowed against the three-member vocabulary and
   rejected as `invalid("selection.orderingBasis is unsupported")` otherwise, in the same
   shape as the `policyModeApplied` narrowing directly above it.
3. **`apps/web/src/lib/api.ts`** carries the client mirror of the selection type and widens
   with the server type.

A12 is extended to assert the round trip end to end rather than the constant alone.

#### 3.5 The authoring signal, and why it is static and a warning

An authoring-time check that the root *is* drawn is **not implementable in the shipped
validator**: `validatePackDocument` is synchronous (`apps/server/src/pack-validation.ts:1247`) and every
existing tablebase-mode check
runs off `countFenPieces` alone (`apps/server/src/pack-validation.ts:1000-1005`); nothing in the
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
be a stronger claim than the measurement supports. The code is free-form and this was verified
rather than assumed `[cross-review 2026-08-16]`: `runtimeWarning(code: string, path: string,
message: string)` (`pack-validation.ts:149-151`) takes a bare `string`, `PackValidationIssue`
(`:57-63`) closes `severity` and `source` but deliberately leaves `code` open,
`pack-validation.ts` does not import `ServerErrorCode` at all, and no register enumerates
validation warning codes against a closed list. So no `ServerErrorCode` member is added and
`rest.ts`'s 422 mapping is untouched.

**One naming hazard, flagged rather than resolved** `[cross-review 2026-08-16]`. The
`PERFECT_TABLEBASE_*` prefix in `pack-validation.ts` currently denotes exactly one thing — an
**error** at `/opponentPolicy/mode` (`PERFECT_TABLEBASE_OUT_OF_RANGE`, `:1001`, sitting one
line from `PRACTICAL_RESISTANCE_OUT_OF_RANGE` at `:1004`, and *also* a `ServerErrorCode`
member at `errors.ts:17` mapped to an HTTP arm at `rest.ts:576`). This RFC adds a second
`PERFECT_TABLEBASE_*` code at the same pointer at **warning** severity and with no
`ServerErrorCode` twin, so the prefix stops predicting severity. The name is free — swept
across `apps/`, `packages/`, `schemas/` and every active and archived RFC, with zero
pre-existing occurrences — and the collision risk is nil; the cost is legibility only, and it
is accepted here rather than renamed, because the alternative prefixes predict severity no
better and the pointer is the thing a reader actually keys on.

**No shipped pack is affected:**
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
`apps/server/src/format-surface.test.ts:68-92` asserts key uniqueness, three named pointers,
and that `DECLARED_UNIMPLEMENTED_POLICY_MODES` round-trips — nothing that requires coverage
of the enum. **The register that exists to make the silent state hard to occupy is silent
about four of the seven declared opponent modes**, including the default one.

Re-verified at HEAD `790a4de` by cross-review: 8 rows, exactly three `/opponentPolicy/mode`
values, the four named above absent, and the test asserting nothing that would catch it. The
ledger already carries this as its own row — *"The register built to end the silent state is
itself silent about the default opponent"* — so §4 **closes an existing row rather than
opening one**, and the closeout should flip it.

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
| **Pack schema** | **NONE — 0.28 RELEASED by cross-review 2026-08-16.** `0.28 remains the next free lane and this RFC leaves it free.` | `FORMAT_DISPOSITIONS` gains **four** rows (§4) and the totality gate lands, unversioned. Reasoning below. |
| **Run schema** | **0.17** | `OpponentSelection.orderingBasis` (§3.4), the optional property on `$defs/opponentSelection` in `schemas/drill_run.schema.json`, and the `$id` bump `urn:chess-tabiya:schema:drill-run:0.16` → `:0.17`. Additive and optional; historical selections omit it and it is never inferred. **0.16 has already LANDED** — `DRILL_RUN_SCHEMA_VERSION` reads `"0.16"` at HEAD (`packages/schema/src/index.ts:1`) — so 0.17 is genuinely next, and no other active draft claims it (swept 2026-08-16 across all nine active drafts). |
| **Storage migration** | **position `STORAGE_VERSION + 1`** — **CONTESTED, see below** | Stamp-only: frozen run-schema literals `"0.16"` → `"0.17"`. No table, no index, no data rewrite — the same body as migrations 16–20. `STORAGE_VERSION` is **22** at `apps/server/src/storage.ts:407`; the **integer is assigned at landing**, never claimed here, and the migration body uses frozen literals rather than the moving constant. |
| **`/capabilities` payload** | **changed** | `policyProfiles.human_common.resistance` (§2.4c) and three `CAPABILITY_DISPOSITIONS` rows (§2.4a). Not a versioned register; client types widen with the server type. |

#### 5.1 The 0.28 ruling — **RELEASED**, and the draft's own two grounds are why

The draft flagged this as its weakest claim and asked cross-review to decide it, with the
instruction that a wrong answer means **released, not rebased**. Released. Both grounds fail
on inspection, and the register's own design says the opposite of what the draft read into it.

**Ground 1 — the `claim-backing` precedent does not exist.** The draft said *"`claim-backing`
set the precedent that a validator-and-register-only change claims a lane."* It did not.
`claim-backing` landed at `5a63225` and its diff is a **schema-document change**: 10 changed
lines in `schemas/drill_pack.schema.json` (the `claimBindings` key, `$defs/feedbackClaim`
closed), a new `schemas/principle_entry.schema.json`, `packages/schema/src/drill-pack/types.ts`,
and a new `PRINCIPLE_ENTRY_SCHEMA_VERSION`. It **never touched
`packages/schema/src/drill-pack/dispositions.ts` at all.** The cited precedent is not merely
mis-described; it is the wrong commit for the claim.

**And the precedent runs the other way, unanimously.** Every one of the pack lanes in
`rfc/README.md`'s register — 0.3 through 0.27 — carries a `$defs`, enum, or property change to
the schema document. **Not one lane in the repo's history was claimed for a register-only
change.** The draft proposed to be the first, on a precedent that says the reverse.

**Ground 2 — "schema-version fact" is a claim about scope, not about versioning.**
`format-surface:287-290` says the register *"is a fact **about** that schema version and is
deliberately absent from `/capabilities`, whose values describe the current deployment."* That
sentence answers *where the register is published and what it describes* — it distinguishes a
format fact from a deployment fact. It does not say that **mutating** the register is a
schema-version event, and the register's own shape shows it is not:

- `FormatDisposition` carries **`removedAt`** and **no `addedAt`**. The one row with a version
  stamp is the `retired` one (`error:SIMULATE_BUDGET_EXCEEDED`, `removedAt: "0.25"`), and it
  is stamped because a *declaration was removed from the schema document* at 0.25 — a real
  format event, recorded in-row. The register handles version-scoped events with a **field**,
  not with the `$id`. Adding a `reached` row is not such an event and the type has no place to
  record it as one.
- The four rows §4 adds are **`reached` rows describing behaviour that has shipped since long
  before 0.27**. They change what the format *says about itself*; they change nothing about
  what a pack may contain, what validates, or how anything executes.

**And the cost of being wrong is asymmetric, which settles the close call.** The draft's own
body concedes: *"No `$defs` are touched, no committed pack bytes change, no digests move, and
no pack migration exists."* A `urn:chess-tabiya:schema:drill-pack:0.28` whose documents are
**byte-identical in every respect** to 0.27's is a version number that signals nothing — and a
version that can mean nothing is a version that has stopped being evidence, which is precisely
the harm the pack register was instituted to prevent. Against that: releasing the lane costs
this RFC nothing at all, and unblocks two sibling drafts (`measurement-records` and
`dead-vocabulary`) that both explicitly record 0.28 as next-free and leave it so.

**Contrast, and it is the useful one.** The run lane is claimed on exactly what the pack lane
lacks: `$defs/opponentSelection` is `additionalProperties: false`, so `orderingBasis` cannot
exist without editing `schemas/drill_run.schema.json` and moving its `$id` (§3.4). One lane has
a schema-document edit and takes a version; the other has none and does not. **The register
rows land unversioned**, in the same way `CAPABILITY_DISPOSITIONS` rows do.

**`rfc/README.md` is single-writer and this RFC does not edit it.** Its Active row and its
pack register are requested to read that `opponent-contracts` claims **no pack lane** and that
**0.28 remains free**.

#### 5.2 Two contentions the draft did not name

1. **The migration position is contested with `teacher-surface`.** Both drafts claim
   `STORAGE_VERSION + 1`, and `rfc/README.md`'s 2026-08-16 amendment makes the **position**,
   not the integer, the shared single-writer resource — so "the integer is assigned at
   landing" does not dissolve the contest, it *is* the contest. `teacher-surface` is listed
   above this RFC in the Active table and `rfc/README.md`'s migration-22 row already records
   that it *"remains unlanded and therefore takes the next contiguous number at its turn."*
   **This RFC yields the position and takes the next one after `teacher-surface`**, or
   renegotiates in the register — never by renumbering unilaterally. Nothing here depends on
   ordering: the migration is stamp-only and its body is frozen literals. (Noted in passing:
   `teacher-surface` states `STORAGE_VERSION` is 21; it is **22**.)
2. **`apps/server/src/opponent-selector.ts` is shared with `engine-leverage`, which is
   already `implementing`.** Its own contention table lists the file. The targets are
   textually disjoint — this RFC edits `#perfectTablebase` (`:625-641`, comparator at `:636`),
   `engine-leverage` edits `#maia`, `resetSearchState` and `candidateLines` — but this RFC
   **rebases onto a moved file** and should say so rather than discover it. A third draft
   (`dead-vocabulary`) reads the same file's `:712-719` as a finding without editing it.

The loudest remaining claim is the **run-schema claim**, and after the pack lane is released it
is the only versioned one this RFC makes.

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
  is written so that adding a per-move resistance field fails it. **Extended**
  `[cross-review 2026-08-16]`: the same scan asserts that no surface renders
  `candidates[].rank` as a preference, ordinal, or "best" label where `orderingBasis` is
  `"none"` (§3.3). The client is `apps/web/src/` and the scan is feasible there.
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
  **Its power is stated rather than assumed** `[cross-review 2026-08-16]`: at n = 66 drawn
  roots the Wilson interval covers 4.02% for **k ≤ 5** and excludes it from **k ≥ 6**, so A9
  fails only if the residual enrichment stays above **≈ 1.9×** (the shipped value is 2.64×,
  k = 7). Two consequences, both to be carried rather than hidden. **It cannot distinguish a
  complete fix from a residual 1.8× bias** — 66 roots is the whole corpus and cannot be
  enlarged without new packs. And under a *correct* implementation it still fails about
  **4.9%** of the time (P(k ≥ 6 | p = 0.0402, n = 66) = 0.049), so a single failure is
  grounds to re-run, not to reject; two independent failures are the real signal.
- A9b. **The deterministic complement, which has no sample-size limit and is the primary
  guard** `[cross-review 2026-08-16]`. A9's weakness is that it tests a 66-sample statistic
  when the property is **analytic**: `sha256(fen\0uci)` is by construction independent of the
  move's type, origin and destination, so the argmin over a preserving set is uniform over
  that set. Assert it directly and at arbitrary scale: over ≥ 10,000 synthetic
  (position, preserving-set) pairs, the selected move's index in the set's **lexicographic**
  order is uniform (χ² over index buckets, and no bucket materially over-represented), and the
  capture-or-pawn selection rate equals the set's own capture-or-pawn fraction. A9 then
  corroborates on the real corpus rather than carrying the claim alone.
- A10. **The won-root enrichment must not move.** The same re-run must leave the winning row
  at **1.57×** within its interval. If it moves materially, the winning-row enrichment was
  partly lexicographic rather than wholly a DTZ effect, and §3.2's reading of the census is
  wrong — this criterion exists to be able to fail.
  **And its ability to fail is itself a precondition that must be reported, not assumed**
  `[cross-review 2026-08-16]`. A10 can only fail where the new tiebreak actually acts on a won
  root — i.e. where the argmin-|DTZ| set has **more than one member**. If won-root |DTZ| ties
  are rare in this corpus, A10 passes without testing anything and the draft's *"exists to be
  able to fail"* is not earned. **Required alongside A10:** the re-run reports `t` = the number
  of the 218 won roots whose minimum-|DTZ| preserving set has ≥ 2 members. If `t` is small
  enough that the winning row could not move outside its interval regardless of the tiebreak,
  A10 is **declared vacuous in the record** and carries no evidential weight — which is a
  finding about the census, not a pass.
- A11. `PERFECT_TABLEBASE_UNORDERED_OBJECTIVE` fires for a `perfect_tablebase` + `hold` pack,
  does **not** fire for `save`, `resist`, or `win`, and all committed packs still validate
  with zero new errors and zero new warnings.
- A12. Run schema reads `0.17` in **both** `DRILL_RUN_SCHEMA_VERSION` and
  `schemas/drill_run.schema.json`'s `$id`; the stamp-only migration is idempotent; historical
  selections read back with `orderingBasis` absent and nothing infers it.
- A13. **The field survives the wire, and this criterion exists because it currently would
  not** `[cross-review 2026-08-16]`. A selection carrying `orderingBasis: "none"` round-trips
  server → REST → client → persistence → read-back with the value intact. Written to fail
  against the tree as it stands: `$defs/opponentSelection` is `additionalProperties: false`
  and `rest.ts`'s parser rebuilds the object field by field (§3.4), so a field added only to
  `packages/runtime/src/types.ts` is dropped silently — the exact *record* defect this RFC
  is written to fix, turned on itself.
- A14. **No pack-schema version moves.** `DRILL_PACK_SCHEMA_VERSION` and
  `schemas/drill_pack.schema.json`'s `$id` are byte-identical before and after this RFC lands,
  and the four new `FORMAT_DISPOSITIONS` rows change no committed pack, no digest, and no
  validation outcome (§5.1).

## Open questions

1. ~~**Is the pack-schema lane claim right at all?**~~ **RESOLVED 2026-08-16 by cross-review:
   no lane. 0.28 is RELEASED and left free.** The `claim-backing` precedent the draft cited
   does not exist — that RFC's landed diff is a schema-document change and it never touched
   `dispositions.ts` — and every pack lane in the register's history carries a `$defs`, enum,
   or property change, so the precedent runs unanimously the other way. *"Schema-version
   fact"* scopes what the register **describes**, not what **mutating** it costs; the type's
   `removedAt`-without-`addedAt` asymmetry is the register saying so in its own shape. Full
   reasoning and the requested `rfc/README.md` wording: **§5.1**.
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
   objective and this RFC does not scope it. **The ledger row it needs already exists**
   `[cross-review 2026-08-16]` — *"`practical_resistance` truncates to the four
   lexicographically-first preserving moves"* — filed 2026-08-16 and crediting this draft for
   finding it. The draft's cross-reference to a `§reported rows` section was dangling — no
   such section existed; the rows now live in the **`Ledger rows this RFC references and does
   not own`** header field, where this one is listed as already-open rather than
   to-be-opened. Noted for whoever takes it: the same file is currently being edited by
   `engine-leverage` (implementing), whose own gap 6 names the identical `.slice(0, 4)`.
7. **Does `orderingBasis` deserve a client surface, or is the run record enough?** §3.4
   specifies the record. Whether the drill client should *show* "no ordering basis — the
   opponent's reply here is one of N equally drawing moves" is a `design/05` question and is
   the owner's, not this RFC's.

## Changelog

- 2026-08-16: created.
- 2026-08-16: **adversarial cross-review** (claude, agent — not the author). Every figure
  re-derived and every code reference relocated by symbol at HEAD `790a4de`. Fixed in place:

  **The ruling asked for.** Pack **0.28 RELEASED** (§5.1, open question 1). The
  `claim-backing` precedent the draft rested on **does not exist** — that RFC's landed diff
  (`5a63225`) is a schema-document change and never touched `dispositions.ts` — and every pack
  lane in the register, 0.3 through 0.27, carries a `$defs`/enum/property change, so the
  precedent runs unanimously the other way. *"Schema-version fact"* was read as *"mutating it is a version event"*; the
  type's `removedAt`-without-`addedAt` asymmetry says otherwise. Lane left free for
  `measurement-records` and `dead-vocabulary`, which both record it as free.

  **Evidence that landed after drafting, folded in.** §M2's D333 conditional had already
  fired: `design/research/maia-band-outcome-transfer.md` (16,660 games) finds the band **does**
  move results (0.29 corpus / 0.40 full material) but that the effect tracks **pieces
  remaining, not phase**, collapsing to **≈0.07 below ten pieces** — the exact regime every
  position in §2's corpus occupies. `bandConditioned: false` therefore gains a **game-level
  cause** and is **stronger** than drafted; the self-imposed re-measurement obligation is
  discharged rather than deferred, and the `reason` string now says so.

  **Overstatements corrected.** (a) §2.4(c)'s *"`human_common` applies no value"* is false —
  it applies the band and records `eloApplied`; narrowed to the true claim, that *resistance
  specifically* is measured rather than requested. (b) §3.2's product-consequence paragraph
  was written as though a `hold` + `perfect_tablebase` pack ships; none does, as §3.5 itself
  states, and §7's census is a **counterfactual** over a corpus where 10 of 11 packs declare
  `human_common`. Honest magnitude now stated (7 picks against 2.65 expected over 66 drawn
  roots ≈ four excess simplifying replies, none in a shipped drill), with the argument
  relocated to where it is actually sound: an order declared equal must not wear the
  appearance of a preference. (c) §5's *"five rows"* double-counted the `human_common` row;
  it is **four**.

  **Specification gaps closed.** §3.4 named only the TS interface; `orderingBasis` also
  requires `schemas/drill_run.schema.json` (`$defs/opponentSelection` is
  `additionalProperties: false`, `$id` → `:0.17`), `rest.ts`'s parser (which **rebuilds** the
  object and would drop the field silently — the same *record* defect this RFC exists to fix),
  and the `apps/web` mirror. New **A13** is written to fail against the tree as it stands.
  §3.3 adds a normative rule that `candidates[].rank` under `orderingBasis: "none"` is a
  presentation order and not a ranking, with A5 extended to guard it.

  **Acceptance criteria strengthened.** **A9**'s power is now stated: at n = 66 it fails only
  above ≈1.9× residual enrichment and mis-fails ≈4.9% of the time under a correct fix, so it
  cannot carry the claim alone — new **A9b** asserts the analytic neutrality of
  `sha256(fen\0uci)` at arbitrary scale. **A10**'s *"exists to be able to fail"* is not earned
  without a precondition, now required: report `t`, the count of won roots with ≥ 2 members at
  minimum |DTZ|, and declare A10 vacuous if it is small. New **A14** pins the released pack
  lane.

  **Six line references corrected** against the tree: `PERFECT_TABLEBASE_OUT_OF_RANGE` /
  `PRACTICAL_RESISTANCE_OUT_OF_RANGE` `930-935`/`933-935` → **`1000-1005`** (three sites);
  `runtimeWarning` `133-135` → **`149-151`**; the *record*-obligation quote
  `format-surface.md:177` → **`:187`**; `format-surface.test.ts:66-88` → **`:68-92`**.

  **Contentions the draft did not name** (§5.2): the migration position is claimed by
  `teacher-surface` too — this RFC yields; and `opponent-selector.ts` is shared with
  `engine-leverage`, already implementing.

  **Verified sound and left alone:** `grounding-pair` §2c quoted verbatim and correct; the
  comparator at `:636` and every probe site (`:626,647,671`); all three Wilson intervals
  recomputed exact (2.638× / 1.5716× / 2.0997×; drawn-root exact binomial p = 0.0166, so the
  interval genuinely excludes 4.02%); `OBJECTIVE_ASSESSMENT_SETS` and the `save`/`resist`
  narrowing; `practical_resistance`'s two refusal codes at `:712-714` and `:715-717`;
  `validatePackDocument` synchronous; `runtimeWarning`'s code free-form; the eight-row
  register state and the four missing modes; `STORAGE_VERSION` = 22; and all six proposed
  identifiers swept collision-free across `apps/`, `packages/`, `schemas/` and every active
  and archived RFC. Template compliance: complete.
