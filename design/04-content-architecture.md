# 04 — Content Architecture

Owner ruling 2026-08-11: content is planned at **full breadth**, not as one
opening. The archive's v0 inventory (`archive/brief-v2/implementation/
v0_content_inventory.md`) sized three pack families as a validation sample; this
doc is the product's actual content map — every phase, both colours, chosen and
faced openings, the structures they produce, the endings those structures reach,
and the on-ramp layer beneath all of it.

Sourcing and licences for everything below: `design/research/theory-sourcing.md`
(lichess `chess-openings` CC0 for the name↔line skeleton; explorer API for
rating-band evidence; Wikibooks CC BY-SA for reusable idea prose with
attribution; Lichess puzzle DB CC0 6.06M themed positions for the on-ramp;
Syzygy copyright-free for endgame ground truth).

## 0. Open reframe (owner, 2026-08-13): are packs the *shape library*?

> *"Should we even have drill packs? How can we break chess down into primitives
> and phases… or are drill packs defining the basic reusable shapes and
> structures, and that's how we make it all in one Just Play mode?"*

Recorded as a live proposal, not yet ruled. It inverts this document rather than
editing it, so it is stated here before the taxonomy it would replace.

### What is actually primitive

Facts that exist with no author at all — all rung 0/1/3 in
`05-in-run-experience.md` §3: the position; legal moves; the pawn skeleton;
outposts, open lines and pressure counts; material and phase; terminal states;
the human move distribution at a level (Maia); exact truth below eight pieces
(tablebase); historical frequency (corpus); engine evaluation.

What is **not** primitive, and is the only thing a human must supply: **which of
those facts matters here, and what it is called.** Salience and naming.

### The conflation this exposes

The shipped pack format bundles two different kinds of authored content:

| Kind | Keyed to | Reusable? | Example |
|---|---|---|---|
| **Shape content** | a *structural predicate* | across every position the classifier detects it in | "this is a Carlsbad structure; the plans are minority attack, central break, kingside attack; the minority attack succeeds when a backward c6 pawn appears on a half-open file" |
| **Line content** | a *specific move sequence* | no — it is about these moves | "3.e5 Bf5 4.h4 is the Tal Variation; it spends the tempo you need when ...c5 arrives" |

**Shape content is being re-authored per pack.** "The minority attack" is one idea
that applies wherever the structure occurs; today it would be written again in
every pack whose tree reaches a Carlsbad. That is a plausible explanation for why
authoring measured expensive (`planning/content-era/plan.md`): the format made
the reusable thing non-reusable.

### What the reframe would mean

A **shape entry** is authored once: a structural trigger (the feature predicates
of `05` §5c), a name, its plan classes, what each plan's success looks like
structurally, what to watch, and the typical mistakes. It attaches to any
position — drilled, imported, or reached in a live game — where the classifier
fires. That is the expensive, high-leverage, reusable asset.

A **drill** then stops being a document and becomes a *recipe*: start me in a
position where shape X applies, against resistance Y, with objective Z. Position
sources are already machine-generated (`docs/content-sourcing.md` emits them),
objectives are structural predicates, resistance is an opponent policy. Cheap,
composable, and generated rather than written.

And there is **one play surface**. Just Play stops being the pack-less mode with
degraded guidance and becomes the only mode; the library lights up whenever a
known shape is detected. That is precisely the arc in `00-thesis.md` — steer
early, convert later, grind it out — with the guidance layer following the game
instead of the game following a document.

### What line content is still irreducible for

Not everything is a shape, and the phases differ sharply:

- **Openings** — theory *is* a move sequence. Move-order traps, transpositions
  and the named variations a learner must recognize cannot be reduced to a
  structural predicate. Line content is irreducible here.
- **Middlegames** — almost entirely shape. This is where the reframe wins most,
  and it is also the phase with no theory and no tablebase, so the shape library
  is the *only* guidance source available.
- **Endgames** — type plus named technique, which is shape, with a small set of
  exact positions (Lucena, Philidor, Vancura) that are genuinely line content.

So the honest destination is probably **both kinds, separated** — not packs
abolished, but the reusable half lifted out of them.

### What it would cost

Stated plainly because the shipped format is line-shaped: `drill_pack.schema.json`
is built around `start` + `spine` + `checkpoints` + `deviations`, a position tree.
A shape entry has none of those. This is a new authored artifact and a new
authoring path, not a schema widening — and six RFCs currently in flight all
target the existing format. It also depends on Q4b feature predicates, which do
not exist yet; without them a shape cannot state its own trigger.

**Owner ruling needed.** The three authored packs are line content and stay valid
under either answer.

## 0a. Audit: does authoring a pack make Just Play better?

The owner's test, 2026-08-13: *"how do we make sure any content we iterate on
enhances our Just Play sidebars with theory tie-ins, strategy detection, endgame
patterns?"* Applied to the shipped format, field by field. **Transfers** means:
this survives outside its own pack and can fire in a game nobody authored.

| Field | Anchored to | Transfers to Just Play? |
|---|---|---|
| `start`, `spine`, `spine[].annotations` | this pack's move tree | **no** |
| `deviations` | `spineNodeId` + `moveUci` | **no** |
| `authoredBoundary` | spine node ids | **no** |
| `checkpoints` via `atSpineNode` / `atPly` | this pack's tree | **no** |
| `checkpoints` via `fenPredicate` / `materialBalance` | the *position* | **yes** — and these are the only triggers that do |
| `objective.summary` | this position | no · `objective.type` | general |
| `planClasses` | nothing — free-standing prose | **should**, but is locked inside one pack |
| `concepts` | nothing — bare ids | **should**, but has no cross-pack identity (ledgered) |
| `feedbackClaims` | nothing | **should**, but has no triggers, so it can never fire |
| `opponentPolicy` | nothing — a resistance recipe | **yes** |

**The verdict is unambiguous and it answers the owner's question: no.** Almost
everything a pack contains is anchored to that pack's move tree, and the three
fields that carry genuinely reusable knowledge — plan classes, concepts, claims —
are precisely the three that cannot escape it. One is inlined per pack, one has
no identity across packs, one has no trigger at all. So authoring a pack today
improves exactly one drill and contributes **nothing** to a game nobody authored.

That is not a defect in anyone's work. It is the correct format for what it was
specified to do — run one curated drill — and the wrong format for the thing the
product turned out to be about.

### The rule this produces

> **Content earns its cost by how much of it fires in a game nobody authored.**

Not a ban on line content — opening theory *is* a move sequence and has to be
written as one (§0). A budget and a direction: the reusable half should be the
larger half of the effort, and it currently rounds to zero.

### What changes, minimally

Packs stop *inlining* shape knowledge and start **referencing** it:

- A **shape entry** owns the name, the plan classes, what each plan's success
  looks like structurally, what to watch, and its phase applicability. It is
  triggered by a structural predicate (Q4b features), never by a spine node.
- A **pack** keeps what is genuinely position-specific — start, spine,
  annotations, deviations, boundary — and *names* the shapes it teaches instead
  of restating them.
- The same shape entry then fires in Just Play, because its trigger was never
  about the pack.

Note what already points this way: `fenPredicate` and `materialBalance` are the
two shipped checkpoint triggers that key on the position rather than the tree,
and they are exactly the two that would survive the change. The machinery is
there; the authoring habit is not.

**This is the concrete form of the §0 ruling still owed** — it does not need
packs abolished, only the reusable half lifted out of them.

## 1. The unit taxonomy

| Unit | Scope | Mode |
|---|---|---|
| **Root** | one position + one decision family | any |
| **Pack** | 5–15 roots teaching one claim | one mode |
| **Family** | packs sharing a structure or ending type | mixed |
| **Trajectory** | opening family → its middlegame → its endings | cross-phase |
| **Track** | an ordered path through families for a rating band | curriculum |

A pack teaches one narrow decision family (authoring rule, inherited). Breadth
comes from many packs, not fat packs.

## 2. Openings — both colours, chosen *and* faced

The product's distinctive claim (`design/BACKLOG.md`, anti-opening row): every
existing trainer drills **your** side of **your** openings. Half of real losses
come from positions your opponent chose. Both directions ship.

### 2a. White repertoire spines (chosen)

| Family | Core packs | Why it's in |
|---|---|---|
| 1.e4 open games | Italian (slow + Evans), Ruy Lopez (closed, exchange, Berlin) | the 1400–2000 staple; plan-rich, low forcing noise |
| 1.e4 vs Sicilian | Open Sicilian (Najdorf/Dragon/Scheveningen/Sveshnikov tabiyas), Alapin, Grand Prix, Rossolimo | the single largest theory surface any e4 player faces |
| 1.e4 vs semi-open | anti-Caro (Advance/Exchange/Two Knights), anti-French (Advance/Tarrasch/Exchange), Scandinavian, Pirc/Modern, Alekhine | the "I didn't study this" cluster |
| 1.d4 systems | Queen's Gambit (Exchange→Carlsbad, Orthodox, Slav/Semi-Slav), London, Catalan, Trompowsky | structure-first teaching; feeds the Carlsbad/IQP families |
| 1.d4 vs Indians | King's Indian, Nimzo/Queen's Indian, Grünfeld, Benoni/Benko | pawn-chain and dynamic-imbalance teaching |
| Flank | English (symmetrical + reversed Sicilian), Réti, Bird | transposition literacy |

### 2b. Black repertoire spines (chosen)

| Vs 1.e4 | Vs 1.d4 | Vs flank |
|---|---|---|
| Sicilian (Najdorf, Dragon, Kan/Taimanov, Sveshnikov), French, Caro-Kann, e5 (Ruy/Italian defence side), Scandinavian, Pirc | Nimzo-Indian, QGD, Slav/Semi-Slav, King's Indian, Grünfeld, Dutch, Benoni | English/Réti setups, anti-London, anti-Catalan |

### 2c. Anti-opening packs (faced — the whitespace)

For each family above, a mirrored pack teaching the **defender's/receiver's**
job: what the structure wants, what the opponent's plan is, where their
preparation ends and yours must begin. Priority order = frequency at 1400–2000
per explorer rating-band data, not theoretical fashion. First wave: anti-Caro
Advance, anti-French Advance, anti-Sicilian (facing Najdorf as White), anti-KID,
anti-London, anti-Dutch.

### 2d. Opening pack contents (per root)

Theory spine to the tabiya · the plan classes both sides own · the move-order
traps that matter at this band · deviations classified
(required/accepted/interesting/violation/error) · the characteristic middlegame
it hands off to (trajectory link) · one timing window where the tempo contract
bites (content-era encoding, see §7).

## 3. Middlegame — structures, not openings

Structure families are the real teaching unit; many openings feed each one, and
that convergence is the curriculum's efficiency.

| Structure | Core decisions | Fed by |
|---|---|---|
| **Carlsbad** | minority attack vs central break; when to trade the bad bishop | QGD Exchange, Caro Exchange, Nimzo lines |
| **IQP** | attack-with-it vs blockade-and-trade; the d5 lever; piece placement | QGA, Panov, Tarrasch, Semi-Slav |
| **Hanging pawns** | c5/d5 advance timing; the pawn-pair's two lives | QGD Tartakower, English |
| **Maroczy bind** | space vs the …b5/…d5 freeing breaks | Accelerated Dragon, Kan, English |
| **Closed centre / pawn chains** | attack the base; flank play; timing the break | KID, French, Benoni |
| **Isolani-free open centre** | piece activity, outposts, file seizure | Italian, Scotch, open Sicilians |
| **Fianchetto structures** | the long diagonal; when the bishop trade is fatal | Grünfeld, Catalan, English |
| **Doubled/backward pawn structures** | when the defect is an asset (open files, bishop pair) | Nimzo, Ruy Exchange, Sveshnikov |
| **Opposite-side castling races** | tempo counting, prophylaxis vs speed | Dragon, Sicilian attacks, KID |
| **Symmetrical/queenless** | small-advantage technique; first-mover pressure | Berlin, exchange lines, English |

Each family: 8–15 roots, ≥2 plan classes per root, both colours, plus the
"quiet position where the plan is invisible" cases that ordinary trainers skip.

## 4. Endgames — by family and by objective

Every root exists in convert / hold / save variants where the material permits.

| Family | Coverage |
|---|---|
| **Pawn** | opposition, key squares, triangulation, breakthrough, outside passer, corresponding squares |
| **Rook** (largest, ~40% of real endings) | Lucena, Philidor, Vancura, short/long side, 4v3 and 3v2 same-side, rook activity vs material, back-rank defence |
| **Minor piece** | good/bad bishop, opposite-colour drawing zones, knight vs bishop by structure, two bishops' advantage |
| **Rook + minor** | the practical nightmare band; exchange decisions into won/drawn zones |
| **Queen** | perpetual nets, queen vs pawn on 7th, queen vs rook practical |
| **Theoretical mates** | K+Q, K+R, B+N (drilled once, never again) |
| **Practical conversion** | up-an-exchange, up-a-pawn-with-opposite-bishops, fortress recognition |

Ground truth: Syzygy where ≤7 pieces; Stockfish + authored claims above that.
Roots sourced two ways — canonical theoretical positions, and **positions mined
from real 1400–2000 games** so the drills match endings actually reached (the Go
corpus pipeline's first real job).

## 5. Trajectories — the causal spines

The product's cross-phase claim. Each trajectory: opening family → its
characteristic middlegame → the endings that structure actually produces, with
provenance for every transition (no stitching).

Launch set: QGD Exchange → Carlsbad → minority-attack rook endings · Open
Sicilian → opposite-castling race → queenless attack-defence · Italian → open
centre → good-vs-bad-bishop endings · KID → closed chain → king-race conversions
· Caro Advance → space-vs-break → 4v3 rook endings · Nimzo → doubled c-pawns →
bishop-pair technique.

## 6. On-ramp layer (1000–1400)

Same runtime, different knobs (`design/00-thesis.md`): 2–8-ply branches,
immediate blunder-guard feedback, principle/threat objectives.

Content: opening **principles** packs per family (not theory lines) · the
opponent-intent series ("what does their move want; what did it stop
defending") · one-move-consequence packs from the CC0 puzzle DB re-cut as
*play-the-consequence* rather than find-the-tactic · basic conversion (up a
piece, up a rook) · the seven theoretical mates · back-rank/loose-piece
recognition.

## 7. What content unblocks (the reason this is the critical path)

Four RFC attempts established that these cannot be designed without real packs
to design them against (`rfc/withdrawn/`):

- **Claim triggers** — anchoring an explanation to a position needs real
  explanations to anchor.
- **Tempo contract** — `planMoves`/`opponentArrival`/luxury accounting only
  gets an honest encoding against a real timing window (first: the Caro Advance
  c5-break race, the Sicilian attack race, the Carlsbad minority-attack race).
- **`provenanceMode` / authored boundary** — needs authored territory to have
  an edge.
- **`save`/`resist` objectives** — need practical-difficulty judgment that only
  authored endgame content can express.

## 8. Production model

**Per pack:** claim → roots → objective (written before engine analysis) → plan
classes → deviations → checkpoints → claims with evidence → review → publish.
Regression list: `archive/brief-v2/product/content_pack_authoring.md`.

**Order:** (1) one pack per phase, end to end, to measure real authoring cost
(Q7/K10) — anti-Caro Advance (opening), Carlsbad minority attack (middlegame),
4v3 rook endings (endgame); (2) their trajectory, proving the cross-phase claim;
(3) breadth by explorer-frequency priority; (4) on-ramp layer; (5) the long tail
via study-import and session-distillation tooling rather than hand authoring.

**Cost discipline:** if a reviewed pack cannot be produced in a bounded session,
K10 is firing and the answer is better tooling (importers, corpus mining,
authoring assist), not more hours. That measurement is the first pack's real
deliverable.
