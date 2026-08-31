# Work-state log

Append-only implementation record.

## 2026-08-31 — acceptance refresh and bootstrap

Re-derived the full ledger at 2,128 rows: 683 done, three refused and 1,442 live. Forty-seven live
rows have exactly one capability owner through the persistent UX register; four have conflicting
owners; the remaining 1,395 are honestly untriaged. Removed stale prose-blocker inference and
retained live-UX→terminal citations as historical evidence rather than execution ownership.

Added one raw-row export to `work-index` while preserving its existing public result and routing
contract. Bootstrapped the digest-joined state store and its able-to-fail checks. Full closeout and
verification remain pending in this entry's implementing change set.

## 2026-08-31 — RFC-owned backlog classification

Classified 870 previously untriaged rows through the live RFC register and the roadmap's
set-equal RFC ownership. Draft and awaiting RFC rows are blocked on the exact active RFC;
accepted and implementing RFC rows are todo for the owning capability; no row is labelled doing
without an active implementation. The migration refuses planning-only routes because a mention
does not establish either an execution owner or a blocker.

The resulting full census is 2,138 rows: 688 done, three refused, 139 todo, 792 blocked and 516
untriaged. Untriaged live work fell from 1,386/1,447 (95.8%) to 516/1,447 (35.7%), and the
one-way ceiling fell with it. `release-truth` returned to active because its own all-live-work-
assigned exit is not yet met; the instrument is green, the triage is not complete.

## 2026-08-31 — Full live-work ownership

Finished the source-aware classification rather than equating a planning citation with an owner.
Ten routing-queue sections assigned 147 rows, the named evidence/campaign/release work orders
assigned 79, mixed review/research/decision sources assigned 59, the Codex execution queue
assigned 108, and the RFC-drafting and defect-triage queues assigned the final 123. Each row now
names the roadmap capability accountable for taking its next executable step; none was marked
doing merely because it appeared in a queue.

The exact census is 2,138 rows: 688 done, three refused, 655 todo, 792 blocked, zero doing and
zero untriaged. All 1,447 live rows therefore have a capability owner, and the one-way untriaged
ceiling is zero. `release-truth` completes on its stated all-live-work-assigned exit; future live
rows without an owner now fail `make work-state` at creation.

## 2026-08-31 — First post-zero additions and writer repair

The first six rows added after the ceiling reached zero failed immediately while unassigned, as
designed. That live use exposed a writer defect: assigning rows persisted by a failed sync could
subtract the transition count below zero. The writer now clamps the one-way ceiling at zero; its
new regression first proves the unassigned row fails and then proves the assigned row passes
without rebasing the ratchet.

Five foundation-source findings are blocked on their exact RFC and the writer defect is closed.
The census is now 2,144 rows: 689 done, three refused, 655 todo, 797 blocked, zero doing and zero
untriaged. All 1,452 live rows remain assigned.

## 2026-08-31 — Graduation implementation checkpoint reconciled

[[D2396]] found a shipped implementation recorded as “accepted, unbuilt” in the RFC register and
two platform-alignment audits. The source RFC, register, audits and 1.0 roadmap now agree that the
writer and read-only plan shipped at `bcb706e0` and were hardened at `ec52f61d`, while pack 0.28,
emitter templates and the Gate-F-held corpus application remain open.

The census is now 2,145 rows: 690 done, three refused, 655 todo, 797 blocked, zero doing and zero
untriaged. All 1,452 live rows remain assigned; this reconciliation changes lifecycle truth without
pretending the content milestone advanced or that any pack graduated.

## 2026-08-31 — Foundation-source author repair

[[D2390]]–[[D2394]] moved from blocked to done after projection-plan v2 and the RFC separated typed
dependencies from conventions, added an authenticating recorded-decision grain, aligned source
owners with grain, required actor/decision occurrence context for every style atom and totalized
king-opposition/backward-pawn identity changes. `make foundation-source-author-repair` passes 11
positive checks; this is author repair, not independent acceptance or implementation.

The census remains 2,145 rows: 695 done, three refused, 655 todo, 792 blocked, zero doing and zero
untriaged. All 1,447 live rows remain assigned. The RFC stays blocked on its exact semantic-register
dependencies before fresh review, so the five repair closures do not widen implementation authority.
