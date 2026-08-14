# RFC: Defect batch 2 — D21, D22, D23, D24, D27: two fixes, three stale rows, five closures

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/BACKLOG.md` open-defect rows D21 (line 132), D22 (128), D23
  (129), D24 (131), D27 (130). **All five rows were re-verified against the tree on
  2026-08-14 — three of the five are stale**, which is this repo's known failure mode for
  ledger rows and the reason §1 exists.
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by
  owner ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. (Drafted while `adaptive-guidance.md` was
  implementing against pack schema 0.11 unchanged; that RFC archived as implemented on
  2026-08-14 during drafting, so the 0.12 claim has a clear runway — register row updated
  to match.)
- **Parent / amends:** **`rfc/archive/branch-runtime.md`** (`deriveSegments` becomes a
  projection of `segment.completed` events instead of a second, disagreeing derivation),
  **`rfc/archive/outcome-drill-grading.md`** (its coincident-checkpoint guard,
  `packages/runtime/src/runtime.ts:451` introduced at commit `49a3044`, is ratified as
  *the* segment semantic rather than half of one), **`rfc/archive/drill-pack-format.md`**
  (pack schema 0.11 → 0.12: `$defs/opponentPolicy` closes), **`rfc/archive/defect-sweep.md`**
  and **`rfc/archive/shape-library.md`** (this RFC records that they already closed D24 and
  D27 respectively, and adds the regressions they left out).
- **Supersedes / superseded by:** —
- **Migration:** **none, with a reason.** Nothing here changes persisted shape.
  `STORAGE_VERSION` stays 10 (`apps/server/src/storage.ts:287`); run schema stays 0.8
  (`packages/schema/src/index.ts:1`). The D21 fix changes a *derivation function*, not the
  event log — no event is added, removed, or reshaped, and §2's chosen direction is chosen
  precisely so that every already-persisted log (including the pre-guard window, see §2.1)
  reads identically through both consumers without rewriting anything. The D22 schema
  tightening claims **pack schema 0.12** in `rfc/README.md`'s register; pack digests are
  content digests and the `$id` is not part of any pack document
  (`packages/schema/src/drill-pack/digest.ts:58-66`), so no committed digest moves.
- **Planning:** `planning/defect-batch-2/` (once implementing)

## Summary

Five defect rows are assigned; each was re-verified against the current tree before
anything was specified. **Two are real**: D21 — the segment producer
(`packages/runtime/src/runtime.ts:451`) and the segment deriver
(`packages/runtime/src/events.ts:237-259`) disagree about whether a coincident-checkpoint
segment exists, and the disagreement is reachable from the shipped orchestrator; and D22 —
`$defs/opponentPolicy` still says `"additionalProperties": true`
(`schemas/drill_pack.schema.json:577`), D3's never-silent shape surviving in the pack
format. **Three are stale**: D23's emitter has emitted `phase` since its first commit and
all four committed candidates carry it; D24 was closed by the defect-sweep the same day the
row was filed (`main.ts:18` defaults secure); D27 was closed by the shape-library
implementation 57 minutes after its row was filed (the gating assertion is gone, the
recording line remains). This RFC fixes the two real defects with the regressions that
would have caught them, adds the regressions the three incidental closures never got (a
default-`Secure` cookie test, an "unclassified" phase browser assertion, a measured-envelope
docs section), and closes all five ledger rows.

Baselines, measured 2026-08-14 on the tree at `7f21178` plus the in-flight
adaptive-guidance working-tree changes: **359 unit tests / 63 files, all green** (`npx
vitest run`); pack schema 0.11 (`schemas/drill_pack.schema.json:3`), run schema 0.8,
`STORAGE_VERSION` 10. (The batch assignment's stated baselines — 321/55, storage 9 —
predate the shape-library landing; they are recorded here so the drift is explicit, and
implementation re-measures at its own start.)

## Motivation

### 1. The verification pass

| # | Ledger says | Verified 2026-08-14 | Evidence |
|---|---|---|---|
| D21 | producer refuses coincident segments, deriver invents them; the two shipped consumers disagree | **real, and reachable** | Guard: `runtime.ts:451` (`previous.data.nodeId !== run.activeCursor.nodeId`). Deriver: `events.ts:241-256` pushes for *every* consecutive checkpoint pair on a branch, node equality never checked. Reachable: `apps/server/src/pack-orchestrator.ts:286-293` loops all pack checkpoints after each move, so two triggers satisfied at the same ply fire `reachCheckpoint` twice on the same node. History: the guard arrived with outcome grading (`49a3044`, 2026-08-12); the deriver predates it (`00018f4`, 2026-08-10) and was never updated — outcome grading decided the semantic and fixed only one side |
| D22 | `opponentPolicy` accepts unknown fields | **real, latent** | `schemas/drill_pack.schema.json:577`. Empirically: an Ajv 2020 run with the definition closed (same options as `apps/server/src/pack-validation.ts:51-53`) over all 11 committed pack documents, `drill_pack.example.json`, and all 7 fixtures shows **every valid document still validates and every `.invalid` fixture still fails for its original reason** (zero `/opponentPolicy` errors among them). No committed document carries an unknown key — the defect has not yet manifested, which is the cheap moment to close it |
| D23 | the `position-seeds` emitter omits `phase`; machine candidates invisible to the phase-organized Learn IA | **stale — false when filed** | The emitter has emitted `phase` since its first commit: `608d80a` (2026-08-12 17:49) already contained `position-seeds.ts` phase mapping; the row was filed at `7bdc410` (2026-08-13 11:46). Today: `apps/server/src/sourcing/position-seeds.ts:166-169` maps exactly-one phase theme, `:231` emits it, and `position-seeds.test.ts:137-138` asserts both the emission and the honest omission for ambiguous themes. All four committed candidates carry `phase` (`content/candidates/*/pack.json`: opening, middlegame, endgame ×2). Client-visible: `apps/web/src/lib/PackList.svelte:35` renders the phase and `"unclassified"` for null; browser test `tests/browser/drill.spec.ts:110-121` asserts the badges |
| D24 | `TABIYA_COOKIE_SECURE` must default true once a light profile exists | **stale — closed by the defect-sweep the same day** (`cf2ac55`, 2026-08-13 12:05; row filed 11:46) | `apps/server/src/main.ts:18`: `process.env.TABIYA_COOKIE_SECURE !== "false"` — default true; `apps/server/src/identity.ts:86`: `options.cookieSecure ?? true`. The light profile exists: `deploy/compose.release.template.yaml:24` puts Maia behind `profiles: [engines]` with `required: false` (`:17-20`), and the template deliberately omits the cookie variable (`rfc/archive/defect-sweep.md:568`), so the compiled default governs. A plain-HTTP self-hoster gets `Secure` cookies: the browser never sends the auth cookie over HTTP, so login **visibly fails closed** instead of silently shipping F3's boundary without transport. `docs/identity-and-authorization.md:70-71` documents the opt-out. **Gap: no test pins the default** — `identity-authorization.test.ts:74,210,316` and `application.test.ts:19,72` only ever pass `cookieSecure: false` |
| D27 | a latency envelope is asserted inside the unit gate | **stale — closed by shape-library 57 minutes after filing** (row `b96c0a1` 11:01, fix `7cf2e32` 11:58, both 2026-08-14) | The diff is exactly the ruled pattern: `- expect(maxMs).toBeLessThan(100)` → `+ expect(durations).toHaveLength(200); expect(Number.isFinite(maxMs)).toBe(true)`; the recording line survives (`packages/runtime/src/structure.test.ts:94`). Swept for the class: `grep -rn "toBeLessThan" packages/*/src apps/*/src --include="*.test.ts"` finds **no wall-clock gate anywhere** — both `latency.test.ts` files record and assert only structure/`>= 0` (`packages/runtime/src/latency.test.ts:134-136`, `apps/server/src/latency.test.ts:200-202`), as does `shape-firing.test.ts:41`. **Gap: the ruled pattern's second half is unmet** — "benchmarks live in docs", but `docs/structural-reading.md` records no measured envelope (its siblings do: `docs/branch-runtime.md:325`, `docs/app-shell.md:179`, `docs/adaptive-guidance.md:122`), and the recording line is invisible in the default gate because vitest intercepts console output |

Two ledger-hygiene facts fall out of the table and are part of this RFC's record: the D23
row was filed against a draft under review rather than the shipped tree (the shipped
emitter never had the defect), and D24/D27 were closed by implementations that did not
close their rows. Closing a defect without closing its row *is* how rows go stale; §6
closes all five.

### 2. Why D21 gets the "segments are events" semantic

Three consumers exist today. `apps/server/src/authored-feedback.ts:169-185` reads **both**
sides and cross-matches them by `(branchId, startSeq, endSeq)`, throwing at `:184` when an
event has no derived match — dead code today only because the deriver over-produces.
`packages/runtime/src/feedback.ts:11` counts `segment.completed` **events**.
`apps/server/src/progress.ts:96-98` (return-progression) reads `checkpoint.reached`
directly — its review found this defect precisely by observing that segment count is *not*
a function of checkpoint count. So every shipped consumer either reads events or reads
checkpoints; the deriver's phantom zero-length segments have no believer — they are pure
disagreement.

The alternative — making `reachCheckpoint` emit zero-length `segment.completed` events —
is worse on both axes: semantically, a zero-length segment claims a traversal that did not
happen (a coincident checkpoint re-marks a node; nothing was played); and mechanically, it
only changes *future* appends, so persisted logs would carry three eras of behavior
(pre-guard 2026-08-10..12, guarded, post-change) that no reader could distinguish. Making
the deriver a projection of the events makes every log ever written — including the
pre-guard window's genuine zero-length events, see §2.1 — read identically through both
consumers, by construction, forever.

## Specification

### §2 D21 — `deriveSegments` becomes a projection of `segment.completed` events

**Semantic (normative):** a segment exists **iff** a `segment.completed` event exists in
the run's log. The producer's guard (`runtime.ts:451`) is the single writer of that truth:
coincident checkpoints (same `nodeId`) mark the node and never produce a segment.

**Change** — rewrite `deriveSegments` (`packages/runtime/src/events.ts:237-259`):

1. Iterate `run.events`; select `type === "segment.completed"`.
2. For each, resolve the two `checkpoint.reached` events at
   `data.startCheckpointEventSeq` / `data.endCheckpointEventSeq` to obtain
   `startCheckpointId` / `endCheckpointId`; **throw `TypeError`** if either seq does not
   resolve to a `checkpoint.reached` event (a corrupted log, same strictness class as
   `projectRun`'s existing event-order checks at `events.ts:180-194`).
3. Treat the event as integrity-sensitive now that it controls `segment_end` disclosure.
   Require `startSeq < endSeq < segment.seq`; require the segment event to immediately follow
   the ending checkpoint; and require both checkpoint events' `branchId` and `nodeId` to equal
   the segment's declared branch/start/end values. Reject any mismatch with `TypeError`.
   `appendEvents` is public, so validating only that the two sequence numbers exist would let a
   forged event substitute an arbitrary `endNodeId` and widen authored reveal.
4. Build the `Segment` (`packages/runtime/src/types.ts:254-262`) from the event's
   `branchId`, `startNodeId`, `endNodeId` and the resolved checkpoint ids;
   `startSeq`/`endSeq` are the event's two checkpoint seqs, exactly as today's consumers
   match on. Return frozen, in log order.

The checkpoint-pair recurrence (`previousByBranch`) is deleted, not patched: patching it to
skip node-equal pairs would keep two implementations of one recurrence and would *still*
disagree with pre-guard logs (§2.1).

`authored-feedback.ts:172-177`'s cross-match now succeeds by construction on every
non-corrupted log; the throw at `:184` stays as the corruption guard. `feedback.ts:11` and
`progress.ts:96-98` are untouched.

**§2.1 The pre-guard boundary.** Between `00018f4` (2026-08-10) and `49a3044`
(2026-08-12), `reachCheckpoint` emitted a segment for *any* previous checkpoint, coincident
included — so persisted runs from that window can legitimately contain zero-length
`segment.completed` events. Under this specification those runs stay internally
consistent: the deriver reflects the events that exist (the log is append-only; law 7),
readers agree, `authored-feedback` does not throw. A "skip node-equal pairs" deriver patch
would instead have orphaned those events against their derivation — the same defect,
mirrored.

**Tests (the regression that would have caught it, plus the invariant):**

- *Coincident checkpoints, runtime level* (`runtime.test.ts`, "checkpoint segments"
  describe at `:269`): reach a checkpoint, then a second checkpoint id **without a move**;
  assert `emitted` contains only `checkpoint.reached` (no `segment.completed`) and
  `deriveSegments(run)` is `[]`. This single test fails against today's deriver — it is
  the D21 regression.
- *Coincident checkpoints, orchestrator level* (`apps/server` tests): a pack with two
  checkpoints whose triggers are both satisfied at the same ply (e.g. two `atPly: 2`
  triggers) played through `orchestratePackMove` (`pack-orchestrator.ts:286-293`); assert
  event count and derived-segment count agree, and the authored-feedback anchor derivation
  does not throw.
- *Pre-guard log compatibility*: `projectRun` over a literal event array containing a
  zero-length `segment.completed` exactly as the `00018f4` producer wrote it; assert the
  run projects, `deriveSegments` yields that zero-length segment, and the
  `authored-feedback` path accepts it.
- *Invariant property* (`invariants.test.ts`, alongside the `:97` describe): for generated
  legal play/checkpoint/rewind sequences, `deriveSegments(run)` corresponds 1:1 with the
  run's `segment.completed` events under `(branchId, startSeq, endSeq, startNodeId,
  endNodeId)` — the two readers cannot disagree on any reachable log.
- *Forgery refusal*: a manually appended segment that cites real checkpoint sequences but
  changes its branch, start/end node, order, or adjacency is rejected. This regression is
  load-bearing because segment projection now opens authored-feedback scope.

**Unblocks:** any future consumer may count, join, or grade on segments through either
surface without a semantic fork — the exact property the return/progression review went
looking for and found missing.

### §3 D22 — close `$defs/opponentPolicy`; pack schema 0.12

**Change:**

1. `schemas/drill_pack.schema.json:577`: `"additionalProperties": true` → `false` in
   `$defs/opponentPolicy` (`:556-578`). The six declared properties (`mode`, `targetElo`,
   `temperature`, `topP`, `stockfishGuardCp`, `seedMode`) are unchanged.
2. `$id` (`:3`) → `urn:chess-tabiya:schema:drill-pack:0.12`;
   `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) → `"0.12"`; the pin at
   `packages/schema/src/drill-pack.test.ts:61` updates in the same commit. Precedent for
   "tightening bumps the version": 0.5 (`archive/defect-sweep.md`, required `start.side`).
3. New negative fixture `schemas/fixtures/drill-pack/opponent-policy-unknown-key.invalid.json`
   — an otherwise-valid pack whose policy is
   `{"mode": "human_common", "targetElo": 1800, "maiaModel": "maia-1900"}` — appended to
   the `negativeFixtures` list (`drill-pack.test.ts:44-48`) and asserted to fail **with an
   `/opponentPolicy` instance path**. This is the regression D3's closure never got on the
   pack side.

**Enforcement surface (verified single):** the one compiled schema at
`apps/server/src/pack-validation.ts:43-55` serves every path — POST endpoints, the studio
(`pack-studio.ts:87,126`), `pack-check`, and the emitters, which validate their own output
(`position-seeds.ts:240-241`). The run side is already closed and stays closed:
`schemas/drill_run.schema.json:179-188` (`runOpponentPolicy`,
`additionalProperties: false`) — D3's actual closure, which this change brings the pack
format level with.

**Boundary conditions, handled explicitly:**

- *Committed content:* verified clean — the Ajv run in §1's table shows all 11 committed
  pack documents, the example, and the browser fixture validate under the closed
  definition, and every `.invalid` fixture stays invalid for its original reason.
  (`illegal-spine.invalid.json` remains schema-valid by design; it is rejected at the lint
  layer, `drill-pack.test.ts:203-208` — unchanged.)
- *Stored studio drafts:* drafts are stored raw and revalidated on read
  (`pack-studio.ts:155`); a pre-0.12 draft carrying an unknown policy key becomes a
  **visible** validation issue that blocks playtest and registration
  (`pack-studio.ts:110-111,126-128`) and deletes nothing. That is the never-silent
  behavior D22 exists to restore, applied to old data without a migration — drafts are
  validated at use, not at rest.
- *Already-registered packs in a hosted database:* registration validated them under the
  schema current at registration time, so a pack with an unknown key could exist there
  legally. Its stored document continues to be served; the next validation-touching
  operation surfaces the issue. Nothing is silently dropped or rewritten.
- *Digests:* `digestDrillPack` canonicalizes the document's own bytes and the `$id` is not
  part of any document (`digest.ts:58-66`) — no committed digest moves, `evidence.json`
  pins are unaffected.

**Register and landing order:** pack schema **0.12** is claimed in `rfc/README.md`
(row added by this draft). At claim time `rfc/adaptive-guidance.md` was implementing
against "pack schema unchanged (0.11)", making the version constant a contested
single-writer surface; it archived as implemented on 2026-08-14 while this draft was being
written, so 0.12 lands cleanly behind 0.11. The shared surface — the constant and its
`drill-pack.test.ts:61` pin — is single-writer again, and the register row records the
sequence rather than leaving it to be discovered at merge time.

**Out of scope, observed and named:** two open objects remain in the pack schema —
`$defs/feedbackClaim` (`:661`) and `$defs/provenance` (`:675`). Provenance's openness is
**load-bearing today**: every committed pack carries `licence`, `reviewers`, and
`graduationBlockers`, none of which the definition declares (`:663-676`), so closing it
requires first declaring the real provenance vocabulary — authored-content design, not a
mechanical closure. This RFC does not touch them; a BACKLOG row for "declare and close
`provenance` (and audit `feedbackClaim`)" is proposed to the owner in §6 (the design tier
is not writable from this RFC).

**Unblocks:** pack authors get the same never-silent guarantee on `opponentPolicy` that
D3 gave `POST /runs` — a typo'd or invented policy knob fails validation instead of being
blessed and ignored; and the schema stops advertising an extension point that no reader
implements.

### §4 D23 — verified stale; one browser assertion added; candidates not regenerated

**No emitter change.** The defect described by the row does not exist in the tree and, per
`git log`, never existed in any committed emitter (§1 table). The residual behavior —
puzzles whose themes carry zero or multiple phase claims are emitted **without** `phase` —
is the honest-signal design ratified by `archive/defect-sweep.md` §4d and is already
pinned by `position-seeds.test.ts:137-138`.

**Regeneration decision: the four committed candidates are NOT regenerated.** Grounds:
(a) there is nothing to regenerate toward — all four already carry `phase`; (b) the
emitter's graduation-blocker wording has changed since they were emitted
(`position-seeds.ts:225` vs. the committed `"immediate_blunder_guard is not selectable
(defect D8)"` string), so re-emission would change pack bytes, move `packDigest`, and
force every `evidence.json` pin to be re-issued — nonzero churn purchasing zero
information. No documented gap is needed because no gap exists.

**One test added** (the invisibility check the row actually worried about, client-visible):
extend the existing browser test `tests/browser/drill.spec.ts:110` ("library exposes phase
honestly...") with a pack summary whose `phase` is null and the assertion that its card
renders **"unclassified"** (`PackList.svelte:35`) — i.e. a phase-less pack is *visible and
labeled*, not invisible, on the surface the Learn IA organizes by phase. (There is no
phase *filter* control in the shipped client to drive — Learn is currently the return
loop, `App.svelte:472-492`; this RFC does not invent one.)

**Unblocks:** the Learn/Library phase axis can be built on machine-emitted candidates
without a per-candidate audit, and the "unclassified" bucket has a pinned rendering.

### §5 D24 and D27 — verified closed; the missing regressions land

**D24 (closed by `archive/defect-sweep.md` §6; regression added).** No production change.
Tests:

1. `identity-authorization.test.ts`: construct the service **omitting** `cookieSecure`;
   assert the session `Set-Cookie` contains `Secure` (the mirror of the existing `:210`
   assertion, which only ever proves the opt-out works).
2. Extract the env parsing at `main.ts:18` into a pure
   `cookieSecureFromEnv(value: string | undefined): boolean` (same file or the config
   seam) and pin the encoding, not the intent: exactly the string `"false"` disables;
   `undefined`, `"true"`, `"0"`, `"FALSE"` all leave it enabled — matching the documented
   opt-out spelling (`docs/identity-and-authorization.md:70-71`) and making the
   deliberately narrow escape hatch a tested contract instead of an inline expression.

**D27 (closed by `archive/shape-library.md`'s implementation; the ruled pattern's docs
half lands).** No test change — `structure.test.ts:82-97` is already the ruled shape
(record via the `STRUCTURAL_LATENCY` console line at `:94`, assert only structure).
Changes:

1. `docs/structural-reading.md` gains a **Measured envelope** section (sibling precedent:
   `docs/branch-runtime.md:325`): the recorded numbers with their date and machine state —
   2026-08-14, quiet dev machine: `{"samples":200,"medianMs":3.858,"maxMs":6.747}`; under
   parallel-agent load the same code measured 103.5 ms max (the D27 flake datum) — plus
   the **100 ms worry threshold as a documented threshold, not an assertion**, and the
   D14/D27 rule it embodies: a gate that can report either answer on identical code is not
   evidence.
2. The same section documents the retrieval command, because the default gate swallows the
   recording: `npx vitest run packages/runtime/src/structure.test.ts
   --disable-console-intercept`. (Verified: the line is invisible under plain
   `vitest run`.)

**Unblocks (both):** the unit gate is deterministic on identical code (D27), the release
light profile's auth boundary is regression-guarded rather than merely correct (D24), and
future envelope drift is a documented diff, not a flaky red.

### §6 Ledger closures

On acceptance+implementation, `design/BACKLOG.md` rows close per the standard workflow
(status edits are workflow, not design authorship): **D21, D22** — closed by this RFC's
sections; **D23** — closed *stale* (filed against a draft under review; the shipped
emitter never had the defect; regression already existed at filing time); **D24** — closed
by `archive/defect-sweep.md` §6, regression added here; **D27** — closed by
`archive/shape-library.md`'s implementation (`7cf2e32`), docs half added here. One new row
is **proposed to the owner** (not written by this RFC): *"`$defs/provenance` and
`$defs/feedbackClaim` are the last open objects in the pack schema; provenance's openness
is load-bearing (`licence`/`reviewers`/`graduationBlockers` are undeclared) — declare the
vocabulary, then close them"* (§3). `planning/exploration/log.md` gets the dated entry.

## Deviations from design

None. The segment semantic ratifies what `archive/outcome-drill-grading.md` shipped; the
schema closure implements the D3 never-silent doctrine at the pack layer; phase optionality
follows `archive/defect-sweep.md` §4d; the envelope treatment follows the D14/D27 ruling
recorded in the ledger.

## Acceptance criteria

Executable, per defect, on top of the baseline suite (359/63 green as of 2026-08-14;
re-measured at implementation start):

1. **D21:** (a) the coincident-checkpoint runtime test passes — and demonstrably **fails
   against the pre-fix deriver** (run once against the old `deriveSegments` to prove the
   regression bites); (b) the orchestrator-level two-triggers-same-ply test passes; (c) the
   pre-guard zero-length-event log projects, derives, and feeds authored feedback without
  throwing; (d) the invariants property (`deriveSegments` ≡ validated `segment.completed`
  projection) passes; (e) forged branch/node/order/adjacency metadata is rejected.
2. **D22:** (a) `grep -n '"additionalProperties"' schemas/drill_pack.schema.json` shows no
   `true` at the `opponentPolicy` definition; (b) the full committed corpus
   (`content/candidates/*/pack.json`, `content/drafts/*.json`,
   `schemas/drill_pack.example.json`, browser fixture) validates under the closed schema;
   (c) `opponent-policy-unknown-key.invalid.json` is rejected with an `/opponentPolicy`
   path and every pre-existing `.invalid` fixture still fails; (d)
   `DRILL_PACK_SCHEMA_VERSION === "0.12"`, `$id` agrees, `drill-pack.test.ts` pin updated;
   (e) no committed `packDigest` changes (`git diff` over `content/` is empty).
3. **D23:** the extended `tests/browser/drill.spec.ts` library test passes, including the
   new assertion that a null-phase pack card renders "unclassified";
   `position-seeds.test.ts:137-138` still passes unmodified.
4. **D24:** the omitted-option `Secure` cookie test passes; `cookieSecureFromEnv` unit
   test passes with the exact table in §5; `identity-authorization.test.ts:210`'s opt-out
   assertion still passes.
5. **D27:** `grep -rn "toBeLessThan" packages/*/src apps/*/src --include="*.test.ts"`
   matched against wall-clock quantities returns nothing; `docs/structural-reading.md`
   contains the Measured envelope section with `samples`/`medianMs`/`maxMs`, the 103.5 ms
   load datum, the 100 ms worry threshold, and the retrieval command; the
   `STRUCTURAL_LATENCY` recording line is still present at `structure.test.ts:94`.
6. **Batch:** full unit gate green; `rfc/README.md` register row 0.12 matches the shipped
   `$id`; the five BACKLOG rows and the log entry land per §6.

## Open questions

None.

## Changelog

- 2026-08-14 (Codex implementation review): approved after closing one disclosure-integrity
  blocker. Because the new derivation makes `segment.completed` authoritative for authored
  reveal, the event must match both referenced checkpoints exactly and preserve ordering and
  adjacency; sequence existence alone was insufficient against public `appendEvents`.
- 2026-08-14: created; five rows re-verified against the tree (two real, three stale);
  pack schema 0.12 claimed in the register.
