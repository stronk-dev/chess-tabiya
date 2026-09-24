# Evidence presentation Checkpoint A — implementation receipt (2026-09-24)

Implemented directly at the owner's direction (no review round), scoped to what the Review
compiler needs plus the module-registration A5 slice for the executable Review Map pairs and the
[[D1673]] claim slice. RFC status: `implementing`. No `archive/` or `design/` byte changed; no
intent sentence was falsified (design/05's form inventory stays the channel layer; Discharge D1 is
unchanged).

## What landed

- `packages/runtime/src/presentation-contract.ts`: fourteen `COMPONENT_DECLARATIONS` (eight fields
  each), operand types for all fourteen, runtime parsers/renderers for `magnitude`,
  `fact_statement`, `abstention`, `claim`, `citation`, `enum_state`; `ConventionReceipt` derived
  from the same delivery; `PRESENTATION_ADAPTERS` (exact consumer × projection keys, retention
  assertions, declared source operands); `presentEvidenceItems`; process and client seals;
  `presentation.receipt@1` with `serializePresentedEvidence` / `parsePresentationReceipt`;
  `assertPresentationText` (`PRESENTATION_RAW_ID`); label vocabularies used by the landed adapters.
- `apps/web/src/lib/evidence/PresentedEvidence.svelte` renders parsed items; abstention alone
  carries `data-abstention`. `claim-presentation.ts` renders the claim seat through the adapter.
- Checkpoint P operations landed: the consequence operand repair and the Explorer result-reason
  authority; the source-attribution registry (resource identity only).

## Seventh-return defects closed in production

| row | production closure | tests |
|---|---|---|
| D3102 | `citationFromEvidence` reads the retained field; `valueDigest` binds the text | `presentation-contract.test.ts` "reads citation text from the exact retained evidence field…" |
| D3103 | `corpus-result.ts` tuple + complete-arm parser; server/web/catalogue join; factory admits only the complete arm | `corpus-result.test.ts` (4), `presentation-checkpoint-p.test.ts` explorer rows |
| D3104 | abstentions issued only by the sealed Review packet with its own invocation id and decision stamp | `presentation-contract.test.ts` "issues abstentions only from the sealed packet that asked…" |
| D3105 | production `STRUCTURE_PREDICATES` + `evaluateNamedStructureWithWitness` (one traversal); `structuralReading` emits witnesses | `structure-witness.test.ts` (4) |
| D3106 | behavioral P fence (landed rows by postimage, open rows by preimage) | `presentation-checkpoint-p.test.ts` (13) |
| D3107 | `sourceAttributionRegistryDigest` only for the branded complete parsed image | `source-attribution.test.ts` (5) |

The disposable author model (`tools/d1862-presentation-adapter-plan/plan.ts`) and the seventh
review harness are unchanged historical evidence.

## Criteria → tests (landed subset)

| criterion | test |
|---|---|
| 1 fourteen declarations, eight fields | "declares exactly the fourteen §3 ids…" |
| 5 raw-id guard + vocabulary totality | "guards every component text boundary…" |
| 7 convention travels with the number (type + DOM/wire) | "builds magnitudes whose convention is derived…" (`@ts-expect-error` arm) |
| 16 equivalent sentence from the sealed operand | "round-trips through the closed receipt…"; web review map DOM test |
| 21 sealed, owner-bound path | "refuses literal, spread and JSON forges…", "refuses an admitted projection with no registered adapter…", claim slice test |
| 21a fact statements | "recomputes fact-statement text from retained operands…" |
| 21b abstention lifecycle | "issues abstentions only from the sealed packet…" (`@ts-expect-error` arm) |
| 2 (review.story population) | "maps every review.story@1 binding to exactly one adapter…" |

## RFC text corrected inline

§3.10 binding vocabulary `self_declared` (shipped) not `author_declared`; §3.8 `valueDigest`;
§3.11 pending `stage`.

## Open

Six Checkpoint-P operations (story rank, opponent/repertoire reclassification, pack phase payload,
named-structure payload witness squares, citation derivation), eight declared-only components, the
full §6b label registry, `make label-sweep`, `make component-coverage`,
`make component-theme-sweep`, criteria 3/4/6/8–15/17/19/20/22 and Checkpoint B (all module seats).
