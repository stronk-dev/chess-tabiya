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
  was minted.
- **Depends on:** `rfc/claim-backing.md` (**status `implementing`; the mechanism this RFC extends is
  already in the tree** — `apps/server/src/sourcing/claim-binding.ts`, `CLAIM_ASSERTION_KINDS`,
  `ClaimBinding`, `validateClaimBindings`; pack schema **0.26 has landed**, see §0's correction);
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

- **Six** — `doubled-c-pawns`, `iqp-black`, `maroczy-bind`, `pawn-opposition-key-squares`,
  `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura` (eight subject readings across six
  entries by numerator) — had an **unchanged numerator**. Only the denominator moved. Wave F edited
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
authored spine positions … It stands alone deliberately"*, and `sources[3]` says
*"**SUPERSEDED** … the entry now records **8** firings of 827"*. Had a tool silently rewritten the
numeral in `sources[2]` from `0` to `8`, the sentence would read *"its trigger fires on 8 of 827 …
It stands alone deliberately"* — the number correct, the proposition inverted, and **the defect now
invisible instead of merely wrong**.

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
3. **`validateClaimBindings` takes `(pack, ledger)`.** Every shipped assertion resolves against a
   record in *this pack's* ledger. A census reading is a fact about **all 56 packs at once**, and
   `sourcing-check` never holds more than one.

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
| **Shape-entry schema** | **0.4** | `urn:chess-tabiya:schema:shape-entry:0.3` → `:0.4`; `SHAPE_ENTRY_SCHEMA_VERSION` (`packages/schema/src/index.ts`) and the pin in `packages/schema/src/shape-entry.test.ts` move with it. **One additive optional top-level property, `measurements`, plus one `$defs/measurementRecord`.** |
| **Pack schema** | **NONE** | `DRILL_PACK_SCHEMA_VERSION` reads **`0.26`** in the tree. **0.28 remains the next free lane and this RFC leaves it free.** |
| **Run schema** | **NONE** | Nothing is persisted. No event, no event field, no vocabulary value. |
| **Migration** | **NONE** | `STORAGE_VERSION` reads **22** (`apps/server/src/storage.ts`, `export const STORAGE_VERSION = 22`). Untouched. If a later revision needs one it takes `STORAGE_VERSION + 1` **at landing**, per the register's standing rule; it needs none. |
| **`EvidenceKind`** | **NONE** | `EVIDENCE_KINDS` is untouched at seven members. **No record is written by anything here** (§4a explains why a census reading is not a record). |
| **Ledger schema** | **NONE** | `tabiya.sourcing.evidence.v1` is unchanged. `claimBindings` is read, never reshaped. |
| **`CLAIM_ASSERTION_KINDS`** | **+6 members** | A **code-level frozen array**, not a versioned resource — the same standing that `rfc/archive/opening-evidence-path.md` §0 gives `EVIDENCE_KINDS`. §3b. |
| **Refusal codes** | **+7 new, 6 reused** | §7 carries the register and its collision sweep. **Sweep run 2026-08-16 across `apps/`, `packages/`, `schemas/`, `rfc/`, `docs/`, `content/`, `design/`, `planning/` and `tools/`: all seven new literals occur zero times**, and no `census.*` assertion kind exists in `CLAIM_ASSERTION_KINDS`. |
| **Census report schema** | **`tabiya.authoring.census.v1` unchanged in default mode** | §6b adds a *second* top-level key only in the new `--check` mode; the default report is byte-identical. |
| **Makefile** | **+1 target**, `census-check` | `verify` gains it. §6d treats the shipped test that pins `verify` free of `expression-census`. |

**Three register facts a reviewer should re-derive rather than trust, because the brief this RFC was
written from was one lane stale and `rfc/README.md` is behind the tree:**

1. `packages/schema/src/index.ts` reads `DRILL_PACK_SCHEMA_VERSION = "0.26"` and
   `schemas/drill_pack.schema.json`'s `$id` reads `…drill-pack:0.26`. **`claim-backing`'s 0.26 has
   landed**, though the README register still lists it as *claimed*. 0.27 (`pack-graduation`,
   accepted) is unlanded. **0.28 free** — corroborated independently by `rfc/dead-vocabulary.md` §6
   and `rfc/teacher-surface.md` §10.
2. **No active RFC claims a shape-entry schema version.** `dead-vocabulary` records
   *"Shape-entry schema | **NONE**"*; `pack-graduation` records *"**Shape-entry schema: nothing.**"*;
   the other seven do not mention the file as a target. **0.4 collides with nothing.**
   `vocabulary-wiring`'s `plan_signature` leaf *did* land inside `schemas/shape_entry.schema.json`
   without a shape-entry register row — filed as **D376** (§12) so the next drafter is not misled by
   the register's silence.
3. **This RFC does not edit `rfc/README.md`.** The register rows it requests are in §11; the file's
   single writer lands them.

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
> **four findings and zero false alarms**. `measuredAt`, `packs` and `positions` are kept, because
> a human reading the file wants them and a refusal message wants them, but §4e makes them
> **diagnostic and unreadable by the gate**, which is the difference between the obvious answer and
> a correct one.

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
| `census.corpus@v1` | `{select: "packs" \| "positions" \| "shapeEntries"}` | the matching key of `corpus` | **cardinal** |

`args.file` is the census's own `displayPath` form — repo-relative, e.g.
`content/shapes/fianchetto-g7.json` — so a record and a report join on a string neither has to
normalise. `args.pointer` is the census's subject pointer, e.g. `/trigger` or
`/plans/0/success/signature`.

**Cross-document references are first-class and this is deliberate.** `iqp-black`'s note cites
*"iqp-white … 12 across three packs"* and *"carlsbad 41"* — readings of **other entries' subjects**.
Because `args` carries `file`, that citation binds:
`{kind: "census.firesInPack@v1", args: {file: "content/shapes/iqp-white.json", pointer: "/trigger", pack: "…"}}`.
A `{measuredAt, packs, positions}` stamp could not have expressed it, and those cross-entry readings
are the ones wave F found hardest to keep true.

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
  observation vocabulary — `NEVER_FIRES_IN_CORPUS`, `FIRES_ONLY_OUTSIDE_SHAPE`, `FIRES_ON_MAJORITY`,
  `FIRES_ON_DEGENERATE`, `IN_SHAPE_DENOMINATOR_EMPTY`, `UNSATISFIABLE` — reads as a grade. Binding
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
  corpus"*, which is a judgement wearing a number's clothes. An author computing a percentage writes
  it as an `authored` span and is caught by the shipped `CLAIM_READING_UNATTRIBUTED` — *"a rate cannot
  be routed as authored judgement"* — which is the correct outcome, not a gap.

> **The law-8 line for this RFC, stated once:** a measurement record carries **integers, JSON
> pointers, file paths and a timestamp**. It has no field that can hold a chess claim, a quality
> judgement, or an instrument's own observation label, and §3a's return types make that structural
> rather than a matter of discipline.

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
    "disposition": { "enum": ["measured", "abstained"] },
    "abstention":  { "enum": ["population_below_floor", "instrument_unavailable", "out_of_range"] },
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
`assertion` (schema `if`/`then`), and `disposition: "measured"` forbidding `abstention`.

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
The vocabulary is drawn from the shipped `ABSTENTION_REASONS` rather than invented — `out_of_range`
and a floor case — so the two paths use one language.

**This is the format half of D151 and only the format half, stated precisely.** D151 measures that
the 100-game explorer floor sits where timing windows live: `maroczy-bind-white-squeeze` completes
readiness at **80** games, `iqp-white-panov-attack` at **29** with its arrival close firing at **12**
(the row's own measurements, labelled as the row's — this RFC ran no explorer query). What this RFC
supplies is the ability to **write that down as a reading** rather than as silence, so a reviewer can
tell *"measured, population 29, below floor, abstained"* from *"nobody looked"*. What it does **not**
supply is the authoring-time warning that would have told the author before they chose the window
depth — that is explorer-side work on a different instrument, and §9 routes it rather than sketching
it.

#### 4e. The two halves, and the answer to *warn / refuse / recompute*

> **Normative half — the gate reads it and may fail on it:** `textSha256`, and every `spans[]`
> entry's agreement with its recomputed assertion.
>
> **Diagnostic half — the gate may print it and may never fail on it:** `observedAt`, `corpus.roots`,
> `corpus.packs`, `corpus.positions`.

An implementer must be able to check that mechanically, so the rule is: **the checker's failure
paths may reference `textSha256` and `spans` only.** A test asserts that no diagnostic field appears
in any refusal predicate (§Acceptance, criterion 6).

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
- it preserves `docs/expression-census.md`'s standing promise that *"the census never writes
  content"* by living behind an explicit flag, and the default and gate modes still never write;
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
| `observedAt` | none — but a refusal message that cannot say *"recorded 2026-08-16"* is a worse refusal | keep, **diagnostic** |
| `corpus.{roots,packs,positions}` | none — the check re-derives them | keep, **diagnostic**; a refusal wants to say *"the corpus moved 694→827"* |
| `rationale` | none of the four — it is **D103's** field, and it is human-only prose | keep, human-only (§5b) |
| `corpus.digest` | none; §2a measures it as strictly worse than re-derivation | **refused** |
| an instrument version | none. `census.*` values come from the checkout's own `expression-census` and `matchesStructuralExpression`; a record cannot be checked against a *different* version of the evaluator than the one running, so recording one would produce a field that is always trivially equal to the runtime's | **refused** — and this is the sharpest divergence from the engine record, where `engineVersion` is load-bearing precisely because the binary is not in the repo. **D377** (§12) records the residue: an evaluator-semantics change silently changes every reading, and the only detector is that the readings move — which this RFC does supply, one commit late. |

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

**Two structural refusals in `validateShapeEntry`:**

| Code | Fires when |
|---|---|
| **`MEASUREMENT_POINTER_UNRESOLVED`** (new) | `pointer` does not resolve to a string in this entry |
| **`MEASUREMENT_SUBJECT_UNRESOLVED`** (new) | `subject` does not resolve to a structural expression in this entry |

Both are pure schema-adjacent resolution checks and need no corpus, so they run in `make shape-check`
with no new dependency. Everything requiring the corpus lives in `census-check` (§6).

#### 5b. D103, closed — and what `rationale` may and may not say

D103 asks for *"somewhere to record why its trigger says what it says"*. The record supplies it as
`rationale`, and the record is strictly better than the `triggerNote` the wave tried, for one reason:

> A `triggerNote` is prose about a trigger, attached to nothing. A record's `rationale` is prose about
> a trigger, attached to `subject` and sitting beside spans that are recomputed from that same
> subject. **When the trigger is edited, the spans move and the record refuses — which drags the
> rationale in front of a human's eyes in the same commit that made it stale.** A free-text note
> would have gone quietly wrong in exactly the way D368 measured eleven notes going quietly wrong.

For `rook-4v3-same-side`, whose two `provenance.sources` entries record nothing of D75's fix, the
record is:

```json
"measurements": [{
  "id": "trigger-narrowing-d75",
  "subject": "/trigger",
  "pointer": "/provenance/sources/1",
  "textSha256": "sha256:…",
  "rationale": "Two clauses were added to exclude the Philidor spines the loose form admitted: the trigger constrained rooks, minor/queen absence and open a-d files with no pawn constraint, so its in-shape positions split into a zero-black-pawn group and a three-pawn group, and the pawn-count plan could not fire on the union. Loosening either clause re-opens D75.",
  "spans": [{ "span": "24", "assertion": { "kind": "census.fires@v1", "args": { "file": "content/shapes/rook-4v3-same-side.json", "pointer": "/trigger" } } },
            { "span": "rook-4v3-same-side-hold", "authored": true }],
  "disposition": "measured",
  "observedAt": "2026-08-16T00:00:00.000Z",
  "corpus": { "roots": ["content/drafts", "content/packs"], "packs": 56, "positions": 827 }
}]
```

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
`rfc/archive/opening-evidence-path.md` spends two pages regretting:** `sourcing-check` and
`verify-draft` call `validateClaimBindings` **without** a report and must not be made to build one —
they are per-pack tools and the corpus walk is not theirs. So:

> When `validateClaimBindings` is called without a census report, a `census.*` span is **skipped and
> counted**, never refused. It emits **`CENSUS_ASSERTION_DEFERRED`** (info) naming
> `make census-check` as the tool that checks it, and — critically — **it does not count toward the
> instrument-attribution tallies** that produce `CLAIM_LABEL_UNEARNED` and
> `CLAIM_AUTHOR_LABEL_REQUIRED`, because a deferred span is neither earned nor authored.
> `CENSUS_ASSERTION_UNEVALUABLE` (§3b, error) fires only in `census-check`, where a report is
> guaranteed present.

Without that clause `sourcing-check` would emit `CLAIM_ASSERTION_UNRECORDED` on every valid census
binding, which is the "each tool assumed the other owned it" failure in its exact classic form.

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
  "totals": { "documents": 25, "declared": 0, "errors": 0, "warnings": 0, "undeclaredTokens": 263 }
}
```

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

**Runtime is a gate concern and was measured, not assumed.** The full census over 56 packs / 827
positions / 192 subjects completed inside a single `make` invocation on this machine today, including
the `esbuild` bundle (reported at 94 ms). Check mode adds a per-record pointer resolution and one
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
| `MEASUREMENT_POINTER_UNRESOLVED` | new | error | `shape-check` |
| `MEASUREMENT_SUBJECT_UNRESOLVED` | new | error | `shape-check` |
| `MEASUREMENT_RATIONALE_NOT_BINDABLE` | new | error | `shape-check` |
| `MEASUREMENT_ILLUSTRATIVE_IN_TEACHING` | new | error | `shape-check` |
| `CENSUS_SITE_AMBIGUOUS` | new | error | `census-check` |
| `CENSUS_ASSERTION_UNEVALUABLE` | new | error | `census-check` |
| `CENSUS_ASSERTION_DEFERRED` | new | **info** | `sourcing-check`, `verify-draft` |

That is **seven new codes and six reused**, and §7 is the authority for the list; §0's row is a
summary of it.

**Collision sweep, run 2026-08-16** across `apps/`, `packages/`, `schemas/`, `rfc/`, `docs/`,
`content/`, `design/`, `planning/` and `tools/`: each of the seven new literals occurs **zero** times.
Reusing `CLAIM_SPAN_CONTRADICTED` and
`CLAIM_ASSERTION_UNDECLARED` at a second severity is deliberate — one code, one meaning, severity set
by the caller — and it is the pattern `opening-evidence-path` §4c establishes with
`ENGINE_COVERAGE_INCOMPLETE`.

### §8. Blast radius, measured

**Day one, on landing this RFC alone: zero.** `measurements` is optional, no entry has one, no check
has anything to check, `census-check` reports `declared: 0` across 25 documents and exits 0.

**Day one of the content wave that follows** (separate work, §9): the residue sweep would warn on
**263 digit-shaped tokens across 17 of the 25 shape entries**, concentrated in eleven —
`iqp-black` 35, `maroczy-bind` 34, `fianchetto-g7` 32, `knight-vs-bishop` 30, `doubled-c-pawns` 21,
`pawn-opposition-key-squares` 19, `open-centre` 16, `up-an-exchange` 16, `hanging-pawns` 14,
`london-wedge` 14, `vancura` 14, then a long tail of six entries at 6 or fewer. *(Measured today with
a digits-only subset of the shipped `MACHINE_TOKEN` regex; the full regex also matches SAN, square
names and result words, so the true figure is higher. The subset is stated so the number is
reproducible, not because the full sweep is optional.)*

That is a large number and it is **the correct number: it is the size of the gap, printed**, which is
the reasoning `opening-evidence-path` §5d applies to its own 67 warnings. It is also why §4e makes
the residue a **warning** on shape entries — an error wall would force a content pass into this
RFC's commit, and this RFC's commit changes no content.

**Two entries are wrong at HEAD right now** (`kid-chain-arrangement`, `london-wedge`), and this RFC
does not fix them: fixing a wrong number is a content edit, and the entries also need their
*propositions* rewritten (*"and nowhere else in the corpus"* is false in both). Filed as **D379**
(§12) so the debt is a row rather than an assumption.

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
line. `rfc/pack-graduation.md` (accepted, 0.27) moves all pack digests and re-stamps 32 ledgers;
**this RFC touches neither**, so the two are order-independent.

### §10. Documentation the implementer updates

- `docs/expression-census.md` — the `--check` mode, the `records` key, the subject/cardinal split, and
  the restatement that *coverage is still never graded*.
- `docs/development.md` — `make census-check`, `REFRESH=1`, and its membership in `verify`.
- `docs/drill-pack-format.md` / any shape-entry documentation — the `measurements` property and the
  three span forms.
- `docs/expression-census.md` currently omits the `.browser` fixture convention that
  `corpus.fixturePacks` encodes; correcting that is one sentence and belongs in the same commit.

### §11. Register rows requested (this RFC does not edit `rfc/README.md`)

`rfc/README.md` has a single writer and this RFC does not touch it. The rows it asks that writer to
land, in the register's own form:

- **Active table:** `| measurement-records.md | draft 2026-08-16 — measurement records for corpus
  census readings; shape-entry schema 0.4; claims no pack lane |`
- **Pack-schema register:** no row. **The sentinel row `| — | 0.28 is the next free pack lane |`
  stands unchanged** — this RFC's whole register position is that it does not take it.
- **Shape-entry lane:** the register has **no shape-entry table**. One should exist, because
  `schemas/shape_entry.schema.json` has moved to 0.3 and `vocabulary-wiring`'s `plan_signature` leaf
  landed inside it with no register row of any kind. Requested:
  `| 0.4 | measurement-records.md | claimed 2026-08-16 — additive optional measurements[] plus three $defs; no existing entry changes, no digest moves |`, with 0.1–0.3 backfilled by the writer.
- **Migration register:** no row. `STORAGE_VERSION` stays at **22** and the landing order is
  unaffected.

Two register facts worth the writer's attention while they are in the file, both re-derived from the
tree today and neither this RFC's to fix: the **0.26 row still reads *claimed*** while
`DRILL_PACK_SCHEMA_VERSION` and the `$id` both read `0.26` (landed), and **`dead-vocabulary.md` has
no Active row at all**.

### §12. Ledger rows this RFC opens (law 4)

**Not written to `design/BACKLOG.md` by this RFC.** Concurrent agents collide on the shared ledger,
so the rows are stated here in landing form and claude lands them. The id block **D376–D380** was
taken after verifying that **D371–D375 are occupied** and nothing above D375 exists.

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
2. `DRILL_PACK_SCHEMA_VERSION` reads `0.26`, `DRILL_RUN_SCHEMA_VERSION` is unchanged, and
   `STORAGE_VERSION` reads `22`. A test asserts all three, so the "claims nothing else" register
   promise is enforced rather than stated.
3. `CLAIM_ASSERTION_KINDS` contains the six `census.*` members and **no `census.observation@v1`,
   `census.satisfiability@v1`, or any percentage/ratio kind** — asserted as an exact-set equality so
   a later addition is a deliberate act (§3c, law 8).
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
   `observedAt`, `corpus.roots`, `corpus.packs` or `corpus.positions` — mutating any of the four in a
   fixture changes no issue, no severity and no exit code.
8. `validateClaimBindings` called **without** a census report emits `CENSUS_ASSERTION_DEFERRED` (info)
   for a `census.*` span, emits **no** `CLAIM_ASSERTION_UNRECORDED`, and the deferred span
   contributes to **neither** `CLAIM_LABEL_UNEARNED` nor `CLAIM_AUTHOR_LABEL_REQUIRED`.
9. `MEASUREMENT_RATIONALE_NOT_BINDABLE` fires on a record whose `pointer` addresses a `rationale`;
   `MEASUREMENT_ILLUSTRATIVE_IN_TEACHING` fires on an `illustrative` span in a record pointing at
   `plans[].description` or `plans[].success.note`.
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
