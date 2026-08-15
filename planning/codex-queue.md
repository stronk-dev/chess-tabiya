# Codex queue — 2026-08-15

Ordered. Take the top unstarted item; do not wait for anything below it.
Register lanes are pre-assigned and reconciled in `rfc/README.md`, so items
1–3 cannot collide with each other and may be taken back-to-back.

## 1. `rfc/authoring-frictions.md` — READY NOW

Cross-reviewed (11 blockers fixed), then **patched again 2026-08-15**: §8's
"zero runtime code changes" was false and would have shipped a new D32 inside
the wave meant to prevent it — `RULES_EVIDENCE_FACTS` has no bare `"draw"`
(`packages/runtime/src/evidence-ref.ts:1-26`) and `rulesEvidenceRef` throws
outside that list, so the widened enum would pass `pack-check` and throw when
played. §8 now also adds `"draw"` to that list, with a test that proves the path.
**If you already started this wave, re-read §8.**

Claims pack schema **0.16**, no migration (register stays 18), no run-schema
change. Eight authored frictions ordered by attestation, plus the D30 draw-outcome
fix (§9 — a runtime behaviour change; honour the normative ordering and the
`runtime.ts:280` commit-guard widening) and the cursed-win admission rule (§8),
whose design-tier text is now written at `design/01-training-model.md` §Outcome
types.

## 2. `rfc/validator-integrity.md` — in cross-review, start after item 1

Claims **nothing versioned** — no pack-schema bump, no migration, no run-schema
change — so it can land in parallel with any other wave. Fixes D32 (seven of
twelve objective types can pass validation and crash during play; independently
confirmed by your own audit `6c7a579`), D33 (trajectories cannot be
`ledger_verified`), and D37 (an archived RFC registered `implemented` whose
`objectiveIssues` extraction never shipped).

## 3. `rfc/tempo-vocabulary.md` — in cross-review

Pack **0.17**. Unblocks the E3 and B4 gates. A timing window becomes a ledger
kept between two events; computes the three tempo mistake classes named in
`design/01-training-model.md:146-149`; implements `preserve_plan_window`.

## 4. `rfc/predicate-wave-3.md` — awaiting cross-review

Pack **0.18** **and shape-entry 0.2 → 0.3** (the shape schema carries a
duplicated `$defs/structuralFeature`; new leaves must land in both copies or
shape triggers silently cannot use them).

## 5. `rfc/resistance-spectrum.md` — awaiting cross-review

Run schema **0.14**, migration **19**. Ships `practical_resistance`; proves
`fallible` should not exist as a mode and fixes the unconditional
`setoption name Elo` instead.

---

## Standing work — take whenever the queue above is blocked

**A. Refusal-code test coverage.** Your own audit (`6c7a579`) found 78 refusal
codes, **33 directly test-pinned, 45 with no direct coverage**. Pin them. Purely
mechanical, no design input needed, and it hardens every wave above.

**B. D39 / D40** (from the same audit) — decimal `material_balance`
equal-conditions are schema-valid but impossible since runtime material is
integral; `winner` is accepted for `stalemate` and then ignored. Both are the
"validator blesses the impossible" family. If `validator-integrity`'s review
folds them in, they belong there; if not, they are small standalone fixes.

## Protocol reminders

- **The ledger flip rides in the implementing commit**, not just the RFC
  register. The last two waves both missed this and it was patched afterwards.
- Cite `design/BACKLOG.md` rows by **row title**, never by line number — ledger
  lines move, and every citation in one RFC went stale by three lines mid-review.
- Gates before done: `ENGINES_REQUIRED=1 make verify` and `make test-browser`,
  zero retries. Baselines: 474 tests / 80 files, browser 24 (one optional Maia
  skip).
