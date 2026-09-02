# Deflection check authority — code audit and author contract

- **Date:** 2026-09-02
- **Row:** [[D2536]]
- **Gate:** `make semantic-collectors-deflection-authority-author-contract` — 4/4 plus strict TypeScript
- **Production authorization:** none; fresh independent review required

## Verified gap

The implemented `deflectionObservedOperands` accepts either an edge-2 capture of the bait or an
edge-1 move that gives check. The compiled manifest for `derived.tactic.deflection_observed@1`
declares only the common recorded-move, duty, capture and legal-exchange inputs. Its emitter has no
check-evidence argument, so the legal check-induced `Ra8+ Rg8 Rxe7` line currently emits a sealed
deflection event whose derivation omits the fact that selected that arm.

This is not a missing learner sentence. It is a producer-authority defect: downstream modules can
name the check arm, but F1 cannot prove it from the event's retained inputs.

## Contract repair

The amendment keeps the projection id and operands and replaces the single derivation member with
two exact members: the current common set, and that set plus `rules.tactic.event.check@1`. The
emitter consumes the sealed check semantic event, including its exact edge-1 anchor, only on the
check-induced member.

The arm choice is deterministic. A valid bait capture wins even if the bait move also checked; a
check event supplied there is refused. Without a bait capture, an exact edge-1 check event is
mandatory. Missing, crossed-edge, unnecessary, wrong-projection and unsealed check inputs all fail
before emission. Both recorded-path compilers must forward their already-compiled edge-1 check
event.

## Boundary

The disposable model selects only between already-validated facts; it performs no chess detection
or judgement. No production, manifest, API, schema, UI, content or protected-design byte changes in
this author checkpoint. Fresh independent review must attack derivation widening, double-identity,
anchor equality and both path call sites before the existing producer may change.
