# Ordered derivation occurrences — 2026-10-04

## Scope and authority

Implements the ordered-input/multiplicity prerequisite of `rfc/provider-exchange-and-execution.md` §1, tracked by D3359. This does not complete compiled execution paths, binding source-absence aggregation, exact-subject availability, Maia occurrence projections or any 1.0 milestone.

The owner explicitly said metadata/hash updates are not a decision to interrupt implementation for. For this change, update canonical requirements and matching evidence-ledger digests mechanically, retaining every committed declaration at its original version. No authored move, objective, strategic claim, binding, shape, principle or graduation status may change. Do not weaken migration-readiness or history checks; their judgement rows remain truthful until this verified release-specific migration is applied.

## Regression

The normal `make provider-exchange-check` first fails two tests: repeated inputs are rejected as `EVIDENCE_PROJECTION_INCOMPLETE`. The compiler also sorts member identities, incorrectly conflating reversed inputs. Literal members now preserve order and repeated occurrences; duplicate **alternatives**, empty members, unknown dependencies and cycles remain refused. Semantic-event members must match exact ordered projection members, including multiplicity. This is a declaration-level repair, not proof that two runtime provider deliveries have already been joined correctly.

The provider target includes the permanent compiler tests. Before/after ordered-member, repeated-source, dropped-occurrence, reversed-event, identical-alternative and independent narrowing controls run alongside the existing composed provider HTTP fixtures.

## Verification

`make provider-exchange-check`: 166 tests pass, including the two original red compiler fixtures and the authenticated composed HTTP controls. `make verify-software`: 2770 tests/318 files, seven performance tests/four files, zero type errors/Svelte warnings and all downstream contracts pass. `make verify-content`: 223 tests/23 files, zero clearance errors and all 104 exact requirement declarations pass. `make test-browser-ci`: 111 journeys pass, with one optional real-Maia latency skip and no retries. GitHub has not been invoked or pushed.

The measured metadata-only migration retains all 827 committed declarations and adds eight next-version successors (835 total), retaining the predecessors' source and dependency identities. All 104 pack/example/fixture documents retain their authored fields; 129 requirement version transitions and 68 ledger packDigest changes are applied. The planner's 352-document population has zero remaining mechanical, judgement, refusal or ledger-restamp rows. Shapes, principles, publication status and user-stored documents are untouched. See `derivation-occurrences-metadata-2026-10-04.json` for the independent comparison against b11bccd7.

Generated semantic validation is current: 81 subjects, 38/38 passing cases, 53 population receipts and eight external receipts, still zero fully validated profiles. This repair does not discharge validation authority, source joins, availability or consumer migration. Normal governance and exact-index closeout checks run before commit.

Final `make verify-governance` and `make staged-process-contracts` pass. All 192 explicitly owned staged files byte-equal the verified working files; unrelated shared edits are excluded. The roadmap remains active with no whole capability/milestone promotion, and work-state has zero unrouted/untriaged items. Normal commit hooks remain enabled.
