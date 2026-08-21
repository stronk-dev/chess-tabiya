# RFC: Measurement records — a number a machine produced must say so, and say it in a form that can be re-derived

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Design refs:** `design/04-content-architecture.md` §8 (production model — *"anti-Caro Advance
  (opening), **Carlsbad minority attack (middlegame)**, 4v3 rook endings (endgame)"*, the three
  named exemplars, one of which is **D157**'s subject); `design/04-content-architecture.md` §0
  (the shared shape library packs reference, which is the document type this RFC gives a record
  surface to); `design/03-product-breadth.md` **B4** (the evidence-and-explanation gate) —
  **informed, not closed**: this RFC governs the provenance of numbers, not what a learner is shown.
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §"Exploration
  gate opened by owner ruling 2026-08-12", `:93-100`). This is a **defect RFC against a shipped
  system plus the minimum additive format to close the defect**. It opens no product surface, ships
  no learner-visible behaviour, and creates no new instrument.
- **Ledger rows this RFC owns**, cited by **title** because the ledger's line numbers moved twice
  while this was drafted:
  - *"**Measured claims are prose, so staleness has no detector**"* (**D368 🐞**) — closed by §3–§6.
  - *"**A shape entry has nowhere to record why its trigger says what it says**"* (**D103 🐞**) —
    closed by §5b. **Verified unowned:** no active RFC mentions `D103` or `triggerNote`.
  - *"**`carlsbad-minority-attack` … carried no corpus evidence of any kind**"* (**D157 🐞**) —
    made *measurable* by §6c; the graduation **policy** is routed to `rfc/pack-graduation.md`, not
    taken here (§9).
  - *"**The 100-game abstention floor sits exactly where timing windows live**"* (**D151 🐞**) —
    made *expressible* by §4d's `abstained` disposition; the authoring-time explorer warning is
    scoped out and routed (§9).
  - *"**The D126 row's illustrative split is a manufactured chess number sitting in the ledger next
    to a real game count**"* (**D154 🐞**) / *"**Claude fabricated a result split inside the ruling
    that admits result splits**"* (**D161**) — the *format* gap is closed by §4c's `illustrative`
    span form. **Process documents remain out of any lint's reach and this RFC says so** rather than
    implying otherwise (§9).
- **Ledger rows this RFC opens** (law 4): **D376**–**D380**, listed in §12. No id outside that block
  was minted. **They are landed in `design/BACKLOG.md` as of cross-review 2026-08-16** (rows D376–D380
  sit between D381 and D373); §12 is now the RFC-side copy of a landed block, not a request.
- **Depends on:** `rfc/archive/claim-backing.md` (**status `implemented 2026-08-16`, archived; the
  mechanism this RFC extends is already in the tree** — `apps/server/src/sourcing/claim-binding.ts`,
  `CLAIM_ASSERTION_KINDS`, `ClaimBinding`, `validateClaimBindings`; pack schema **0.26 landed and is
  recorded as implemented in the register**, see §0's correction — *corrected at cross-review
  2026-08-16: the draft said `implementing` and `rfc/claim-backing.md`, both stale*);
  `rfc/archive/opening-evidence-path.md` §1a (the grounding distinction this RFC extends by one
  species); `rfc/archive/content-sourcing-foundation.md` §3.3 (the human-only list and the crossing
  rule).
- **Parent / amends:** amends `schemas/shape_entry.schema.json`,
  `apps/server/src/sourcing/claim-binding.ts`, `apps/server/src/expression-census.ts`,
  `packages/schema/src/index.ts`, and the `Makefile`.
- **Supersedes / superseded by:** —
- **Planning:** `planning/measurement-records/` (once implementing)

**Reading note on locators.** Every claim below is anchored to a **symbol name, a code literal, or a
JSON pointer** — never to a line number. `design/BACKLOG.md`'s rows moved under this draft and the
RFC register moved twice today. A reviewer should grep the literal.

**Every corpus number in this document was produced first-hand** by running
`make expression-census OUT=…` against the working tree on 2026-08-16 and querying the resulting
`tabiya.authoring.census.v1` report, not copied from the ledger rows that motivated the RFC. Where a
number came from a ledger row rather than from that run, it is labelled as the row's.
**One exception, found at cross-review and stated rather than quietly carried:** the `5` in
`fianchetto-g7`'s *"95 / 10 / 5"* (§Motivation 1) is a **sub-expression probe**, not a census subject
— the census report has no site for *"g7–d4 clear"*, and the `10` is a sum over two of the ten packs
in `coverage.corpus.packs` rather than a value the report returns. Both are reproduced from
`fianchetto-g7`'s own plan note. **That is not a citation defect, it is the RFC's own coverage gap
made visible**, and §3a-note plus §Open questions 2 now carry it: the `census.*` family cannot
express a reading about part of an expression.

```tabiya-claims
shape-entry-schema | lane 0.4 | measurements property; $defs/measurementRecord; $defs/measurementSpan; $defs/measurementDisposition
```

---

## Summary

Four ledger rows describe one defect: **a number in shipped content has three states — measured,
invented, and absent — and the format cannot tell them apart, so nothing can tell when one goes
false.** Nine shape entries and two packs carry readings shaped *"N of 694"* in free-text
`provenance.sources[]` strings. The corpus grew 43→56 packs and 694→827 positions in a week, four of
those readings became materially false, and the instrument that produced every one of them ran to
completion and exited **0** while they were false.

The repo already has the correct mechanism and it is shipped: `claim-backing`'s **`ClaimBinding`**
binds a numeral *span* in an author's sentence to a **typed assertion** that is recomputed from an
instrument, and refuses the sentence when the two disagree (`CLAIM_SPAN_CONTRADICTED`,
`CLAIM_TEXT_DRIFTED`, `CLAIM_ASSERTION_UNDECLARED`, all live in
`apps/server/src/sourcing/claim-binding.ts`). It does not reach these eleven claims for three
reasons, each of which this RFC removes: **shape entries have no binding surface at all** (root
`additionalProperties: false`, which is also what blocks D103); **the repository's own corpus is not
a registered instrument** (`CLAIM_ASSERTION_KINDS` has `tablebase.*`, `engine.*` and `explorer.*` and
nothing for a self-census); and **`sourcing-check` cannot evaluate an assertion whose evidence is the
corpus**, because it holds one pack at a time.

So this RFC invents no vocabulary. It extends the shipped binding to a **second document type**
(shape entries, §5) and a **second instrument species** (the corpus census, §3–§4), states the
grounding rule that species obeys (§2), and puts the check where the corpus already is — inside
`make expression-census`, in a new mode whose exit code is governed **only** by record-versus-reading
disagreement, never by a chess-shaped fact (§6).

**Register claims, stated loudly and repeated in §0: shape-entry schema 0.4, and nothing else.** No
pack-schema lane — **0.28 stays free**. No run-schema change. No migration; `STORAGE_VERSION` stays
**22**. No new `EvidenceKind`. No new evidence record. No content is rewritten by the landing commit.

---

## Motivation

### 1. The four readings that went false, and the pass that was supposed to fix them

The ledger row **D368** records the failure. Re-derived first-hand from the census run today, the
corpus reads:

```
corpus: {"packs":56,"positions":827,"shapeEntries":25,"transitions":771,
         "roots":["content/drafts","content/packs"],
         "fixturePacks":["immediate-guard-browser","line-boundary-browser","outcome-hold-browser",
                         "outcome-resist-browser","stated-reasoning-browser","trajectory-legs-browser"],
         "packsWithoutSpine":["trajectory-legs-browser"]}
```

Eleven shape entries carry a census reading in prose. A content wave on 2026-08-16 ("wave F") swept
them by hand and rewrote nine. **The sweep did not converge, and the reason is the mechanism's
indictment rather than the author's:**

| Entry, `content/shapes/` | Recorded reading | Instrument reads today | Wave F |
|---|---|---|---|
| `doubled-c-pawns` | trigger 8 of 791 | **8 of 827** | corrected |
| `iqp-black` | trigger 7 of 791 | **7 of 827** | corrected |
| `maroczy-bind` | trigger 10 of 791 | **10 of 827** | corrected |
| `pawn-opposition-key-squares` | 33 of 694 | **33 of 827** | corrected |
| `hanging-pawns` | 0 of 694 | **0 of 827** | corrected |
| `knight-vs-bishop` | 0 of 694 | **0 of 827** | corrected |
| `up-an-exchange` | 0 of 694 | **0 of 827** | corrected |
| `vancura` | 0 of 694 | **0 of 827** | corrected |
| `open-centre` | 1 of 694 | **16 of 827**, four packs | corrected |
| `fianchetto-g7` | trigger 44 / mirror 0 / g7–d4 0, of 694 | **95 / 10 / 5** of 827 | corrected |
| **`kid-chain-arrangement`** | *"fires on exactly **14** nodes"* of 487, 37 packs | **24 of 827**, three packs | **MISSED** |
| **`london-wedge`** | *"fires on exactly **14** nodes"* of 487, 37 packs | **19 of 827**, three packs | **MISSED** |

**Two shape entries carry a reading that is false in the working tree right now**, and both were
missed for a mechanical reason: the sweep grepped for the denominator it remembered — `694` — and
these two were measured a generation earlier, against **487 positions across 37 packs**. Their
`provenance.sources[1]` strings both open *"MECHANICALLY DERIVED (this session) with the repo's own
evaluator"* and both end *"and nowhere else in the corpus"*, which at 827 positions is false for
both: `kid-chain-arrangement` fires in **three** packs (`anti-kid-classical-white` 7,
`kid-classical-black` 7, `kid-mar-del-plata-white` 10) where the prose names two; `london-wedge`
fires in **three** (`anti-london-black` 7, `london-system-white` 7, `london-wedge-black-counterplay`
5) where the prose names two.

**A manual re-measurement pass is keyed on the denominator the sweeper happens to remember. It cannot
converge, and it did not.** That is the argument for a lint rule, and it is measured rather than
asserted.

### 2. The nine corrections tell you what the check must and must not do

Split the twelve rows by *what actually changed*:

- **Eight** — `doubled-c-pawns`, `iqp-black`, `maroczy-bind`, `pawn-opposition-key-squares`,
  `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura` — had an **unchanged numerator**
  on every subject reading they carry. (*The draft said "Six" over a list of eight and a
  parenthetical that did not parse; corrected at cross-review, where the split was independently
  re-derived from `aee7c64` — the commit before wave F's sweep `d68ce9d` — against today's report.
  The count that matters is eight, and it is what makes the ratio 2:1.*)
  Only the denominator moved. Wave F edited
  those files by hand to change `694`→`827` and `791`→`827`, and every one of those edits was
  bookkeeping no human needed to think about.
- **Four** — `open-centre`, `fianchetto-g7`, `kid-chain-arrangement`, `london-wedge` — had a
  **changed numerator**, and in every one of the four the surrounding prose was a *proposition built
  on the number* that had to be rewritten by a person:
  - `open-centre`: *"the single trajectory-qgd-exchange-minority spine position"* → sixteen positions
    in four packs.
  - `fianchetto-g7`: *"the arm D76 called 'from the wrong side of the board'"* was justified by the
    mirror's zero; the mirror now fires 10.
  - the two missed entries: *"and nowhere else in the corpus"*.

**This is the whole design, derived rather than chosen.** A check that fired on every corpus change
would have produced **eight false alarms for four true ones**. A check that fires only when the
*subject's own reading* moves produces exactly four, and each of the four is a sentence a person must
rewrite. §4e turns that split into the record's own structure.

### 3. The corruption that a silent recompute would have caused

`doubled-c-pawns` reached the state D368 names — *"three entries declare themselves orphans"* — by a
route worth reading. Its `provenance.sources[2]` still says *"its trigger fires on **0** of the 694
authored spine positions … It stands alone deliberately"*, and `sources[3]` opens
*"D44 ORPHAN STATUS **SUPERSEDED** 2026-08-15"* and closes *"both numerators are unchanged — trigger
**8**, all 8 in that pack … only the denominator moved, 791 → 827"* (verbatim at HEAD; the draft
paraphrased this inside quotation marks and the paraphrase is corrected here). Had a tool silently
rewritten the numeral in `sources[2]` from `0` to `8`, the sentence would read *"its trigger fires on
8 of 827 … It stands alone deliberately"* — the number correct, the proposition inverted, and **the
defect now invisible instead of merely wrong**.

**And this same pair exposes a gap in §4b's `disposition` enum, found at cross-review.**
`sources[2]` is a *deliberately preserved past reading*, explicitly marked SUPERSEDED and kept
because D368 asked for the history. Its numerator **has** moved — 0 → 8 — so if an author binds it
with `census.fires@v1` it is a **permanent subject-class error** that no rewrite can clear, and the
only escapes the format offers are to mark a real past measurement `authored` (a lie about who
produced it) or `illustrative` (a lie about whether it was measured). `iqp-black`'s `sources[1]` and
`maroczy-bind`'s `sources[2]` are the same shape. §4d adds a third disposition for exactly this;
**the eight-versus-four split in §2 is counted on live readings and holds only because superseded
readings are not bound as live assertions**, which the format must therefore be able to say.

`fianchetto-g7`'s `plans[0].success.note` shows the second-order form: its correction says *"the
2026-08-15 reading **below it**"* and there is no such paragraph in the file. **Prose corrections
corrupt their own cross-references.**

So: **automatic rewriting is admissible only where no human wrote a sentence around the number.** §4e
makes that a property of the assertion kind rather than a judgement call.

### 4. Why the mechanism that would catch this does not reach

`validateClaimBindings` (`apps/server/src/sourcing/claim-binding.ts`) already refuses, today, on
packs:

| Shipped code | What it catches |
|---|---|
| `CLAIM_SPAN_CONTRADICTED` | *"span does not equal assertion result"* — **exactly D368's lint rule** |
| `CLAIM_TEXT_DRIFTED` | the sentence was edited after the numbers were bound |
| `CLAIM_ASSERTION_UNDECLARED` | a machine-shaped token in the prose that no span declares |
| `CLAIM_READING_UNATTRIBUTED` | *"a rate cannot be routed as authored judgement"* — **D154's class** |
| `CLAIM_POINTER_REBOUND` | the pointer no longer resolves to the declared claim |

Three walls stop it:

1. **`schemas/shape_entry.schema.json` is `additionalProperties: false` at its root**, with exactly
   nine properties (`id`, `version`, `name`, `phases`, `trigger`, `plans`, `watch`,
   `typicalMistakes`, `provenance`). `$defs/provenance` is *also* closed, on exactly
   `{licence, sources, attribution}`. **There is no field in a shape entry that can hold a record**,
   which is why eleven measured readings are stuffed into `provenance.sources[]`, a source list. It
   is the same wall D103 hit: *"the wave tried a `triggerNote` and the shape-entry schema rejected
   it."*
2. **`CLAIM_ASSERTION_KINDS` is a closed fifteen-member frozen array** with `tablebase.*`,
   `engine.*` and `explorer.*` families. **The repository's own corpus is not an instrument in it.**
   `evaluate` refuses anything else with `CLAIM_ASSERTION_UNRECORDED`.
3. **`validateClaimBindings(pack, ledger, issues)` is per-pack.** Every shipped assertion resolves
   against a record in *this pack's* ledger. A census reading is a fact about **all 56 packs at
   once**, and no caller ever holds more than one. The callers are exactly two and **neither is
   `verify-draft`** (corrected at cross-review): `apps/server/src/sourcing/check.ts:198`
   (`sourcing-check`) and `apps/server/src/pack-registry.ts:266` — **the runtime registry**, which
   feeds `claimBackings` onto `PackRecord`. §6a's deferral clause therefore governs a runtime path,
   not only an authoring one.

### 5. D103 is the same defect with the clock running the other way

**Verified first-hand:** `content/shapes/rook-4v3-same-side.json` is at version `0.1.2` and its
`provenance.sources` has exactly two entries — *"Extracted from
content/drafts/rook-4v3-same-side.json."* and *"UNGROUNDED: strategic claims inherit Pack C's
authored-assessment limitations."* Neither mentions the trigger narrowing. That narrowing landed as
`41afe00` and **D75's own closure text is itself an unrecorded measured claim** — *"the trigger fires
24/827, all inside `rook-4v3-same-side-hold`"* — sitting in `design/BACKLOG.md` as prose. Confirmed
against today's run: **24 of 827**, in `rook-4v3-same-side-hold` only.

D368 is *"the corpus moved under a fixed claim"*. D103 is *"the claim moved under a fixed corpus"*.
Both are the same missing object: **a record that names the subject it measured**, so that a change
to either side announces itself. A free-text `triggerNote` closes neither — it goes stale silently in
both directions, which is precisely what D368 measured happening to eleven notes that were, in every
other respect, exemplary.

### Scope boundary

**In scope:** the measurement-record shape; a `census.*` assertion family; a binding surface on shape
entries; the refresh/refuse split; the check's home, mode, severity and gate membership; the
day-one blast radius, measured.

**Out of scope, explicitly:** any change to what a **learner** sees — no runtime surface, no rendering
rule, no `evidenceTypes` semantics. Any change to `tablebase.*` / `engine.*` / `explorer.*`
assertions, to `EVIDENCE_KINDS`, to the evidence ledger's schema, to `verify-draft`, or to
`assessmentGrounding`. Any **graduation policy** (D157) — routed to `rfc/pack-graduation.md` in §9.
Any **explorer-side authoring warning** (D151) — routed in §9. Any lint over **Markdown process
documents** (D154/D161) — §9 states plainly that this RFC does not reach them and explains why.
Extending `expression-census` **as a report** — that is `rfc/dead-vocabulary.md`'s (§10).

---

## Specification

### §0. Register claims

| Register | Claim | Detail |
|---|---|---|
| **Shape-entry schema** | **0.4** | `urn:chess-tabiya:schema:shape-entry:0.3` → `:0.4`; `SHAPE_ENTRY_SCHEMA_VERSION` (`packages/schema/src/index.ts`, reads `"0.3"`) and the pin in `packages/schema/src/shape-entry.test.ts:32` move with it. **One additive optional top-level property, `measurements`, plus three `$defs` — `measurementRecord`, `measurementSpan`, `censusAssertion`** (§4b, §4c, §3d). |
| **Pack schema** | **NONE** | `DRILL_PACK_SCHEMA_VERSION` reads **`0.27`** in the tree (`pack-graduation` landed; see fact 1 below). **0.28 remains the next free lane and this RFC leaves it free.** |
| **Run schema** | **NONE** | Nothing is persisted. No event, no event field, no vocabulary value. |
| **Migration** | **NONE** | `STORAGE_VERSION` reads **22** (`apps/server/src/storage.ts`, `export const STORAGE_VERSION = 22`). Untouched. If a later revision needs one it takes `STORAGE_VERSION + 1` **at landing**, per the register's standing rule; it needs none. |
| **`EvidenceKind`** | **NONE** | `EVIDENCE_KINDS` is untouched at seven members. **No record is written by anything here** (§4a explains why a census reading is not a record). |
| **Ledger schema** | **NONE** | `tabiya.sourcing.evidence.v1` is unchanged. `claimBindings` is read, never reshaped. |
| **`CLAIM_ASSERTION_KINDS`** | **+6 members** | A **code-level frozen array**, not a versioned resource — the same standing that `rfc/archive/opening-evidence-path.md` §0 gives `EVIDENCE_KINDS`. §3b. |
| **Refusal codes** | **+8 new, 7 reused** | §7 carries the register and its collision sweep. **Sweep re-run at cross-review 2026-08-16 across `apps/`, `packages/`, `schemas/`, `rfc/`, `docs/`, `content/`, `design/`, `planning/` and `tools/`, excluding this file and `apps/server/dist/`: all seven new literals, and `measurementRecord` / `measurementSpan` / `censusAssertion`, occur **zero** times**, and no `census.*` assertion kind exists in `CLAIM_ASSERTION_KINDS` (verified: a frozen **15**-member array of `tablebase.*` / `engine.*` / `explorer.*` only). |
| **`SourcingIssue.severity`** | **+1 member**, `"info"` | `apps/server/src/sourcing/types.ts` declares `severity: "error" \| "warning"`. `CENSUS_ASSERTION_DEFERRED` (§6a) is **info**, so the union widens by one. **Added at cross-review — the draft asserted an info severity the shipped type cannot hold.** The alternative, emitting it as a `warning`, is refused: `sourcing-check` and the runtime registry would then warn on every correct census binding, which is the failure §6a exists to prevent. Every existing consumer switches on `"error"` and treats the rest as non-fatal, so widening is additive. |
| **Census report schema** | **`tabiya.authoring.census.v1` unchanged in default mode** | §6b adds a *second* top-level key only in the new `--check` mode; the default report is byte-identical. |
| **Makefile** | **+1 target**, `census-check` | `verify` gains it. §6d treats the shipped test that pins `verify` free of `expression-census`. |

**Three register facts a reviewer should re-derive rather than trust. The draft's own version of this
block was two lanes stale within a day, which is the best available evidence for the instruction:**

1. `packages/schema/src/index.ts` reads **`DRILL_PACK_SCHEMA_VERSION = "0.27"`** and
   `schemas/drill_pack.schema.json`'s `$id` reads **`urn:chess-tabiya:schema:drill-pack:0.27`**.
   **Both `claim-backing`'s 0.26 and `pack-graduation`'s 0.27 have landed**, and `rfc/README.md`
   records both as *implemented 2026-08-16* against `archive/` paths. *(The draft said 0.26 in the
   tree, 0.27 unlanded, and the README stale — all three false at cross-review; the conclusion below
   is unaffected.)* **0.28 free** — the register's sentinel row *"0.28 is the next free pack lane"*
   still stands, `dead-vocabulary` §6 and `teacher-surface` §10 leave it free, and
   **`opponent-contracts` — which the Active table shows claiming 0.28 — has `RELEASED` that claim**
   at its own header, so the lane is genuinely open rather than merely unrecorded.
2. **No active RFC claims a shape-entry schema version.** `dead-vocabulary` records
   *"Shape-entry schema | **NONE**"*; `pack-graduation` records *"**Shape-entry schema: nothing.**"*;
   of the remaining seven only `engine-leverage` names the file at all, and it names it as a **file
   searched for a `dtz` count**, not as an amendment target (verified line by line at cross-review).
   **0.4 collides with nothing**, and `SHAPE_ENTRY_SCHEMA_VERSION` reads `"0.3"`.
   `vocabulary-wiring`'s `plan_signature` leaf *did* land inside `schemas/shape_entry.schema.json`
   without a shape-entry register row — filed as **D376** (§12) so the next drafter is not misled by
   the register's silence.
3. **This RFC does not edit `rfc/README.md`.** The register rows it requests are in §11; the file's
   single writer lands them. **Its Active row has already been landed by that writer** — §11 is
   updated to reconcile rather than re-request.

**Corpus impact of the schema bump: zero.** `measurements` is optional and absent from all 25 entries
in `content/shapes/`, so adding an optional property cannot change any existing validation verdict.
Shape-entry digests are content digests (`digestShapeEntry`, `packages/schema/src/shape-entry/`)
and do not include the `$id`, so **no committed digest moves** and no pack referencing a shape moves
either. This RFC's landing commit **rewrites no content file**; §8 sizes the content wave that
follows it as separate work.

### §1. The problem stated as one sentence

> A number in shipped content is in one of four states — **measured**, **abstained**,
> **illustrative**, or **absent** — and the format can express none of them, so all four are the same
> string.

Each of the four ledger rows is one of those states failing:

| State | The row | Today |
|---|---|---|
| **measured** | D368 | prose; no subject, no instrument, no date; goes false silently |
| **abstained** | D151 | *"the population was below the floor"* is not a recordable outcome, so a window authored below the 100-game floor looks identical to one nobody measured |
| **illustrative** | D154 / D161 | *"47/31/22 over 5,069 games"* — an invented split beside a real count, and *"an illustration reads as prose, not as a claim"* |
| **absent** | D157 | *"a pack quoting no population is indistinguishable from a pack quoting the wrong one"* |

**The minimum record is the thing that makes these four distinguishable.** Everything below follows
from that, and §4 tests each field against the question *"which of the four states would be
inexpressible without it?"* — a field that fails that test is not in the record.

### §2. What grounding means when the instrument, the corpus and the reader are all inside the repository

`rfc/archive/opening-evidence-path.md` §1a is the governing precedent and this RFC adopts it rather
than restating it:

> **A tablebase record grounds a claim by settling it. An engine record grounds a claim by making it
> falsifiable at a named cost.** The record must name an instrument, a budget, a comparison set and a
> date such that any reviewer can re-run exactly that measurement and get exactly that number or a
> refutation.

**A corpus census reading is the same species as an engine reading in every respect that matters, and
differs in exactly one.** It is a measurement, not a result: `matchesStructuralExpression` over a
position set produces a fact about an instrument reading a corpus, not a fact about chess. It can
change without either number having been wrong. It gets measurement vocabulary, never result
vocabulary. All of that is §1a, inherited.

The one difference is decisive:

> **The corpus is under version control and the instrument is in the repository, so the named cost is
> zero and the reviewer is a CI run.**

Re-running Stockfish 18 at depth 22 over 387 positions cost G1 214 seconds and a container. Re-running
`make expression-census` over the whole corpus costs one `esbuild` bundle and one process, on the same
checkout that carries the claim, deterministically. That single fact inverts what the record is for:

| | tablebase | engine / explorer | **corpus census** |
|---|---|---|---|
| the value | settles | measures | measures |
| can it change? | no | yes | yes |
| cost to re-derive | zero (cached `POSITIVE_INFINITY`) | minutes + a binary, or a network call to a third party | **zero, offline, deterministic, same checkout** |
| is the source in the repo? | no | no | **yes** |
| so the record's job is… | assert the result | **archive what was seen**, because re-seeing is expensive | **declare what was expected**, because re-seeing is free |
| a stale record is… | impossible | a fact about a past run, checkable on request | **a failing assertion** |

**This RFC's central claim, and the reason a corpus record is shorter than an engine record rather
than longer:**

> An engine record is **archival**: it preserves a reading that would otherwise be unrecoverable, so
> it must carry the instrument, the budget, the perspective and the date, and a reviewer who wants
> the truth pays to re-run it. A census record is **predictive**: the truth is always one free
> re-derivation away, so the record's only job is to state what the author believed it would be, and
> the gate re-derives the truth on every run. **The record does not preserve the measurement. It
> preserves the expectation, so that a divergence is detected instead of noticed.**

Three consequences, each normative below:

1. **No corpus digest, and no count-based corpus identity** (§4b). Both are attempts to remember what
   was measured; re-derivation subsumes remembering.
2. **The record's checked half is the reading, not the metadata** (§4e). Everything that describes the
   corpus rather than the subject is diagnostic and may never fail a build.
3. **The instrument's own vocabulary of judgement stays out of the record** (§3c). `expression-census`
   emits `NEVER_FIRES_IN_CORPUS`, `FIRES_ON_MAJORITY`, `FIRES_ON_DEGENERATE`. Those are observations
   the instrument's own documentation is careful to call facts, not defects — *"Coverage: where the
   expression fires in the current corpus. **Zero is a fact, never an error**"* (`docs/expression-census.md`).
   **None of them is assertable**, because a record that could carry `FIRES_ON_MAJORITY` would be a
   record carrying a verdict, and law 8 forbids that (§3c).

#### 2a. Testing the obvious answer, and refuting it

D368 proposes `{measuredAt, packs, positions}` on every measured claim. Tested against the twelve
rows in §Motivation:

- **It detects the four true defects.** `694 ≠ 827` on `fianchetto-g7`. Correct.
- **It also fires on all eight readings whose numerator did not move**, because `694 ≠ 827` there
  too. **Eight false alarms for four findings, measured on the actual corpus** — and a gate with a
  2:1 false-alarm rate is a gate people learn to pass by editing the metadata, which is precisely the
  hand-edit that already fails to converge.
- **It misses the D103 direction entirely.** Edit `rook-4v3-same-side`'s trigger and
  `{measuredAt, packs, positions}` is all still true.

A **corpus digest** instead of counts fixes the identity problem — counts genuinely can coincide,
since deleting a 12-position pack and adding another leaves `56 / 827` unchanged while every reading
may move — but it makes the false-alarm rate *worse*, not better: **every** record invalidates on
**every** content commit. And it still misses the D103 direction unless the digest also covers the
subject expression, at which point it invalidates on every trigger edit too.

> **Verdict: neither counts nor a digest is the record's identity. The reading is.** A record that
> says *"this subject fires 95"* is checked by computing what the subject fires. That check is exact,
> costs one census run, catches both directions, and — measured on the twelve rows — produces
> **four errors and zero false errors**. `measuredAt`, `packs` and `positions` are kept, because
> a human reading the file wants them and a refusal message wants them, but §4e makes them
> **diagnostic and unreadable by the gate**, which is the difference between the obvious answer and
> a correct one.

**Stated precisely, because the draft's *"zero false alarms"* was doing more work than the evidence
supports and a reviewer should not have to reconcile it against §4e.** This design does not make the
eight bookkeeping rows silent; it makes them **a different class of output**. An author who writes
*"8 of 827"* declares two spans, and the `827` is a `census.of@v1` **cardinal** span that diverges
exactly as loudly as D368's stamp would — as a **warning**, exit 0, with `REFRESH=1` clearing all
eight in one command and no human decision. So the honest comparison over the twelve rows is:

| | fires on | of which need a human | gate outcome |
|---|---|---|---|
| `{measuredAt, packs, positions}` | **12** | 4 | **12 indistinguishable failures**; a person triages all twelve |
| **the reading as identity** | **12** | 4 | **4 errors** a person must rewrite, **8 warnings** one flag clears |

**The claim that survives is the one that matters and it is the design's whole justification: the
subject/cardinal split is what converts eight of twelve failures into zero decisions**, and the ratio
2:1 is the measured size of that conversion. It is *not* a claim that eight readings go unmentioned.

### §3. The `census.*` assertion family

#### 3a. The six kinds

`CLAIM_ASSERTION_KINDS` (`apps/server/src/sourcing/claim-binding.ts`) gains six members. Each takes a
**census site** — the `{file, pointer}` pair that is already the census report's own subject key
(`site.file`, `site.pointer` in `runExpressionCensus`) — and returns an **integer**.

| Kind | `args` | Returns, from the census report | Class (§4e) |
|---|---|---|---|
| `census.fires@v1` | `{file, pointer}` | `coverage.corpus.fires` | **subject** |
| `census.firesInPack@v1` | `{file, pointer, pack}` | the `count` for `pack` in `coverage.corpus.packs`, or `0` | **subject** |
| `census.packsFiring@v1` | `{file, pointer}` | `coverage.corpus.packs.length` | **subject** |
| `census.firesInShape@v1` | `{file, pointer}` | `coverage.inShape.fires` | **subject** |
| `census.of@v1` | `{file, pointer}` | `coverage.corpus.of` (positions minus evaluation faults) | **cardinal** |
| `census.corpus@v1` | `{}`, with the shipped top-level `select: "packs" \| "positions" \| "shapeEntries"` | the matching key of `corpus` | **cardinal** |

**`select` is the assertion's own top-level field, not an `args` member.** `ClaimAssertion`
(`apps/server/src/sourcing/types.ts`) is `{kind, args, select?}`, and the draft put `select` inside
`args`; corrected at cross-review so the census family uses the shipped shape rather than a private
convention.

`args.file` is the census's own `displayPath` form — repo-relative, e.g.
`content/shapes/fianchetto-g7.json` — so a record and a report join on a string neither has to
normalise. `args.pointer` is the census's subject pointer, e.g. `/trigger` or
`/plans/0/success/signature`.

**Cross-document references are first-class and this is deliberate.** `iqp-black`'s note cites
*"iqp-white … 12 across three packs"* and *"carlsbad 41"* — readings of **other entries' subjects**.
Because `args` carries `file`, that citation binds:
`{kind: "census.firesInPack@v1", args: {file: "content/shapes/iqp-white.json", pointer: "/trigger", pack: "…"}}`.
A `{measuredAt, packs, positions}` stamp could not have expressed it, and those cross-entry readings
are the ones wave F found hardest to keep true. *(Both cited values re-derived at cross-review:
`iqp-white` `/trigger` fires **12** across three packs; `carlsbad` `/trigger` fires **41**.)*

**What the family cannot reach, named rather than discovered by the implementer.** A census subject
is a whole expression at a whole pointer. **Every reading about *part* of an expression, or about a
segment walked by hand, has no site and therefore no assertion** — and those readings are a large
share of exactly the prose this RFC is about:

| Reading, in shipped prose | Why no `census.*` kind reaches it |
|---|---|
| `fianchetto-g7`: *"85 through the unmirrored g6/g7 arm and 10 through the file mirror"* | an `any[]` arm is not a subject; the census reports the union |
| `fianchetto-g7`: *"g7–f6 clear fires 86, g7–e5 clear 23, g7–d4 clear 5"* | segment-by-segment probes over a filtered position set; no pointer addresses them |
| `maroczy-bind`: *"the four conjuncts fire 58, 150, 45 and 53"* | conjunct decomposition; same reason |
| `iqp-black`: *"the trigger's three conjuncts fire 219, 1 and 45"* | same |

Those numerals fall to `authored` spans, and under §4e they raise no error and clear no residue
warning — **which means the format records that a human typed them and nothing re-derives them.**
That is honest but it is a real ceiling on how much of the corpus's measured prose this RFC makes
checkable, and it is **the reason §Open questions 2 is a blocker rather than a polish item**: a
sub-expression subject form (a pointer into an `all[]`/`any[]` arm, which `packSubjects` and
`shapeSubjects` could emit) would close most of the table above.

#### 3b. Refusals on the assertion itself

| Code | Fires when | Severity |
|---|---|---|
| `CLAIM_ASSERTION_UNRECORDED` (**shipped, reused**) | `args.file`/`args.pointer` name no subject in the census report | error |
| **`CENSUS_SITE_AMBIGUOUS`** (**new**) | the pair matches more than one subject | error |
| **`CENSUS_ASSERTION_UNEVALUABLE`** (**new**) | the checker holds no census report — see §6a | error |
| `CLAIM_SPAN_CONTRADICTED` (**shipped, reused**) | the span's numeral ≠ the recomputed value | **error for `subject` class, warning for `cardinal` class** (§4e) |

`CENSUS_SITE_AMBIGUOUS` is not hypothetical bookkeeping: the census's subject key is
`file` + `pointer`, and `packSubjects` derives pointers by walking the document tree, so a schema
change that introduced two expression sites at one pointer would silently make one record shadow the
other. Refusing is the honest option — the same reasoning `opening-evidence-path` §2b gives for
refusing an inert `resolveAt` rather than ignoring it.

#### 3c. What the family does **not** get, and this is the law-8 section

- **No observation assertions.** `census.observation@v1` is deliberately **not** minted. The
  observation vocabulary is the nine labels the shipped `observations()` can emit
  (`apps/server/src/expression-census.ts:234-248`, enumerated in full at cross-review because the
  draft listed six): `UNSATISFIABLE`, `NEVER_FIRES_IN_CORPUS`, `IN_SHAPE_DENOMINATOR_EMPTY`,
  `NEVER_FIRES_IN_SHAPE`, `FIRES_ONLY_OUTSIDE_SHAPE`, `FIRES_ON_MAJORITY`, `FIRES_ON_DEGENERATE`,
  `SATISFIABILITY_UNKNOWN`, `EVALUATION_FAULT`. Several of them read as a grade. Binding
  prose to `FIRES_ON_MAJORITY` would let a sentence say *"this trigger is too broad"* and be stamped
  machine-verified. **The instrument counts; it does not grade, and its own documentation says so.**
  An author who wants to write *"too broad"* writes it as an `authored` span (§4c) and owns it.
- **No satisfiability assertions.** `satisfiability.verdict` is a three-valued logical judgement about
  an expression, produced by refutation rules R1–R8. It is `validateShapeEntry`'s business
  (`STRUCTURAL_EXPRESSION_UNSATISFIABLE`), not a number to quote.
- **No FEN, no SAN, no position content.** `coverage.corpus.samples` carries FENs; the family cannot
  reach them. A record that could bind a FEN into prose would be one step from binding a move into
  prose, and a census cannot ground a move.
- **No derived arithmetic.** No percentage kind, no ratio kind. `fires/of` invites *"only 1% of the
  corpus"*, which is a judgement wearing a number's clothes. An author computing a percentage must
  write it as an `authored` span and own it.

  **Correction from cross-review, because the draft's safety net does not exist here.** The draft
  said such a span *"is caught by the shipped `CLAIM_READING_UNATTRIBUTED`"*. It is not, twice over.
  (1) That refusal is emitted at `/feedbackClaims/{i}/text` and is computed from `claim.evidenceTypes`
  and `author_principle` (`claim-binding.ts:207`); **a shape entry has no `feedbackClaims` and no
  `evidenceTypes`**, so the check cannot reach a `measurements` record at all. (2) Its predicate is
  `RATE_TOKEN = /(?:[+-]?\d+\.\d+%?)/`, which **requires a decimal point** — the draft's own example,
  `"1%"`, does not match it even inside a pack. **The implementer therefore extends the rate check
  to `measurements[].spans[].authored` rather than inheriting it**, keeping the shipped code and
  message and reusing `CLAIM_READING_UNATTRIBUTED` at error severity; widening `RATE_TOKEN` to admit
  a bare integer percentage is a `claim-backing`-surface change and is **not** taken here — filed in
  §Open questions 8.

> **The law-8 line for this RFC, stated once, and stated over the right half of the record.** A
> measurement record's **machine-derived half** — every `assertion`, its `args`, and everything the
> gate compares — carries **integers, JSON pointers, repo-relative file paths, pack ids and a
> timestamp**, and §3a's return types make that structural rather than a matter of discipline. It has
> no field that can hold a chess claim, a quality judgement, or an instrument's own observation label.
> The record's **human half** — `rationale`, and every `authored` or `illustrative` span — is prose,
> and prose can say anything; it is admitted under the same rule
> `rfc/archive/content-sourcing-foundation.md` §3.3 already applies to `planClasses[].description`
> and `spine[].annotations[]` — **human-only, permanently, and labelled as unbacked**. *(The draft
> claimed the record "has no field that can hold a chess claim", which `rationale` plainly
> contradicts; the law-8 guarantee is that nothing a machine produced can be confused with something
> a human asserted, not that the format refuses prose.)*

#### 3d. `$defs/censusAssertion`

**Added at cross-review: §5a promised this `$def` and §4c `$ref`s it, but the draft never wrote it,
which left an implementer to invent the one thing law 8 is enforced by.** It mirrors
`ClaimAssertion`'s shipped shape (`{kind, args, select?}`) and closes every arm.

```json
{
  "type": "object",
  "required": ["kind", "args"],
  "properties": {
    "kind": { "enum": ["census.fires@v1", "census.firesInPack@v1", "census.packsFiring@v1",
                       "census.firesInShape@v1", "census.of@v1", "census.corpus@v1"] },
    "args": {
      "type": "object",
      "properties": {
        "file":    { "type": "string", "pattern": "^content/(shapes|packs|drafts)/[A-Za-z0-9._-]+\\.json$" },
        "pointer": { "type": "string", "pattern": "^/" },
        "pack":    { "$ref": "#/$defs/id" }
      },
      "additionalProperties": false
    },
    "select": { "enum": ["packs", "positions", "shapeEntries"] }
  },
  "additionalProperties": false
}
```

with three `if`/`then` constraints: `census.corpus@v1` **requires** `select` and forbids every `args`
member; every other kind **forbids** `select` and **requires** `file` and `pointer`;
`census.firesInPack@v1` additionally **requires** `pack`. **No `oneOf` over free-form values, no
string kind outside the enum, and no member whose type is anything but an integer-producing
selector** — that closure is what makes §3c's law-8 line structural, and an implementer must be able
to read it off the schema rather than off the prose.

### §4. The record

#### 4a. Why it is not an `EvidenceRecord`

An `EvidenceRecord` exists to bind a claim to a source **outside** the repository whose retrieval,
licence and instrument must be preserved: hence `sourceId`, `retrievedAt`, `grounds`, and a
`SourceManifest` entry whose `origin` is `http`, `local-file` or `engine`, each carrying a
`SourceLicence`. A census reading has **no external source, no retrieval, and no licence**: the thing
measured is this repository's own AGPL content, at this commit. Forcing it through the manifest would
require minting an `origin.kind: "corpus"` with a licence field that means nothing and a
`retrievedAt` that is just a clock reading — and, per §2, archiving a value that is free to re-derive.

**So: no new `EvidenceKind`, no record, no manifest entry, no abstention entry, no licence.** The
census reading is a `ClaimBinding` **span**, and nothing else. This is the same move
`opening-evidence-path` §0 makes when it declines to add an evidence kind it does not need.

#### 4b. Shape

`$defs/measurementRecord`, used by `measurements[]` in a shape entry (§5). Every field is justified
against §1's four states in §4f.

```json
{
  "type": "object",
  "required": ["id", "subject", "pointer", "textSha256", "spans", "disposition", "observedAt"],
  "properties": {
    "id":        { "$ref": "#/$defs/id" },
    "subject":   { "type": "string", "pattern": "^/(trigger|plans/\\d+/success/signature)$" },
    "pointer":   { "type": "string", "pattern": "^/(provenance/sources/\\d+|plans/\\d+/(description|success/note)|watch/\\d+|typicalMistakes/\\d+)$" },
    "textSha256":{ "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "spans":     { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/measurementSpan" } },
    "disposition": { "enum": ["measured", "abstained", "superseded"] },
    "abstention":  { "enum": ["out_of_range", "source_unavailable", "no_data_at_band"] },
    "supersededBy":{ "$ref": "#/$defs/id" },
    "rationale": { "$ref": "#/$defs/nonEmptyString" },
    "observedAt":{ "type": "string", "format": "date-time" },
    "corpus": {
      "type": "object",
      "required": ["roots", "packs", "positions"],
      "properties": {
        "roots":     { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/nonEmptyString" } },
        "packs":     { "type": "integer", "minimum": 0 },
        "positions": { "type": "integer", "minimum": 0 }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

with `disposition: "abstained"` requiring `abstention` and forbidding a `spans` entry carrying an
`assertion` (schema `if`/`then`); `disposition: "measured"` forbidding both `abstention` and
`supersededBy`; and `disposition: "superseded"` requiring `supersededBy` and forbidding `abstention`.

**Two corrections landed at cross-review, both of which the draft got wrong in a way an implementer
would have shipped:**

1. **The `abstention` enum is now actually drawn from the shipped vocabulary.** §4d claimed it was;
   it was not. `ABSTENTION_REASONS` (`apps/server/src/sourcing/types.ts:68`) is
   `["out_of_range", "source_unavailable", "no_data_at_band", "licence_withheld"]`. The draft's
   `population_below_floor` and `instrument_unavailable` are **invented synonyms** for two of those,
   and minting them would have given the repository two abstention vocabularies for one concept —
   the exact defect §4d cites as its reason for reusing the shipped one. **D151's floor case is
   `no_data_at_band`**, which is what "the population was below the floor" means; instrument
   unavailability is `source_unavailable`. `licence_withheld` is excluded because a self-census has
   no licence (§4a).
2. **`disposition: "superseded"` is new and it is not optional politeness.** §Motivation 3 measures
   three shipped entries — `doubled-c-pawns` `sources[2]`, `iqp-black` `sources[1]`, `maroczy-bind`
   `sources[2]` — that deliberately preserve a past reading whose numerator has since moved, each
   explicitly marked SUPERSEDED in its own prose and kept **because D368 asked for the history**.
   With only `measured` and `abstained`, binding those readings produces a permanent, unclearable
   subject-class error, and the only workarounds are to relabel a real measurement as `authored` or
   `illustrative` — both lies about provenance, in the RFC whose entire subject is provenance.
   A `superseded` record is **fully diagnostic**: `census-check` re-derives nothing from it, may
   never fail on it, and prints it beside the record named in `supersededBy` so a reader can see the
   pair. `supersededBy` must resolve to another record's `id` in the same entry
   (`MEASUREMENT_SUPERSEDED_BY_UNRESOLVED`, §7), which stops the disposition becoming a general
   silencer: you cannot mark a reading superseded without naming the reading that replaced it.

**No `corpus.digest`, and no field derived from one.** §2a is the argument; it is restated here as a
normative refusal so a later wave does not add one as an obvious improvement.

#### 4c. `$defs/measurementSpan` — the three states, made a union

```json
{
  "oneOf": [
    { "required": ["span", "assertion"],
      "properties": { "span": {"$ref": "#/$defs/nonEmptyString"},
                      "assertion": { "$ref": "#/$defs/censusAssertion" } },
      "additionalProperties": false },
    { "required": ["span", "authored"],
      "properties": { "span": {"$ref": "#/$defs/nonEmptyString"}, "authored": { "const": true } },
      "additionalProperties": false },
    { "required": ["span", "illustrative"],
      "properties": { "span": {"$ref": "#/$defs/nonEmptyString"}, "illustrative": { "const": true } },
      "additionalProperties": false }
  ]
}
```

The first two arms are `ClaimSpan` from `apps/server/src/sourcing/types.ts`, unchanged in meaning.

**The third arm is new and it is D154's fix at the format level.** `illustrative: true` declares:
*this numeral was invented to illustrate a shape and stands for nothing that was measured.* It is
distinct from `authored`, which means *the author asserts this and takes responsibility for it being
true*. The D126 illustration — *"1400–1800 players scored 47/31/22 over 5,069 games"* — is exactly
one record with a `5,069` **assertion** span and three `illustrative` spans, and written that way it
is impossible to mistake for data.

Two normative constraints on the arm, because a "this is fake" marker is dangerous if it can hide:

1. **No consumer may render an `illustrative` span as evidence.** Nothing in this RFC renders
   anything (it is authoring-time only), so this constrains future RFCs and is stated here to be
   inherited. It is the same class of standing constraint as `opening-evidence-path` §5d's
   *"no surface may render a `cost` as engine-confirmed"*.
2. **`illustrative` is refused on any record whose `pointer` addresses a shape entry's
   `plans[].description` or `plans[].success.note`** — `MEASUREMENT_ILLUSTRATIVE_IN_TEACHING`,
   §7 — because those two fields are the entry's teaching prose, reachable by packs through
   `planClasses`, and an invented number in teaching prose is the anti-pattern regardless of how well
   it is labelled. Provenance prose may illustrate; teaching prose may not.

#### 4d. `disposition` — an abstention is a reading

`disposition: "abstained"` with an `abstention` reason records *"the instrument ran and refused"*.
**The vocabulary is a strict subset of the shipped `ABSTENTION_REASONS`** — `out_of_range`,
`source_unavailable`, `no_data_at_band`; `licence_withheld` is excluded because a self-census has no
licence — so the two paths use one language. *(The draft asserted this while listing two invented
members; §4b records the correction and why it matters.)*

**This is the format half of D151 and only the format half, stated precisely.** D151 measures that
the 100-game explorer floor sits where timing windows live: `maroczy-bind-white-squeeze` completes
readiness at **80** games, `iqp-white-panov-attack` at **29** with its arrival close firing at **12**
(the row's own measurements, labelled as the row's — this RFC ran no explorer query). What this RFC
supplies is the ability to **write that down as a reading** rather than as silence, so a reviewer can
tell *"abstained, `no_data_at_band`, population 29"* from *"nobody looked"*. What it does **not**
supply is the authoring-time warning that would have told the author before they chose the window
depth — that is explorer-side work on a different instrument, and §9 routes it rather than sketching
it.

#### 4e. The two halves, and the answer to *warn / refuse / recompute*

> **Normative half — the gate reads it and may fail on it:** `textSha256`, and every `spans[]`
> entry's agreement with its recomputed assertion.
>
> **Diagnostic half — the gate may print it and may never fail on it:** `observedAt`, `corpus.roots`,
> `corpus.packs`, `corpus.positions`, `rationale`, and **every field of a
> `disposition: "superseded"` record** (§4b).

An implementer must be able to check that mechanically, so the rule is: **the checker's failure
paths may reference `textSha256` and `spans` only, and may reference `spans` only on records whose
`disposition` is `measured`.** A test asserts that no diagnostic field appears in any refusal
predicate (§Acceptance, criterion 6).

**The `superseded` carve-out is a hole and it is bounded on purpose.** `MEASUREMENT_SUPERSEDED_BY_UNRESOLVED`
(§7, `shape-check`, error) is the only refusal that reads a superseded record, and it reads only
`supersededBy`. That is enough to stop the disposition being a general silencer — a record cannot be
demoted without naming its live replacement, so silencing a divergence costs the author a second,
checked record — and it deliberately does **not** stretch to verifying that the superseded reading
was ever true, which nothing in a version-controlled repository can do after the fact.

The split inside the normative half is by **assertion class** (§3a), and it is the direct output of
§Motivation 2:

| Divergence | Class | Outcome | Why |
|---|---|---|---|
| the subject's own reading moved | **subject** | **error**, non-zero exit | a person wrote a proposition around this number; four of four such cases in the corpus required a human rewrite |
| only a corpus cardinal moved | **cardinal** | **warning**, exit 0, naming the one-command fix | eight of eight such cases were bookkeeping; failing here trains people to edit metadata to pass |
| `textSha256` mismatch | — | **error** — `CLAIM_TEXT_DRIFTED`, the shipped code at its shipped severity | the sentence changed after the numbers were bound; §Motivation 3 is what that looks like when it is not caught |
| a machine-shaped token no span declares | — | **warning** on shape entries (§6c), error unchanged on packs | day-one blast radius is 263 tokens (§8); a wall of errors forces a content pass into an infrastructure commit |

**Recompute is admitted in exactly one place and it is never the default.** `make census-check
REFRESH=1` rewrites **cardinal spans only**, together with `textSha256`, `observedAt` and the
`corpus` block, and refuses to run at all if any **subject** span diverges. So:

- it can never perform §Motivation 3's corruption, because the numeral it rewrites is one no
  proposition was built on — the denominator — and it stops dead if a numerator moved;
- it preserves the first half of `docs/expression-census.md`'s standing sentence — *"The census never
  writes content **and is deliberately absent from `make verify`**"* — by living behind an explicit
  flag, and the default and gate modes still never write. **The second half of that sentence is
  broken by this RFC and the draft did not say so** (§6d now does, and §10 routes the doc edit);
- applied to the twelve rows in §Motivation it would have produced **eight files refreshed with zero
  human decisions and four errors**, each error naming a sentence a person had to rewrite — including
  the two wave F missed.

#### 4f. Each field tested against §1's four states

| Field | Which state is inexpressible without it | Verdict |
|---|---|---|
| `subject` | **measured** vs **absent** for *this* expression; and D103's direction — a reading detached from what it measured cannot notice the trigger moved | keep |
| `pointer` + `textSha256` | **measured** — a reading not attached to its sentence is a fact nobody reads; drift is undetectable | keep |
| `spans` | all four — this is the union that makes them distinct | keep |
| `disposition` + `abstention` | **abstained** (D151) | keep |
| `disposition: "superseded"` + `supersededBy` | a fifth state the draft's four missed: **a reading that was true of a past corpus and is deliberately kept**. Three shipped entries are in it today (§Motivation 3) | keep, **diagnostic** |
| `observedAt` | none — but a refusal message that cannot say *"recorded 2026-08-16"* is a worse refusal | keep, **diagnostic** |
| `corpus.{roots,packs,positions}` | none — the check re-derives them | keep, **diagnostic**; a refusal wants to say *"the corpus moved 694→827"* |
| `rationale` | none of the four — it is **D103's** field, and it is human-only prose | keep, human-only (§5b) |
| `corpus.digest` | none; §2a measures it as strictly worse than re-derivation | **refused** |
| an instrument version | none of the five. See the paragraph below — **the draft's stated reason was wrong and the refusal survives on a different one** | **refused** — the sharpest divergence from the engine record, where `engineVersion` is load-bearing precisely because the binary is not in the repo |

**The instrument-version refusal, re-argued at cross-review, because the draft's argument does not
survive contact with the case it is supposed to cover.** The draft said a recorded version *"would
produce a field that is always trivially equal to the runtime's"*. **That is false in exactly the
situation the field would exist for.** A record written at commit A carries A's evaluator; the check
runs at commit B; if `matchesStructuralExpression` changed in between, the recorded version and the
running one **differ**, and the difference is the one piece of information that distinguishes *"the
corpus moved"* from *"the instrument moved"*. The draft's own D377 concedes precisely this, which
made the pairing incoherent: a residue admitted in one section and denied in another.

The refusal is nonetheless correct, on two grounds the draft did not state:

1. **There is nothing to record.** `matchesStructuralExpression` exports no version constant and
   `packages/runtime/package.json` reads `"version": "0.0.0"` — a value that has never moved and that
   nothing bumps on a semantics change. A field populated from it would be a **constant string
   pretending to be provenance**, which is worse than absence: it would read as an instrument
   attestation and attest nothing. Minting a hand-maintained `CENSUS_EVALUATOR_VERSION` that an
   author must remember to bump is the `provenance.engineValidation` failure
   `opening-evidence-path` §1a(2) names — *"someone typed a number into a JSON file"*.
2. **Even a real version could not be normative here.** By §4e it would describe the environment, not
   the subject, so it lands in the **diagnostic half** and may never fail a build. It would improve a
   refusal *message*; it would catch nothing that the readings moving does not already catch.

**So the honest statement is narrower than the draft's and it is what D377 records:** the residue is
real, this RFC does not close it, and the cheapest thing that *would* close it is not a version field
but the "many records diverged in one commit" heuristic of §Open questions 6. **D377 is therefore the
honest residue rather than a dodge — but only now that the ground under it is stated correctly.**

### §5. The shape-entry surface (shape-entry schema 0.4)

#### 5a. One property

`schemas/shape_entry.schema.json` gains a tenth top-level property. The nine existing properties and
the root's `required` list are **byte-unchanged**; `measurements` is **not** added to `required`.

```json
"measurements": { "type": "array", "items": { "$ref": "#/$defs/measurementRecord" } }
```

plus `$defs/measurementRecord`, `$defs/measurementSpan` and `$defs/censusAssertion`. The file already
duplicates the `structuralExpression` grammar from `drill_pack.schema.json` rather than `$ref`-ing
across files, so local `$defs` is the file's established convention and not a new one.

`$defs/provenance` is **not touched**. It stays closed on `{licence, sources, attribution}`, and
`sources[]` stays what it is — a source list. The measured prose currently living there does not
move; a record simply **points at it** (`pointer: "/provenance/sources/2"`), which is why the landing
commit rewrites no content.

**Three structural refusals in `validateShapeEntry`:**

| Code | Fires when |
|---|---|
| **`MEASUREMENT_POINTER_UNRESOLVED`** (new) | `pointer` does not resolve to a string in this entry |
| **`MEASUREMENT_SUBJECT_UNRESOLVED`** (new) | `subject` does not resolve to a **non-null** structural expression in this entry (`plans[].success.signature` is `oneOf [structuralExpression, null]`, so a record pointed at a null signature is a resolution failure, not a schema one) |
| **`MEASUREMENT_SUPERSEDED_BY_UNRESOLVED`** (new, §4b) | `supersededBy` names no other record's `id` in this entry |

All three are pure schema-adjacent resolution checks and need no corpus. **They run in `census-check`
as well as `make shape-check`, and the second half of that sentence is the point** (corrected at
cross-review): `make shape-check` **requires `FILE=` and is not a `make verify` dependency**, so a
refusal that lived only there would never run in the gate and the four `MEASUREMENT_*` codes would be
advisory. `census-check` already walks all 25 entries in `content/shapes/`, so hosting the resolution
checks there costs nothing and is what makes §7's severities real. `make shape-check` keeps them so a
single-file author gets them before committing. Everything requiring the **corpus** still lives only
in `census-check` (§6).

#### 5b. D103, closed — and what `rationale` may and may not say

D103 asks for *"somewhere to record why its trigger says what it says"*. The record supplies it as
`rationale`, and the record is strictly better than the `triggerNote` the wave tried, for one reason:

> A `triggerNote` is prose about a trigger, attached to nothing. A record's `rationale` is prose about
> a trigger, attached to `subject` and sitting beside spans that are recomputed from that same
> subject. **When the trigger is edited, the spans move and the record refuses — which drags the
> rationale in front of a human's eyes in the same commit that made it stale.** A free-text note
> would have gone quietly wrong in exactly the way D368 measured eleven notes going quietly wrong.

For `rook-4v3-same-side`, whose two `provenance.sources` entries record nothing of D75's fix, the
record the follow-on content wave writes is below.

**Read the `pointer` first, because the draft's version of this example did not validate and the
reason is instructive.** A `spans[].span` is a **substring of the text the `pointer` addresses** —
`validateClaimBindings` refuses `CLAIM_SPAN_ABSENT` when it is not
(`claim-binding.ts:190`) and `CLAIM_SPAN_AMBIGUOUS` when it occurs twice (`:191`). The draft pointed
this record at `/provenance/sources/1`, whose entire text at HEAD is *"UNGROUNDED: strategic claims
inherit Pack C's authored-assessment limitations."* — which contains neither `24` nor
`rook-4v3-same-side-hold`, so **both spans would have been refused**. A measurement record cannot be
attached to a sentence that does not state the measurement; **the content wave adds the sentence, and
the record points at it.** This is not a defect in the mechanism, it is the mechanism working, and it
sharpens §8: the follow-on wave writes prose as well as records.

```json
// content/shapes/rook-4v3-same-side.json — provenance.sources gains a third entry:
//   [2] "TRIGGER NARROWING (D75), measured 2026-08-16: after the narrowing the trigger fires
//        24 times across the corpus, inside 1 pack, rook-4v3-same-side-hold."
"measurements": [{
  "id": "trigger-narrowing-d75",
  "subject": "/trigger",
  "pointer": "/provenance/sources/2",
  "textSha256": "sha256:…",
  "rationale": "Two clauses were added to exclude the Philidor spines the loose form admitted: the trigger constrained rooks, minor/queen absence and open a-d files with no pawn constraint, so its in-shape positions split into a zero-black-pawn group and a three-pawn group, and the pawn-count plan could not fire on the union. Loosening either clause re-opens D75.",
  "spans": [{ "span": "24", "assertion": { "kind": "census.fires@v1", "args": { "file": "content/shapes/rook-4v3-same-side.json", "pointer": "/trigger" } } },
            { "span": "1",  "assertion": { "kind": "census.packsFiring@v1", "args": { "file": "content/shapes/rook-4v3-same-side.json", "pointer": "/trigger" } } },
            { "span": "rook-4v3-same-side-hold", "authored": true }],
  "disposition": "measured",
  "observedAt": "2026-08-16T00:00:00.000Z",
  "corpus": { "roots": ["content/drafts", "content/packs"], "packs": 56, "positions": 827 }
}]
```

**Both numerals are checked and the pack name is not, and that asymmetry is worth stating because it
is the family's real reach.** `census.*` kinds return **integers**; there is no kind that returns a
pack id, so *"and it is `rook-4v3-same-side-hold`"* stays an `authored` span the author owns. What
catches a wrong pack name is the **count beside it**: if the trigger spread to a second pack,
`census.packsFiring@v1` moves 1 → 2 and the sentence refuses. **A `census.*` family that returned
names instead of counts would be a family that could put a pack id into prose under a machine
label, and §3c refuses that class.** *(Re-derived at cross-review: `/trigger` fires **24 of 827** in
exactly **1** pack, `rook-4v3-same-side-hold`.)*

**`rationale` is human-only, permanently**, in the sense `rfc/archive/content-sourcing-foundation.md`
§3.3 gives the term: no span may bind it, no assertion may support it, and it is refused as a
`pointer` target (`MEASUREMENT_RATIONALE_NOT_BINDABLE`, §7). It is a reason, and no instrument in this
repository measures reasons. Recording it honestly as unbacked is the whole of what D103 asked for.

### §6. Where the check lives

#### 6a. The census is the only thing that can evaluate a `census.*` assertion

`validateClaimBindings(pack, ledger, issues)` resolves every shipped assertion against a record in
one pack's ledger. A census reading is a fact about all 56 packs, so the signature grows one optional
parameter — a census report — and the `census.*` arm of `evaluate` reads the report's `subjects`
array by `site.file` + `site.pointer`.

**The seam, stated explicitly because an unowned one is what
`rfc/archive/opening-evidence-path.md` spends two pages regretting.** The draft named
`sourcing-check` and `verify-draft` as the two callers; **`verify-draft` does not call
`validateClaimBindings` at all**, and the caller it missed is the more consequential one. Enumerated
at cross-review, the callers are exactly two:

| Caller | What it is | Why it must not build a report |
|---|---|---|
| `apps/server/src/sourcing/check.ts:198` | `sourcing-check`, a per-pack authoring tool | it is invoked on one pack or one candidate directory; the corpus walk is not its job |
| `apps/server/src/pack-registry.ts:266` | **`PackRegistry.loadDefault` — the running server**, feeding `claimBackings` onto `PackRecord` | a 192-subject × 827-position census on every pack load is not admissible at runtime, at any severity |

**The second row is why the deferral clause is load-bearing rather than tidy.** `CLAIM_ASSERTION_KINDS`
is a single global array, so once the six `census.*` members exist **a pack ledger can declare one**,
and the runtime registry will evaluate it on load. This RFC gives packs no `measurements` surface
(§Open questions 1), so nothing in the corpus does this today — but the format permits it from the
landing commit, and *"nothing does it yet"* is not a seam. So:

> When `validateClaimBindings` is called without a census report, a `census.*` span is **skipped and
> counted**, never refused. It emits **`CENSUS_ASSERTION_DEFERRED`** (info) naming
> `make census-check` as the tool that checks it, and — critically — **it does not count toward the
> instrument-attribution tallies** that produce `CLAIM_LABEL_UNEARNED` and
> `CLAIM_AUTHOR_LABEL_REQUIRED`, because a deferred span is neither earned nor authored.
> `CENSUS_ASSERTION_UNEVALUABLE` (§3b, error) fires only in `census-check`, where a report is
> guaranteed present.

Without that clause `sourcing-check` would emit `CLAIM_ASSERTION_UNRECORDED` on every valid census
binding, which is the "each tool assumed the other owned it" failure in its exact classic form — and
the runtime registry would do the same, on a path that ends at a learner-visible `claimBackings`
entry. **`CENSUS_ASSERTION_DEFERRED` at info severity is what keeps §Exploration gate's claim that
this RFC "ships no learner-visible behaviour" true**, so it is a normative requirement of the
register claim, not a convenience. (§0 records the `SourcingIssue.severity` widening that info
requires.)

#### 6b. `--check` mode

`runExpressionCensus` gains `options.check`, and the CLI a `--check` flag. In check mode the report
gains **one** top-level key and the rest is byte-identical:

```json
"records": {
  "documents": [{ "file": "content/shapes/fianchetto-g7.json", "declared": 3, "agreeing": 1,
                  "divergingSubject": 2, "divergingCardinal": 0, "undeclaredTokens": 12 }],
  "issues": [{ "code": "CLAIM_SPAN_CONTRADICTED", "file": "…", "pointer": "/measurements/0/spans/1/span",
               "severity": "error", "recorded": "44", "reading": 95,
               "recordedCorpus": { "packs": 43, "positions": 694 },
               "readingCorpus": { "packs": 56, "positions": 827 } }],
  "totals": { "documents": 25, "declared": 0, "superseded": 0, "illustrative": 0,
              "errors": 0, "warnings": 0, "undeclaredTokens": 263 }
}
```

**Every count in `records.totals` is namespaced under `records`** — `records.totals.declared`, not
`totals.declared`; the report's existing top-level `totals` (`subjects`, `unsatisfiable`,
`neverFiresInCorpus`, …) is untouched, and §Acceptance criterion 12 is corrected to say so.

`superseded` and `illustrative` are per-document and per-total counts **because both are escape
hatches** — §4b's superseded disposition and §4c's illustrative arm each let an author remove a
numeral from the checked set. §Open questions 5 asked whether `illustrative` should be counted;
**the answer is yes and it is taken here**, extended to `superseded` for the same reason: an escape
hatch that is not counted is not visible, and a reviewer comparing `declared: 3, superseded: 4` to
`declared: 7, superseded: 0` can see the difference at a glance.

`recordedCorpus` / `readingCorpus` are the **diagnostic half doing its only job**: telling a human how
far the ground moved, in a message, without ever being the thing that failed.

**Exit code in check mode is `errors > 0`, and nothing else.** In particular it is **not** influenced
by `totals.unsatisfiable`, by any observation label, or by `undeclaredTokens`. Default mode's exit
code (`unsatisfiable > 0 || witnessFault`) is untouched.

#### 6c. What the census still refuses to do, and D157

> **The census does not grade an expression. It grades a record's agreement with a reading.**

That sentence is the whole of why this can join the gate without violating
`docs/expression-census.md`'s standing promise that *"Zero is a fact, never an error."* A trigger that
fires 0 of 827 is still fine. A **record that says it fires 44 when it fires 95** is an arithmetic
disagreement between an authored document and an instrument — not a chess judgement, and not a fact
about the trigger's quality.

**D157's contribution is `declared`.** Once measured readings are declared, `declared: 0` on a
document is countable, and *"quoting no population"* stops being indistinguishable from *"quoting the
wrong one"*: the first is `declared: 0`, the second is a `CLAIM_SPAN_CONTRADICTED`. `carlsbad-minority-attack`
— named in `design/04-content-architecture.md` §8 as the middlegame exemplar — becomes a row in
`records.documents` with its number printed. **Whether a pack may graduate with `declared: 0` is a
policy this RFC does not set**; §9 routes it to `rfc/pack-graduation.md`, which owns the graduation
floor.

#### 6d. Gate membership, and the shipped test that pins it

`expression-census.test.ts` asserts, in the case named *"reuses the shipped walker and leaves the
verification gate report-free"*:

```ts
expect(makefile.match(/^verify:.*$/mu)?.[0]).not.toContain("expression-census");
```

**That assertion is correct and its intent must survive**, so this RFC does not amend it and does not
route around it by renaming. Two facts settle the question:

- The **new Makefile target is `census-check`**, and `verify` gains `census-check`. The string
  `expression-census` does not appear on the `verify:` line, so the shipped assertion passes
  unchanged — but *passing a string test is not the argument*, and it is stated here so no reviewer
  has to wonder whether it was.
- The **argument** is that the assertion's intent is *"the report is not a gate"*, and it stays true:
  `census-check` puts no observation, no satisfiability verdict and no coverage number into the exit
  code. The only thing that can fail `verify` is a document disagreeing with an instrument about a
  number the document itself wrote down.

The implementer **strengthens** the test to assert the intent rather than the string: `verify` must
not depend on any target whose exit code reads `totals.unsatisfiable` or any `observations` member.
That is a stronger guarantee than the shipped substring check and it is the one the case's own name
describes.

**Verified at cross-review, both halves.** `Makefile:21` reads `verify: typecheck test schema-check`;
appending `census-check` leaves the line free of the literal `expression-census`, so the shipped
assertion at `expression-census.test.ts:136` passes unchanged. And the intent survives for the reason
stated above. **But the RFC owed one more admission and the draft did not make it:**
`docs/expression-census.md:26` does not only promise that the census never writes — its sentence is
*"The census never writes content **and is deliberately absent from `make verify`**."* **This RFC
breaks the second clause outright.** That is defensible — `census-check` is a different target with a
different exit rule, and the clause was written when the only thing the census could report was
coverage — but it is a documented standing promise being changed, not merely extended, and §10 now
requires the implementer to **rewrite that sentence** rather than append to the file around it. A
promise quietly falsified by a target rename is exactly the shape §6d exists to refuse.

**Runtime is a gate concern and was measured, not assumed.** The full census over 56 packs / 827
positions / 192 subjects completed inside a single `make` invocation on this machine today, including
the `esbuild` bundle (reported at 94 ms in the drafting run and 41 ms on the cross-review re-run —
the figure is machine-local and only the order of magnitude is a claim). Check mode adds a per-record
pointer resolution and one
integer comparison per span; it walks no additional positions. **D378** (§12) records the standing
obligation to re-measure if the corpus grows an order of magnitude.

### §7. Refusal-code register and collision sweep

| Code | New / reused | Severity | Where |
|---|---|---|---|
| `CLAIM_SPAN_CONTRADICTED` | **shipped, reused** | error (subject) / warning (cardinal) | `census-check` |
| `CLAIM_TEXT_DRIFTED` | **shipped, reused at shipped severity** | error | `census-check`, `shape-check` |
| `CLAIM_SPAN_ABSENT` / `CLAIM_SPAN_AMBIGUOUS` | **shipped, reused** | error | `shape-check` |
| `CLAIM_ASSERTION_UNDECLARED` | **shipped, reused at a new severity** | **warning on shape entries**, error unchanged on packs | `census-check` |
| `CLAIM_ASSERTION_UNRECORDED` | **shipped, reused** | error | `census-check` |
| `CLAIM_READING_UNATTRIBUTED` | **shipped, reused on a new document type** | error | `census-check` — see §3c; the shipped emitter is pack-only and the implementer extends it to `measurements[].spans[].authored` rather than inheriting it |
| `MEASUREMENT_POINTER_UNRESOLVED` | new | error | `census-check`, `shape-check` |
| `MEASUREMENT_SUBJECT_UNRESOLVED` | new | error | `census-check`, `shape-check` |
| `MEASUREMENT_RATIONALE_NOT_BINDABLE` | new | error | `census-check`, `shape-check` |
| `MEASUREMENT_ILLUSTRATIVE_IN_TEACHING` | new | error | `census-check`, `shape-check` |
| `MEASUREMENT_SUPERSEDED_BY_UNRESOLVED` | new | error | `census-check`, `shape-check` |
| `CENSUS_SITE_AMBIGUOUS` | new | error | `census-check` |
| `CENSUS_ASSERTION_UNEVALUABLE` | new | error | `census-check` |
| `CENSUS_ASSERTION_DEFERRED` | new | **info** | `sourcing-check`, **`pack-registry`** |

That is **eight new codes and seven reused**, and §7 is the authority for the list; §0's row is a
summary of it. **The draft said seven and six**; cross-review added
`MEASUREMENT_SUPERSEDED_BY_UNRESOLVED` (§4b) and `CLAIM_READING_UNATTRIBUTED` (§3c), corrected the
`shape-check`-only homes to `census-check` **and** `shape-check` (§5a — `shape-check` is not a
`verify` dependency and requires `FILE=`, so a gate-relevant refusal cannot live there alone), and
corrected `CENSUS_ASSERTION_DEFERRED`'s second home from `verify-draft`, which does not call
`validateClaimBindings`, to `pack-registry` (§6a), which does.

**Collision sweep, re-run at cross-review 2026-08-16** across `apps/`, `packages/`, `schemas/`,
`rfc/`, `docs/`, `content/`, `design/`, `planning/` and `tools/`, excluding this file and the
`apps/server/dist/` build artifacts: each of the **eight** new literals occurs **zero** times, as do
`measurementRecord`, `measurementSpan` and `censusAssertion`. The only pre-existing occurrence of
the string `census-check` anywhere in the tree is inside `design/BACKLOG.md`'s **D378**, which this
RFC filed. Reusing `CLAIM_SPAN_CONTRADICTED` and
`CLAIM_ASSERTION_UNDECLARED` at a second severity is deliberate — one code, one meaning, severity set
by the caller — and it is the pattern `opening-evidence-path` §4c establishes with
`ENGINE_COVERAGE_INCOMPLETE`.

**Two shipped codes are deliberately *not* extended and the omission is stated so it is not read as
an oversight.** `CLAIM_POINTER_REBOUND` and `CLAIM_BINDING_DUPLICATE` (`claim-binding.ts:180`, `:182`)
are keyed to `claimId`, which a shape-entry record does not have — its identity is `id` + `pointer`,
and `MEASUREMENT_POINTER_UNRESOLVED` plus `textSha256` cover the same ground.

### §8. Blast radius, measured

**Day one, on landing this RFC alone: zero.** `measurements` is optional, no entry has one, no check
has anything to check, `census-check` reports `declared: 0` across 25 documents and exits 0.

**Day one of the content wave that follows** (separate work, §9): the residue sweep would warn on
**263 digit-shaped tokens across 17 of the 25 shape entries**, concentrated in eleven —
`iqp-black` 35, `maroczy-bind` 34, `fianchetto-g7` 32, `knight-vs-bishop` 30, `doubled-c-pawns` 21,
`pawn-opposition-key-squares` 19, `open-centre` 16, `up-an-exchange` 16, `hanging-pawns` 14,
`london-wedge` 14, `vancura` 14, then a long tail of six entries at 6 or fewer
(`advance-caro-dxc5-residue` 6, `kid-chain-arrangement` 3, `queen-vs-pawn-on-seventh` 3,
`bishop-good-bad` 2, `opposite-coloured-bishops` 2, `pawn-breakthrough-outside-passer` 2). *(Measured
with a digits-only subset of the shipped `MACHINE_TOKEN` regex over `provenance.sources[]`,
`plans[].description`, `plans[].success.note`, `watch[]` and `typicalMistakes[]`; the full regex also
matches SAN, square names and result words, so the true figure is higher. The subset is stated so the
number is reproducible, not because the full sweep is optional.* **Independently reproduced at
cross-review: the total, the 17-of-25, and every one of the seventeen per-entry counts match
exactly.**)

That is a large number and it is **the correct number: it is the size of the gap, printed**, which is
the reasoning `opening-evidence-path` §5d applies to its own 67 warnings. It is also why §4e makes
the residue a **warning** on shape entries — an error wall would force a content pass into this
RFC's commit, and this RFC's commit changes no content.

**Two entries are wrong at HEAD right now** (`kid-chain-arrangement`, `london-wedge`), and this RFC
does not fix them: fixing a wrong number is a content edit, and the entries also need their
*propositions* rewritten (*"and nowhere else in the corpus"* is false in both). Filed as **D379**
(§12) so the debt is a row rather than an assumption. **Both re-derived at cross-review against a
clean working tree**, with the `provenance.sources[1]` text quoted verbatim in both files and the
census run over the committed corpus: `kid-chain-arrangement` **24 of 827** in `anti-kid-classical-white`
(7), `kid-classical-black` (7), `kid-mar-del-plata-white` (10); `london-wedge` **19 of 827** in
`anti-london-black` (7), `london-system-white` (7), `london-wedge-black-counterplay` (5). Both notes
still read *"over all 487 spine positions of the 37 shipped packs … fires on exactly 14 nodes … and
nowhere else in the corpus"*.

### §9. What this RFC deliberately does not take

| Row | What is closed here | What is routed, and to whom |
|---|---|---|
| **D368** | closed | — |
| **D103** | closed | — |
| **D157** | `declared` makes *"quotes no population"* countable and printed | the **graduation policy** — may a pack publish with `declared: 0`? — to `rfc/pack-graduation.md`, which owns `GRADUATION_REQUIRES_SOURCES` and the published-status floor. Filed as **D380**. |
| **D151** | the `abstained` disposition makes *"measured, below floor"* recordable | the **authoring-time warning** — telling an author their window sits below the 100-game floor *before* they choose its depth — is explorer-side work on `attachExplorerEvidence` / the priority path, not census work. Routed to the explorer wave; the row stays open with its scope narrowed. |
| **D154 / D161** | the `illustrative` span form makes an invented number declarable | **nothing here lints Markdown.** `design/BACKLOG.md` is a process document; no schema governs it, no pointer addresses it, and building a lint for it would mean parsing prose in a file every agent edits concurrently. D161's standing rule — *"worked examples in ledger and design tier are claims and must carry their provenance or be marked synthetic"* — is a **documentation and review rule**, and it is the owner's to place. Stated rather than quietly inherited. |

**One coordination note, not a dependency.** `rfc/dead-vocabulary.md` (draft) owns extending
`expression-census` **as a report** — it adds a `DECLARATIONS=1` flag, default off. This RFC adds a
`--check` mode and a `records` key. The two do not collide: different flags, different top-level
keys, neither changes the default report. Whichever lands second should confirm the flag names in one
line. `pack-graduation` — **implemented 2026-08-16 and archived, not "accepted and unlanded" as the
draft said**; `DRILL_PACK_SCHEMA_VERSION` and the pack `$id` both read `0.27` — moved all pack digests
and re-stamped ledgers before this RFC starts, so the ordering question it raised is settled rather
than open.

### §10. Documentation the implementer updates

- `docs/expression-census.md` — the `--check` mode, the `records` key, the subject/cardinal split, and
  the restatement that *coverage is still never graded*. **`docs/expression-census.md:26` currently
  reads *"The census never writes content and is deliberately absent from `make verify`."* — the
  second clause is falsified by `census-check` and the sentence must be rewritten, not appended to**
  (§6d). The replacement states both halves that survive: the census still never writes content, and
  no coverage number, observation label or satisfiability verdict is in any `verify` exit code.
- `docs/development.md` — `make census-check`, `REFRESH=1`, and its membership in `verify`.
- `docs/drill-pack-format.md` / any shape-entry documentation — the `measurements` property and the
  three span forms.
- `docs/expression-census.md` currently omits the `.browser` fixture convention that
  `corpus.fixturePacks` encodes; correcting that is one sentence and belongs in the same commit.

### §11. Register rows requested (this RFC does not edit `rfc/README.md`)

`rfc/README.md` has a single writer and this RFC does not touch it. State of the register at
cross-review, and what remains outstanding:

- **Active table: already landed by the writer.** The row exists and is richer than the one the draft
  requested; no further request. *(It carries the draft's *"4 true defects and 8 false alarms"*
  framing, which §2a now qualifies — the eight are **warnings this design clears with one flag**, not
  outputs it suppresses. The writer may want the row to say so; it is not this RFC's to edit.)*
- **Pack-schema register:** no row. **The sentinel row `| — | 0.28 is the next free pack lane |`
  stands unchanged** — this RFC's whole register position is that it does not take it. *(Cross-review
  note for the writer, not a request: the Active table shows `opponent-contracts.md` claiming pack
  0.28 while that RFC's own header has **RELEASED** the claim. The lane is free; the two rows
  disagree about it.)*
- **Shape-entry lane:** the register has **no shape-entry table**. One should exist, because
  `schemas/shape_entry.schema.json` has moved to 0.3 and `vocabulary-wiring`'s `plan_signature` leaf
  landed inside it with no register row of any kind. Requested:
  `| 0.4 | measurement-records.md | claimed 2026-08-16 — additive optional measurements[] plus three $defs; no existing entry changes, no digest moves |`, with 0.1–0.3 backfilled by the writer.
- **Migration register:** no row. `STORAGE_VERSION` stays at **22** and the landing order is
  unaffected.

**The draft closed with two "register facts worth the writer's attention" and both were false at
cross-review**; they are corrected here rather than deleted, because a stale correction is worse than
no correction. The 0.26 row reads **implemented 2026-08-16**, not *claimed*, against
`archive/claim-backing.md`; `DRILL_PACK_SCHEMA_VERSION` and the pack `$id` read **0.27**, not 0.26;
and **`dead-vocabulary.md` does have an Active row**. Nothing in the register is behind the tree on
these three points — the draft was.

### §12. Ledger rows this RFC opens (law 4)

**Landed in `design/BACKLOG.md` before cross-review; this section is the RFC-side copy.** The draft
said the rows were unlanded and awaiting claude — they are in the file, as rows D376–D380 sitting
between D381 and D373. The id block was taken after verifying that D371–D375 were occupied; **D381
has since been minted above it** by a concurrent agent, which is exactly the interleaving the "cite
rows by title, not by line" rule at the head of this RFC exists for. The texts below are the drafting
form and differ in wording from the landed rows; **the landed rows are authoritative**.

| Row | Text |
|---|---|
| **D376 🐞** | **The shape-entry schema has no register lane, and a version already moved inside it unannounced.** `schemas/shape_entry.schema.json` reads `urn:chess-tabiya:schema:shape-entry:0.3` and `vocabulary-wiring`'s `plan_signature` leaf landed in that file — while `vocabulary-wiring`'s own register claim says *"claims pack schema 0.24 and nothing else"*, and no active RFC records a shape-entry version at all (two explicitly write *"Shape-entry schema: NONE"*). So the file is a shared versioned resource with **no register**, which is the exact collision class the pack register exists to prevent, one file over. Remedy is a table in `rfc/README.md`, not a code change |
| **D377 🐞** | **A change to `matchesStructuralExpression`'s semantics silently changes every census reading in the corpus, and no record can detect it.** `rfc/measurement-records.md` §4f refuses an instrument-version field on the ground that a record can only ever be checked against the running evaluator — so the version would always be trivially equal and would prove nothing. The consequence is real and is recorded rather than papered over: an evaluator change surfaces only as *many records diverging in one commit*, which reads as N unrelated content defects. A "records moved together" heuristic would name the common cause; whether that is worth building is §Open questions 6 |
| **D378 💡** | **`census-check` joins `make verify` on a runtime measured at one corpus size and nothing re-measures it.** The full census over 56 packs / 827 positions / 192 subjects completes inside one `make` invocation today (esbuild reported 94 ms). Check mode adds one pointer resolution and one integer comparison per span and walks no extra positions, so it is not the risk — the **census walk itself** is, and it is `O(subjects × positions)`. At an order of magnitude more content the gate cost should be re-measured before it is assumed |
| **D379 🐞** | **Two shape entries carry a census reading that is false at HEAD, and the 2026-08-16 manual sweep missed both for a mechanical reason.** `kid-chain-arrangement` and `london-wedge` each state *"Firing census over all 487 spine positions of the 37 shipped packs … fires on exactly 14 nodes … and nowhere else in the corpus"* in `provenance.sources[1]`. Re-measured 2026-08-16: **24 of 827 across three packs** (`anti-kid-classical-white` 7, `kid-classical-black` 7, `kid-mar-del-plata-white` 10) and **19 of 827 across three packs** (`anti-london-black` 7, `london-system-white` 7, `london-wedge-black-counterplay` 5). Wave F corrected nine entries by grepping for `694`, the denominator it knew; these two were measured against **487** a generation earlier and were invisible to that key. **Both need the proposition rewritten, not just the numeral** — *"nowhere else in the corpus"* is false in both. Content debt, not an RFC deliverable |
| **D380 💡** | **May a pack graduate while quoting no population at all?** D157 measures that `carlsbad-minority-attack` — the middlegame exemplar `design/04-content-architecture.md` §8 names — carried no corpus evidence of any kind, and that *"a pack quoting no population is indistinguishable from a pack quoting the wrong one."* `rfc/measurement-records.md` §6c supplies the missing half: once readings are declared, `declared: 0` is countable and printed per document. **The policy is not supplied and is deliberately not taken there** — the published-status floor is `rfc/pack-graduation.md`'s (`GRADUATION_REQUIRES_SOURCES`), and this row is the hand-off so neither RFC assumes the other owns it |

---

## Deviations from design

**None.** `design/04-content-architecture.md` §0 establishes the shared shape library as a referenced
artifact and §8 names the production model this RFC's records attach to; neither specifies a
provenance format for shape entries, which is the gap D103 names. `design/03-product-breadth.md` B4
is untouched: nothing here changes what a learner is shown, and B4 remains unmet on its own terms.

---

## Acceptance criteria

1. `schemas/shape_entry.schema.json` `$id` reads `…shape-entry:0.4`; `SHAPE_ENTRY_SCHEMA_VERSION` and
   `packages/schema/src/shape-entry.test.ts` agree; **all 25 entries in `content/shapes/` validate
   unchanged**, and `digestShapeEntry` returns the same digest for each as at HEAD.
2. `DRILL_PACK_SCHEMA_VERSION` reads **`0.27`** (the value at HEAD — the draft pinned `0.26`, which
   would have failed this criterion on the day it was written), `DRILL_RUN_SCHEMA_VERSION` is
   unchanged at `0.16`, and `STORAGE_VERSION` reads `22`. A test asserts all three, so the "claims
   nothing else" register promise is enforced rather than stated. **The test must assert the values
   the tree has, not the values this RFC remembers**; that is the whole point of the criterion and
   the draft's version of it demonstrates the failure it exists to catch.
3. `CLAIM_ASSERTION_KINDS` contains **exactly 21 members: the shipped 15 plus the six `census.*`**,
   and **no `census.observation@v1`, `census.satisfiability@v1`, or any percentage/ratio kind** —
   asserted as an exact-set equality so a later addition is a deliberate act (§3c, law 8). The
   `$defs/censusAssertion` `kind` enum (§3d) asserts equal to the six.
4. Fixture case, D368 reproduced: a shape entry with a record asserting `census.fires@v1 = 44` for a
   subject the census reads as `95` produces exactly one `CLAIM_SPAN_CONTRADICTED` at
   `/measurements/{i}/spans/{j}/span`, **error** severity, `census-check` exits non-zero, and the
   issue carries both `recordedCorpus` and `readingCorpus`.
5. Fixture case, the cardinal split: the same entry with only `census.of@v1` diverging (`694` vs
   `827`) produces a **warning**, `census-check` exits **0**, and `REFRESH=1` rewrites the span,
   `textSha256`, `observedAt` and `corpus`, leaving every other byte of the file identical.
6. `REFRESH=1` **refuses to write anything** when any `subject`-class span diverges, and a test
   asserts the §Motivation 3 corruption cannot occur: a record whose numerator moved is never
   rewritten in place.
7. **Diagnostic isolation:** a test asserts that no refusal predicate in the checker reads
   `observedAt`, `corpus.roots`, `corpus.packs`, `corpus.positions` or `rationale` — mutating any of
   the five in a fixture changes no issue, no severity and no exit code. **And a
   `disposition: "superseded"` record whose subject span diverges by any amount produces no issue and
   no exit-code change** (§4e), while the same record with an unresolvable `supersededBy` produces
   `MEASUREMENT_SUPERSEDED_BY_UNRESOLVED` at error — the two halves of the carve-out, asserted
   together so neither can be widened without the other failing.
8. `validateClaimBindings` called **without** a census report emits `CENSUS_ASSERTION_DEFERRED`
   (severity `"info"`, which requires the `SourcingIssue.severity` widening in §0) for a `census.*`
   span, emits **no** `CLAIM_ASSERTION_UNRECORDED`, and the deferred span contributes to **neither**
   `CLAIM_LABEL_UNEARNED` nor `CLAIM_AUTHOR_LABEL_REQUIRED`. **Asserted at both call sites** —
   `sourcing/check.ts` and `pack-registry.ts` — and at the registry a further assertion that the
   deferred span produces no `claimBackings` entry and no change to `PackRecord`, which is what makes
   §Exploration gate's "no learner-visible behaviour" true rather than assumed.
9. `MEASUREMENT_RATIONALE_NOT_BINDABLE` fires on a record whose `pointer` addresses a `rationale`;
   `MEASUREMENT_ILLUSTRATIVE_IN_TEACHING` fires on an `illustrative` span in a record pointing at
   `plans[].description` or `plans[].success.note`; `MEASUREMENT_SUBJECT_UNRESOLVED` fires on a
   record whose `subject` addresses a `plans[].success.signature` that is `null`; and
   `CLAIM_SPAN_ABSENT` fires on a record whose span text is not a substring of the prose its
   `pointer` addresses — **the last of these being the defect that made the draft's own §5b example
   invalid**, and the reason it is a criterion rather than a note.
10. `make expression-census` with no flags emits a report **byte-identical** to HEAD's for the current
    corpus, with the same exit code.
11. `make verify` includes `census-check`; the test named *"reuses the shipped walker and leaves the
    verification gate report-free"* passes, **strengthened** per §6d to assert that no `verify`
    dependency's exit code reads `totals.unsatisfiable` or any `observations` member.
12. `census-check` on the tree as landed reports `totals.declared: 0`, `errors: 0`, and
    `undeclaredTokens > 0`, and exits **0** — proving the residue is a warning and the landing commit
    is content-neutral.

---

## Open questions

1. **Should packs get the `measurements` surface too, or keep using `claimBindings`?** Two pack
   documents carry census readings today: `nimzo-doubled-c-pawns` (`provenance/sources/6`) and
   `grunfeld-exchange-fianchetto` (`planClasses/0/description`). `claimBindings` lives in the
   `evidence.json` sidecar, and `validateClaimBindings` refuses any pointer outside
   `/feedbackClaims/{i}/text` (`CLAIM_POINTER_INVALID`) — so **neither pack claim is bindable by the
   shipped mechanism**, and **neither pack has a sidecar at all** (32 of 153 files in
   `content/drafts/` are `.evidence.json`; neither of these two is among them). Three options: widen `CLAIM_POINTER_INVALID` to the
   `PROSE_POINTERS` set (touches `claim-backing`'s surface while it is `implementing`); give packs the
   same `measurements` property (costs pack lane 0.28, which §0 promised to leave free); or defer.
   **This RFC defers, and the deferral is the reason §0 can claim no pack lane** — that trade should
   be ruled on explicitly rather than inherited. Resolve before `accepted`.
2. **Is `subject` too narrow?** §4b restricts it to `/trigger` and `/plans/{i}/success/signature` —
   the two sites `shapeSubjects` emits. Readings about the corpus as a whole
   (`census.corpus@v1`, e.g. *"827 authored spine positions across 56 packs"*) have no natural
   subject and would need `subject` to admit a whole-corpus form or become optional. A sentinel
   (`subject: "/"`) is the cheap answer and it is ugly. Resolve before `accepted`.
3. **`CLAIM_ASSERTION_UNDECLARED` as a warning on shape entries — for how long?** §4e and §8 justify
   the warning on blast radius (263 tokens). Packs escalate the same code to an error at
   `reviewStatus: "published"`; shape entries have **no** `reviewStatus` and no promotion gate, so
   there is no natural moment for the warning to become an error. Either shape entries gain a review
   status (a real format decision, out of scope here) or the warning is permanent, which is a weaker
   guarantee than packs get. **Named as a real asymmetry, not resolved.**
4. **Does `census.firesInShape@v1` belong at all?** `coverage.inShape` is present only when the
   subject carries a `trigger`, so the assertion is undefined for pack-hosted subjects and for a
   trigger subject itself. It is included because `fianchetto-g7`'s note distinguishes corpus-wide
   from in-shape firing, but a kind that is undefined for two of three subject classes may be worse
   than making authors cite the two numbers separately. Resolve before `accepted`.
5. **`illustrative` and the residue sweep interact in a way that could be abused.** An author facing
   `CLAIM_ASSERTION_UNDECLARED` can silence it by marking the numeral `illustrative` instead of
   measuring it. §4c's two constraints (no rendering as evidence, refused in teaching prose) limit
   the damage, and `census-check`'s per-document counts make the choice visible, but nothing *stops*
   it. Should `records.documents` carry an `illustrative` count, printed alongside `declared`, so the
   escape hatch is at least as visible as the thing it evades? Probably yes; deferred to
   cross-review.
6. **The evaluator-semantics residue (D377).** §4f refuses an instrument-version field on the ground
   that a record can only ever be checked against the running evaluator. The consequence is that a
   change to `matchesStructuralExpression`'s semantics silently changes every reading in the corpus,
   and the only signal is that many records diverge at once. `census-check` would report that as N
   errors with no indication of a common cause. Is a "many records moved in one commit" heuristic
   worth building, or is that a reviewer's job? Deferred, with the row filed.
7. **D161's standing rule has no home.** §9 states that this RFC cannot lint process documents and
   explains why. The rule — *worked examples in ledger and design tier are claims and must carry
   their provenance or be marked synthetic* — is genuinely load-bearing (it is the rule D154 and
   D161 both violate) and is currently written down only inside the row that reports the violation.
   **Owner-facing:** it belongs in `CLAIM.md`-tier guidance or in `design/research/README.md`'s
   citation rules, and placing it is a law-5 act this RFC has no standing to perform.

---

## Changelog

- 2026-08-16: created. Claims shape-entry schema **0.4** and nothing else; leaves pack lane **0.28**
  free; `STORAGE_VERSION` stays **22**. Corpus figures (56 packs / 827 positions / 25 shape entries /
  192 subjects, and every per-subject reading in §Motivation) produced first-hand from
  `make expression-census` against the working tree.
