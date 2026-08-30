# Provider-exchange fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/provider-exchange-and-execution.md` after the D2032–D2036 fourth-return repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make provider-exchange-fresh-review` — 7/7 blocker arms
- **Prior contracts:** 9 + 7 + 9 + 5 all remain green
- **Production status:** untouched; provider implementation remains forbidden

The fourth repair correctly preserves repeated source occurrences, composes run authorization,
separates local Syzygy domain truth from provider acquisition, splits monotonic and civil clocks,
and keeps module policy downstream. Those choices survive. Seven remaining seams still require the
implementer to choose evidence identity, runtime trust or production reach and therefore prevent
acceptance.

## B1 — structural receipt objects cannot satisfy runtime-forgery refusal ([[D2056]])

`ProviderAcquisitionReceipt` and `ProviderDelivery` are public structural object types
(§3:362–393). The prose says descriptors/callers cannot construct, cast or spread them, while
criterion 19 explicitly requires runtime double-cast forgeries to fail. No private symbol, WeakSet
seal or assertion API exists in the contract. TypeScript visibility cannot reject a forged object
at runtime; `{...realDelivery}` also has exactly the published shape. HEAD already demonstrates the
required mechanism in `packages/runtime/src/evidence-contract.ts`: declared items and compiled
views use private WeakSets and assertions, and serialization/spread forgeries fail tests.

**Required repair:** specify one scheduler-owned runtime seal for acquisition + delivery and one
assertion used by every provider source adapter. Cross plain-object, spread, JSON round-trip,
wrong-operation and genuine scheduler-minted positives. A TypeScript-only brand is insufficient.

## B2 — run-event and recorded-item identity has no byte authority ([[D2057]])

The public subject accepts `eventHeadDigest: string`; the result invents `subjectDigest`; recorded
leaves add `evidenceItemDigest` (§2:211–247). No digest domain, canonical image, prefix, constructor,
event-prefix rule or collision/ambiguity behavior is specified. The six-domain provider registry
does not own these run identities, and HEAD contains no `eventHeadDigest` symbol. The shipped
`requireRead(storage, runId, principal)` proves access to a run, not which historical event prefix
or evidence item the supplied string names.

**Required repair:** name a domain-separated run-subject digest authority over an exact canonical
event prefix and evidence-item image, define current and historical head resolution, brand the wire
types, and make unknown/ambiguous/cross-run identities fail before any cache/source state is read.

## B3 — retention TTL admits both absolute and sliding caches ([[D2058]])

The scheduler constructor takes `retentionTtlMs`; hits receive a later `servedAt`; eviction orders
least-recently-served entries (§4:522–720). Nothing says whether TTL age begins at retrieval/admission
or the most recent cache service, whether a hit refreshes it, which monotonic samples are stored, or
whether equality expires. Absolute and sliding retention can keep different provider generations
available while passing the generic “deterministic expiry” fixture.

**Required repair:** publish the retained-entry state and exact transitions, including admission
sample, last-service sample, TTL basis, hit refresh/non-refresh, and `<`/`>=` boundary. Cross a hit
immediately before expiry and a lookup exactly at expiry.

## B4 — exact provider identity still contains arbitrary strings ([[D2059]])

Every acquisition carries `endpoint: string`, but only network actual-identity arms contain an
endpoint and the constructor checks equality only for those arms (§3:340–408). Stockfish and Maia
endpoint bytes are unconstrained. `cacheIdentity`, pending `normalizedRequestDigest` and retained
`actualIdentityDigest` are also plain strings without exact images. Maia's `runtimeDigest` has no
declared derivation from the live `EngineIdentity`, whose actual fields are `modelId` and optional
`containerDigest` (`apps/server/src/engine-supervisor.ts:15–24`). These values enter evidence and
retained admission.

**Required repair:** define exact per-operation endpoint and actual-identity projections from live
symbols, brand every digest, and define `cacheIdentity` as a named closed digest/image. Refuse empty,
copied-request, wrong-engine and same-receipt/different-identity variants.

## B5 — the five required traversals are descriptions, not doors ([[D2060]])

§9 requires one “real operator/research traversal” for each provider operation, but its table names
only English units. §4 describes the five `*Operation` exports as descriptor objects; criterion 14
then asks the application census for five exported callables. No application method, authenticated
HTTP operation, CLI command, Make target or exact callable symbol/request owner is named. A
constructor-connected descriptor can satisfy the current census without anyone being able to run
the traversal, repeating the roadmap's direct-handler-versus-production-door failure.

**Required repair:** name the production application operation(s), request/auth boundary and five
literal traversal entry points. Test through the composed application/release boundary, not by
calling descriptor `execute` or the scheduler directly.

## B6 — the local Syzygy projection has two payload types ([[D2061]])

§7 calls `rules.endgame.tablebase_domain@1` a projection whose payload is
`SyzygyOutsideDomain`, then says it carries operation/request digest and `observedAt` through
`ProviderLocalDomainResult<"syzygy.position@1">`. The inner fact and envelope are different types.
The first drops subject identity; the second changes the declared F1 payload and adapter operands.

**Required repair:** name the exact declared payload (preferably the sealed local-result envelope
whose `.payload` is the domain fact), its adapter and retained operands. Cross bare-inner and crossed
request-digest failures.

## B7 — Maia request identity is not an admitted/applied identity ([[D2062]])

`MaiaPolicyPageRequest` leaves band, temperature, top-p, width and timeout as unconstrained numbers;
the result returns `appliedBand` without a rule connecting it to request, advertised option bounds
or same-exchange capture (§6:889–970). HEAD already has `MAIA3_BAND_RANGE`, `appliedTargetElo`,
MultiPV maximum handling and temperature/top-p validation. The RFC neither adopts those symbols
nor specifies a replacement. An implementation may reject, clamp or silently apply different
values while preserving the same requested identity.

**Required repair:** publish exact finite/safe/range rules, whether width/band clamp or refuse,
the literal UCI option image, and same-exchange proof for every applied parameter. Cross boundary,
out-of-range, unsupported-option, requested≠applied and width-cap cases.

## Re-review order

1. Seal provider deliveries and close all digest/identity constructors.
2. Define run-subject identity and cache lifecycle.
3. Make the Syzygy and Maia source payloads exact.
4. Name real production traversals.
5. Invert the seven-arm reproduction, preserve the prior 9 + 7 + 9 + 5 contracts, run full
   verification, then request another independent review.

No provider implementation, learner binding, schema/content mutation or downstream private source
is authorized by this return.
