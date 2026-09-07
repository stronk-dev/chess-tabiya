# Review evidence compiler — third author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2685]], [[D2686]], [[D2687]], [[D2688]], [[D2689]], [[D2690]],
  [[D2691]], [[D2692]]
- **Scope:** contract evidence only; no production Review compiler, provider request, Story route,
  client component, content, schema or migration lands here
- **Gate:** `make review-evidence-third-author-repair`
- **Verdict:** author repair complete; another genuinely fresh independent review is required

## What changed

The preceding return was correct: the prose described a trustworthy compiler while its executable
model could neither construct nor reject that trust boundary. This repair replaces the shallow and
regex-only checks with one composed executable model.

The recorded-prefix authority copies and recursively freezes its nested event head, path and
outcome; its assertion checks private issuance, exact keys, digest and deep immutability. The packet
constructor retains that exact authorized subject under a separate private aggregate authority.
Literal, spread and JSON rebuilds therefore fail even when all visible values are equal.

The family fold now receives the authorized path population rather than anonymous states. Every
path node occurs exactly once and missing, duplicate or foreign identities fail. Completion accepts
only the complete nine-member `ReviewSourceFamily` record derived from the adapter catalogue, so an
empty or partial record cannot manufacture `healthy`/`settled`.

Attempt acquisition is an actual single-flight boundary: the first caller owns settlement and
later callers subscribe to the same promise. All callers receive the same sealed terminal outcome;
retained results remain idempotent and capacity refuses a new identity without leaking an internal
reservation value.

The source and presentation integrations now execute. The source plan expands the exact adapter ×
authorized-node population, adapter results are privately issued, and the compiler rejects missing,
duplicate, extra, foreign-node and wrong-authority results before issuing an asserted packet. The
presentation path calls an adapter-owned component constructor, serializer, presentation parser,
story parser and public projector; component spreads, extra wire keys, component substitution,
crossed node receipts and unparsed public inputs fail.

Finally, the live module execution image now records `ReviewEvidenceInput`,
`compileReviewEvidence(input)`, `assertReviewEvidencePacket(value)` and the private aggregate seal.
It remains honestly `blocked_upstream_dependencies`: this is a buildable contract repair, not a
claim that its recorded-path, provider, value, presentation or module dependencies ship. The named
target is retained by opt-in `verify-rfc-evidence`; [[D3076]] correctly keeps draft-RFC models out
of required release governance.

## Evidence

`make review-evidence-third-author-repair` passes:

- 6/6 retained original Review author controls;
- 5/5 retained second-author controls;
- 6/6 composed third-repair groups, including all returned negative classes.

The historical `make review-evidence-second-fresh-review` target deliberately remains a revision-
pinned reproducer of the defective predecessor. It is not a dependency of the repaired gate because
its D2692 assertion must fail after the live module image is corrected.

## Next

Another genuinely fresh reviewer attacks the composed model. Acceptance and production still wait
for the RFC's recorded-path, provider-exchange, candidate/value, presentation and module-eligibility
dependencies; this repair does not bypass any of them.
