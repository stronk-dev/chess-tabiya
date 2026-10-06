# D3262 / D3481 — actual four-ply model frontier and composed coverage

Measured 2026-10-06. Disposable research over the separately frozen coherent-root
66-root/193-candidate profile, not the original 196-candidate population and not
production search authorization or the complete five-arm experiment.

## What actually runs

`make semantic-search-maia-fourth-ply-check` joins the previously verified
first-child and second-child policies to **all 1,401 actual ordered third-ply
Maia histories**, then selects that same arm's fourth-ply opponent reply.
The retained artifact `d3262-coherent-maia-fourth-ply.json` has 4,127 distinct
root-plus-four-move histories. The 0.80 arm selects 2,020 fourth-ply edges;
0.90 selects 4,127. Every leaf retains its literal complete FEN, legal next-move
count, terminal reason and arm identity. Every predecessor keeps the exact
first/second/final source bindings and conditional masses.

The compiler replays the entire previous frame from its retained sources and
checks the complete final source before joining. Captured source SHA-256 remains
`64652308c2196cd14b59414fa016506e84aa557fd3419e042437505a52b8c508`; request-frame
SHA-256 remains `3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07`.
New frontier SHA-256:
`ddeb2262fcfd98020b84eec65b4e5d8bb915a81ce5b50c6fbe250406a1ec9bfa`.
No historical source bytes or preregistration were rewritten.

## Three layers are not one node's coverage

Conditioned on a fixed candidate, covered mass is the sum of literal
`p(reply | candidate) × p(learner reply | candidate, reply) × p(next opponent reply | ordered history)`
over the selected same-arm paths. The selected frontier is never renormalized.
First-, second- and third-layer omitted mass remain separately visible, with a
composed residual. Both colors use the declared band-1400 configured model;
actual learners are **not** assumed to follow this policy.

| Node-local prefix | Two-layer minimum joint mass | Three-layer minimum | Three-layer median | Below that same joint threshold |
|---|---:|---:|---:|---:|
| 0.80 | 0.675384 | 0.597414 | 0.780573 | 114 / 193 |
| 0.90 | 0.805792 | 0.777252 | 0.909837 | 85 / 193 |

There are 27,249 omitted legal fourth replies inside the 0.80 arm's visited
nonterminal paths and 42,918 inside the 0.90 arm's broader visited population.
These are **conditional denominators with different visited predecessors**, not
comparable whole-tree omission percentages. Neither counts the unenumerated
learner edges under omitted earlier opponent replies. No omitted branch licenses
prevention, all-defence survival, an exact negative or engine-causality prose.

The complete phase population is retained, including unclear/unclassified rather
than dropping them. These fixed curated candidates overlap; they are not an
independent-game or observed-human frequency estimate.

| Frozen phase | Candidates | Below joint 0.80 | Below joint 0.90 |
|---|---:|---:|---:|
| opening | 49 | 32 | 23 |
| unclear | 53 | 29 | 20 |
| middlegame | 44 | 25 | 21 |
| endgame | 39 | 22 | 15 |
| unclassified | 8 | 6 | 6 |

## Terminal and source semantics

One actual third-ply position is insufficient-material terminal despite retaining
seven legal moves. Its previously admitted path mass is absorbing: the compiler
does not invent another model move, erase that legal denominator or treat the
empty policy as missing mass. Other terminal leaves retain their board outcome
without turning an absorbing game outcome into a universal strategic proof.
Pre-root repetition history remains unavailable. Legal/mate/material/automatic-
move terminal rules are board-backed, not a generated explanation.

The 17 same-FEN history comparisons from the source checkpoint still retain
separate queries; leaf identity includes the root and all four ordered moves.
There is no final-ply FEN-only policy cache. The prefix remains capped at eight,
with the existing configured temperature/top-p source and literal normalization.
This is one model population, not an assessment of human-like bot quality.

## Able-to-fail verification

- `make semantic-search-maia-fourth-ply-check` passes five new tests plus all six
  existing continuation controls. New controls cover 0.81³ versus per-node
  coverage, layered residual accounting, same-FEN/different-history sources,
  byte/history/configuration/mass/population corruption, terminal absorption and
  all actual histories with the complete phase population.
- `make semantic-search-maia-fourth-ply-independent` uses python-chess 1.11.2 in
  the existing image with a read-only repository mount and **no model inference**.
  It reconstructs every selected prefix from the retained policies, replays all
  1,401 predecessor histories and 4,127 fourth-ply leaves, independently recomputes
  all 386 candidate-arm coverage/residual values and verifies the terminal.
  Eight actual in-memory corruption controls must fail at their named guard:
  missing path, crossed history, changed conditional mass, forged terminal,
  duplicate leaf, changed leaf FEN, changed joint mass and lost residual. The
  unchanged complete artifact passes afterwards.

The first instrument run failed: the synthetic fixture shared mutable source/
history references, causing a final-source mutation to alter its predecessor too;
those references are now copied so the negative reaches its intended guard.
It also tried to reproduce Python JSON float spelling with the JS serializer.
The corrected join binds decoded values to the **unchanged literal hashed input**;
it does not reserialize/re-stamp the source to admit a different experiment.
Both failures remain failures, not counted as green verification.

## What this does not close

D3481 closes the bounded model-frontier research prerequisite only. D3478's
16,813-job engine capture is still in progress in its original live batch;
the new model frontier neither restarts that job nor consumes a favorable subset.
Deeper semantic-target selection, common same-target outcomes, counterfactual
contrasts, refutations/proof/abstention and end-to-end cold/warm/offline cost remain
open. D3262, draft RFC criterion 23/Discharge D1 and production profile selection
remain open. No app/runtime/worker/content source changes or new production hint,
bot-quality claim, content graduation, capability, RFC or milestone promotion.
Normal staged process/governance and commit hooks cover the closeout.

Final `make staged-process-contracts verify-governance` exits zero over the owned
checkpoint: exact source/history/register, durable state, roadmap/receipt, protected
intent, docs/test tiers and append-only/flow-back checks pass. Only terminal receipt/
log prose follows that gate; normal hooks recheck the final scoped staged bytes.
No fresh GitHub result or full-release gate is claimed for this research-only wave.
