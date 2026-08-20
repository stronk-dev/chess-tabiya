# Integrated platform alignment audit

**Date:** 2026-08-20

**Scope:** competitor capabilities, evidence/guidance, semantic detectors, post-game review,
human-like opponents, player classification, theory retrieval, and content-foundation coupling.

**Method:** living-code audit `[V]`; current vendor documentation `[V]` for what a product
advertises, not for independent quality; community launch/recommendation threads `[P]`; design
recommendations `[M]`. This is a breadth-alignment dossier, not an RFC.

## Verdict

The foundation is mechanically broad, but it is not yet the stable platform implied by the
owner's vision. Tabiya already has unusually good raw ingredients — typed evidence, Stockfish,
Maia, tablebase, explorer/theory sourcing, branch attempts, comparison, assistance permissions,
story moments, concept storage, pack primitives, and a self-hostable shell. The missing object is
an **evidence compiler** between those ingredients and learner-facing products.

Today, producers emit facts into several unrelated shapes; some facts are rendered directly, some
are discarded, and several controls have no producer. There is no common contract that selects
what is interesting, reads its sign, identifies its consumer, or turns it into a bounded module
such as a nudge, board highlight, review moment, theory link, bot-policy input, or player-profile
metric. The result can be both noisy and thin: a large factual dump about simple geometry, yet no
precise fork, pin, discovered attack, castling-right loss, or latent multi-ply threat.

The competitor thesis is credible only in a qualified form. No inspected product combines the
full rehearsal loop, strong analysis/theory, human-like opponent policy, post-game review,
transparent player profiling, and self-hosting. But “implement every appreciated feature” cannot
be a literal parity backlog: some appreciated products conflict with the thesis, law 8, or the
rejected puzzle/course/engine-review shapes. The roadmap unit should be the **capability and its
transformation**, not the competitor that happens to expose it.

Most importantly, content should not scale yet. The pack schema is at 0.27 and active documents
already claim 0.28 and 0.29; 42 commits have touched pack/schema code and 61 have touched content
since 2026-08-11, while all 50 product packs remain drafts. `[V]` Until producer, detector, and
pack-primitive contracts stabilize, every authored wave buys migration and re-authoring debt.

## What the market is teaching us

The current market is converging on a loop broader than “analyse a game”:

> play → review → understand → retry/train → accumulate a profile → share or return

That convergence does not prove learning efficacy. It does show which experiences people expect
to fit together.

| Capability people appreciate | Representative evidence | Tabiya now | Transformation worth adopting |
|---|---|---|---|
| Free theory, analysis and exploration | Lichess provides studies, Stockfish analysis, opening explorer, tablebases, learn-from-mistakes, play and social surfaces in one free product. `[V]` [Lichess features](https://lichess.org/features) | Engine, explorer, tablebase and authored theory exist, but runtime opening identity is refused and theory is not a contextual help module | Position-keyed theory card and source link, selected by the evidence compiler; always return to branch/replay |
| Polished post-game ritual | Chess.com Game Review exposes move classifications, explanations and retry; Insights aggregates phase/opening/play patterns. `[V]` [Game Review](https://support.chess.com/en/collections/13175943-analysis-game-review), [Insights](https://support.chess.com/en/articles/8708925-what-is-insights-on-chess-com) | Generic story moments and an evaluation-led share card | A grounded Review Map: phase arc, pivotal facts, avoided/enabled events, theory/drill links, and re-entry actions |
| Human-like and characterful opponents | Chessiverse describes candidate curation, stronger-engine filtering, per-bot opening repertoires and measured output personalities rather than raw model choice. `[V]` [How Chessiverse bots are created](https://chessiverse.com/articles/how-chessiverse-bots-are-created) | Maia mode plus target Elo/temperature/top-p; theory mode restricts a spine | Separate base model, strength, repertoire, style, error character, time model and memory; validate each layer |
| Guided board support | Chessiverse markets Guided Play; its wider product advertises 1,000+ bots, tournaments, courses and smart-board support. `[V]` [Chessiverse](https://chessiverse.com/) | Assistance axes expose evidence largely as labels/lists; arrows have no producer | Named intent presets composed from modules: threat radar, blunder prevention, structure nudge, theory breadcrumb, touch/hover consequence preview |
| Fun, inspectable player identity | Chessiverse advertises a game-derived 51-metric, eight-dimension, 30+-archetype classifier; these are vendor claims and its page also retains contradictory older preference-quiz copy. `[P]` [Chess personality](https://chessiverse.com/chess-personality) | Concept rows exist; no style metric/archetype contract | Versioned metric registry, sample/confidence display, evidence drill-down; keep style separate from rating and advice |
| Re-enter at the mistake | Beacon offers key-position review, candidate lines/explanations and Maia-based play; Quackmate advertises turning-point replays and share cards. `[V]` [Beacon](https://beaconchess.com/), [Quackmate App Store](https://apps.apple.com/us/app/quackmate/id6789064676) | Rewind/branch/compare is the strongest implemented loop, but the learner has to find the useful branch | Auto-*offer* a grounded re-entry/branch; never auto-play and never reveal before commitment |
| Longitudinal coaching | Sensei markets recurring-weakness analysis over game blocks, phase/opening/activity statistics and weekly audio. `[V]` [Sensei features](https://www.senseichess.com/features) | Run/attempt history exists; no grounded longitudinal style/weakness projection | Aggregate only registered facts with minimum samples and uncertainty; LLM may narrate but not derive the diagnosis |
| Opening workflow around live sites | RepCheck compares live moves to a PGN/RookHub repertoire on Chess.com/Lichess. `[V]` [RepCheck](https://chromewebstore.google.com/detail/repcheck-%E2%80%94-opening-repert/mhddbldcaancdahlochjanpkkboaccpn) | Repertoire import and theory strictness exist inside the app | Treat external integration as an optional adapter; preserve self-contained rehearsal as the core |
| Broad mobile chess workbench | ChessLab combines opening, puzzle, endgame, Stockfish, offline and online modes. `[V]` [ChessLab](https://trychesslab.com/) | Broad primitives but fragmented workflows | Mine navigation, defaults and continuity; do not copy independent-mode sprawl |
| Human-ish training utilities | Qchess.net's launch post advertises time management, a “Grimmer” opponent, win-rate repertoire and guess-the-move over a large database. This is founder/community self-report, not an independent teardown. `[P]` [Qchess launch](https://www.reddit.com/r/chess/comments/1klwe28) | No time-behaviour model or guess-the-move module | Record capability candidates; hands-on test before adoption |

The 2026-08-20 community resweep also repeatedly mentioned RookHub/RepCheck, ChessLabHQ,
Beacon and Quackmate. `[P]` [Recommendation thread](https://www.reddit.com/r/chess/comments/1uhmc2a/best_chess_training_app_or_website/)
Names are not reliable identities: Qchess.net and QuChess are different products, and multiple
products use ChessLab. The capability watch must store canonical URLs, not names alone.

### Integration boundary

The following can fit the thesis after transformation:

- analysis becomes selection of a position to replay, not an endpoint;
- tactics become consequences to survive/exploit, not isolated find-the-move puzzles;
- courses become cited theory plus authored rehearsal packs, not passive lesson completion;
- personal-game history selects and contextualizes material but is never required;
- human play, tournaments and federation remain later social infrastructure, not prerequisites for
  the individual loop;
- fun profiles describe measured habits and uncertainty; they do not manufacture a rating or a
  psychological diagnosis.

This boundary is the audit's operational reading `[M]` of the owner's D555 breadth ruling; each
specific capability still needs its adopt/transform/defer decision before implementation.

## Code audit: the layers that actually exist

### 1. LLM guidance is a paraphraser, not a knowledge system

The server constructs a rich evidence packet, but the external voice provider receives only
`{ personaPrompt, sentences: packet.sentences, scope }` in
`apps/server/src/external-voice.ts:35`. `[V]` It does not receive structured observations,
counterfactuals, sources, theory passages or an assistance intent. The voice checker then bounds
new chess vocabulary, squares, UCI/SAN and judgment/prescriptive language against the same
sentence packet. `[V]` This is deliberately safe and deterministic, but it cannot independently
choose the important fact or support a nuanced hint.

There is no crawler, document index, embedding store, vector search, or cited retrieval path in
this repository. `[V]` Therefore the current architectural choice is neither “RAG” nor “pure LLM
reasoning”; it is **deterministic sentence selection followed by optional constrained rewriting**.

#### Retrieval recommendation

Do not add arbitrary live web scraping to the hint request. A source changing, disappearing, or
containing adversarial prose must not alter chess guidance at runtime. Instead, research a
versioned **knowledge plane**:

1. Ingest only allow-listed, licensed material offline; store source URL, licence, fetch time,
   digest, section and version.
2. Retrieve deterministically by chess keys first: ECO/opening, normalized position or
   transposition, structure, motif, phase, principle and pack/claim pointer.
3. Use embeddings only to find or rerank related approved passages when exact keys do not settle
   it. Similarity is not evidence of truth.
4. Attach the retrieved passage and citation to the evidence packet; the selector may abstain.
5. Select the disclosure rung and module deterministically. “Degrees of obtuseness” are a hint
   ladder — e.g. attention direction → named motif → candidate area → explicit line — not a
   temperature prompt.
6. Let the LLM render only the selected facts/passages into the chosen module. It never grades the
   move, chooses the evidence, promotes the disclosure rung, or adds a strategic claim.

`~/frameworks/monorepo/api_consultant` is useful prior art `[V]`: its crawler enforces robots,
delay, size limits, sitemap handling and cached hashes; its embedder chunks/deduplicates content;
and its schema invalidates vectors when the embedding model/dimension changes. Those operational
guards are reusable ideas. Its general semantic-search service is not itself the chess truth
model: Tabiya has stronger domain keys and law-8 provenance requirements.

### 2. The classifier is a low-level census

`packages/schema/src/drill-pack/types.ts:372` declares 18 structural kinds and line 429 declares
six transition kinds. `[V]` `structuralReading` emits piece counts, bishop-square colour, immediate
attack reach, blockers, pawn/file facts and three named families (Carlsbad, IQP and Maroczy) in
`packages/runtime/src/structure.ts:440-499`. `[V]` `piece_reach_count` is current attack geometry;
it is not “what this knight/bishop can threaten in two or three moves.” `vacationReading` can find
a slider newly unblocked when a square is vacated, but it is not bound to a semantic discovered-
attack module and has no current consumer (D546). `[V]`

The shipped vocabulary has no first-class fork, material pin, skewer, discovered attack,
overload, deflection, decoy, removal of defender, back-rank condition, castling-right loss,
development event, trade event, pawn island, prophylactic prevention, promotion race, or multi-ply
threat. `[V]` Some can be exact board arithmetic; some require search; some require a human-corpus
comparison; some are theory labels. Treating them as one “classifier” hides different error modes.

The measured delivery failure remains decisive: five high-volume kinds are below 1.0 lift and,
with unconditional observations, 90.2% of the reading carries no discriminating information;
ranking the existing kinds by measured lift produces far more precision (D542-D545). `[V]` This
means the roadmap needs **both** semantic breadth and disciplined selection. Adding more detectors
to the raw list would make the present UX worse.

Every evidence kind should declare:

- grounding family: exact rule, engine/search, human corpus, theory catalogue, or authored;
- sign and event direction: created, removed, preserved, avoided, enabled, or uncertain;
- subject, object and involved squares/pieces;
- confidence/exactness and an explicit abstention reason;
- provenance/version and counterfactual query semantics;
- allowed consumers and minimum disclosure rung;
- positive, hard-negative, mirrored and counterfactual fixtures;
- a validation corpus and measured precision/coverage by consumer.

Lichess's CC0 puzzle database/theme vocabulary can seed validation of tactical motifs, but it must
be recut as consequence evidence rather than a tactics-trainer corpus. `[V]`
[Lichess open database](https://database.lichess.org/)

### 3. Bot modes are not personalities

`packages/runtime/src/types.ts:71-73` gives opponent policy only `targetElo`, `temperature` and
`topP`. `[V]` `apps/server/src/opponent-selector.ts` implements human-common Maia selection,
theory-spine restriction, perfect tablebase and practical tablebase resistance. `[V]` There is no
personality/repertoire object, phase-specific tendency, error-shape policy, move-time behaviour,
repeat memory, adaptation, or objective validation of style.

A durable bot contract should separate:

| Layer | Example responsibility | Validation |
|---|---|---|
| Base move model | Maia model/band or another human policy | human move likelihood by rating/phase |
| Strength calibration | expected score and blunder severity | held-out games, not nominal band |
| Repertoire | distribution over openings and deviations | diversity, repeat rate, human frequency |
| Style policy | initiative, simplification, risk, pawn/king preferences | predeclared measurable output traits |
| Error character | plausible oversights without absurd giveaways | human error-type and severity distribution |
| Time model | think-time and time-pressure behaviour | human timing distribution |
| Memory/adaptation | avoid robotic repetition; bounded response to learner | repeat-session tests and disclosure |
| Voice | sparse character/chat | completely separate from move choice |

Shared evidence may inform these layers, but the opponent must not exploit facts a human at its
declared strength would not perceive. A style label that only changes chat is not a bot personality;
a style policy that silently changes strength is not calibrated.

### 4. Player classification has storage but no metric contract

`attempt_concepts` is persisted and queried in `apps/server/src/storage.ts:1419-1560`; `[V]` it can
support concept credit. The active `learner-rating` RFC is still a draft and intentionally separate
from style. There is no current implementation defining style dimensions, reference population,
minimum sample, confidence, stability, archetype version or evidence drill-down. `[V]`

A fun profile is compatible with law 8 when each dimension is a transparent aggregate of
registered facts. It should say “observed in 8 of 23 eligible middlegame decisions; low
confidence,” not “you are a tactical genius.” Great-player matching is nearest-neighbour
description over the same declared features, with dataset and uncertainty visible. Personal tips
need a second contract: a profile can describe a habit without claiming it is a weakness.

### 5. Current story is not yet Game Review

`packages/runtime/src/story.ts` has six mechanical moment families and a fixed
`STORY_PIVOT_CP = 150` (`:30`, used at `:86`). `[V]` `GameStoryScreen.svelte` shows a short list of
moments and the share image selects one sentence rather than a grounded story arc. `[V]` There is
no opening identity, phase summary, human-commonness context, semantic tactic/structure event,
best defensive resource, recurring pattern, or training-focus selection.

The target should be a **Review Map**, not the rejected “engine review screen with a rewind
button”:

- an opening/theory breadcrumb and phase arc;
- a small number of signed, relevant moments (“you preserved…”, “this enabled…”, “you avoided…”);
- engine-defined navigation labels where useful, without pretending centipawns are pedagogy;
- compare, retry, re-enter, branch and drill actions on every actionable moment;
- a cited theory/principle link only when retrieval has a grounded match;
- one evidence-backed training focus, with sample/confidence when longitudinal;
- social recap templates that select facts first and word them second; no raw CP jargon by default.

This is the point of differentiation: competitors mostly stop at explanation; Tabiya should turn
the explanation into a new committed attempt.

### 6. Pack/content coupling needs a gate

`packages/schema/src/index.ts:2` reports drill-pack 0.27; active RFC lanes claim the next two pack
versions. `[V]` All 50 learner-facing packs are still drafts. The commit-history counts in the
verdict were measured with `git log --since=2026-08-11 -- <paths>` on 2026-08-20. `[V]`

Before a large authored wave, require:

1. no accepted/implementing RFC holds a pack-schema lane;
2. one versioned producer→evidence→module manifest with no unexplained orphan in either direction;
3. detector semantics v1 and a non-vacuous validation harness;
4. a pack capability/deprecation registry and additive-evolution rule;
5. automatic migration plus read-only dry-run over every pack and sidecar;
6. an explicit re-authoring cost report for any non-mechanical change;
7. a small sacrificial official-pilot set that exercises every required primitive and guided
   module at real viewport/interaction states;
8. only after those pass, a scale wave with content closeout.

This does not require detector completeness forever. It requires stable extension points and
honest versioning so a new detector can be added without rewriting old authored claims.

## Required architecture: evidence is not a screen

The research points to four planes and several modules:

```text
PRODUCERS                 EVIDENCE PLANE              POLICY PLANE
rules / search /          typed facts + sign +        relevance + intent +
Maia / explorer /   -->   provenance + confidence --> permission + disclosure
theory / authored         + counterfactuals            + abstention
                                                           |
                                  +------------------------+
                                  v
RENDERING / CONSUMER MODULES
board touch/hover · threat radar · blunder prevention · structure nudge
theory breadcrumb · comparison · Review Map · social recap
bot policy · player metrics · campaign/concept credit
```

The same fact may serve several modules, but no module should consume a naked producer response.
Each module declares required fields, latency budget, minimum confidence, assistance rung,
session-kind ceiling, failure/abstention UX and telemetry. The LLM belongs in rendering. It is not
the join between producers and consumers.

For a non-technical learner, the primary controls should be intent presets rather than evidence
toggles: **Just play**, **Keep me safe**, **Nudge my attention**, **Teach the idea**, and **Full
analysis** are candidate research labels, not settled copy. Advanced settings may expose the
underlying modules, but the default workflow must never ask a learner to understand Stockfish,
Maia, structural readings or provenance kinds.

## Roadmap consequences

The single program is recorded in `planning/platform-alignment/plan.md`. Its hard dependency is:

1. repair lifecycle/register truth and finish already accepted work;
2. complete detector, evidence-presentation, retrieval, bot-policy and player-metric research;
3. accept and implement the evidence-producer/module contract plus content-stability gate;
4. build guided presets/modules and the grounded Review Map;
5. validate human-like bot and profile projections;
6. freeze a pilot pack primitive set, graduate a small official corpus, then scale content;
7. only then expand campaign, async teaching, broad social/human play or federation.

This ordering is not “infrastructure first” by habit. Every desired surface currently depends on
the same missing semantics. Scaling independently would fork facts, labels and content obligations
across guidance, review, bots and profiles.

## Research still required

- Hands-on, same-position comparison of Chessiverse Guided Play/bots, Chess.com Game Review,
  Beacon re-entry, Quackmate profile/share, Sensei longitudinal reports, ChessLab and Qchess.
- Detection landscape by grounding family, including tactical-theme validation precision and
  multi-ply threat definitions.
- Evidence-presentation study: progressive disclosure, alarm fatigue, touch/hover accessibility,
  blunder-prevention timing and abstention UX.
- Bot-policy literature and measurement: Maia-2/3 conditioning, human error taxonomies, move-time
  distributions, opening diversity, subjective bot-human discrimination.
- Player-style metric validity and stability; explicitly test whether archetypes add motivation or
  merely produce horoscope effects.
- Retrieval experiment comparing deterministic chess keys, hybrid retrieval and embedding-only
  retrieval on a cited theory set; measure answerability and false-match abstention, not prose charm.
- Owner rulings on per-session assistance ceilings, the exact Gate-F clearance proof, and whether
  human-play/social infrastructure belongs before or after official content. D555's breadth
  ambition and D560's content hold were ruled in the request that commissioned this audit.

## Ledger effects

This audit records D555-D562. It expands rather than duplicates D542-D554: those rows discovered
noise, sign, tactical omissions, orphaned producers and the first competitor ideas; these rows add
the integrated-platform boundary, capability watch, knowledge plane, semantic detector contract,
Review Map, content admission gate, bot-policy gap and player-metric gap.
