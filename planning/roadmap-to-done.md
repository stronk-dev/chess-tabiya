# Roadmap to done

"Done" is the owner's ruling: **full features, full content, then the owner
plays once** — with the invariant review (`design/05` §1) attached to that first
session. This file is the single checkable index of completed vs open. Updated
as waves land; not append-only. Where a row needs detail, it cites the ledger
(`design/BACKLOG.md`) — every idea has a row there; this file is the rollup.

## 1. Features (code)

| Item | State |
|---|---|
| Breadth B1–B11 | ✅ complete 2026-08-14 |
| Parallel wave: predicate-wave-2, corpus-evidence, adoption-wave-1, social-match | ✅ shipped 2026-08-14 |
| Structural round: repertoire gap-finding, onramp-guard (+D28) | ✅ shipped 2026-08-14 |
| Structural round: open-answer grading | ✅ shipped 2026-08-14 — **the feature roadmap is down to the polish wave** |
| **Polish wave — the LAST feature wave** (RFCs drafting): (a) surfaces — PWA/responsive, `/settings` controls, form slices (lighting, arrows/halos, ambient, TTS provider); (b) orphan four — narrative mode + difference strips, session distillation, recommender; (c) grounding pair — `verify-draft`, `perfect_tablebase` policy | ✅ SHIPPED 2026-08-14 (`765efb5`, `0939070`, `2fd82be`) — the feature column is empty; 474 tests / 80 files, browser 24 zero retries, run 0.13, storage 18, no active product RFCs |
| **Gamification cluster** (needs RFC **and** research/mileage first — deliberately post-session): Spire map, encounter unlocks, pack-opening ceremony. Rulings already made: library stays open, map gates its own rewards, ADR-0007 progression never for sale | 📋 post-session by design |
| Orphan triage | ✅ ruled 2026-08-14: all four scheduled into polish; events layer consciously parked behind B5 revival |
| Ledgered, unscheduled: position-scan import, personal-model opponent, per-position threads, B5 depth (native pool, follower feeds), board-hardware integration | 💤 parked |

## 2. Content

| Item | State |
|---|---|
| Shape library | ✅ 23 entries (all endgame + middlegame families + residue). **2 commissioned, unauthored:** London wedge, KID arrangement chain |
| Packs: batch 1 + wave 2 openings + 2 trajectories | ✅ 12 committed |
| Wave 4a openings (next priority tier + anti-KID/London/Dutch), 5a on-ramp (guard-enabled + emitted seeds), 5b endgames (Lucena/Philidor/opposition/…) | ✅ all three landed; **39 packs committed** total |
| Remaining opening families to full §2 map; endgame variants breadth; more trajectories | 📋 final batches. **Theoretical mates ✅ shipped 2026-08-14** (K+Q, K+R, two bishops, Philidor convert — all four `ledger_verified`). Scandinavian wave-4b deferred on depth-commensurability; **B+N mate awaits an owner ruling** |
| Engine-validation passes over authored claims | 📋 before session. **Partial progress:** tablebase grounding is now real — 10 endgame/mate packs carry `ledger_verified` evidence sidecars via `make verify-draft`. What remains at zero is *engine* (Stockfish) validation of **middlegame/opening** authored claims, which no tablebase can settle |

## 2b. The reconciliation gate

✅ **First run complete 2026-08-14**: forward trace (6 orphans → homed; 2 gate
misstatements → corrected) and reverse trace (12 MISSING → absorbed; ~16 stale →
fixed; full edit list applied). Process fix standing (ledger flips in the
completion protocol). **Re-run cheaply after the last feature wave** — done is
not declared while either list is non-empty and untriaged.

## 3. The session itself

When 1 and 2 are checked: the owner plays — Just Play with guidance off, a
curated drill, a trajectory, an own-game import with its story, one match with
a second human. Then the invariant review, ruling by ruling, against felt play.
Findings become the final polish wave — and the Spire map RFC follows the
session, shaped by it.

## Explicitly not blocking done

Community/social depth beyond match+friend-links, native matchmaking, mobile
native apps, monetization (Q2 axes open by choice; ADR-0007 binds progression
regardless), public launch anything.
