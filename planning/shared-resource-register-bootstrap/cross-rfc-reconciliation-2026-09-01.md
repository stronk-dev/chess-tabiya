# Shared-resource register cross-RFC reconciliation

- **Date:** 2026-09-01
- **Scope:** `shared-resource-register-bootstrap`, `assistance-config-register`,
  `semantic-convention-register`, and `provider-protocol-register`
- **Product effect:** none; this chooses one repository-governance architecture

## Verdict

The four drafts may not land as C9/C10/C11 extensions. They describe one problem with three
incompatible parser and transition architectures. The generic bootstrap is the sole engine. The
other three RFCs become catalogue-population/profile RFCs and may add no top-level check number,
parallel resource-name list, Git preimage reader, or register parser.

The final architecture separates four concerns that the drafts currently mix:

1. **catalogue identity** — one JSON catalogue names every resource, lifecycle, projection adapter,
   exact selectors and introducer;
2. **projection** — a closed adapter derives one canonical tree image from product bytes without
   branching on the resource name;
3. **lifecycle** — `sequential`, `member_set`, or `lineage_set` supplies claim/collision/landing
   semantics; and
4. **time** — one index-vs-HEAD and first-parent transition reader validates every catalogue entry.

The stable public result remains one `make register-check`; diagnostic codes are generated as
`R/<resource>/<rule>`. The ordinal C9/C10/C11 plans are removed because the ordering itself became
an integration dependency.

## Generic profiles required by the known queue

| projection adapter | lifecycle | known consumers |
|---|---|---|
| `json_schema_id@1` | `sequential` | pack/run/shape/principle/campaign/release/concept schemas |
| `migration_sequence@1` | `sequential` | SQLite migration authority |
| `literal_string_tuple@1` | `member_set` | evidence kinds; assistance permission vocabulary |
| `literal_string_union@1` | `member_set` | adopted live assistance permission vocabulary |
| `canonical_resource@1` | `sequential` | source attribution; provider protocol; assistance exchange |
| `typescript_contract@1` | `sequential` | assistance config; workflow preference; assistance permission operations |
| `versioned_declarations@1` | `lineage_set` | semantic conventions |

The adapter names are closed. A new adapter requires an accepted process amendment and an
independent able-to-fail fixture; a product RFC cannot add executable checker code.

## Resource-specific consequences

### Assistance

- `assistance-config` v4 and `workflow-preference` v1 use the new one-time `adopted` introduction.
  The register pins the complete current projection and its head without pretending versions 1–3
  were historically governed.
- `assistance-permission` adopts only the current literal vocabulary through
  `literal_string_union@1`; process adoption does not rewrite the live type alias into a tuple
  ([[D2467]]).
- Operation/composition semantics become a distinct sequential
  `assistance-permission-contract`; this is the lawful same-membership successor required by
  [[D2453]]. `intent-presets` claims its first lane and cannot change `ConfigClamp`, `pointwiseMin`
  or the effective compiler outside that projection.
- `assistance-exchange` uses one atomic canonical resource object. A version-only or declarations-
  only partial artifact is neither absent nor landed and fails.
- Workflow and assistance-config deltas are derived from complete before/after projections. The
  hand-written eight/fifteen-symbol lists are evidence used to falsify closure, not authorities.

### Provider protocol

- One atomic `PROVIDER_PROTOCOL_RESOURCE` object carries `id`, `version`, a canonical payload and
  digest. Compile-time request/result relations derive beside it and are not misclassified as
  literal runtime fields.
- The generic register proves identity, digest, lifecycle and consumer derivation. The provider
  product RFC separately joins the payload to independent accepted producer/source obligations;
  a register cannot manufacture the expected operation population from the tuple it checks.
- Partial authority, prior-claim and CI-history behavior are inherited from the generic engine.

### Semantic conventions

- `versioned_declarations@1` retains the distinct base-id lineage collision rule and append-only
  semantic history.
- It consumes the generic transition reader directly. It does not depend on assistance C9 and adds
  no `RESOURCE_NAMES` literal or C10 branch ([[D2466]]).

### Source attribution

- `canonical_resource@1` is `{ id, version, payload, digest }`, with exact keys. The source-
  attribution payload includes rows, resolver identity and missing-field policy. Its digest covers
  all three; changing resolver policy at a fixed version fails ([[D2442]]).

## Introduction states

`unregistered -> absent` remains the route for genuinely future selectors. Absence is selector-
level: every owned selector must be unresolved; some-present/some-absent is a partial landing and
fails.

`unregistered -> adopted` is added for an already-live authority ([[D2465]]). It is legal only in
the accepted process RFC that adds the catalogue row, changes no owned product selector, derives a
complete current projection, writes one `adopted@<head>` baseline row and has no live claim. Earlier
product history is explicitly outside register coverage. Adoption cannot be replayed, used to
rewrite a registered resource, or combined with a semantic product change.

## Required implementation order

1. Repair, independently review, accept and implement `shared-resource-register-bootstrap`.
2. Rebase and review the assistance population RFC; implement catalogue entries/adoptions only.
3. Rebase and review semantic-convention and provider population RFCs; these can then proceed in
   parallel because the engine and Git preimage contract are shared.
4. Only after each root/register exists may its product RFC claim and land a semantic transition.

This order removes the current circular dependency and leaves one checker architecture at every
commit, not a temporary bespoke branch that a later commit deletes.
