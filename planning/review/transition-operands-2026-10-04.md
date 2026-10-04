# Review transition operand repair

D3371 repairs the live Review declaration and consumer chain under Review §3's existing
two-point contract. It changes evidence identities and execution metadata, not chess
calculations, Story ordering or title rules. It does not complete the Review or provider RFC.

## Production change

The old delta and mate-transition declarations named one eval_point although their factories
retained before and after points. The new v2 declarations contain both ordered occurrences.
Their execution paths require each endpoint's registered position evaluation and recorded
position separately. Current factories, packet adapters/parsers, Review Map, Story, voice,
presentation and inspector bindings use the exact successors. Story rank/title advance to v2
only to describe those changed inputs; their value computations are unchanged.

The four v1 capability declarations remain frozen in history, deprecated to v2, and cannot
be invoked or bound as current projections. Recorded engine deliveries remain untouched.
Packets, transitions and Story projections are computed on read, so no persisted run or
database migration is introduced. The retired mate-to-centipawn scalar remains retired.

## Permanent controls

The new actual-catalogue execution control failed against the one-input declaration. It now
requires the ordered before/after path and four distinct leaf occurrences: provider and
recorded position for each endpoint. Authority controls compare all four historical
declarations byte-for-byte, reject predecessor routes/bindings and reproduce the old payload
digests after normalizing only each transition's projectionId. Story payloads match without
normalization. Every current factory retains its positive case and falsifier.

The first full software run caught the historical convention citation check assuming every
old cited projection remained in the current manifest. That test now resolves a retained
projection only through its declared active same-subject successor and includes unknown,
future-version and non-projection negatives. Initial convention declarations and append-only
semantic history remain byte-identical. This affects citation verification, not production
evidence admission; obsolete routes still refuse.

Focused checks pass: Review runtime 33 tests, execution/provider traversal 33, value authority
24, and provider exchange 367 test executions (some files run in multiple focused targets).
Typechecking has zero errors and Svelte warnings. These are contract checks, not a new
semantic-validation verdict or real-engine performance measurement.

## Metadata preservation

`make review-transition-metadata-update` and its read-only check compare against f55c1fe3.
All 874 predecessor declarations remain unchanged; 11 successors bring the total to 885.
Four are the Review/Story v2 identities; seven advance the shared interpreter closure to v9.
The proof verifies all authored fields in 104 pack/example/fixture documents and 192 other
source documents remain unchanged. Only 104 requirement stamps and 68 associated ledger
digests are refreshed. It also preserves all 271 unaffected factory outcomes and the same
semantic-validation cases/population observations. No chess claims or content are authored.
Independent receipt: `transition-operands-metadata-2026-10-04.json`.

## Release checks and remaining scope

Complete exact-index software, content, browser, provider and governance checks pass.
The software gate passes against index tree `a14ce366068ce2c6101900d7f31896228772f59c`:
2,865 tests across 325 files, seven isolated performance tests across four files, warning-free
typechecking, build, schema/packaging, release-policy, source/value/history/lifecycle and
migration gates. Proof: `transition-operands-software-2026-10-04.json`. Verified production,
test, content, schema and tool bytes remain frozen after that software snapshot; only
verification results and tracking text follow. The 352-document migration plan has zero
mechanical, judgment, refusal or ledger-restamp rows.

Real-content checks pass 223 tests/23 files, zero clearance errors and all 104 exact
requirement declarations. Browser CI passes 111 journeys: 56 ordinary, five content,
49 viewport/input matrix and one packaged journey. One optional real-Maia latency
measurement is skipped, with zero retries. Review/import/Analyze/retry/Compare,
registered-bot reload and Campaign boss journeys pass as regressions, not full 1.0 proof.

Only D3371 closes; the tracker has zero untriaged items. Final exact-index process checks
and normal commit hooks run before commit. Nothing is pushed or published. Full source resolution, binding
absence-policy adoption, whole-manifest execution/digest, authenticated availability,
D3363's Inspector distribution and D3370's sampled-Maia source remain open. No protected
intent sentence is altered or newly falsified. Unrelated shared changes are excluded.
