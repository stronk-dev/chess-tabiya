# Provider exchange and execution — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/provider-exchange-and-execution.md` after the [[D1860]] amendment

**Verdict:** **RETURNED.** The shared provider boundary is the right dependency for collectors,
Review, bots and Support. Implementation is not authorised from the current contract.

## Method

The pass read the complete RFC and all four named exploration dossiers, then re-derived the
implementation-critical claims at HEAD:

- F1's literal projection, derivation, adapter, binding and manifest compiler types;
- the current global `/capabilities` route and evidence-manifest capability projection;
- `EngineSupervisor.execute`, its health/identity boundary and serialized request queue;
- Stockfish/Maia request construction and UCI parsing in `OpponentSelector`;
- both Explorer parsers/caches and the Syzygy source/cache;
- the five proposed operation signatures, three migration operations and scheduler protocol;
- every acceptance criterion that claims a negative or a production-reach witness.

The review did not edit the concurrent D872 tactical harness or the untracked `planning/review/`
work.

## What survives

The architectural direction is sound. F1 should compile executable derivation paths instead of
trusting a derived producer's local label. Provider operations should share bounded scheduling,
exact request identity, cancellation and same-exchange provenance. Stockfish position evaluation
belongs beside the legal-root operation rather than in a private Review/bot adapter. Explorer must
preserve sparse source truth and move sample policy downstream. Maia history-conditioned and
exact-FEN requests must remain distinct. Syzygy provider absence must remain distinct from
outside-domain and chess outcomes.

Those decisions are useful, but eight literal seams prevent a conforming implementation.

## Blockers

### 1. `/capabilities` has no subject for cache/path satisfaction ([[D1871]])

The RFC requires `/capabilities` to return per-projection satisfiable path identities and to
distinguish live, recorded and cached availability. The production route is a global parameterless
GET (`rest.ts:951-960`). `evidenceManifestCapabilities` receives only global provider/configuration
state and currently maps producer ids to that state (`evidence-manifest.ts:90-117`).

A retained Explorer page, Syzygy response or recorded evidence item is available for one exact
request/position, not for every subject using the projection. The proposed compiled `paths` also
carry no stable path id. A global response therefore cannot truthfully assert cache satisfaction,
and there is no identity for the response to cite.

Keep global static/provider reach on `/capabilities`; define a subject-bound availability operation
for an exact request/run/module, or narrow the claim. In either case, publish the deterministic path
identity derived from choices and source leaves and fixture same projection/different subject.

### 2. Acquisition and cache-delivery provenance occupy one contradictory field ([[D1872]])

`ProviderExchangeReceipt.cache` is `live | retained_exact` (RFC lines 159-170). The next rule says a
cache hit retains the original receipt (lines 173-176). A live acquisition's immutable receipt must
therefore still say `live` when returned from cache. Changing it to `retained_exact` makes the
receipt a new object and destroys the rule that the original receipt is retained.

Split immutable acquisition provenance from delivery provenance. The original receipt keeps its
request/retrieval/digests; a delivery envelope can state live versus retained, served time and cache
identity. A live→retained fixture must prove retrieval time is unchanged while delivery state changes.

### 3. Maia run occurrence drops the request history ([[D1873]])

The source contract correctly says equal final FEN with different history is not an equal Maia
request (RFC lines 309-327); production builds the command from `startFen + historyUci`
(`opponent-selector.ts:311-315`). The proposed occurrence then joins only the page, recorded
position and recorded move (RFC lines 334-337).

Two transposed histories can therefore attach the wrong policy page to a run occurrence while
final-position and move equality both pass. The history-conditioned occurrence must retain the
authoritative run start and exact path/move sequence and compare it to the page request. An
exact-FEN page needs a separate literal occurrence member rather than silently sharing that proof.

### 4. The legal-root operation conflicts with current capability truth and omits bounded scores
([[D1874]])

The RFC's all-legal table requires MultiPV outside the existing `enumerate` operation. The live
capability register explicitly refuses `MultiPV > 1 outside enumerate`
(`capabilities.ts:122-128`). Shipping both makes the register false on the same commit.

The proposed row also stores a cp/mate value with no bound state. The production parser already
detects `upperbound`/`lowerbound` and refuses to treat those lines as scores
(`opponent-selector.ts:317-337`), but the RFC's legal-root negative set names only missing,
duplicate, extra and short-depth rows. A bounded line can therefore satisfy the drafted payload and
be rendered as a measured score.

The amendment must update the capability disposition for this exact measured use and reject every
bounded/incomplete score line. Add one refusal fixture for each UCI bound token and a register test
that cannot leave the old refusal standing.

### 5. Explorer has no literal payload contract ([[D1875]])

Stockfish, Maia and Syzygy publish interfaces. Explorer only says an operation returns an
`ExplorerPositionPageReceipt`, then lists desired fields in prose (RFC lines 362-379). Criterion 6
nonetheless requires all five payload declarations to match the sections literally.

There is no literal union for zero population, source abstention or optional history/opening data;
no exact request type; no row type retaining canonical and provider SAN; and no representation for
listed/unlisted mass or cache/source fields. Criterion 10 cannot tell a faithful implementation
from a lossy one because the expected value does not exist.

Publish the closed request, success, domain-result and source-failure types before review. Bind the
captured-response fixture to that exact type and to the shared normalizer output.

### 6. Per-binding source absence has no total aggregation algebra ([[D1876]])

The proposed adapter field has three values, including `omit_optional_item`, but no binding field
declares whether an item is optional. The RFC then says the existing consumer `providerOff` scalar
is generated from bindings without defining precedence or the behavior of mixed local, recorded,
live-alternative and provider-only paths (RFC lines 136-146).

An implementer cannot derive whether one unavailable provider suppresses an item, settles an empty
module, or makes the whole operation unavailable. Publish binding necessity and a total
path→binding→consumer aggregation table. Cross fixtures must include local+provider,
recorded-or-live, two providers with different failures and all-provider-absent.

### 7. The scheduler consumes and returns undefined types ([[D1877]])

`ProviderExchangeScheduler.get` names `TypedProviderRequest<T>` and `TypedProviderResult<T>`, but
neither type exists in the RFC or repository. That missing protocol is where the scheduler needs
the canonical key, operation discriminant/callable, weight, success/failure union and receipt
construction. Without it, each of the five operations can implement a private queue/cache and still
appear to call the generic signature in a constructor test.

Publish the closed operation request/result union and the exact scheduler-owned execution hook.
The application census must be set-equal to that union and fail when an operation bypasses `get`.

### 8. Actual engine generation is required before the exchange that establishes it ([[D1878]])

The same-exchange rule correctly says health cannot label later bytes and actual generation must be
captured inside the serialized engine task (RFC lines 173-181). Section 5.1 then requires generation
inside the normalized request key before dispatch (lines 297-300). A cold engine has no actual
generation; a restart between admission and execution makes a preflight value stale.

Key pending work on requested engine/spec, bound, commands and timeout. Capture actual
identity/generation inside the exchange, compare it at completion and use it when deciding whether
a retained result remains admissible. Do not reclassify actual generation as a caller request byte.

## Required amendment order

1. Define the scheduler request/result/execution protocol and requested-versus-actual engine
   identity (D1877/D1878).
2. Split acquisition receipts from delivery/cache provenance (D1872).
3. Define stable compiled path ids and separate global reachability from subject-bound satisfaction
   (D1871).
4. Publish binding necessity plus the complete source-absence aggregation algebra (D1876).
5. Publish the literal Explorer request/result unions (D1875).
6. Repair Maia occurrence subject equality (D1873).
7. Reconcile legal-root MultiPV with the capability register and reject bounded lines (D1874).
8. Re-run literal F1 compilation, operation-census, same-subject, cache, cancellation and source-off
   negative fixtures, then send the amended RFC through another independent buildability review.

No owner ruling is required. These are contradictions or missing technical contracts inside the
already ruled shared-provider direction. No schema, migration, pack, run or content-resource claim
is implied by the return.
