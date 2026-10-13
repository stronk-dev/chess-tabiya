# Learner Profile reference numbering — D3670

**2026-10-13 · bounded production-boundary characterization, not implementation.**

Question: can the missing chess move number/mover be recovered from the recorded source, or
does this require new captured data? The source already has both; the read-time projection loses
them. `[V]` `apps/server/src/learner-profile.ts` `contributor`, `deriveRunFact`, opening-reference
builders and `observation`; `packages/runtime/src/style-contract.ts` `StyleContributorRef`;
`apps/web/src/lib/profile-response.ts` `contributorRef` and `ProfileScreen.svelte` `moveLabel`.

`make profile-numbering-research` uses the normal built server with mock engines, real auth,
native run creation and legal HTTP commits. Four sparse king/pawn positions start with White
or Black to move and fullmove counter 1 or 37. The actual worker projects their complete legal
populations; no observation, contributor or Profile response is mocked. After all four jobs
settle, the actual observation occurrence page contains their exact run/node refs. They remain
position observations, with zero standard-start measured games. `[V]`
`tools/d3670-profile-numbering/probe.spec.ts`, `playwright.config.ts`.

| Before turn / counter | Legal move | Local ply | Correct number/color | Current native label |
|---|---|---:|---|---|
| White / 1 | e2e4 | 1 | 1, White | Move 1. e4 |
| Black / 1 | e7e5 | 1 | 1, Black | Move 1. e5 |
| White / 37 | e2e4 | 1 | 37, White | Move 1. e4 |
| Black / 37 | e7e5 | 1 | 37, Black | Move 1. e5 |

Desktop (1440×1000) and real-touch Pixel-7 projection each reproduce three wrong labels out of
the four controlled references. Both actual HTTP pages omit `moveNumber` and `mover`; the child
FEN increments its counter only following Black's move. The common observation in these runs
is `derived.semantic_avoidance.king_zone@1:avoided:lost`; this is only a carrier for the reference
experiment, not qualification of that family, a valence claim or natural population frequency.
Both research journeys pass in 9.2 seconds because they assert today's defect. `[V]` same probe;
`packages/runtime/src/recorded-edge.ts` validates the canonical parent/child move boundary.

The disposable source/parser model adds 25 controls over the existing recorded-edge authority:
all four starts, Black's after-counter increment, real roots versus missing nodes, an earlier
sibling after cursor replacement, future nodes beyond a completed prefix, corrupted parent/
FEN/UCI/SAN, invalid counters/colors and mixed-null positions. Its first run passes 24 and fails
on my nonexistent `rewindTo` import; correcting the research calls to actual `rewind`/`fork`
produces 25 passes. The final normal target also repeats both actual browser characterizations
(9.1 seconds), retaining three wrong labels in each four-reference population. This is draft
buildability evidence, not production parser/builder adoption. `[V]`
`tools/d3670-profile-numbering/model.test.ts`, `vitest.config.ts`, `make profile-numbering-research`.

## Next action and limits

Draft `rfc/player-style.md` §8.1 carries the complete repair: one builder at the completed cut,
parent-FEN numbering, actual root versus missing-node distinction, every producer/parser/UI path,
unchanged privacy/metrics and native desired-label predecessor negatives. Independent acceptance
is required. No production source, response, parser, label, data or validation authority changes
in this research. D3669's Story title is deliberately separate because its sealed input lacks
the same operands and cannot be silently widened.
