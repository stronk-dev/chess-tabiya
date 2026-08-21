# Theory↔drill current join audit

**Platform-alignment question:** R8  
**Date:** 2026-08-21  
**Status:** current-product and targeted desk arms answered; fixed-position prototype and owner use remain  
**Instrument:** `tools/r8-theory-drill-harness/`

## Verdict

Tabiya has enough stable authored identity to build a real theory↔practice loop, but no learner
workflow closes it today. `[V]` Pack→shape references are validated; 38/50 authored draft packs name
a shape, and the server can reverse that relation into matching pack IDs after a learner encounters
a shape. The final action then discards the selected pack ID and merely navigates to `/play`.
Shape panels have no drill door, Library has neither pack-open actions nor a theory catalogue, and
Review declares no theory/drill link form. (`pack-validation.ts`; `service.ts:812-827`;
`App.svelte:674-677,825-831`; `ShapePanel.svelte`; compiled `review.story` consumer)

The missing object is not another prose store or semantic search service. It is a typed,
abstaining **applicability edge** between an admitted evidence identity and a playable target:

```text
evidence identity + current position
  → exact applicability result
  → theory entry and/or pack target
  → launch preserving source run/node
  → completed attempt links back to the source
```

R4 already refused semantic retrieval as the authority for this edge: exact+FTS beat the semantic
arms on its fixed gold set, and semantic safety/abstention failed. `[V]`
(`design/research/theory-knowledge-pipeline.md`) F7 therefore needs a deterministic identity/index
contract first; an optional builder may retrieve candidate passages but cannot establish that they
apply.

## Method

The executable arm reads all 50 authored draft packs, 25 official shapes and their evidence
sidecars, then inspects the learner routes and compiled Review consumer. It distinguishes authored
drafts from unpublished sourcing candidates and `present` from `prospective` shape references. One
focused test pins the current counts and missing joins and generates `audit-output.md`. `[V]`

This arm does not judge theory correctness, manufacture a transposition relation, or claim that a
cross-product navigation pattern improves learning.

## 1. The reusable identity substrate exists

`[V]` The authored draft corpus contains **44 pack→shape references** across 38/50 packs: 41 are
`present`, three `prospective`. They cover **21/25** official shapes. Every middlegame pack names a
shape; coverage is 14/20 openings, 8/14 endgames and 2/2 cross-phase trajectories. Four shapes have
no pack target: `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, and `vancura`.

`[V]` Packs also carry **82 principle references across 12 identities**. These ground claim
provenance, but no learner catalogue exposes principles as reusable theory or finds packs by them.
That is a product join gap, not evidence that every principle should become a lesson.

`[V]` The opening emitter has created **52 opening-identity records across nine unpublished
candidates**. The 50 authored drafts carry **zero**. F1 accurately declares the projection as an
authoring source record and explicitly says it is not a runtime guidance sentence. Thus opening
identity is a working sourcing primitive but not current learner evidence; R8/F7 cannot pretend the
candidate shelf is runtime coverage. This sharpens D544/D634 without replacing them.

## 2. The current learner joins break at the last metre

### 2.1 Detected shape → pack

`[V]` `shapeRecommendations()` computes encountered shape IDs, excludes shapes already attempted,
and returns matching `packIds`. That is the desired reverse index in working form. Its web action
renders “Find {packId}” but calls `navigate("/play")`; `/play` opens the generic pack list and the ID
is lost. `controller.startPack(packId)` already exists on that page, so this is a missing identity
handoff, not missing drill machinery. (D692)

The same server query compares only `shape.shape === id` and does not require
`relation === "present"`. `[V]` The three prospective references can therefore be advertised as
practice even though the shape contract says prospective references never fire, grade, or open
authored feedback. (D693; `docs/shape-library.md`)

### 2.2 Theory and Library → drill

`[V]` A shape panel renders the exact shape ID/version, plans, signatures, watch points, mistakes and
provenance. It accepts only `entry` and `onClose`; it has no related-pack input or action. The
Library route lists pack title/status as inert text and run artifacts as buttons. It exposes neither
shape nor principle entries, and even its pack rows cannot open a pack. This is not a content
shortage: 25 shapes and 50 draft packs exist behind surfaces that cannot hand off to one another.

### 2.3 Review → theory/drill

`[V]` The compiled `review.story` consumer accepts no opening identity, F2 semantic event, principle
or link projection and declares no link form. R7 separately proved the action surface offers only
re-entry. F6 may create the moment and retry door; F7 owns the exact theory/drill target and must
return honest empty when it has none.

## 3. What current products make legible

This is a targeted workflow comparison, not a full competitor teardown. First-party/help pages
establish what the products offer; they do not establish teaching effectiveness.

### Chess.com — the clearest adjacent-door workflow

Chess.com's current Practice surface lets a learner choose an opening, endgame, master game, drill
theme or custom FEN and play it against configured resistance; opening/master-game practice carries
a nearby **Learn** tab. `[V]` Game Review separately links the detected opening to an opening page,
personal history and a suggested course, then offers Retry on key moves. `[V]`
([Practice](https://support.chess.com/en/articles/8724749-what-is-practice-on-chess-com),
[Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work))

Transfer: theory and rehearsal are sibling actions over the same named object, and a review moment
keeps its source position when it opens Retry. Refusal: its “right/best move,” Accuracy and move
classification authority is engine grading. Tabiya's transformation is an exact evidence identity
opening a consequence rehearsal, with analysis as an explicit later door.

### ChessTempo — the strongest repertoire identity continuity

ChessTempo's manual says one repertoire tree feeds **Train**, **Train branch**, spaced repetition,
opening-explorer prioritization and immediate post-game feedback at the point a played game deviates
from that repertoire. `[V]` The same repertoire identity therefore survives authoring, selection,
practice and review rather than being rediscovered from prose.
([ChessTempo manual](https://ctapp.chesstempo.com/manual/en/manual.html))

Transfer: store one exact tree/position address and preserve it into review and practice. The
`Train branch` granularity is especially relevant: F7 should launch the nearest applicable unit,
not dump the learner at a catalogue root. Refusal: a repertoire's authored move can be “correct for
this repertoire,” but that does not authorize a general strategic verdict or an engine-best label.

### Listudy — the clearest FOSS theory/practice control surface

Listudy is free/open source and trains against an imported repertoire with spaced repetition. Its
live study surface exposes comments, move/annotation hints, configurable hint duration, reset,
Stockfish play and Analyze beside the same variation. `[V]`
([project](https://listudy.org/en),
[example study](https://listudy.org/en/studies/xv7hx3-the-ponziani-opening))

Transfer: keep theory comments, progressively revealing hints, rehearsal and explicit analysis in
one context; do not force the learner through global settings. This supports the owner's broader
O4 ruling that rich primitives belong behind a workflow preset. Refusal: move memorization and a
Leitner “right move” card are appropriate to an authored repertoire line, not automatically to
middlegame shape guidance.

### Lichess — the best open substrate, but not an automatic join

Lichess Practice exposes named tactical and endgame units; Studies can contain games, variations,
annotations, prose and interactive lessons, and Study PGN is exportable. `[V]` Its analysis board
also exposes opening identity and Learn from Your Mistakes, but these are neighboring tools rather
than a declared current-position→study→practice applicability contract.
([Practice](https://lichess.org/practice),
[blind-mode workflow guide](https://lichess.org/page/blind-mode-tutorial))

Transfer: importable variation/comment identity and a strong theory/analysis substrate. Refusal:
searching public studies by matching words is discovery, not proof that a passage applies to the
position. The absence of an automatic join is exactly why Tabiya's typed edge matters.

### Synthesis

The best workflows all preserve a smaller identity than “topic”: a course variation, repertoire
branch, study chapter or exact practice position. None supplies the law-8-safe middlegame
applicability relation Tabiya needs. The useful synthesis is therefore not one giant Library page:

```text
detect/identify here
  → show the smallest relevant theory unit
  → rehearse from the exact target
  → return to the source position and compare
```

## 4. Required join types

The code audit supports four distinct joins; flattening them into “related content” would erase
their different truth conditions:

| Join | Authority | Current state |
|---|---|---|
| detected shape → shape entry | exact structural trigger + shape version | ships |
| shape entry → pack | validated `present` pack reference | stored; reverse query exists but is semantically loose and UI drops the ID |
| opening position → opening entry/pack | recorded position/transposition identity + cited catalogue row | candidate-only; no runtime reach |
| authored claim/principle → theory/pack | exact registered IDs plus declared applicability | pack→principle stored; no learner reverse index |

A Review moment may consume one of these results but does not create it. Search may rank passages
*inside an already eligible identity set*; it may not turn vocabulary resemblance into
applicability. Theory-only is a valid destination, drill-only is valid, both is useful, and neither
is an honest abstention.

## 5. Fixed-position prototype result

The disposable prototype implements only the exact edge shapes above and passes five focused
checks. `[V]` Every result retains `{runId,nodeId}` so launch can return to its source.

- `shape:carlsbad` resolves the versioned theory entry and two `present` pack targets.
- `shape:hanging-pawns` resolves its theory entry and **zero** packs; “no relevant pack” survives.
- `shape:opposite-castling-race` excludes the two prospective-only opening references.
- an exact `{packId,claimId}` resolves its registered principles and source pack; a bare principle
  is deliberately not treated as position applicability.
- an opening position resolves cited candidate records but exposes **zero launchable packs**, because
  those records remain on the candidate shelf.

The opening index adds D696: **52 records collapse to 49 transposition keys, with three keys carrying
two records**. Each shared position has both the French Advance parent and Main Line descendant
names. Position equality therefore yields
an applicable identity *set*, not a unique label. F7 needs a declared display/specificity rule and
must preserve the full set in provenance.

This result completes the mechanical R8 architecture: exact key → applicable identity set →
versioned theory/launch targets → source-preserving return, with abstention at either target.

## Residual and routing

- **R8:** mechanical and targeted desk arms are complete; owner use remains.
- **O5:** choose the 1.0 source/index posture; R4 supports typed exact/FTS, not semantic authority.
- **O6:** choose the stable primitive and re-authoring budget after the prototype exposes which IDs
  packs must declare.
- **F7:** compile typed applicability results, reverse indexes, launch/back links and empty states.
- **F5/F6:** consume F7 results inside presets and Review; they do not reimplement joins.
- **Content:** no scale-up before Gate F; the four unreferenced shapes and candidate-only openings
  are measured coverage, not permission to mass-author around an unstable contract.
