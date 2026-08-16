# RFC: Evidence at runtime — the ledger the runtime already opens and throws away

- **Status:** **implemented 2026-08-16**. Open question 7 was non-blocking; implementation followed the author's recommendation and kept the structural post-provider voice seam in §3.8. Returned once by cross-review; both false safety arguments were replaced with structural fixes rather than annotations.
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
  **[cross-review] Re-derived at `a7e700d` (HEAD, 2026-08-16).** The content census is
  unchanged — 32 ledgers, 764 records, 391 `engine_eval` / 341 `tablebase_result` /
  32 `position_legality`, 0 templated, `grounds: "machine_validation"` on all 764 — and every
  symbol in the locate list resolves. Six classes of figure did **not** survive re-derivation
  and are corrected in place below, each marked `[cross-review]` with the command's number:
  the staleness argument (§2.1, **blocking**), the packet-site count and D140's status (§4.2,
  **already landed at `a452abb`**), the position count (§8.1, 731 not 732), the clock rule's
  cost (§2.2, 43 not 0), the engine/tablebase pack split (§8.1, 20/12 not 17/15) and the
  draft-pack count (§8.4, 53 documents not 47). One specification defect — `RecordedReading`
  cannot be typed as §3.4 spells it — is fixed in §3.4.*
  **[author round] Re-derived a third time at `0241a98` (HEAD, 2026-08-16), by the author,
  after the cross-review returned the draft.** Every cross-review figure reproduces exactly —
  32 ledgers, 764 records, 391/341/32, 0 templated, 764 `machine_validation`, 0 abstentions;
  5 digest-stale ledgers carrying 186 records and 181 admitted readings, all 32 reading
  `ledger_verified` (**3 packs / 104 readings at `c55b9cf`**, after `caa8afa` re-stamped two
  mid-round — §2.1a); 20/12 pack split; 497 spine positions, 11,559 legal moves, 11,464
  per-pack-distinct successors, 700 pointers / 699 distinct authored positions, 372 frontier
  tablebase arrivals of which 43 (11.6%) refused on clock; 53 draft documents, 6 browser
  fixtures, 21 ledger-less. **Every executed `voiceCheck` counter-example reproduces, including
  the `sf-a1x` substring licence.** Three things the cross-review did not reach are corrected
  here, and each is a decision rather than an edit: **the digest conjunct is ratified and owned**
  (§2.1), **the absence-honesty guarantee is refused as specified and replaced with a
  structural one** (§3.8, §6.1), and **three further sentences leaning on packet membership as
  a licence are struck** (Summary, §Motivation, §4.3). One figure the cross-review corrected is
  corrected again: **731 is a count of index entries, not of positions** — corpus-wide there
  are **568** (§8.1). Ten rows opened, **D257–D266** (§9b).*
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
  stated in §9 with its measurement. **The adversarial cross-review opens ten more under its
  own block, D223–D232, stated in §9a. The author round opens ten more under its own block,
  D257–D266, stated in §9b; no other id is used by this round.**
- **Depends on:** `rfc/archive/content-sourcing-foundation.md` ships the
  evidence ledger, `validateLedger` and `assessmentGrounding`;
  `rfc/archive/opening-evidence-path.md` and `rfc/archive/fixture-realism.md` (D64's closure,
  `8b1b44d`) supply the 391 engine and 341 tablebase records this RFC projects;
  `rfc/archive/adaptive-guidance.md` ships `evidencePacket`, `voiceCheck` and the six
  `VoiceScope` values.
  **One dependency is unlanded and it is stated here rather than in a footnote
  `[author round]`: `rfc/pack-graduation.md`** (status: *author return round complete
  2026-08-16, ready to accept*). It owns the two facts this RFC's headline numbers ride on.
  **`content/packs/` holds only `.gitkeep`** `[V]`, so in a non-development deployment this
  RFC's measured payoff is **zero readings across zero packs** — the mechanism is
  empty-corpus-safe, but the 732 is a development figure until that RFC promotes the corpus
  (§8.4, D138/D162). And its §7 re-stamps **`packDigest` on 32 of 32 ledgers**, which is what
  clears the readings **§2.1's digest conjunct refuses today — 104 across 3 packs at `c55b9cf`**
  (§2.1a). **Neither is a
  blocker** — this RFC lands correct and silent on an empty or stale corpus, which is the
  direction the error must fall — but *"depends on nothing unlanded"* was wrong as written,
  and both figures move in this RFC's favour when `pack-graduation` lands.
- **Parent / amends:** amends `PackRecord` and `PackRegistry.fromDocuments`
  (`apps/server/src/pack-registry.ts`); amends `EvidencePacket`
  (`packages/runtime/src/voice.ts`) and `evidencePacket` (`apps/server/src/guidance.ts`);
  amends the **four** packet construction sites in `apps/server/src/rest.ts`
  (**[cross-review]**: four, not five — §4.2); amends
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
| **Migration** | **none** | `STORAGE_VERSION` (`apps/server/src/storage.ts`) is untouched — **20** committed, **21** in the working tree from the RFC ahead of this one. No table, no column, no frozen literal, so the landing order of 21 and 22 is not this RFC's problem. The projection is **derived and never persisted** — the migration-10 precedent cited in `rfc/archive/format-surface.md` §4.4 applies exactly: rung-0 facts, and now recorded readings, are recomputed at load rather than stored. |
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
reading enter the packet now — a property of the run and the moment, and the *stricter* gate),
and **presentation** (may this surface show it — `AssistanceConfig`, which may withhold and
may never add).

> **`[author round]` The reason originally given for disclosure being the strict gate was
> *"because `voiceCheck` makes packet membership a speaking licence"*, and it is struck.**
> `voiceCheck` binds chess **tokens**, not propositions (D234, executed and reproduced in
> §6.1), so packet membership licences squares and move tokens and nothing else. The gate is
> the strict one for two reasons that are properties of the code: **`renderVoice`'s fallback
> returns `packet.sentences.join("\n")` verbatim to a learner** with no model and no check in
> the loop `[V]`, and **`/reasoning-review` transmits `packet.sentences` to the external
> provider without calling `voiceCheck` at all** — `voiceCheck` has exactly **one** production
> call site, inside `renderVoice`, and `/reasoning-review` does not use `renderVoice` `[V]`.
> A packet sentence is therefore learner-reachable and provider-reachable **without passing
> any check**, which is a better argument for gating at construction than the one it replaces.

**Measured `[V]`, re-derived by the author at `0241a98`.** Of the 764 committed records,
**732 are admitted** — 391 `engine_eval` and 341 `tablebase_result` — across **32 packs**,
covering **732 of 732 authored position pointers, 100.0%, in 32 of 32 packs, with zero gaps**.
They occupy **731 index entries** (one intra-pack `transposeKey` collision) over **568
distinct positions corpus-wide** (`[author round]`: the cross-review's *"731 distinct
positions"* is 731 *entries*; 158 FENs recur across packs and the index is per-pack — §8.1).
32 `position_legality` records are **refused** as rung-0-recomputable, and **a further
104 readings across 3 packs are refused by §2.1's digest conjunct** at `c55b9cf` — 181 across
5 packs at `0241a98`, before `caa8afa` re-stamped two ledgers mid-round (§2.1a) — until
`pack-graduation`'s 32-of-32 re-stamp clears the rest.

**And the honest number, which is the one that decides whether this is worth doing `[V]`.**
The 32 packs' spine lines hold 497 positions with **11,559 legal moves**, reaching **11,464
distinct successor positions** by `transposeKey` (summed per pack, which is the set a per-pack
index serves). The authored tree covers **700 pointers — 6.06% of the moves — landing on 699
distinct positions, 6.10%** — 465 spine continuations plus 235 deviation stubs. **10,765 of
the 11,464 successor positions have no record, and beyond that first ply the corpus contains
nothing at all.** Coverage is not sparse; it is **total on a line and empty everywhere else**.
That cliff, not the 732, is what §6 is written against.

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
| pack documents in `content/drafts/`, all loaded in development | **53** — 32 with a ledger, **21 without**, of which **6 are browser fixtures** (D141, D227) `[cross-review]` |
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
same packet, so **nothing needs new wiring to reach a surface.**

> **`[author round]` D116's safety argument, as this RFC originally restated it, was false,
> and the correction is ledgered as D234 because it reached the owner.** The draft read:
> *"`voiceCheck` validates renderer output against the packet, so more validated facts in the
> packet is law-8-legal **by construction**."* It is not. `voiceCheck` inspects square/UCI/SAN
> tokens and three frozen word lists and **nothing else** `[V]`; a proposition drawn from none
> of those vocabularies is unconstrained, which §6.1 demonstrates by execution. So widening
> the packet is **not** law-8-legal by construction, and no RFC may claim that it is.
>
> **What survives is the direction, not the proof.** Widening the *packet* is still strictly
> safer than widening the *model's licence*, because the packet is the only input the provider
> receives and every fact in it is an instrument measurement with its provenance. But safety
> has to be argued per RFC rather than inherited from the check. **This RFC argues it three
> ways, none of which is `voiceCheck`:** the readings are frozen strings over record values
> (§3.6); no move token enters them (§1, criterion 5); and — the answer this round adds —
> **the provider never receives them at all** (§3.8). `voiceCheck` is untouched, and this RFC
> now claims nothing on its behalf.
>
> **This is the second instrument this week found to guarantee tokens while being described as
> guaranteeing propositions.** The other is `claim-backing`'s residual sweep (D131), which
> polices numerals while the boundary it is cited for polices inference from numerals. Same
> failure of description, two independent mechanisms. The general form is D266.

Loosening `voiceCheck` remains the named anti-pattern, and this RFC does not touch it.

**Explicitly out of scope**, each with its reason:

- **Any condition, threshold, trigger or grade.** A recorded reading is stated, never
  compared against a trigger point. The engine-condition surface is
  `rfc/engine-leverage.md`'s (accepted, pack 0.23 / run 0.16 / migration 21) and §11 states
  the boundary in one sentence.
- **Any cross-node arithmetic** — swings, losses, deltas, ranks, "this move cost X". §3.5
  makes this a normative refusal rather than an omission, and §11 explains why the same
  arithmetic is legitimate in `engine-leverage` and illegitimate here.
- **Binding a record to authored prose.** `rfc/archive/claim-backing.md`'s territory
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
- **Any change to `voiceCheck`, the provider seam, or the fallback.**
  **`[author round]` corrected: `renderVoice` is no longer out of scope.** It gains exactly
  one thing — the frozen reading sentences are appended to its return value, on the far side
  of the provider call (§3.8). Its two-attempt-then-deterministic-fallback logic, its
  `voiceCheck` call and the `{personaPrompt, sentences, scope}` it transmits are all
  unchanged, and `packet.sentences` is byte-identical to today's at every node. The boundary
  is corrected here rather than exceeded silently, and §3.8 states the cost and the
  decline path.

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
   licence"** — and it is the *only* form of it, because token membership is all `voiceCheck`
   binds (D234). **`[author round]` Under §3.8 this consequence holds twice over and for a
   second reason: reading sentences never enter `packet.sentences`, so they cannot widen a
   licence they are not part of.** Criterion 5 is kept anyway, because §3.8 is declinable and
   because the assertion is the one that catches a future arm that names a move. The check's
   admission is a raw `String.includes` with **no word boundary** `[V]`, so criterion 5 must be
   a *substring* test, not a regex match — verified against the four frozen arms, which contain
   no `[a-h][1-8]` pair at any boundary `[V]`.
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
4. **Absence is unspeakable on every path this RFC controls, and the provider is not given
   the concept.** §6.1. There is no "no reading was recorded" template, because absence at a
   position is a fact about the author's query budget, not about the position.
   **[cross-review]:** originally stated as unqualified and attributed to `voiceCheck`;
   measured false for the provider path — `voiceCheck` passes *"No reading was recorded at
   this position."* against a packet that contains no such sentence `[V]`, reproduced by the
   author at `0241a98`. **`[author round]`:** the refusal is structural on the deterministic
   path (no arm exists to render) and is carried on the provider path by **§3.8** — the
   provider's `sentences` are byte-identical to today's, so no reading and no vocabulary for
   one crosses the seam — with the persona constraint (criterion 16a) as a second line. **It is
   not carried by `voiceCheck` and this RFC claims nothing on its behalf.** What remains
   unguarded is named at full strength in §6.1 clause 3.

**The residual, named rather than denied (D146).** `voiceCheck` is a **token-membership**
check, not a proposition check: it verifies that every square, move, chess noun, judgement
word and prescriptive verb in the output already appears in `packet.sentences`. It cannot
stop the renderer from *joining* two admitted facts into a claim neither record makes.
**[cross-review] The residual is wider than "joining", and it was measured rather than
reasoned about:** any sentence containing none of those four token classes passes against any
packet, including a wholly invented recorded-reading sentence and any sentence *about absence*
`[V]`. §6.1 carries the four executed counter-examples; D226 carries the row. This does not
change what this RFC ships — it changes which claims this RFC is allowed to make about why it
is safe, and §4.1 and §6.1 are rewritten accordingly. That
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
One `Map` of at most 52 entries per pack (**[cross-review]**: 52, not 53 — the largest ledger
holds 53 records at 52 distinct keys, §8.1), built once per process, alongside the
`digestDrillPack` the registry already computes. *Cache:* the `PackRegistry`'s own
`#records` / `#digests` maps, held for process lifetime, which is where every other derived
pack fact already lives. *Staleness:* **refused at load by a digest equality this RFC adds**,
see §2.1 (**[cross-review]**: originally *"structurally impossible"*, which was measured false
— 5 of 32 committed ledgers are digest-stale at HEAD and all 32 read `ledger_verified`).

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
derived-not-persisted values, cited in `rfc/archive/format-surface.md` §4.4, says do not persist what
you can recompute. It would also fork the ledger's single source of truth, which is the
defect `claim-backing` §3.1 avoids for the same reason. **Rejected.**

### 2.1 Staleness — the argument this section made was false, and the gate is now two predicates

> **[cross-review] This section originally claimed that "`linkage` and `assessmentGrounding`
> already compare `ledger.packDigest` to `digestDrillPack(document)`", and concluded that
> staleness was *structurally impossible*. Measured at `a7e700d`: they do not, and it is not.**
> `assessmentGrounding` reads `objective.grading.assessedBy`, validates the ledger and
> manifest, calls `linkage(manifest, ledger, issues)` — which joins each record to a
> **manifest entry** by `sourceId` and `retrievedAt`, and never touches the pack document —
> and then requires **exactly one** record matching `/start/fen` and the `assessedBy` scalars.
> **`ledger.packDigest` is never read on the runtime path.** `[V]` The repository's only
> digest-staleness check is `EVIDENCE_DIGEST_STALE` in `sourcing/check.ts`, it is severity
> **`warning`**, and it lives in the authoring CLI. `[V]`
>
> The consequence is measured, not hypothetical. Evaluating `assessmentGrounding` over all 32
> committed ledgers at `a7e700d`: **32 of 32 return `ledger_verified`** — including the
> **5 whose `packDigest` no longer matches their pack**: `mate-bishop-knight`,
> `mate-k-q-technique`, `mate-k-r-technique`, `philidor-passive-rook-convert`,
> `trajectory-mate-bishop-knight` (the same five `rfc/pack-graduation.md` §4.5 found at
> `1b89123`; still five at HEAD). Those five carry **186 records, 181 of them admitted**.
> Under the rule as originally written this RFC would index and speak 181 readings taken
> against a document that has since moved. **`byDigest(run.packDigest)` does not save it**:
> it pins **run → document**, and the drift that matters here is **ledger → document**, which
> nothing on the load path compares.

The pack's ledger declares `packDigest`; `PackRegistry.fromDocuments` computes
`digestDrillPack(document)` on the line **above** `assessmentGrounding` and stores it as
`PackRecord.digest`. `[V]` So the missing comparison is free — both operands are already in
scope in the same call.

> **Normative, amended `[cross-review]`, ratified and owned `[author round]`.** The projection
> is built **only** when **both** hold:
> 1. `assessmentGrounding({document, ledger, manifest}) === "ledger_verified"`, and
> 2. `ledger.packDigest === digest`, where `digest` is the `digestDrillPack(document)` the
>    registry has already computed for this record.
>
> Otherwise the index is **empty** — not partial, not best-effort. Clause 2 is this RFC's
> own addition, not a restatement of shipped behaviour, and it converts
> `sourcing-check`'s authoring-time **warning** into a load-time **refusal** for the one
> consumer that speaks records to a learner. It does not change `assessmentGrounding`, does
> not change what `sourcing-check` reports, and does not change `GET /packs/:id`'s
> `grounding` field, all of which stay exactly as shipped.

#### 2.1a Clause 2 is a new normative admission rule. The author ratifies it, and this is the case for it. **`[author round]`**

The cross-review wrote clause 2 and no reviewer has seen it. It is **kept**, and the argument
is not that it is obviously right but that it is measurably cheap, measurably safe in the one
direction that matters, and **structurally required rather than defensive** — the corpus is
about to move under every ledger in it.

**1. The measured cost is exact, bounded, and already falling — measured twice during this
round, which is itself the argument.** At `0241a98`: **5 packs, 186 records, 181 admitted
readings, all `tablebase_result`, all `phase: "endgame"`** `[V]` — `mate-bishop-knight` (52),
`mate-k-q-technique` (27), `mate-k-r-technique` (25), `philidor-passive-rook-convert` (25),
`trajectory-mate-bishop-knight` (52).

> **`[author round]` Re-measured at `c55b9cf` after `caa8afa` (*"feat: wire pack vocabulary
> reach"*) landed mid-round: the cost is now 3 packs, 107 records, 104 admitted readings** `[V]`.
> That commit added a `variantOf` block to `philidor-passive-rook-convert` and
> `trajectory-mate-bishop-knight` and **re-stamped both ledgers in the same commit**, which
> cleared them. **The observation is worth more than the number.** A content wave moved two
> pack digests, carried the re-stamp with it, and the conjunct's cost dropped by 43% in a
> single commit with no action from this RFC. That is exactly the regime §2.1a point 3
> describes — digests move often, re-stamps ride along or they do not — and it demonstrates
> both halves at once: the discipline works when it is applied in-commit, and **the cost of
> this fence is transient by construction**. It also means any figure quoted here has a
> shelf life; **criterion 2 pins the *mechanism* and the *named packs*, and reports the count
> rather than asserting a frozen one.**

Nothing else is touched: the remaining packs and readings are unaffected, and the refusal is
whole-ledger rather than partial.

**2. It cannot misfire on a missing field, which is the failure a naive equality invites.**
`EvidenceLedger.packDigest` is **optional** in the shipped type (`sourcing/types.ts`), so
`ledger.packDigest === digest` would silence any ledger that simply never carried one.
Measured: **32 of 32 committed ledgers carry `packDigest`** `[V]`. So clause 2 refuses only
genuine drift today. **Normative consequence, stated so an implementer does not have to infer
it: a ledger with no `packDigest` is refused, not admitted** — an unstamped ledger is a ledger
that has never been compared to its pack, which is the same epistemic state as a stale one,
and admitting it would reintroduce exactly the hole clause 2 closes.

**3. It is a standing guard, not a one-off cleanup, and that is the decisive argument.**
`rfc/pack-graduation.md` §4.5 establishes that **setting `reviewStatus: "published"` moves the
pack digest**, because `provenance` is inside the digested document. Promotion to
`content/packs/` therefore **staleness-warns every ledger it touches** unless the same commit
re-stamps it. That RFC accepts the obligation — its §7 re-stamps 32 of 32 and its criterion 6
pins `0` stale — and it explicitly makes the re-stamp a **landing-order obligation** shared
with `claim-backing`, whichever lands second. So the corpus is going to move under its ledgers
repeatedly, by design, and the only runtime consequence of getting it wrong today is a
`warning` in a CLI nobody runs during a drill. **Clause 2 is the single line that makes that
class of error visible where it matters and silent where it hurts.**

**4. The error falls in the safe direction, which is the only direction available.** Refusing
costs a learner five endgame packs' readings for as long as the drift lasts. Admitting speaks
a DTZ about a position the pack no longer contains — a manufactured chess fact under law 8,
sourced from an instrument that never measured the thing being described. There is no
symmetric cost here.

**What clause 2 does *not* fix, said plainly so it is not read as more than it is.**
`assessmentGrounding` still over-attests for everyone else. It validates the ledger and the
manifest, joins each record to a **manifest entry** by `sourceId`/`retrievedAt`, and then
requires **exactly one** record matching `/start/fen` and `objective.grading.assessedBy`. It
never reads `ledger.packDigest`, so `ledger_verified` means *"one record is well-linked"*, not
*"this ledger describes this document"* — and that two-valued string is **published on
`GET /packs/:id` as `objective.grading.grounding`** for every consumer, not just this one.
Clause 2 fences this RFC's consumer and nothing else. **The general defect is D223 and it is
not this RFC's to close**; a reviewer should not read clause 2 as having closed it.

**Rejected alternative, recorded so the refusal is a decision.** Admit the stale readings and
annotate them — *"recorded against an earlier version of this pack"*. Refused for the same
reason Open question 2 refuses stating a clock difference: it converts an authoring artefact
into a learner-facing sentence, and it asks a learner to price a document digest. Carried as
Open question 6.

**The cost is temporary and its clearing is owned.** `rfc/pack-graduation.md` §7 re-stamps
**32 of 32** ledgers, which clears all five. Until it lands, five packs go silent rather than
speaking a number about a position their pack no longer contains.

What *is* structurally sound is the **other** half of the original argument, and it is worth
keeping separately because it answers a different question. A run cannot drift away from the
**document**: `RunService.#registeredPack` resolves a run's pack through
`this.#packRegistry?.byDigest(run.packDigest)` `[V]`, so a run is pinned to the exact document
version that was loaded. Combined with clause 2, the chain is
**run → document → ledger**, and each link is a digest equality rather than an assumption.
Neither link existed for the ledger before this section was corrected.

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
  `engine_eval` records live in the **20** opening packs `[V]` (**[cross-review]**: 20, not
  17 — re-derived at `a7e700d` and identical at `bc3cdc1`; see §8.1), where a clock difference
  at the same position is not a difference the search is about. Corroborating: the recorded
  halfmove clocks on those 391 anchors run **0–8** (175 at 0, 82 at 1, 64 at 2, tailing to one
  at 8) `[V]` — nowhere near the fifty-move horizon at which the clock changes what a search
  returns.
- **`tablebase_result` — admitted only when the halfmove clock matches exactly.** DTZ is
  defined relative to the fifty-move counter — it is precisely why the source distinguishes
  `dtz` from `precise_dtz` — so a DTZ read at a different clock is a different fact.
  Normative: `node.fen`'s fifth field must equal `reading.fen`'s fifth field, or the reading
  is not admitted at that node.

> **[cross-review] The strict rule does not cost nothing, and the original "expected zero"
> was measuring the wrong set.** It is true on the authored tree itself — records are produced
> by `enumerate` replaying the same move sequence — but the authored tree is not what a
> `transposeKey` index is *for*. Enumerating every legal successor of all 497 spine-line
> positions at `a7e700d`: **372 of them land on a `transposeKey` that carries a
> `tablebase_result`, and 43 of those 372 (11.6%) arrive with a halfmove clock no record at
> that key holds** `[V]`. Every one is a transposition — the same position reached by a
> different move order — and the gaps are large (`lucena-bridge-convert` node clock 9 against
> a recorded 13; `mate-bishop-knight` node clock 7 against a recorded 3, 13 against 9, 15
> against 11, 19 against 15). These are genuinely different fifty-move states, so **the rule
> stays exactly as specified and is not relaxed.** What changes is the claim: the rule is a
> deliberate **11.6% refusal of tablebase lookups the index could otherwise answer**, taken
> because DTZ at the wrong clock is a wrong number, and Open question 2 / criterion 11 are
> rewritten to report that figure rather than to expect zero.
>
> The sharpest single case is inside one pack. `lucena-bridge-convert` records
> `8/1P2k3/2K5/8/3R4/8/8/1r6 b - -` **twice** — at halfmove clock **9** (supporting a spine
> pointer) and clock **13** (supporting `/deviations/7/moveUci`) — with **byte-identical
> values** (`category: "loss"`, `dtz: -8`, `precise_dtz: -8`, `dtm: -28`) `[V]`. So the corpus
> already contains a position whose reading provably does not depend on the clock, and the
> strict rule refuses it at any third clock anyway. That is the correct trade — the rule
> cannot know which positions are clock-insensitive without probing, and probing is an
> instrument call §7 forbids — but it is a trade, not a free lunch. It is also why
> `PositionEvidenceIndex`'s value type **must** stay `readonly RecordedReading[]` rather than
> collapsing to a single reading: that key holds two.

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

1. **Linkage and digest.** `assessmentGrounding === "ledger_verified"` **and**
   `ledger.packDigest === record.digest` (§2.1). Applies to the whole ledger, not per record.
   **[cross-review]** The second conjunct is new: `assessmentGrounding` attests **one**
   record — the `/start/fen` one that matches `assessedBy` — and never compares the ledger to
   the document, so without it a digest-stale ledger is `ledger_verified` and its records are
   served. 5 of 32 ledgers are digest-stale at `a7e700d` and all 5 read `ledger_verified` `[V]`.
   **`[author round]` `packDigest` is optional in `EvidenceLedger`, and a ledger without one is
   refused rather than admitted (§2.1a).** 32 of 32 committed ledgers carry it `[V]`, so the
   rule costs nothing beyond the five stale packs today.
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
mechanical boundary against `rfc/archive/claim-backing.md` (§11.2).

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
  readonly category: AssessmentCategory;   // packages/runtime/src/branch-scale.ts
  //          ^ [cross-review] the original spelling was `(typeof ASSESSMENT_CATEGORIES)[number]`
  //            with the note "there is no `AssessmentCategory` type in the repo". Both halves
  //            are wrong at a7e700d. `packages/runtime/src/branch-scale.ts` exports
  //            `AssessmentCategory = "win" | "loss" | "draw" | "cursed-win" | "blessed-loss"`
  //            — exactly the five determinate values — and `packages/runtime/src/index.ts`
  //            re-exports it. [V]
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
> **[cross-review] Where these types live, because as originally written they could not
> compile.** §3.5 puts `readings: readonly RecordedReading[]` on `EvidencePacket`
> (`packages/runtime/src/voice.ts`) and §3.6 puts `renderRecordedReading` in
> `packages/runtime/`, while §3.4 typed `category` off `ASSESSMENT_CATEGORIES` in
> `apps/server/src/tablebase.ts`. **`packages/runtime` depends on `@chess-tabiya/schema` and
> `chessops` and nothing else** `[V]` — it cannot import from `apps/server`, and the
> dependency may not be inverted.
>
> **Normative.** `RecordedReading`, `EngineReadingValues`, `TablebaseReadingValues`,
> `PositionEvidenceIndex` and `renderRecordedReading` all live in **`packages/runtime`**, and
> `category` is typed as the runtime's own `AssessmentCategory`. `PackRecord`
> (`apps/server/src/pack-registry.ts`) imports the type from `@chess-tabiya/runtime`, which is
> the direction that already exists — `apps/server/src/tablebase.ts` imports `transposeKey`
> from `@chess-tabiya/runtime` on its first line `[V]`. `ASSESSMENT_CATEGORIES` stays exactly
> where it is and stays the server's value-level tuple; nothing is moved, deprecated or
> duplicated. **The admission check in §3.4 is a membership test against
> `ASSESSMENT_CATEGORIES` performed in `apps/server` at projection-build time**, so the
> five-value narrowing still happens on the server side where the tuple lives, and only the
> already-narrowed type crosses the package boundary.
>
> **`[author round]` Ratified, and one thing the cross-review did not say: the union is
> declared *three* times.** `packages/runtime/src/branch-scale.ts`,
> `packages/schema/src/drill-pack/types.ts` and — as a value-level tuple —
> `apps/server/src/tablebase.ts` each spell out the same five members `[V]`, and the runtime
> re-exports its copy from `index.ts`. So *"type in the runtime, narrow in the server"* is the
> right call for this RFC, but it is the right call among three, and the next RFC will pick a
> different one. The **schema** copy is the deepest — `packages/runtime` and `apps/server` both
> already depend on `@chess-tabiya/schema` — so it is the only declaration that could be the
> single one. **This RFC does not consolidate them**: that is a refactor no consumer is asking
> for, and doing it here would put a cross-package type move inside an RFC that claims no
> version. Ledgered as **D258**, so the next RFC to need the type reads one row instead of
> discovering three declarations.

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
// `[author round]` and ONLY this field. `sentences` is byte-identical to today's at every
// node; `readings` is rendered after the provider returns, never sent to it (§3.8).
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

**[cross-review]** The arms below are rewritten against the values the corpus actually
stamps at `a7e700d`, because the originals invented an engine version. All 391 `engine_eval`
records carry `engineName: "Stockfish"`, `engineVersion: "18"`, `depth: 22`, `multiPv: 1`,
`perspective: "white"` — one identity tuple, 391 times `[V]` — so the first arm's "17.1" named
a version that appears nowhere in `content/`. The tablebase arm is shown against a real
record (`lucena-bridge-convert`, 5 pieces, `category: "loss"`, `dtz: -8`, `dtm: -28`).

```
engine, score:
  "Recorded reading at this position: Stockfish 18 at depth 22, single line, scored
   +0.63 from White's side when this pack was authored on 2026-08-15."

engine, mate:
  "Recorded reading at this position: Stockfish 18 at depth 22, single line, reported
   mate in 6 from White's side when this pack was authored on 2026-08-15."

tablebase:
  "Recorded reading at this position: Syzygy, 5 pieces — loss from White's side, DTZ 8,
   DTM 28 — queried when this pack was authored on 2026-08-15."

tablebase, no DTM published:
  "Recorded reading at this position: Syzygy, 6 pieces — draw from White's side, DTZ 0 —
   queried when this pack was authored on 2026-08-15."
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

> **`[author round]` These sentences do NOT enter `EvidencePacket.sentences`.** The draft said
> they did, and §3.8 changes it. `voiceCheck` is still untouched and the provider seam still
> transmits only `{personaPrompt, sentences, scope}` — with `sentences` byte-identical to
> today's at every node.

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

### 3.8 The provider never receives a recorded reading — the structural answer to §6.1 **`[author round]`**

The cross-review measured that `voiceCheck` does not make absence unspeakable, and moved the
guarantee to a **persona-prompt constraint** on the provider path. **That is not accepted as
the guarantee, and this section is what replaces it.** The reasoning is in §6.1; the mechanism
is here, because it is a specification change rather than an argument.

> **Normative.** `EvidencePacket` gains `readonly readings: readonly RecordedReading[]`
> (§3.5). **`EvidencePacket.sentences` gains nothing.** `renderRecordedReading`'s output is
> composed **after** the provider returns, inside `renderVoice`:
>
> ```
> renderVoice(provider, packet, persona, scope):
>   deterministic = packet.sentences.join("\n")          // unchanged, readings absent
>   text          = <provider attempt, retry, or deterministic fallback>   // unchanged
>   return text + packet.readings.flatMap(renderRecordedReading)           // appended, frozen
> ```
>
> The provider's input is `{personaPrompt, sentences, scope}` and **`sentences` is
> byte-identical to what it is today, at every node, whether or not a reading exists.** No
> recorded reading, and no vocabulary describing one, ever crosses the provider seam.

Five consequences, and they are why this is worth a scope amendment rather than a criterion:

1. **The concept never reaches the model, at any node.** This is what the persona constraint
   was reaching for and could not deliver: criterion 16a removes the words *reading*,
   *recorded*, *coverage*, *queried*, *silent*, *absent* from the persona string, but the
   **frozen sentence itself names the concept** — every arm in §3.6 opens *"Recorded reading at
   this position"*. A provider told nothing by the persona is told everything by the sentence,
   at every node that has one. §3.8 removes both halves.
2. **Absence becomes structurally unspeakable on the provider path too**, for the reason that
   actually binds a language model: it has no input about readings to be silent about. The
   guarantee stops being *"we asked it not to"*.
3. **Law 8 gets stronger, not weaker.** ADR-0005 permits *frozen strings over record values*
   as the one form of machine prose. Under §3.8 a recorded reading is **only ever** that — it
   is never re-worded, never paraphrased, never summarised. The instrument, version, depth,
   perspective and date reach the learner exactly as stamped.
4. **`/reasoning-review` is excluded by construction, and it is the site that needed it most.**
   It does not call `renderVoice`; it calls `voiceProvider.render` directly and filters the
   response with `reasoningMatchCheck`, **never calling `voiceCheck` at all** `[V]`. Under the
   draft's design its packet would have carried reading sentences to an external provider with
   no check in front of them. Under §3.8 it carries none.
5. **Criterion 7 gets simpler and stronger**: `packet.sentences` is byte-identical to today's
   at **every** node, not only at nodes with no reading. That is a total assertion over the
   corpus rather than a spot check.

**Two costs, named rather than buried.**

- **It amends this RFC's own scope boundary.** §Motivation lists *"any change to `voiceCheck`,
  `renderVoice`, the provider seam, or the fallback"* as out of scope. `voiceCheck`, the seam
  and the fallback are still untouched; **`renderVoice` is not** — it gains one append. The
  boundary is corrected in §Motivation rather than quietly exceeded.
- **Recorded readings read differently from the rest of the packet.** Every other packet fact
  — structures, markers, endgame census, authored items — is offered to the provider and may
  be re-worded in the Tabiya voice. A recorded reading is appended verbatim, so the output has
  a seam: persona prose, then frozen instrument prose. **That is a real UX cost and it is the
  reason to decline this section** if the owner prefers voice consistency to a structural
  absence guarantee. Declining returns the RFC to the cross-review's position — readings in
  `sentences`, guarded by a persona-prompt default — with §6.1's residue as stated. Carried as
  **Open question 7**, with the author's recommendation to keep §3.8.

**D145 is not contradicted; it is used.** D145 measures that a structured packet field is
invisible to the renderer *and* to the check, and concludes that *"widen the packet" means
"widen the sentences"*. That is right, and §3.8 takes the invisibility as the mechanism rather
than as the limitation: the field is invisible to the renderer **on purpose**, and the sentence
it produces is added on the far side of the renderer. The reading still reaches the learner —
that was D145's real point — it just does not reach the model on the way.

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

The instinct is to put the reading in the packet and gate the display. **That is wrong here.**
`renderVoice`'s fallback returns `packet.sentences.join("\n")` verbatim to the learner when
the provider fails or fails the check `[V]`, and under §3.8 a recorded reading reaches the
learner **on every path, deterministically, with no model in the loop at all**. The gate
therefore belongs at construction: a reading that may not be spoken now is not in the packet
now — because once it is in the packet there is no later gate to catch it.

> **[cross-review] The original justification was stronger than the code.** It read: *"The
> check validates renderer output against `packet.sentences`; a sentence in the packet is
> therefore a sentence the renderer may say … packet membership is a speaking licence."* The
> first clause is right and the last is a **one-way** implication that §6.1 measures. Executed:
> `voiceCheck` passes an entirely invented recorded-reading sentence against a packet that
> does not contain it, because that sentence carries no square, no move, no `CHESS_LEXICON`
> noun, no `BANNED_JUDGEMENTS` word and no `PRESCRIPTIVE_VERB` `[V]`. **So packet membership
> licences chess tokens; withholding a sentence does not prohibit the proposition.**
>
> **This strengthens the placement rather than weakening it, and that is why it is corrected
> here rather than argued away.** If `voiceCheck` were the tight binder the draft assumed, a
> render-time gate would be nearly as safe. Because it is not, **construction-time is the only
> place a gate is load-bearing at all**: the deterministic fallback path has no check in front
> of it, and the provider path has a check that a fluent absence-or-invention sentence walks
> straight through. Two independent reasons, neither of which is the one originally given.
>
> **`[author round]` A third reason, measured, and it is the strongest of the three.**
> `voiceCheck` has exactly **one** production call site in the repository — inside
> `renderVoice` (`apps/server/src/guidance.ts`) `[V]`. **`/reasoning-review` does not call
> `renderVoice`.** It calls `voiceProvider.render(packet, voicePersona, prompt, "reasoning")`
> directly and filters the *response* with `reasoningMatchCheck`, so on that route
> `packet.sentences` is transmitted to an external provider **with no `voiceCheck` in front of
> it at all** `[V]`. One of the four construction sites therefore has *zero* render-time
> checking, not weak checking. A render-time gate would not merely be weaker there; it would
> not exist. §3.8 removes readings from that route's payload entirely, and construction-time
> disclosure is what governs everything else in it.

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

### 4.2 The construction sites — D140 was real and **has already landed**

> **[cross-review] This section is rewritten twice over.** It said there were **five**
> construction sites and its own table listed four; there are **four** `[V]`. And its
> normative blocking fix **shipped before this cross-review ran**: commit `a452abb`
> (*"fix: gate reasoning review evidence"*) inserted
> `requireGuidanceDisclosure(service.guidanceAccess(route.runId, principal, access.node.id))`
> immediately above `/reasoning-review`'s `evidencePacket(...)` call `[V]`. D140 is therefore
> **closed by another lane**, not owed by this one, and criterion 4's *"must fail before the
> fix and pass after, and it is written first"* is unexecutable as written — it is rewritten
> to a **regression** criterion instead.

There are **four** places a packet is constructed, all in `rest.ts`, and at `a7e700d` **all
four apply the gate** `[V]`:

| site | scope | applies `requireGuidanceDisclosure`? |
|---|---|---|
| `/voice`, compare branch | `compare` | **yes** |
| `/voice`, non-compare branch | `marker` / `reading` / `steering` / `story` | **yes** |
| `/speech` | `marker` / `reading` / `steering` / `story` | **yes** |
| `/reasoning-review` | `reasoning` | **yes, since `a452abb`** |

The defect this section found is worth keeping on the record because it explains *why* the
fix is the shape it is. `/reasoning-review`'s own guard is `reasoningReviewAccess`, which
checks read authorization, that a `reasoning.recorded` event exists, and
`reasoningDeliveryOpen(run, checkpointEventSeq)` — a **narrower, checkpoint-scoped** predicate
that **does not check role** `[V]`. So before `a452abb`, a participant or spectator with read
access could cause a packet carrying rung-3 `human_divergence` sentences — built from the
*unfiltered* `pivotalMarkers`, not the role-aware `liveAdmitted` — to be transmitted to an
external provider under a role `requireGuidanceDisclosure` exists to refuse. `a452abb` did not
widen `reasoningReviewAccess`; it added a **second, independent** call to
`service.guidanceAccess` and gated on that, which is why the fix composes with this RFC rather
than colliding with it.

> **Normative, restated `[cross-review]`: all four packet construction sites apply
> `requireGuidanceDisclosure`, and a test pins that a fifth cannot be added without one.**
> The pin is the part this RFC still owes — `a452abb` shipped the call, not a guard against
> the next site forgetting it. Criterion 4.

### 4.2a Can this gate fail the way `engine-leverage`'s did? — the D194 shape, answered

**[cross-review] Added because the brief asks it directly and the RFC never answered it.**
D194 returned a sibling RFC for exactly this: `SelectionCandidate` gained `scoreCp`,
`opponent.move_selected` carried it into the run log, and `GET /runs/:id/events` served it
during committed play because `publicEvents`' barrier — `engineFeedbackEvent` — matches only
`evidence.attached` and machine-ref `objective.state_changed` `[V]`. **The failure was
structural, not careless: the barrier is keyed on the event *type*, while the egress is a
*passthrough* of whatever payload that type carries.** A new field on an unlisted type walks
through by construction, and no reviewer of the field is looking at the barrier.

This RFC's readings cannot take that door, and the reason is a property of the code rather
than a promise:

| | `engine-leverage` / D194 | this RFC |
|---|---|---|
| where the number lives | a **run event payload** (`opponent.move_selected.selection.candidates[]`) | a **`PackRecord` field** (`positionEvidence`), never an event |
| how it egresses | `publicEvents` → `GET /runs/:id/events`, a **passthrough** that forwards the whole event object | `projectPackDocument` → `GET /packs/:id`, an **enumeration** that constructs its output field by field |
| what a new field does by default | **ships**, unless a type-keyed barrier happens to list its event | **nothing**, unless someone writes the field into the projection |
| the gate's key | the event **type** | the **route**, via `requireGuidanceDisclosure` at packet construction |

Three route audits, run at `a7e700d`, close the remaining doors `[V]`:

1. **`GET /packs/:id`** calls `projectPackDocument(pack.document, pack.assessmentGrounding,
   pack.channel, pack.publisherHandle)` — four scalars and the document, no `PackRecord`
   spread. A new record field is invisible to it. Criterion 3.
2. **`GET /packs`** returns `service.packs()` → `PackRegistry.list()` → `PackSummary`, a
   closed ten-field interface built by explicit assignment. Also invisible. **Criterion 3 is
   extended to cover it**, because the original criterion named only `projectPackDocument`.
3. **`GET /packs/:id/export`** routes to Pack Studio's draft store, not the registry, and
   `distillRun(run, source: PackRecord | undefined, …)` reads only `source.document.mode` and
   `source.document` — no spread of the record `[V]`. **Criterion 3 is extended to pin that
   too.**

And the packet itself never egresses as an object: `ExternalHttpVoiceProvider.render` posts
`{personaPrompt, sentences, scope}` `[V]`, `renderVoice`'s fallback returns
`packet.sentences.join("\n")`, `/speech` returns audio bytes, and `/reasoning-review` returns
`reasoningMatchCheck`-filtered quotations. **The only field of `EvidencePacket` that leaves
the process is `sentences`** — which is D145 read as a safety property rather than a
limitation, and it is why §4.1 places the disclosure gate at construction. Under §3.8
`sentences` never carries a reading, so `EvidencePacket.readings` does not egress by any
route at all.

> **Normative `[cross-review]`.** `PackRecord.positionEvidence` is **never** included in any
> wire projection, and no route may serialize a `PackRecord`. Criterion 3.

**`[author round]` The contrast is worth stating as a rule, because `engine-leverage`'s own
remedy repeats the defect one layer in.** D194 was fixed at `5835dfc` by `publicSelectionEvent`,
which strips `scoreCp` and `wdl` from candidates by **spread-minus-two** — a **deny-list**. It
is correct for the two fields it names and is a better remedy than barriering the whole event,
which would have stopped the opponent's move reaching the client. But it enumerates what to
**remove**, not what to **keep**, so a third measurement added to `SelectionCandidate` is
public the moment it exists and no test fails. That is **D235**, and it is the same failure
shape as D194: a payload passthrough with a keyed exclusion ships new fields by default.

**Projection by enumeration cannot fail that way, and that — not a promise of care — is what
this RFC is relying on.** `projectPackDocument` and `PackSummary` build their output field by
field, so a new `PackRecord` field is invisible to `GET /packs/:id` and `GET /packs` *by
construction*: the default for an unlisted field is **absent**, where a passthrough's default
is **present**. The general statement is D230, and this RFC is the worked contrast to it. A
reviewer should read criterion 3 as pinning the enumeration property rather than as auditing
three routes once.

### 4.3 Gate 3 — the surface may withhold and may never add

`AssistanceConfig` decides form and context; `design/05` §3-forms' acceptance test governs:
*"render the same content as a sentence; if the sentence would be refused, so is the
overlay."* A recorded reading is a **sentence-form** fact in this RFC. No overlay, lit square,
arrow or halo is specified here, and any future form for it inherits gate 2 unchanged. A
surface may decline to show a reading the packet legitimately carries; **no surface may show
a reading the packet does not carry**, because there is nothing to show.

> **`[author round]` The original clause added *"and `voiceCheck` would refuse the words"*,
> and it is struck as the third sentence in this RFC leaning on packet membership as a
> licence.** It is wrong twice over. `voiceCheck` runs at exactly one place — inside
> `renderVoice`, over **provider output** `[V]` — so it never runs on a surface render at all;
> and even where it does run it would not refuse an invented reading sentence, which §6.1
> demonstrates by execution. **What actually holds gate 3 is that a surface has no reading to
> render**: `positionEvidence` never crosses a wire projection (§4.2a, criterion 3), and
> `EvidencePacket.readings` is empty at a node with no admitted record. The prohibition is an
> absence of data, not a check — which is weaker than the draft implied and is the honest
> statement.

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
| `explorer_frequency` | **0** | **refused by clause 1** — 0 records in `content/drafts/`, 0 in `content/candidates/`, 0 anywhere `[V]`. **[cross-review]: the refusal stands, its stated ground does not.** See §5.1a |
| `opening_identity` | 0 in loadable packs (52 in `content/candidates/`) | **refused** — anchors by `{spineNodeId}` and `/title`, not by position; rung 5 identity, not a measurement |
| `puzzle_provenance` | 0 in loadable packs (26 in `content/candidates/`) | **refused** — a citation, `grounds: "citable_source"` |
| *templated `engine_eval`* (`engine-move-loss/v1`) | **0** | **refused as a verdict** — `bestSan` plus a ranked `candidates[]` is the instrument's choice among moves (§1 consequence 2) |

### 5.1a Is rung 4 still a refusal, or a deferral wearing a refusal's label? — **[cross-review]**

The count is unchanged and I re-derived it: **zero `explorer_frequency` records exist
anywhere in the repository** at `a7e700d` — 0 across the 32 draft ledgers, 0 across the 36
candidate ledgers (whose 129 records are 52 `opening_identity`, 27 `position_legality`, 26
`puzzle_provenance` and 24 `engine_eval`) `[V]`. Clause 1 is a **producer** test, and there is
no producer. **So the refusal is honest, and it is kept.**

**But the sentence justifying it — *"no producer has ever written one"* — is now the least
interesting true thing about rung 4, and leaving it as the whole reason would make this a
deferral wearing a refusal's label.** Three things moved after this RFC was drafted:

1. **The owner ruled.** D126, 2026-08-15: explorer W/D/B result splits are **admissible** as
   `corpus_observed`, rung 4, with the boundary *"the split may be stated; it may never be
   converted into a move verdict or a quality claim."* The question is no longer whether the
   product wants rung 4.
2. **The content exists — as prose.** `da77c56` authored **16 `corpus_observed` claims across
   eleven middlegame packs**, described in its own message as *"the first position-level
   rung-4 evidence in the repo"*.
3. **And it is unbound.** **D150** measures why: `EVIDENCE_KINDS` has no census kind;
   `explorer_frequency`'s values are validated key-exact against eight move-share fields, so
   `white`/`draws`/`black` fail `EVIDENCE_VALUES_INVALID`; and `check.ts` maps `corpus_observed`
   to `explorer_frequency` alone. **Those eleven packs pass only because they have no
   `.evidence.json` at all** — they are eleven of the ledger-less packs §8.4 counts.

So the honest statement is the third one, and it is written here rather than left implied:
**rung 4 is refused because the record kind that could carry the owner's ruling does not
exist yet, not because nobody wants the number.** That is still clause 1 — a record kind with
no producer is exactly what clause 1 refuses — but it is a refusal with a **named, specified,
in-review unblocker** (`rfc/archive/claim-backing.md` §3.7's `explorer_position_census`) rather than
an absence of demand. When records of that kind exist in a loadable pack, this projection
gains **one registry row** and nothing else changes; §8.3 and §11.2 hold unaltered. **The
distinction that keeps this a refusal rather than a deferral is that this RFC ships no
placeholder, no disabled branch and no reserved field for it** — criterion 12 fails an
advertised kind with no registry row, in both directions.

> **`[author round]` That last sentence was asserted, and it is now verified against the
> specification as it stands after this round.** Four places a deferral would leave a mark, and
> none of them has one:
> - **§3.1 `RecordedReading.kind`** is the closed union `"engine_eval" | "tablebase_result"`.
>   No third member, no `| string`, no optional third arm.
> - **§3.3 gate 2** tests membership in a two-element set. There is no `explorer_frequency`
>   branch to enable.
> - **§3.4** declares `EngineReadingValues` and `TablebaseReadingValues` and **no third values
>   interface**. There is no reserved field, no optional census shape, no `unknown` escape.
> - **§3.6 `renderRecordedReading`** has two arms plus a mate variant. No frequency arm exists,
>   and there is no dead branch guarded by a flag.
>
> The **only** trace rung 4 leaves in the shipped surface is §5.1's disposition row — a
> published *refusal with a reason*, which is the opposite of a placeholder: it is a recorded
> decision that costs one table row and enables nothing. Zero `explorer_frequency` records
> exist anywhere at `0241a98` — 0 in the 32 draft ledgers, 0 in the 36 candidate ledgers `[V]`
> — so clause 1's producer test is satisfied on measurement, not on preference. **The refusal
> stands and it is a refusal.**

Published as `Capabilities.recordedReadingKinds`, computed from the registry exactly as
`EngineCapabilities.get` computes `guardBasis`, in the
`DECLARED_UNIMPLEMENTED_POLICY_MODES` style the audit called *"the pattern the rest of the
layer should copy"*. Criterion 12 fails when an advertised kind has no registry row.

> **[cross-review] Reuse the disposition register that landed while this was drafting.**
> `a7e700d` added `CAPABILITY_DISPOSITIONS` and `assertAdvertisedCapabilityDispositions` to
> `apps/server/src/capabilities.ts`, with a four-valued
> `CapabilityDispositionKind = "reached" | "refused" | "unmeasured" | "impossible"`, a
> `reason` on every row, and a coverage assertion that throws when an advertised engine option
> has no disposition `[V]`. That is the same register discipline §5.3 adopts, already shipped,
> already published on `Capabilities`. **`recordedReadingKinds` should be computed from
> §5.1's registry and cross-checked against `CAPABILITY_DISPOSITIONS` rather than standing
> beside it** — note that register already carries `Explorer / position white / draws / black
> → reached (corpus panel)`, which is precisely the surface/packet split D147 names. Two
> registers that can disagree about the same instrument is the drift criterion 12 exists to
> prevent, so criterion 12 is extended to cover the cross-check.

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
  sentence about absence. **[cross-review]:** true of the packet and of every code path this
  RFC ships; **not** true of an external renderer, which `voiceCheck` does not stop (§6.1,
  executed). **`[author round]`: the lever is §3.8 — the provider is never given a reading or
  the vocabulary for one — with criterion 16a as a second line rather than the guarantee.**

---

## 6. The honesty of an absent record

Most positions a run visits are off the authored tree and will have no reading (§8.2). A
packet that carries a reading at some nodes and not others must not let the silence read as a
verdict. Four rules. **[cross-review]:** the first was described as needing *"no new machinery
at all"*, on the belief that `voiceCheck` already enforced it. It does not (§6.1, executed), so
rule 1 costs one persona-prompt constraint and rule 3 costs one grep test — criterion 16.
**`[author round]`: the persona-prompt constraint is not enough on its own and is not the
guarantee.** Rule 1 now costs §3.8 — the provider never receives a reading — plus the persona
constraint as a second line. §6.1 states what that does and does not buy.

### 6.1 Absence is unspeakable because the model is never given the concept — the guarantee, stated for an owner

> **[cross-review] This section's central claim was tested against the shipped `voiceCheck`
> and it is FALSE. Absence is speakable, and nothing stops the renderer speaking it.**
> `voiceCheck` refuses exactly four things: `SQUARE`/`UCI`/`SAN` tokens, the 18-word
> `CHESS_LEXICON`, the 19-word `BANNED_JUDGEMENTS` and the 25-word `PRESCRIPTIVE_VERBS`, each
> admitted when it already appears in `packet.sentences` `[V]`. **An absence sentence contains
> none of them.** Executed against a packet whose only sentence is
> `"This pack declares: opening."`, all four of these return `valid: true` `[V]`:
>
> - *"No reading was recorded at this position."*
> - *"The engine is silent here."*
> - *"Nothing was recorded for this spot when the pack was authored."*
> - *"No measurement exists here; elsewhere on this line there was one."*
>
> The last one is the dangerous one, and it is precisely the sentence §6 exists to prevent.
>
> **The same run establishes the more general fact, which §4.1 leans on harder than it can
> bear.** A sentence the packet does **not** contain — *"Recorded reading at this position:
> Stockfish 18 at depth 22, single line, scored +0.63 from White's side when this pack was
> authored on 2026-08-15."* — also passes `voiceCheck` against that same packet `[V]`, because
> it too contains no square, no move, no chess noun, no judgement and no prescriptive verb.
> **So packet membership is a speaking licence only for chess *tokens*. Non-membership is not
> a speaking prohibition for anything else.** That is D146 stated at full strength rather than
> as a residual, and it is a property of the shipped check, not of this RFC.

**`[author round]` The cross-review's replacement is declined, and this is why.** It moved the
guarantee to a **persona-prompt constraint** — *"a renderer that is never told the concept
exists has no reason to word it"* (criterion 16a). That reasoning is sound and its conclusion
does not follow from the draft's own design, for a reason the cross-review did not check:
**the frozen sentence names the concept.** Every arm in §3.6 opens *"Recorded reading at this
position"*. So a provider stripped of the words by the persona is handed them by the packet, at
every node that carries a reading. Criterion 16a would have constrained the *smaller* half of
the provider's input while the *larger* half taught the concept in the RFC's own words. **A
prompt constraint is not accepted as the guarantee here**, both because it is advisory and
because in this specification it was not even complete.

> **Normative, amended `[author round]`. The guarantee, in the words an owner can act on.**
>
> **1. On every path this RFC ships, absence produces no output — structurally, and this is
> the whole of it.** `renderRecordedReading` has no absence arm and none may be added
> (criterion 7). At a node with no admitted record, `packet.readings` is empty, the composition
> in §3.8 appends nothing, and `renderVoice`'s fallback is `packet.sentences.join("\n")` `[V]`
> — which cannot contain a sentence that was never built. **No shipped code path can say that
> a reading is missing.**
>
> **2. The external provider is never given the concept, on any node.** Under §3.8 it receives
> `{personaPrompt, sentences, scope}` with `sentences` **byte-identical to today's**, so no
> recorded reading and no vocabulary describing one crosses the seam — at nodes that have a
> reading as much as at nodes that do not. Criterion 16a survives as a **second** constraint
> on the persona string, not as the guarantee. The call is also **stateless and single-node**:
> `ExternalHttpVoiceProvider.render` transmits one packet for one node and carries nothing
> between calls `[V]`, so the specific sentence §6 exists to forbid — *"No measurement exists
> here; elsewhere on this line there was one"* — asks the provider to assert something its
> input has never contained.
>
> **3. What is genuinely unguarded, stated so accepting this RFC is accepting it.** A provider
> that invents absence prose out of its own priors is refused by **nothing** — not by this RFC,
> not by `voiceCheck`, not by anything in the repository. `voiceCheck` passes all four absence
> sentences above and a wholly invented recorded-reading sentence `[V]`, and on
> `/reasoning-review` it is not called at all `[V]`. **There is no output check on the
> proposition anywhere in this system, and a token filter cannot become one.** What §3.8 buys
> is that the model has no *reason* and no *material* to invent this particular class of prose;
> what it does not buy is a refusal if it does anyway.
>
> **4. The only mechanism that would make this a guarantee rather than a bound** is an output
> check on propositions, which no allow-list over tokens can be, and which this RFC does not
> propose and should not. **This is the ceiling of the shipped design**, it is the same ceiling
> `claim-backing` §2 names for its span binding and D163's routing answers from the other side,
> and it is D226/D234.

**Where that leaves the three mechanisms, in decreasing strength.** (1) No absence arm exists
to render — structural, criterion 7. (2) No reading vocabulary reaches the provider —
structural under §3.8, criterion 7a. (3) The persona prompt never names the concept — a
**default**, not a guarantee, because `voicePersona` is a deployment option
(`ApplicationOptions.voicePersona`) and a test can only pin the shipped default `[V]`, which
today is *"Clear, concise Tabiya voice. Do not add chess claims."* and contains none of the
forbidden words. Criterion 16a is kept and re-scoped to say exactly that.

This is `design/05`'s clause 4 enforced by the mechanisms that exist, named individually and
ranked, rather than attributed wholesale to a check that does not do it.

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

> **[cross-review] "Once per surface" was prose with nothing behind it, and it is the rule
> most likely to erode.** No acceptance criterion covered §6.3 at all, so nothing would have
> failed if an implementer rendered the guard beside each reading — which is the natural thing
> to do, and which converts it into exactly the per-node absence signal §6.1 refuses. Two
> mechanical properties make it checkable and both are now criteria (**16**):
> **(a)** the string is a module-level frozen constant rendered by the surface container, not
> by the per-node component — the shipped `CORPUS_GUARD` in `apps/web/src/lib/corpus-sentences.ts`
> is the exact precedent `[V]`; and
> **(b)** a grep test asserts the constant is referenced **once** outside its own module, and
> that no per-node renderer imports it. That is not a proof, but it is the difference between
> a rule and a sentence.
>
> **`[author round]` The precedent has already forked once, and the criterion must be written
> against that.** `CORPUS_GUARD` is *"These counts say what this population played, not what is
> good."*; `apps/server/src/repertoire.ts` declares **`REPERTOIRE_CORPUS_GUARD`** — the same
> sentence with the trailing period dropped — and interpolates it into two generated strings
> `[V]`. So the repository already carries **two near-identical population guards in two
> packages**, and the "one constant, one render site" discipline this criterion adopts was
> broken by the second capability that needed the same guard. That is not an argument against
> the pattern; it is the reason criterion 16b must assert **no second declaration of the same
> sentence anywhere in the tree**, not merely one reference to the constant. Ledgered as
> **D264**, because the next capability to need a guard will fork it a third time.

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
| **further refused by §2.1's digest conjunct** (digest-stale ledgers, all endgame) | **104** at `c55b9cf` (181 at `0241a98`) `[author round]` |
| **index entries** across the 32 per-pack indexes | **731** `[author round]` |
| **distinct positions corpus-wide** (`transposeKey` over all 32 ledgers) | **568** `[author round]` |
| packs covered | **32** |
| authored position pointers in those packs (`authoredPositionPointers`: `/start/fen` + recursive spine `moveUci` + top-level deviation `moveUci`) | **732** |
| **authored-tree coverage** | **732 / 732 pointers = 100.0%**, in **32 of 32** packs, zero gaps, **one duplicate key** `[cross-review]` |
| distinct anchor FENs corpus-wide | 569 — 281 with an `engine_eval`, 288 with a `tablebase_result` |
| the same, as `transposeKey`s | **568** — 281 engine, 287 tablebase, **overlap 0** `[author round]` |

> **[cross-review] 731, not 732, and the missing one is a finding rather than an off-by-one.**
> Building the index exactly as §3.3 specifies over all 32 ledgers at `a7e700d` yields **731
> distinct keys from 732 admitted records** `[V]`. The collision is inside
> `lucena-bridge-convert`: two `tablebase_result` records share the `transposeKey`
> `8/1P2k3/2K5/8/3R4/8/8/1r6 b - -` at halfmove clocks **9** and **13**, one supporting a
> spine pointer and one supporting `/deviations/7/moveUci`. It is the only such collision in
> the corpus, and there are **zero** among the 391 `engine_eval` records `[V]`.
> Three consequences: **pointer coverage is still 732/732 and still 100%** (the two records
> back two different pointers); **"zero duplicates" is wrong** and is corrected above; and
> the index's value type must stay an **array** (§2.2). Criterion 1 is corrected to 731.

> **`[author round]` 731 is right and its label was wrong, and the difference is a fact about
> the index rather than a rounding argument.** Re-derived at `0241a98`: **731 is the number of
> `(pack, transposeKey)` index entries** — 732 admitted records minus the one intra-pack
> collision. **Corpus-wide there are 568 distinct positions**, because the index is built
> **per pack** and **158 FENs are recorded in more than one pack's ledger** `[V]`. Calling 731
> *"distinct positions"* double-counts every opening transposition the corpus already holds.
> Both numbers are load-bearing and they answer different questions: **731** is what criterion 1
> must assert about the built index, **568** is how much of chess the corpus actually describes.
> The gap between them — 163 — is D144's cross-ledger duplication measured from the other side.
> The same split appears one row down: 569 distinct anchor **FENs** collapse to **568**
> `transposeKey`s, which is the `lucena-bridge-convert` pair again.

Two structural findings fall out and are ledgered rather than buried:

- **No position in the corpus carries both an engine reading and a tablebase reading**
  (281 + 288 = 569 exactly). The two instruments **partition the corpus by pack**: **20** packs
  carry only Stockfish records and are all `phase: "opening"`, **12** carry only Syzygy records
  and are all `phase: "endgame"`, and no pack mixes. So a packet
  can never corroborate one instrument against the other, and any future design that assumes
  it can is assuming a corpus that does not exist. **D143.**
  **[cross-review]:** the split is **20 / 12**, not the 17 / 15 originally stated — re-derived
  at `a7e700d` and **identical at `bc3cdc1`**, so this was a drafting error rather than tree
  movement `[V]`. The partition finding itself — no pack mixes, 20 + 12 = 32 — survives intact,
  and it is the load-bearing half.
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
| spine-line positions (including start), summed per pack | **497** |
| **legal moves** at those positions (promotions counted once) | **11,559** `[cross-review]` |
| — the same frontier as **distinct** successor positions by `transposeKey`, **summed per pack** | **11,464** `[cross-review]` |
| — the same, **corpus-wide** (packs sharing early positions collapsed) | **7,589** `[author round]` |
| authored successor **pointers** (465 spine continuations + 235 deviations) | **700 — 6.06% of 11,559** |
| — the same frontier as **distinct** authored successor positions, summed per pack | **699 — 6.10% of 11,464** `[cross-review]` |
| **successors with no record** | **10,765 of 11,464 — 93.90%** (equivalently 11,094 of 11,559 moves — 93.94%) |
| mean legal moves per position | 23.26 (openings ~34, endgames ~11) |
| positions with a record more than one ply off the authored tree | **0, by construction** |

> **[cross-review] The cliff is confirmed; two labels on it were wrong, and neither changes
> the conclusion.** Re-derived at `a7e700d` by replaying all 32 packs from `start.fen` `[V]`:
> **11,559 is the count of legal moves** at the 497 spine-line positions, not of *distinct*
> successors — distinct successor positions are **11,464** by `transposeKey` (11,562 by full
> FEN, i.e. with the three promotion choices expanded). And **700 is the authored *pointer*
> count**; **699 positions** are distinct, because one deviation transposes back onto its own
> spine. 465 spine continuations `[V]` and 235 deviations `[V]` both reproduce exactly, and
> 234 of the 235 deviations land off-spine `[V]`.
>
> Both framings are internally consistent (pointers ÷ moves = 6.06%; positions ÷ positions =
> 6.10%) and the difference is a rounding artefact against a 94% gap. **The finding is
> unchanged and is the one that matters: coverage is total on a line and empty one ply
> beside it.** The rows above now state both denominators so criterion 13's re-derivation has
> something unambiguous to match.
>
> One thing the original understated, in the honest direction: because lookup is by
> `transposeKey`, an *unauthored* move order that **transposes back** into an authored
> position does get a reading. Measured: **743 of the 11,562 promotion-expanded successors
> hit an authored key** (372 tablebase, 371 engine) against 699 distinct authored positions
> `[V]` — so transposition buys roughly 6% more arrivals than move-order-faithful coverage
> would. It does not soften the cliff; it is noise against 94%.

> **`[author round]` Every figure above reproduces at `0241a98`, and the denominator needs one
> more label to be unambiguous.** 497 / 11,559 / 11,464 / 11,562 / 700 / 465 / 235 / 699 /
> 234-off-spine / 743 arrivals (372 tablebase + 371 engine) all reproduce exactly `[V]`.
> **11,464 and 699 are *per-pack sums*, not corpus-wide counts** — the same distinction §8.1
> draws for 731 versus 568, and it matters for the same reason: 20 opening packs share the
> standard start position and most of their early tree, so **corpus-wide there are only 7,589
> distinct successor positions** `[V]`. Per-pack is the right denominator here, because the
> index is per pack and a learner drilling one pack meets one pack's frontier; the corpus-wide
> number is stated so nobody re-derives it and thinks the RFC is out by 34%. **The cliff is
> unchanged under either denominator** — 93.90% per pack, and worse corpus-wide once shared
> positions are counted once.
>
> **The stated conclusion, restated on the corrected numbers and unchanged by them:** of the
> **11,464** distinct positions one legal move from an authored spine position, **699 carry a
> record and 10,765 do not — 93.90% uncovered** — and past that first ply the corpus contains
> **nothing at all**. Coverage does not thin; it stops. That is what §6 is written against, and
> it is why §3.5 refuses cross-node arithmetic: a difference taken across that boundary
> measures the author's query budget and would be largest exactly where the learner left the
> book.

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

The unblocker is named and not claimed: `rfc/archive/claim-backing.md` §3.7's
`explorer_position_census`. When records of that kind exist in a loadable pack, this
projection admits them by adding **one row** to §5.1's registry — no new gate, no new
sentence mechanism, no schema move. That is the argument for building the registry as a
registry rather than as two hardcoded branches.

### 8.4 The contingency, stated rather than assumed — D138

**`content/packs/` contains only `.gitkeep`.** `[V]` All **53** pack documents the registry
loads — 47 authored plus **six browser fixtures**, see below — and all 32 ledgers live in
`content/drafts/`, which `PackRegistry.loadDefault` includes **only when
`development === true`**; a `draftFile` outside development is a `TypeError`. `[V]`

> **`[author round]` "47" is retired as a denominator, and the reason is that no code computes
> it.** The cross-review found the exclusion; this round applies it everywhere in this section
> rather than annotating it once. **53 pack documents, 6 of them `*.browser.json` fixtures,
> 32 with a ledger, 21 without** `[V]`, re-derived at `0241a98`. `jsonFiles` excludes only the
> four `SIDECAR_BASENAMES` suffixes, and `*.browser.json` is not one of them, so **the registry
> indexes the fixtures as ordinary packs**. Every figure in this RFC quoted "of 47" was
> silently applying an editorial exclusion that exists nowhere in the tree — which means no
> test could ever have asserted it. The honest denominators are **53** (what loads) and **32**
> (what gets a non-empty index); "47" is used below **only** where the original row is quoted
> for the record. **D227** is the row, and **D257** carries the consequence this round adds:
> a corpus figure that no code can reproduce is a figure that cannot be pinned by a criterion.

So the measured payoff of 732 readings across 32 packs is the payoff **in a development
deployment**. In a deployment that loads only `content/packs/`, the payoff is **zero readings
across zero packs**, and the mechanism is a correctly-behaving empty map.

That is not an argument against the mechanism — it is empty-corpus-safe by construction, and
it is the same corpus every other pack-attached capability in flight depends on. It is an
argument against claiming a number this RFC has not earned. **The 732 is contingent on a
content promotion this RFC does not perform and does not block on.** Ledgered as D138 and
carried into Open question 4 as an owner call, because "the corpus is dev-only" is a fact the
whole in-flight wave inherits and none of the sibling RFCs states.

> **[cross-review] This is a stated dependency, and it now has an owner — say so.** D138 was
> opened by this RFC on 2026-08-16; the same fact was re-found the same day, at larger scope,
> as **D162** (*"a production deployment serves ONE pack — the schema example"*, owner-gated),
> and D162 records that **0 of 47 packs has an empty `provenance.graduationBlockers`**, so
> nothing can graduate today either. **`rfc/pack-graduation.md` owns the promotion.** The
> dependency is therefore not "a content wave with no owner" but a **named sibling RFC**, and
> this RFC's position is unchanged and correct: not a blocker, because the mechanism is
> empty-corpus-safe, but a **declared dependency of the 732** rather than a footnote. Open
> question 4 is amended accordingly. Two figures in this RFC turn out to depend on
> `pack-graduation` landing — the 732 (via D138/D162) and the 181 readings §2.1's digest
> clause refuses (via its 32-of-32 re-stamp) — and both move in this RFC's favour when it does.

> **`[author round]` Ratified, promoted out of the footnote, and its status has moved.**
> `rfc/pack-graduation.md` is no longer "returned": its header reads **draft — author return
> round complete 2026-08-16, ready to accept** `[V]`. It is stated as a **dependency** in this
> RFC's front matter rather than as a contingency in §8.4, and the dependency is **two-sided**,
> which is the part worth keeping visible:
>
> | figure | what it depends on | direction |
> |---|---|---|
> | **732 readings across 32 packs** | promotion of `content/drafts/` → `content/packs/` (D138 / D162) | zero in production until it lands |
> | **readings refused by §2.1's digest conjunct** (181 at `0241a98`, **104 at `c55b9cf`**) | that RFC's §7 re-stamp of `packDigest` on 32 of 32 ledgers | refused until it lands, admitted after |
>
> **Neither is a blocker and the recommendation is unchanged**, for a reason that is a property
> of the mechanism rather than a preference: an empty corpus produces an empty map, a stale
> ledger produces an empty index, and both are correct behaviour that a learner experiences as
> silence. **This RFC is safe to land first and gains on the day the other one does.** What is
> *not* acceptable is quoting 732 without that sentence attached, which is what the draft did.

**And a second contingency: 21 of the 53 loaded pack documents have no ledger at all** `[V]`
— **15 of them authored**, the other **6 browser fixtures** (`[author round]`; the draft read
*"15 of 47"*, which is the same 15 under the retired denominator) —
`berlin-queenless-press`, `carlsbad-minority-attack`, `conversion-up-a-piece`,
`dragon-yugoslav-race`, `french-advance-chain-white`, `grunfeld-exchange-fianchetto`,
`iqp-black-tarrasch-defence`, `iqp-white-panov-attack`, `kid-mar-del-plata-white`,
`maroczy-bind-white-squeeze`, `nimzo-doubled-c-pawns`, `open-centre-ruy-exchange`,
`rook-4v3-same-side`, `trajectory-caro-advance-chain-bishops`,
`trajectory-qgd-exchange-minority`. Every one is a 2026-08-15 middlegame-wave pack. So the
corpus is **two-tier**, coverage is 68% of authored packs, and the only thing published about
the tier is the binary `assessmentGrounding`. **D141.**

> **[cross-review] The denominator is 53, not 47, and the difference is what the registry
> actually loads.** `content/drafts/` holds **53 pack documents** — files that are not one of
> the four `SIDECAR_BASENAMES` suffixes, each with `id`, `start` and `objective` — at both
> `a7e700d` and `bc3cdc1` `[V]`. `PackRegistry.loadDefault` walks the directory with
> `jsonFiles`, which excludes sidecars by `isSidecarName` and **nothing else**, so in
> development the registry indexes **all 53**. **21** have no ledger, of which **6 are browser
> test fixtures** (`immediate-guard.browser`, `line-boundary.browser`, `outcome-hold.browser`,
> `outcome-resist.browser`, `stated-reasoning.browser`, `trajectory-legs.browser`) `[V]`.
> So "15 of 47" is the count **after** excluding those six, which is the right editorial
> number and which the RFC never said it was doing.
>
> Restated normatively: **the projection is built over the 53 packs the registry loads; 32 get
> a non-empty index, 21 get an empty one, and 6 of those 21 are fixtures that should never
> have one.** This matters for criterion 1 — a test asserting "32 packs indexed" must assert
> it against a registry holding **53**, or it is asserting a number nobody computed.

---

## 9. Ledger rows this RFC opens (law 4)

**Id block D138–D147, issued to this draft. No other id is used.** Each row is added to
`design/BACKLOG.md` by the drafting commit, with the measurement that produced it.

| id | row |
|---|---|
| **D138** 🐞 | **`content/packs/` is empty — the entire authored corpus is dev-only.** 47 authored packs and 32 ledgers live in `content/drafts/`, which `PackRegistry.loadDefault` includes only when `development === true`. Every pack-attached capability in flight therefore delivers zero in a production deployment, and no RFC states it |
| **D139** 🐞 | **The packet's "rung 1" never touches a tablebase.** `endgameReading` is a material census with `provenanceNote = "Tabiya's material-census convention"` — five type labels and up to three technique names, no `category`, `dtz`, `dtm` or abstention contract. Its honest rung is 0. Corrects D116/D119; escalated as a row rather than written into `design/05`, per law 5 |
| **D140** 🐞→🔨 | **`/reasoning-review` builds an evidence packet without the packet's disclosure gate.** Three of **four** packet construction sites called `requireGuidanceDisclosure`; `/reasoning-review` gated on `reasoningDeliveryOpen`, which is checkpoint-scoped and **role-blind**, so a participant or spectator could cause a packet carrying unfiltered rung-3 `human_divergence` sentences to be transmitted to an external provider. Egress gap, not a learner-visible leak (`reasoningMatchCheck` filters the response). **`[cross-review]` FIXED at `a452abb` before this row was reviewed** — the fix adds a second, independent `service.guidanceAccess` call rather than widening `reasoningReviewAccess`. The residual this RFC still owes is the **structural pin** (criterion 4), not the call. Original text said "four of five"; there are four sites |
| **D141** 🐞 | **15 of 47 authored draft packs have no evidence ledger**, all from the 2026-08-15 middlegame wave. The corpus is two-tier at 68% and the only published signal is the binary `assessmentGrounding`. **`[cross-review]`: the registry loads **53** documents from `content/drafts/`, so 21 of 53 carry no ledger; the six-document difference is browser test fixtures and is D227** |
| **D142** 💡 | **`PackRegistry.loadDefault` already reads every pack's ledger and discards it.** `sidecarPaths` → `optionalJson` → `assessmentGrounding`, which keeps one bit of 764 records; `PackRecord` has seven fields and none is the ledger. D118's cost is a discarded object, not a missing contract |
| **D143** 🐞 | **No position in the corpus carries both an engine reading and a tablebase reading.** 281 + 288 = 569 distinct FENs exactly. The instruments partition by pack — **20** packs 100% Stockfish (all `phase: "opening"`), **12** packs 100% Syzygy (all `phase: "endgame"`), none mixed — so nothing can corroborate one against the other. **`[cross-review]` the split is 20/12; the row originally said 17/15, which was wrong at `bc3cdc1` as well as at HEAD** |
| **D144** 💡 | **158 FENs are recorded in more than one pack's ledger.** Single-ledger resolution (the `claim-backing` rule) refuses them by construction; it is the cheapest available coverage widening and it changes what "this pack's evidence" means, so it is an owner call |
| **D145** 🐞 | **`voiceCheck` validates only `packet.sentences`**, and `ExternalHttpVoiceProvider.render` transmits only `{personaPrompt, sentences, scope}`. A structured packet field that produces no sentence is invisible to the renderer *and* to the check. "Widen the packet" means "widen the sentences", and any future packet field that forgets this is decoration |
| **D146** 🐞 | **`voiceCheck` is token-membership, not proposition-checking.** It cannot stop the renderer joining two admitted facts into a claim neither record makes. Pre-existing, but the cost rises with rung 2, because a centipawn number invites a causal join. The ceiling of any token check over free prose — the same ceiling `claim-backing` §2 names for its span binding |
| **D147** 💡 | **Rung 4 reaches a live surface but never the packet.** `GET /runs/:id/corpus` is a shipped, disclosure-gated, LLM-free explorer panel; the packet has no rung-4 field. So the corpus can be shown and can never be worded, and the two rung-4 paths are unjoined |

### 9a. Rows opened by the cross-review — **id block D223–D232, no other id used**

| id | row |
|---|---|
| **D223** 🐞 | **`assessmentGrounding` does not compare the ledger to the pack, so `ledger_verified` does not mean "this ledger describes this document".** It validates ledger and manifest, runs `linkage` (record → **manifest entry**, by `sourceId`/`retrievedAt`), and then requires **exactly one** record matching `/start/fen` and `objective.grading.assessedBy`. **`ledger.packDigest` is never read on the runtime path**; the only digest check is `EVIDENCE_DIGEST_STALE` in `sourcing/check.ts`, severity **warning**, in the authoring CLI. Measured at `a7e700d`: **32 of 32 ledgers return `ledger_verified`, including all 5 whose `packDigest` is stale** (`mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`, `philidor-passive-rook-convert`, `trajectory-mate-bishop-knight` — 186 records, 181 admitted). So the one bit the runtime keeps out of 764 records attests **one** record, not the ledger. `evidence-at-runtime` §2.1 adds a digest clause for its own consumer; **the general defect — that a two-valued grounding signal reads as a whole-ledger attestation and is published on `GET /packs/:id`** — is not fixed by that and is this row |
| **D224** 🐞 | **`transposeKey` collides inside a single pack's ledger, so "one position, one record" is false.** `lucena-bridge-convert` records `8/1P2k3/2K5/8/3R4/8/8/1r6 b - -` twice, at halfmove clocks **9** and **13**, with byte-identical values (`loss`, `dtz -8`, `dtm -28`). 732 admitted records occupy **731** distinct keys. Any position-keyed index over a ledger must therefore be multi-valued; a scalar `Map` silently drops one record and which one depends on iteration order |
| **D225** 🐞 | **The strict halfmove-clock rule costs 11.6% of tablebase lookups, and the number was invisible because the wrong set was measured.** Over every legal successor of the 497 spine-line positions, **372 land on a key carrying a `tablebase_result` and 43 arrive with a clock no record at that key holds** — all transpositions, differing by 4–6 halfmoves. On the authored tree the cost is 0, which is what makes "expected zero" look true and is why any coverage claim about a transposition index must be measured on the **frontier**, not on the tree |
| **D226** 🐞 | **`voiceCheck` is a token filter, and every RFC that treats it as a proposition binder over-claims it — demonstrated twice, by execution.** (1) **Absence is speakable.** Executed against a packet whose only sentence is `"This pack declares: opening."`, `voiceCheck` returns `valid: true` for *"No reading was recorded at this position."*, *"The engine is silent here."*, *"Nothing was recorded for this spot when the pack was authored."* and *"No measurement exists here; elsewhere on this line there was one."* — none contains a square, a move, a `CHESS_LEXICON` noun, a `BANNED_JUDGEMENTS` word or a `PRESCRIPTIVE_VERB`, which is everything the check inspects. A whole invented recorded-reading sentence passes the same packet for the same reason. So *"packet membership is a speaking licence"* is true only for chess **tokens**, and its converse — non-membership as prohibition — is false for all other prose. (2) **The token admission is `String.includes`, not a word-boundary match:** a sentence containing `sf-a1x` licenses the square `a1`, while a `\b`-anchored regex over that sentence finds nothing to object to, so every criterion that tests *"the sentence does not **match** `SQUARE`/`UCI`/`SAN`"* tests the wrong direction. Both are pre-existing and orthogonal to any one packet field; both become load-bearing the moment a frozen sentence carries a machine-stamped identity string or a design leans on `voiceCheck` to make absence unspeakable |
| **D227** 🐞 | **`content/drafts/` holds 53 pack documents and `PackRegistry.loadDefault` loads all 53 in development, six of which are browser test fixtures.** `*.browser.json` is not a `SIDECAR_BASENAMES` suffix, so `jsonFiles` walks it in like any pack. Every corpus figure quoted as "of 47 authored packs" is quietly excluding those six, and no code performs that exclusion. Either the fixtures move out of `content/drafts/`, or "47" stops being used as a denominator |
| **D228** 💡 | **Two capability registers now describe the same instruments and nothing makes them agree.** `CAPABILITY_DISPOSITIONS` landed at `a7e700d` with `reached`/`refused`/`unmeasured`/`impossible`, a `reason` per row and `assertAdvertisedCapabilityDispositions` as its coverage gate; `evidence-at-runtime` §5.1 proposes a second registry for admitted record kinds, published as `recordedReadingKinds`. They already overlap on Stockfish, Syzygy and Explorer — and disagree in emphasis: the shipped register says `Explorer / position white / draws / black → reached (corpus panel)` while the RFC refuses rung 4 |
| **D229** 🐞 | **`packages/runtime` cannot see `apps/server`, so any packet field typed off a server constant is unbuildable.** The runtime's dependencies are `@chess-tabiya/schema` and `chessops`. `EvidencePacket` and every `render*Reading` live there; `ASSESSMENT_CATEGORIES`, `TABLEBASE_CATEGORIES` and `EVIDENCE_KINDS` live in `apps/server`. The runtime already exports `AssessmentCategory` (`branch-scale.ts`) with exactly the five determinate values, and `apps/server/src/tablebase.ts` already imports from the runtime — so the fix is always "type in the runtime, narrow in the server", and it should be said once rather than rediscovered per RFC |
| **D230** 💡 | **The `engine-leverage`/D194 failure has a general shape and no general guard: a type-keyed barrier in front of a payload passthrough.** `publicEvents` allowlists event **types** (`engineFeedbackEvent`), while `GET /runs/:id/events` forwards whole event objects — so any new **field** on an unlisted type egresses by default and no reviewer of the field looks at the barrier. Pack egress does not have the defect, because `projectPackDocument` and `PackSummary` are built by enumeration. The general fix is that anything reaching a passthrough must be projected by enumeration too, or the barrier must key on payload shape |
| **D231** 🐞 | **Rung 4's refusal is now a refusal of a *specified* record kind, not of an unwanted one, and nothing in the ledger says so in one place.** D126 ruled explorer W/D/B splits admissible as `corpus_observed`; `da77c56` authored 16 such claims across eleven packs; D150 measures that all 16 are unbound prose and pass only because those eleven packs have no ledger; `claim-backing` §3.7 specifies `explorer_position_census`. Zero `explorer_frequency` records still exist (0 in drafts, 0 in candidates), so every clause-1 refusal remains correct — but a reader of any one of those four rows cannot tell that the refusal is now a **sequencing** state with an owner |
| **D232** 💡 | **Nothing pins that a new evidence-packet construction site arrives with its disclosure gate.** `a452abb` fixed the one site that lacked `requireGuidanceDisclosure`, by adding the call — not by adding a guard. The gate is four hand-written call sites in `rest.ts` beside four hand-written `evidencePacket(` calls, and the failure mode is a fifth site. A structural test (or a constructor that takes the access object) costs one test and removes the whole class |

### 9b. Rows opened by the author return round — **id block D257–D266, no other id used**

| id | row |
|---|---|
| **D257** 🐞 | **The corpus figure the whole project quotes — "47 authored packs" — is computed by no code, so no test can ever assert it.** `PackRegistry.loadDefault` walks `content/drafts/` with `jsonFiles`, which excludes only the four `SIDECAR_BASENAMES` suffixes; `*.browser.json` is not one of them, so the registry indexes **53** documents in development, six of them browser fixtures `[V]`. "47" is an **editorial** exclusion applied in prose by every RFC and ledger row that quotes it ([[D138]], [[D141]], [[D162]]) and performed by nothing in the tree. This is the general form of [[D227]] and it is worth its own row because the defect is not the number: **it is that a figure with no producer cannot be pinned by an acceptance criterion**, so it drifts silently and every consumer re-derives it differently. The fix is one of two, and both are cheap: move the fixtures out of `content/drafts/`, or export the exclusion as a predicate the prose and the tests share |
| **D258** 💡 | **`AssessmentCategory` is declared three times, and each RFC picks a different one.** The identical five-member union `"win" \| "loss" \| "draw" \| "cursed-win" \| "blessed-loss"` appears in `packages/schema/src/drill-pack/types.ts`, in `packages/runtime/src/branch-scale.ts` (re-exported from the runtime's `index.ts`), and as the value-level tuple `ASSESSMENT_CATEGORIES` in `apps/server/src/tablebase.ts` `[V]`. [[D229]] found the second and concluded *"type in the runtime, narrow in the server"*, which is right for `evidence-at-runtime` — but it is a choice among three, and the **schema** copy is the only one both other packages already depend on, so it is the only declaration that could be single. Not consolidated by any in-flight RFC because none has a consumer asking for it; recorded so the next one reads a row instead of discovering three declarations |
| **D259** 🐞 | **`voiceCheck` has exactly one production call site, and `/reasoning-review` is not behind it.** The check runs only inside `renderVoice` (`apps/server/src/guidance.ts`) `[V]`. `/reasoning-review` calls `voiceProvider.render(packet, voicePersona, prompt, "reasoning")` **directly** and filters the *response* with `reasoningMatchCheck`, so `packet.sentences` — including its rung-3 `human_divergence` sentences — is transmitted to an external provider with **no `voiceCheck` in front of it at all**. [[D140]] fixed the *disclosure* gap on that route at `a452abb`; the *check* gap is different and is still open. It matters wherever an RFC reasons about "the packet is bound by `voiceCheck`": on one of the four packet sites it is not bound by anything |
| **D260** 🐞 | **A persona-prompt constraint cannot make a concept unspeakable when the packet names the concept.** The `evidence-at-runtime` cross-review moved absence-honesty onto criterion 16a — *"the persona prompt must never mention recorded readings, their absence, or coverage"* — on the reasoning that a renderer never told the concept exists has no reason to word it. The reasoning is sound; the premise fails in the same RFC, because every frozen arm opens *"Recorded reading at this position"*, so the provider is taught the concept by the payload at every node that carries one. **General form: constraining the prompt is worthless whenever the data carries the vocabulary.** Answered in that RFC by §3.8 (the provider never receives a reading); recorded here because the reasoning error is reusable and the next RFC to reach for a prompt constraint should check what its payload says first |
| **D261** 💡 | **`voicePersona` is a deployment option, so every persona-prompt criterion pins a default and nothing more.** `ApplicationOptions.voicePersona` flows to `createRestHandler` and defaults to *"Clear, concise Tabiya voice. Do not add chess claims."* `[V]`. A test can assert that string; it cannot assert what an operator configures. Any RFC that treats a persona constraint as a guarantee is treating a default as an invariant. Either the persona becomes a frozen constant with an assertion at construction, or persona-based constraints are documented as defaults — the second is honest and free, the first is the one that would actually bind |
| **D262** 🐞 | **A `transposeKey` index over the corpus has three different "position counts" and the RFCs have been mixing them.** Measured at `0241a98` over the 32 draft ledgers `[V]`: **732** admitted records occupy **731** `(pack, key)` index entries — one intra-pack collision, `lucena-bridge-convert` at halfmove clocks 9 and 13 — over **568** distinct keys corpus-wide, because **158** anchor FENs recur across packs. The same three-way split appears on the frontier: **11,464** per-pack-distinct successor positions against **7,589** corpus-wide, a 34% difference. Neither number is wrong; quoting one under the other's label is, and the cross-review's *"731 distinct positions"* did exactly that. **Rule: any corpus figure derived from a per-pack index must say "summed per pack" or "corpus-wide" in the same sentence as the number** |
| **D263** 💡 | **Publishing a pack moves its digest, so the corpus is designed to go stale under its own ledgers — and the only runtime consequence today is a CLI warning.** `rfc/pack-graduation.md` §4.5 establishes that setting `reviewStatus: "published"` moves `digestDrillPack(document)`, because `provenance` is inside the digested document; that RFC accepts a 32-of-32 `packDigest` re-stamp as a **landing-order obligation** shared with `claim-backing`. Meanwhile the repository's only staleness check is `EVIDENCE_DIGEST_STALE` in `sourcing/check.ts` at severity **warning**, in the authoring CLI [[D223]]. So the drift is **scheduled**, recurring and invisible at runtime. `evidence-at-runtime` §2.1 fences its own consumer; nothing fences the others, and the next content wave will re-create the five stale ledgers that exist today |
| **D264** 🐞 | **The `CORPUS_GUARD` "one constant, one render site" pattern has already forked, which is what any criterion written against it must catch.** `apps/web/src/lib/corpus-sentences.ts` declares `CORPUS_GUARD` = *"These counts say what this population played, not what is good."*; `apps/server/src/repertoire.ts` declares `REPERTOIRE_CORPUS_GUARD` — the same sentence **minus its trailing period**, in a different package — and interpolates it into two generated strings `[V]`. Two near-identical population guards already exist, so a test asserting *"one reference to the constant"* is satisfied by a **copy of the string**, which is the failure that actually happened. Any guard-sentence criterion must assert that the sentence is not **declared** twice, not that the constant is referenced once |
| **D265** 💡 | **The digest-conjunct pattern generalises: a two-valued grounding verdict is not an admission gate, and every consumer of one needs its own second predicate.** `assessmentGrounding` returns `"ledger_verified" \| "unverified"` and attests **one** record; `evidence-at-runtime` §2.1a adds `ledger.packDigest === digest` for its own consumer and converts an authoring **warning** into a load-time **refusal**. The shape is reusable and the reasoning is: a summary verdict computed for one purpose (does the *assessment* have a backing record?) is being read for another (does this *ledger* describe this *document*?). Three properties made the fix cheap and are worth naming as a checklist — both operands were already in scope one line apart, the cost was measurable before writing any code (5 packs, 181 readings), and the failure direction is silence rather than a false statement. [[D223]] is the defect; this row is the pattern |
| **D266** 🐞 | **Three instruments in this repository guarantee tokens while being described as guaranteeing propositions, and the description error is the recurring bug, not the instruments.** [[D234]] names `voiceCheck` (token membership described as a speaking licence); [[D131]] names `claim-backing`'s residual sweep (numeral policing described as inference policing); and the third is the shape they share — **an allow-list over a lexicon cannot bind a claim, and every design that leans on one has to argue its own safety separately.** All three were described correctly *once* and then cited loosely afterwards, which is how the error propagates: the citation is shorter than the caveat. Proposed convention, cheap and checkable in review: **an instrument's description must name what it inspects, not what it is used for** — *"`voiceCheck` compares square/UCI/SAN tokens and three word lists against the packet"*, never *"`voiceCheck` binds the sentence to the packet"* |

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

### 11.1 `rfc/engine-leverage.md` — accepted and **mid-implementation** at `bc3cdc1`, pack 0.23 / run 0.16 / migration 21

> **`engine-leverage` differences measurements the run took. `evidence-at-runtime` states
> readings the corpus recorded, and may never difference them.**

| | `engine-leverage` owns | this RFC owns |
|---|---|---|
| source of the number | a **live** instrument call during the run, recorded as `evidence.attached` | a **committed** ledger record, read at pack load |
| what happens to it | it **fires** a condition (`guard.conditions[]`, `$defs/engineCondition`, four arms) | it is **stated** as a frozen sentence in the packet |
| arithmetic | differences across a decision triple (`centipawnSwing`, DTZ regression, category regression) | **none** — §3.5 |
| thresholds | `evalSwingCp`, `byAtLeast` ≥ 3 | **none** — §5.2 |
| authoring side | binds `deviation.cost` to the ledger at `verify-draft` time; `go nodes 50000` | nothing |
| register | pack 0.23, run 0.16, migration 21 | **nothing versioned** |
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

### 11.2 `rfc/archive/claim-backing.md` — implemented at pack 0.26

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
   rather than by this document.** Over the committed tree, with the registry loaded in
   development mode holding **53** pack documents `[cross-review]`: **32** packs with a ledger,
   **732** readings admitted (391 engine + 341 tablebase) occupying **731 index entries**
   across those 32 per-pack indexes `[author round]`, **32** `position_legality` records
   refused, **21** packs with an empty index, **732 of 732** authored position pointers
   covered. **`[author round]` Two further assertions the draft's figures could not support.**
   **(a)** With §2.1's digest conjunct wired, **29** packs get a non-empty index at
   `c55b9cf` — 3 of the 32 are digest-stale, so **628** readings are served and **104** are
   refused (**27 / 551 / 181** at `0241a98`, before `caa8afa`) — the 732 is the pre-conjunct
   figure and both must be reported, or a reader cannot tell which number the code produced. **(b)** The index holds **568 distinct positions**
   corpus-wide against its 731 entries; a test asserting *"731 positions"* is asserting the
   wrong thing (§8.1). Recomputed in `planning/evidence-at-runtime/`. **If the shipped figure
   disagrees with §8, §8 is wrong and is corrected there rather than the code being bent to
   it.**
2. **Linkage is fail-closed and total, and the digest clause is tested separately from the
   grounding clause `[cross-review]`.** A pack whose ledger fails `assessmentGrounding` yields
   an **empty** index. A pack whose ledger passes `assessmentGrounding` but whose
   `ledger.packDigest` differs from the registry's `digestDrillPack(document)` **also** yields
   an empty index — and this arm must be tested against a **real** case, not only a synthetic
   one, because **three exist at `c55b9cf`** — `mate-bishop-knight`, `mate-k-q-technique`,
   `mate-k-r-technique`, all of which return `ledger_verified` today `[V]` (five at `0241a98`;
   `caa8afa` re-stamped two). **A test asserting that a digest-stale
   ledger yields an empty index must fail if clause 2 of §2.1 is removed**; if it still
   passes, the clause is not wired. A partial index is a test failure.
   **`[author round]` Three additions, because clause 2 is a new normative rule (§2.1a) and
   its wiring must be provable rather than asserted.** **(a)** The implementation **reports**
   the refused set — packs and readings, by name — rather than asserting a frozen count, and a
   test pins the *mechanism* on a named case. **The count is deliberately not frozen: it was
   5 packs / 181 readings at `0241a98` and 3 packs / 104 at `c55b9cf`, because `caa8afa`
   re-stamped two ledgers mid-round** `[V]`. A criterion asserting "181" would have failed
   within hours of being written, for the right reason. The three stable at `c55b9cf` are
   `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`. **(b)** A ledger with
   **no `packDigest` at all**
   yields an empty index — the field is optional in `EvidenceLedger`, 32 of 32 committed
   ledgers carry it `[V]`, and this arm must be tested synthetically because no real case
   exists. **(c)** `assessmentGrounding` itself is asserted **unchanged**: all 32 ledgers still
   return `ledger_verified`, and `GET /packs/:id`'s `grounding` field is byte-identical for all
   32 — clause 2 fences this consumer and must not leak into the published signal (D223).
3. **No `PackRecord` field reaches the wire `[cross-review]`.** Four assertions, not one:
   `projectPackDocument` gains no parameter and `GET /packs/:id` is byte-identical for all 32
   indexed packs; `GET /packs` (`PackSummary`) is byte-identical; `GET /packs/:id/export` and
   `distillRun` are byte-identical; and a grep test asserts that no module spreads or
   `JSON.stringify`s a `PackRecord`. The anti-contamination boundary in
   `docs/explanation-grounds.md` is unchanged. **This is the criterion that closes the D194
   shape (§4.2a) and it must not be narrowed back to `projectPackDocument` alone.**
4. **All four packet construction sites apply the packet disclosure gate `[cross-review]`.**
   Tested per site: a spectator, a participant, and a solo learner with the delivery window
   closed each receive `ASSISTANCE_WITHHELD`; a solo learner with the window open receives
   readings. `/reasoning-review`'s gate **already shipped at `a452abb`**, so its test is a
   **regression** test rather than the fail-then-fix test the draft specified. Additionally a
   **structural** test asserts that every `evidencePacket(` call site in `rest.ts` is preceded
   by a `requireGuidanceDisclosure` in the same block — the pin `a452abb` did not ship, and
   the guard against a fifth site arriving without one.
5. **No move token enters the packet — the law-8 criterion.** Over all 732 admitted readings,
   every sentence `renderRecordedReading` produces is asserted to contain **no substring**
   matching `voiceCheck`'s `SQUARE`, `UCI` or `SAN` patterns. **`[cross-review]` The test is a
   substring test, not a regex match, and the distinction is load-bearing:** `voiceCheck`
   admits an output token when
   `packet.sentences.join("\n").toLowerCase().includes(token)` `[V]` — a raw `String.includes`,
   with no word boundary. So a sentence containing `…a1x…` would license the renderer to emit
   the square `a1`, while a `\b`-anchored regex test over that sentence finds nothing. Asserting
   "the sentence does not *match* the pattern" tests the wrong direction; assert that the
   sentence does not *contain* any `[a-h][1-8]` pair, anywhere, at any boundary. The corpus's
   own stamped values pass — `engineName: "Stockfish"`, `engineVersion: "18"`,
   `sourceId: "stockfish-authoring" | "syzygy"` `[V]` — but they pass by luck of spelling, and
   a future engine identity like `sf-a1x` would not. A future sentence arm that names a move
   fails this test. **This is the mechanical form of "widen the packet, never the licence" and
   it must not be softened.**
6. **Zero instrument calls, on both axes.** A grep test asserts the projection module imports
   no engine client, no `LichessTablebaseSource`, no `ExplorerClient` and no fetch; a
   behavioural test asserts that a run with the network unavailable produces byte-identical
   packets to one with it available; and a benchmark records that packet construction time is
   unchanged within noise.
7. **Absence produces no sentence — and `sentences` is byte-identical at *every* node
   `[author round]`.** The draft asserted byte-identity only at nodes with no reading; under
   §3.8 the assertion is total: over all 32 indexed packs and every node with an admitted
   reading, `packet.sentences` is byte-identical to today's, because readings never enter it.
   A grep test asserts `renderRecordedReading` contains no absence-arm string ("no reading",
   "none recorded", "not queried", "unavailable"). **This criterion is the one that fails if
   §3.8 is declined**, and it should be read as the switch between the two designs.
7a. **The provider never receives a recorded reading `[author round]`.** A test captures the
   body `ExternalHttpVoiceProvider.render` posts for a node **with** an admitted reading and
   asserts that `sentences` contains no `renderRecordedReading` output and that the whole body
   contains none of `Recorded reading`, `Stockfish`, `Syzygy`, `DTZ`, `DTM`, `depth`; and a
   test asserts the learner-visible text from `renderVoice` **does** contain the reading, so
   the appending is wired rather than the readings merely dropped. A third asserts
   `/reasoning-review` transmits no reading, which is the site with no `voiceCheck` in front of
   it at all `[V]`.
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
11. **The clock rule holds and its cost is measured — and the expected cost is 43, not 0
    `[cross-review]`.** A `tablebase_result` whose recorded halfmove clock differs from the
    node's is not admitted. The implementation reports the measured cost over the **one-ply
    frontier** (every legal successor of the 497 spine-line positions), which is the set the
    index is for; the on-authored-tree cost is 0 by construction and measuring only that set
    is what made the draft's "expected zero" look true. Expected at `a7e700d`: **372 frontier
    positions land on a key carrying a tablebase record, and 43 (11.6%) are refused on clock**
    `[V]`. A **materially lower** figure means the rule is not wired; a materially higher one
    is carried to Open question 2 rather than silently relaxed. The test also pins that
    `lucena-bridge-convert`'s duplicated key returns **both** readings from the index and then
    **at most one** after the clock filter. **`[author round]` Reproduced independently at
    `0241a98`: 372 and 43 exactly, 11.6%** `[V]`, with the refused arrivals differing from
    their records by 4–6 halfmoves (`lucena-bridge-convert` node clock 9 vs recorded 13 and 11
    vs 7; `mate-bishop-knight` 7 vs 3, 13 vs 9, 15 vs 11, 19 vs 15, 21 vs 17) — genuinely
    different fifty-move states, which is why §2.2's rule is kept rather than relaxed.
12. **`/capabilities` publishes the registry, and the register cannot drift.**
    `recordedReadingKinds` is computed from §5.1's registry; a test fails when an advertised
    kind has no registry row, and when a registry row marked admitted has no admission path.
    **`[cross-review]` Extended:** a test also fails when §5.1's registry and the shipped
    `CAPABILITY_DISPOSITIONS` (`apps/server/src/capabilities.ts`, landed at `a7e700d`)
    disagree about the same instrument — two registers that can drift about Stockfish, Syzygy
    and Explorer is the failure this criterion exists to prevent (§5.1a).
13. **The coverage gap is published, not just measured.** §8.2's figures — 497 spine-line
    positions, **11,559 legal moves / 11,464 per-pack-distinct successor positions (7,589
    corpus-wide `[author round]`)**, **700 authored pointers (6.06%) / 699 per-pack-distinct
    authored positions (6.10%)**, **10,765 of 11,464 uncovered (93.90%)** — are
    recomputed from the shipped code in `planning/evidence-at-runtime/`. **`[cross-review]`
    Both denominators are named because the draft published one number under the other's
    label; a re-derivation that produces 11,464 or 699 is correct, not a failure.**
    **`[author round]` The re-derivation must state whether it is summing per pack or counting
    corpus-wide**, because the two differ by 34% (11,464 vs 7,589) and the RFC uses the
    per-pack sum throughout — which is the right one, since the index is per pack. **A run
    that reports substantially higher off-tree coverage fails this criterion**, because it
    would mean the index is matching positions it should not — with the one legitimate
    exception §8.2 now measures: transposition back into an authored key, which accounts for
    743 promotion-expanded arrivals against 699 distinct authored positions `[V]`.
14. **All 32 committed ledgers still validate unchanged.** `sourcing-check` over `content/`
    produces the same issue set, code for code. No pack byte changes; no content digest moves.
15. **The ledger and the log are updated in the archiving commit.** **D118** flips to ✅ with
    **both** numbers named — 732 readings admitted (628 served at `c55b9cf` under §2.1's conjunct
    until `pack-graduation` lands `[author round]`) **and** 10,765 of 11,464 one-ply successor
    positions uncovered. **D116** flips to ✅ with the mechanical half stated and rung 4 named
    as still absent. **D119** and **D120** are annotated with what shipped. **D138–D147** are
    opened by the drafting commit with their measurements, **D223–D232** by the cross-review
    `[cross-review]` and **D257–D266** by the author round `[author round]`; **D140 is already
    ✅ in the ledger, closed by `a452abb`, not by this RFC** `[V]`. A dated entry lands
    in `planning/exploration/log.md`. `rfc/README.md`'s Active row is the reviewer's to add —
    single-writer, not edited here.
16. **The two rules that were prose are mechanical `[cross-review]`.** Both come from §6, and
    neither had a criterion.
    **(a) Absence stays out of the persona prompt.** A test asserts `voicePersona` — the
    `personaPrompt` string `ExternalHttpVoiceProvider.render` transmits — contains none of
    `reading`, `recorded`, `coverage`, `queried`, `silent`, `absent`, in any case. The shipped
    default passes today: *"Clear, concise Tabiya voice. Do not add chess claims."* `[V]`.
    **`[author round]` This is re-scoped from "the only lever" to a second line, and its limit
    is stated rather than left to be discovered.** It is not the guarantee, for two reasons:
    the guarantee is §3.8 (criterion 7a), and `voicePersona` is a **deployment option**
    (`ApplicationOptions.voicePersona`) `[V]`, so a test can pin the shipped default and
    nothing more — an operator who sets a different persona is outside what any criterion here
    reaches. `voiceCheck` demonstrably does not refuse absence prose (§6.1, executed `[V]`).
    **(b) §6.3's population line is rendered once per surface.** It is a module-level frozen
    constant on the `CORPUS_GUARD` pattern; a grep test asserts exactly one reference outside
    its defining module and none from a per-node component. Rendering it beside each reading
    is the failure this criterion exists to catch, because it recreates the per-node absence
    signal §6.1 refuses. **`[author round]` Extended: the test also asserts that the sentence
    is not *declared* a second time anywhere in the tree.** The precedent has already forked —
    `REPERTOIRE_CORPUS_GUARD` (`apps/server/src/repertoire.ts`) is `CORPUS_GUARD` minus its
    trailing period, in a different package `[V]` — so "one reference to the constant" is
    satisfiable by a copy of the string, which is the failure that actually happened (D264).

---

## Open questions

1. **Should a reading be admitted across packs?** 158 FENs are recorded in more than one
   pack's ledger (D144). This RFC refuses cross-ledger resolution on `claim-backing`'s
   principle. **The author's recommendation is to keep the refusal in this RFC**, because
   admitting it changes what "this pack's evidence" means and would make a pack's honesty
   depend on which other packs happen to be loaded — but it is the cheapest coverage widening
   available and it is an owner call, not a tooling one.
2. **Does the strict halfmove-clock rule for tablebase readings cost coverage? — ANSWERED
   `[cross-review]`: yes, 43 of 372 (11.6%), and the rule is kept anyway.** Measured at
   `a7e700d` `[V]`; §2.2 carries the derivation and the examples. Zero on the authored tree,
   as the draft expected, but the authored tree is not the set a `transposeKey` index serves.
   Of the two honest options the draft named, **keep the strict rule** is taken here: the
   refused arrivals differ from their records by 4–6 halfmoves, which is a genuinely different
   fifty-move state, and stating the clock difference in the sentence would put an authoring
   artefact into a learner-facing sentence — the same thing §6.1 refuses for absence. **What
   remains open is narrower and is a real owner call:** `lucena-bridge-convert` records one
   position at two clocks with byte-identical values, so the corpus proves some positions are
   clock-insensitive. Admitting a reading when **every** record at that key agrees on
   `category` and `dtz` would recover most of the 43 without stating anything false. It is not
   taken here because it is a new admission rule rather than a measurement, and because 43
   readings is a smaller cost than a second admission concept.
3. **Should recorded readings reach the `compare` scope?** Out of scope here because that
   packet replaces `sentences` wholesale and because compare is the one place several nodes are
   in view, i.e. where §3.5's refusal is load-bearing rather than theoretical. This touches
   `rfc/feedback-delivery.md`'s compare strip and should be decided with it, not before it.
4. **Is the `content/packs/` promotion a blocker?** (D138.) The author's position is **no** —
   the mechanism is empty-corpus-safe and the contingency is stated rather than hidden — but
   the whole in-flight wave inherits the same contingency and none of the sibling RFCs names
   it. Whether that becomes a content wave with an owner is a scheduling call.
   **`[cross-review]` It already has an owner: `rfc/pack-graduation.md`, via D162.** So the
   question narrows to sequencing, and this RFC now has **two** figures riding on it — the 732
   (§8.4) and the 181 readings §2.1's digest clause refuses until the 32-of-32 re-stamp lands.
   The recommendation is unchanged (**not a blocker**), but the dependency is now declared in
   §8.4 rather than left as a footnote, and a reviewer should read the two RFCs' landing order
   as a scheduling question with a known answer rather than an open one.
5. **Should `position_legality` be admitted after all?** Refused here as rung-0-recomputable
   (`countFenPieces` is local and exact). The one argument for it is that `pieceCount` is what
   gates rung 1's abstention contract, and a *recorded* piece count carries a retrieval date a
   computed one does not. **Recommendation: keep it refused** — a date on an arithmetic fact is
   provenance theatre — recorded so the refusal is a decision.

6. **`[cross-review]` Should the digest clause of §2.1 be a refusal or a demotion?** It is
   specified as a refusal (empty index) because a reading about a document that has moved is
   the one thing this RFC cannot let a renderer say. The alternative — admit, and add
   *"recorded against an earlier version of this pack"* to the frozen sentence — is rejected
   for the same reason Open question 2 rejects stating a clock difference: it converts an
   authoring artefact into a learner-facing sentence. Recorded so the refusal is a decision,
   and because it costs a measured 181 readings at `0241a98` (**104 at `c55b9cf`** — §2.1a).
   **`[author round]` ANSWERED: refusal, ratified.** §2.1a carries the full case — the cost is
   exactly 5 packs and 181 readings, all endgame; `packDigest` is present on 32 of 32 ledgers
   so the rule cannot misfire on absence; and `pack-graduation` §4.5 establishes that
   publishing a pack **moves its digest**, which makes this a standing guard rather than a
   one-off cleanup. The demotion alternative stays rejected. What remains open is nothing in
   this RFC: **D223**, the general defect that `ledger_verified` is published on
   `GET /packs/:id` while attesting one record rather than the ledger, is somebody else's.
   The cost fell from 181 to 104 readings **during this round**, when `caa8afa` re-stamped two
   ledgers in the same commit that moved their digests — which is the discipline working, and
   the reason the criterion reports the figure rather than freezing it.

7. **`[author round]` Should the provider receive recorded readings at all? — ANSWERED: no,
   and this is the round's second material change (§3.8).** The cross-review moved the
   absence-honesty guarantee onto a persona-prompt constraint. That is declined: a prompt
   constraint is advisory, and in this specification it was also incomplete, because the frozen
   sentence *"Recorded reading at this position…"* teaches the provider the concept the persona
   was told to omit. §3.8 keeps readings out of `packet.sentences` entirely and appends them
   after `renderVoice` returns, so **the provider's input is byte-identical to today's at every
   node**.
   **The owner's call, stated as a trade rather than a recommendation dressed as a fact.**
   Keeping §3.8 buys a structural absence guarantee, a stronger law-8 position (a reading is
   *only ever* a frozen string over record values, never paraphrased), and exclusion of
   `/reasoning-review` — the one packet site with no `voiceCheck` in front of it — by
   construction. It costs a **voice seam**: persona prose followed by frozen instrument prose,
   where every other packet fact may be re-worded in the Tabiya voice. **Declining returns the
   RFC to the cross-review's position** — readings in `sentences`, guarded by a persona default
   — with §6.1 clause 3's residue as stated and criterion 7 relaxed back to nodes without
   readings. **The author's recommendation is to keep §3.8**, because the seam is a wording
   problem that a surface can solve and the residue is not.

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
  versioned**; 0.26 stays free. Measured: **732 of 764 records admitted at 731 positions across
  32 packs, 100.0% of the authored tree** — and **11,094 of 11,559 one-ply-off positions
  uncovered, with nothing at all beyond that ply**. Ten rows opened from measurements taken
  during drafting (D138–D147), including that the packet's "rung 1" never touches a tablebase
  (D139), that one of four packet construction sites omitted the disclosure gate (D140), and that
  `content/packs/` is empty so the whole corpus is dev-only (D138).
- 2026-08-16: **adversarial cross-review at `a7e700d`**, by an agent that did not write the
  draft. Content census unchanged (32 / 764 / 391 / 341 / 32 / 0 templated) and every symbol
  in the locate list resolves, so the *mechanism* survives intact. Six classes of figure did
  not, and are corrected in the body rather than in a banner: **§2.1's staleness argument was
  false** and is replaced by a two-predicate gate — `assessmentGrounding` never reads
  `ledger.packDigest`, and **5 of 32 ledgers are digest-stale at HEAD while all 32 read
  `ledger_verified`**, so the draft would have served 181 stale readings; **D140's fix already
  landed at `a452abb`** and there are **four** packet construction sites, not five;
  **731 distinct positions, not 732** (`lucena-bridge-convert` records one position at two
  halfmove clocks); **the strict clock rule costs 43 of 372 frontier lookups, not 0**; the
  engine/tablebase pack split is **20/12, not 17/15**; and `content/drafts/` holds **53 pack
  documents**, all loaded in development, six of them browser fixtures. One specification
  defect fixed: `RecordedReading` could not be typed as §3.4 spelled it, because
  `packages/runtime` cannot import `apps/server` — and the runtime already exports
  `AssessmentCategory`, which the draft said did not exist. §4.2a added to answer the D194
  question directly: **the gate cannot fail that way**, because pack egress is projection by
  enumeration rather than payload passthrough, and criterion 3 is widened to pin all three
  pack routes. **§6.1's absence guarantee was executed and failed**: `voiceCheck` passes
  *"No reading was recorded at this position."*, *"The engine is silent here."* and an
  entirely invented recorded-reading sentence against a packet containing none of them, so
  absence is unspeakable on the deterministic path and merely unprompted on the provider path
  — §4.1, §6.1 and law-8 consequence 4 are rewritten to claim only what the code delivers, and
  criterion 16 makes the persona prompt and the once-per-surface population line mechanical
  instead of prose. Rung 4's refusal **kept and re-grounded** (§5.1a): still zero
  `explorer_frequency` records anywhere, but the reason is now a specified-and-unlanded record
  kind rather than absent demand. Ten rows opened, **D223–D232**.
- 2026-08-16: **author return round at `0241a98`**, by the author, after the cross-review
  returned the draft. **Every cross-review measurement was re-derived independently and every
  one reproduces** — 32/764/391/341/32, 0 templated; 5 digest-stale ledgers, 186 records, 181
  admitted, 32 of 32 `ledger_verified`; 20/12; 497 / 11,559 / 11,464 / 700 / 699 / 465 / 235 /
  234; 372 frontier tablebase arrivals with 43 (11.6%) refused on clock; 53 draft documents,
  6 fixtures, 21 ledger-less; 0 `explorer_frequency` in 32 draft and 36 candidate ledgers; and
  every executed `voiceCheck` counter-example including the `sf-a1x` substring licence. **The
  three returned items are decided, not edited.**
  **(1) The digest conjunct is RATIFIED and owned** (§2.1a): cost 5 packs / 181 readings, all
  endgame at `0241a98`, and **3 packs / 104 readings at `c55b9cf`** after a mid-round
  re-stamp; `packDigest` present on 32 of 32 so the rule cannot misfire on a missing field
  (**normative addition: an unstamped ledger is refused**); and — the decisive argument the
  cross-review did not make — `pack-graduation` §4.5 establishes that publishing a pack **moves
  its digest**, so this is a standing guard against scheduled drift rather than a one-off
  cleanup (D263, D265).
  **(2) The absence-honesty replacement is DECLINED and replaced with a structural one**
  (§3.8, §6.1). A persona-prompt constraint is advisory, and in this specification it was also
  incomplete: the frozen sentence *"Recorded reading at this position…"* teaches the provider
  the concept the persona was told to omit (D260). **§3.8 keeps readings out of
  `packet.sentences` entirely and appends them after `renderVoice` returns**, so the provider's
  input is byte-identical to today's at every node and `/reasoning-review` — which calls the
  provider with **no `voiceCheck` at all** (D259) — carries none. §6.1 states in four numbered
  clauses what the guarantee now is, what it costs, and **what remains unguarded**: no output
  check on propositions exists anywhere in this system, and accepting this RFC is accepting
  that. Open question 7 is the owner's decline path.
  **(3) The figures are restated**, and one the cross-review corrected is corrected again:
  **731 is a count of `(pack, key)` index entries, not of positions** — corpus-wide there are
  **568**, because 158 FENs recur across packs — and the same per-pack-versus-corpus-wide split
  runs through §8.2 (11,464 vs 7,589). **"47 authored packs" is retired as a denominator**: no
  code computes it, so no criterion can pin it (D257).
  **Three further sentences leaning on packet membership as a licence were found and struck** —
  the Summary's *"because `voiceCheck` makes packet membership a speaking licence"*, §Motivation's
  *"law-8-legal by construction"* (the D234 sentence, which reached the owner), and §4.3's
  *"`voiceCheck` would refuse the words"*, which was wrong twice over because `voiceCheck` never
  runs on a surface render at all. **§4.2a's enumeration argument is made explicit** against
  `engine-leverage`'s own remedy, which is a deny-list — spread-minus-two — and is the same
  failure one layer in (D235, D230). **`rfc/pack-graduation.md` is promoted from footnote to
  declared dependency** in the front matter, two-sided: the 732 rides on its promotion, the
  digest-refused readings on its re-stamp. Rung 4's refusal **verified clause by clause against the specification** —
  no third union member, no third values interface, no dead branch, no reserved field — so it
  is a refusal and not a deferral (§5.1a). Ten rows opened, **D257–D266**.
  **One figure moved during the round and is reported rather than hidden:** `caa8afa` (*"feat:
  wire pack vocabulary reach"*) landed mid-review, added a `variantOf` block to two packs and
  **re-stamped both ledgers in the same commit**, so §2.1's digest conjunct now costs **3 packs
  / 104 readings at `c55b9cf`** rather than 5 / 181 at `0241a98` [V]. Everything else — the
  census, the split, the pointer coverage, the frontier and the clock refusal — is byte-for-byte
  identical at both commits, verified by re-running the probe against `git archive 0241a98`.
  The moved figure is D263 demonstrated live, it strengthens the ratification rather than
  weakening it, and criterion 2 is written to **report** the refused set rather than assert a
  count that has a shelf life.
