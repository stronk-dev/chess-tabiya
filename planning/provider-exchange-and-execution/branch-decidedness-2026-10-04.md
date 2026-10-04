# Whole tablebase evidence for branch comparison

This checkpoint implements D3375 under the implementing provider-exchange contract.
Branch decidedness now admits the whole sealed Syzygy source rather than dropping its
identity and receipts before classifying a leaf. It does not complete the provider RFC,
the evidence foundation or the comparison UX milestone.

## Production boundary

The existing authenticated branch-decidedness route uses the new registered
`runtime.branch_decidedness@1` consumer, bound only to the machine-condition source
`live.syzygy.position_result@2`. Its explicit required-source absence policy is
`honest_empty`: the public result remains unknown/provider_unavailable, never a draw
or a made-up outcome. The consumer compiles its execution binding, admits exactly one
source, asserts the shared delivery seal and checks both payload and requested full FEN.
Both FEN clocks matter. No raw provider page is added to the learner response.

A source with a modern method never retries failure through bare `probe`. Standalone
and fixture implementations that have no modern method retain their existing explicit
compatibility path. Learner perspective conversion, objective classification, uncertain
category handling and terminal facts remain unchanged.

The operation checks the current feedback delivery window, read grant and selected leaf
before every acquisition, including after another branch has awaited I/O, and again
after waiting. If the
branch advances while the request is pending, its old answer cannot decide the new leaf;
the result is withheld or not_probed. No additional automatic acquisition follows.

## Permanent controls

Five source controls failed on the predecessor: the real HTTP positive path, crossed
positions, crossed clocks, cloned evidence and a modern source failure. The race control
also reproduced disclosure after the branch advanced. Source responses are labelled
test doubles carried through the actual scheduler/parser/factory chain, not claims of
native tablebase performance or chess outcomes. Existing standalone learner-perspective
controls remain required.

Two additional multi-branch controls reproduced a second acquisition after the disclosure
window closed or the actual read grant was revoked during the first probe. Both now stop
at one remote request. The focused suite passes 75 tests across five files. The earlier
complete software pass at `1fd19ac25af9518af82acf73f6701a3887c0d435` preceded this repair;
its retained receipt is not the final release proof.

The normal commands are `make branch-tablebase-check` and
`make branch-tablebase-metadata-check`. Complete final verification is recorded below
only after it finishes.

The focused target also runs the actual consumer-operation census. An exact-index
software run found the new consumer declared but absent from the server operation list;
the genuine operation is now registered, without weakening set equality. That failed
snapshot remains recorded in `branch-decidedness-software-census-failed-2026-10-05.json`.
The earlier incomplete-index run was interrupted after the generated applicability file
was found missing from staging; its failed receipt is retained separately. Neither run
is counted as a pass.

## Compatibility metadata

The independent proof compares against committed e20c4898. It retains all 885 prior
capability declarations and appends seven version-10 source-closure successors, for 892
total. All 275 factory outcome profiles remain unchanged. Canonical generation updates
only requirements in 104 pack/example/fixture documents and the corresponding packDigest
in 68 evidence ledgers; all authored chess content and 192 other source documents remain
unchanged. Guard/objective evaluators and opponent selection stay byte-identical.
The owner's routine metadata direction authorizes this maintenance; it is not graduation,
publication, authored content expansion or a migration of user documents.

## Opening authority seam

D3376 retains the opening integration blocker: the pinned server catalogue exists, but
the sole runtime opening factories remain unavailable and Review still has no opening
items. The accepted opening contract requires a registered shared schema before another
package reads its private artifact. The value-authority contract requires registered
source/document authority, not caller-supplied endpoint bytes or lookup callbacks.
The next amendment must bind that authority to current-position and historical opening
projections separately. This checkpoint does not bypass that seam or mark Review D2 done.

## Final software verification — 2026-10-05

The final exact-index `make staged-software-contracts` passes at
`2f05522d9748d9097600c04b69e559d62ccddd72`: 2,892 tests across 325 software files,
seven isolated performance tests across four files, zero type errors or Svelte warnings,
and all downstream build, schema/packaging, source/value/history, lifecycle and migration
checks. The 352-document migration plan has no outstanding rows. Semantic validation
remains 38/38 cases with zero fully passed subject profiles; this slice does not claim
independent semantic validation completion. The exact proof is
`branch-decidedness-software-2026-10-05.json`.

Only documentation, measured results, trackers and logs change after this software
snapshot. Product, test, content, schema and tooling bytes remain frozen through commit.
Real-content verification passes 223 tests across 23 files, zero clearance errors and
all 104 exact requirement declarations. Browser CI passes 111 journeys (56 ordinary,
five content, 49 matrix and one packaged), one optional real-Maia latency skip and zero
retries. Complete governance passes. Final exact-index process checks and normal
pre-commit hooks run before commit.

Ledger/work-state, queue, RFC/register, docs, anchored roadmap and both append-only logs
close out together. D3375 alone closes; D3376 remains owned and blocked. The tracker
reads zero untriaged/1,678 live items. No full RFC, capability or milestone is promoted,
and no protected intent sentence is newly falsified. The 1.0 goal stays active. Shared
unrelated edits are excluded; no push, publication, worktree or archive edit follows.
