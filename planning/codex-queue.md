# Codex queue — refreshed 2026-08-15

Ordered. Take the top unstarted item; do not wait for anything below it.
All register lanes are reconciled in `rfc/README.md` and cannot collide.

**Landed today:** `authoring-frictions` (`ffc9817`, pack 0.16) and
`validator-integrity` (`047de02`, nothing versioned). Both verified by claude at
`ENGINES_REQUIRED=1 make verify` exit 0, ledger flips correctly inside the
implementing commits.

## 1. `rfc/archive/tempo-vocabulary.md` — IMPLEMENTED

Pack **0.17**. Unblocks the E3 and B4 gates. A timing window becomes a ledger
kept between two events; computes the three tempo mistake classes named in
`design/01-training-model.md`; implements `preserve_plan_window`.

Cross-reviewed: six specification-level blockers fixed, including a layering
violation that would have stopped you at the first `onTrigger` window
(`simpleTriggerMatches` is module-private and lives in a package
`packages/runtime` cannot import — the RFC injects a `TriggerResolver`). All 14
verdict cells in §8 were independently re-derived.

**Carries an owner ruling (2026-08-15):** `outpaced` grading is split by context —
a pack may declare per window that it grades (default ungraded); **Just Play
grades it as failure by default**. Both branches need the declared-vs-executable
treatment; the Just Play default needs its own applied record, not an implicit one.

## 2. `rfc/opening-evidence-path.md` — BLOCKED ON REGISTER RECONCILIATION

Pack **0.20**. Closes the opening half of the evidence hole (`validator-integrity`
closed the trajectory half). `assessedBy` gains `kind: "engine"`.

The spine to preserve: **a tablebase record grounds a claim by settling it; an
engine record grounds a claim by making it falsifiable at a named cost.** An
opening pack may be `ledger_verified` while every strategic assertion in it stays
ungrounded — its sentence ends `"not a proof"` against the syzygy branch's
`"Exact."`, and **no pack-level verified badge may be derived** (acceptance
criterion 19 exists to keep it that way).

Cross-review fixed a real regression: retiring `OBJECTIVE_GRADING_UNSUPPORTED`
outright would have admitted an engine assessment on a trajectory **leg**, whose
entry position is not statically bound. It is now *narrowed to legs*, not retired.

Codex re-review found two post-review stale premises on 2026-08-15: pack 0.20
cannot land before the still-unlanded 0.18 owner, and the RFC's migration census
names 20 opening packs while the tree contains 23. Reconcile both before starting.

## 3. `rfc/archive/resistance-spectrum.md` — IMPLEMENTED

Run **0.14**, migration **19**. Ships `practical_resistance`; proves `fallible`
should not exist as a mode and fixes the unconditional `setoption name Elo`.

Cross-review dropped two central mechanisms that were wrong: the `sameEngine` +
`eloApplied` extension **would have caused the desync it promised to prevent**,
and §2b fell through to **alphabetical play** in the 46.2% of positions with no
conceding move (now a named vacuity refusal). Candidate cap is 8 → 4.

**Carries an owner ruling (2026-08-15):** the latency budget now has two axes —
per instrument call and per selection (`design/02-product-shape.md`). This mode's
~580 ms is a declared per-selection budget, not a breach.

## 4. `rfc/predicate-wave-3.md` — owner items closed, final pass in flight

Pack **0.18** + shape-entry **0.2 → 0.3** (the shape schema carries a duplicated
`$defs/structuralFeature`; new leaves must land in **both** copies).

Two owner rulings landed on it: intent grading is **grade the 45%, refuse the
rest by name** (overturning its wholesale refusal), and **`piece_distance` is
absorbed** into this wave. An agent is writing the latter in now.

## 5. `rfc/deviation-classes.md` — 1 OWNER QUESTION OPEN

Pack **0.21**. Adds `mistake` and `cost`; deliberately does **not** split the
`class` enum — of 36 `concept_violation` rows, 4 are genuinely *both* plan and
timing, so a two-value split makes them unauthorable. **Do not start this one
until the owner rules on whether a single-valued `mistake` is acceptable.**

`cost` ships **author-declared and UNBACKED** by coordinator ruling — no
capability claims it is verified and no surface may render it engine-confirmed.

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

- **The ledger flip rides in the implementing commit.** You did this correctly on
  both waves today — keep it.
- Cite `design/BACKLOG.md` rows by **row title**, never line number.
- **Locate by symbol name, not line.** Four reviews today had citations go stale
  underneath them while the tree moved.
- Gates before done: `ENGINES_REQUIRED=1 make verify` and `make test-browser`,
  zero retries.
