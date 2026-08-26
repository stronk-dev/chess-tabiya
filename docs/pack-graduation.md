# Pack graduation

Pack graduation is the explicit boundary between authored drafts and the official catalogue.
The current corpus has no graduable pack: the mechanism is live, while the remaining content debt
stays visible.

## Typed conditions

`provenance.graduationBlockers` contains closed entries with stable ids and one of three states:

- `blocking` is unpaid work and prevents publication;
- `resolved` preserves the original statement plus when and how it was cleared;
- `accepted` records a deliberate non-work condition and requires a resolvable ruling citation.

Legacy strings remain schema-readable for stored-draft compatibility, warn during validation, and
count as blocking. Published documents with a blocking entry are invalid. Candidate emitters write
the typed blocking form, but candidates never appear in the graduable set.

`make graduation-report` reports each catalogue root separately, lists every pack and every
blocking condition, writes the grouped accepted-condition audit page at
`content/accepted-conditions.md`, and refuses a nonzero legacy count. `make graduation-report` is
read-only; use the deliberately named `make graduation-report-update` only when a reviewed pack
change is meant to refresh the checked-in accepted-conditions page.

The report understands the accepted clearance vocabulary ahead of its held schema migration. When
a blocking entry carries a clearance it prints the exact kind, optional evidence-record kind and
subject, and separates clearable from unclearable entries. Pre-migration entries remain explicitly
`unspecified`; the report does not infer a predicate from their prose.

## Clearance transition tooling

`make graduation-clear FILE=<pack.json>` evaluates an already-authored clearance against that
pack's own ledger, manifest and shared expression census. It can write a blocking-to-resolved
transition, re-stamp the evidence digest and emit the matching `.graduation.json` receipt; `CHECK=1`
performs the evaluation without writing. Its historical non-vacuity exception is the exact set of
four measured Syzygy blocker identities, not every blocker in those packs. Any additional
already-true predicate is refused before the pack, ledger or receipt changes.

The pack-schema 0.28 and corpus migration remain held by Gate F. The existence of the writer does
not imply that current blocker prose has been classified, supplied with subjects, or cleared.

## Official publication boundary

Graduating an official pack is one atomic repository change:

1. move the pack and its sidecars from `content/drafts/` to `content/packs/`;
2. set `provenance.reviewStatus` to `published`;
3. re-stamp the evidence ledger with the new pack digest.

It is a move, never a copy. `resolvePackPath(id)` searches both catalogue roots and refuses both
missing and duplicate ids. Corpus-wide schema, evidence, expression-census, and hardcoded-fixture
tests use that two-root model so publication cannot move a pack outside its gates.

The official root is checked at strict sourcing severity. Draft sourcing debt is a ratchet rather
than a publication claim; the landing corpus has 18 failing draft documents and that ceiling may
only shrink. Community registration uses the same typed blocking predicate but remains a separate
server-owned publication channel.

There is no reviewer sign-off workflow. The inert legacy `reviewers` provenance key remains
schema-readable for compatibility, while evidence and owner rulings—not names—are what can clear a
condition.
