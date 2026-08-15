# RFC: Evidence at runtime — the ledger the runtime already opens and throws away

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16 (drafted continuously from the 2026-08-15 session that measured D118)
- **Design refs:**
  - `design/05-in-run-experience.md` §3 — the assistance ladder, **rung 1** (*"Tablebase (≤7
    pieces) … outside range it must abstain, and abstention is the whole contract"*) and
    **rung 2** (*"Engine evaluation … right about the position and can still be wrong about
    the lesson"*). This RFC supplies the packet's first genuine rung 1 and its first rung 2.
  - `design/05-in-run-experience.md` §3's **engine-condition rule**, four clauses — applied
    clause by clause in §5, including the two that discharge **vacuously** and why that
    vacuity is the design.
  - `design/05-in-run-experience.md` §3a-i — the disclosure model as shipped
    (`feedbackDisclosed` / `feedbackDeliveryOpen`, the three policies, *"the run — not the
    viewer — carries the barrier"*). §4 gates on it and changes none of it.
  - `design/05-in-run-experience.md` §3-forms — *"Honesty attaches to the source. Timing
    attaches to disclosure. Form attaches to neither."* This is the three-gate split in §4.
  - `design/05-in-run-experience.md` §4 — *"the assistance rail says honestly that nothing
    was written about this position"*, and *"a tablebase is decisive at rung 1 and silent at
    eleven pieces"*. §6's absence rule is written against both.
  - `design/05-in-run-experience.md` §6 open question 1 — *"rung 2 reveals the answer, so
    showing it is contamination."* **Ruled, therefore binding on §4's gate; the part that is
    still open (availability of rung 0 on request) is not touched by this RFC.**
  - `design/02-product-shape.md` §UX commitments — the **anti-contamination default**
    (*"hide eval bar, move labels, engine arrows, human frequencies until segment end or
    explicit request"*) and the **two-axis latency budget** (per instrument call vs per
    selection, owner ruling 2026-08-15). Checked in §7; both axes are zero.
  - `design/03-product-breadth.md` §Intelligence and explanation — the display list
    (*"Stockfish evaluation/WDL, MultiPV, tactics, and deep analysis"*, *"Syzygy WDL/DTZ and
    endgame triviality"*, *"LLM wording … constrained to the validated evidence packet"*).
    This RFC supplies the **recorded** half of two entries and explicitly not the rest.
  - `AGENTS.md` §Rejected — *"an engine review screen with a rewind button"*, and law 8 /
    ADR-0005. §2 is written against both.
  - **No `design/` document is edited by this RFC.** One correction to a design-adjacent
    claim is escalated as a ledger row (**D139**) rather than written into `05`, per law 5.
  *Every code site below is cited **by symbol name**; no line number in this document is
  normative. **Every citation and every measurement below is against committed bytes at
  `bc3cdc1`** (2026-08-16), re-derived there after the tree moved during drafting. The
  working tree at that moment is **mid-implementation of `rfc/engine-leverage.md`** —
  `DRILL_PACK_SCHEMA_VERSION` is `0.23`, `DRILL_RUN_SCHEMA_VERSION` is `0.16` and
  `STORAGE_VERSION` is `21` in uncommitted form — and eleven middlegame draft packs are being
  edited. **None of that touches this RFC's citations or its figures:** all five files this
  RFC amends (`pack-registry.ts`, `guidance.ts`, `rest.ts`, `voice.ts`, `capabilities.ts`) are
  **clean**, as are `endgame.ts` and `pivotal.ts`, and the content census is **identical at
  `bc3cdc1` and in the working tree** (32 ledgers, 764 records, 47 authored packs). Locate
  `evidencePacket`, `EvidencePacket`, `voiceCheck`, `renderVoice`, `VoiceScope`,
  `ExternalHttpVoiceProvider`, `PackRegistry.loadDefault`, `PackRegistry.fromDocuments`,
  `PackRecord`, `sidecarPaths`, `optionalJson`, `projectPackDocument`, `assessmentGrounding`,
  `linkage`, `digestDrillPack`, `byDigest`, `transposeKey`, `Node.transposeKey`,
  `classifyPhase`, `structuralReading`, `endgameReading`, `renderEndgameReading`,
  `pivotalMarkers`, `renderPivotalMarker`, `liveAdmitted`, `requireGuidanceDisclosure`,
  `permittedAssistance`, `feedbackDeliveryOpen`, `reasoningReviewAccess`,
  `reasoningDeliveryOpen`, `guidanceAccess`, `authoredPositionPointers`, `evidenceSupports`,
  `EVIDENCE_KINDS`, `EvidenceRecord`, `EvidenceLedger`, `ENGINE_MOVE_LOSS_TEMPLATE_ID`,
  `ASSESSMENT_CATEGORIES`, `countFenPieces`, `CORPUS_GUARD`,
  `DECLARED_UNIMPLEMENTED_POLICY_MODES` and `EngineCapabilities.get` by name, not by number.*
- **Exploration gate:** owner question 2026-08-15 — *"doesn't it have access to ALL the
  info?"* — transformed rather than answered, as `design/BACKLOG.md` row *Widen the evidence
  PACKET, not the LLM's licence* (**D116**), then **measured** as *The evidence ledger and
  the run-time packet are two disconnected worlds* (**D118**) and logged in
  `planning/exploration/log.md` (2026-08-15 entry, *"The finding that outranks the rest"*).
  D118 is a measured defect row, not a GAP row.
- **Ledger rows this RFC closes:** **D118** (the disconnection), and **D116** in the half
  that is mechanical — the packet gains rungs 2 and 1 with `voiceCheck` left binding.
  **D116 does not fully close**: rung 4 stays absent and §8 says why, with a number.
- **Ledger rows this RFC opens** (law 4; **id block D138–D147, issued to this draft; no
  other id is used**): D138, D139, D140, D141, D142, D143, D144, D145, D146, D147 — each
  stated in §9 with its measurement.
- **Depends on:** nothing unlanded. `rfc/archive/content-sourcing-foundation.md` ships the
  evidence ledger, `validateLedger` and `assessmentGrounding`;
  `rfc/archive/opening-evidence-path.md` and `rfc/archive/fixture-realism.md` (D64's closure,
  `8b1b44d`) supply the 391 engine and 341 tablebase records this RFC projects;
  `rfc/archive/adaptive-guidance.md` ships `evidencePacket`, `voiceCheck` and the six
  `VoiceScope` values.
- **Parent / amends:** amends `PackRecord` and `PackRegistry.fromDocuments`
  (`apps/server/src/pack-registry.ts`); amends `EvidencePacket`
  (`packages/runtime/src/voice.ts`) and `evidencePacket` (`apps/server/src/guidance.ts`);
  amends the five packet construction sites in `apps/server/src/rest.ts`; amends
  `Capabilities` (`apps/server/src/capabilities.ts`). **Amends no schema file, no pack
  document, no ledger, and no persisted row.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-at-runtime/` (once implementing)

---

## 0. Register claims — read this before drafting anything adjacent

**This RFC claims NO pack-schema version, NO run-schema version, NO migration, NO new
`EvidenceKind`, and NO new evidence-ref namespace.**

| Resource | Claim | Why not |
|---|---|---|
| **Pack schema** | **none** | No `$defs` entry is added, widened or narrowed. `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts`) is untouched — **0.22** committed at `bc3cdc1`, **0.23** in the uncommitted `engine-leverage` implementation; this RFC is indifferent to which, because it writes neither. No committed pack byte changes; no content digest moves. **0.26 stays free** — this RFC does not take the lane `claim-backing` released. |
| **Run schema** | **none** | Nothing is persisted. No event type, no payload, no `EvidenceKind`, no `EvidenceSource`, no evidence ref. A recorded reading never becomes run evidence — the shipped precedent is `GET /runs/:id/corpus`, which is *"ephemeral … append no run event or evidence"* (`docs/runtime-corpus-evidence.md`). |
| **Migration** | **none** | `STORAGE_VERSION` (`apps/server/src/storage.ts`) is untouched — **20** committed, **21** in the working tree from the RFC ahead of this one. No table, no column, no frozen literal, so the landing order of 21 and 22 is not this RFC's problem. The projection is **derived and never persisted** — the migration-10 precedent cited in `rfc/format-surface.md` §4.4 applies exactly: rung-0 facts, and now recorded readings, are recomputed at load rather than stored. |
| **Ledger schema** | **none** | Read-only. `tabiya.sourcing.evidence.v1` is unchanged; no field is added; all 32 committed draft ledgers validate exactly as today. |
| **`/capabilities`** | payload addition | `Capabilities` gains `recordedReadingKinds`, computed from the admission registry exactly as `guardBasis` is computed by `EngineCapabilities.get`. A payload field is not a versioned resource; it is named here so a reviewer does not have to rediscover it. |

**If you are drafting in parallel: this RFC blocks no lane and rebases against nothing.**
That it needs no version is a **finding**, not a convenience, and it is the same finding
`claim-backing` reached from the other side: D118 reads as a format problem — *the ledger is
a sibling file the runtime cannot see* — and it is not. The runtime **already reads the
file**. It reads it in `PackRegistry.loadDefault`, hands it to `assessmentGrounding`, keeps
one bit of the answer, and drops the other 764 records on the floor. The gap is a discarded
object, not a missing contract.

---

## Summary

`PackRegistry.loadDefault` resolves each pack's `<stem>.evidence.json` through
`sidecarPaths`, reads it with `optionalJson`, and passes it into `fromDocuments`. There it
is consumed by exactly one call — `assessmentGrounding({document, ledger, manifest})` — which
returns a **two-valued string**, `"ledger_verified" | "unverified"`. The ledger object is
then out of scope. `PackRecord` has seven fields and none of them is the ledger. `[V]`

So the runtime pays the file read, pays the parse, pays the digest linkage check, and keeps
one bit out of 764 records. `evidencePacket` cannot reach the other 763 not because a
contract forbids it but because nobody held onto the object.

This RFC keeps the object. At load, each `PackRecord` gains a **position-keyed projection**
of its own ledger: a `ReadonlyMap` from `transposeKey(record.anchor.fen)` to the admitted
readings at that position. Every run node already carries `Node.transposeKey`, so the join at
packet time is one `Map.get` on a string the node already holds — **zero instrument calls,
zero I/O, zero derivation, on both latency axes.**

Three gates keep it honest, and they are deliberately different things: **admission** (may
this record become a reading at all — a property of the record), **disclosure** (may this
reading enter the packet now — a property of the run and the moment, and the *stricter* gate,
because `voiceCheck` makes packet membership a speaking licence), and **presentation** (may
this surface show it — `AssistanceConfig`, which may withhold and may never add).

**Measured `[V]`.** Of the 764 committed records, **732 are admitted** — 391 `engine_eval`
and 341 `tablebase_result` — across **32 packs and 732 positions**, which is **100.0% of the
authored tree, 732 of 732 authored position pointers, with zero gaps and zero duplicates**.
32 `position_legality` records are **refused** as rung-0-recomputable.

**And the honest number, which is the one that decides whether this is worth doing `[V]`.**
The 32 packs' spine lines hold 497 positions with **11,559 distinct legal successors**. The
authored tree covers **700 of them (6.06%)** — 465 spine continuations plus 235 deviation
stubs. **11,094 one-ply-off positions have no record, and beyond that first ply the corpus
contains nothing at all.** Coverage is not sparse; it is **total on a line and empty
everywhere else**. That cliff, not the 732, is what §6 is written against.

---

## Motivation

### The finding, in the form that decides the scope

D118 states the disconnection. Re-derived here rather than quoted `[V]`:

| | measured on the committed tree |
|---|---:|
| `content/drafts/*.evidence.json` ledgers | **32** |
| records in them | **764** — 391 `engine_eval`, 341 `tablebase_result`, 32 `position_legality` |
| records with `grounds: "machine_validation"` | **764 of 764** |
| abstentions | **0** |
| authored packs in `content/drafts/` | **47** — 32 with a ledger, **15 without** (D141) |
| pack documents in `content/packs/` | **0** — the directory holds `.gitkeep` (D138) |
| ledgers read by `PackRegistry.loadDefault` | **all of them** (D142) |
| ledger fields retained on `PackRecord` | **none** |

`evidencePacket` takes `{run, node, pack?, authored, shapes?}` and builds nine fields, of
which exactly one — `sentences` — is consumed downstream: `voiceCheck` joins
`packet.sentences` and validates renderer output against that string alone, and
`ExternalHttpVoiceProvider.render` transmits `{personaPrompt, sentences, scope}` and nothing
else. `[V]` Every other packet field is server-local bookkeeping. **This is D145 and it is
the single most load-bearing implementation fact in this RFC: "widen the packet" means
"widen `sentences`", and a structured field that produces no sentence changes nothing.**

The two consumers of position facts confirm the shape. `classifyPhase(fen)` returns a
material/undeveloped-minor band with `provenanceNote = "Tabiya's phase bands"`.
`structuralReading(fen)` returns a skeleton key, features and structure matches. Both take a
bare FEN. `[V]` At the `evidencePacket` call site, `run`, `node` (with `transposeKey`), `pack`
and `shapes` are all in scope and are simply not passed down; at the route, `access.pack` is
the full `PackRecord`. The information is present at every level above the function that
needs it.

### The correction that makes the payoff larger than D118 claimed

D116 and D119 describe the packet as carrying *"rung 1, tablebase"* via `endgameReading`.
**It does not, and this is D139.** `endgameReading(fen)` calls `classifyPhase`, counts
material, and returns one of five endgame type labels plus up to three technique names, with
`provenanceNote = "Tabiya's material-census convention"`. **It never touches a tablebase, has
no `dtz`, no `dtm`, no `category`, and no piece-count abstention contract.** `[V]` Its
honest rung is **0** — a material census is arithmetic over the position.

So the packet's true rung map at HEAD is **0, 3 and 5** — rung 0 twice (structure, material
census), rung 3 narrowly (`human_divergence` from recorded Maia masses), rung 5 (authored
items). **Rungs 1, 2 and 4 are all absent.** This RFC supplies **1 and 2** from the ledger,
and rung 1 is a genuine gain rather than a duplication: 341 records carrying `category`,
`dtz`, `precise_dtz`, `dtm` and `pieceCount` are strictly more than a material label, and
Syzygy is ground truth where the material census is a naming convention.

The correction is escalated as a row, not written into `design/05`, per law 5.

### Why now, and why this scope boundary

D120 is the sequencing argument: `VoiceScope` has six values and all of them construct the
same packet, so **nothing needs new wiring to reach a surface.** D116 is the safety argument:
`voiceCheck` validates renderer output against the packet, so more validated facts in the
packet is law-8-legal **by construction**, and loosening `voiceCheck` is the named
anti-pattern. This RFC does not touch `voiceCheck`.

**Explicitly out of scope**, each with its reason:

- **Any condition, threshold, trigger or grade.** A recorded reading is stated, never
  compared against a trigger point. The engine-condition surface is
  `rfc/engine-leverage.md`'s (accepted, pack 0.23 / run 0.16 / migration 22) and §11 states
  the boundary in one sentence.
- **Any cross-node arithmetic** — swings, losses, deltas, ranks, "this move cost X". §3.5
  makes this a normative refusal rather than an omission, and §11 explains why the same
  arithmetic is legitimate in `engine-leverage` and illegitimate here.
- **Binding a record to authored prose.** `rfc/claim-backing.md`'s territory
  (`claimBindings`, the assertion registry, the residual sweep). This RFC **never reads
  `record.supports`** — §11.
- **Rung 4.** No `explorer_frequency` record exists anywhere in the repository (0 across all
  ledgers, measured by `claim-backing` §1.3b and re-derived here `[V]`). Under the rung
  rule's own clause 1 that is a **refusal**, not a deferral — §5.1, §8.3.
- **The `compare` scope.** Its packet replaces `sentences` wholesale with
  `comparisonNarrative` output, and it is the one scope where several nodes are in view at
  once, i.e. where cross-node differencing is tempting. Deliberately not extended; Open
  question 3.
- **Promoting `content/drafts/` to `content/packs/`.** A content wave (D138). The mechanism
  is empty-corpus-safe; its payoff is contingent on that wave and §8.4 says so with a number
  rather than assuming it away.
- **Any change to `voiceCheck`, `renderVoice`, the provider seam, or the fallback.**

---

*Template mapping (`rfc/template.md`): **§§1–8 are the Specification section**, in the
numbered form the in-flight convention uses (`rfc/engine-leverage.md`, `rfc/teacher-surface.md`).
§9 is the ledger rows this RFC opens, §10 Deviations from design, §11 the sibling boundaries.
Every other template section is present and in order.*

## 1. Law 8, stated as a constraint on this specification

Every value this RFC moves is an **instrument measurement about a stated position, taken at a
stated time, by a named instrument, and recorded with its provenance before this run
existed.** Nothing here creates a strategic claim, grades a move, or renders an opinion.

Four consequences are enforced structurally rather than by convention:

1. **No move token enters the packet.** The frozen sentences of §3.6 contain no square, no
   UCI and no SAN. This matters mechanically, not just aesthetically: `voiceCheck` extracts
   `SQUARE`, `UCI` and `SAN` tokens from renderer output and refuses any that is not a
   substring of `packet.sentences`. A move-free sentence therefore widens the renderer's
   licence *about moves* by **exactly zero**. Acceptance criterion 5 asserts it over all 732
   records. **This is the precise, checkable form of D116's "widen the packet, never the
   licence".**
2. **The instrument's choice among moves is refused at the admission gate, by shape.** A
   `tablebase_result` record's `values` carry position scalars only — verified: the shipped
   producer writes `{category, checkmate, dtm, dtz, precise_dtz, fen, insufficient_material,
   pieceCount, stalemate}` and **no `moves[]`** `[V]`. The one record shape in the repository
   that *does* carry a ranking is the `engine-move-loss/v1` template, whose values include
   `bestSan` and a ranked `candidates[]`; §3.3 refuses it by `templateId`. **0 templated
   records exist** (`claim-backing` §1.3b, re-derived `[V]`), so the fence costs nothing today
   and closes the door before it is opened. This is the same measurement/verdict line
   `engine-leverage` §3.2 C3 draws, applied at a different gate.
3. **Every rendered value carries its instrument, its units, its perspective and its
   retrieval date, and none carries a verdict.** The shipped `CORPUS_GUARD` sentence
   (`apps/web/src/lib/corpus-sentences.ts` — *"These counts say what this population played,
   not what is good."*) is the model, and §6.3 extends the pattern rather than inventing a
   second guard.
4. **Absence is unspeakable, not spoken.** §6.1. There is no "no reading was recorded"
   template, because absence at a position is a fact about the author's query budget, not
   about the position.

**The residual, named rather than denied (D146).** `voiceCheck` is a **token-membership**
check, not a proposition check: it verifies that every square, move, chess noun, judgement
word and prescriptive verb in the output already appears in `packet.sentences`. It cannot
stop the renderer from *joining* two admitted facts into a claim neither record makes. That
residual is pre-existing, but this RFC raises its cost, because a centipawn number is exactly
the kind of token that invites a causal join. Two mitigations, neither of which is a fix:
the frozen sentence carries *"when this pack was authored"*, so any join inherits the past
tense and the attribution; and `BANNED_JUDGEMENTS` and `PRESCRIPTIVE_VERBS` already refuse
the vocabulary such a join would need. **The honest statement is that this is the ceiling of
a token-membership check over free prose** — the same ceiling `claim-backing` §2 names for
its span binding, in that RFC's own words: *"it does not guarantee that the sentence composed
from those fragments is true."* Ledgered as D146 rather than resolved here.

The anti-pattern named in `AGENTS.md` — *"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes
the knight'"* — is a dashboard because the third line is manufactured and the first two are
printed unconditionally. This RFC adds no third line, and §4 makes sure the first two are
never unconditional.

---

## 2. The join: candidates, and the one that is chosen

A pack's ledger is **authored, static and digest-bound**; a run is **live**. The honest join
has to say where the two meet, what it costs, what it caches, and what happens when the
static thing is stale. Five candidates were evaluated. Each is stated, then the thing it
gets wrong is named.

**(A) Load-time position projection, cached on `PackRecord`. — CHOSEN.** At
`PackRegistry.fromDocuments`, where `ledger` is already in hand, build a
`ReadonlyMap<string, readonly RecordedReading[]>` keyed by `transposeKey(record.anchor.fen)`
and store it on the record. `evidencePacket` receives it and looks up `node.transposeKey`.
*Cost:* zero added I/O — the read, the parse and the linkage check **already happen** (D142).
One `Map` of at most 53 entries per pack, built once per process, alongside the
`digestDrillPack` the registry already computes. *Cache:* the `PackRegistry`'s own
`#records` / `#digests` maps, held for process lifetime, which is where every other derived
pack fact already lives. *Staleness:* structurally impossible, see §2.1.

**(B) Per-node on-demand resolution.** Open the ledger when a node needs it.
*Gets wrong:* it puts file I/O on the packet path, which is the one path
`design/02`'s budget is about; it needs a cache to be viable, which makes it (A) with worse
failure timing; and it converts a **load-time** refusal (a stale ledger is refused once, at
startup, for every run) into a **request-time** one (a stale ledger is discovered mid-run, by
a learner). **Rejected.**

**(C) Merge the records into the pack document at load.** Inline them so everything travels
together. *Gets wrong:* `projectPackDocument(document, grounding, channel, publisherHandle)`
builds the `GET /packs/:id` wire projection **from the document**, and that projection is the
shipped anti-contamination boundary — *"`GET /packs/:id` never contains authored annotations,
deviations, plan classes, claims, concepts, checkpoint triggers, or other pre-play
commentary"* (`docs/explanation-grounds.md`). Putting engine evaluations into the document
would leak them to a pre-play, unauthenticated projection **by construction**, and the leak
would be a default rather than a bug. **Rejected, and this is the decisive rejection.**

**(D) Replay the records into the run as `evidence.attached` events at run start.** Make the
corpus's readings look like the run's own. *Gets wrong three things at once:* it makes an
authored 2026-08-14 measurement **indistinguishable on the run log** from a live one taken
this second; it makes ledger readings **condition-referenceable**, colliding head-on with
`engine-leverage`'s C1 and with `design/05`'s clause 1 (§5.1); and it persists derived data,
forcing a run-schema version and a migration for values that need neither. **Rejected**, and
§5.1 gives the coverage argument that makes the rejection principled rather than
conservative.

**(E) Precompute the index at authoring time and commit it as a third sidecar.**
*Gets wrong:* a fourth committed artifact and a second digest-linkage rule, for a projection
that is a pure function of a file already committed. The migration-10 precedent for
derived-not-persisted values, cited in `rfc/format-surface.md` §4.4, says do not persist what
you can recompute. It would also fork the ledger's single source of truth, which is the
defect `claim-backing` §3.1 avoids for the same reason. **Rejected.**

### 2.1 Staleness, and why it cannot arise

The pack's ledger declares `packDigest`; `linkage` and `assessmentGrounding` already compare
it to `digestDrillPack(document)` and return `"ledger_verified" | "unverified"`. `[V]`

> **Normative.** The projection is built **only** when `assessmentGrounding === "ledger_verified"`.
> Otherwise the index is **empty** — not partial, not best-effort. One predicate, two
> consumers, and they can never disagree because they are computed from the same in-memory
> object in the same call.

And a run cannot drift away from the pack whose ledger was verified:
`RunService.#registeredPack` resolves a run's pack through
`this.#packRegistry?.byDigest(run.packDigest)` `[V]`, so a run is already pinned to the exact
document version the linkage check passed. **A live run and a static ledger cannot desynchronise
because the run is keyed by the digest the ledger names.** That is the honest answer to
"static artifact, live run", and it required no new mechanism — only noticing that the
existing one already covers it.

### 2.2 The key, and the one place it is not enough

`transposeKey(fen)` is `canonicalFen(positionFromFen(fen)).split(" ", 4).join(" ")` — piece
placement, side to move, castling rights, en-passant square. It **drops the halfmove clock
and the fullmove number**. `[V]` Every `Node` carries `transposeKey` as a stored field, and
`guard.ts` already keys authored anchors by it. So the key is free on both sides.

Dropping the fullmove number is correct: no instrument's answer depends on it. Dropping the
**halfmove clock** is not always correct, and the rule splits by kind:

- **`engine_eval` — admitted on `transposeKey` alone.** The reading is attributed to
  `reading.fen`, the FEN the engine was actually given, and §3.6's sentence names the
  retrieval date rather than asserting the clocks agree. Measured context: all 391
  `engine_eval` records live in the 17 opening packs `[V]`, where a clock difference at the
  same position is not a difference the search is about.
- **`tablebase_result` — admitted only when the halfmove clock matches exactly.** DTZ is
  defined relative to the fifty-move counter — it is precisely why the source distinguishes
  `dtz` from `precise_dtz` — so a DTZ read at a different clock is a different fact.
  Normative: `node.fen`'s fifth field must equal `reading.fen`'s fifth field, or the reading
  is not admitted at that node.

The strict rule is expected to cost nothing on the authored tree, because records are
produced by `enumerate` replaying the same move sequence the run replays; **the
implementation must measure that rather than assume it** (Open question 2, acceptance
criterion 11).

---

## 3. The projection

### 3.1 The shape

`PackRecord` gains one field. It is the eighth, and it is the first that is not a scalar or
the document:

```ts
export interface RecordedReading {
  readonly kind: "engine_eval" | "tablebase_result";
  readonly fen: string;          // the FEN the instrument was given, verbatim from anchor.fen
  readonly sourceId: string;     // "stockfish-authoring" | "syzygy" — joins the sources manifest
  readonly retrievedAt: string;  // when the instrument answered, verbatim from the record
  readonly values: EngineReadingValues | TablebaseReadingValues;  // narrowed, §3.4
}

export type PositionEvidenceIndex = ReadonlyMap<string, readonly RecordedReading[]>;
//                                              ^ transposeKey(record.anchor.fen)
```

`PackRecord.positionEvidence: PositionEvidenceIndex` — an empty map when the pack has no
ledger, when the linkage fails, or when no record survives admission. **`PackRecord` gains no
other field, and `projectPackDocument` gains no parameter.**

### 3.2 Where it is built

In `PackRegistry.fromDocuments`, immediately after the existing
`const grounding = assessmentGrounding({document, ledger, manifest})` and before the record
is frozen. The ledger object is in scope there today and is discarded on the next line; this
RFC is, mechanically, the deletion of that discard.

`PackRegistry.loadDefault` is unchanged. So is `sidecarPaths`, so is `optionalJson`, so is
the `SIDECAR_BASENAMES` skip list, so is every path that decides *which* packs load.

### 3.3 Admission — five gates, all total, all cheap

A record becomes a `RecordedReading` when **all five** hold. A record failing any gate is
dropped silently at load; it is not an error, because a ledger may legitimately carry records
this projection has no use for.

1. **Linkage.** `assessmentGrounding === "ledger_verified"` (§2.1). Applies to the whole
   ledger, not per record.
2. **Kind.** `record.kind ∈ {"engine_eval", "tablebase_result"}`. The admission registry is
   §5.1's; every other member of `EVIDENCE_KINDS` gets a published refusal row with a reason.
3. **Grounds.** `record.grounds === "machine_validation"`. A `citable_source` record is a
   citation, not a measurement, and belongs to rung 5. All 764 committed records pass `[V]`;
   the gate exists because the field exists.
4. **No template.** `record.templateId === undefined`. This refuses `ENGINE_MOVE_LOSS_TEMPLATE_ID`
   (`engine-move-loss/v1`), whose values carry `bestSan` and a ranked `candidates[]` — the
   instrument's **choice among moves**, which is a verdict (§1 consequence 2). 0 exist today.
5. **Anchor.** `record.anchor.fen` is present and `transposeKey(record.anchor.fen)` computes
   without throwing. **Expressed through `transposeKey` deliberately, not through
   `positionFromFen`:** the runtime package exports `canonicalFen` and `transposeKey` and
   **does not export `positionFromFen`** `[V]`, and `transposeKey` already calls it and
   already throws `TypeError` on an unparseable FEN — so the gate is the key computation
   itself and needs no new export. This also refuses `{spineNodeId}` anchors, which are not
   position-keyed; all 52 in the repository are in `content/candidates/`, which
   `PackRegistry` does not load `[V]`.

**`record.supports` is not read.** Not at admission, not at lookup, not anywhere. That is the
mechanical boundary against `rfc/claim-backing.md` (§11.2).

### 3.4 Value narrowing — an allow-list, not the raw bag

`EvidenceRecord.values` is `Readonly<Record<string, unknown>>` `[V]`. Carrying it through
unnarrowed would let any future producer put anything into a learner-facing packet. So the
projection copies an explicit allow-list per kind and **drops everything else**:

```ts
export interface EngineReadingValues {
  readonly centipawns?: number;      // exactly one of centipawns | mateIn
  readonly mateIn?: number;
  readonly depth: number;
  readonly multiPv: 1;
  readonly perspective: "white";
  readonly engineId: string;
  readonly engineName: string;
  readonly engineVersion: string;
}

export interface TablebaseReadingValues {
  readonly category: (typeof ASSESSMENT_CATEGORIES)[number];   // the five determinate values
  //          ^ there is no `AssessmentCategory` type in the repo; `ASSESSMENT_CATEGORIES`
  //            (`apps/server/src/tablebase.ts`) is a frozen tuple over `TablebaseCategory`.
  //            Spelled as an indexed access so no new type name is invented.
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly dtm: number | null;
  readonly pieceCount: number;
  readonly checkmate: boolean;
  readonly stalemate: boolean;
  readonly insufficientMaterial: boolean;
}
```

Two narrowing refusals are normative and both follow shipped precedent:

- **`engine_eval` is refused unless `perspective === "white"` and `multiPv === 1`.** These are
  exactly the two conditions the shipped backing test in `ledger-validation.ts` already
  requires of any `engine_eval` record admitted as backing, and `sourcing-check` already
  refuses any other `perspective`. `[V]` The projection does not invent a normaliser; it
  refuses what the checker already refuses. *(Noted because `engine-leverage`'s cross-review
  found an earlier draft attributing this to a helper named `whitePerspectiveScore` that does
  not exist — there is no normalising function, only a stamped literal and a refusal.)*
- **`tablebase_result` is refused unless `category ∈ ASSESSMENT_CATEGORIES`** — the five
  determinate values `apps/server/src/tablebase.ts` declares. The indeterminate values
  `verifySyzygyDraft` already refuses (`syzygy-win`, `maybe-win`, `maybe-loss`, `syzygy-loss`,
  `unknown`) make the reading absent, which is rung 1's own contract in `design/05` §3:
  *"outside range it must abstain, and abstention is the whole contract."*

`pieceCount` is carried because it is what makes the abstention contract checkable at the
surface, not because a sentence quotes it in isolation.

### 3.5 Lookup — and the arithmetic that is refused

`evidencePacket` gains one optional input and one packet field:

```ts
evidencePacket(input: {
  run, node, pack?, authored, shapes?,
  readonly packEvidence?: PositionEvidenceIndex,   // access.pack.positionEvidence
}): EvidencePacket
```

```ts
// packages/runtime/src/voice.ts — EvidencePacket gains one field
readonly readings: readonly RecordedReading[];
```

The body is one lookup:

```
readings = packEvidence?.get(node.transposeKey) ?? []
           filtered by §2.2's clock rule for tablebase readings
           filtered by §3.7's live-wins rule
           gated by §4
```

> **Normative refusal — no cross-node arithmetic.** The projection, the packet and every
> renderer downstream may state a reading **at a node** and may never compute a difference,
> swing, loss, delta, rank or ordering between two readings, at any two nodes, in any
> direction. No `before`/`after` pair is formed. No parent's reading is consulted.
>
> **This is the whole boundary against `rfc/engine-leverage.md`, and the reason is coverage,
> not taste.** That RFC differences measurements **the run itself took** at both ends of a
> decision triple, where coverage is symmetric by construction — if the run measured one end
> it measured the other, and if it measured neither the condition is silent (its C2). This
> RFC states readings **the corpus recorded**, where coverage is asymmetric by construction:
> §8.2 measures that 6.06% of one-ply successors are recorded and the rest are not. A
> difference taken across that boundary is a number about **the author's query budget**, not
> about the game — and it would be at its largest exactly where the learner left the authored
> line, which is where it would read as a verdict on leaving it. Structurally: `evidencePacket`
> takes **one** `node`, so a second node's reading is not even in scope, and criterion 8 pins
> that it stays that way.

### 3.6 The sentences — frozen templates, no LLM, no move tokens

`renderRecordedReading(reading: RecordedReading): readonly string[]`, in
`packages/runtime/`, alongside `renderEndgameReading` and `renderPivotalMarker`, which are the
shipped pattern for machine prose over record values — *"frozen strings over record values,
which is the one form of machine prose ADR-0005 permits"* (`claim-backing` §3.6).

```
engine, score:
  "Recorded reading at this position: Stockfish 17.1 at depth 22, single line, scored
   +0.54 from White's side when this pack was authored on 2026-08-14."

engine, mate:
  "Recorded reading at this position: Stockfish 17.1 at depth 22, single line, reported
   mate in 6 from White's side when this pack was authored on 2026-08-14."

tablebase:
  "Recorded reading at this position: Syzygy, 5 pieces — win from White's side, DTZ 14,
   DTM 39 — queried when this pack was authored on 2026-08-14."

tablebase, no DTM published:
  "Recorded reading at this position: Syzygy, 5 pieces — draw from White's side, DTZ 0 —
   queried when this pack was authored on 2026-08-14."
```

Every token comes from the record. Six properties are normative:

1. **No square, UCI or SAN token appears in any arm.** Criterion 5.
2. **No move is named**, so the reading cannot be read as a recommendation.
3. **The instrument is named**, with its version and its search bound.
4. **The perspective is named** — *"from White's side"*, because `perspective` is a stamped
   literal and the reader must not assume it is their own side.
5. **The tense is past and the occasion is stated** — *"when this pack was authored on
   `<date>`"*. This is the sentence's honesty load: it says the number is about a position
   the author queried, not about this run.
6. **No arm exists for absence.** §6.1.

`EvidencePacket.sentences` gains these sentences and nothing else. `voiceCheck` is untouched;
`renderVoice`'s two-attempt-then-deterministic-fallback is untouched; the provider seam still
transmits only `{personaPrompt, sentences, scope}`.

### 3.7 Live wins, and the two tablebases must not be conflated

`rfc/engine-leverage.md` §3.6 adds a **live** tablebase producer that attaches
`{kind:"tablebase", source:"tablebase_exact"}` payloads to run events. Once both land, a node
in an endgame pack could carry a live probe **and** a recorded reading of the same position.

> **Normative.** A recorded reading is attributed to the **pack's ledger** — its `sourceId`
> and its authoring `retrievedAt` — and never to a run event. It receives **no**
> `evidence.attached` event, **no** evidence ref, and **no** namespace. And when the node
> already carries an applied measurement of the same kind from the run itself, the recorded
> reading is **suppressed from the packet**: the live measurement is about this run, the
> recorded one is about the corpus, and printing both invites the learner to read the
> difference as a finding when it is a difference in search bounds and dates.

Live wins; recorded is the fallback. The rule is one predicate and it is what keeps the two
RFCs from producing a two-line dashboard at the same node.

---

## 4. Three gates: what is admitted, what enters the packet, and what a surface shows

**A record reaching the projection is not a licence to display it, and the three things are
not the same thing.** `design/05` §3-forms states the axes — *"Honesty attaches to the
source. Timing attaches to disclosure. Form attaches to neither."* — and this section is that
statement made operational.

| Gate | Question | Owner | Property of |
|---|---|---|---|
| **1 — Admission** | may this record become a reading at all? | §3.3, §3.4 | the **record** and the **pack** |
| **2 — Disclosure** | may this reading enter the packet **now**? | the shipped disclosure model, unchanged | the **run** and the **moment** |
| **3 — Presentation** | may this surface render it, and in what form? | `AssistanceConfig` and the form inventory | the **surface** and the **learner's config** |

### 4.1 Gate 2 is the strict one, and it sits at packet construction rather than at render

The instinct is to put the reading in the packet and gate the display. **That is wrong here,
and the reason is `voiceCheck`.** The check validates renderer output against
`packet.sentences`; a sentence in the packet is therefore a sentence the renderer *may say*,
and the packet leaves the server to an external provider. **Packet membership is a speaking
licence.** So the gate is at construction: a reading that may not be spoken now is not in the
packet now.

The gate itself is shipped and unchanged: `requireGuidanceDisclosure(access)`, which computes
`permittedAssistance({sessionKind, deliveryOpen: feedbackDeliveryOpen(run), role})` and
refuses with `ASSISTANCE_WITHHELD` when `humanSplit === "locked_off"` — i.e. unless the
principal is **solo or host** *and* the delivery window is **open**. `[V]` This is the same
predicate that already gates the human split and the corpus route, and it is the operational
form of `design/05` §3a-i's *"the run — not the viewer — carries the barrier"*.

Two design-tier facts make this the fail-closed default rather than a choice:
`design/02`'s anti-contamination default hides *"eval bar, move labels, engine arrows, human
frequencies until segment end or explicit request"*, and `design/05` §6 open question 1 rules
that **rung 2 reveals the answer, so showing it is contamination**. This RFC therefore adds
**no new permission, no new config key and no new default**, and it does not reopen the part
of that question which is still open (availability of rung 0 on request).

### 4.2 The fifth construction site does not apply the gate — D140

There are **five** places a packet is constructed, all in `rest.ts` `[V]`:

| site | scope | applies `requireGuidanceDisclosure`? |
|---|---|---|
| `/voice`, compare branch | `compare` | **yes** |
| `/voice`, non-compare branch | `marker` / `reading` / `steering` / `story` | **yes** |
| `/speech` | `marker` / `reading` / `steering` / `story` | **yes** |
| `/reasoning-review` | `reasoning` | **NO** |

`/reasoning-review` gates through `reasoningReviewAccess`, which checks read authorization,
that a `reasoning.recorded` event exists, and `reasoningDeliveryOpen(run, checkpointEventSeq)`
— a **narrower, checkpoint-scoped** predicate that **does not check role**. `[V]` So today a
participant or spectator with read access can cause a packet carrying rung-3
`human_divergence` sentences — built from the *unfiltered* `pivotalMarkers`, not the
role-aware `liveAdmitted` — to be transmitted to an external provider under a role
`requireGuidanceDisclosure` exists to refuse. The response is separately filtered by
`reasoningMatchCheck`, so this is an egress gap rather than a learner-visible leak, and it is
narrow. It is also live, and this RFC would widen it from rung 3 to rung 2.

> **Normative and blocking: `/reasoning-review` applies `requireGuidanceDisclosure(access)`
> before constructing its packet, and this lands whether or not the rest of this RFC does.**
> Ledgered as **D140** so it is fixable independently.

### 4.3 Gate 3 — the surface may withhold and may never add

`AssistanceConfig` decides form and context; `design/05` §3-forms' acceptance test governs:
*"render the same content as a sentence; if the sentence would be refused, so is the
overlay."* A recorded reading is a **sentence-form** fact in this RFC. No overlay, lit square,
arrow or halo is specified here, and any future form for it inherits gate 2 unchanged. A
surface may decline to show a reading the packet legitimately carries; **no surface may show
a reading the packet does not carry**, because there is nothing to show and `voiceCheck`
would refuse the words.

---

## 5. The rung-2 admission rule, applied clause by clause

`design/05-in-run-experience.md` §3's engine-condition rule, mirrored into
`planning/exploration/gates.md`. This RFC is the **second** in that territory, and it is
specified against the four clauses rather than beside them. Two of them discharge vacuously,
and the vacuity is the design rather than an escape.

### 5.1 Clause 1 — *a condition may only reference a reading a recorded producer actually emits*

The clause binds **conditions**, and this RFC declares none. But its principle — *an arm
exists when its measurement has a producer in the tree, not when it is expressible* — is
exactly the right admission test for a projection, and applying it produces a **refusal, not
a preference**:

| `EVIDENCE_KINDS` member | records in a loadable pack | disposition |
|---|---:|---|
| `engine_eval` | **391** | **admitted** — rung 2 |
| `tablebase_result` | **341** | **admitted** — rung 1 |
| `position_legality` | 32 | **refused** — rung 0 recomputes `pieceCount` exactly and locally through `countFenPieces`; a projection adds nothing and costs a learner-facing surface |
| `explorer_frequency` | **0** | **refused by clause 1.** Not deferred by preference: no producer has ever written one. `rfc/claim-backing.md` §3.7 specifies `explorer_position_census` as the record kind that closes this; when records exist, this projection gains **one registry row** and nothing else changes. §11.2 |
| `opening_identity` | 0 in loadable packs (52 in `content/candidates/`) | **refused** — anchors by `{spineNodeId}` and `/title`, not by position; rung 5 identity, not a measurement |
| `puzzle_provenance` | 0 in loadable packs (26 in `content/candidates/`) | **refused** — a citation, `grounds: "citable_source"` |
| *templated `engine_eval`* (`engine-move-loss/v1`) | **0** | **refused as a verdict** — `bestSan` plus a ranked `candidates[]` is the instrument's choice among moves (§1 consequence 2) |

Published as `Capabilities.recordedReadingKinds`, computed from the registry exactly as
`EngineCapabilities.get` computes `guardBasis`, in the
`DECLARED_UNIMPLEMENTED_POLICY_MODES` style the audit called *"the pattern the rest of the
layer should copy"*. Criterion 12 fails when an advertised kind has no registry row.

**And clause 1 is why a ledger reading may never become a condition — candidate (D) of §2,
refused on three grounds:**

1. The clause's *recorded producer* is a producer **in the tree, emitting during the run**;
   `engine-leverage`'s C1 reads `run.events` and is explicit that a condition *"may never
   cause an instrument call"* and reads only what the run recorded. A file committed in
   February is not a producer the run has.
2. **Coverage inverts the instrument.** A ledger-fed guard fires only where a record exists,
   which is the authored tree — that is, **exactly where the learner followed the book** — and
   is structurally silent at every unauthored move (§8.2: 11,094 of 11,559 one-ply successors
   have no record). A guard that can only fire when you were right is worse than no guard.
3. It is `engine-leverage`'s surface to widen, not this one's. §11.1.

### 5.2 Clause 2 — *a threshold must sit off its instrument's optimality boundary*

**Discharged vacuously, and deliberately: this RFC declares no threshold.** A reading is
stated with its instrument and its date; it is never compared against a trigger point, a
floor, a band or a cut. There is no `byAtLeast`, no `cp`, no `evalSwingCp` analogue and no
place one could be added without §3.5's cross-node refusal failing first.

The vacuity **is** the boundary: the moment this RFC introduced a threshold it would be an
engine condition, and it would belong to `rfc/engine-leverage.md` §3.3's closed union. A
reviewer should treat any future proposal to add a threshold here as a request to widen that
union instead.

### 5.3 Clause 3 — *a threshold nothing measures is `unmeasured` and carries a binding experiment*

**No threshold, therefore no `unmeasured` disposition and no owed experiment.** What is
adopted is the clause's *register* discipline: §5.1 publishes a disposition row with a reason
for every refused kind, so a refusal is a recorded decision rather than a silence — the same
move `engine-leverage` §6 makes for its refused arms.

### 5.4 Clause 4 — *silence is still the default; failing a measurement demotes, lacking one does not*

Two halves, both load-bearing here:

- **Silence is the default.** §4.1: gate 2 is the shipped `requireGuidanceDisclosure`,
  fail-closed, no new permission, no new default, and `design/05` §3a's ruling (*"the default
  during committed play is silence"*) is not reopened.
- **Failing demotes; lacking does not.** §6, in full, and it is applied rather than restated:
  the mechanism that makes it true here is that absence produces **no sentence**, not a
  sentence about absence.

---

## 6. The honesty of an absent record

Most positions a run visits are off the authored tree and will have no reading (§8.2). A
packet that carries a reading at some nodes and not others must not let the silence read as a
verdict. Four rules, of which the first needs no new machinery at all.

### 6.1 Absence is unspeakable, not spoken — and that is structural

`voiceCheck` validates renderer output against `packet.sentences`. At a node with no reading,
the packet contains **no recorded-reading sentence**, so the renderer has nothing to word and
cannot say *"the engine is silent here"* or *"no reading was recorded"* — those sentences are
not in the packet, and the chess tokens they would need are not either. **Absence therefore
produces no output, rather than output about absence.** This is `design/05`'s clause 4
enforced by the mechanism that already exists.

> **Normative: `renderRecordedReading` has no absence arm, and none may be added.**
> Contrast `renderEndgameReading`, which *does* say *"Technique entries: none in Tabiya's
> index."* `[V]` That sentence is honest because it reports the state of **an index of
> names** — a complete, enumerable thing. A missing engine reading at a position is not that:
> it is a fact about **the author's query budget**, and stating it per node would convert an
> authoring artifact into a fact about the game. Criterion 7.

### 6.2 No cross-node arithmetic, and the packet is single-node anyway

§3.5. The reinforcing structural fact is that `evidencePacket` takes **one** `node`, so a
learner following this path never sees two readings side by side and the pattern
*reading, reading, reading, silence* cannot form inside a packet. The one scope that does see
several nodes is `compare`, and its packet replaces `sentences` wholesale — which is why §Motivation
leaves it out of scope rather than quietly inheriting it.

### 6.3 The population is stated once, per pack — never per node

A surface that renders recorded readings carries a standing line, modelled directly on the
shipped `CORPUS_GUARD`:

> *"Recorded readings exist only for the positions this pack's author queried. Where none is
> shown, none was recorded."*

It is a **surface** line (gate 3), not a packet sentence, so it can never be reworded by the
renderer into a fact about a position, and it is stated once per surface rather than once per
node — which is what stops it from becoming a per-move signal that something is missing here
in particular. It is the same shape as `design/05` §4's *"the assistance rail says honestly
that nothing was written about this position"*, moved one rung up.

### 6.4 A reading is about a position, never about the move that reached it

Every sentence in §3.6 begins *"Recorded reading at this position"* and names the perspective
and the date. None names a move, and none is attached to a move. A reading that arrived
because the learner played well and a reading that arrived because the learner played the
authored deviation are worded identically, because the instrument measured the same kind of
thing in both cases. **The reading never carries the reason it exists**, and it must not,
because the reason is authoring coverage.

---

## 7. Latency, on both axes

`design/02-product-shape.md` §UX commitments splits the budget: published numbers are **per
instrument call**, and a **selection** needing several calls carries its own declared,
benchmarked per-selection budget, with the standing caveat that *"it needs several calls" is
a claim to be measured, not a waiver*.

- **Per instrument call: zero.** The projection makes no instrument call, ever — not at load,
  not at lookup, not on a cache miss, because there is no miss path. It is a stricter form of
  `engine-leverage`'s C1: that RFC's conditions read run events; this one reads a file that
  was already read.
- **Per selection: zero.** This is not a selection and adds no call to any selection. No
  opponent path, no queue, no `LichessTablebaseSource` slot is touched — which is the
  contention risk `engine-leverage` §3.6 had to budget for and this RFC does not have.
- **At pack load:** for each pack, iterate its already-parsed `records` (max 53, median 21.5)
  and build a `Map`. Bounded by `O(total records)` = 764 once per process, against a load path
  that already validates every pack document against the JSON Schema and computes
  `digestDrillPack` for each. Not measurable against a 250 ms *"board ready"* line because it
  happens before the server accepts a request.
- **Per packet:** one `Map.get(node.transposeKey)` on a stored string, plus a filter over at
  most a handful of readings. No FEN parse and no I/O on the hot path — the parse happens once
  per record at load, inside admission gate 5's `transposeKey` call.
- **Payload:** at most a few readings per node; the sentences are short frozen strings.
  Criterion 6 pins that a network-unavailable run produces byte-identical packets, which is
  the behavioural form of "no instrument call".

**Declared, per the design doc's requirement that every per-selection budget be declared and
benchmarked like the per-call ones:** both axes are zero, and criterion 6 is the benchmark.

---

## 8. The measured payoff, and the ceiling

All figures derived from the committed tree at `bc3cdc1` `[V]`, and identical in the working
tree at that moment. Commands are reproduced in `planning/evidence-at-runtime/` at
implementation time (criterion 1).

### 8.1 What reaches a learner

| | |
|---|---:|
| committed records in `content/drafts/*.evidence.json` | **764** |
| **admitted** as recorded readings | **732** (391 `engine_eval` + 341 `tablebase_result`) |
| refused (`position_legality`, rung-0-recomputable) | 32 |
| positions covered | **732** |
| packs covered | **32** |
| authored position pointers in those packs (`authoredPositionPointers`: `/start/fen` + recursive spine `moveUci` + top-level deviation `moveUci`) | **732** |
| **authored-tree coverage** | **732 / 732 = 100.0%**, in **32 of 32** packs, zero gaps, zero duplicates |
| distinct anchor FENs corpus-wide | 569 — 281 with an `engine_eval`, 288 with a `tablebase_result` |

Two structural findings fall out and are ledgered rather than buried:

- **No position in the corpus carries both an engine reading and a tablebase reading**
  (281 + 288 = 569 exactly). The two instruments **partition the corpus by pack**: 17 packs
  are 100% Stockfish (openings), 15 are 100% Syzygy (endgames), and no pack mixes. So a packet
  can never corroborate one instrument against the other, and any future design that assumes
  it can is assuming a corpus that does not exist. **D143.**
- **158 FENs are recorded in more than one pack's ledger** (opening transpositions). This RFC
  refuses cross-ledger resolution — `claim-backing` §3.3's rule, *"a binding that reaches
  outside its own digest is unverifiable"* — so those records help only the pack that owns
  them. It is also the single cheapest coverage widening available and is Open question 1.
  **D144.**

### 8.2 The coverage gap — the honest number

Replaying all 32 packs from `start.fen` and enumerating legal moves at every spine-line
position `[V]`:

| | |
|---|---:|
| spine-line positions (including start) | **497** |
| distinct legal successors of those positions | **11,559** |
| successors that are authored (465 spine continuations + 235 deviation stubs) | **700 — 6.06%** |
| **successors with no record** | **11,094 — 93.94%** |
| mean legal moves per position | 23.26 (openings ~34, endgames ~11) |
| positions with a record more than one ply off the authored tree | **0, by construction** |

That last row is the finding. `authoredPositionPointers` enumerates `/start/fen`, spine
`moveUci` and **top-level** deviation `moveUci` — nothing else — and `verify-draft`'s
`enumerate` writes exactly one record per enumerated pointer. So the corpus does not merely
thin out past the authored tree; it **stops**. Even after an *authored* deviation, the very
next position — the opponent's reply — has no record.

**Coverage is 100% on a line and 0% one ply beside it. It is a cliff, not a gradient**, and
§6 is written against the cliff rather than against sparseness.

How much of a run is on that line can only be **bounded**, because the repository holds no
recorded runs `[V]` (the only run JSON is `drill_run.schema.json` and two deliberately-invalid
fixtures with one node each). What bounds it:

- `commitMove` has **no ply or node cap** — it refuses only on a terminal `objectiveState`,
  `position.isEnd()`, or an existing `outcome.reached` event. `[V]`
- `authoredBoundary.plyHorizon` caps authored *support*, not run length: median **10**,
  max **40** across the drafts. `[V]`
- `difficulty.branchLengthTarget` is 2–40 by schema; **no draft pack declares one** `[V]`, so
  the shipped default governs.
- Off-spine opponent replies come from the Maia policy model at runtime, not from any ledger
  (`docs/engine-workers.md`).

**Stated plainly: a run is covered for as long as it stays on one authored line, up to a
median of 10 plies, and is uncovered from its first unauthored move onward — which can be
ply 1.** With a mean branching factor of 23.26 over a target-length run, the reachable
position count is on the order of 23^11 and the ledger covers a single path through it.

### 8.3 The ceiling — rung 4 does not close, and the number says why

D119's corrected map names **rung 2 and rung 4** as the packet's absences. This RFC closes
rung 2 and **cannot close rung 4**: **zero `explorer_frequency` records exist anywhere in the
repository** `[V]`. Under clause 1 that is a refusal (§5.1). Rung 4 does reach a *surface*
today — `GET /runs/:id/corpus` is a live, disclosure-gated, LLM-free explorer panel — but it
is outside the packet, so no renderer may word it and no `voiceCheck` binds it. The two rung-4
paths are unjoined. **D147.**

The unblocker is named and not claimed: `rfc/claim-backing.md` §3.7's
`explorer_position_census`. When records of that kind exist in a loadable pack, this
projection admits them by adding **one row** to §5.1's registry — no new gate, no new
sentence mechanism, no schema move. That is the argument for building the registry as a
registry rather than as two hardcoded branches.

### 8.4 The contingency, stated rather than assumed — D138

**`content/packs/` contains only `.gitkeep`.** `[V]` All 47 authored packs and all 32 ledgers
live in `content/drafts/`, which `PackRegistry.loadDefault` includes **only when
`development === true`**; a `draftFile` outside development is a `TypeError`. `[V]`

So the measured payoff of 732 readings across 32 packs is the payoff **in a development
deployment**. In a deployment that loads only `content/packs/`, the payoff is **zero readings
across zero packs**, and the mechanism is a correctly-behaving empty map.

That is not an argument against the mechanism — it is empty-corpus-safe by construction, and
it is the same corpus every other pack-attached capability in flight depends on. It is an
argument against claiming a number this RFC has not earned. **The 732 is contingent on a
content promotion this RFC does not perform and does not block on.** Ledgered as D138 and
carried into Open question 4 as an owner call, because "the corpus is dev-only" is a fact the
whole in-flight wave inherits and none of the sibling RFCs states.

**And a second contingency: 15 of 47 authored draft packs have no ledger at all** `[V]` —
`berlin-queenless-press`, `carlsbad-minority-attack`, `conversion-up-a-piece`,
`dragon-yugoslav-race`, `french-advance-chain-white`, `grunfeld-exchange-fianchetto`,
`iqp-black-tarrasch-defence`, `iqp-white-panov-attack`, `kid-mar-del-plata-white`,
`maroczy-bind-white-squeeze`, `nimzo-doubled-c-pawns`, `open-centre-ruy-exchange`,
`rook-4v3-same-side`, `trajectory-caro-advance-chain-bishops`,
`trajectory-qgd-exchange-minority`. Every one is a 2026-08-15 middlegame-wave pack. So the
corpus is **two-tier**, coverage is 68% of authored packs, and the only thing published about
the tier is the binary `assessmentGrounding`. **D141.**

---

## 9. Ledger rows this RFC opens (law 4)

**Id block D138–D147, issued to this draft. No other id is used.** Each row is added to
`design/BACKLOG.md` by the drafting commit, with the measurement that produced it.

| id | row |
|---|---|
| **D138** 🐞 | **`content/packs/` is empty — the entire authored corpus is dev-only.** 47 authored packs and 32 ledgers live in `content/drafts/`, which `PackRegistry.loadDefault` includes only when `development === true`. Every pack-attached capability in flight therefore delivers zero in a production deployment, and no RFC states it |
| **D139** 🐞 | **The packet's "rung 1" never touches a tablebase.** `endgameReading` is a material census with `provenanceNote = "Tabiya's material-census convention"` — five type labels and up to three technique names, no `category`, `dtz`, `dtm` or abstention contract. Its honest rung is 0. Corrects D116/D119; escalated as a row rather than written into `design/05`, per law 5 |
| **D140** 🐞 | **`/reasoning-review` builds an evidence packet without the packet's disclosure gate.** Four of five packet construction sites call `requireGuidanceDisclosure`; `/reasoning-review` gates on `reasoningDeliveryOpen`, which is checkpoint-scoped and **role-blind**, so a participant or spectator can cause a packet carrying unfiltered rung-3 `human_divergence` sentences to be transmitted to an external provider. Egress gap, not a learner-visible leak (`reasoningMatchCheck` filters the response) |
| **D141** 🐞 | **15 of 47 authored draft packs have no evidence ledger**, all from the 2026-08-15 middlegame wave. The corpus is two-tier at 68% and the only published signal is the binary `assessmentGrounding` |
| **D142** 💡 | **`PackRegistry.loadDefault` already reads every pack's ledger and discards it.** `sidecarPaths` → `optionalJson` → `assessmentGrounding`, which keeps one bit of 764 records; `PackRecord` has seven fields and none is the ledger. D118's cost is a discarded object, not a missing contract |
| **D143** 🐞 | **No position in the corpus carries both an engine reading and a tablebase reading.** 281 + 288 = 569 distinct FENs exactly. The instruments partition by pack — 17 packs 100% Stockfish, 15 packs 100% Syzygy, none mixed — so nothing can corroborate one against the other |
| **D144** 💡 | **158 FENs are recorded in more than one pack's ledger.** Single-ledger resolution (the `claim-backing` rule) refuses them by construction; it is the cheapest available coverage widening and it changes what "this pack's evidence" means, so it is an owner call |
| **D145** 🐞 | **`voiceCheck` validates only `packet.sentences`**, and `ExternalHttpVoiceProvider.render` transmits only `{personaPrompt, sentences, scope}`. A structured packet field that produces no sentence is invisible to the renderer *and* to the check. "Widen the packet" means "widen the sentences", and any future packet field that forgets this is decoration |
| **D146** 🐞 | **`voiceCheck` is token-membership, not proposition-checking.** It cannot stop the renderer joining two admitted facts into a claim neither record makes. Pre-existing, but the cost rises with rung 2, because a centipawn number invites a causal join. The ceiling of any token check over free prose — the same ceiling `claim-backing` §2 names for its span binding |
| **D147** 💡 | **Rung 4 reaches a live surface but never the packet.** `GET /runs/:id/corpus` is a shipped, disclosure-gated, LLM-free explorer panel; the packet has no rung-4 field. So the corpus can be shown and can never be worded, and the two rung-4 paths are unjoined |

---

## 10. Deviations from design

1. **`design/05-in-run-experience.md` §3's ladder places tablebase at rung 1**, and D116/D119
   read `endgameReading` as the packet's rung-1 layer. It is a material census (D139). **This
   is escalated, not edited** — no `design/` document is written by this RFC (law 5), and the
   row is the proposal.
2. **`design/03-product-breadth.md` §Intelligence and explanation** lists *"Stockfish
   evaluation/WDL, MultiPV, tactics, and deep analysis"* and *"Syzygy WDL/DTZ and endgame
   triviality"* as selectable evidence layers. This RFC supplies the **recorded** half of two
   of those entries — a score or mate, and a category with DTZ/DTM — and explicitly **not**
   WDL, MultiPV, tactics or deep analysis. Narrower than the map row, which is not a deviation:
   that document *"records only that the capability exists"* and defines no admission.
3. **`design/05` §6 open question 1 is not resolved.** §4 gates on the part that is **ruled**
   (rung 2 during committed play reveals the answer, therefore contamination) and touches
   none of the part that is open (availability of rung 0 on request).

Otherwise: none.

---

## 11. Boundaries against the two adjacent RFCs

### 11.1 `rfc/engine-leverage.md` — accepted and **mid-implementation** at `bc3cdc1`, pack 0.23 / run 0.16 / migration 22

> **`engine-leverage` differences measurements the run took. `evidence-at-runtime` states
> readings the corpus recorded, and may never difference them.**

| | `engine-leverage` owns | this RFC owns |
|---|---|---|
| source of the number | a **live** instrument call during the run, recorded as `evidence.attached` | a **committed** ledger record, read at pack load |
| what happens to it | it **fires** a condition (`guard.conditions[]`, `$defs/engineCondition`, four arms) | it is **stated** as a frozen sentence in the packet |
| arithmetic | differences across a decision triple (`centipawnSwing`, DTZ regression, category regression) | **none** — §3.5 |
| thresholds | `evalSwingCp`, `byAtLeast` ≥ 3 | **none** — §5.2 |
| authoring side | binds `deviation.cost` to the ledger at `verify-draft` time; `go nodes 50000` | nothing |
| register | pack 0.23, run 0.16, migration 22 | **nothing versioned** |
| files | `guard.ts`, `pack-validation.ts`, `feedback-policy.ts`, `opponent-selector.ts`, `strong-engine.ts`, `sourcing/verify-draft.ts`, `sourcing/check.ts`, both schemas | `pack-registry.ts`, `guidance.ts`, `voice.ts`, `rest.ts`, `capabilities.ts` |

**No file is shared and no resource is contested.** This RFC adds no condition arm, writes no
run event, mints no evidence-ref namespace, and touches neither `publicNodes` nor
`engineFeedbackEvent` nor `isMachineEvidenceRef`.

The **one** place the two meet is a node that carries both a live tablebase probe (that RFC's
§3.6 producer) and a recorded tablebase reading (this RFC). §3.7 resolves it normatively:
attribution never conflates the two, the recorded reading gets no event and no ref, and the
live measurement suppresses the recorded one. **Landing order is free in both directions**;
if `engine-leverage` lands first, §3.7's suppression rule is live on arrival, and if this one
lands first the rule sits dormant until the producer exists.

### 11.2 `rfc/claim-backing.md` — in cross-review, pack 0.26 released

Both RFCs touch the same 32 ledgers and neither touches the other's direction.

| | `claim-backing` | this RFC |
|---|---|---|
| direction | record → **authored prose** | record → **run-time packet** |
| when | **authoring time**, in `sourcing-check` | **pack load**, in `PackRegistry` |
| where it lands | the **ledger**, as `claimBindings` | **memory**, as a `PackRecord` field |
| what it reads of a record | `supports`, `values`, `templateId`, `kind` | `anchor.fen`, `kind`, `grounds`, `templateId`, `values` — **never `supports`** |
| what it produces | a validator verdict on an author's sentence | a frozen sentence about a position |
| files | `check.ts`, `explorer.ts`, `sourcing/types.ts`, a new `claim-binding.ts` | `pack-registry.ts`, `guidance.ts`, `voice.ts`, `rest.ts`, `capabilities.ts` |

**Not merge-adjacent: no file is shared.** Three interface statements:

1. **Claim prose never enters this packet.** `feedback-delivery`'s C9 exclusion stands
   untouched; `EvidencePacket.authored` continues to carry only what
   `service.authoredFeedback` already reveals, and a `feedbackClaim`'s text is not among the
   three authored shapes that path delivers.
2. **`explorer_position_census` (that RFC §3.7) is this RFC's rung-4 unblocker**, named and
   not claimed. One registry row when records exist (§8.3).
3. **This RFC inherits that RFC's cross-ledger refusal** — *"a binding that reaches outside
   its own digest is unverifiable"* — as its own single-ledger rule (§8.1, D144). Same
   principle, different artifact.

Neither RFC changes `EVIDENCE_OVERREACH`, the two registered templates, or `record.supports`
semantics. If `claim-backing`'s §3.2(5) lands first, this RFC is unaffected: it never reads
`supports`.

---

## Acceptance criteria

1. **The projection is built, and the measured figures are reproduced by the shipped code
   rather than by this document.** Over the committed tree: **32** packs indexed, **732**
   readings admitted (391 engine + 341 tablebase), **32** `position_legality` records refused,
   **732 of 732** authored position pointers covered. Recomputed in
   `planning/evidence-at-runtime/`. **If the shipped figure disagrees with §8, §8 is wrong and
   is corrected there rather than the code being bent to it.**
2. **Linkage is fail-closed and total.** A pack whose ledger fails `assessmentGrounding`
   yields an **empty** index — asserted for a hand-mutated pack document (digest drift) and
   for a hand-mutated `packDigest`. A partial index is a test failure.
3. **`GET /packs/:id` is byte-identical before and after.** A test asserts
   `projectPackDocument` gains no parameter, that no recorded reading appears in its output for
   any of the 32 indexed packs, and that the anti-contamination boundary in
   `docs/explanation-grounds.md` is unchanged.
4. **All five packet construction sites apply the packet disclosure gate**, `/reasoning-review`
   included (D140). Tested per site: a spectator, a participant, and a solo learner with the
   delivery window closed each receive `ASSISTANCE_WITHHELD`; a solo learner with the window
   open receives readings. **The `/reasoning-review` test must fail before the fix and pass
   after**, and it is written first.
5. **No move token enters the packet — the law-8 criterion.** Over all 732 admitted readings,
   every sentence `renderRecordedReading` produces is asserted to match none of `voiceCheck`'s
   `SQUARE`, `UCI` or `SAN` patterns. A future sentence arm that names a move fails this test.
   **This is the mechanical form of "widen the packet, never the licence" and it must not be
   softened.**
6. **Zero instrument calls, on both axes.** A grep test asserts the projection module imports
   no engine client, no `LichessTablebaseSource`, no `ExplorerClient` and no fetch; a
   behavioural test asserts that a run with the network unavailable produces byte-identical
   packets to one with it available; and a benchmark records that packet construction time is
   unchanged within noise.
7. **Absence produces no sentence.** For a node with no reading, the packet's `sentences` are
   byte-identical to today's. A grep test asserts `renderRecordedReading` contains no
   absence-arm string ("no reading", "none recorded", "not queried", "unavailable").
8. **No cross-node arithmetic exists.** A test asserts the packet for node *N* carries only
   readings whose `transposeKey` equals `N.transposeKey`; a grep test asserts the projection
   and renderer modules contain no subtraction, comparison or ordering of two `RecordedReading`
   values; and `evidencePacket` still takes exactly one `node`.
9. **Live wins.** At a node carrying an applied same-kind measurement from the run itself, the
   recorded reading is absent from the packet. Written against a synthetic
   `evidence.attached` payload so it holds before `engine-leverage` lands.
10. **Verdict-shaped records are refused.** A synthetic `engine_eval` record carrying
    `templateId: "engine-move-loss/v1"` with `bestSan` and `candidates[]` is not admitted, and
    neither `bestSan` nor any candidate SAN appears in any packet. 0 such records exist today;
    this criterion is the fence, not a regression test.
11. **The clock rule holds and its cost is measured.** A `tablebase_result` whose recorded
    halfmove clock differs from the node's is not admitted. The implementation **reports the
    measured on-tree cost of the strict rule** (expected 0 positions); a non-zero result is
    carried to Open question 2 rather than silently relaxed.
12. **`/capabilities` publishes the registry, and the register cannot drift.**
    `recordedReadingKinds` is computed from §5.1's registry; a test fails when an advertised
    kind has no registry row, and when a registry row marked admitted has no admission path.
13. **The coverage gap is published, not just measured.** §8.2's figures — 497 spine-line
    positions, 11,559 successors, 700 authored (6.06%), 11,094 uncovered — are recomputed from
    the shipped code in `planning/evidence-at-runtime/`. **A run that reports substantially
    higher off-tree coverage fails this criterion**, because it would mean the index is
    matching positions it should not.
14. **All 32 committed ledgers still validate unchanged.** `sourcing-check` over `content/`
    produces the same issue set, code for code. No pack byte changes; no content digest moves.
15. **The ledger and the log are updated in the archiving commit.** **D118** flips to ✅ with
    **both** numbers named — 732 readings admitted **and** 11,094 of 11,559 one-ply successors
    uncovered. **D116** flips to ✅ with the mechanical half stated and rung 4 named as still
    absent. **D119** and **D120** are annotated with what shipped. **D138–D147** are opened by
    the drafting commit with their measurements. A dated entry lands in
    `planning/exploration/log.md`. `rfc/README.md`'s Active row is the reviewer's to add —
    single-writer, not edited here.

---

## Open questions

1. **Should a reading be admitted across packs?** 158 FENs are recorded in more than one
   pack's ledger (D144). This RFC refuses cross-ledger resolution on `claim-backing`'s
   principle. **The author's recommendation is to keep the refusal in this RFC**, because
   admitting it changes what "this pack's evidence" means and would make a pack's honesty
   depend on which other packs happen to be loaded — but it is the cheapest coverage widening
   available and it is an owner call, not a tooling one.
2. **Does the strict halfmove-clock rule for tablebase readings cost coverage?** Expected zero
   on the authored tree, because records are produced by replaying the same moves. Criterion 11
   measures it. If non-zero, the honest options are keeping the strict rule (losing those
   positions) or admitting with the clock difference stated in the sentence — and the second
   is a sentence-content change, so it returns here rather than being taken at implementation
   time.
3. **Should recorded readings reach the `compare` scope?** Out of scope here because that
   packet replaces `sentences` wholesale and because compare is the one place several nodes are
   in view, i.e. where §3.5's refusal is load-bearing rather than theoretical. This touches
   `rfc/feedback-delivery.md`'s compare strip and should be decided with it, not before it.
4. **Is the `content/packs/` promotion a blocker?** (D138.) The author's position is **no** —
   the mechanism is empty-corpus-safe and the contingency is stated rather than hidden — but
   the whole in-flight wave inherits the same contingency and none of the sibling RFCs names
   it. Whether that becomes a content wave with an owner is a scheduling call.
5. **Should `position_legality` be admitted after all?** Refused here as rung-0-recomputable
   (`countFenPieces` is local and exact). The one argument for it is that `pieceCount` is what
   gates rung 1's abstention contract, and a *recorded* piece count carries a retrieval date a
   computed one does not. **Recommendation: keep it refused** — a date on an arithmetic fact is
   provenance theatre — recorded so the refusal is a decision.

---

## Changelog

- 2026-08-16: created. Drafted from **D118** under the owner's 2026-08-15 question
  *"doesn't it have access to ALL the info?"*, transformed by **D116** into *widen the packet,
  never the licence*. Five join mechanisms evaluated (§2); **load-time position projection on
  `PackRecord`** chosen on the finding that the runtime already reads and discards every
  ledger (**D142**). Three gates separated — admission, disclosure, presentation — with
  disclosure placed at packet **construction** because `voiceCheck` makes packet membership a
  speaking licence. Cross-node arithmetic refused normatively, which is the boundary against
  `engine-leverage`. Rung 4 refused under the rung rule's clause 1 on a measured zero, with
  `claim-backing`'s `explorer_position_census` named as the unblocker. **Claims nothing
  versioned**; 0.26 stays free. Measured: **732 of 764 records admitted at 732 positions across
  32 packs, 100.0% of the authored tree** — and **11,094 of 11,559 one-ply-off positions
  uncovered, with nothing at all beyond that ply**. Ten rows opened from measurements taken
  during drafting (D138–D147), including that the packet's "rung 1" never touches a tablebase
  (D139), that one of five packet construction sites omits the disclosure gate (D140), and that
  `content/packs/` is empty so the whole corpus is dev-only (D138).
