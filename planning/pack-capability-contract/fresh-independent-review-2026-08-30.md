# Pack-capability contract — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/pack-capability-contract.md` after the D1982–D1992 second-return author repair
- **Reviewer:** codex, independent of that Claude author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make pack-capability-fresh-review` — 5/5 blocker arms
- **Production/corpus status:** untouched; lane 0.30 and [[D560]] remain held

The author repair materially improves the F1 bridge, resolved-content dependency closure, strict
compiler direction, claim-anchor dependency order, disposition separation and canonical pack
requirements. Those choices survive. Five remaining contradictions still require implementation
judgement and therefore prevent acceptance.

## B1 — the public grammar rejects shipped positives and has two version shapes ([[D2050]])

`CAPABILITY_ID_PATTERN` requires at least one dot/colon segment. Real shipped identities include
`mate-proof@1`, `pressure-line@1` and `candidate-majority@1`, whose base ids have no separator; the
regex also rejects criterion 1's own `x@1`. Separately, criterion 1 says parsing yields
`{id:"x", version:1}` while §2.1 defines version only as `{kind:"integer",value:1}` or semver, and
the criterion names `parseCapability` where the specification names `parseLegacyCapability`.

**Required repair:** derive the compatibility grammar from the complete shipped base-id inventory,
include one-segment ids, and make every parser/schema/criterion use the same structured version
union and function names. Cross real one-segment, dotted, colon, mixed-case and invalid suffix
fixtures.

## B2 — applicability still has no independent authority ([[D2051]])

The purported complete mapping is future `x-tabiya-*` annotations plus a future generated file.
The current schema has zero such annotations, the generated file is absent, and the RFC publishes
only four example selectors. The implementation therefore still authors the full schema-member →
public-capability mapping it is supposed to verify. Set equality against bytes created in that same
pass proves internal consistency, not that the mapping is the reviewed one.

**Required repair:** publish the complete checked annotation/mapping artifact at author tier, with
its digest and exact coverage/exclusion counts, then make generation compare to it rather than
invent it.

## B3 — the annotation value cannot represent enum-member granularity ([[D2052]])

The census is per `{schemaPointer, member}`, but `x-tabiya-capability` is one closed object
`{sourceIdentity,selector,capability}` attached to a schema node. Multi-value `enum` nodes have no
per-member annotation slots, so one object maps at most one member. The drill-pack schema contains
many such enums.

**Required repair:** use a closed array/map keyed by member or normalize every closed enum to
annotated `const` branches. A multi-member fixture must reject a missing member, duplicate member,
wrong source identity and unknown annotation field under the shared strict AJV factory.

## B4 — two named evaluator roots are not sites ([[D2053]])

§2.3 says every named root is exported as “the literal symbol listed” and a symbol site resolves
exactly once. The inventory instead gives `assertObjectiveTransition and its transition table` and
`the opponent-selection dispatch and ordering basis`. The latter halves are prose, not symbols;
the constant-table repair did not cover them.

**Required repair:** name exact exported symbols for every evaluator/table constituent and require
each to have a production reader. Zero/multiple declarations and unused aliases must fail.

## B5 — `AGENTS.md` is not protected intent ([[D2054]])

The refused weakened-Stockfish migration cites “protected intent `AGENTS.md` §Rejected”, while the
repository law defines the protected intent tier as `design/00`–`06`. The doctrine already has a
real protected-design home in `design/06-campaign.md`. Criterion 10's allow-listed resolver cannot
accept the published row without silently redefining authority.

**Required repair:** point the row at an exact protected-design anchor (preferred), or introduce and
justify a separate authority kind. Do not treat the agent guide as product intent by label.

## Re-review order

1. Repair the ID/version algebra and all positive controls.
2. Publish the full applicability authority and a representable annotation grammar together.
3. Make every evaluator root an exact live symbol.
4. Correct the refusal authority.
5. Invert the five-arm reproduction into an author contract, rerun the prior 7 + 11 arms and
   `make verify`, then request another independent review.

No lane-0.30 schema implementation, pack rewrite, digest restamp, publication or Gate-F lift is
authorised by this review.
