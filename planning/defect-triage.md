# Defect triage — routing the open ledger rows into work an implementer can take

**Written 2026-08-16 against `f10b20f`.** This is a **routing document, not a fix**. Nothing in
the tree was changed to produce it. It reads `design/BACKLOG.md`'s defect table, classifies every
open row, and groups the takeable ones into batches.

**Read this before using it.** Per [[D419]] and [[D459]], the defect table's row shape is
`| <id> <status> | <description> | <disposition note> |` and **column 3 is not a status**. Every
classification below reads **column 1** and then checks the tree. Where I checked the tree the row
is marked `[V]` with the symbol I checked; where I did not, it is marked `[row]` and the claim
belongs to the row, not to me.

**One thing changed under me while I worked**: `f10b20f` landed mid-pass and added **[[D478]]**.
The brief said ids through D477 were in use. Counts below are as of `f10b20f`.

---

## 1. The headline

| Bucket | Rows | Note |
|---|---|---|
| **ALREADY-DONE** — close the row | **40** | 29 **verified by me at the symbol**, 11 claimed closed in column 3 and not re-checked |
| **PARTIALLY DONE** — rewrite the title to the residue, do **not** close | **19** | each reads as an open defect and is a standing constraint |
| **BATCH-READY** | **72** | grouped into 9 batches below |
| **NEEDS-RFC** | 47 | changes a surface, schema, migration position, or normative rule |
| **NEEDS-OWNER** | 22 | a product decision, not a technical one |
| **NEEDS-RESEARCH** | 19 | the answer is unknown, not merely unwritten |
| **DUPLICATE / SUPERSEDED** | 8 | |
| **CONTENT-7a — mechanical corpus work** | **27** | runs an instrument or edits a file; writes no chess judgement |
| **CONTENT-7b — authored chess judgement** | 23 | law 8 forbids generating it |
| **RECORD-ONLY** | 12 | a standing rule with no code referent; it is doing its job by existing |
| Total open at `f10b20f` | **289** | |

*(A row with two halves is counted once, in the bucket that governs the takeable half. D430 and D470
are named in two sections and counted once each, in BATCH-READY.)*

**The single most useful number: 59 of 289 open rows are done or half-done.** That is **20% of the
ledger**, and it makes the remaining work look a fifth larger than it is. **Flipping the 40 costs one
commit and no code.**

**The finding behind the finding.** `db243f5` ("fix: complete pack graduation reporting") edited
**19 defect rows** — D203–D212, D237–D246 — and changed **column 3 only**, writing
`✅ closed 2026-08-16 by pack-graduation 0.27` into the disposition while leaving column 1 at 🐞/💡
`[V]`. So **[[D418]] is exactly right** and the wave that fixed the defects performed [[D419]]'s
defect while doing it. And the disposition is not trustworthy either: I checked all nineteen and
**two of them — [[D207]] and [[D239]] — are not fixed at all**, which is why they appear in
BATCH-READY below rather than in ALREADY-DONE.

**A fourth instance of the [[D419]] misread happened during this pass.** One of my own verification
passes reported *"at HEAD all 15 rows already read ✅"* — it had read column 3. I caught it by
re-reading column 1 directly (`design/BACKLOG.md:393-412`). Three readers in two days was the count
in D419's text; it is four now, and the fourth was mine.

**The second most useful number: CONTENT-7a is 27 rows and reduces to five jobs**, three of which
are a shipped `make` target pointed at the corpus. Sizing is in §7.

### The batches, in priority order

| # | Batch | Rows | Why here |
|---|---|---|---|
| 1 | **A1 — the server does not boot** | 4 | the first graduated pack with an acceptance throws `PACK_INVALID` at load, and `release.yml` ships an ungated corpus |
| 2 | **A2 — opponent selection serves the wrong move** | 6 | a learner faces a reply chosen alphabetically, at a band the engine ignored |
| 3 | **A3 — disclosure holes on live surfaces** | 5 | a granted spectator reads rung-3 engine numbers that `/human-split` refuses on the same run |
| 4 | **B1 — claim binding and the evidence maps** | 7 | one file, seven wrong predicates over authored prose, one of them live in the corpus today |
| 5 | **B3 — corpus denominators and fixture contamination** | 4 | every figure the repo quotes is computed by no code; widest downstream effect for the least work |
| 6 | **B4 — the gate on the gate** | 8 | `make verify` flakes and has no register-parity check; zero runtime risk, cheapest batch here |
| 7 | **B8 — the graduation-emitter residue** | 6 | six rows whose disposition says "closed" and are not; nobody will find them again |
| 8 | **B5 — client surfaces wired one way** | 8 | server verbs with no client bytes; each small, none changes a contract |
| 9 | **B2 — runtime and storage invariants** | 6 | true-by-accident keys and orderings; three are one assertion each, three are RECORD-ONLY |
| — | **B6 / B7** | 5 / 5 | listed so nobody batches them by mistake — B6 is mostly owner-tier, B7 is mostly convention |

---

## 2. Priority tier A — live and user-affecting. Take these first.

### BATCH A1 — "the server does not boot" (4 rows)

**Theme: the graduation gate is a different check in production than in the repo, and nothing stops
a bad corpus shipping.** This is the only batch where doing nothing has a production consequence.

| Row | One line | Checked |
|---|---|---|
| **D468** 🐞 | `GRADUATION_RULING_UNCITED` resolves living-tier paths against `process.cwd()`; the image contains neither directory | `[V]` |
| **D469** 🐞 | `release.yml` builds and pushes the image with no content gate between checkout and build | `[V]` |
| **D470** 🐞 | 20 packs' `provenance.sources` promise data in `provenance.engineValidation`; 0 carry it; the validator forbids it. Plus one dangling citation | `[V]` |
| **D467** 🐞 | `GRADUATION_RULING_SELF_MINTED` is a `git blame` check assigned to a runtime validator with no `.git` in the image | `[row]` |

**D208 was in this batch and I removed it — it is ALREADY-DONE** `[V]`.
`apps/server/src/graduation-report.test.ts` ("gates every published pack strictly and keeps draft
sourcing debt from growing") runs `checkSourcingFile` over **`content/packs` strictly** and ratchets
`content/drafts` failures at `toBeLessThanOrEqual(18)`; `vitest.config.ts` includes
`apps/**/*.test.ts`, so `make verify` → `pnpm test` runs it. Both halves of D208 are covered — the
sweep exists, and it is aimed at the root a published pack **arrives in**, not the one it left. Its
column 3 still reads *"🐞 open, found 2026-08-16"*.

**Verified at the symbol.** `apps/server/src/pack-validation.ts:848-851` is `resolve(file)` /
`existsSync` / `readFileSync`; `runtimeIssue` (`:142-148`) is `severity: "error"`.
`apps/server/Dockerfile:28-31` copies **only** `apps/server/dist`, `apps/web/dist`, `schemas`,
`content` — no `planning/`, no `docs/` — and `.dockerignore` excludes `.git` and `content/drafts`.
I counted the acceptances myself: **43 accepted graduation entries, 40 citing
`planning/exploration/log.md#L1231` and 3 citing `docs/tablebase-grounding.md`**, exactly the two
paths absent from the image. `.github/workflows/release.yml` runs `actions/checkout@v7` then
`docker/build-push-action@v7` with nothing in between.

**Files/symbols**: `apps/server/src/pack-validation.ts` (`GRADUATION_RULING_UNCITED` ~838-857,
`PROVENANCE_EVIDENCE_INLINE` :868), `apps/server/Dockerfile`, `.dockerignore`,
`.github/workflows/release.yml`, `content/drafts/anti-caro-advance-early-c5.json`.

**Riskier than it looks — D468.** The obvious fix (resolve against a repo root) makes the check
*pass vacuously* in the image, which is the same defect with a different sign. The row's own general
form is the thing to honour: *a check whose evidence is excluded by `.dockerignore` is not weaker in
production, it is a DIFFERENT CHECK under an identical code name.* The honest fixes are (a) move the
citation check out of runtime validation into the authoring CLI, or (b) refuse to run it when the
evidence root is absent and say so. Both are one-line, both are decisions.

**NEEDS-RFC in disguise — D467 and half of D470.** D467 is currently owned by
`rfc/graduation-clearance.md` (accepted 2026-08-16, second author round), which already splits it
into two rules. Do not take it standalone. D470's *"where does inline engine evidence go"* half is a
format question; only the wording of the 20 provenance strings and the one dangling citation are
batch-ready.

**Free win inside D470, verified myself**: `/provenance/sources/6` of
`anti-caro-advance-early-c5.json` still cites `bxc5-recoup`; the string occurs twice in the document
and **is not a node id anywhere in it**. One text edit.

---

### BATCH A2 — opponent selection serves the wrong move (6 rows)

**Theme: the reply a learner faces is chosen by an alphabetical filter, an unreadable band, or a
discarded option table.** [[D452]] (now fixed) was this batch's first member; these are its siblings.

| Row | One line | Checked |
|---|---|---|
| **D373** 🐞 | `practical_resistance` truncates to the four **lexicographically-first** preserving moves *before* judging them | `[V]` |
| **D106** 🐞 | `targetElo` is accepted beside `strong_engine`, ignored by the engine, and never recorded | `[V]` |
| **D457** 🐞 | the DTZ census reproduced the comparator on rounded `dtz` while runtime uses `preciseDtz`; instrument fixed, **result still open** | `[row]` |
| **D375** 💡 | `PRACTICAL_RESISTANCE_UNDECIDABLE`'s firing frequency is unmeasured — decides whether the mode is real | `[row]` |
| **D195** 🐞 | `score mate` has no `SelectionCandidate` field, so a mate-in-1 and an unscored line are indistinguishable | `[V]` |
| **D339** 🐞 | below ~10 pieces the band is worth ~7 Elo/100 rather than ~40, and no lint warns an endgame author | `[row]` |

**Verified at the symbol.** `apps/server/src/opponent-selector.ts` `#practicalResistance` sorts
`left.uci.localeCompare(right.uci)` then `.slice(0, 4)` — a candidate *filter*, not a tiebreak, so a
better fifth-alphabetical resistance move is never considered. `engine-band.ts:92 policyUsesMaiaBand`
admits `human_common`/`theory_strict`/`practical_resistance` and **not** `strong_engine`, while
`appliedTargetElo:68-72` returns `undefined` unless `eloHonored === true`.
`packages/runtime/src/types.ts:80-88 SelectionCandidate` has no mate field and `candidateLines`
matches only `/\bscore cp (-?\d+)\b/`.

**Files/symbols**: `apps/server/src/opponent-selector.ts` (`#practicalResistance`, `candidateLines`,
`#perfectTablebase`), `apps/server/src/engine-band.ts` (`policyUsesMaiaBand`, `appliedTargetElo`),
`packages/runtime/src/types.ts` (`SelectionCandidate`).

**Riskier than it looks — D373.** Removing the truncation changes shipped opponent behaviour and
invalidates every figure the D371 census produced against the old filter. Take it with a re-run of
the census, not alone. It also raises the per-reply tablebase probe count from 4 to *all*
category-preserving moves, which is a latency change nobody has priced.

**NEEDS-RFC in disguise — D195 and D106.** A `SelectionCandidate` mate field is a versioned run-format
change (the row says so). D106 cannot be fixed by honouring the value — weakened Stockfish is rejected
doctrine — so the fix is a *refusal*, which is a format rule.

---

### BATCH A3 — disclosure holes on live surfaces (5 rows)

**Theme: a route that disagrees with the assistance table is a defect in the route
(`live-marker-quality` L4(b)), and three routes disagree with it right now.**

| Row | One line | Checked |
|---|---|---|
| **D448** 🐞 | `RunService.evidence` serves rung-3 Stockfish to **any granted reader** on a disclosed run with no role check | `[V]` |
| **D259** 🐞 | `/reasoning-review` calls the external voice provider **directly**, with no `voiceCheck` in front of it | `[V]` |
| **D92** 🐞 | `listLiveSessions` is a ninth `run_grants` reader, off the `requireRead` path, projecting a live board | `[V]` |
| **D232** 💡 | nothing pins that a *new* `evidencePacket` construction site arrives with its disclosure gate | `[row]` |
| **D214** 🐞 | `rest.ts` already splices derived sentences into `packet.sentences` — the `voiceCheck` allowlist — at two sites | `[row]` |

**Verified at the symbol.** `apps/server/src/service.ts:1419 evidence()` does `requireRead` +
`feedbackDeliveryOpen(run)` and **nothing else** — no `runRole`, no `permittedAssistance` — while
`/human-split` refuses the same principal on the same run. `voiceCheck` is exported at
`packages/runtime/src/voice.ts:109` and its **only** production caller is
`apps/server/src/guidance.ts:63` inside `renderVoice`; `rest.ts:1222` calls
`voiceProvider.render(packet, voicePersona, prompt, "reasoning")` directly while the three sibling
arms at :1251/:1260/:1273 go through `renderVoice`. `storage.ts:1824 listLiveSessions` joins
`run_grants` with no role involvement, and **there is no expiry column on `run_grants` at all**
(`storage.ts:3024-3031`), so D92's *"unfiltered expired grant"* framing is wrong in a way that makes
it worse, not better: grants are permanent until the row is deleted.

**Files/symbols**: `apps/server/src/service.ts` (`evidence` :1419), `apps/server/src/rest.ts`
(:1217-1222, :1178, :1191), `apps/server/src/storage.ts` (`listLiveSessions` :1824, `run_grants` DDL
:3024), `apps/server/src/guidance.ts` (`renderVoice` :63), `packages/runtime/src/voice.ts`.

**Riskier than it looks — D448.** `rfc/teacher-surface.md` §5.2 *deliberately does not take it*
because the surface belongs to an RFC that is mid-implementation on it. Fixing the route narrows an
existing permission and will redden live-session tests that currently assume a spectator can read
evidence. Coordinate with `teacher-surface`, or take D259 and D232 first.

**Owned elsewhere, do not take**: **D92** and **D93** both read `🔨 owned by rfc/teacher-surface.md`
in column 3, and that RFC is accepted. D93's tables (`classrooms`, `assignments`,
`assignment_submissions`) **do not exist in the schema yet** `[V]` — it is a hazard filed in advance,
not a live defect.

---

## 3. Priority tier B — shipped-code defects, no surface change

### BATCH B1 — claim binding and the evidence maps (7 rows)

**Theme: one file, `apps/server/src/sourcing/claim-binding.ts`, plus its three private copies. Every
row here is a wrong predicate over authored prose, and one of them is live in the corpus today.**

| Row | One line | Checked |
|---|---|---|
| **D417** 🐞 | `RATE_TOKEN` is decimal-only, so `"91%"` routes as authored judgement while `"90.9%"` is refused | `[V]` |
| **D445** 🐞 | `authorSegments` locates spans with `indexOf`, so a repeated sentence is measured against the wrong window | `[V]` |
| **D430** 🐞 | `explorer_frequency` is declared, mapped, and unreachable — `evaluate` resolves every `explorer.*@v1` through `explorer_position_census` unconditionally; the map is **triplicated and module-private** | `[V]` |
| **D431** 🐞 | a claim carrying `derived_feature` **alone** gets no `claimBackings` entry at all | `[V]` |
| **D444** 🐞 | `expression-census`'s `backedClaims` double-counts `(pack, evidenceType)` and never calls `validateClaimBindings` | `[V]` |
| **D432** 🐞 | `RECORDED_READING_DISPOSITIONS` freezes a corpus **fact** as a runtime disposition; the completeness assertion cannot catch the rot | `[V]` |
| **D428** 🐞 | authoring-issue codes are bare `string`, so no census can enumerate them (`PackIssueCode` union) | `[V]` |

**Verified at the symbol.** `claim-binding.ts:167` is
`const RATE_TOKEN = /(?:[+-]?\d+\.\d+%?)/;` and `:207` is the `CLAIM_READING_UNATTRIBUTED` push;
`:204` is `const start = claim.text.indexOf(segment)`; `:93` is
`uniqueRecord(ledger.records, "explorer_position_census", target)` used as the sole resolver for all
five `explorer.*@v1` kinds, against `:168 MACHINE_LABELS` offering two; the same map is re-declared
at `sourcing/check.ts:199` and `expression-census.ts:47-49`. `pack-registry.ts:278-279` writes an
entry only on `binding !== undefined` or on `author_principle` without a machine label.
`expression-census.ts:104` computes `backedClaims` from raw `ledger.claimBindings` and
`validateClaimBindings` is imported by `pack-registry.ts:270` and `sourcing/check.ts:198` only.
`position-evidence.ts:24-31` refuses `explorer_position_census` for *"No loadable pack producer emits
this position-census record kind"* — a measurement, not a decision, and it **expires the moment
CONTENT-7a's explorer wave runs**. `pack-validation.ts:142/:150` take a bare `string` code.

**Files/symbols**: `apps/server/src/sourcing/claim-binding.ts`, `apps/server/src/sourcing/check.ts`,
`apps/server/src/expression-census.ts`, `apps/server/src/pack-registry.ts`,
`apps/server/src/position-evidence.ts`, `apps/server/src/pack-validation.ts`.

**Riskier than it looks — D417.** Widening `RATE_TOKEN` to integers newly refuses live authored
prose. `anti-scandinavian-white/just-take-it` carries `74%` today. Expect the fix to redden packs,
and land it with the corpus edits or behind the same wave.

**Riskier than it looks — D432.** Do not fix this before the explorer wave; fix it *with* it. Its
whole point is that the disposition is a statement about the corpus that flips when 7a runs.

**NEEDS-RFC in disguise — the removal half of D430.** Exporting the map is trivial and batch-ready.
*Deleting `explorer_frequency` from `EVIDENCE_KINDS`* is a schema vocabulary change and belongs to
`rfc/dead-vocabulary.md`.

---

### BATCH B2 — runtime and storage invariants (6 rows)

**Theme: keys and orderings that are true by accident. None changes a surface; each is one assertion
or one consolidation.**

| Row | One line | Checked |
|---|---|---|
| **D219** 🐞 | the migration loop `continue`s past any version ≤ current, so a later-landing lower number is skipped **forever, silently** | `[V]` |
| **D229/D258** 🐞💡 | the five-member `AssessmentCategory` union is declared **three** times | `[V]` |
| **D224** 🐞 | `transposeKey` collides inside one ledger, so any scalar `Map` over a ledger drops a record | `[V]` |
| **D213** 🐞 | one of the three adjacency invariants is **not in `projectRun` at all** — it lives on the read-back path | `[V]` |
| **D215** 🐞 | `Cursor.branchId` is history-dependent, so branch-keyed persistence is conditionally invisible | `[V]` |
| **D247/D217** 🐞 | `combinedRun` regenerates every id; only the root-relative UCI path survives the pack-export boundary | `[V]` |

**Verified at the symbol.** `storage.ts:2350` is
`for (const migration of migrations) { if (migration.version <= version) continue; … }` and the only
guard is the `version > STORAGE_VERSION` check at `:2227`; **`STORAGE_VERSION = 23`**
(`storage.ts:407`), and the only coupling to the array is a test expectation
(`live-session.test.ts:29`). The three `AssessmentCategory` declarations are
`packages/schema/src/drill-pack/types.ts:67`, `packages/runtime/src/branch-scale.ts:8`, and
`apps/server/src/tablebase.ts:7`. `content/drafts/lucena-bridge-convert.evidence.json` holds
`8/1P2k3/2K5/8/3R4/8/8/1r6 b - -` twice at halfmove clocks 9 and 13. `events.ts:329-333` and
`events.ts:59` enforce two adjacency rules; the opponent-selection rule lives in
`replay.ts:81-86 opponentMovesFromEvents`, so an opponent commit with no preceding selection
**projects fine and only fails on replay** — which is a sharper statement than D213's own.
`runtime.ts:398-400` is verbatim as the row states. `pack-pgn.ts:206/:223`: `combinedRun` calls
`createRun({id: \`${source.id}:combined-pgn\`})` and the final `exportPgn` is passed `undefined` for
`branchIds`.

**Files/symbols**: `apps/server/src/storage.ts`, `packages/runtime/src/{events,replay,runtime,pack-pgn,branch-scale}.ts`,
`packages/schema/src/drill-pack/types.ts`, `apps/server/src/tablebase.ts`.

**Batch-ready subset is small and should be taken as such**: D219 is one assertion
(`migrations.map(m => m.version)` equals `1..STORAGE_VERSION`); D229/D258 is one import change;
D213 is one test asserting the three gaps stay empty. **D215, D217, D247 and D224 are standing rules
with no defect to fix today** — see RECORD-ONLY in §9. Do not let an implementer "fix" them.

---

### BATCH B3 — corpus denominators and the fixture contamination (4 rows)

**Theme: every corpus figure this repo quotes is computed by no code, and six test fixtures are
inside the denominator.** This is the batch with the widest downstream effect for the least work,
and it is also CONTENT-7a's biggest single item.

| Row | One line | Checked |
|---|---|---|
| **D227** 🐞 | `content/drafts/` holds **56** pack documents and `loadDefault` indexes all 56, six of which are browser fixtures | `[V]` |
| **D257** 🐞 | *"47 authored packs"* is an **editorial** exclusion performed by nothing in the tree, so no test can pin it | `[V]` |
| **D262** 🐞 | three different "position counts" (per-pack summed / corpus-wide / frontier) get quoted under each other's labels | `[row]` |
| **D211** 🐞 | files hardcoding `content/drafts/<pack>.json` — **now 2, was 16**; `resolvePackPath(id)` shipped | `[V]` — see §6 |

**Verified myself, and the ledger's numbers have all moved.** `content/drafts/` at `f10b20f`:
**56 pack documents** (50 authored + 6 `*.browser.json`), 32 `.evidence.json`, 32 `.sources.json`,
32 `.job.json`. `pack-registry.ts:160-176 jsonFiles` filters on
`extname === ".json" && !isSidecarName(name)` and `isSidecarName` (:182) knows only
`evidence`/`sources`/`job`/`priority` — `.browser.json` is not among them, so all six index as
ordinary packs. Three *other* call sites exclude them explicitly (`expression-census.ts:279`,
`planning/pack-vocabulary-audit/audit.ts:28`, `tools/d333-band-outcome-harness/build-book.ts:47`) —
**the inconsistency, not the inclusion, is the defect.**

**Files/symbols**: `apps/server/src/pack-registry.ts` (`jsonFiles`, `isSidecarName`, `loadDefault`),
`content/drafts/*.browser.json` (6 files), `tests/browser/`, plus the three ad-hoc exclusion sites.

**Riskier than it looks — D227.** Moving the fixtures is a two-line change and a `git mv`, but every
browser test resolves them by path and `graduation-clearance` **explicitly does not fix this**, so
whoever takes it inherits an unowned seam. The cheaper first half is to **export the exclusion as a
shared predicate** so prose and tests agree, which closes D257 outright and leaves the move for later.

---

### BATCH B4 — the gate on the gate (8 rows)

**Theme: `make verify` and the RFC/ledger registers. Every row here is a missing check, and each
check is small. This batch has no runtime risk at all — it is the cheapest batch in the document.**

| Row | One line | Checked |
|---|---|---|
| **D474** 🐞 | `vitest.config.ts` sets **no `testTimeout`**, so `expression-census.test.ts` (18 tests) flakes under parallel load | `[V]` |
| **D477** 🐞 | no status-parity check between an RFC's body and `rfc/README.md` — it has blocked an implementer **five times** | `[V]` |
| **D459** 🐞 | the defect table's own header reads `| Block | Issued to | Status |` and column 3 is not a status | `[V]` |
| **D419** 🐞 | the disposition column has been read as a status by three readers in two days, producing two false records | `[V]` |
| **D446** 🐞 | `q8.test.ts:296` `writeFileSync`s into the repo, so re-verifying the RFC dirties the working tree | `[V]` |
| **D416** 🐞 | closeout commits do not name the rows they flip, so a flip in the other lane is untraceable | `[row]` |
| **D418** 🐞 | `pack-graduation` shipped with **zero** ledger flips and nothing audited it | `[row]` |
| **D402** 🐞 | an RFC that corrects a ledger row inside its own §9 does not correct the ledger | `[row]` |

**Verified at the symbol.** `vitest.config.ts` has no `testTimeout` key (only `vitest.maia.config.ts`
sets one, at 120 s); `apps/server/src/expression-census.test.ts` declares 18 tests. **Nothing in
`apps/`, `packages/` or `tools/` reads `rfc/README.md`** — there is no parity check of any kind.
`design/BACKLOG.md`'s header is still `| Block | Issued to | Status |` at the head of the defect
table. `tools/q8-feedback-surface-harness/q8-output.md` exists and
`tools/q8-feedback-surface-harness/q8.test.ts:23,296` writes to it.

**Files/symbols**: `vitest.config.ts`, `tools/q8-feedback-surface-harness/q8.test.ts`,
`design/BACKLOG.md` (header line only), plus a new `tools/` parity script wired into `make verify`.

**Note on authority**: D459 and D419 are edits to `design/BACKLOG.md`, which `CLAUDE.md` states
explicitly **is a shared ledger every tier writes to**, not an intent doc. Both are batch-ready.
D416/D418/D402 are process rows — they need a **convention**, and D416 already proposes the cheap
form (*name the rows in the commit subject*). I have routed them here rather than to NEEDS-RFC
because the guard is a lint, not a rule change; if the implementer disagrees, they are NEEDS-RFC.

---

### BATCH B5 — client surfaces wired one way (8 rows)

**Theme: a server verb with no client byte, or a client control with no handler. Each is small; none
changes a contract.**

| Row | One line | Checked |
|---|---|---|
| **D311(a)** 🐞 | `<button aria-label="Open assistance">♟</button>` at `DrillScreen.svelte:764` has `title` and **no `onclick`** | `[V]` |
| **D311(c)** 🐞 | `loadAssistance` is called once, in the single `onMount` (`:690/:694`) — a `/settings` change mid-run does not apply | `[V]` |
| **D311(d)** 🐞 | `boardLighting: "sight"` and `"evidence"` render identically (`:346`, `:882-883`); only the caption at `:900` differs | `[V]` |
| **D313** 🐞 | `service.simulate` + `enterSimulation` are routed and documented; `grep -rn -- "/simulate" apps/web/src` → **0**, and the RFC's own named acceptance test was never written | `[V]` |
| **D314(a)** 🐞 | `api.duplicateRun` (`api.ts:631/:821`) has **zero** callers; there is no client method for `schedule` at all | `[V]` |
| **D315(a)** 🐞 | `castVote`/`resolveProposal`/`updateGrants` have zero Svelte callers, `closeVote` has no client method, `rotation` always 400s, spectator links are unreachable | `[V]` |
| **D316** 🐞 | `shapeRecommendations.packIds[0]` is interpolated into a label and then discarded (`App.svelte:672`); `chooseRepertoireAnswer` has zero callers | `[V]` |
| **D312(c)** 🐞 | rung 2 on request is reachable only through `GroupPanel.svelte:123`, rendered only when `activeGroup !== undefined` | `[V]` |

**Files/symbols**: `apps/web/src/lib/DrillScreen.svelte`, `apps/web/src/App.svelte`,
`apps/web/src/lib/api.ts`, `apps/web/src/lib/GroupPanel.svelte`,
`apps/web/src/lib/session-controller.ts`, `apps/web/src/lib/PackList.svelte`.

**Riskier than it looks — D315(a).** `rotation` is offered in the picker (`App.svelte:802`) and the
server accepts `rotationHandles` (`rest.ts:1036/:1041`); wiring it makes a board-control mode
*reachable for the first time*, which is a live-session behaviour change, not a client fix. Split it:
removing the unreachable option from the picker is batch-ready; implementing it is not.

**NEEDS-RFC in disguise — D313.** `/simulate` refuses in Just Play with a stated reason
(`service.ts:1246 NO_AUTHORED_VARIATIONS`); the Drills and Live absence has *no stated reason*, and
deciding where a simulation entry point belongs is an IA question against `design/03`. What **is**
batch-ready is the missing acceptance test `rfc/archive/n-way-comparison.md:1383-1395` names and
nobody wrote.

---

### BATCH B6 — the assistance ladder's dead ends (5 rows)

**Theme: `design/05`'s assistance model has three declared inputs nothing reads, and three
capabilities behind an unrelated detector.** This batch is **half NEEDS-RFC and I am flagging it
rather than hiding it**, because the code half is trivially takeable and the design half is not.

| Row | Route | One line | Checked |
|---|---|---|---|
| **D307** 🐞 | **NEEDS-RFC** | `permittedAssistance` takes `sessionKind` (`assistance.ts:22`) and **never reads it** (`:28`) — there is no lever to make Just Play more permissive | `[V]` |
| **D308** 🐞 | **NEEDS-RFC** | `api.reveal` has exactly two call sites, neither in `DrillScreen.svelte`; Just Play cannot open disclosure mid-run | `[V]` |
| **D309** 🐞 | **NEEDS-RFC** | the shape library renders live in **every** mode with no gate, while `assistance.guided` gates a strictly smaller duplicate | `[V]` |
| **D310** 🐞 | **BATCH-READY** | `renderEndgameReading` has exactly one client call site, inside the pivotal modal (`DrillScreen.svelte:1087`) | `[V]` |
| **D84** 🐞 | **RECORD-ONLY** | `arrows` is typed, defaulted, permissioned, persisted, settable — and read by no renderer; formally `unmeasured` at `dispositions.ts:64-68` | `[V]` |

**Honest note.** D307, D308 and D309 all carry `DESIGN-GAP:` and are owner-tier by their own text.
They are in this list only so nobody batches them with D310 by accident. **D310 alone is takeable**:
moving `renderEndgameReading` out from behind `openPivotalNodeId` is a re-siting with no contract
change, and it is the only reason B10 (*"endgame steering names a technique"*) is unreachable in an
endgame where the forward detectors never fire.

**My spot-check contradicts D311(b) and it should be corrected, not batched.**
`AssistanceSettings.svelte:42-50` exposes **all nine** axes, and `DrillScreen.svelte:768-781` exposes
six. **The overlap is six, not three, and there are no in-run-only axes** —
`humanSplit`/`corpus`/`voice` are in both. Settings-only is `boardLighting`/`arrows`/`ambient`, which
is the half the row got right. The row is overstated; the asymmetry is real but one-directional.

---

### BATCH B8 — the graduation-emitter residue (6 rows the "closed" disposition hides)

**Theme: `db243f5` wrote `✅ closed by pack-graduation 0.27` into nineteen dispositions. I checked
all nineteen; these six are not closed.** They are small, they are in one place, and nobody is going
to find them again because the row *says* it is done.

| Row | State | One line | Checked |
|---|---|---|---|
| **D207** 🐞 | **NOT FIXED** | `EVIDENCE_TYPE_UNBACKED` is raised inside `evidenceSupports` (`check.ts:208`), reached only under `if (pack && ledger)` (`:379`, `:439`) — so the 18 ledger-less drafts still die on `EVIDENCE_READ_ERROR` first and their machine labels are never counted. Nothing anywhere reports the masked half | `[V]` |
| **D239** 🐞 | **NOT FIXED** | `apps/server/src/distill.ts` emits `graduationBlockers` at `:83` and imports nothing from `pack-validation`; the other three emitters all raise `EMITTED_PACK_INVALID` (`openings.ts:119`, `syzygy.ts:190`, `position-seeds.ts:252`) | `[V]` |
| **D240** 🐞 | **half** | ids are now stable literals rather than text-derived, but there is **no checked-in template registry** — `mechanical-objective-placeholder` is a duplicated bare literal across three emitters | `[V]` |
| **D210** 🐞 | **half** | all 293 draft entries are typed objects with `state`, but the ALLCAPS tokens still live as prose inside `statement` (15 `ENGINE-CHECKED`, 3 `CORPUS-CHECKED`, 4 `UNGROUNDED`, 1 `STILL UNTESTED`), and `$defs.graduationEntry` has no field for check state | `[V]` |
| **D209** 🐞 | **half** | the re-stamp **is** a stated landing-order obligation, but `EVIDENCE_DIGEST_STALE` is `severity: "warning"` so `valid` ignores it and no test pins 0. **0 of 32 draft ledgers are stale; 26 of 36 `content/candidates/*/evidence.json` are** | `[V]` |
| **D203/D204** 🐞 | **half** | content is fully migrated (**436 typed / 0 bare strings**) and all four emitters are typed, but `drill_pack.schema.json:1152-1160` still types the array `oneOf [graduationEntry, nonEmptyString]` and `types.ts:230` is `(GraduationEntry \| string)[]` | `[V]` |

**Files/symbols**: `apps/server/src/distill.ts` (:83), `apps/server/src/sourcing/check.ts`
(`evidenceSupports` :208, the `pack && ledger` fences :379/:439), `apps/server/src/sourcing/`
`{openings,syzygy,position-seeds}.ts`, `schemas/drill_pack.schema.json` (`$defs.graduationEntry`
:1100-1130, the array type :1152-1160), `packages/schema/src/drill-pack/types.ts:230`.

**Batch-ready members: D207 and D239 only.** D239 is four lines copied from a sibling emitter. D207
needs the label check to run when the sidecar is missing, which is a re-ordering inside
`checkSourcingFile` and no contract change.

**NEEDS-RFC in disguise — D210, D240, D203/D204.** All three want a **new field or a new registry**
on `$defs.graduationEntry` (a check-state field; a template id; closing the legacy union). That is a
pack-schema lane, and 0.28 is claimed by `graduation-clearance`.

**Riskier than it looks — D209's candidate half.** 26 of 36 candidate ledgers are digest-stale. Do
**not** bulk re-stamp them: [[D269]]'s discipline was that a re-stamp erases a signal it did not
create, and [[D263]] shows the number moving 43% within hours. Re-stamping is CONTENT-7a job 5, and
it needs `make graduation-clear` ([[D466]]) to exist first.

---

### BATCH B7 — prose-guard descriptions (5 rows, and it is NOT a code batch)

**Theme: `voiceCheck` guarantees tokens and five documents describe it as guaranteeing propositions.
I am naming this a batch so an implementer does not mistake it for one.**

- **D226** 🐞 — `voiceCheck`'s admission is `source.toLowerCase().includes(token)`, not a
  `\b`-anchored match, and *absence is speakable*: `valid: true` for *"No reading was recorded at this
  position."* against a packet that says only *"This pack declares: opening."* `[row, re-executed by
  the cross-review]`
- **D234** 🐞 — the same, re-executed at HEAD and worse: an invented recorded-reading sentence in
  `renderRecordedReading`'s exact frozen format also passes `[row]`
- **D146** 🐞 — token membership cannot refuse a *join* of two admitted facts `[row]`
- **D266** 🐞 — the general form: an instrument's description must name what it inspects `[row]`
- **D260** 🐞 — constraining the persona prompt is worthless when the payload carries the vocabulary `[row]`

**The only mechanical member is the word-boundary fix in `packages/runtime/src/voice.ts`.**
Everything else is a convention. Routing all five to a code batch would produce a change that looks
like a fix and closes nothing — which is the exact shape [[D446]] and [[D368]] describe one tier up.

---

## 4. NEEDS-RFC (47)

Changes a surface, a schema, a migration position, or a normative rule.

**Format / schema**: D103 (shape-entry `triggerNote` vs `additionalProperties: false`), D123
(`timingWindows[].note` 400-char cap), D124 (machine-readable band block), D127 (shape layer authors
a signature the pack layer refuses), D148 (`$defs/deviationCost` has no corpus basis), D153 (the cap
blocks the D126 ruling, measured), D157 (a check for a pack quoting no population), D171 (the eighth
`evidenceTypes` member `provenance_note`), D268 (no bibliographic `EVIDENCE_KINDS` member), D329
(no `sourceGame` provenance axis), D348 (`shape_trigger` expression leaf), D368/D386/D391/D392
(measurement records — owned by `rfc/measurement-records.md`), D399 (no principle- or threat-shaped
`OBJECTIVE_TYPES` member), D404/D405/D407/D408/D425/D426/D427/D434/D435/D436/D464/D465/D466/D467
(all owned by `rfc/graduation-clearance.md`), D470-format-half, D195, D106-refusal-half, D430-removal-half.

**Runtime / API**: D183 (adding a `DrillRunEvent` member), D216 (a token `Principal` variant), D233
(a server-owned selection receipt — the row says so explicitly: *"requires an RFC/API lane"*), D313
(where a simulation entry point lives), D307/D308/D309 (the assistance ladder), D361 (`clockState`:
delete the field or give it a closed shape — the row says *"in the same commit that gives it a
reader"*, which is a format decision), D376 (shape-entry schema has no register), D385 (a
register-only lane), D423/D384/D447/D449/D450/D460 (register-shaped gaps around `permittedAssistance`
and migration positions), D428-union-half, D475/D476 (the RFC lifecycle cannot express a
content-dependent completion, and an archived RFC can leave a wave ownerless), D478 (a scripted-edit
discipline — a rule for `rfc/0000-rfc-process.md`, not code).

**Verified as still live**: `clockState` has exactly six non-test references
(`packages/runtime/src/types.ts:124`, `runtime.ts:57`, `:341`, `apps/web/src/lib/api.ts:486`,
`apps/server/src/rest.ts:524-530`, `:1395-1397`), **zero `.svelte` senders and zero readers** `[V]`,
and its schema definition is `additionalProperties: true` — so the run log accepts an arbitrary
untyped object per node from any client today.

---

## 5. NEEDS-OWNER (22) and NEEDS-RESEARCH (19)

**NEEDS-OWNER** — a product decision: D113 (hint distance), D126-successors, D144 (cross-pack ledger
resolution), D155 (name the game-level corpus as an instrument class), D162/D138 (the
`content/drafts`→`content/packs` bridge — *"owner-gated"* in its own column 3), D305 (what the
campaign's progression is denominated in), D327/D328 (variants; westernised xiangqi/shogi), D330/D331/
D355/D357/D362/D363/D364 (the clock cluster — D364 is explicitly *"owner ruling requested"*), D334,
D337, D352 (structure-keyed authored territory), D354 (re-banding 37 packs' `targetElo`), D369
(should an endgame pack declare a band at all), D437/D439/D462/D463 (already-landed rulings whose
*consequences* are unwritten — D439 names **six changes owed to `design/06-campaign.md`** and law 5
forbids an implementer writing them).

**NEEDS-RESEARCH** — the answer is unknown: D375, D377, D378, D380, D388, D389, D390, D403, D411,
D414, D420, D422, D424, D438, D442, D443, D451, D456-successor, D474-successor. Several are
*measurement* rows the harnesses could answer cheaply (D375's refusal frequency, D390's three missing
ladder rungs, D414's one broadcast round-trip through `pgn-import.ts` — the row itself prices it at
~20 lines under `tools/`).

---

## 6. ALREADY-DONE — 40 to close, 19 to rewrite (the highest-value finding)

### 6a. Verified shipped at the symbol — close these (29)

| Row | Evidence at `f10b20f` |
|---|---|
| **D33** | `ledger-validation.ts:427 assessmentGrounding` is mode-agnostic; `trajectory-mate-bishop-knight` carries a syzygy root assessment and its own sidecars (53 records); `validator-integrity.test.ts:255` pins `ledger_verified` |
| **D37** | `pack-validation.ts:415 objectiveIssues` exists, invoked for the root (`:1192`) and every leg (`:1194`) |
| **D38** | both trajectory packs carry a finite pack-level `authoredBoundary` (12 ids / `plyHorizon: 12`; 8 ids / `plyHorizon: 8`) plus a `past-the-book` boundary checkpoint |
| **D39** | `pack-validation.ts:507-509 MATERIAL_EQUALITY_UNSATISFIABLE` |
| **D40** | `pack-validation.ts:510-512 RULES_FACT_WINNER_UNSUPPORTED` |
| **D63** | `apps/web/src/lib/compare-geometry.ts` `ComparisonZoomBand` + `COMPARISON_CELL_FLOOR_REM {far:5, mid:9, near:15}`; `CompareView.svelte:68-77`; no 240 px floor remains |
| **D107** | `session-controller.ts:137/:267/:524` throw `POLICY_MODE_UNSUPPORTED`; `service.ts:996` the same in `groupReply` |
| **D108** | `service.ts:237 sameEngine` compares `left.eloApplied === right.eloApplied` |
| **D109** | `session-controller.ts:534` and `service.ts:1890` / `rest.ts:1155` all use `run.sessionDigest` |
| **D117** | `capabilities.ts:323` filters `SUPPORTED_POLICY_MODES` by provider state per mode |
| **D121** | `shape-check.ts:38 formatProbeResult` returns `PROBE FIRES` / `PROBE DOES NOT FIRE`, printed at `:64` |
| **D140** | `rest.ts:1217 requireGuidanceDisclosure(service.guidanceAccess(...))` on the line before `evidencePacket` at `:1218` |
| **D149** | `explorer.ts:26 ExplorerQuery.moves`, `:54` defaults 12 and refuses non-safe-integers; depth recorded in URL (`:74`), artifact (`:201`), job digest (`:205-206`) |
| **D152** | `expression-census.ts:93 evidenceCensus` — rung mapping, per-claim counts, pointer-matched backing, `populationOf`; embedded at `:330` |
| **D194** | `feedback-policy.ts:24 publicSelectionEvent` rebuilds candidates by enumeration, dropping `scoreCp`/`wdl`; applied at `publicEvents:92`, `publicRunSnapshot:50`, `publicMutationPayload:54` |
| **D196** | `evidence-queue.ts:52 EvidenceJobFailure.kind`, populated `:295`; `service.ts:1690` filters failures to `eval` |
| **D205** | schema requires `["kind","ruling","rulingRef"]` (`drill_pack.schema.json:1114-1120`); `pack-validation.ts:838-857` enforces resolution |
| **D269** | **found by spot-check, nobody claimed it.** All five named packs — `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`, `philidor-passive-rook-convert`, `trajectory-mate-bishop-knight` — now return *"Sourcing check passed (strict)"*. **0 `EVIDENCE_DIGEST_STALE` across all 56 documents.** D263's staleness figure is likewise discharged |
| **D472** | **found by spot-check.** `grep -c '0.28 remains free\|0.28 stays free' rfc/README.md` → **0**. Rows :12, :13, :77 and :78 all now read 0.28 as claimed and held, with 0.29 as the next free lane |
| **D71** | **found by spot-check, and column 3 still says `🔨 owned by engine-request-contract` — an archived RFC.** `replay.ts:136-144` now keys on `eloHonored ?? false` **and** `eloApplied ?? null`, and `outcome-presentation.ts:74-82 engineName` renders `, band ${eloApplied}` / `, band not recorded`. Residual: `engineIdentityKey:84-93` still omits both fields, but that string drives only the *"more than one engine configuration"* sentence |
| **D53** (half) | **found by spot-check.** `queensOff` is now rendered at `pivotal.ts:116` (*"The queens have left the board."*). The 8/3/3 free parameters at `:61` and the ×4 promotion weight at `:24` are still open |
| **D52** (mostly) | **found by spot-check.** `phase_change` is measured (`feedback-versus-the-dashboard.md:297`, 1/634 = 0.2%) and `option_collapse` at `:303`; the L6 pinned register exists at `rfc/live-marker-quality.md:628-632`. Only `human_divergence` is unmeasured, and `:308` records *why* it is out of that instrument's domain |
| **D206** | `graduation-report.test.ts:70-77` runs `checkSourcingFile` (strict) over every non-browser draft and joins the failing set into the assertion message. **The number moved: 18 of 50 fail, against the row's 15 of 47** — all 18 lack both sidecars |
| **D208** | `graduation-report.test.ts` gates **`content/packs` strictly** inside `make verify`, and ratchets `content/drafts`; both halves of the row are covered. Column 3 still reads *"🐞 open"* |
| **D211** | **16 files → 2** hardcoding `content/drafts/<pack>.json` (`evidence-at-runtime.test.ts`, `guidance.test.ts`); `resolvePackPath` (`packages/schema/src/pack-path/index.ts:4`) is imported by ~20 files including all four the row named |
| **D237** | the strict `content/packs` sweep exists and runs in `make verify` — vacuously today, which is exactly the row's argument for building it now |
| **D238** | the ratchet is checked in: `graduation-report.test.ts:76` `expect(failing.length).toBeLessThanOrEqual(18)`. **N is 18, not the 15 the row asserts** |
| **D241** | `pack-validation.ts:842-844` narrows the grammar to `path` or `path#L<line>`, and `:853` restricts the `#L` form to `planning/exploration/log.md` — the append-only file, exactly as the row's rule requires |
| **D242** | `pack-validation.ts:849-857` checks path existence, line existence for `#L`, and date containment for `owner_ruling` — payability preserved |
| **D243** | `graduation-report.ts:42` emits one `## <root>` section per root with no merged total; `graduation-report.test.ts:26` pins it with `expect(report.text).not.toMatch(/corpus-wide.*blocking/iu)` |
| **D244** | `packages/schema/src/drill-pack.test.ts:216-219` enumerates all 36 `content/candidates/*/pack.json` into the closed-policy sweep, and `graduation-report.ts:25` excludes them from `graduable` via `root !== "content/candidates"` |

### 6b. Column 3 records a closure I did not re-verify — close after a glance (11)

These carry an explicit `✅ closed 2026-08-16 by …` disposition and I did **not** open the file.
`D44`, `D55`, `D75`, `D76`, `D126`, `D161`, and the five client-honesty rows `D393`, `D394`, `D396`,
`D397`, `D398` (commit `3e6fe2e`).

**Do not extend this trust to the `pack-graduation 0.27` block.** I checked all nineteen of those and
**two are not fixed** ([[D207]], [[D239]] — BATCH B8) and **four are half-fixed** (D203/D204, D209,
D210, D240). A disposition claiming closure is a claim about the past exactly like the row itself
([[D419]] in the mirror), and this is the measured hit rate: **13 of 19 shipped, 4 partial, 2 not
started.**

### 6c. Partially done — rewrite the title to the residue; do NOT close (19)

`D52` (`phase_change` and `option_collapse` are now measured — `feedback-versus-the-dashboard.md:297`
gives 1/634 = 0.2% — and the L6 pinned register exists at `rfc/live-marker-quality.md:628-632`; only
`human_divergence` is unmeasured, and `:308` records why) · `D53` (`queensOff` **is** rendered now,
`pivotal.ts:116`; the 8/3/3 free parameters at `:61` and the ×4 promotion weight at `:24` remain) ·
`D65` (the option table **is** parsed at `engine-supervisor.ts:95-127` and consumed by
`appliedTargetElo`; `parseIdentity:199-202` still derives `eloHonored`/`seedHonored` from presence
alone) · `D96` (`deviation.planClassId` remains) · `D135` (fence closed, relabel pressure unchanged) ·
`D158` (learner + attributed-human marks shipped; system-drawn directed marks open) · `D167` (the
projection landed in the wrong RFC; the rendering half did not) · `D171` (registry landed; the eighth
enum member did not) · `D188` (still `requireRead`-gated, but a per-principal **marks** filter now
exists at `service.ts:1514` with a `TabiyaMarks: own (N)` header) · `D195` (bound lines no longer
become exact measurements; `score mate` still has no `SelectionCandidate` field) · `D203`, `D204`,
`D209`, `D210`, `D212` (the three misattributions are corrected in
`rfc/archive/pack-graduation.md:298/:720-723/:1453-1455`, but `design/research/README.md` "House
rules" :39-55 still defines only `[V]`/`[P]`/`[M]` with **no convention separating a scripted figure
from a recalled name** — which is what the row actually asked for), `D240` · `D312` (a/b closed, c
open) · `D315` (b closed, a open) · `D400` (answered) · `D446` (the harness re-runs clean; the
committed artefact and the tree-writing `writeFileSync` remain).

**Route: rewrite the row's title to name only the residue**, the way D96 already does. Half of these
read as open defects and are standing constraints.

---

## 7. CONTENT — the split the owner asked for

### 7a. MECHANICAL CORPUS WORK — 27 rows, five jobs, no chess judgement (this is the number)

**Measured at `f10b20f`, by me, not read off a row.** The corpus is **56 pack documents**
(50 authored + 6 fixtures), **32 evidence ledgers**, **764 records** = **391 `engine_eval` /
341 `tablebase_result` / 32 `position_legality` / 0 explorer of either kind**, **196 claims across
50 packs** labelled `author_principle` 82 / `corpus_observed` **60** / `derived_feature` 43 /
`tablebase_exact` 37 / `hypothesis` 24 / `engine_validated` 8. `make graduation-report` reads
**documents 56, blocking 220, resolved 30, accepted 43, graduable (none)**. `checkSourcingFile` over
every document: **32 clean, 24 with an error**, breaking down as `EVIDENCE_TYPE_UNBACKED` 65 (28
packs), `EVIDENCE_READ_ERROR` + `MANIFEST_READ_ERROR` 24 each (the 24 packs with no sidecar, of which
**6 are the browser fixtures — so 18 real authored packs have no ledger**, not the 15 [[D141]] records).

| # | Job | Rows | Size, measured | Instrument that already ships |
|---|---|---|---|---|
| **1** | **Explorer position-census wave** | D231, D147, D128, D141, D157, D124(record half), D350 | **60 `corpus_observed` claims** with **0** backing records. **22** sit in ledgered packs and are directly attachable; **38** sit in 18 ledger-less packs that need a sidecar created first | `apps/server/src/sourcing/explorer.ts:268` emits `explorer_position_census`; `make source-fetch`, `make candidate-attach`, `make verify-draft` |
| **2** | **Tablebase legal-successor census** | D110 (7 full-set census claims), D225, D224 | **288 distinct tablebase anchors / 341 records across 12 packs**; D110 re-derived **0 of 277 choice-bearing positions fully censused**. `CLAIM_CENSUS_INCOMPLETE` needs a record for **every** legal successor | `make tablebase-walk`; `claim-binding.ts:118-121 tablebase.moveCensus@v1` |
| **3** | **Engine pass for the `engine_validated` class** | D267(measured), D409(instrument half) | **8 `engine_validated` claims**; 391 `engine_eval` records already exist, so the pipeline is warm | `make engine-walk`, `verifyEngineDraft` |
| **4** | **Fixture relocation + denominator predicate** | D227, D257, D262, D211 | **6 files** to move; **2** files still hardcode a draft path; **3** ad-hoc exclusion sites to converge | `resolvePackPath`, `jsonFiles`/`isSidecarName` |
| **5** | **Citation, digest and artefact repair** | D470, D446, D359, D368(re-measure half), D276, D274, D406, D209(candidate half) | 20 provenance strings; 1 dangling `bxc5-recoup` citation; 1 stale `q8-output.md`; the nine shape entries and two packs [[D368]] measured stale; **26 of 36 `content/candidates/*/evidence.json` digest-stale**; D276's splice tool | `make expression-census`, `make sourcing-check`, `make graduation-report` |

**Half discharged, and the halves matter.** **Draft `packDigest` re-stamps are done**: I ran
`sourcing-check` over every document and **0 of 32 draft ledgers are digest-stale**, including all
five [[D223]]/[[D269]] named. D263's *"5 packs / 181 machine readings"* and *"3 packs / 104"* are
both historical. **But 26 of 36 candidate ledgers are stale** `[V]` and nobody has said so — that is
job 5's largest single item and it did not exist in any row until this pass.

**Do not bulk re-stamp.** [[D269]]'s own discipline is that a re-stamp erases a signal it did not
create, and the writer for `blocking → resolved` does not exist yet ([[D466]], being added as
`make graduation-clear`).

**Two honest caveats on job 1, and they are why it is job 1 and not a lint.**
`attachExplorerEvidence` throws `ATTACH_SOURCE_LINE_MISSING` unless `provenance.sources` already
carries the explorer rationale ([[D409]]), and [[D427]] measured that the corpus and claim-binding
classes **are the same atomic write counted twice**. So the *record* is mechanical; the *quantified
sentence the record backs* must already exist in the pack. Where it does, this is a script. Where it
does not, it is 7b. I have not tried to split 60 claims by that test — that split is the wave's first
task and it is cheap (grep `provenance.sources` for an explorer rationale per pack).

**Blocked, and say so**: job 5's D406 needs `blocking → resolved` to have a writer, which
[[D466]] says does not exist and `rfc/graduation-clearance.md` is adding as `make graduation-clear`.
Do not hand-edit those four entries.

**Also in 7a but not a job**: D149, D121, D152 shipped the authoring instruments this wave needs —
they are in ALREADY-DONE and the wave should not re-build them. [[D156]] proposes promoting
`split-probe.ts` and `fen-walk.ts` out of disposable status; that is a 7a enabler and worth taking
first, because *"no shipped command answers 'what did the band score here'"* is what makes every
content wave rebuild it.

### 7b. AUTHORED CHESS JUDGEMENT — 23 rows, and law 8 forbids generating it

- **The 63 claims tripping `CLAIM_AUTHOR_LABEL_REQUIRED`** ([[D462]]). Verified mechanically clean —
  `claim-binding.ts:205` fires on any claim with an authored segment and no `author_principle`, and
  the 13 committed `content/principles/*.json` entries all list all three phases so
  `CLAIM_PRINCIPLE_OFF_PHASE` refuses none. **Choosing which principle a claim rests on is a chess
  judgement.** 7b.
- **The authoring-bound pack split** ([[D409]], as corrected by [[D434]]): **50 of 50 blocked,
  27 instrument-bound / 23 authoring-bound**.
- **D110's 7 full-set census claims** — the census itself is 7a; deciding what the pack *says* once
  the numbers arrive is 7b.
- **D111** — five claims needing a self-declared label, a copied record, or a re-label. The record
  copy is mechanical; picking a label is not.
- **D270, D271, D272, D273** — citations that *refute* the objective they were fetched for
  (`berlin-queenless-press`, `french-advance-chain-white`, `carlsbad-minority-attack`'s third plan),
  and one claim with a genuinely empty compatible-source shelf (`pawn-breakthrough-convert`). Each
  needs a re-cut objective or a different source. 7b, and law 6 says the refuting citations get
  escalated rather than quietly dropped.
- **D351** — attack counts in prose were wrong **in both directions**. The count is 7a (run
  `direct_attack_count`); the sentence is 7b.
- **D154/D161** — the D126 illustration's fabricated split. The correction landed; the standing rule
  (*worked examples in ledger and design tier are claims and must carry provenance or be marked
  synthetic*) is 7b doctrine.
- **D79** — verified worse than the row: **209 checkpoints, 0 using `stated_reasoning`, 0
  `reasoningKeyPoint` entries, 0 `{kind:"claim"}` grounds** `[V]`. Authoring, not code.
- **D345/D349/D352/D354** — the act-ramp and band questions. Measurement is done; the authoring and
  the re-band are 7b/NEEDS-OWNER.
- Also 7b: D125 (hanging pawns has no band-attested tabiya), D151, D153-content-half, D157-content-half,
  D272, D399-content-half, D409, D440-content-half.

**Where I could not honestly call it**, I put it in 7b. The three cases: D124's population recording
(the *field* is RFC, the *value* is authored), D368's nine shape entries (re-measuring is 7a, but
four became **materially false** and rewriting a false chess claim is 7b), and D231's 16
already-authored rung-4 claims (the record is 7a; whether each sentence survives [[D126]]'s
*"may be stated, never converted into a verdict"* boundary is a human read).

---

## 8. DUPLICATE / SUPERSEDED (8)

| Row | Superseded by |
|---|---|
| **D183** | **[[D213]]** — which states the invariants correctly and the consequence correctly; D183's *"permanently unloadable"* is wrong for the normal path |
| **D219** (rule half) | **[[D250]]** + `rfc/README.md`'s landing-order rule — a draft claims a *position*, not a number. The **assertion** half survives and is in B2 |
| **D384** | **[[D423]]** then **[[D447]]** — the contest is two-way, not three; `opponent-contracts` landed migration 23 at `6ba0736` and left the ladder |
| **D420** | **[[D442]]** — which found D420's own fix incoherent (minimum over intervals is undefined; corrected to intersection) |
| **D424** | **[[D443]]** — a fourth site, inside the document that recorded D424 |
| **D116/D119/D120** | **[[D139]]** as restated — `42680cf` rewrote D116/D118/D119/D120 and left D139 stating the old map |
| **D311(b)** | **withdraw** — my spot-check found it wrong (see B6) |
| **D400** | answered in place; its verdicts supersede D401 (already retracted) |

---

## 9. RECORD-ONLY (12) — a standing rule with no defect to fix

An implementer should **not** open these. They are doing their job by existing, and "fixing" one
produces a change that closes nothing.

D215 (`Cursor.branchId` is history-dependent — *"nothing is wrong with `rewind`"*, in the row's own
words), D217/D247 (`combinedRun` preserves the UCI path and only the UCI path), D251 (path-shaped ids
price composite keys), D230 (a type-keyed barrier in front of a payload passthrough), D248 (a barrier
criterion must run at the layer the barrier is breached at), D250 (state what a document does not
move), D265 (a two-valued grounding verdict is not an admission gate), D266 (describe what an
instrument inspects), D377 (an evaluator-semantics change moves every reading at once), D429 (a
refusal emitter is not a consumer), D84 (`arrows` is formally `unmeasured` at `dispositions.ts:64-68`,
not broken), **D245** (a proxy quoted to the unit — its corrected figures live only as RFC prose and
there is no script, test or register entry to fix), **D246** (both lane facts have since resolved on
their own: `DRILL_PACK_SCHEMA_VERSION` is `"0.27"` and `planning/work-register.md` carries no
`engine-leverage`/`pack-graduation` lane rows at all `[V]`).

---

## 10. Spot-check methodology and rate

**Rate: 95 of 289 open rows checked against the tree — 33%.** Of those, **78 were checked at a named
symbol**; the rest at a file, a git object, or a corpus measurement I ran myself.

**How I chose them**, in priority order:

1. **Every row whose column 3 records a closure while column 1 reads open.** I extracted these
   mechanically — `| <id> <status> |` where status ≠ ✅ and the last cell matches
   `CLOSED|✅|FIXED|SHIPPED|DONE` — and found **54**. I then verified **43 of the 54 at the symbol**.
   Result: **32 shipped, 9 partial, 2 not started.** The 11 I did not check are named in §6b and
   routed as claimed-only, explicitly so the next reader can disagree with the inference rather than
   the evidence.
2. **Every row I planned to put in a priority-A batch.** Nothing is in A1–A3 that I did not open the
   file for: D468, D469, D470, D373, D106, D448, D259, D92 are all `[V]`, and D208 came *out* of A1
   because the check found it done.
3. **Every row whose remedy I called mechanical in 7a.** The corpus figures in §7 are my own
   measurements — `make graduation-report`, `checkSourcingFile` run per document over all 56, and a
   walk over all 56 pack documents and 32 ledgers — not quotations from rows.
4. **A deliberate sample of rows nobody claimed were closed**, chosen because their subject had been
   touched by a commit since the row was written. **This is where the highest-value finds came from**:
   **D208, D269, D472, D71, D53(half), D52(mostly)** were all open, unclaimed, and already fixed.
   That is 6 of roughly 25 sampled — a **24% stale rate among rows nobody suspected**, which is the
   number that should worry a reader more than the 40 in §6.

**What I did not check**: the 11 column-3-closed rows in §6b; most of NEEDS-OWNER and NEEDS-RESEARCH
(their claims are about rulings and unknowns, not about the tree); and the process rows D402/D416,
whose evidence is git history I sampled rather than re-derived. **D418 I did check**, and it is
correct: `git show --stat db243f5 -- design/BACKLOG.md` is 19 insertions / 19 deletions, and every one
of the 19 `+| D…` lines still begins 🐞 or 💡.

**Corrections this pass produced to the ledger's own numbers** — every one is a row saying something
about the present that is no longer true:

| Row | Says | Measured at `f10b20f` |
|---|---|---|
| D141 | 15 packs with no ledger | **18** authored (24 including the 6 fixtures) |
| D227/D257 | 53 documents, 47 authored | **56** documents, **50** authored |
| D384 | `STORAGE_VERSION` is 22, three drafts stale at 21/20/20 | **23**; `engine-leverage.md` still says 20 |
| D219 | (implicit) | `STORAGE_VERSION = 23`, `storage.ts:407` |
| D311(b) | six axes each, three overlap | **nine** in settings, **six** in-run, **six** overlap |
| D314(b) | `packages/runtime/src/progress.ts` | the file is `apps/server/src/progress.ts` |
| D79 | 0 of 201 checkpoints | **0 of 209** |
| D223/D269/D263 | 5 / 3 draft packs digest-stale | **0 of 32 drafts** — but **26 of 36 candidates**, which no row records |
| D206 | 15 of 47 fail `sourcing-check` at draft severity | **18 of 50** (24 of 56 including fixtures) |
| D238 | the ratchet asserts ≤ 15 | it is checked in at **≤ 18** |
| D418 | `db243f5` changed no status characters | **correct** — 19 rows edited, **column 3 only** |
| D440 | 26 of 56 `resolveAt: terminal`, 25 with `plyHorizon`, 20 at 7–13 ply | **reproduces exactly** — 26 of 56, 25, 20 |

**Two process notes, offered and not taken.**

- The extraction in step 1 is **eight lines of Python** and it is the check [[D419]] and [[D459]]
  have been asking for since they were written. If it ran in `make verify`, a row whose two columns
  disagree would be a build failure instead of a triage pass.
- `f10b20f` landed while this document was being written and added [[D478]]. That is the third time
  in two days the ledger moved under a reader; it is the same shape as D478's own subject, and
  [[D416]]'s *"name the rows you flip in the commit subject"* would have made it visible.
