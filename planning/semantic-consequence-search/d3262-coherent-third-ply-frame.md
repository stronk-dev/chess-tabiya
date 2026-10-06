# D3262 / D3476 — actual two-layer provider replay and final-ply queue

Measured 2026-10-06. Disposable research, not production search authorization.
This extends the separately frozen 193-candidate coherent-root profile, never
the original 196-candidate population. It does not complete any five-arm proof,
choose a production profile, or explain Stockfish's root preference.

## What is now executable

`make semantic-search-coherent-third-ply-check` validates the existing complete
source prerequisites and reproduces `d3262-coherent-third-ply-frame.json`.
It actually follows the same arm at both branch selections: nine separate
Stockfish budget/width configurations and two configured Maia prefixes. Unlike
the earlier first-reply outcome join, its learner replies are selected by each
arm's own retained provider, not supplied by the common exact target evaluator.

All 193 candidates and 1,966 selected opponent paths remain in the population.
Every selected reply retains its full legal learner denominator, selected UCIs,
omitted legal count, provider row binding and ordered history. Provider identity,
input digests, coherent depth/ranks, legal PVs and literal normalized model mass
are checked. Missing or crossed sources fail the instrument; they are not removed
from a denominator or replaced with another arm's source.

The resulting union has **17,507 three-ply paths**, with no no-legal-reply terminal
paths in this population. **17,040 engine paths share 16,813 exact full-FEN jobs**;
each job records only the budgets actually required by its arm bindings, always
at top-eight MultiPV width. The **1,401 Maia jobs retain distinct root-plus-three-
move histories**. A transposition control shares one engine FEN job while keeping
two differently ordered model requests. Pre-root history remains unavailable.

At this frame checkpoint these were final-ply **requests**, not captured answers.
The subsequent `d3262-final-ply-capture-2026-10-06.md` records the complete 1,401-path
Maia capture and independent model re-inference; engine capture remains in progress.
No elapsed
provider time or interactive latency is inferred from their count. The semantic
target-preserving arm and its separate 152-event source population are not folded
into these eleven provider configurations. Their deeper selector remains open.

## Reach, not proof

| Configuration | Selected opponent replies | Selected learner edges | Omitted learner edges inside selected replies |
|---|---:|---:|---:|
| Engine depth 8, width 2 | 385 | 766 | 10,413 |
| Engine depth 8, width 4 | 765 | 3,017 | 19,605 |
| Engine depth 8, width 8 | 1,516 | 11,942 | 33,724 |
| Engine depth 12, width 2 | 385 | 765 | 10,346 |
| Engine depth 12, width 4 | 765 | 3,021 | 19,629 |
| Engine depth 12, width 8 | 1,516 | 11,941 | 33,710 |
| Engine 100 ms, width 2 | 385 | 764 | 10,388 |
| Engine 100 ms, width 4 | 765 | 3,017 | 19,567 |
| Engine 100 ms, width 8 | 1,516 | 11,938 | 33,770 |
| Configured Maia 0.80 | 414 | 877 | 11,228 |
| Configured Maia 0.90 | 508 | 1,401 | 13,420 |

The initial legal denominator is 6,176 opponent replies. Learner-edge omissions
above are **conditional on visited opponent replies**; the instrument does not
pretend it enumerated learners under every omitted opponent branch. No absence
in these partial paths licenses prevention, all-defence survival or causal prose.

## Joint policy coverage

For a fixed root candidate, retained path mass is
`Σ p(opponent reply | candidate, history) × covered learner-prefix mass | reply`.
It is not a mean of per-node coverage, a renormalized selected frontier, or a
human move frequency. First-layer omissions and weighted second-layer omissions
remain separately visible; their sum is the residual. A no-legal-move terminal
is absorbing for this legal-edge calculation, not an empty universal proof.
Other game-adjudication rules are not measured by this legal-edge instrument.
Both sides here use the declared band-1400 model as branch-selection policy;
the learner's reply is not assumed to be sampled from it in the actual product.
This joint mass therefore cannot certify coverage of arbitrary learner defences.

| Prefix at each node | Minimum joint retained mass | Median | Below that same joint threshold | First layer below threshold |
|---|---:|---:|---:|---:|
| 0.80 | 0.675384 | 0.840461 | 54 / 193 | 0 / 193 |
| 0.90 | 0.805792 | 0.934404 | 40 / 193 | 2 / 193 |

Literal float source values are retained with the existing 1e-5 mass tolerance;
a tiny normalized-source rounding overshoot is not new probability authority.
Only residual roundoff is bounded at zero. The 0.90 first-layer exceptions
retain the cap-eight limitation. These overlapping candidate counts are not
independent games or a population estimate. The synthetic 0.81 × 0.81 control
fails a shortcut that treats a per-node prefix as joint 0.80 coverage.

## Verification and prerequisite repair

Artifact SHA-256:
`3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07`.

Six permanent continuation tests cover mass composition and residual accounting,
different-history transpositions, source/model/history/row substitutions, illegal
PV and mixed depth, malformed mass, first-layer prefix mutation, terminal-without-
provider behavior, and the entire retained population. Three manifest controls keep
the original input digest and provenance, reject changed fixture bytes, and rebuild
the real manifest with mutable live-pack reads actively denied.

`make semantic-search-coherent-third-ply-independent` uses python-chess 1.11.2
inside the existing Maia image with a read-only repository mount, without loading
the model or requesting providers. It independently replays all 17,507 paths,
their exact legal denominators, arm bindings and engine/ordered-Maia job partition.
The first independent draft used unconditional-double-push FENs and failed. The
corrected checker uses the **legal-en-passant** convention already used by the
retained chessops/Maia sources, with separate legal-EP and unavailable-EP controls;
it still compares the entire FEN literally rather than erasing EP differences.

D3477 repaired a stale dependency exposed before replay: `manifest.mjs` read the
historical Carlsbad control from the subsequently migrated live pack. Its exact
original bytes were recovered from `fbbfa7a9:content/drafts/carlsbad-minority-attack.json`
into `tools/d3262-search-calibration/fixtures/carlsbad-minority-attack.json`.
SHA-256 remains `b23c29b5d9136ba36f9f15cde34be831b7c13d990e5f3e51a0a84a25a86b7d52`.
The 66-root manifest remains
`244c750c432e0a73f37b32fcbfcc8158a6b511d980fcf9b0267d95f8506dff86`;
the original provenance string and all provider captures are unchanged. Neither
the live pack nor the frozen preregistration was rewritten to make a gate pass.

## Remaining work

Capture and independently validate the declared final-ply jobs; bind them to the
same arm histories and budgets; implement and measure the deeper semantic-target
selection separately; then evaluate common target outcomes, refutations, proof/
abstention, full counterfactual contrasts, phase/focus strata and end-to-end cold/
warm/offline cost. D3262, RFC criterion 23 and Discharge D1 remain open. This
research does not promote a module, content pack, capability or 1.0 milestone.
