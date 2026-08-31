# Provider-protocol register — fresh independent buildability review

- **Date:** 2026-08-31
- **Subject:** D2361 author repair in `rfc/provider-protocol-register.md`
- **Verdict:** returned on [[D2455]]–[[D2459]]
- **Production/protected design:** untouched

## What survives

The repair correctly removes fictional head 0, names a future version selector and makes landed
history one-way. A literal provider declaration can still be the right consolidation target. The
current process RFC cannot implement that target because it conflicts with the generic register
architecture, circularly validates the sole tuple, contradicts its own row grammar and has no
committed-history or partial-landing boundary.

## D2455 — a third register architecture owns the same files

This RFC adds `provider-protocol` to `RESOURCE_NAMES` and implements bespoke C11 logic. The active
`shared-resource-register-bootstrap` RFC deletes `RESOURCE_NAMES`, derives resources from a
catalogue and says kind—not resource name—selects semantics. Both own `register-check` and README;
neither depends on the other. A distinct check number does not make their parsers or transitions
independent.

Rebase provider protocol onto the accepted generic catalogue/lifecycle. Extend the generic kind
algebra only for a proved semantic difference; do not land another temporary branch that the next
process RFC deletes.

## D2456 — “every field literal” contradicts three function fields

Each normative operation row requires `requestType`, `resultType` and `localResultType` function
witnesses, while C11.5 requires every field to be literal and exact. The exact product snippet also
calls `defineProviderProtocol` without declaring or importing that constructor.

Publish a compilable constructor boundary. Separate literal runtime identity fields from
compile-time type relations and state how the checker proves each; do not classify functions as
literals.

## D2457 — count-preserving swap refusal is circular

The tuple is deliberately the sole operation/domain authority. Every runtime map, descriptor,
parser, source factory and CLI projection derives from it; the first claim names only the tuple and
version. A coordinated swap therefore changes the authority itself and keeps all derived joins
green. Refusing that swap requires another independent expected population, which the RFC forbids.

Join the tuple to independent accepted producer/source obligations or exact live operation exports.
Those authorities must establish the expected five operations, provider pairings and ten digest
domains without copying the candidate tuple.

## D2458 — previous claimant is unavailable in CI

C11.9 requires matching landing bytes to the previous claim, but the RFC defines no staged
index-vs-HEAD reader, committed HEAD-vs-first-parent reader, parent acquisition failure or checkout
depth. Every current GitHub checkout remains shallow. This is the same temporal-authority defect
already returned from the assistance register.

Depend on one accepted shared transition reader and its exact Git preimage contract. CI must fetch
the required history and fail closed when the parent is unavailable.

## D2459 — partial authority is still “absent”

Absence checks only `PROVIDER_PROTOCOL_VERSION`. A partial product file or declarations tuple
without that symbol still satisfies missing root, empty history and first claim. The authority can
therefore land before the atomic transition while the register reports absent.

Require every owned selector to be absent, or make one atomic resource object contain version and
declarations so a partial artifact cannot exist outside the registered root.

## Verification

- `make provider-protocol-author-repair`: prior D2361 repair remains green 2/2.
- `make provider-protocol-fresh-review`: reproduces [[D2455]]–[[D2459]] 5/5.

The RFC remains draft. Generic-process reconciliation, an independent population authority,
compilable rows, committed-history semantics and atomic absence require author repair and another
fresh review before C11 or provider product work.
