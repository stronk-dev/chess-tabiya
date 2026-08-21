# Semantic evidence selection — implementation plan

**RFC:** `rfc/semantic-evidence-selection.md`  
**Status:** implementing  
**Started:** 2026-08-21

## Boundary

Implement F2 exactly: 22 direct event projections, eleven derived avoidance projections, the
research-only eligibility/policy surface, complete legal-alternative selection, and D668's exact
adapter seal. Do not add learner-visible modules, tactic/plan names, production defaults, schema or
content changes.

## Landing units

1. **Compiled contract.** Extend the F1 declarations/compiler/digest with 33 semantic events, 33
   eligibility rows, 15 reasons and one research policy. Add the fifteen exact error codes,
   declaration validation, runtime event/selected-view seals, negative fixtures and count closure.
2. **Literal event producers.** Preserve identities for the eleven round-trip structural families,
   five transition-geometry families and six independent rules events without changing old count
   readings. Canonicalize castling and retain complete operands.
3. **Selector and avoidance derivation.** Enumerate every chessops legal alternative, require a
   complete population, apply the versioned policy deterministically, construct eleven registered
   avoidance projections and reproduce the R2 authored/imported baselines.
4. **D668 seal.** Replace all 38 generic construction calls in the fourteen-file closure with exact
   source adapters; remove `declareEvidence` from the runtime package export; reject a fifteenth
   call site and runtime forgeries.
5. **Integration and closeout.** Add `make semantic-evidence-check` to `make verify`, capability
   counts, `docs/semantic-evidence.md`, full unit/browser verification, ledger discharges and
   append-only logs. Archive only after every RFC discharge is closed.

## Verification

- Focused runtime/compiler/producer/selector suites after each landing unit.
- R2 retained fixture: 108 games, 579 decisions, all nine strata, digest pinned.
- `make verify` and `make test-browser` before closeout.
- `git diff --check`, register/status/intent parity, manifest count tuple
  20/126/25/175 + 33/33/15/1.

## Holds

- F3 remains behind O6/Gate F.
- F5 owns learner-visible modules, production policies, presets and defaults.
- No content mutation or schema/version claim is permitted.
