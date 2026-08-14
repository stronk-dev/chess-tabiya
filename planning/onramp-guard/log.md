# On-ramp guard implementation log

## 2026-08-14 — Codex review and start

Adversarial review against the post-migration-15 tree found no design blocker. It pinned four
integration details before code: widen the explicit `PackRun` policy union; update both run-schema
policy enums; abstain on opponent-first root plies with no learner decision; and correct the
§1c migration heading from 15 to 16. The engine-evidence pair can be completed when either
recorded endpoint is applied, using the existing job-derived `engine:` reference.

Tooling deliberately not added: no out-of-band engine evaluation, polling loop, new evidence
reference, endpoint, table, or event type. Those would change the RFC's timing or honesty contract.

## 2026-08-14 — Implementation

Implemented pack schema 0.14, run schema 0.11, and frozen-literal migration 16. The guard records
rules-derived material/direct-attack grounds after the opponent consequence begins, and records a
late engine ground only when durable evals exist at both ends of the learner decision. Root
opponent plies abstain; per-consequence records deduplicate; `evalSwingCp: null` leaves rules tiers
active and disables the engine tier.

The new consumer exposed a pre-existing evidence-truth defect: Stockfish UCI scores were persisted
from side-to-move perspective despite the documented White-perspective convention. The executor now
normalizes centipawn and mate scores, with a black-to-move regression.

The client gained a non-blocking prompt plus durable timeline marker. Its browser exercise proves
post-commit timing, local play-on dismissal, reload recovery, rewind, and preservation through the
automatic fork. D28 was repaired by compiling automatic outcome rules before the optional authored
conditions branch; both trajectory drafts dropped their unlock-only material conditions.

Verification at this checkpoint: 451 unit/integration tests across 75 files; browser 22 passed with
one optional Maia test skipped, zero retries. All three exercised draft packs pass `pack-check`.

`design/BACKLOG.md` was not edited: AGENTS.md reserves design-tier changes to the owner/Claude.
The implementation and canonical docs close the code/docs work; the owner can reconcile those rows.
