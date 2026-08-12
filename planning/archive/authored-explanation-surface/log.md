# Authored explanation surface — implementation log

Append-only.

## 2026-08-12 — codex, implementation start

- Read revision 3 after two adversarial review rounds. The accepted mechanism is
  event-sequenced, path-relative reveal with structural item identities and exact
  checkpoint-event attribution.
- Confirmed the required commit boundary: initial-opponent orchestration and its
  browser-harness prerequisites land before the authored-feedback acceptance.
- Scope guard: no claim triggers, LLM rendering, corpus/Syzygy, live deviation
  classification, FEN-deviation matching, D2 changes, or new authored fields.

## 2026-08-12 — codex, initial-opponent prerequisite

- Resolved the accepted defect generically in `DrillSessionController`: after
  start or writer resume, an opponent ply is selected only when it is the
  opponent's turn and no checkpoint blocks. Read-only followers never select or
  append.
- Added explicit tests for new-run play, writer resume, follower exclusion, and
  checkpoint blocking. Added a server-level mock test for Pack A's deterministic
  `...Bf5`, `...e6`, `...c5` path.
- The browser harness now starts in development mode and locates the schema
  example by review status instead of assuming the registry contains one pack.
  Existing browser suite: 2 passed, optional Maia test skipped.

## 2026-08-12 — codex, server reveal projection

- Added typed access for the three supported authored shapes without changing
  the v0.2 JSON Schema. `pack-check` now warns, rather than guesses, when
  spine-anchored prose lies beyond every statically resolvable checkpoint; any
  dynamic checkpoint suppresses that warning.
- Added an event-sequenced projection and `GET
  /runs/:id/authored-feedback`. Tests exercise Pack A's main and Tal sibling
  paths, repeated checkpoint ids on separate branches, segment-end reveal,
  extraction exclusions, deterministic ordering, and monotonic reveal after
  rewind.
- The response counts only structurally deliverable annotation, deviation-note,
  and plan-class items. Pack A's unanchored claims and concepts are neither
  returned nor allowed to pin the coarse withheld flag.
- Focused schema/server suites and the workspace typecheck passed before this
  checkpoint.

## 2026-08-12 — codex, client reveal surface

- The typed client loads the coarse page after start/resume and after any
  mutation that reaches a checkpoint. The checkpoint sheet filters by exact
  `revealedBy.eventSeq`; a mounted test includes two items with the same
  checkpoint id and proves the earlier occurrence stays absent.
- Timeline markers are computed only from already-returned items. No
  pre-reveal node/content signal was added. The drill header exposes only the
  response's coarse withheld boolean.
- The Pack A browser path now starts with the deterministic root opponent move,
  reaches `plan-commitment`, renders real authored prose, and proves a later
  `be3-hold` annotation is absent from the DOM.
- The longer real-pack objective exposed a board overflow that clipped the
  first rank and made drag coordinates invalid. Reducing the desktop board's
  viewport-height allowance restored containment and both the existing
  Najdorf walkthrough and Pack A flow. Browser result: 3 passed, optional Maia
  latency test skipped.

## 2026-08-12 — codex, implementation verification

- Canonical documentation now separates pack-wide engine-evidence withholding
  from event-sequenced authored-prose reveal, describes the closed three-kind
  item set and occurrence attribution, and corrects Maia's status: policy mass
  already persists in opponent selections and reaches the browser.
- `ENGINES_REQUIRED=1 make verify`: 36 files and 179 tests passed; schema and
  packaging verification passed; Svelte reported zero errors and warnings.
- `make test-browser`: 3 passed, the opt-in Maia latency test skipped. Measured
  browser harness timings were board ready 100.7 ms, rewind 87.2 ms, branch
  switch 30.3 ms, uncached mock reply 1.0 ms, and cached mock reply 0.8 ms.
- No claim trigger, feedback packet, LLM, corpus/Syzygy, FEN-deviation matcher,
  live deviation classifier, D2 barrier change, or authored schema field was
  added.

## 2026-08-12 (claude) — review of the implementation; one acceptance gap closed

Independently verified rather than accepted on report: `ENGINES_REQUIRED=1 make
verify` green (36 files, 179 tests at the time of review), svelte-check 0
errors/0 warnings, scaffold and packaging OK.

Checked the implementation against the acceptance criteria one by one. Test
names in `authored-feedback.test.ts` map onto them directly, including the two
that killed earlier revisions — sibling non-leakage and occurrence attribution —
and the flag test asserts the case that mattered (Pack A's undelivered claims
must not pin `hasWithheldAuthoredContent` true). The sort at
`authored-feedback.ts:303-308` matches §4 exactly: `eventSeq`, then kind, then
id.

**One gap: criterion 8 requires deterministic ordering to be *asserted*, and
nothing asserted it.** The ordering was implemented correctly, so this was not a
bug — but an unpinned invariant is one refactor away from becoming one, and the
whole point of the criterion is that response order is part of the contract.
Added `orders items by reveal sequence, then kind, then id`, written as the
invariant rather than a fixed list so it survives pack edits, with non-vacuity
assertions (two distinct reveal events, all three kinds present) so it cannot
pass trivially. 180 tests green.

Nothing else outstanding. The RFC's completion protocol can proceed.

## 2026-08-12 — codex, lifecycle closeout

- Claude's approval and the follow-up ordering invariant close every acceptance
  criterion. The canonical description already lives in
  `docs/explanation-grounds.md`, so no additional system page is needed.
- Set the RFC to implemented and prepared the RFC and planning job for archival
  in one lifecycle commit. Post-move verification is recorded by the closing
  commit's command results.
- After the moves, `ENGINES_REQUIRED=1 make verify` passed 180 tests across 36
  files, Svelte reported zero errors and warnings, and scaffold/packaging checks
  passed. `make test-browser` passed all three required flows; the opt-in Maia
  latency test skipped.
- Closing browser measurements: board ready 95.9 ms, rewind 90.3 ms, branch
  switch 50.1 ms, uncached mock reply 1.2 ms, cached mock reply 0.8 ms. Branch
  switching is 0.1 ms over the existing 50 ms benchmark and remains the known
  projection-performance deviation, not an acceptance failure for this RFC.
