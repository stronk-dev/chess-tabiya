# RFC: Semantic-convention shared-resource register

- **Status:** draft — amended 2026-08-27 after the [[D1917]]–[[D1920]] return; repeat independent
  process/buildability review still precedes acceptance
- **Author:** codex
- **Created:** 2026-08-27
- **Design refs:** none. This is repository process and changes no evidence meaning or learner UX.
- **Exploration gate:** passed by [[D1722]] and the executable 39-member census in
  `tools/d1722-convention-identity-harness/initial-member-census.test.ts`
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`; draft
  `rfc/assistance-config-register.md` lands first and owns C9
- **Parent / amends:** follows the generic RFC-0000 rule 7; amends only the executable resource
  inventory, `rfc/README.md` registers, development docs and active claim metadata
- **Supersedes / superseded by:** —
- **Planning:** `planning/semantic-convention-register/`

```tabiya-claims
none
```

## Summary

Register `semantic-conventions` as the eighth shared resource before the product registry lands.
The landed tree set starts empty;
the exact 39-member future set is claimed once by `semantic-convention-provenance.md`. When that
product RFC implements, the checker derives the members from `CONVENTION_DECLARATIONS`, the README
records those same members as landed, and the live claim disappears atomically.

This RFC changes no runtime, evidence, rendering, content or schema bytes. It prevents the proposed
convention catalogue from becoming an eighth shared authority with no collision or drift reader.

## Motivation

RFC-0000 rule 7 registers a closed/versioned resource when parallel drafts can move it and it crosses
a package boundary. Semantic conventions satisfy that predicate as soon as one draft claims the
registry; the 39-member claim now exists as an executable reviewed set. The current checker accepts
seven resources (six original shapes plus the campaign schema extension), while the convention RFC must
not implement product bytes before acceptance. Therefore the process register must support a
pre-landing state: empty landed tree, non-empty future claim.

The register is identity-membership-based, like `evidence-kinds`, but its members are structured
`id@positive-version` refs. Reusing the evidence-kind parser would reject hyphens and `@`; loosening
that parser would silently widen an unrelated content vocabulary. This RFC adds a distinct grammar,
serializes claims by base-id lineage and deliberately delegates semantic-byte immutability to the
product RFC's append-only semantic history.

## Specification

### 1. Resource and claim grammar

After `assistance-config-register.md` lands, `RESOURCE_NAMES` adds `semantic-conventions`. The exact
claim form is:

```text
semantic-conventions | members <ref>, <ref>... | <non-empty changed symbols>
```

Each ref matches `^[a-z][a-z0-9_-]*@[1-9][0-9]*$`. Members must be ASCII-sorted and unique inside
one claim. A document may carry at most one claim for this resource. C3 collision identity is the
base convention id, not the complete ref: `space@2` and `space@3` collide while `space@2` and
`threat@2` do not.

For each claimed base id, C10 derives the highest landed version. A new id must claim exactly `@1`;
an existing id must claim exactly `head + 1`. Two versions of one base id may not be live at once,
two claimants may not claim the same next version, and skipped/backward versions fail. Every prior
version remains in the landed/tree member sets for historical readability.

This process RFC claims `none`. On its implementation,
`semantic-convention-provenance.md` atomically changes its block to the exact §1.2 set:

```text
semantic-conventions | members back_rank_susceptible@1, backward-pawn-legacy@1, candidate-feature-vector@1, candidate-majority@1, chessops-king-takes-rook@1, defence-duty@1, development@1, discovered-latency@1, double-attack@1, evidence-reference-resolution@1, fork-survival@1, grade-convention@1, king-landing-square@1, king-opposition-blocker-blind@1, king-shelter@1, king-zone@1, legal-exchange@1, local-non-losing@1, loose-piece@1, mate-proof@1, material-role-signature@1, maximal_pawn_reach@1, mover-turn-ep-cleared@1, observed-window@1, opening-deepest-reached@1, overload-conflict@1, pawn-relations@1, pressure-line@1, race-arrival@1, ray-classification@1, space@1, square-control@1, standard-uci-king-destination@1, story-last-level@1, story-rank@1, story-title@1, threat@1, trade-completed@1, trapped@1 | CONVENTION_DECLARATIONS; projection convention closures; append-only semantic history
```

The checker compares that literal claim set with the executable D1722 census during the process
landing. A count-preserving swapped identity fails.

### 2. Tree authority and pre-landing state

The future tree authority is the exported literal `CONVENTION_DECLARATIONS` in
`packages/runtime/src/evidence-conventions.ts`. The register reader uses the same pinned TypeScript
Program/TypeChecker introduced by the predecessor register RFC. It locates exactly one exported
readonly declaration array and derives only each literal `ref.id` plus positive-integer
`ref.version`. A computed, broad, duplicate or unparsable ref fails; declaration order is ignored.

This projection intentionally observes **identity membership only**. It does not and cannot prove
that definition, limitation, authority or disclosure bytes stayed fixed. The product RFC owns that
separate guarantee through its append-only semantic-history artifact and staged/first-parent
governance. Once a tree declaration exists, C10 requires the product/history check and artifact to
exist; in the legal pre-landing state it requires their absence. It never claims member set-equality
can see semantic bytes it erases.

Before the first product landing, the file/symbol may be absent only when all three facts hold:

1. README landed member count is zero;
2. the Landed table contains no member rows; and
3. at least one valid live claim exists.

The derived tree value is then `{members: []}`. Once any landed member exists, a missing file/symbol
is an error, not an empty set. This is the only pre-landing exception and exists to preserve the
no-implementation-before-acceptance law.

### 3. README register and C10

`rfc/README.md` gains one section:

```text
## Semantic-convention register
<!-- register: semantic-conventions members=0 -->
```

Its Landed table is empty initially. Its Live claims table contains the exact 39-member claim and
claimant RFC. No hand-written next value appears. The durable initial authority is
`planning/semantic-convention-register/initial-members.json`; the D1722 census already reads this
file, and C10 reads the same file rather than copying its members into checker code.

The predecessor's C1-C9 meanings remain unchanged. New C10 checks:

- the resource has exactly one README section and one machine head line;
- tree members are unique, valid refs and set-equal to landed rows;
- live semantic claims are sorted, unique, valid and collide per member;
- live claims serialize by base id and name exactly the next landed version (or `@1` for a new id);
- the pre-landing exception satisfies all three conditions above;
- the durable seed parses as schema version 1, is sorted/unique, and is set-equal to both the D1722
  census and the sole initial live claim; deletion/drift fails; and
- after product landing, removal/rename cannot be hidden by editing only the README table or only
  the runtime array. Same-version semantic replacement is outside member equality and must fail in
  the product semantic-history check.

`derivedOutput` gets an explicit semantic-convention arm. Initially it prints:

```text
semantic-conventions: 0 landed members; claimed 39
```

After product landing it prints `39 landed members; claimed 0`. It never falls through to
`evidence-kinds` or `assistance-config` parsing.

### 4. Able-to-fail fixture matrix

Unit: one mutation class. Total: nineteen.

| # | mutation | result |
|---:|---|---|
| 1 | empty tree + empty landed + exact live claim | pass |
| 2 | absent tree + no live claim | fail |
| 3 | absent tree + one landed member | fail |
| 4 | duplicate or unsorted member in one claim | fail |
| 5 | malformed ref, zero version or slash pseudo-version | fail |
| 6 | two RFCs claim versions of one base id | fail |
| 7 | two claims use disjoint base ids | pass |
| 8 | initial live claim omits one census member | fail |
| 9 | initial live claim swaps one identity while keeping 39 | fail |
| 10 | runtime declaration duplicate/computed/broad ref | fail closed |
| 11 | tree member missing from Landed | fail |
| 12 | stale Landed member absent from tree | fail |
| 13 | declaration reorder only | same derived set |
| 14 | semantic output before and after first landing | exact dedicated line |
| 15 | `space@2` and `space@3` live concurrently | fail: same base-id lineage |
| 16 | two `space@2` claimants | fail |
| 17 | `space@2` and `threat@2` at matching landed heads | pass |
| 18 | new id at `@2`, or existing id skips/backtracks | fail |
| 19 | durable seed deletion, malformed schema, omission or count-preserving swap | fail |

### 5. Implementation boundary and order

Implementation changes only:

- `tools/register-check.mjs` and `tools/register-check.test.mjs`;
- stable `planning/semantic-convention-register/initial-members.json` (already published by the
  amendment; checker consumption and drift fixtures land here);
- `rfc/README.md`;
- the claim block/status prose of `rfc/semantic-convention-provenance.md`;
- `docs/development.md`;
- this RFC's plan/log, ledger, roadmap receipt and append-only exploration log.

It does not create `evidence-conventions.ts`, alter a projection, change evidence semantics, close
[[D1851]], render a disclosure, or touch content/schema/storage/web/archive files. The product RFC
does those things only after independent review and acceptance.

## Deviations from design

None. This is process machinery over already-researched future product state.

## Acceptance criteria

1. `semantic-conventions` exists exactly once in `RESOURCE_NAMES` and README.
2. Its distinct sorted `id@version` claim grammar accepts the exact 39 and refuses mutation 4/5.
3. C3 detects per-base-id overlap and permits disjoint lineages.
4. The pre-landing exception passes only for empty tree/landed plus a valid live claim.
5. The exact live claim, D1722 census and durable seed are set-equal; seed deletion/schema drift,
   omission and count-preserving swap fail without any copied checker list.
6. The future AST extractor refuses duplicate, computed, broad and invalid refs.
7. C3/C10 serialize by base id: new ids start at 1, existing ids claim head+1, same-lineage
   concurrent/skipped/backward versions fail, and different ids may advance together.
8. C4/C6/C10 establish tree↔landed identity set equality after first landing in both directions;
   semantic-byte immutability is explicitly tested by the product RFC's append-only history, not
   falsely attributed to this projection.
9. Reordering declarations changes no derived membership.
10. Dedicated output reports 0/39 before landing and 39/0 after; no fallback branch is used.
11. Existing register C1-C9 fixtures and real derived heads/digests remain unchanged.
12. No product/runtime/web/schema/storage/content/archive byte changes.
13. Node-24 governance, `git diff --check`, staged process contracts and CI governance pass on
    committed bytes and report C1-C10 green.
14. README status, roadmap receipt, [[D1722]], [[D1852]] and append-only logs close in the same
    implementing commit; archive waits for all discharges.
15. The semantic product RFC carries the exact live claim and can proceed to independent review
    without any product implementation having landed.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Independent process/buildability review re-derives grammar, pre-landing exception, census equality and file boundary | claude | corrections/acceptance + `planning/semantic-convention-register/log.md` | |
| D2 | Implement C10/register/claim transfer/docs without product bytes | codex | implementing SHA + green governance | |
| D3 | Accepted semantic-convention product RFC lands the 39 declarations, converts claims to Landed rows and closes the pre-landing state | codex | product implementation SHA | |

## Open questions

None. This document chooses no convention meaning or learner behavior.

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1917]] | repaired: base-id collision plus exact head+1 version rule and crossed fixtures | author amendment; repeat review |
| [[D1918]] | repaired: identity-only scope, product append-only history owns semantic bytes | reconciled with `semantic-convention-provenance.md`; repeat review |
| [[D1919]] | repaired: stable planning JSON is the single seed consumed by D1722 and future C10 | executable amendment; repeat review |
| [[D1920]] | repaired: eighth-resource wording throughout | author correction |

## Changelog

- 2026-08-27: independent review returned the draft on [[D1917]]–[[D1919]] and recorded the
  [[D1920]] factual correction. Exact return:
  `planning/semantic-convention-register/independent-buildability-review-2026-08-27.md`.
- 2026-08-27: drafted from the executable 39-member D1722 census. Depends on the earlier
  assistance register for C9 and adds C10; specifies the empty-before-first-landing state so process
  machinery does not force illegal product implementation.
- 2026-08-27: amended after return. Claims serialize per base id and require new-id `@1` or exact
  landed-head+1; the tree/register scope is honestly identity-only while product append-only history
  owns semantic drift; `planning/semantic-convention-register/initial-members.json` replaces the
  disposable private seed and is consumed directly by D1722 and future C10; resource count corrected
  to eight. Repeat independent review remains.
