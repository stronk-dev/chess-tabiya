# Implementation receipt: `rfc/provider-exchange-and-execution.md`

**Date:** 2026-09-24 · **By:** claude (worktree `agent-aaf2b7e1cd919efdb`), at the owner's direction
to implement ready RFCs without review rounds · **For:** coordinator closeout.
**Status set in the RFC:** `implementing`. The `rfc/README.md` Active row, `design/BACKLOG.md` rows
and the exploration-log entry are the coordinator's. `make status-parity` P2 flags the row until
then.

Prerequisite `provider-protocol-register.md` landed first (commit `67d208c6`). It adds one
`members` catalogue row over the existing `string_tuple` reader, a present-but-empty tuple and the
checked README register, and this RFC's five-member claim. This landing adds the five members to the
tuple, moves them to the register's Landed table and closes the claim.

## What shipped

| piece | where |
|---|---|
| operation-keyed types (requests, results, identities, endpoints, receipts, deliveries, results) | `packages/runtime/src/provider-types.ts` |
| ten-domain digest registry, RFC-8785 over the shipped canonicalizer, byte SHA-256 | `packages/runtime/src/provider-digest.ts` |
| refuse-only normalizers, command images, Syzygy preflight, provider URLs | `packages/runtime/src/provider-requests.ts` |
| five parsers + parser-implementation closure digest | `packages/runtime/src/provider-parsers.ts`, `provider-parser-implementation.generated.ts` |
| seals, scheduler-only constructors, assertions, durable save/reload | `packages/runtime/src/provider-exchange.ts` (+ subpath `provider-exchange-authority.ts`) |
| protocol resource + compile-time relations | `packages/runtime/src/provider-protocol.ts` |
| six catalogue projections, six value-authority factories, two runtime operations | `evidence-catalog.ts`, `evidence-factories.ts`, `internal/evidence-value-routes.ts`, `evidence-operations.ts` |
| same-task engine exchange capture (generation, option image, artifact, transcript, `finally` reset) | `apps/server/src/engine-supervisor.ts` |
| bounded scheduler | `apps/server/src/provider-exchange.ts` |
| five descriptors | `apps/server/src/provider-operations.ts` |
| operator capability, five traversals, CLI, composition | `apps/server/src/provider-traversal.ts`; `application.ts` exposes `providers` |
| capability register: reached all-legal legal-root MultiPV, refusal kept for every other use | `apps/server/src/capabilities.ts` |
| docs | `docs/provider-exchange.md`; counts in `docs/evidence-contract.md` |
| make targets | `make provider-exchange-check`, `make provider-traversal OP=…` |

**evidence-value-authority D2.** Each of the five provider source factories admits only a
scheduler-sealed delivery of its own operation. It asserts the acquisition and the parsed-payload
receipts and seals the whole delivery, with request, response and payload digests as source
digests. The Syzygy local-domain adapter admits only the sealed envelope. The legacy packet, line
and page factories remain for their existing callers. Their `pending` text now names the
receipt-bearing successors.

**Degradation.** In mock mode, and for any unconfigured provider, every operation returns
`provider_unavailable` with a detail. That covers the networked Maia sidecar with no container
identity and an explorer without a token. No operation fabricates a result. Existing engine, Maia,
Syzygy and Explorer clients are untouched and keep serving learners.

## Acceptance criteria → tests

| # | state | evidence |
|---|---|---|
| 1–5, 12, 26–28, 31 | **not implemented** | §1–§2 F1 execution/confidence/binding algebra, `/capabilities` path reach, `POST /evidence/availability`, run-subject digests |
| 6 | partial | maps, descriptors, source declarations and factories are set-equal (`provider-protocol.test.ts`). Whole-delivery payload and strip refusal: `provider-exchange.test.ts` "value-authority source factories". The durable parser has a round trip for all five operations plus refusals: missing, extra, crossed, copied, partial-rehash and bare. F1 `own.providerOperation` is not compiled |
| 7 | met | `provider-parsers.test.ts` §5 covers ordinary play, both castlings, four promotions, missing, duplicate, extra, replaced, short-depth, bounded, score-less and PV-less input, and frames. §5.1 covers White/Black cp/mate, raw WDL, depth and greatest-depth selection, and the WDL/mate/MultiPV/prior-task/after-bestmove refusals. The capability register is checked in `provider-traversal.test.ts` §5 |
| 8 | partial | parser positives for history and exact-FEN input. Refuse-only live bounds cover band 999/1000/2400/2401, fractional band, temperature, top-p, timeout and MultiPV width, plus unavailability on missing options or an uncaptured container. The literal command image and non-aliasing digests are tested in `provider-traversal.test.ts`. The occurrence projections are not implemented |
| 9, 22 | partial | preflight outside-domain with no exchange; sealed envelope and adapter forgeries; in-domain versus failure arms (`provider-exchange.test.ts`, both packages). `TablebaseSource.probe` is not migrated |
| 10 | partial | provider/canonical SAN, listed/unlisted mass, totals 0/37/100, three history arms, illegal/duplicate/non-integer/overflow input, capture-derived source (`provider-parsers.test.ts` §8). No Chess960 fixture. No summary |
| 11, 20, 21, 29 | met | `apps/server/src/provider-exchange.test.ts`: dedupe, crossed waiters, cancellation, final-departure abort, queue-full, queued cancel, queue-consumed timeout, entry and weight caps, LRU, bad and oversized weight, absolute TTL `<`/`>=`, stale generation, no failure retention, clock separation and validation |
| 13, 23 | not implemented | Explorer summary and wire adapter |
| 14, 35 | met (in-process + built) | five CLI arms reach their exact projection and parser. Failure and local-domain arms create no evidence. Unknown, extra, malformed and forged capability input fails. The built `dist` CLI covers usage and offline arms. Real Stockfish covers legal roots and evaluation when the binary exists (`provider-traversal.test.ts`) |
| 18, 19, 33 | met | `packages/runtime/src/provider-exchange.test.ts`: seals refuse plain, spread, JSON, null-prototype and other-operation values. Endpoint, identity, engine version, generation and encoding crosses are `identity_mismatch`. The byte/payload binding holds |
| 24 | met | callers cannot submit commands; exact image and reset (`provider-traversal.test.ts`); iterative-output fixtures (`provider-parsers.test.ts`) |
| 25 | met | `provider-digest.test.ts`: exact domains, prefixes against `node:crypto`, key order, mutations, RFC-8785 numbers and Unicode, refusals. The no-second-hash census is in `provider-protocol.test.ts` |
| 30 | met | no module, preset or workflow dependency (`provider-protocol.test.ts`) |
| 32 | partial | same-task generation, identity, option image and artifact capture, and reset retirement (`engine-supervisor-exchange.test.ts`); option-order and container validation (`provider-digest.test.ts`); stale generation (scheduler). A container probe for the networked Maia sidecar does not exist, so Maia is honestly unavailable in production |
| 34 | met | status/ETag enter the response digest (`provider-digest.test.ts`). Duplicate ETag is `invalid_response` and non-200 is `provider_unavailable` (scheduler test). Source metadata comes from the capture (parser test) |
| 36 | met | tuple, resource rows, type maps, parsers, normalizers, projections, factories, CLI names and digest domains form one set. Swaps and copies fail (`provider-protocol.test.ts`). The register rows are checked by `make register-check` |
| 15 | met at landing | see Verification |
| 16, 17 | coordinator / not run | ledger/log closeout; the D1871 amendment harness was not re-run |

## Verification (this landing)

Recorded in the commit message and the final report: `make typecheck`, `make verify-software`,
`make register-check`, `make test-browser-smoke`, `make provider-exchange-check`.

## Remains

§1–§2 (F1 execution paths, confidence inheritance, binding source-absence, `/capabilities` reach,
authenticated availability with run-subject digests). The Maia run/exact-FEN occurrence projections
and the Explorer population summary with its wire adapter. Migrating the opponent selector, evidence
queue, `TablebaseSource.probe` and the corpus/repertoire paths onto the scheduler, then retiring the
legacy node-shaped projections at zero-consumer census. A container-identity probe for the
networked Maia sidecar. Deployment capacity for a first learner-facing consumer.
