# Review evidence compiler — implementation receipt (2026-09-24)

Implemented directly at the owner's direction (no review round). RFC status: `implementing`.
Laws: no LLM chess truth (every sentence is a registered deterministic renderer over retained
operands); no `archive/` or `design/` byte changed; no ledger/log/roadmap/work-state edit (the
closeout rows are left to consolidation).

## What landed

| surface | file |
|---|---|
| Five Review projections + forced-mate v2 (catalogue, factories, routes, pinned profiles) | `packages/runtime/src/evidence-catalog.ts`, `evidence-factories.ts`, `internal/evidence-value-routes.ts`, `fixtures/evidence-value-profiles.json` |
| Typed payloads and pure comparisons | `packages/runtime/src/review-points.ts` |
| Prefix subject, adapter registry, plan, sealed results, packet, folds, abstentions | `packages/runtime/src/review-evidence.ts` |
| Story compiler over the packet, `review-story@1` receipt, parser, public projection | `packages/runtime/src/story.ts` |
| Review Map panel over the packet through `module.review_map@1` | `packages/runtime/src/review-map.ts`, `apps/web/src/lib/ReviewMapScreen.svelte`, `apps/web/src/lib/evidence/PresentedEvidence.svelte` |
| Attempt store and the one coordinator | `apps/server/src/review-evidence.ts`, `application.ts`, `service.ts` |
| Mock-engine deployments over the one exchange | `apps/server/src/mock-provider-engine.ts` |

`derived.story.eval_shift@1` is retired; `STORY_MATE_CP` and every mate→±1000 conversion are gone
(including Compare's eval delta, which now skips mate operands). semantic-collectors D2 is recorded
discharged.

## Criteria → tests

| criterion | test |
|---|---|
| 1 typed shared delivery | runtime `review-evidence.test.ts` "normalizes White/Black cp and mate once…" |
| 2 no move leak | "admits no best move, PV or MultiPV bytes…"; server `review-evidence.test.ts` wire check |
| 3 identity | "normalizes White/Black cp and mate once…" (exact-FEN join, node-free source) |
| 4 legacy | "keeps legacy attached eval rows readable but abstains them legacy_provenance_missing" |
| 5 WDL normalization/occurrence | "normalizes raw WDL by identity/swap and joins one normalization to two occurrences" (C4 figures not reproduced — open) |
| 6 cp-only delta | "computes cp→cp deltas only and abstains every mate operand" |
| 7 comparable operands | "abstains across one-character engine version, generation and bound mismatches" |
| 8 mate transitions | "fixtures appearance, disappearance, side and distance changes…" |
| 9 no sentinel | criterion-6 test sweep + "renders cp pivot, mate transition…" |
| 10 exact-proof occurrence | packet links only through `run.record.edge@1` endpoints (`compileReviewEvidence`); v2 factory profile pinned; v1 never linkable (no v1 adapter) |
| 11 partial packet / total fold | "requires exactly the planned source population…", "retains every adapter row per family…" |
| 12 production idempotence | server "imports, enriches in bounded windows over the scheduler only…", "uses only ensureBranch and the scheduler…" |
| 13 bounded completion and attempts | server `ReviewAttemptOutcomeStore` suite (3 tests), "states provider failure… retry_exhausted without looping", "keeps outstanding work within the per-run bound…" |
| 14 completion truth | "retains every adapter row per family…" (progressive + degraded), server failure test |
| 15 prefix authority | "derives the prefix subject from storage only and replays it" |
| 16 manifest/adapter closure | "plans node slots everywhere…", `evidence-catalog.test.ts`, `module-registry.test.ts`, `evidence-value-authority.test.ts` |
| 17 closed wire | "refuses crossed subjects, unknown keys…", "projects the public story strictly…", web `story-response.test.ts`, server `adoption-wave.test.ts` |
| 18 Story compatibility | "renders cp pivot, mate transition and learner-relative last-level…", "gives sign-mirrored White/Black learners the same last-level node", "ranks nine bands…", `story.test.ts` |
| 19 performance | "stays within the local performance bound" (reported only; the 661-position p95 is open) |
| 20 closeout | RFC status + this receipt; ledger/log closeout deliberately left to consolidation |
| 21 one engine authority | server census test; `provider-traversal.test.ts` mock-deployment exchange |

## RFC text corrected inline

Comparability (position-free command image, requested bound), the rank tail order (HEAD's shape,
other, irreversibility), the vacuous mixed tie rule, and `ReviewEvidencePacket.completion`.

## Open

In-domain tablebase request; runtime opening items (D2); C4 figure reproduction; the measured
criterion-19 bound; D1 (Review Map policy) and D3 (owner use).

## Evidence-job durability

The evidence-job-durability store reached main (migration 27) before this landing's final merge. Its
`story_completion` enqueue owner admitted legacy eval jobs for Story; this RFC supersedes it (§4.1:
import and story reach only `ensureBranch` over `ProviderExchangeScheduler.get`), so
`#ensureStoryEvidence` is removed, the owner census asserts the supersession, and
`rfc/evidence-job-durability.md` records it. The job store keeps explicit analysis and run
enrichment. Review durability is the run event log (re-derivable typed deliveries) plus the bounded
application-lifetime attempt store.
