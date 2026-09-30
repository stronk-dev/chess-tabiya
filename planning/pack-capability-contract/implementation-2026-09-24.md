# pack-capability-contract — implementation receipt, 2026-09-24

Implements `rfc/pack-capability-contract.md` (pack-schema lane 0.30) at the owner's direction with no
further review round, then lands the lanes queued behind it: `rfc/famous-games.md` lane 0.31
(`$defs/provenance.sourceGame`) and `rfc/pack-training-forms.md` lane 0.32 (as far as executable).
Genuine RFC defects were corrected inline with changelog lines; everything else is a test.

## What shipped

| Part | Where |
|---|---|
| §2.1 structured `CapabilityId`, legacy reader, canonical `requires` order | `packages/schema/src/capability/types.ts` |
| §2.7 closed inventory (v2) and stable identity (v3) | `packages/schema/src/capability/schema-members.ts` |
| §2.6/§2.7 the one derivation algorithm and the instance+schema walker | `packages/schema/src/capability/requirements.ts` |
| §4.2 public wire authority, parsed by server and web | `packages/schema/src/capability/public.ts`, `apps/web/src/lib/capability-response.ts` |
| Generated applicability image | `packages/schema/src/capability/applicability.generated.ts` (`make capability-applicability`) |
| §3/§4.3/§5 registry, module-load invariants, lifecycle | `packages/runtime/src/capability/{registry,lifecycle,declarations.generated}.ts` |
| §2.3 semantics digests through TypeScript symbol closure, lockfile packages, conventions, F1, resolved content | `apps/server/src/capability/{source-image,declarations,contract}.ts` |
| §3.1 census (four roots, five codes) and named-site reader check | `make capability-census`, `make capability-site-check` |
| §4.1 stamp checked in the single reader; one writer | `apps/server/src/capability/pack-capabilities.ts`, `pack-validation.ts`, emitters via `attachEmitterGraduationClearances`, Studio, graduation clear, `make pack-stamp` |
| §4.3/§5.1 handshake: 422, listing exclusion, boot survival; `packCapabilities` | `pack-registry.ts`, `pack-studio.ts`, `capabilities.ts`, `application.ts` |
| §5a total legacy-refusal migration with resolving authority | `apps/server/src/capability/legacy-migration.ts`, `make capability-lifecycle-check` |
| §6/§7 planner, shape check, readiness gate, applier | `apps/server/src/capability/migration{,-cli}.ts`, `make migration-plan[-check]`, `migration-apply-ready`, `migration-apply FILE=` |
| §4.1a same-commit migration | 92 documents (86 production + 6 browser fixtures) stamped; 68 evidence ledgers re-stamped; schema example and 10 schema fixtures stamped with their layout kept |
| Lane 0.31 | `schemas/drill_pack.schema.json` `$defs/provenance.sourceGame`; masters emitter writes it; sidecar retired |
| Lane 0.32 | `assistanceCeilingRamp`, `$defs/trainingSet`, `apps/server/src/training-set-validation.ts`, `packages/runtime/src/training-forms.ts` |

Wired gates: `verify-software` gains `capability-applicability-check capability-check capability-census
capability-site-check capability-lifecycle-check migration-plan-check`; `verify-content` gains
`pack-capability-check`.

## Criteria → tests

`packages/schema/src/capability/capability.test.ts` (1, 3 algorithm, 4/18 identity, 8 wire);
`apps/server/src/capability/pack-capability-contract.test.ts` (2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
15, 16, 17, 18 single reader); `apps/server/src/capability/pack-capability-corpus.test.ts` (content
tier: 3 corpus, 12/18 population, 13 D566, 19 author contract). Famous-games criteria 3 and 9:
`apps/server/src/sourcing/masters.test.ts` and the register. Training forms 1–12:
`apps/server/src/training-forms.test.ts`.

## Findings worth a ledger row (proposed; this change set does not write the ledger)

- `unauthoredTempoTransition` (`packages/runtime/src/tempo.ts`) has no production caller; the
  unauthored outpaced default is published but never applied (found by `capability-site-check`).
- The census found 16 undeclared interpreters of pack vocabularies, among them
  `expression-satisfiability.ts` (a validator that decides admission by vocabulary member) and
  `structural-evidence.ts#evaluateNode`; all are now declared.
- The ramp's design/05 rung numbers have no shipped projection onto the nine-field assistance clamp;
  choosing it is the ADR-0006 half of `pack-training-forms` open question 1.
- Stored community/playtest packs in existing databases predate `requires`; `hydrate()` serves them
  unvalidated as before. Re-stamping persisted user packs is a storage migration not in this lane.

## For the coordinator's closeout

`rfc/README.md` Active rows for `pack-capability-contract.md` and `pack-training-forms.md` still read
**draft** while their bodies read **implementing** (status-parity P2). The pack-schema register
(head 0.32, landed 0.30/0.31/0.32, live claims removed) is updated. No `design/00`–`06` sentence is
falsified by this change set.
