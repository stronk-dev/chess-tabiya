# Exact Maia occurrence implementation — 2026-10-04

Authority: implementing `rfc/provider-exchange-and-execution.md` §6 and criterion 8.
Baseline: `dbccd67f`. D3362 owns the occurrence primitive; D3363 retains the Inspector
request-shape seam. Neither row declares the provider RFC or evidence milestone complete.

## Scope

The history-conditioned occurrence consumes the actual sealed provider page plus the
authenticated historical run-edge authority. Its start FEN, ordered prior moves, reached
FEN and observed move come from that selected stored prefix, never an ambient cursor or
caller-authored run path. The exact-FEN occurrence separately validates an observed legal
move against the page's exact canonical request position and claims no run history.

Both use the central value-factory dispatcher and preserve the whole sealed page.
Missing candidates remain unobserved; absence from bounded top-k is never probability zero,
move quality, intent or a player diagnosis. Permanent tests cross request kinds, equal-FEN
histories, event heads, branches, legal moves and runtime seal forgeries.

## Inspector seam (D3363)

At the baseline, `apps/server/src/rest.ts`'s GET human-split operation obtains
`guidanceAccess` for the requested node and queries `selector.select` using its history.
It returns `{nodeId, engine, targetElo, candidates}`, without a committed/observed move.
The client consumes this as the next-move distribution at that node. Substituting a
candidate for an observed move would fabricate occurrence evidence; moving the query to
the preceding edge would change the existing surface's meaning. Keep that migration
open and resolve its request contract explicitly, rather than retiring the old route
on a helper-only census.

## Compatibility metadata

The canonical semantic-validation writer updates nine operation implementation receipts and
53 population predicate-implementation digests, adding the occurrence/run-subject modules to
the transitive source closure. Every case, population observation, external evidence and verdict
is unchanged: 81 subjects, 38/38 cases and zero fully validated profiles. This broad closure
coupling remains D3358, not a new semantic validation success.

Against committed baseline `dbccd67f`, all 842 predecessor declarations are retained unchanged.
Seven version-5 compatibility successors and the two new occurrence projections append (851
total). Successors preserve source/dependency identities; the four evaluator modules are
byte-identical. The canonical computed factory profile retains all 272 prior outcomes and adds
only the two new routes. Routine metadata updates change requirements in 104 documents (92
content packs and 12 schema example/fixtures), with 129 version transitions, and change only
packDigest in 68 ledgers. Independent comparison proves zero authored field changes. The
352-document migration plan has zero remaining mechanical, judgement, refusal or restamp rows.
These are canonical compatibility updates, not content expansion, user-document migration or
graduation. See `maia-occurrence-metadata-2026-10-04.json` for the measured before/after image.

## Verification and closeout

`make maia-occurrence-check`: 12 passing tests (nine runtime and three real-storage server
tests). They cover historical/current heads, equal-FEN transposed paths, clocks and legal replay,
branch-specific receipts, wrong grains/kinds, crossed edges, forged pages/subjects, observed
moves outside top-k, canonical castling/promotion and actual read-grant revocation. Unauthorized
requests touch zero supplied page fields. The normal software tier discovers these files;
`make provider-exchange-check` runs 190 tests including these permanent controls.

`make verify-content`: 223 tests/23 files pass, zero clearance errors and all 104 exact
requirement declarations. `make test-browser-ci`: 111 journeys pass, one optional real-Maia
latency skip, zero retries, including production-default rehearsal and all viewport/input modes.
`make verify-software`: 2794 tests/322 files, seven performance tests/four files and all
downstream software/source/history/migration checks pass, with zero type errors/Svelte warnings.
An earlier full run loaded the old producer-order assertion before its test-only correction and
was discarded. The final complete gate runs against frozen source/test bytes; declarations are
unordered compiler input, but their independent exact inventory still detects duplicates.

D3362 closes only the occurrence primitives. D3363, Inspector consumer migration, compiled
execution/source-absence paths, public availability and legacy retirement remain open. The RFC
remains implementing; no whole capability or milestone is promoted. Normal hooks and exact-index
checks run before commit. Unrelated shared changes are excluded; no push, publication, worktree,
protected intent or archive edit is performed.

`make verify-governance` passes: register/status/work/roadmap, history, docs, test-tier and
intent parity are green. Work-state has 3112 durable rows, zero untriaged/unrouted items and
D3363 remains owned todo. The anchored roadmap receipt records this advance without changing
any whole capability or milestone state.
