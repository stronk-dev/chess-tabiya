# Evidence-to-move independent population — signal replicated, fitted head returned

**Question:** D1162/D810. Does the registered candidate-evidence plane retain move-choice signal
on different games and labels, and does the preregistered diagonal head turn that signal into a
usable distribution?

**Feeds:** `rfc/evidence-move-selector.md`, F8, H5/C5, the bot roster, and the shared evidence
foundation consumed by guidance, Review and drills.

**Method:** preregistered disposable measurement. The frozen plan is
`planning/platform-alignment/bot-policy/d1162-independent-population-plan.md`; the instrument and
aggregate result are under `tools/d1162-independent-population-harness/` and
`planning/platform-alignment/bot-policy/d1162-independent-population-results.{json,md}`. The
candidate plane ran from clean commit `633f541e245edd1737ee9224c6ed90c26fa009a9`, so concurrent
semantic-collector edits could not change the treatment mid-screen. Every factual claim below is
a direct reading of those artifacts and is `[V]`.

## 1. Verdict

**The evidence representation replicates; the fitted diagonal selector does not clear.** The
formal preregistered primary gate passes: over 515 held-out decisions from 108 independent games,
evidence-only raises game-averaged probability on the move actually played over uniform by
**0.104498 [0.081307, 0.129304]**, and evidence+engine raises it over engine-only by
**0.078447 [0.056700, 0.101782]**. Both means and intervals are positive in all three rating bands.
`[V]`

The same combined head is decisively worse on the proper score and every safety description:
cross entropy **6.451 vs 2.958**, top-choice agreement **15.8% vs 33.5%**, expected Stockfish loss
**250.6 vs 166.9 cp**, and mass above 250 cp **43.4% vs 23.0%**. The representation carries a
repeatable association with what people play; the diagonal fitting rule turns it into a
pathologically concentrated and unsafe move distribution. The selector RFC remains gated. `[V]`

## 2. Independent population and capture

The source is the committed R2 fixture, SHA-256
`a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`: 108 rated-standard
Lichess games, twelve in every Bullet/Blitz/Rapid × 1000–1399/1400–1799/1800–2199 cell. Decisions
come from positions immediately before plies 8, 16, 24, 32, 40 and 48. This changes both the games
and the label from the first screen: one observed played move rather than explorer population
counts over authored positions. `[V]`

Extraction found 579 candidate decisions. It removed all seven decisions belonging to three
repeated FEN identities and the one position overlapping the first screen, retaining 571 positions
across all 108 games and 19,172 generated legal candidates. Stockfish 18 then enumerated every
root move at depth 12 with `Threads=1`, `Hash=16`, `ucinewgame` and `Clear Hash`. Normalized engine
identities were set-equal to chessops' complete legal set at all 571 positions. Fifty-six positions
with mixed mate/cp scoring were excluded rather than coercing mate to cp, leaving 515 decisions and
17,359 candidates for every arm. `[V]`

All decisions from one game share a fold. Confidence intervals resample the 108 games, averaging
each game's decisions before aggregation, so a six-decision game is one human cluster rather than
six independent observations. The input digests are pinned in the JSON result. `[V]`

## 3. Formal primary result

| rating band | evidence-only − uniform | evidence + engine − engine-only |
|---|---:|---:|
| 1000–1399 | 0.130164 [0.079952, 0.184265] | 0.106146 [0.058923, 0.158392] |
| 1400–1799 | 0.103345 [0.066495, 0.141838] | 0.076068 [0.042322, 0.111203] |
| 1800–2199 | 0.079984 [0.050248, 0.110879] | 0.053128 [0.025292, 0.082209] |
| **pooled** | **0.104498 [0.081307, 0.129304]** | **0.078447 [0.056700, 0.101782]** |

The direction is also positive descriptively in every speed and target-ply slice. It weakens with
rating but does not invert. This is stronger evidence than the first screen that the registered
features contain information about human choice beyond engine loss. It is not evidence that the
head is a good probability model. `[V]`

## 4. Why the green criterion is insufficient

Mean probability assigned to one observed move is not a proper scoring rule. A model can improve
it by putting very high mass on a subset of observations while driving many other observed moves
toward zero. Cross entropy exposes exactly that failure. `[V]`

| arm | arithmetic mean mass on played move | geometric mean mass (`exp(-cross entropy)`) | cross entropy |
|---|---:|---:|---:|
| uniform | 0.038526 | 0.031418 | 3.460367 |
| engine-only | 0.067002 | 0.051928 | 2.957891 |
| evidence-only | 0.143024 | 0.001487 | 6.511241 |
| evidence + engine | 0.145450 | 0.001579 | 6.451142 |

The combined arm's arithmetic mean looks excellent while its geometric mean is **33 times lower
than engine-only**. That is not a secondary quibble; it is the distribution revealing that the
primary average hid its tail. Top-choice agreement confirms the same shape: evidence-only reaches
15.1% and combined 15.8%, versus engine-only's 33.5%. Uniform's identical 33.5% top-choice figure is
a tie-index artefact because the probe orders candidates by engine rank and is not interpreted.
`[V]`

Every evidence-only and combined inner fold again selected the maximum declared penalty,
`lambda=10`; engine-only selected the minimum, `0.01`. The boundary warning from the first screen
therefore reproduced rather than clearing. The diagonal rule ignores feature correlation and lets
many correlated evidence leaves collectively swamp the one engine-loss dimension. This is an
inference from the measured boundary and output shape, not a causal fact; it is the hypothesis the
replacement model must test. `[V]`

## 5. Safety direction

The simple head also loses the engine guard before any multi-ply branch exists:

| arm | expected loss | mass above 250 cp |
|---|---:|---:|
| uniform | 249.9 cp | 38.0% |
| engine-only | 166.9 cp | 23.0% |
| evidence-only | 254.7 cp | 44.2% |
| evidence + engine | 250.6 cp | 43.4% |

Adding engine loss to this fit recovers only 4.1 cp and 0.8 percentage points of severe mass from
evidence-only. It behaves much closer to the unsafe evidence head than to the engine arm. A later
error guard remains necessary, but a guard does not repair the false probability model underneath;
it only bounds its worst choices. `[V]`

## 6. Consequences

1. Record the formal preregistered verdict as **pass**, because changing it after the result would
   falsify the research record.
2. Return the diagonal fitted head and the pass criterion. Do not implement or start the multi-ply
   packet from this distribution.
3. Treat both completed populations as development data for a replacement conditional-choice
   model selected on a proper score. Freeze that model before evaluating it on a third untouched
   game population. The surviving 120 MB R2 source prefix contains later, unused games, so this
   does not require bulk ingestion or a network fetch.
4. The next gate must require evidence-only cross entropy to beat uniform and combined cross
   entropy to beat engine-only, with game-clustered uncertainty, while retaining legal-set identity
   and explicit engine-loss tails. Mean played-move probability remains descriptive only.
5. No result here licenses `human-like`, Elo, personality, skill, causal explanation, or production
   use. H5/C5 remain unmet.

No `DESIGN-GAP:` is opened. D1297 records the failed gate class and routes the repair back to the
existing selector lane.
