# Shared candidate packet — sixth fresh independent buildability review

- **Date:** 2026-09-04
- **Artifact:** `rfc/shared-candidate-evidence-packet.md` after the D2428/D2468 sixth author repair
- **Verdict:** returned on [[D2625]]–[[D2627]]; implementation remains unauthorized
- **Executable review:** `make candidate-packet-sixth-fresh-review` — retained author contract 3/3 plus fresh review 3/3

## What survives

The sixth repair closes the defect it names. One projection-specific FEN factory owns one
`exactLegalMoveMap` call and returns the one object graph the packet flattens by reference. Caller
maps and equal rebuilt moves remain outside that authority. The registered factory name also agrees
across the candidate, value-authority and promotion-collector drafts. Those controls are retained by
the fresh-review target rather than replaced.

The higher-level direction also survives: one provider-free complete legal population beneath
Support, Review and bots; original evidence values retained instead of flattened strings; no LLM or
provider inside the factual packet; and separate consumer derivations with honest abstention.

## Returns

### [[D2625]] — the dependency order deletes the packet's implementation file

`evidence-value-authority.md` is a required predecessor. It makes
`packages/runtime/src/evidence-factories.ts` the sole mint boundary and explicitly deletes
`evidence-source-adapters.ts`. The candidate packet nevertheless assigns its exact-legal factory
change to `evidence-source-adapters.ts` in §12. Following the declared order therefore removes the
file before this RFC tries to edit it. The packet must consume the predecessor's exact exported
factory and must neither recreate the deleted adapter nor co-own the factory implementation.

### [[D2626]] — retention scope is currently an input to chess truth

`CandidateCollectorContext` exposes `scope` to every collector. A collector may therefore emit one
event set for a direct events request and a different set for a wide request. The wide packet may
then project to events and receive the same target packet id as the direct events compilation.
Criterion 4 compares the candidate move set and projection reference retention, not equality of the
shared event/reading values between those two construction paths. Cache order can consequently
change the factual packet while identity remains equal.

Retention scope should not be visible to collector semantics. If some operation genuinely requires
it, the contract must instead define a semantic input and independently prove direct-narrow and
projected-wide equality for every family retained by both paths.

### [[D2627]] — the weight bound measures the pre-repair packet, not the retained graph

The repaired receipt keeps the exact legal-map/move graph, candidate rows, abstentions, retained
collector outcomes and dependency-only `executionOutcomes` alive through its private `WeakMap`.
The mandated formula counts only visible events plus five times visible readings. The cited Node-24
harness predates those receipt/outcome structures and its `Packet` contains only visible
events/readings. Two receipts can therefore have equal (even zero) declared weight while retaining
materially different graphs.

The repair must either define deterministic weights for every retained category and re-run the
production graph, or describe the formula honestly as a heuristic subordinate to the eight-entry
hard cap and stop claiming it bounds retained weight. Quiet roots and readings-only roots with
hidden event dependencies are required controls.

## Required bounded repair

1. Remove `evidence-source-adapters.ts` from the implementation surface and import the exact
   value-authority factory after that dependency lands; add a source-graph negative against
   recreating or co-owning it.
2. Remove request retention scope from collector truth computation, or close the cross-scope
   equivalence relation with executable direct-versus-projected value tests.
3. Rebuild the cache-weight model over the complete retained production receipt graph and preserve
   both quiet and hidden-dependency-heavy falsifiers.
4. Retain the sixth author contract and this three-arm review when the author repair is refreshed.

No production runtime, server, API, schema, content or UX byte changed in this review.
