# Codex queue — refreshed 2026-08-15 (late)

**Landed, all verified by claude at `ENGINES_REQUIRED=1 make verify` exit 0 and
`make test-browser` 24 passed / zero retries:** `authoring-frictions` (0.16) ·
`validator-integrity` (nothing versioned) · `tempo-vocabulary` (0.17) ·
`resistance-spectrum` (run 0.14 / migration 19) · `predicate-wave-3` (0.18 +
shape-entry 0.3) · `opening-evidence-path` (0.20) · refusal-code coverage.
**546 tests / 88 files.**

**Items 0–4 below are implemented and verified.** Their notes remain as the
handoff record; item 5 is the next not-yet-implemented entry.

## 0. D56 — IMPLEMENTED, no RFC needed

**`practical_resistance` returns HTTP 500 on 75% of its own domain.** It shipped
in `4977ff6` today and is broken. `packages/runtime/src/practical-difficulty.ts:32`
guards `measuredMass > 1 + 1e-9` and throws a **raw `TypeError`** rather than a
coded refusal. A real float32 softmax summed over ≤20 candidates accumulates
error near **1e-6** — three orders of magnitude above that tolerance — so the
guard rejects correct engine output. Measured: **30 of 40 in-range roots throw,
20/20 repeats each**.

**Closed 2026-08-15.** The runtime admits 32 float32 ulps of accumulation, an
actual vector captured from the pinned Maia image is the regression fixture,
and materially invalid distributions return the typed
`PRACTICAL_RESISTANCE_POLICY_MASS_INVALID` refusal as HTTP 422 rather than 500.

Three siblings from the same measurement, in the same file's neighbourhood
(D57–D59 in the ledger): the vacuity gate can be skipped so the mode plays the
lexicographically first reply under its own name; an Elo-less request inherits
the previous request's band while recording `eloApplied` absent; and top-p can
sample a `bestmove` outside the recorded candidate list.

## 1. `rfc/archive/branch-set-scale.md` — IMPLEMENTED, claims nothing versioned

Collapse decided branches, bound the eval work, manual fold. Lands in any order.
Cross-review caught the near-miss worth knowing: the rule was `decided ∧
¬admitted`, but that is **symmetric** — under `hold` it folds a *won* branch, and
under `save`/`resist` every win, draw and cursed-win, each with a grammatically
correct explanation. It is now a **shortfall** rule, and under `save`/`resist`
the tablebase ground collapses nothing, ever. Also: tablebase categories are
returned **for the side to move**, so the learner-perspective conversion is
mandatory or collapse folds winning branches on a coin flip.

## 2. `rfc/archive/deviation-classes.md` — IMPLEMENTED

Pack **0.21**. The owner ruled `mistake` **multi-valued** and the body has been
rewritten to match — it is a set (`minItems: 1`, `uniqueItems`), not an enum.
Eight rendering surfaces have explicit multi-value rules and **"pick the first"
is prohibited by name**. `cost` ships **author-declared and UNBACKED**: no
capability claims it verified, no surface renders it engine-confirmed.

**Watch the pointer suffix.** `/deviations/0/mistake/1` is a *resolvable* pointer,
so the human-only refusal must read `…/mistake(?:/\d+)?$` — anchored at the field
alone it would refuse `mistake` and silently **admit the element**. Whichever of
this and 0.20 landed second owns carrying it; 0.20 has landed, so it is yours.

## 3. `rfc/archive/transition-primitives.md` — IMPLEMENTED, pack **0.22**

**0.19 is frozen shut** — it was free as a register slot, but the schema constant
is monotonic and 0.20 passed it. The move-primitive grammar with its pack
consumer.

**R3 removed the live tier**, on this RFC's own bar: the proposed marker cleared
29.5% (an *upper bound*, so a clear majority is unreachable by arithmetic) and
signals on 2.1% of played moves vs 3.4% of unplayed alternatives — **0.61×, the
wrong direction**. The on-request reading ships; the live marker does not. Its
`renderPivotalMarker` fix moved to item 5.

## 4. `rfc/archive/expression-census.md` — IMPLEMENTED, claims nothing versioned

The instrument behind the repo's most-attested friction. Cross-review found **two
of its own refutation rules unsound** and fixed both with nine executed
counterexamples — ship the corrected R1 (leaf-local, direction-aware, closed
allow-list) and the R6 carve-out for `piece_reach_count`.

Its spine, which must survive implementation: **coverage produces no error at any
count**; satisfiability is three-valued and only a *sound refutation* errors.

## 5. `rfc/live-marker-quality.md` — in cross-review

Contains **D51, a shipped disclosure bypass** (the marker modal prints Maia rung-3
mass content past a permission the same modal enforces five lines below). If you
want one thing from this file before it clears review, it is that.

---

## Standing work — take whenever the queue above is blocked

**A. Refusal-code test coverage — IMPLEMENTED.** The audit (`6c7a579`) found 78
codes and 45 without direct coverage. The post-wave recount found 107 emitter
literals and 41 still unpinned; constructed invalid-document tests, explicit
schema-shadowed dispositions, and a drift guard now leave zero unclassified.

**B. D35 — `strong_engine` is not reproducible.** `go movetime` with no
`ucinewgame`/`Clear Hash` anywhere in the server. Now *measured*: hash carry-over
changes **83.8%** of move evaluations and the reported best move on **89 of 171**
positions. The fix costs a flat 6 ms.

**C. D36** — `rest.ts` omits `"enumerated"` from a hand-narrowed
`policyModeApplied` union that the types permit and branch-groups writes.
(`resistance-spectrum` scopes this in; take it standalone only if that wave slips.)

## Protocol reminders

- **The ledger flip rides in the implementing commit.** You have done this on every
  wave — keep it. Note for claude, not codex: on 2026-08-15 claude ran `git add
  design/BACKLOG.md rfc/README.md` while codex's edits to those files were
  uncommitted, sweeping codex's flips into claude's commits. **With two writers in
  one tree, `git add <shared path>` absorbs the other's work.** Add explicit paths
  you authored, never a shared ledger file, while an implementation is in flight.
- Cite `design/BACKLOG.md` rows by **row title**, never line number.
- **Locate by symbol name, not line.** Four reviews today had citations go stale
  underneath them while the tree moved.
- Gates before done: `ENGINES_REQUIRED=1 make verify` and `make test-browser`,
  zero retries.
