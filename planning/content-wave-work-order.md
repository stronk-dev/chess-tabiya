# Content wave work order — the mechanical corpus jobs, as commands an implementer can run

**Written 2026-08-17 against `68098e5`.** This is an **executable work order**, not a routing
document. `planning/defect-triage.md` §7a described five mechanical jobs and nobody turned them into
something a person could run; `planning/research-queue.md` mentions them once (Q-15, Q-17). This
file closes that gap.

**Nothing in the tree was changed to produce it.** Every command below is stated but only the
read-only ones were executed. The read-only measurements I ran are listed in §8, along with my
spot-check rate.

**How to read this.** Per [[D419]] (*"The disposition column is not a status"*) and [[D459]]
(*"The defect table's own header labels column 3 Status"*), **column 3 of `design/BACKLOG.md` is not
a status**; every row status below was read from **column 1**. Code is cited by symbol name. Ids
through **D513** are in use; §7 proposes from **D522** and **writes no rows**.

---

## 0. The headline, before the jobs

**Three findings outrank the ordering.**

1. **Job 1 as described cannot run at all, and the reason is one shipped string.**
   `attachExplorerEvidence` refuses unless `pack.provenance.sources` already contains the exact
   constant `EXPLORER_RATIONALE` (`apps/server/src/sourcing/explorer.ts:23`, enforced at `:247` with
   `ATTACH_SOURCE_LINE_MISSING`). I measured it: **0 of 50 authored packs carry that string.** The
   triage's split of *"22 directly attachable, 38 needing a sidecar"* is therefore wrong in the
   direction that matters — **0 of 60 are attachable today**, not 22.

2. **And a second, independent refusal stacks on top of it.** `attachExplorerEvidence` writes
   **exactly one span** per claim (`spans: [{ span, assertion }]`, `explorer.ts:288`), while
   `validateClaimBindings` raises `CLAIM_ASSERTION_UNDECLARED` — **severity `error`** — for every
   machine-shaped token left in the claim text after declared spans are removed
   (`claim-binding.ts:212`, `MACHINE_TOKEN` at `:167`). I counted the tokens in all **60**
   `corpus_observed` claims: the minimum is **6** and the maximum is **38**. **Not one claim has a
   single machine token.** So even with the rationale line added, the shipped attach's own
   post-check (`ATTACH_CHECK_FAILED`) refuses **60 of 60**.

3. **Three of the five jobs are already done or already closed, and one job is only half a job.**
   Fixture handling ([[D227]], [[D257]]) is closed. [[D207]], [[D239]], [[D209]], [[D211]] and
   [[D446]] — all named in the triage's job lists — read **✅ in column 1 at `68098e5`**. What is
   left is smaller than 27 rows and sharper: **one job is runnable end-to-end today** (job A),
   two need one new instrument each (jobs B and C), and two are gated on authoring that law 8
   forbids anyone generating.

**The number that should govern the wave.** `make expression-census` at `68098e5` reports
`totals.claims: 196`, `totals.backedClaims: **1**`, `totals.populations: 0`. The one backed claim is
in `philidor-third-rank-hold`. **The entire corpus carries exactly one `claimBindings` entry** — I
walked all 32 draft ledgers and found one, with four assertions, and **zero `tablebase.moveCensus@v1`
assertions anywhere in the corpus.** That is the wave's real starting line.

---

## 1. Where the machine stops and a human starts, with counts on each side

Law 8 forbids LLM-manufactured chess truth. In this codebase the law is *already enforced in code*,
and the enforcement points are the honest place to draw the line.

| Enforcement point | Symbol | What it refuses |
|---|---|---|
| The rationale gate | `attachExplorerEvidence` → `ATTACH_SOURCE_LINE_MISSING` | attaching a record to a pack that has not declared it sources the explorer |
| The prose gate | `attachExplorerEvidence` → `ATTACH_SPAN_REQUIRED` (*"pack prose is never generated or overwritten"*) | writing the sentence the record backs |
| The agreement gate | `validateClaimBindings` → `CLAIM_SPAN_CONTRADICTED` | a record that disagrees with the number the author wrote |
| The completeness gate | `validateClaimBindings` → `CLAIM_ASSERTION_UNDECLARED` | a claim with any undeclared machine-shaped token |
| The attribution gate | `validateClaimBindings` → `CLAIM_AUTHOR_LABEL_REQUIRED` | an authored segment with no `author_principle` |

**The split, measured over the 196 claims in the 50 authored packs.**

| Side | Count | What it is |
|---|---|---|
| **Mechanical — a record can be produced by a shipped instrument** | **105 claim-slots** | 60 `corpus_observed` + 37 `tablebase_exact` + 8 `engine_validated`. `make expression-census` counts **104** as `EVIDENCE_TYPE_UNBACKED`; the 105th is the one bound Philidor claim |
| **Mechanical — records already exist and need no new run** | **764 records** | 391 `engine_eval` / 341 `tablebase_result` / 32 `position_legality` / **0 explorer of either kind** |
| **Human — the sentence the record backs** | **60 of 60** `corpus_observed` claims | each carries 6–38 machine tokens against a one-span writer; every one needs either re-authoring or a hand-written multi-span binding |
| **Human — the principle a claim rests on** | **114 of 196** claims carry no `author_principle` | across **44 packs**, phases opening 26 / middlegame 64 / endgame 21 / cross_phase 3. [[D462]]'s figure of **63** is the *withheld* subset and is **not** reclassified here: *"a human must judge each one"* stands |
| **Human — the grading declaration for a pack with no ledger** | **18 packs** | see §3, job C — `verifyDraft` refuses all 18 |
| **Human — what a pack says once a census arrives** | **7** [[D110]] full-set census claims | the census is mechanical; the sentence is not |

**Where a row was arguable I put it on the human side, and here is why for each.**

- **Choosing `--span` for an explorer attach.** Arguable: the span is a substring already in the
  prose. Human anyway: the span *selects which proposition the record certifies*, and
  `CLAIM_SPAN_CONTRADICTED` means a wrong selection is silently swapped for a refusal that a script
  will be tempted to route around by changing the sentence.
- **Declaring `objective.grading.assessedBy` on the 18 ledger-less packs.** Arguable: the number is
  transcribed from a measurement. Human anyway: `assessedBy` is the instrument that decides whether
  the learner *passed*, and choosing an engine centipawn score as the grading authority for a
  26–32-piece middlegame is a product judgement, not a transcription.
- **Rewriting a claim so it carries one machine token.** Arguable: it is an edit, not a new claim.
  Human anyway: the edit changes what the pack asserts about chess.
- **The 63 `CLAIM_AUTHOR_LABEL_REQUIRED` remedies.** Explicitly **not** reclassified. The
  `feedback-delivery` pass concluded a human must judge each one and that conclusion is honoured
  here without re-litigation.

**What is genuinely mechanical, and this is the whole list:**

1. Rewriting 20 provenance strings that promise data at a location the validator forbids (job A).
2. Deleting one dangling citation to a line deleted on 2026-08-15 (job A).
3. Re-stamping `packDigest` after any of the above (job A).
4. Running `make tablebase-walk` to *produce* successor readings (job B — but see the missing writer).
5. Re-running `make verify-draft` on the 20 engine packs and 12 syzygy packs to refresh records (jobs A and C).
6. Converging the four disagreeing corpus denominators (job D).

---

## 2. Preconditions — and the one that is not the one you think

### 2.1 [[D509]] applies to the served app, not to this wave

[[D509]] 🐞 — *"`make up` advertises two opponent modes it cannot serve"* — is **verified at the
symbol**: `apps/server/src/application.ts:307` reads
`engineMode === "mock" ? new FixtureTablebaseSource() : new LichessTablebaseSource()`, and
`FixtureTablebaseSource` constructed with `{}` throws `TABLEBASE_UNAVAILABLE` for every FEN
(`tablebase.ts:33`), which `rest.ts:573` maps to **503**. `compose.yaml:11` defaults
`ENGINE_MODE: ${ENGINE_MODE:-mock}`.

**But no job in this work order goes through the server.** I checked every instrument:

| Instrument | How it gets a real answer | Needs `make up`? |
|---|---|---|
| `make verify-draft` (syzygy) | `liveTablebaseQuery` → `https://tablebase.lichess.org/standard` (`syzygy.ts:105`) | **no** |
| `make verify-draft` (engine) | spawns a local `stockfish` binary via `createPositionSeedEngineEvaluator` | **no** |
| `make tablebase-walk` | same `liveTablebaseQuery`, with a disk cache under `content/sources/syzygy` | **no** |
| `make engine-walk` | spawns local `stockfish` | **no** |
| `make candidate-attach` | `ExplorerClient` → `https://explorer.lichess.org/lichess` (`explorer.ts:66`) | **no** |

**So the real instruments are: network access to two Lichess hosts, and a local Stockfish.** I
verified the Stockfish precondition holds on this machine: `stockfish` resolves to
`/opt/homebrew/bin/stockfish` and reports `id name Stockfish 18`, while **all 20 engine packs
declare `stockfish-authoring 18 depth 22`** — a version match. `verifyEngineDraft` throws
`VERIFY_ASSESSMENT_CONTRADICTED` unless `engineId`, `engineVersion`, `depth` **and** the exact
centipawn score all agree, so a version drift is a hard stop, not a warning.

**D509 is still a precondition for one thing: verifying the wave's result in the app.** If the wave
ends with an owner opening the product to see a bound claim, that run needs `make up-engines`
(`ENGINE_MODE=maia`), which wires `LichessTablebaseSource`. Do not close the wave against a
`mock`-mode screenshot.

### 2.2 `make graduation-report` is not read-only — do not run it during a measurement pass

`graduation-report.ts:58` calls `writeFileSync(path, report.acceptedPage)` with a default of
`content/accepted-conditions.md`, from the CLI entry at `:61-65`. **A target named "report" writes
the corpus.** For before/after measurement, recompute its numbers read-only (the logic is 40 lines
of `graduationReport()`), or accept a dirty tree and `git checkout` it. Proposed as [[D525]].

### 2.3 `EVIDENCE_DIGEST_STALE` is warning-only, and 26 candidate ledgers are already stale

`check.ts:408` and `:468` push `EVIDENCE_DIGEST_STALE` with explicit `"warning"` severity, and
`valid` at `:434`/`:476` is `!issues.some(v => v.severity === "error")`. **A stale digest never fails
a check.** I re-derived staleness with the shipped RFC 8785 canonicalization
(`packages/schema/src/drill-pack/digest.ts` `digestDrillPack` → `canonicalizeJson`):

- **draft ledgers: 32 fresh, 0 stale** — [[D269]]'s and [[D263]]'s figures are discharged, confirmed.
- **candidate ledgers: 10 fresh, 26 stale** — and **all 26 are the `onramp-*` family**, none of the
  10 named opening/endgame candidates. That is a single emitter's output, not corpus rot.

**Do not bulk re-stamp the 26.** [[D269]]'s discipline is that a re-stamp erases a signal it did not
create, and the `blocking → resolved` writer does not exist: [[D466]] 🐞 records that
`graduation-clearance` specifies four automatic transitions and no writer, and names
`make graduation-clear` as the fix. Candidates are also outside the served corpus —
`graduation-report.ts:24` excludes `content/candidates` from `graduable`.

### 2.4 The one hazard that turned out not to bite

[[D276]] 🐞 warns that a JSON round-trip destroys the corpus's hand-formatting, and both
`verifySyzygyDraft` and `verifyEngineDraft` rewrite the pack with
`JSON.stringify(pack, null, 2)` (`verify-draft.ts:210`, `:316`). **I tested all 50 authored packs:
50 of 50 already round-trip byte-identically** through `JSON.stringify(doc, null, 2) + "\n"`. So
`verify-draft`'s rewrite is formatting-neutral on the draft corpus today. Re-test before relying on
this if a hand-edited pack lands.

---

## 3. The jobs, in execution order

### JOB A — the provenance-promise repair and the dangling citation (**run this first**)

**Rows:** [[D470]] 🐞 *"20 packs' `provenance.sources` promise data in `provenance.engineValidation`,
0 of 20 carry the key, and the validator forbids carrying it"*. Also discharges the citation half of
the same row.

**Verified at the symbol.** `pack-validation.ts:867-868` iterates
`["engineValidation", "tablebaseValidation", "evidence", "records"]` and raises
`PROVENANCE_EVIDENCE_INLINE` — `severity: "error"` (`:125-131`) — for any of them present. So the
promise is **unkeepable**, not merely unkept. I counted the promising packs myself: **20 of 50**
carry a `provenance.sources` string matching `provenance.engineValidation`; **0** carry the key.
The 20 are exactly the 20 packs with `objective.grading.assessedBy.kind: "engine"`, and all 20 have
ledgers. `anti-caro-advance-early-c5` `/provenance/sources/6` cites `bxc5-recoup` twice; I walked
every `id` in the document and **`bxc5-recoup` is not an id anywhere in it** — the line was deleted
2026-08-15 and `/provenance/graduationBlockers` records the deletion.

**Commands.**

```
# 0. baseline, read-only
make expression-census                       # record totals.claims / totals.backedClaims
for f in content/drafts/*.json; do make sourcing-check FILE="$f"; done   # record pass/fail split

# 1. edit 20 provenance strings by hand (see the substitution rule below)
#    edit content/drafts/anti-caro-advance-early-c5.json /provenance/sources/6 — drop bxc5-recoup

# 2. per pack, revalidate the pack document itself
make pack-check FILE=content/drafts/<pack>.json

# 3. MANDATORY digest re-stamp — the pack changed, so its ledger is now stale
make verify-draft FILE=content/drafts/<pack>.json        # engine packs: needs stockfish 18 on PATH

# 4. confirm
make sourcing-check FILE=content/drafts/<pack>.json
```

**The substitution rule, and it is the whole reason this is mechanical.** The sentence to change is
a *statement about where bytes live*, not about chess. Replace the pointer
`provenance.engineValidation` with the sidecar the validator actually accepts —
`<pack>.evidence.json` — and change **nothing else in the sentence**. Do not add, remove or requalify
any evaluation, centipawn figure, depth, or move name. If a sentence cannot be repaired without
changing what it asserts about the position, stop and route it to 7b.

**Precondition it must not violate.** `verifyEngineDraft` refuses unless the freshly measured root
score equals `assessedBy.score` exactly at `assessedBy.depth` for `assessedBy.engineId` /
`engineVersion`. Run it on **one** pack first. If it throws `VERIFY_ASSESSMENT_CONTRADICTED`, the
local engine build is not the one that authored the pack — **stop the job, do not re-declare the
score**, and report it. Re-declaring is how a mechanical wave manufactures chess truth.

**What it writes.** Pack bytes (20 files) + `.evidence.json` + `.sources.json` + `.job.json` for each
(all rewritten by `verify-draft`). **This is a content wave** and carries `CLAUDE.md`'s content
closeout: flip the `design/BACKLOG.md` rows it ships and append the entry to
`planning/content-era/log.md` **in the same commit**.

**Digest re-stamp.** Mandatory, and `verify-draft` performs it (`digestDrillPack(pack)` at
`verify-draft.ts:317`). Do **not** hand-edit `packDigest`.

**Expected measurement, before → after.**

| Measurement | Before (`68098e5`, measured) | After |
|---|---|---|
| packs whose `provenance.sources` name `provenance.engineValidation` | **20** | **0** |
| packs carrying `provenance.engineValidation` | 0 | 0 (unchanged — the format forbids it) |
| occurrences of `bxc5-recoup` in `anti-caro-advance-early-c5.json` | **2** | **1** (the graduation-blocker record of the deletion stays; the citation goes) |
| draft ledgers digest-stale | 0 of 32 | **0 of 32** — if this is not 0, the re-stamp was skipped |
| packs passing `sourcing-check` strict | 32 of 50 | 32 of 50 (unchanged) |
| `expression-census` `totals.backedClaims` | 1 | 1 (unchanged — this job binds nothing) |

**Mechanical / human split:** **21 edits mechanical, 0 human** — provided the substitution rule holds
for all 20. Expect 1–3 to need a human read; route those out rather than paraphrasing.

**Why first:** it is the only job in this document that is fully mechanical, whose instrument ships,
whose instrument version is verified to match on this machine, and which closes a row the triage put
in **priority tier A** (batch A1, *"the server does not boot"*). It also exercises the digest
re-stamp discipline on 20 files before jobs B and C rely on it.

---

### JOB B — the tablebase legal-successor census (**needs one new instrument**)

**Rows:** [[D110]] 🐞 *"No position in the corpus has a complete legal-move tablebase census, and
thirteen claims assert one"*, [[D225]] 🐞, [[D224]] 🐞.

**What `CLAIM_CENSUS_INCOMPLETE` actually demands.** `claim-binding.ts:117-131`: for
`tablebase.moveCensus@v1` and `tablebase.uniqueMoveOfCategory@v1`, it enumerates
`legalSuccessors(fen)` and requires a `tablebase_result` record for **every one**, else
`CLAIM_CENSUS_INCOMPLETE`. **It fires zero times in the corpus today, because no binding declares a
census assertion** — I walked all 32 ledgers and found **1 binding, 0 `moveCensus` assertions**.

**Measured myself, and the triage's `277` does not reproduce under any definition I tried.**

| Definition | Choice-bearing positions | Legal successors needed | Successors held | Fully censused |
|---|---|---|---|---|
| Spine positions only (start + every spine node, ≤7 pieces) | **199** | **2 852** | 293 | **0** |
| Already-recorded anchors that have ≥2 legal moves | **240** | 3 039 | — | **0** |
| The full set `positions()` builds (spine **+ one ply of every legal move**) | **2 473** | **20 090** | 293 | **0** |

Corpus-wide: **341 `tablebase_result` records across 288 distinct anchor FENs in 12 packs** — that
half of the triage reproduces exactly. **"0 fully censused" reproduces under all three definitions.**
The **277** does not; treat it as unsourced and use one of the three above, stating which.

**Two blockers before a command can be written.**

1. **There is no writer from a walk report to an evidence ledger.** `make tablebase-walk` returns
   `{schema: "tabiya.sourcing.walk.v1", nodes, abstentions}` and writes it to `--out` or stdout
   (`tablebase-walk.ts:127`, `:157`). It emits **no `EvidenceRecord`**. The only shipped producer of
   `tablebase_result` records is `verifySyzygyDraft`, which enumerates **pack positions only**
   (`enumerate(original)`), not legal successors. **A new instrument is required** — call it
   `make tablebase-census`, modelled on `verifySyzygyDraft`'s record-and-manifest emission but fed by
   `tablebaseWalk`'s `legalMoves` enumeration, with the same mandatory `digestDrillPack` re-stamp.
   Proposed as [[D526]].

2. **The producer and the consumer disagree about promotions, and the consumer is wrong.**
   `tablebase-walk.ts:47-56 legalMoves` enumerates all four promotion pieces. `claim-binding.ts`
   `legalSuccessors` (`:70-79`) and `positions` (`:50-54`) both do `next.play({ from, to })` with
   **no `promotion` field**. On a pawn reaching the last rank chessops leaves a pawn on the back
   rank, so `makeFen(next.toSetup())` yields an **illegal FEN** that can never match a record —
   `CLAIM_CENSUS_INCOMPLETE` becomes unsatisfiable. I hit this directly: my own naive re-implementation
   of `positions()` crashed with `ERR_PAWNS_ON_BACKRANK` on the corpus, and the affected packs are
   **`lucena-bridge-convert`, `pawn-breakthrough-convert`, `queen-vs-pawn-seventh-convert`** — three
   of the twelve. Proposed as [[D522]]. **This is a code fix and therefore not part of a content
   wave**; it needs its own commit, and job B must not start before it lands.

**Commands, once both blockers are cleared.**

```
# measurement only, safe today — writes the gitignored cache under content/sources/syzygy
make tablebase-walk FILE=content/drafts/philidor-third-rank-hold.json \
  ENUMERATE=all MAX_QUERIES=400 OUT=/tmp/walk-philidor.json

# the instrument that does not exist yet
make tablebase-census FILE=content/drafts/<pack>.json    # must re-stamp packDigest
make sourcing-check FILE=content/drafts/<pack>.json
```

**Precondition it must not violate.** `MAX_QUERIES` defaults to **400**
(`tablebase-walk.ts:93`) and the walk throws `WALK_QUERY_BUDGET_EXCEEDED` past it. The
spine-only definition needs **2 852** successor probes across 12 packs; the full definition needs
**20 090**. Raising the budget without also honouring the Lichess etiquette the code advertises in
its own user-agent (`syzygy.ts`) is the wrong fix. The cache under `content/sources/syzygy` is
gitignored, so a re-run is not free the second time either — budget per pack, not per corpus.

**What it writes.** `.evidence.json` records only — **no pack bytes**. Because it changes a digested
sidecar but not the digested document, the digest does not move; re-stamp anyway if the pack is
touched for any reason in the same commit.

**Content wave?** **Yes** — it changes committed corpus artefacts, so it carries the ledger flips and
the `planning/content-era/log.md` entry in the shipping commit.

**Expected measurement, before → after (spine-only definition).**

| Measurement | Before (measured) | After |
|---|---|---|
| `tablebase_result` records | **341** | ≥ 3 193 |
| distinct anchor FENs | **288** | ≥ 3 051 |
| choice-bearing spine positions fully censused | **0 of 199** | 199 of 199 |
| corpus `tablebase.moveCensus@v1` assertions | **0** | **0** — this job writes records, not claims |
| `expression-census` `totals.backedClaims` | **1** | **1** |

**That last row is the point of the job and must be stated in the commit message.** A completed
census **binds nothing by itself**. Backing rises only when a human authors a claim and a binding
over it.

**Mechanical / human split:** records for **199 positions / 2 852 successors** mechanical;
**7** [[D110]] full-set census claims and every `moveCensus` binding human.

---

### JOB C — the engine pass for `engine_validated` (**small, and smaller than reported**)

**Rows:** [[D267]] 🐞 (measured half), [[D409]] 🐞 (instrument half).

**Measured.** **8 `engine_validated` claims across exactly 3 packs**: `anti-scandinavian-white` (4),
`scandinavian-mainline-black` (3), `maroczy-bind-white-squeeze` (1). The first two have ledgers and
declare `assessedBy.kind: "engine"`. **`maroczy-bind-white-squeeze` has no ledger and declares no
`assessedBy` at all**, so `verifyDraft` throws `VERIFY_ASSESSMENT_NOT_GROUNDABLE` on it
(`verify-draft.ts:338-341`). **So the job is 7 claims across 2 packs, not 8 across 3.**

**Commands.**

```
make engine-walk FILE=content/drafts/anti-scandinavian-white.json ENUMERATE=decision OUT=/tmp/ew.json
make verify-draft FILE=content/drafts/anti-scandinavian-white.json
make sourcing-check FILE=content/drafts/anti-scandinavian-white.json
# repeat for scandinavian-mainline-black
```

**Precondition.** Local `stockfish` must be the declared build. Verified here: `Stockfish 18` on
PATH against `stockfish-authoring 18 depth 22` declared in all 20 engine packs. `engine-walk`'s
`MAX_QUERIES` also defaults to 400 and it refuses `ENUMERATE=all` outright
(`WALK_ENUMERATE_UNSUPPORTED`).

**What it writes.** `verify-draft` rewrites pack bytes **and** all three sidecars; it **preserves**
non-engine records (`preservedRecords` filter, `verify-draft.ts:322`) and throws
`VERIFY_LEDGER_MERGE_CONFLICT` if a preserved record has no manifest entry. `engine-walk` writes only
its report. **Content wave: yes.**

**Digest re-stamp.** Performed by `verify-draft` (`digestDrillPack(pack)` at `:317`). Mandatory.

**Expected measurement.**

| Measurement | Before (measured) | After |
|---|---|---|
| `engine_eval` records | **391** | ≥ 391, refreshed `retrievedAt` on 2 packs |
| `engine_validated` claims with a binding | **0 of 8** | **0 of 8** unless a human writes the bindings |
| `expression-census` `totals.backedClaims` | **1** | **1** |

**Mechanical / human split:** **2 packs' record refresh** mechanical; **8 of 8 claim bindings**
human, plus **1 `assessedBy` declaration** (`maroczy-bind-white-squeeze`) which is a grading decision
and belongs to 7b.

---

### JOB D — converge the corpus denominator (**cheap, mechanical, and still open**)

**Rows:** [[D262]] 🐞 *"A `transposeKey` index over the corpus has three different position counts"*.
[[D227]] and [[D257]] are **✅ closed** — see §5.

**Measured at `68098e5`: the corpus denominator is re-derived in four places and disagrees.**

| Producer | Number it reports | Symbol |
|---|---|---|
| Default catalogue discovery | **50** | `pack-registry.ts` `isPackDocumentName` — the shared predicate D257 shipped |
| `expression-census` `corpus.packs` | **56** | `expression-census.ts:324`, counting `packDocuments.size`; `:274` only *labels* `.browser.json` into `fixturePacks` |
| `expression-census` `totals.packs` | **50** | the same report, four lines apart |
| `graduation-report` `documents` | **56** | `graduation-report.ts:8 files()` — its own regex, excluding only `evidence|job|sources` |

**One report contains both 56 and 50.** `isPackDocumentName` is exported and imported by neither
consumer. **The job is two imports and a test.**

**Commands.**

```
make expression-census        # note corpus.packs vs totals.packs
make verify                   # typecheck + test + schema-check
```

**What it writes.** **Code only** (`apps/server/src/expression-census.ts`,
`apps/server/src/graduation-report.ts`, plus a test). **This is not a content wave** — it flips
ledger rows under the ordinary implementer protocol and does not touch
`planning/content-era/log.md`.

**Digest re-stamp:** none — no digested document changes.

**Expected measurement:** `expression-census` `corpus.packs` **56 → 50**; `graduation-report`
`content/drafts documents` **56 → 50**; a new test pinning that every corpus denominator in the tree
comes from `isPackDocumentName`.

**Mechanical / human split:** **fully mechanical**, 0 human. Proposed as [[D528]].

---

### JOB E — the explorer position-census wave (**blocked; do not commission it as written**)

**Rows:** [[D231]], [[D147]], [[D128]], [[D141]], [[D157]], [[D124]] (record half), [[D350]].

**This is the job the triage sized at *"22 directly attachable"*. It is 0.** Two independent shipped
refusals stack, and both are measured:

1. **`ATTACH_SOURCE_LINE_MISSING`** — `explorer.ts:247` requires `provenance.sources` to contain
   `EXPLORER_RATIONALE` verbatim. **0 of 50 packs carry it.** Adding the line is a one-line pack edit
   — but it is a **licence and provenance assertion** (*"aggregate statistics are facts; the underlying
   Lichess game data is CC0…"*), so a script adding it to a pack that did not source the explorer is
   asserting a provenance fact that is false. **Human, per pack.** Proposed as [[D524]].
2. **`CLAIM_ASSERTION_UNDECLARED`** — the attach writes one span; every one of the 60
   `corpus_observed` claims carries **6 to 38** machine tokens. The distribution I measured:

   | tokens | 6 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 22 | 23 | 24 | 25 | 28 | 31 | 36 | 38 |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | claims | 2 | 1 | 1 | 1 | 2 | 1 | 4 | 8 | 2 | 1 | 5 | 2 | 2 | 16 | 2 | 2 | 1 | 1 | 3 | 1 | 1 | 1 |

   **Zero claims are attachable by the shipped one-span writer.** Proposed as [[D523]].

3. A third, quieter one: **`CANDIDATE_NOT_CLEAN`** — `attachExplorerEvidence` runs
   `checkSourcingFile(file, {strict: true})` *before* it does anything and throws if invalid
   (`explorer.ts:238-240`). **18 of 50 packs fail strict** (see §5), so those are refused at the door
   regardless.

**And the 38-claim half is worse than "needs a sidecar first."** The triage says 38 claims sit in 18
ledger-less packs. I measured: **38 claims sit in 15 ledger-less packs** (three of the 18 carry no
`corpus_observed` claim at all). More importantly, **all 18 ledger-less packs declare an
`objective.grading.assessedBy.kind` of `(none)` (16 packs) or `authored` (2 packs)**, and
`verifyDraft` refuses both with `VERIFY_ASSESSMENT_NOT_GROUNDABLE`. **There is no mechanical path to
a sidecar for any of the 18.** Proposed as [[D527]].

**What a runnable version of this job looks like** — and it is a different job:

- **E1 (mechanical, runnable today):** produce explorer *readings* without attaching them. `make
  source-fetch SOURCE=<id>` and `make candidate-emit PIPELINE=explorer` ship and
  `content/sources/lichess-explorer/` already holds cached artefacts. This gives the author the
  numbers to write against. **Writes nothing into `content/drafts`.**
- **E2 (human):** per pack, add the explorer rationale to `provenance.sources`, and rewrite the claim
  so exactly one machine token remains — or accept that the claim needs a **multi-span binding**,
  which no shipped writer emits.
- **E3 (mechanical, once E2 lands per pack):** `make candidate-attach FILE=<pack> PIPELINE=explorer
  ARGS='--target /feedbackClaims/<i>/text --span <token> --field sharePct --move-san <san>'`, then
  `make sourcing-check FILE=<pack>`. **`attachExplorerEvidence` re-stamps `packDigest` itself**
  (`explorer.ts:293`) and runs its own strict post-check in a temp directory before writing —
  so the digest obligation is discharged by the tool for this job and this job only.

**Expected measurement.** The only honest before/after here is
`make expression-census` `totals.backedClaims`: **1** today, and **+1 per claim E3 completes**. Do
not report a share of 60 as progress until E2 has run, because E2 is the wave.

**Mechanical / human split: 0 mechanical, 60 human, today.** After E2, one mechanical attach per
claim.

---

## 4. Ordering and collisions with what is in flight

| Order | Job | Gated on | Collides with |
|---|---|---|---|
| **1** | **A — provenance repair** | nothing; run today | nothing. It touches 20 pack documents and their sidecars; **do not run concurrently with any other pack-byte job** |
| **2** | **D — denominator convergence** | nothing; code only | `rfc/shared-resource-registers.md` (draft) proposes `make register-check` over a different join. Different targets; no lane conflict |
| **3** | **C — engine pass** | job A, because A already re-runs `verify-draft` on both packs | overlaps job A on `anti-scandinavian-white` and `scandinavian-mainline-black`. **Fold C into A's run** rather than re-running the engine twice |
| **4** | **B — tablebase census** | [[D522]]'s promotion fix landing first, and a new `make tablebase-census` | `rfc/graduation-clearance.md` claims pack schema **0.28** and adds `make graduation-clear`; job B adds records, not schema — no lane conflict, but both will re-stamp digests |
| **5** | **E — explorer wave** | 60 authored decisions | **This is `feedback-delivery` stage 2** |

**The collision that actually matters.** `rfc/feedback-delivery.md` is **accepted** and lands in two
stages; **stage 2 IS this wave's consumer, and [[D476]] 🐞 records that it has no owner** — *"An RFC
can be archived while a wave it owns is unrun… Nothing in the repo now owns 98 claims of work that a
landed owner ruling ([[D462]]) requires to happen before anyone plays."* Jobs A–D can proceed without
resolving D476. **Job E cannot**, and commissioning it is an owner act, not an implementer's.

**A status disagreement to resolve before touching `graduation-clearance`'s lane.** [[D503]] 🐞
records that the RFC was *"returned under its own buildability clause"*. But `rfc/graduation-clearance.md`'s
own status line reads **"accepted 2026-08-16 by claude as register owner"**, and `rfc/README.md:12`
also reads accepted. **Three documents, two answers.** This is a fresh instance of [[D477]] 🐞
(*"no status-parity check between an RFC's body and `rfc/README.md` — it has blocked an implementer
five times"*), and it is now six. Proposed as [[D530]]. Do not assume either reading.

**One more ordering note.** [[D432]] 🐞 records that `RECORDED_READING_DISPOSITIONS` freezes a corpus
*fact* as a runtime disposition. I confirmed it is live: `position-evidence.ts:28` refuses
`explorer_position_census` with *"No loadable pack producer emits this position-census record kind"*.
**That sentence stops being true the moment job E's first attach lands.** Fix D432 *with* job E, not
before and not after.

---

## 5. Already done — drop these from the wave

**Fixture handling — [[D227]] ✅ and [[D257]] ✅, closed at `3524b8e`.** But the shape of the fix is
not what the triage's "fixture relocation" name implies, and the difference is load-bearing:
**nothing was relocated.** All six `*.browser.json` files are still in `content/drafts/`. `3524b8e`
added `isPackDocumentName` to `pack-registry.ts` — `extname === ".json" && !name.endsWith(".browser.json")
&& !isSidecarName(name)` — and moved the fixtures into `playwright.config.ts`'s explicit
`DRAFT_PACK_FILES` list. **Default discovery is now 50; the files stayed put.** Any work order saying
"move 6 files" is describing a job that will not happen and should not.

**The count correction the brief asked for: 56 → 50 is true for discovery and false everywhere else.**
`make expression-census` still reports `corpus.packs: 56`, and `make graduation-report` still reports
`documents: 56`. Both numbers are live at `68098e5`. That residue is **job D**, and it is why D262
stays 🐞 while D227 and D257 are ✅.

**Also closed since `f10b20f`, all read from column 1 at `68098e5`:**

| Row | Column 1 | Closed by |
|---|---|---|
| **D207** | **✅** | `d8357e8` *"fix(authoring): expose masked evidence failures"* |
| **D239** | **✅** | `d8357e8` |
| **D209** | **✅** | the digest-freshness clause resolved |
| **D211** | **✅** | `resolvePackPath` adoption |
| **D446** | **✅** | `5c66680` — `q8.test.ts:297` now writes only under `UPDATE_Q8=1` |
| **D227 / D257** | **✅** | `3524b8e` |

**The D207 fix moved a number this wave depends on.** `EVIDENCE_TYPE_UNBACKED` was reported as **65
issues across 28 packs** at `f10b20f`. I ran `checkSourcingFile` over all 50 authored packs at
`68098e5` and measured **104 issues across 43 packs** — because the masked half is now reported. The
full issue census:

| Code | Issues | Packs | Severity |
|---|---|---|---|
| `EVIDENCE_TYPE_UNBACKED` | **104** | 43 | warning |
| `EVIDENCE_READ_ERROR` | 18 | 18 | **error** |
| `MANIFEST_READ_ERROR` | 18 | 18 | **error** |
| `PACK_RETRY_VARIANTS_NOT_EXECUTABLE` | 9 | 7 | warning |
| `PACK_PLAN_CONSEQUENCE_DEPRECATED` | 3 | 3 | warning |
| `PACK_GUARD_CANNOT_REACH_DEVIATION` | 2 | 2 | warning |

**32 of 50 authored packs pass `sourcing-check` strict; 18 fail, and all 18 fail only because they
have no sidecars.** 104 unbacked labels + the 1 bound Philidor claim = the 105 machine-labelled
claim-slots in §1.

---

## 6. What needs a real instrument, and how it gets one

| Need | Status | How it is obtained |
|---|---|---|
| Real Syzygy readings | **available** | `liveTablebaseQuery` → `tablebase.lichess.org`, cached under gitignored `content/sources/syzygy`. Not via the server, so **[[D509]] does not block it** |
| Real Stockfish | **available and version-matched** | local `stockfish` = `Stockfish 18`; all 20 engine packs declare `stockfish-authoring 18 depth 22`. `verifyEngineDraft` refuses on any mismatch |
| Real explorer readings | **available** | `ExplorerClient` → `explorer.lichess.org`; 43 cached artefacts already under `content/sources/lichess-explorer/` |
| A serving app that can answer a tablebase probe | **NOT available under `make up`** | `make up-engines` (`ENGINE_MODE=maia`) wires `LichessTablebaseSource`. Required only to *demonstrate* the wave's result, never to run it. [[D509]] |
| A record writer for legal-successor censuses | **does not exist** | new `make tablebase-census`, modelled on `verifySyzygyDraft`. [[D526]] |
| A `blocking → resolved` writer | **does not exist** | `make graduation-clear`, specified in `rfc/graduation-clearance.md` §6.5 against [[D466]]. **Until it lands, do not hand-edit graduation entries** — including the 26 stale candidate ledgers |
| A promotion-correct successor enumerator in `claim-binding.ts` | **broken** | code fix, own commit, before job B. [[D522]] |

**One more thing that does not exist and should be said plainly.** All **220** blocking graduation
entries in `content/drafts` carry only `id`, `state` and `statement` — **`clearedBy` is unspecified
on all 220**. So no entry routes itself to a job, and no job can claim to clear one. Proposed as
[[D529]].

---

## 7. Proposed ledger rows — **not written**

Ids from **D522**, per the brief. Each is something this pass measured that no existing row states.

- **D522 🐞** — *The census enumerator and the census producer disagree about promotions, and the
  consumer is the wrong one.* `claim-binding.ts` `legalSuccessors` (`:70-79`) and `positions`
  (`:50-54`) call `next.play({from, to})` with no `promotion`, producing an illegal
  pawn-on-back-rank FEN, while `tablebase-walk.ts:47-56 legalMoves` enumerates all four pieces
  correctly. `tablebase.moveCensus@v1` is therefore **unsatisfiable** at any promotion-capable
  position. Affects `lucena-bridge-convert`, `pawn-breakthrough-convert`,
  `queen-vs-pawn-seventh-convert`.
- **D523 🐞** — *The shipped explorer attach can bind zero of the 60 claims it exists for.*
  `attachExplorerEvidence` writes one span; `CLAIM_ASSERTION_UNDECLARED` (error) refuses any leftover
  machine token; every `corpus_observed` claim carries **6–38** tokens. A one-span writer against a
  many-token corpus is a mechanism with no reachable input.
- **D524 🐞** — *`ATTACH_SOURCE_LINE_MISSING` refuses 60 of 60, not 38 of 60.* **0 of 50** authored
  packs carry `EXPLORER_RATIONALE`. The triage's *"22 directly attachable"* is the number that made
  job 1 look like a script.
- **D525 🐞** — *`make graduation-report` writes the corpus.* `graduation-report.ts:58`
  `writeFileSync(content/accepted-conditions.md)`, from the CLI entry. A measurement pass cannot use
  it without dirtying the tree, which is the [[D446]] shape one tier over.
- **D526 🐞** — *No writer turns a `tabiya.sourcing.walk.v1` report into evidence records.*
  `make tablebase-walk` is measurement-only; the only `tablebase_result` producer is
  `verifySyzygyDraft`, over pack positions rather than legal successors. [[D110]] is therefore not
  gated on API time — it is gated on a missing instrument, which the row does not say.
- **D527 🐞** — *No mechanical path exists to give any of the 18 ledger-less packs a sidecar.*
  All 18 declare `objective.grading.assessedBy.kind` of `(none)` (16) or `authored` (2), and
  `verifyDraft` throws `VERIFY_ASSESSMENT_NOT_GROUNDABLE` on both. Every plan that prices these as
  *"run `verify-draft`"* is pricing a command that refuses.
- **D528 🐞** — *The corpus denominator is re-derived in four places and one report contains two of
  them.* `isPackDocumentName` = 50; `expression-census` `corpus.packs` = **56** and `totals.packs` =
  **50** in the same document; `graduation-report` `documents` = **56**. [[D257]] shipped the shared
  predicate and neither consumer imports it.
- **D529 🐞** — *All 220 blocking graduation entries have no `clearedBy`.* No blocker names the job
  that would clear it, so no wave can measure its own effect on the graduation gate.
- **D530 🐞** — *`graduation-clearance`'s status is three-way inconsistent, which is [[D477]]'s sixth
  instance.* [[D503]] records the RFC as returned; the RFC body reads *"accepted 2026-08-16 by claude
  as register owner"*; `rfc/README.md:12` reads accepted. D477 counted five blocked implementers; a
  work order is the sixth reader to hit it.

---

## 8. What I ran, and my spot-check rate

**Read-only measurements executed** (nothing wrote to `content/`; `dist/` and `content/sources/` are
gitignored, and I ran no target that writes a pack, sidecar or `content/accepted-conditions.md`):

- `make pack-check FILE=content/drafts/anti-caro-advance-early-c5.json`
- `make sourcing-check FILE=<pack>` over **all 50** authored pack documents
- `make expression-census` (stdout only; no `OUT=`)
- **Not run:** `make graduation-report` (it writes `content/accepted-conditions.md`); instead I
  re-derived its four counts read-only from `graduationReport()`'s logic and reproduced
  `documents 56 / blocking 220 / resolved 30 / accepted 43 / graduable (none)` exactly.
- Node walks over `content/drafts` and `content/candidates` for: claim and label counts, record
  kinds, sidecar presence, `provenance.sources` matches, `assessedBy.kind`, `claimBindings`,
  `MACHINE_TOKEN` counts, `graduationBlockers` shape, and JSON round-trip fidelity.
- A re-implementation of `digestDrillPack` (RFC 8785 canonicalization + SHA-256) over all 32 draft
  and 36 candidate ledgers.
- A `chessops` census over the 12 tablebase packs, under three definitions of "choice-bearing".
- `stockfish` `uci` handshake; `git show` on `3524b8e`, `5c66680`, `d8357e8`.

**Spot-check rate: 30 statements from the brief, `defect-triage.md` §7 and `research-queue.md`
checked against the tree. 12 were materially stale or wrong — a 40% rate.** That is higher than the
repo's measured 24%, for the same reason the research queue's was 42%: I sampled the statements most
likely to have moved, and four commits landed on the corpus between `f10b20f` and `68098e5`.

**The 12:**

| Statement | Source | At `68098e5` |
|---|---|---|
| *"22 directly attachable"* explorer claims | triage §7a | **0** — no pack carries `EXPLORER_RATIONALE` |
| *"38 in 18 ledger-less packs"* | triage §7a | 38 claims, but in **15** ledger-less packs |
| *"0 of 277 choice-bearing positions censused"* | triage §7a | "0 censused" holds; **277 reproduces under no definition** (199 / 240 / 2 473) |
| *"Fixture relocation"* | brief, triage job 4 | nothing relocated; an **exclusion predicate** landed and the 6 files stayed |
| *"56 packs where it is now 50"* | brief | 50 for discovery; **56 still live** in two shipped instruments |
| `EVIDENCE_TYPE_UNBACKED` 65 across 28 packs | triage §7a | **104 across 43** after D207's fix |
| *"32 clean, 24 with an error"* | triage §7a | **32 pass / 18 fail** over 50 authored |
| D446 *"the tree-writing `writeFileSync` remains"* | triage §6c, B4 | **✅**, gated on `UPDATE_Q8=1` at `5c66680` |
| D207, D239 *"NOT FIXED"* | triage B8 | both **✅** at `d8357e8` |
| D209 *"half"* | triage B8 | **✅** |
| D211 *"now 2, was 16"* | triage B3 | **✅** |
| `make graduation-report` usable as a measurement | implied throughout | **writes `content/accepted-conditions.md`** |

**Statements I checked and that reproduced exactly:** 50 authored packs / 6 fixtures; 196 claims and
the full label split (`author_principle` 82, `corpus_observed` 60, `derived_feature` 43,
`tablebase_exact` 37, `hypothesis` 24, `engine_validated` 8); 32 ledgers and 764 records =
391/341/32 with **0** explorer of either kind; 288 distinct tablebase anchors across 341 records;
20 packs promising `provenance.engineValidation` and 0 carrying it; `bxc5-recoup` present twice and
an id nowhere; 0 of 32 draft ledgers stale and **26 of 36** candidate ledgers stale; `make
graduation-report`'s four counts; [[D509]]'s mock-503 wiring; `EVIDENCE_DIGEST_STALE` warning-only.

**What I did not check:** [[D462]]'s figure of **63** claims tripping `CLAIM_AUTHOR_LABEL_REQUIRED`.
That predicate fires only inside the `claimBindings` loop and the corpus has **one binding**, so it
fires **once** today; 63 is a projection over the *withheld* subset whose definition lives in the
delivery surface. My own full-population figure is **114 of 196 claims carry no `author_principle`,
across 44 packs**. I did not re-derive 63 and I did not reclassify it.

---

## 9. If you run one job

**Job A — the provenance-promise repair.** Twenty text edits under a stated substitution rule, one
dangling citation, and `make verify-draft` to re-stamp. It is the only job in this document that is
fully mechanical end to end, whose instrument ships **and** whose instrument version is verified to
match this corpus on this machine. It closes a **priority tier A** row ([[D470]], batch A1) and it
proves the digest discipline on 20 files before anything larger depends on it.

**And say what it does not do.** It will not move `expression-census`'s `backedClaims` off **1**. No
mechanical job in this document does. The number moves when a human writes a claim a machine can
certify — which is exactly the shape law 8 requires, and the reason this wave has a floor under how
fast it can go.

---

## Training-method content wave (D863) — added 2026-08-22 from the residue reconciliation

> **Training-method content wave (D863):** author (a) stated_reasoning checkpoints across
> the existing spine — the write-before-checking method whose full machinery ships with one
> consumer, and (b) additional perfect_tablebase technical-position packs (currently 6 files)
> re-cut as play-the-consequence, never find-the-tactic. Both are law-8-clean: the machinery
> already grades nothing. This wave also absorbs SC Discharge D4's authored-witness debt
> (D926) where positions overlap.

Authoring work, not code; no RFC needed. Sequencing: this is a content wave and sits behind the
owner's D949 Gate F hold with the rest of the content lane; it carries the standard content-wave
closeout (ledger flips + `planning/content-era/log.md` entry in the shipping commit).

---

## Content-state routing 2026-08-23 (from `planning/content-era/state-of-the-corpus.md`)

The state-of-the-corpus audit produced three rows; this work order is their destination.

- **[[D992]] — Gate F clause 2's unrecorded pass.** Ticked in `planning/platform-alignment/plan.md`
  at the audit's landing commit (`register-check` green; [[D499]] closed 2026-08-21). Residual owned
  here: **every Gate F clause should name the command that proves it**, so the checklist stops
  decaying the way routing did ([[D487]]/[[D952]]). One line per clause; no ruling needed.
- **[[D993]] — the corpus is join-poor, not evidence-poor.** 764 machine records (391 `engine_eval`,
  341 `tablebase_result`, 32 `position_legality`, 0 explorer) against 196 claims with exactly **one**
  bound. All 98 withheld claims are **grounded-derivable**: 60 `corpus_observed` via the shipped-but-
  never-run explorer instrument, 36 `tablebase_exact` via `ENUMERATE=all` censuses over 277 positions,
  8 `engine_validated` via prose normalization. Execution arm is the binding wave
  (`planning/feedback-delivery/stage2-work-order.md`), **held whole until Gate F by [[D949]]** — this
  measurement resizes that wave's mechanical arm; it does not lift the owner's hold.
- **[[D994]] — no subset of the 152 drafts can satisfy Gate F clause 8.** Four primitive families have
  zero corpus witnesses (`engineCondition`, `legShapes`, `legOpponentPolicy`, `prediction`) and the
  Maia assistance rung carries zero claims. The sacrificial pilot is the only route, and its authoring
  is **licensed now** by `planning/platform-alignment/plan.md:39` (the limiting clause is the licensing
  clause). Blocked only on the O6.3 membership rule; candidate evidence (lowest-debt drafts, primitive
  coverage) is in the audit's pilot shortlist — evidence for a ruling, not a decision.

## Capability-staleness routing 2026-08-23 (from `planning/content-era/capability-staleness.md`)

- **[[D999]]** — the staleness hypothesis inverts: packs match the HEAD format; the nine new
  capabilities are not pack-referenceable (disjoint vocabularies). Owned here as the standing
  answer to "should we re-author against new capabilities" — **no, there is nothing new to say**;
  the binding gap is the real one.
- **[[D1000]]** — the one-pack proof: `lucena-bridge-convert` shows 1 of 4 claims because unbound
  machine-labelled claims are removed from the page, with 22 unused tablebase records in its own
  sidecar. Closes with the binding arm.
- **[[D1001]]** — the binding/graduation separability measurement. Destination: the owner's
  hold-split ruling; if the binding arm is released, execution is
  `planning/feedback-delivery/stage2-work-order.md` steps 3+ **restricted to the binding arm**.
