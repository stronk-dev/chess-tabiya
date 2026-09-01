# Shared-resource register bootstrap — fourth author repair

- **Date:** 2026-09-01
- **Repairs:** [[D2498]]–[[D2501]]; compatibility closeout [[D2502]]
- **Status:** author repair complete; another fresh independent review is required
- **Executable receipt:** `make shared-resource-bootstrap-fourth-author-repair` — 4/4 green

## What changed

The repair started from the dependent profiles rather than the generic vocabulary. The prior
selector grammar could not parse either assistance version head: config used dotted descent and
workflow named an undeclared object segment under the wrong function. Slash-only member/object/
literal descent now resolves the real v4 interface literal and the persisted workflow-v1 object in
`saveWorkflowPreset`; the old paths are negative controls.

Process authorization is now bytes, not prose. Bootstrap, assistance, semantic-convention and
provider protocol each name a canonical descriptor-candidate JSON file. The author target validates
all seventeen descriptors under one union, checks routing-block set equality and requires every
post-bootstrap `introducedBy` owner to be the declaring RFC.

The two remaining adapter images are closed. TypeScript and migration graphs have exact syntax-tree,
node, edge, signature, overload, endpoint and ordering rows. `canonical_resource@1` statically
parses a closed literal AST and never imports or executes the target module; calls, references,
spreads and getters are able-to-fail negatives. Provider protocol was reconciled to that same
literal shape.

The compatibility sweep also repaired two stale maintained targets: semantic convention once again
names its JSONL history path and Make surface, while provider protocol's older author check follows
the atomic version field instead of a retired standalone symbol.

## Verification

- `make shared-resource-bootstrap-fourth-author-repair` — 4/4
- `make shared-resource-bootstrap-third-author-repair` — 8/8
- `make shared-resource-bootstrap-second-author-repair` — 8/8
- `make shared-register-reconciliation-author-repair` — 6/6
- `make semantic-register-contract` — 19/19 across its two suites
- `make provider-protocol-author-repair` — 2/2

## Boundary

No catalogue engine, README register, product authority, schema, API, storage, content or web bytes
landed. This is an author repair and dependency reconciliation only. Fresh independent review still
gates acceptance, and acceptance still gates implementation.
