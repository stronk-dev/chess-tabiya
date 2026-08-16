# D355 reading-cost harness — DISPOSABLE

Research tooling under `rfc/0000-rfc-process.md` §Exploration gate. **Not production code.** Not
referenced by `apps/` or `packages/`, not part of `pnpm test`.

Ledger question: **D330/D331** (`design/BACKLOG.md`) — *is time a difficulty lever that constrains
the learner without touching the power curve?* Dossier:
`design/research/time-as-a-difficulty-lever.md`.

## What it measures

The **reading cost** of the assistance this product ships today, grouped by the
distance-to-answer axis (`kind` / `fact` / `ranking` / `move`) landed in
`design/research/coaching-versus-cheating-and-the-band-curve.md`. Every string counted is
produced by a **shipped renderer** over **shipped content**; no copy is invented here.

Population, named before the instrument (the trap this repo has four attestations for):

- the **47 committed packs** in `content/drafts/` — 721 spine transitions, 609 distinct positions,
  the same corpus and walker `tools/r1r2-primitives-harness/corpus.ts` gives R1/R2/R3/R11;
- the **25 shape entries** in `content/shapes/`;
- the **43 cached real Lichess explorer responses** in `content/sources/lichess-explorer/`,
  decoded from their base64 bodies and rendered through the shipped `renderCorpusPage`;
- the **recorded Maia candidate-count distribution** (105 keys, armA) from
  `tools/r5-maia-stability-harness/out/stability-summary.json`, because
  `DrillScreen.svelte:1032` renders every non-`offWindow` candidate;
- the **89 pack-shaped documents** (declare `id` + `phase` + `opponentPolicy`) across
  `content/drafts`, `content/candidates` and `content/packs`, for the `plyHorizon` census.

Reading rate: **238 wpm**, Brysbaert (2019), *How many words do we read per minute? A review and
meta-analysis of reading rate*, 190 studies / 18,573 participants — adult **silent** reading of
**non-fiction** English. <https://doi.org/10.1016/j.jml.2019.104047>

Move budget: **600 s / 40 moves = 15 s**. The 40-move reference game is *Lichess's own*
convention — it classifies a time control by `initial + 40 × increment`
(<https://lichess.org/faq>) — so the denominator is the platform's, not this harness's.

## Distance labels

Assigned per rendered family, syntactically, per the criterion's own rule (*does the item name a
specific legal move in this position*). The assignment table is in the source and is the part a
reader should dispute first:

- `fact` — every structural observation except `named_structure`, every transition observation,
  the compare-strip sentence;
- `kind` — `named_structure`, the phase reading, the endgame reading, the guided shape block
  (`DrillScreen.svelte:1028`) and the full shape panel (`ShapePanel.svelte`);
- `ranking` — the corpus page, the human split, the `human_divergence` pivotal marker;
- `move` — a bare `bestmove` SAN and a 6-ply `bestline` PV. **Both are refused product-wide today**
  (`capabilities.ts:96`); they are measured for what they *would* cost to read.

## Run

```sh
npx vitest run --config tools/d355-reading-cost-harness/vitest.config.ts
```

Writes `d355-output.md` beside this README.

## Not measured here

- Whether a learner *understands* an item — only how long the text takes to read at a published
  silent-reading rate. Every number here is therefore a **floor**: mapping "d5" onto a board is
  work that 238 wpm does not price.
- Per-item cost under the shipped default. `SILENT_ASSISTANCE` shows nothing (`05` §3a), so the
  aggregate columns describe the opted-in states, not the default.
- Any actual clock. None exists (`clockState` has zero readers).
