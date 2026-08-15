# Codex queue — refreshed 2026-08-15 (evening)

**Landed today, all verified by claude at `ENGINES_REQUIRED=1 make verify` exit 0:**
`authoring-frictions` (`ffc9817`, pack 0.16) · `validator-integrity` (`047de02`,
nothing versioned) · `tempo-vocabulary` (`ed48978`, pack 0.17) ·
`resistance-spectrum` (`4977ff6`, run 0.14 / migration 19) · refusal-code
coverage (`8fbab41`, 107 emitters classified).

## 1. `rfc/archive/predicate-wave-3.md` — IMPLEMENTED

Pack **0.18** + shape-entry **0.2 → 0.3** (the shape schema carries a duplicated
`$defs/structuralFeature`; new leaves must land in **both** copies or shape
triggers silently cannot use them).

**Previously blocked on three things; all three are cleared:** the cross-review
is committed, the status note names which open questions gate acceptance, and
both owner-facing questions are ruled.

Owner rulings it now carries:
- **`plan_consequence` SHIPS** (Q1). Its 16-of-99 coverage is a *content* defect,
  not a format limit — *"we are the authors"*. A signature authoring pass runs in
  parallel; do not wait for it.
- **`piece_distance` is absorbed** into this wave. Ship it as the **static** leaf
  only — the delta form was refuted at a 98.7% false-positive rate. Note the
  measured limits: rook/bishop/queen take only the values {1,2} against a king
  target corpus-wide, and 85 of 440 positions have every white bishop off-shade,
  so the vacuity refusal is load-bearing.
- Intent grading is **grade the 45%, refuse the rest by name** — §5c-bis supplies
  capability publication, named refusal and applied record.

## 2. `rfc/archive/opening-evidence-path.md` — IMPLEMENTED

Pack **0.20** (behind 0.18, hence the ordering). Closes the opening half of the
evidence hole. `assessedBy` gains `kind: "engine"`.

The stale corpus count you flagged is fixed — it is **20** opening packs, not 18
(the Scandinavian pair landed after G1). The spine to preserve: a tablebase
record grounds a claim by *settling* it; an engine record grounds a claim by
making it *falsifiable at a named cost*. An opening pack may be `ledger_verified`
while every strategic assertion in it stays ungrounded — hence `"not a proof"`
against the syzygy branch's `"Exact."`, and **no pack-level verified badge**.

Cross-review caught a real regression: retiring `OBJECTIVE_GRADING_UNSUPPORTED`
outright would have admitted an engine assessment on a trajectory **leg**, whose
entry position is not statically bound. It is *narrowed to legs*, not retired.

## 3. `rfc/branch-set-scale.md` — in cross-review

Claims **nothing versioned**. Collapse decided branches, bound the eval work,
manual fold. Note its finding: **compare already spends zero engine work**, so 99
branches never meant 99 evaluations — the real cost is the O(B·N) branch rail.

## 4. `rfc/deviation-classes.md` — being rewritten, do NOT take yet

Pack **0.21**. The owner ruled `mistake` **multi-valued**; the body still
specifies a single-valued enum, so an agent is rewriting it. Taking it now would
implement the superseded design.

## 5. `rfc/transition-primitives.md` — being drafted

The move-primitive grammar, shipping **with** its Just Play and drill-pack
consumers per the owner ruling.

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
