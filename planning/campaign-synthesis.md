# Campaign & roguelike — the synthesis the design doc is written from

**Status: planning tier. This is not a design document and may not be treated as
one.** Law 5 (`AGENTS.md`) reserves `design/` for the owner or for claude writing
on an owner ruling. This file assembles the material — eight ledger rows, six
answered research questions, and the shipped primitives verified in code — so
that the doc `planning/campaign-research-queue.md` promised (*"When R1–R5 land,
the cluster earns one design doc — not six ledger rows reassembled from
memory"*) can be authored from evidence rather than recall. Assembled by claude,
2026-08-15.

**The gate is met and was not noticed.** `planning/campaign-research-queue.md`
§Now lists R1, R2, R3, R4, R5 and R9 all `✅ ANSWERED [V] 2026-08-15`, and its
own §"All five session-independent questions are answered" says so. Nothing in
the queue turns the fact into the deliverable. This file is that deliverable's
input.

**Nothing here is a decision.** Where the material forces a fork, the fork is
flagged for the owner and left open (§10).

---

## 0. The eight ledger rows this assembles

Gathered by title from `design/BACKLOG.md`. Line numbers are as of 2026-08-15.

| Row title | Line | Role in the architecture |
|---|---|---|
| **Roguelike as the frame, not the decoration** | `:273` | the posture; names the six parts |
| **Build your coach — assistance as unlockable inventory** | `:272` | inventory/deck + the policy-vs-inventory split |
| **Career mode — the Spire map** | `:316` | map; node types; the 2026-08-14 "map gates rewards, library stays open" ruling |
| **Encounter unlocks — content discovered by meeting it** | `:315` | encounters; the honest reward |
| **Satirical pack-opening ceremony** | `:317` | form-without-content over unlocks |
| **Rewind budget as a difficulty axis** | `:274` | constraints; flagged as touching `05` §1 |
| **Time-pressure dimension** (extended 2026-08-15) | `:371` | resources; the clock as spendable/stealable |
| **Standing law: progression is never monetized** (ADR-0007) | `:318`, `:401` | binding on all of it |

Two further rows are load-bearing and were not in the assignment list, because
they contain collisions the doc cannot avoid:

| Row | Line | Why it matters here |
|---|---|---|
| **Just Play difficulty: what is the opponent…** | `:249` | *"There is no IM/GM-like option and cannot cheaply be one"* — the boss section's central obstacle |
| **Authored contexts declare; unauthored contexts default** | `:282` | the owner's general principle, ruled on `outpaced` |

---

## 1. The one architecture

The owner's posture row already states the shape, and the research does not
change the shape — it changes what each part is allowed to *contain*.

```
                    ┌──────────────── MAP ────────────────┐
                    │  an ordered, branching path of nodes │
                    └───────────────┬─────────────────────┘
                                    │ each node is an
                                    ▼
        ┌──────────────────── ENCOUNTER ─────────────────────┐
        │  a run: pack drill · puzzle-consequence seed ·      │
        │  bot match · continue-from-here-and-achieve-X       │
        └───┬──────────────────┬──────────────────┬──────────┘
            │                  │                  │
    played under         played with        played against
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───CONSTRAINTS───┐ ┌──INVENTORY──┐   ┌─────BOSS──────┐
    │ rewind budget   │ │ assistance   │   │ a declared     │
    │ hint economy    │ │ primitives   │   │ opponentPolicy │
    │ + RESOURCES     │ │ you unlocked │   │ + gated        │
    │   (the clock)   │ │ and combined │   │   counter-     │
    └─────────────────┘ └──────┬───────┘   │   theory       │
                               │           └───────────────┘
                    clearing an encounter
                    grants inventory ─────────┘ (ADR-0007: by playing, never paying)
```

**The single sentence the whole doc defends:** the win condition is the quality
of the coach you assembled, not raw playing strength (`BACKLOG:273`).

**And the single sentence the research forces underneath it:** *the campaign can
only be strict about what it can be honest about, and what it can be honest
about varies by phase.* Every collision in §9 is an instance of that.

**The shape of that variation, in one line, because it recurs in every section
below:** difficulty is **measured** in decided endgames (R4) and in the first
~10 moves (R9), **authored** in between, and the two measured islands **do not
touch**. The campaign is therefore not one difficulty system with a phase
parameter — it is two instruments, an authored middle, and a stated absence.

---

## 2. The constraint set — what the doc must obey

Each of these is a constraint on the design, not background. The doc should
carry them as a numbered list it can be checked against.

### C1 — Difficulty has an **availability axis**, not a value (R4)

`design/research/practical-difficulty-outside-tablebase.md` §1, §5.3, §6.1, §10.
R4's verdict: *"No — not as the same measurement, and the reason is not cost."*

- **Where it works, it works perfectly.** The outcome-class classifier (fixed-depth
  Stockfish, cleared hash, "does the move change the position's win/draw/loss
  sign-class") agrees with the tablebase at **κ = 1.000, accuracy 1.000, zero FP,
  zero FN** over **171 in-range positions / 2,416 legal moves** at depth 12 (§5.3).
- **88.3%** = the share of **≤7-piece** corpus positions that are *decided*
  (best-move |eval| > 100 cp) at depths 8, 12 and 16 alike. In-range median
  |eval| **501 cp**.
- **10.2%** = the share of the **284 probed >7-piece** positions that are decided
  at depth 12. Median |eval| of that population: **43 cp** (p90 100 cp).
  R9 independently measured **45 cp** over its own 279 non-endgame positions with
  the same unmodified probe.
- Two further facts that kill the naive fix: more depth makes it **worse**
  (decided rate falls 12.0% at d8 → **5.8%** at d16), and the out-of-range
  concession set is unstable across depth — best agreement anywhere on the ladder
  is **0.538** (§6.2). R4: *"a metric whose value depends on an arbitrary depth
  constant, in a regime where no oracle can adjudicate the constant, is a tuning
  knob presented as a measurement."*
- The RFC that would have implemented this specified the **wrong reading**:
  the centipawn-window form scores **κ = 0.577**, the outcome-class form
  **κ = 1.000** (§5.3 `DESIGN-GAP`).

> **Constraint (R4 §10, verbatim):** *"The design doc R1–R5 earns should carry a
> **difficulty-availability axis**, not a difficulty scalar: encounters where
> difficulty is measured, encounters where it is authored, and encounters where
> it is **neither and the challenge comes from the objective**."* No campaign
> artefact may carry a difficulty scalar.
>
> R4 also states the boundary is **not** the piece count: *"the seven-piece line
> is a proxy for the real line, which is **decidedness**."*

### C2 — Two islands, not one: the middlegame has **no oracle of either kind** (R9)

`design/research/human-outcome-coverage-depth.md` §1, §5.1, §6.1, §6.3, §7.1, §10.
R9's verdict: *"Yes, it discriminates. No, it does not reach the middlegame."*

**It discriminates, and this half is a positive result the doc should use:**

- Over **124 band-1600 positions** the engine calls level (|eval| < 50 cp) with
  ≥400 games, human scores spread **19.5 pp** (0.405–0.600) and
  **Pearson r = −0.079** against the engine's own centipawns — *"the engine
  explains under 1% of the variance in who actually loses."* At band 1800 the
  spread is **26.4 pp**.
- At **move** level: of the move pairs Stockfish cannot separate at depth 12
  (|Δcp| < 30), **one in six** is separated by the human population by ≥5 pp
  *with statistical force* — **16.9%** at band 1600, **20.1%** at 1800 (§6.3).

**It does not reach:**

- Last corpus ply where any sampled position clears 400 games: **ply 20** at
  bands 1400/1600, **ply 21** at 1800. From **ply 27** every sampled position at
  every band returns **literally zero games** (§5.1). *"There is no thin tail;
  the data stops."*
- Move-level coverage fails a phase earlier: at ply 12–15 the oracle covers
  **4.5 of ~35** legal moves (~13%); at ply 16–19, **2.4 of 36** (~7%); by ply
  20–23, **0.17** (§5.3). *"A learner's mistake is by definition an unpopular
  move, so this is worse than the position-level curve suggests."*
- The ceiling is not a query artefact: the whole Lichess database (9 buckets ×
  6 speeds × 2013-01..2026-08, 7,826,583,590 games at the start) multiplies
  counts by a median **×23.41** and moves *choice-level* coverage from ply 19–21
  to ply **23** — **2–4 plies** (§7.1, §7.2). And the single largest lever
  (merging rating buckets, ×3.10) is precisely the one that destroys the
  band-specific claim. R9: *"There is no population setting under which this
  instrument reaches the middlegame."*
- **Ply 20 is White's tenth move.** The corpus's one `middlegame` pack begins at
  ply 19 and the positions it is *about* sit at plies 21–27.

> **Constraint (R9 §10, verbatim):** *"**Two islands, not one.** Measured
> difficulty exists in **decided positions** (R4: exact inside seven pieces) and
> in **positions within about ten moves of the start** (engine-independent,
> statistically forceful, and richer at move level than at position level).
> **They do not touch. The middlegame between them has neither instrument.**"*
>
> And R9 refines C1's axis to **four** values, which the design doc must not
> flatten back to three: *measured by tablebase* (decided endgames) · *measured
> by human outcome* (ply ≤ ~20 at bands 1400–1800, ≤ ~15 at 1000–1200) ·
> *authored* · *neither, and the challenge comes from the objective* (R4's fourth,
> which R9 does not carry forward by name).

> **Second constraint, and it lands on the on-ramp (R9 §8.4):** the band the
> campaign most wants to serve loses the oracle first. At ply 12–15 band 1000 has
> **45×** fewer games than 1800; at ply 16–19, **100×** fewer; its usable line
> ends at **ply 14–15**. And **all 26** puzzle-derived on-ramp roots under
> `content/candidates/onramp-*/` are real-game middlegames at plies **21–131**
> returning **0–5 games** — *"not one clears the 100-game floor at any band."*
> The campaign's easiest encounter type is its least-measurable one.

### C3 — A census hint is honest and mostly worthless; selectivity is not the test (R3)

`design/research/census-hint-false-positives.md` §1, §3b, §5, §6, §7.
Population: **634 spine transitions** from 37 packs, against **15,989 enumerated
legal alternatives** (14,980 quiet).

- **6.18 observations per ply, 0.68 clearing the gate — an 89.0%
  false-positive rate at the observation level.** At least one leaf fires on
  **96.8%** of transitions; at least one *signals* on **43.4%**.
- Per leaf: `defended_squares_changed` **95.8%** FP, `attacked_squares_changed`
  **94.1%**, `move_irreversibility` **89.1%**, `escape_squares_changed`
  **86.1%**, `defended_duties_changed` **53.2%**, `slider_lines_changed`
  **41.7%**.
- **Selectivity does not predict usefulness.** Spearman ρ(firing rate, FP rate)
  **= −0.143**. *"The rarest leaf is not the cleanest, and the cleanest leaf is
  the second-commonest."*
- **The alternatives axis is load-bearing.** `slider_lines_changed:opened`
  signals on 21.3% of played moves and 20.3% of random quiet moves — lift
  **1.05×** — and a third of the same position's alternatives signal too. R3:
  *"R2's diagnosis in a new costume: a renderer, not a detector."* Generalised:
  *"every primitive with a signal rate above 10% has a lift at or below 1.2×;
  the leaves that do distinguish the played move are the ones that almost never
  fire. **That is the real trade in this category.**"*
- R3's own definition of useless is the one the campaign should inherit whole
  (§3b): a firing is useful only if **(T)** it is not a restatement of the move,
  **(C)** it is about something contested under the rules alone, and **(D)** it
  is not equally true of the moves that were not played. These are **necessary,
  not sufficient** — so every "signal rate" is an *upper bound* on usefulness.

> **Constraint:** the hint economy may not be denominated in "rare = valuable" —
> the correlation is *slightly negative*. Any "is this hint worth an unlock slot"
> test must compare against the moves **not played**, and must treat its own
> pass rate as a ceiling.
>
> **Corollary the doc should state plainly:** the census is not a large hint
> catalogue. Four of the six leaves are ≥86% FP. A deck whose common cards are
> census leaves is a deck of mostly-noise cards, and the learner will correctly
> learn to ignore them.

### C4 — Routing is a renderer, not a detector; the target is the judgement (R1/R2)

`design/research/move-primitive-computability.md` §1, §3a, §4d, §4f.

- **Cost is settled and is not an argument in either direction.** The complete
  census — attacks, defences, lines, control delta, escape squares, overload,
  tempo proxies, irreversibility, routing — costs **29.06 µs/ply** measured
  end-to-end from two raw FEN strings over 593 transitions (33.25 µs dense,
  7.47 µs sparse). A 20-ply branch: **0.58 ms**. An eight-branch comparison:
  **4.7 ms**.
- **The routing hypothesis was refuted, and it was claude's, not the owner's.**
  Given an author-supplied target it reproduces the author's claim **9/9** at
  0.20 µs/ply — but **52.8%** of the moved piece's own legal alternatives
  satisfy the same predicate, so it does not identify the move. Without an
  authored target it fires on **38.4%** of all transitions and **49.6%** of quiet
  piece moves, at **1.3% precision / 98.7% FP**; under the sharpest filter
  (quiet, non-developing, backward or lateral — the owner's literal case)
  precision is **0.0% across 48 firings**, and every one of those firings is an
  endgame king walk.
- Routing explains only **9 of 17** author-labelled repositions in the corpus.
  R2: *"the target square set is the judgment, and the target set is exactly the
  part that is not computable."*
- **"Tempo — does this move force a reply" is not a board fact at all** (§3c).
  It needs an opponent model. The owner's taxonomy contains exactly one category
  error and this is it.

> **Constraint:** an inventory item may not be a *detector of intent*. Items are
> either (a) rules arithmetic rendering a fact, or (b) an authored judgement
> carrying its provenance, or (c) rules arithmetic **rendering an authored
> target** — which is the surviving form of routing and is a perfectly good deck
> card *on an authored node*. There is no fourth species, and "the card that
> tells you what your opponent is planning" is not buildable — it is authorable.

### C5 — Maia's policy is bit-identical; the sampled move is not (R5)

`design/research/maia-policy-scalar-stability.md` §1, §3, §4, §7, §8, §9.
R5's verdict: *"Yes — the policy scalar is bit-stable, and that is the least
interesting thing this measurement found."*

- **2,100 probes** (35 positions × bands 1100/1500/1900 × 20 repeats), zero
  errors: **105 of 105 keys returned a byte-identical `info` block on all 20
  repeats.** Max absolute policy drift **0.0**; max relative drift **0.0**.
  Confirmed across a fresh container and a different request order (35/35
  identical digests) and across MultiPV widths 8 vs max (263 shared moves, 0
  mismatches).
- **The `bestmove` is not stable: 36/105 keys (34.3%)**, or **30/99 (30.3%)**
  excluding forced moves. Median key returned **3** distinct bestmoves in 20
  repeats; worst returned **8**. Mechanism read, not inferred: `policy` is the
  raw legal-masked softmax, while `bestmove` comes from `torch.multinomial` with
  **no generator argument** — process-global RNG, no seed option advertised.
- **The RFC hedged about the wrong mode (§7).** The mode that needs
  determinism-by-record is **`human_common` — the default opponent, and
  `theory_strict`'s off-spine fallback** — because it plays the sampled
  `bestmove`. `practical_resistance` is deterministic by construction given the
  byte-identical policy.

> **Constraint:** anything the campaign *scores, gates or reproduces* keys on the
> **policy distribution**, never on the move Maia happened to play. A boss
> advertised as "plays this move here" is reproducible only under
> `theory_strict` on-spine or `perfect_tablebase`; a `human_common` boss is
> reproducible only *distributionally*, or by replaying the recorded selection.

> **And a warning the doc must carry (R5 §8, §9):** the mode that sounds most
> boss-like is **currently broken**. `practical_resistance` threw an unhandled
> `TypeError` → **HTTP 500 on 30 of 40 in-range roots (75%)** on all 20 repeats,
> because `humanConcessionMass` guards `mass > 1 + 1e-9` while a real float32
> softmax sums to 1 ± ~1e-7. A second defect lets one abstaining candidate
> disable the vacuity gate, so the mode plays the **lexicographically first legal
> reply** under its own name. And a Maia **`Elo` carry-over** (6/6 measured, the
> D35 analogue) means an Elo-less request inherits the last band anyone asked
> for, while recording `eloApplied` absent — *"the honesty field is wrong by
> omission."* No campaign boss may be built on `practical_resistance` until
> these land.

### C6 — Responsive-only with a two-tier floor, and the tablet tier is unmet (Q3)

`design/research/mobile-scope.md` §1b, §2a, §2d, §5.
Verdict: *"tolerate — responsive-only, with a stated floor of the run loop on a
phone, the whole surface on a tablet-and-up, and the floor is currently unmet in
the 720–992 px band."*

- **Phone floor ≤719 px:** the run loop plus every read surface, on a 360 px
  phone. Compare guaranteed to **two columns only**.
- **Full-surface floor 768 px and up — NOT MET.** The band **720–992 px**
  (iPad portrait, 768 px, sits in the middle of it) loses the fitted grid without
  gaining the compact tabs. *"The tablet is the viewport nobody looked at, and it
  is also the viewport that any honest 'non-goal with a floor' answer would name
  as the floor."* No browser projection covers it (suite tests 1280×720,
  1440×900, 390×844).
- The measured pattern: **"everything that is one board survives a phone;
  everything that is N boards does not"** — and the N-board surfaces are exactly
  the ones carrying the product's original claim. 8-way compare is **2010 px on
  every viewport** including 1280×720 (1.85 screens of pan on desktop).

> **Constraint:** the map is the most layout-hungry surface the cluster proposes,
> and it arrives into an unmet tier. The doc states tablet behaviour or the map
> becomes what exposes the gap.

> **And Q3 names the campaign as a reason to reopen its own verdict (§5),** which
> the design doc should quote rather than discover later: *"**Scope it** if the
> campaign/gamification program ships and turns runs into short, repeatable,
> budgeted encounters — that is the 'short, repeatable, tactile' session shape
> the plan says was never examined, and it is genuinely phone-shaped."* The
> campaign is the first thing in the repo that could move the mobile ruling. It
> is a one-board-per-encounter frame, and one board survives a phone.

### C7 — L1–L6 governs anything the campaign surfaces unasked

`rfc/live-marker-quality.md` §3 (**draft, awaiting cross-review** — flag this;
the rule is not yet accepted). It governs *"any future kind, sub-kind, board
overlay, arrow, halo, ambient cue or spoken line that fires without the learner
asking for it in that moment"*.

That reaches campaign UI directly. A "your relic triggered!" flourish, an
ambient companion reacting to a position, a boss's ability announcement that
names a chess fact — each is a live firing.

- **L1** per-firing necessity: (T) not a restatement of the move just committed;
  (C) names something contested under the rules alone.
- **L2** the alternatives axis is mandatory; **lift < 1.0 refuses outright**;
  firing rate is inadmissible as quality evidence and admissible as cost
  evidence.
- **L3** volume ceiling on the **union** of all live kinds: **1 per 10 plies**.
  A campaign adds live channels to a budget that is already spoken for.
- **L4** rung and disclosure discipline — notably **(b)**: no live firing may
  disclose more than the same viewer could obtain **on request at that moment**
  under `permittedAssistance`.
- **L5** the burden is on the addition; argument is not evidence.
- **L6** **failing a measurement demotes; lacking one does not.** Grandfathered
  kinds carry a standing measurement obligation and **may not be cited as
  precedent**.

> **Constraint:** the campaign may not cite `phase_change`, `human_divergence` or
> `option_collapse` as precedent for a new live channel — all three are
> grandfathered-unmeasured (`live-marker-quality.md` §3.1; `BACKLOG:129` D52).
> And L4(b) is the exact rule that makes an *unlocked* hint safe: an unlock
> changes what the viewer could obtain on request, so the live channel's ceiling
> moves with the inventory, automatically and in the right direction.

### C8 — Policy and inventory are independent axes (already decided)

`BACKLOG:272`; `campaign-research-queue.md` §"Explicitly not research".
**Policy** = what may honestly be shown and when (`05` §3/§3a, unchanged).
**Inventory** = what this learner currently has access to. Deck-building
operates **only** on inventory.

**This is already true in code, which is the strongest possible form of the
constraint.** The two axes are two separate artefacts:

| Axis | Artefact | Where | Keyed on |
|---|---|---|---|
| **Policy** | `permittedAssistance(context)` | `packages/runtime/src/assistance.ts:27-30` | `sessionKind`, `deliveryOpen`, `role` |
| **Inventory** | `AssistanceConfig` (v4, 9 fields) | `packages/runtime/src/assistance.ts:3-14` | learner preference |

`DrillScreen.svelte:286` derives the permission and `:136` holds the config
separately. The campaign narrows the second and never touches the first.

### C9 — ADR-0007 holds by construction (already decided)

`BACKLOG:401`. Progression is never monetized. Unlocks come from playing.
The satirical ceremony **parodies** the ritual and may not become one.

### C10 — Law 8 applies inside the campaign (already decided)

An unlocked hint is a **grounded primitive the learner earned**, never an LLM
opinion they bought. `AGENTS.md` law 8; ADR-0005. The mechanical floor is
`BANNED_JUDGEMENTS` / `voiceCheck` (`packages/runtime/src/voice.ts:33`), which
rejects any chess noun, square or move not present in the evidence packet.

### C11 — Authored contexts declare; unauthored contexts default (owner ruling)

`BACKLOG:282`, ruled on the `outpaced` case and explicitly generalised:
*"wherever the product must choose a semantic, an authored context supplies it
and an unauthored context needs a stated default — the two should never be
collapsed into one global answer."*

> **Constraint, and it is the doc's organising principle:** every campaign
> parameter (rewind budget, hint prices, clock, boss policy, difficulty label)
> is **declared by the authored campaign** and has a **stated default** for the
> unauthored case. This is what lets the campaign be strict without imposing
> strictness on Just Play, and it is why the campaign is a *mode* rather than a
> new set of global rules.

---

## 3. MAP — the Spire path

### The owner's idea

*"A Slay-the-Spire-esque game where you walk paths, and the fights are a drill
or puzzle or match against bot or a continue-from-here-and-achieve-X"*
(`BACKLOG:316`). **Ruled 2026-08-14: the map gates its own rewards, the library
stays open** — a chosen mode over an always-open catalog.

### What the research permits

- A map made of **nodes typed by phase**, because phase is exactly where the
  oracle availability changes (C1, C2). A map is the natural place to *show* the
  difficulty-availability axis rather than hide it.
- **The map has two dense ends and a hollow middle, and that is a map shape.**
  R9's "two islands": measured difficulty exists in decided endgames *and* in the
  first ~10 moves. A Spire path that starts in the opening island, crosses an
  authored middle, and ends in the endgame island is the honest topology and it
  happens to be the trajectory the thesis already describes
  (`00-thesis.md:21`, `BACKLOG:316`'s *"boss = a trajectory"*).
- Seeding from tracks (`04` §1 Track, `design/04-content-architecture.md:186`)
  and priority data, with **no skill numbers anywhere** — advancement is event
  facts (`BACKLOG:316`).

### What the research forbids

- **A single difficulty curve across the map.** C1+C2: an endgame node's
  difficulty is tablebase-measured, an opening node's is human-outcome-measured,
  a middlegame node's is authored, and some nodes have neither and are carried by
  their objective. Interpolating one number across four regimes is manufacturing
  chess truth about how hard a position is — precisely the R4 refutation.
- **A map that renders live commentary as you traverse** without clearing L1–L5
  (C7).
- **An on-ramp branch of the map that claims measured difficulty.** R9 §8.4: the
  1000–1200 band loses the oracle at ply 14–15, and every one of the 26
  puzzle-derived on-ramp roots returns 0–5 games.

### The four node labels the axis produces

| Node | Availability | Honest label | Instrument |
|---|---|---|---|
| endgame, ≤7 pieces / decided | **measured by tablebase** | "this is a decided position" | Syzygy; κ = 1.000 agreement (R4 §5.3) |
| opening, ≤ ~ply 20 at band 1400–1800 | **measured by human outcome** | "players at your band score X% here" | explorer; r = −0.079 vs engine (R9 §6.1) |
| middlegame | **authored** | "the author set this" | pack `difficulty` + objective |
| anything else | **neither** | the challenge is the objective | R4 §10's fourth value |

Two honest qualifiers the doc must keep attached: the on-ramp band's opening
window is **ply ≤ ~15**, not 20 (R9 §8.4); and a difficulty claim keyed to the
wrong band is *"usually right and occasionally backwards"* — 7–9% of positions
flip which side is above even between bands (R9 §8.1).

### Expressible with shipped primitives today

| Need | Shipped | Where |
|---|---|---|
| Node = a run of some kind | `RunSessionKind` = `pack` \| `position` \| `imported` | `packages/runtime/src/types.ts:36` |
| Node phase typing | pack `phase`: `opening`/`middlegame`/`endgame`/`cross_phase` | `schemas/drill_pack.schema.json:23-25` |
| Authored difficulty band on a node | pack `difficulty`: `minOnlineRapid`/`maxOnlineRapid`/`label`/`branchLengthTarget` | `schemas/drill_pack.schema.json:173-186` |
| Boss = trajectory node | pack `mode: "trajectory"`, objective `run_trajectory` | `schemas/drill_pack.schema.json:22`, `:212` |
| "achieve-X" node | outcome objectives `win`/`hold`/`save`/`resist` + `ObjectivePredicate` | `schemas/drill_pack.schema.json:200-214`; `packages/runtime/src/objective.ts:69-100` |
| Progress as event facts | `milestones()` — first attempt, first stable, first objective achieved, first win, first scheduled return, ten attempts on one root, first flip-sides | `apps/server/src/service.ts:585-589` |
| Attempt verdicts | `stable` / `unstable` / `open`, per root key | `apps/server/src/progress.ts:6-7`, `:67` |
| A new top-level surface | 8 static routes today: `home play review learn live create library settings` | `apps/web/src/lib/router.ts:1-30` |

**The map's ruling is already structurally clean:** "the map gates its own
rewards, the library stays open" is a **ninth route beside `/library`**, not a
replacement for it.

### What needs new work

1. **A map document** — nodes, edges, node→pack binding, per-node declared
   constraints. Nothing like it exists in `schemas/`.
2. **Server-held run-of-the-campaign state.** `progress.ts` stores *attempts*,
   not a traversal. A roguelike run is a stateful object with a position on the
   map, a live inventory and consumed budgets.
3. **Content.** Measured today: **43 packs** in `content/drafts/` — 23
   `opening`, 14 `endgame`, 3 `middlegame`, 3 `cross_phase`. **The middlegame
   is 7% of the corpus**, and by C2 it is also the part that can only be
   authored. A map whose middle is the middlegame has almost no middle.

### Owner ruling wanted

- **Is the map itself authored content or generated?** `BACKLOG:316` says *"map
  generation can be seeded from tracks + priority data"*; C11 says an authored
  context declares and an unauthored one defaults. Both are consistent with
  either answer, so the fork is real.
- **Does a lost fight become a save node?** `BACKLOG:316` proposes it
  (*"recovery-as-skill as level design"*) and it is the most thesis-native idea
  in the row (`05` §3a, `00-thesis.md:81-89`). It is also the one place the map
  can *contradict* the roguelike genre, where a loss ends the run.

---

## 4. ENCOUNTERS — content discovered by meeting it

### The owner's idea

*"People unlock packs through finding the patterns in their games"*
(`BACKLOG:315`). The classifier detects a Carlsbad in your Just Play game or
imported story → the moment becomes an **encounter** → the matching shape entry
and packs unlock **with the provenance shown**.

### What the research permits — and this is the strongest part of the cluster

The ledger row claims *"the machinery is entirely shipped"*. **Verified: it is.**

`Service.shapeRecommendations()` — `apps/server/src/service.ts:752-771` —
already does the whole mechanic:

- runs `shapeFirings(triggers, branchPath(run, branch.id))` over the learner's
  preserved runs (`packages/runtime/src/shape-firing.ts:15`);
- filters to shapes with **no countable attempt** in any pack that names them;
- returns packs that name the shape, **with the provenance sentence**: *"You met
  {shape} in {n} of your preserved runs and have no countable attempt recorded
  in any pack that names it."*

Structural triggers are the shipped `StructuralExpression` grammar with named
structures already authored — `carlsbad`, `iqp-white`, `iqp-black`,
`maroczy-bind` (`packages/runtime/src/structure.ts:225-247`), over 20+ feature
leaves (`:22-52`).

> **The encounter unlock is a presentation change over a shipped endpoint.** That
> is worth stating loudly in the doc: it is the cheapest part of the cluster and
> the one with the least design risk.

### What the research forbids

- **Nothing in C1–C5 constrains this**, because a shape firing is rules
  arithmetic over a FEN — rung 0, exact within its scope, and it makes no
  difficulty claim at all. This is the one part of the cluster the research
  leaves untouched.
- **C7 does constrain the flourish.** The moment an encounter announces itself
  *during* play, it is a live firing under L1–L5 and needs the alternatives
  measurement. Announced **after** the run — which is how
  `shapeRecommendations` works today, over `storage.list(...)` of finished runs
  — it is on-request and outside the rule entirely.

### The four node types, checked

| Owner's node type | Shipped as | Status |
|---|---|---|
| **drill** | pack run, 4 modes: `line`/`plan`/`outcome`/`trajectory` | shipped, `schemas/drill_pack.schema.json:22` |
| **puzzle** (puzzle-consequence seed, on-ramp) | on-ramp layer `04` §6; `immediate_guard` feedback policy | policy shipped (`schemas/drill_pack.schema.json:64-66`); the CC0 re-cut is content work |
| **bot match** | `position` run vs `human_common` at a band | shipped |
| **continue-from-here-and-achieve-X** | `position` run + outcome objective + `ObjectivePredicate` | shipped; **this is the node type with the most machinery already behind it** |

### What needs new work

1. **The unlock ledger.** `shapeRecommendations` returns a *recommendation*, not
   an *unlock*. Turning a recommendation into a persisted, provenance-carrying
   grant is new state (same new state the map needs, §3).
2. **The ceremony.** `BACKLOG:317` — the satirical pack-opening ritual. It is
   pure `05` §3-forms presentation over an unlock event, *"zero mechanics"*, and
   `05` §3-forms explicitly permits **form without content**
   (`design/05-in-run-experience.md:141`). The only constraint is C9: the joke
   is that there is no purchase and never will be, so the ceremony must not
   acquire a currency to make the joke land.

---

## 5. INVENTORY / DECK — assistance primitives unlocked and combined

### The owner's idea

*"What kind of hints/help/theory you can get (or have to 'buy' like a potion)…
what if you have built the right combination of theory/classification/hints
which basically allows a noob to play against an IM/GM boss, and still win
because it has the right help? You basically build your coach"* (`BACKLOG:272`).

### The deck's slot vocabulary already exists, and it is nine names

`AssistanceConfig` v4 (`packages/runtime/src/assistance.ts:3-14`) has exactly
nine axes, and they map cleanly onto the `05` §3 ladder plus §3-forms:

| Config field | Values | `05` §3 rung | Shipped producer |
|---|---|---|---|
| `markers` | off / live | rung 0 + 3 | `pivotalMarkers` (`pivotal.ts`) |
| `guided` | off / live | rung 0 + 5 | shape library rendered live (`05` §3b) |
| `humanSplit` | off / on_request | **rung 3** | Maia policy |
| `corpus` | off / on_request | **rung 4** | explorer index |
| `voice` | authored / persona | rung 6 | `voiceCheck` (`voice.ts:33`) |
| `spoken` | off / browser / provider | form | TTS seam |
| `boardLighting` | off / legal / sight / evidence | form | `structuralReading` (`structure.ts:452`) |
| `arrows` | off / sight / evidence | form | ditto |
| `ambient` | off / on | form | companion presence |

Two more grounded readings exist as on-request functions and are the obvious
additional slots: `transitionReading(before, uci, after)`
(`packages/runtime/src/transition.ts:344`) — six observation kinds — and
`endgameReading(fen)` (`packages/runtime/src/endgame.ts:21`), which names the
endgame type and its technique, i.e. exactly `05` §5b's *"this is endgame X, so
use the rook to push the enemy king into a small box"*.

Authored theory has its own shipped gate: `projectAuthoredFeedback`
(`apps/server/src/authored-feedback.ts:251`) releases authored annotations,
deviations, plan classes and theory verdicts only when **reachable + revealed +
released**, and reports `hasWithheldAuthoredContent`
(`authored-feedback.ts:70-73`).

> **The architectural point the doc should make:** authored theory is already
> behind a gate. The campaign adds a **second, inner** gate (inventory). The
> honesty gate must remain the **outer** one — content the run has not disclosed
> stays undisclosed even to a learner who "owns" the slot. C8 says this; the
> code shape already supports it, because the two gates are two different
> functions.

### What the research permits

- **A deck of grounded primitives.** Every slot above is rung 0–5 with a named
  source; C10 is satisfied by construction.
- **Rung 1 (tablebase) as the strongest possible item — inside range.** Below 8
  pieces the item cannot be wrong, and R4 measured that 88.3% of in-range corpus
  positions are decided, so the item usually has something to say.
- **`humanSplit` as the mid-tier item, and R5 makes it strictly better than it
  looked.** The policy is bit-identical across repeats, bands, request orders,
  process instances and MultiPV widths (105/105 keys, max drift 0.0), so *"your
  coach shows you how players at your band split here"* is byte-identical
  content on every replay and every rewind. It is the one deck card whose
  reproducibility is *measured* rather than assumed.
- **`corpus` as an opening-only card that says so.** R9 gives it an honest
  range — usable to ply ~20 at bands 1400–1800, ~15 below — and an honest
  abstention rule. A card with a declared range is better deck design than a
  card that silently returns nothing.

### What the research forbids

- **Pricing hints by rarity (C3).** ρ = −0.143. A campaign economy that makes
  the rarest census leaf the most expensive relic is inverting the only
  measurement anyone has.
- **A "what is my opponent planning" item (C4).** 98.7% FP. It can only be an
  *authored* item on an *authored* node.
- **A generic mid-game "how hard is this" item (C1+C2).** There is no oracle.
  The honest form is `05` §1's *absence is stated, never simulated*.
- **An item that is a live channel** without L1–L5 (C7).

### What needs new work

1. **The config must become server-held, per-learner state.** Today it is a
   **browser localStorage preference keyed only by `RunSessionKind`**
   (`apps/web/src/lib/assistance-preference.ts:1-10`;
   `AssistanceSettings.svelte:17`). An inventory that a learner *earns* cannot
   live in localStorage — it is progression state, and ADR-0007 makes it
   security-relevant that it is not client-editable.
2. **A pack/campaign cannot currently restrict assistance.**
   `permittedAssistance` takes `{sessionKind, deliveryOpen, role}` only
   (`assistance.ts:21-30`). There is no pack input and no campaign input. The
   inventory axis needs a **third input** — and by C8 it must be a *separate*
   input that intersects with, never overrides, the policy result.
3. **Per-slot granularity below the nine fields.** "Unlock the endgame reading
   but not the structural census" is not expressible; `boardLighting: "sight"`
   is one switch over the whole `structuralReading` output.

### Owner ruling wanted

- **Does an unlock persist across campaign runs, or reset each run?** The
  roguelike genre resets; a learning product accumulating a coach does not. This
  is the single largest fork in the cluster and neither answer is implied by
  anything ruled so far.

---

## 6. CONSTRAINTS — rewind budget and hint economy

### The owner's idea

*"In campaign mode we are strict in where you can rewind and how often"*
(`BACKLOG:274`, `:272`).

### The collision, stated plainly

`design/00-thesis.md:76-79` names **"Experimentation without cost"** as one of
two mechanisms answering *why anyone would use it*: *"preserved branches make
trying something free… every other context charges you a lost game for that
curiosity."* A rewind budget **prices exactly that**.

The ledger row already spotted the seam and it is a real one
(`BACKLOG:274`): *"the first attempt is never erased"* is **preservation**, not
unlimited retry. So the invariant that binds is preservation, and a budget could
be compatible with it. `00-thesis.md:99-102` sharpens it further: *"the
consequence stays mandatory; only the retry is free… play it out, then go back —
never take it back."*

**Three things the budget could price, and they are not equivalent:**

| What is budgeted | Collides with | Note |
|---|---|---|
| **How many times you may fork** | thesis "experimentation without cost" | the direct collision |
| **Where you may rewind to** (e.g. checkpoints only) | nothing | `rewindToCheckpoint` already exists as a distinct entry point (`runtime.ts:416`) |
| **Whether the consequence must be played out first** | nothing — it is the thesis rule already | `00-thesis.md:99-102` |

> Only the first is a genuine conflict. The doc should separate them rather than
> treating "rewind budget" as one idea.

### `05` §1 is amendable, and says so

`design/05-in-run-experience.md:23-29`: *"These are rulings, not physics… an
invariant may itself be amended when evidence shows it costs more than it
protects. **A full invariant review is scheduled at content-complete.**"* The
rewind budget is therefore a **candidate amendment with a scheduled venue**, not
a violation. That venue is the same first-session review that answers R6.

### Shipped today

- `rewind(run, nodeId, at?, jobObserver?)` — `packages/runtime/src/runtime.ts:385`.
  **No budget, no counter, no refusal path.** It appends `run.rewound` and
  returns.
- `rewindToCheckpoint(run, checkpointId, ...)` — `:416`, resolves the checkpoint
  then delegates to `rewind`.
- `fork(run, nodeId, options)` — `:368`.

### What needs new work

A refusal path. Every existing refusal in the runtime is a *permission* refusal
(`MATCH_LIVE`, `03-product-breadth.md:95`); a budget is the first **resource**
refusal, and it needs its own event so the run log stays the sole source of
truth (`05` §1, invariant 6).

### The hint economy

C3 governs the pricing and refuses the intuitive scheme. C9 governs the
currency: whatever it is, it is earned by playing. The honest denominations
available today are all **event facts** — `milestones()`
(`service.ts:585`), attempt verdicts (`progress.ts:6`), objective states,
`branchDecidedness` (`branch-scale.ts:40`).

> **`branchDecidedness` deserves special attention in the doc.** Its type is
> `decided` / `undecided` / `unknown` with a **named ground** —
> `terminal_outcome` \| `objective_terminal` \| `tablebase`
> (`packages/runtime/src/branch-scale.ts:11-19`). That is **C1's
> measured/authored/neither axis already implemented at the branch level**, with
> provenance sentences to match (`renderCollapseExplanation`, `:81-86`, which
> labels its source `"Rules"` \| `"Pack"` \| `"Tablebase"`). The campaign's
> difficulty-availability axis is not a new invention; it is this type, promoted
> from branch scale to campaign scale.

---

## 7. RESOURCES — time controls

### The owner's idea

*"Imagine time controls… another layer you can build out in a run or maybe play
against with abilities"* — `BACKLOG:371`, extending the older time-pressure row.
Time stops being a realism dimension and becomes a **campaign resource**:
something you spend, extend, or have taken from you, and something a boss can
hold as an ability.

### The honesty constraint the ledger row already states

*"A clock changes what assistance can mean (you cannot deliberate under a ladder
you have no time to read), so time interacts with the inventory axis, not just
with difficulty."* (`BACKLOG:371`.)

This is sharper than it looks, and the doc should develop it: **the clock is the
one campaign constraint that operates on the inventory axis without touching
the policy axis.** Taking time away does not change what may honestly be shown —
it changes what can be *read*. That makes it the safest of the three constraint
mechanisms with respect to C8, and the doc should say so.

### What the research permits and forbids

- C5 is relevant and mildly awkward: a *timed* opponent implies move-time
  variation, and Maia's `bestmove` is only **34.3% stable**. A boss whose
  "ability" is time-related must key on the policy, not the move (C5).
- C1/C2 are silent on the clock. Time pressure is not a difficulty *measurement*
  problem — it is a resource, and it is honestly expressible in every phase.
  **This makes the clock the only campaign difficulty axis that works uniformly
  across opening, middlegame and endgame.** That is a genuinely useful finding
  for a cluster otherwise fragmented by phase.

### Shipped today — almost nothing, and the near-miss is a trap

- `Node.clockState?: Readonly<Record<string, unknown>>`
  (`packages/runtime/src/types.ts:104`) — an **untyped opaque passthrough**. It
  is accepted by the REST layer (`apps/server/src/rest.ts:417-423`), stored on
  the node (`runtime.ts:341`), and **read by nothing**. No schema, no
  time-control type, no consumer.
- **`clock_zeroed` is not a time control.** It is the *halfmove clock* —
  `"Capture-or-pawn-move halfmove-clock convention."`
  (`packages/runtime/src/transition.ts:360`; sentence at
  `apps/web/src/lib/transition-sentences.ts:9`). Anyone grepping for "clock"
  will find it and it is the fifty-move rule.
- `03-product-breadth.md:53-55` (Position Arena): *"native clocks/matchmaking
  can deepen later without erasing the surface"* — the surface was designed to
  admit clocks; the clocks were never built.

> **Time controls are the least-shipped part of the cluster.** The doc should
> rank this honestly against the encounter unlock (§4), which is nearly free.

---

## 8. BOSSES — declared opponent policy plus gated counter-theory

### The owner's idea

*"On this phase the end boss will play as white and apply this attack, or play
as black and prefers defense Y"* (`BACKLOG:272`), with theory supplying the
counter — and the synergy claim: *"a noob plays against an IM/GM boss, and still
wins because it has the right help."*

### Shipped today — the declaration half exists

Pack `opponentPolicy` (`schemas/drill_pack.schema.json:877-898`) declares:

- `mode` ∈ `theory_strict` · `human_common` · `plan_defense` ·
  `practical_resistance` · `perfect_tablebase` · `strong_engine` ·
  `human_external`
- `targetElo`, `temperature`, `topP`, `stockfishGuardCp`, `seedMode`

The runtime executes five of the seven — `RUN_OPPONENT_MODES`
(`packages/runtime/src/types.ts:38-44`): `human_common`, `strong_engine`,
`theory_strict`, `perfect_tablebase`, `practical_resistance`. `plan_defense`
and `human_external` are **declarable but not in the runtime enum**.

**What the 43-pack corpus actually uses today** (measured 2026-08-15 over
`content/drafts/`): `theory_strict` **25**, `human_common` **16**,
`perfect_tablebase` **2**. **Zero** packs use `practical_resistance`,
`plan_defense`, `strong_engine` or `human_external`. 37 packs set `targetElo`.

So *"the boss plays as white and applies this attack"* is expressible **today**
as a `theory_strict` pack whose spine is the attack. *"Prefers defense Y"* is a
`theory_strict` or `plan_defense` declaration. The declaration half is real.

### The counter-theory half is also shipped, in a usable shape

`projectAuthoredFeedback` (`apps/server/src/authored-feedback.ts:251`) already
withholds authored content and flags `hasWithheldAuthoredContent`
(`:70-73`). Gating counter-theory behind an unlock is a *second predicate on the
same projection*, not a new mechanism.

### What the research forbids — and this is where the boss idea takes damage

**(a) There is no IM/GM opponent, and there cannot cheaply be one.**
`BACKLOG:249` states it as shipped fact: Maia is a human-behaviour model trained
at bands ≈**1100–1900**; above the band the only shipped opponent is
`strong_engine`, *"which is not a strong human but a different species"*, and
weakening it is **rejected doctrine** (`AGENTS.md` §Rejected). D60
(`BACKLOG:121`) confirms `targetElo` is an unbounded integer with no validation
against what the engine supports, so requesting Elo 2400 is *accepted by the
format and silently meaningless*.

> The owner's phrase "IM/GM boss" therefore has to be re-cut, not implemented.
> §9 collision 2.

**(b) A boss whose difficulty is a *measured* quantity is endgame-shaped.**
C1: 88.3% coverage inside 7 pieces with perfect agreement; 10.2% outside. So a
`perfect_tablebase` boss — genuinely, provably unbeatable-if-you-err — exists
only in the endgame. And exactly **2** packs use that mode today.

**(c) A middlegame boss's difficulty must be authored.** C2: no oracle of either
kind past ply ~20. The boss's threat is an *authored plan* that the *authored
counter-theory* answers. That is honest and it is also the thesis's own position
(`00-thesis.md:60-63`) — but it means a middlegame boss is **content**, and the
corpus has **3 middlegame packs**.

**(d) A boss must key on policy, not on moves — and only three of six modes are
reproducible.** R5 §7's mode table is the boss designer's constraint, verbatim
in structure:

| Mode | Where the move comes from | Reproducible? |
|---|---|---|
| `human_common` | Maia's own sampled `bestmove` (`opponent-selector.ts:502-504`) | **No** — 30/99 non-forced keys stable over 20 repeats |
| `theory_strict`, on spine | `sampleWeighted` keyed on `(seed, historyHash)` | **Yes** — a pure function of byte-identical masses |
| `theory_strict`, off spine | falls through to `#humanCommon` | **No** |
| `practical_resistance` | argmax over `concessionRatio` | **Yes** — but **broken today** (C5: HTTP 500 on 75% of its own domain) |
| `perfect_tablebase` | DTZ/UCI ordering | **Yes** |
| `strong_engine` | `go movetime` with a carried hash | **No** — D35 |

So *"the boss always answers your Sicilian with the English Attack"* is
reproducible; *"the boss always plays Ng5 on move 9"* is not, unless the line is
authored. **The boss's identity is its declared policy, not a move list** — and
the record is what makes even a `human_common` boss repeatable on rewind
(`replay.ts:68-83` refuses a commit with no authoritative selection).

### What needs new work

1. **A declared-boss surface**: "this boss plays white, applies X" is a
   *statement to the learner before the fight*, and nothing in the pack format
   carries a pre-run opponent declaration for display. (`objective.summary`
   exists; it describes the learner's job, not the opponent's.)
2. **Elo bounds** — D60/D65 (`BACKLOG:121`, `:114`) block any honest "boss
   strength" display.
3. **Three shipped opponent defects must land before the mode they affect can
   carry a boss** (R5 §8, §9): `humanConcessionMass`'s tolerance (75% HTTP 500),
   the vacuity gate that plays the alphabetically first reply, and the Maia
   `Elo` carry-over that mis-records `eloApplied`. The third one matters most for
   a campaign specifically: a campaign that starts runs programmatically is
   exactly the caller that would omit `targetElo` and silently inherit another
   learner's band.
4. **Content**: the boss shape the owner wants (opening → middlegame → endgame
   trajectory, `BACKLOG:316`) has **3 cross-phase packs** to build on
   (measured 2026-08-15 over `content/drafts/`).

---

## 9. The three collisions the doc must lead with

These are the doc's most useful content, not problems to smooth over.

### Collision 1 — The roguelike wants a difficulty curve; the research says difficulty is not a quantity outside the endgame

**The idea:** a Spire map ramps. Node 1 is easy, the boss is hard, and the ramp
is what makes the run feel like a run.

**The finding:** R4 — measurable only in decided positions; **10.2%** of
out-of-range positions qualify, median |eval| **43 cp**, and more depth makes it
*worse* (5.8% at depth 16). R9 — the human oracle dies by ply 27, and **23×
more data buys 2–4 plies**. **Two islands, not one: decided endgames and the
first ten moves. They do not touch.**

**The shape this forces:** the ramp is **authored across the middle**, and every
node is *labelled* with which instrument, if any, backs it — the four-value table
in §3. The map's difficulty is not one curve; it is a curve with a documented
hole where the product says so out loud.

Not a defect — it is the one place where this product can be honest about
difficulty where every rating-number trainer is not. But the design must be
*built* around it, because a naive implementation would compute a number, and
`05` §1's *absence is stated, never simulated* forbids exactly that. R4 and R9
say the same thing independently: **the honest move is a named refusal, not a
silent fallback** — and R9 adds that the refusal is now predictable *before* the
query, because a position's ply and the requested band predict whether the
oracle will answer. So a node can **declare** "difficulty is measured here" or
"difficulty is authored here" as a property of where it sits on the map, rather
than discovering an abstention at runtime. That is C11's declare/default
structure landing exactly on the hardest case.

### Collision 2 — "A noob beats an IM/GM boss" requires an IM/GM, and none ships

**The idea:** the synergy claim — the whole point of the deck
(`BACKLOG:272-273`).

**The finding:** `BACKLOG:249`, verified against the code — Maia's bands are
≈1100–1900; above that the only shipped opponent is `strong_engine`, a different
species; weakened Stockfish is rejected doctrine; `targetElo` is unbounded and
unvalidated (D60).

**The shape this forces — and it may be better than the original:** the boss's
difficulty is **not a strength number**. It is a **declared, phase-honest
policy** that the learner's assembled coach answers:

- **opening boss** = `theory_strict` on a sharp line. Its "IM-ness" is that it
  plays *book perfectly* — true, deterministic (R5 §7), and genuinely how a
  titled player feels in the opening to a 1400. And this is the one boss whose
  difficulty is **measured**: R9's human-outcome island covers exactly this
  depth, and separates one engine-tied move pair in six by ≥5 pp with force.
- **endgame boss** = `perfect_tablebase`. Literally unbeatable. Stronger than
  any IM, honestly labelled, deterministic, **and already shipped** (2 packs use
  it). Its difficulty is measured at κ = 1.000.
- **middlegame boss** = `human_common` at the band ceiling **plus an authored
  plan**. Its threat is the plan, not the rating — because there is no rating
  instrument there to be honest with.

That re-cut preserves the owner's sentence — *a noob wins because they have the
right help* — while replacing "IM/GM" (unbuildable, and unbounded in the format)
with "perfect within a declared scope" (shipped, honest, deterministic, and
arguably scarier). It also gives each boss the strongest instrument its phase
actually has, which is the whole difficulty-availability axis expressed as
content rather than as metadata.

### Collision 3 — The rewind budget prices the thesis's own stated selling point

**The idea:** *"we are strict in where you can rewind and how often"*
(`BACKLOG:272`, `:274`).

**The finding:** `00-thesis.md:76-79` names **"Experimentation without cost"** as
one of the two mechanisms that answer *why anyone would use it*. A budget
charges for it. And `05` §1's *"an attempt is never destroyed"* is preservation,
not unlimited retry — so the two are not automatically in conflict, but they are
in tension, and nobody has felt it.

**The shape this forces:** split the one idea into three (§6). *Where* you may
rewind and *whether the consequence must be played out first* collide with
nothing — the second **is already the rule** (`00-thesis.md:99-102`). Only *how
often* is a genuine conflict, and it is precisely what **R6** was written to
answer. `05` §1's own amendment clause and the scheduled invariant review are
the venue.

---

## 10. R6–R8 — what they gate and what stands regardless

`campaign-research-queue.md` §"After the session" — all three are **experiential**
and *"unknowable from a document"*. R8's blunt form: *"nobody has played a run
since 2026-08-12."*

### Stands regardless — designable and writable now

| Part | Why it does not wait |
|---|---|
| **The difficulty-availability axis** (C1, C2) | a measurement fact; no amount of play changes 10.2% or ply 27 |
| **Policy ⟂ inventory** (C8) | already decided, and already true in code (`assistance.ts:27` vs `:3`) |
| **ADR-0007 and law 8** (C9, C10) | standing law |
| **The encounter unlock** (§4) | rung-0 arithmetic over a shipped endpoint (`service.ts:752`); its value does not depend on how scarcity feels |
| **Boss = declared policy** (§8) | expressible today; collision 2's re-cut is forced by shipped facts, not by feeling |
| **The hint economy's *pricing rule*** (C3) | ρ = −0.143 refutes rarity-pricing whatever the loop feels like |
| **L1–L6 discipline on campaign UI** (C7) | the admission rule binds any live channel regardless of frame |
| **C11's declare/default structure** | an owner ruling, generalised on the owner's instruction |
| **The satirical ceremony** (§4) | `05` §3-forms permits form without content; zero mechanics |

### Gated by R6 — *does a rewind budget preserve or destroy punishment-free experimentation?*

- **The rewind budget itself** (§6), and therefore the entire "constraints" pillar's
  headline mechanic.
- **Any campaign difficulty that is expressed as scarcity of retries.**
- **Whether `05` §1 is amended.** R6's instrument is the invariant review
  attached to the first session (`05` §1, `:23-29`).

**Unblocked inside §6 even so:** rewind *location* limits, the play-out-the-
consequence rule, and the refusal-event plumbing — none of which R6 touches.

### Gated by R7 — *what does assistance-as-inventory feel like when you lack a rung you need?*

- **The scarcity design of the deck** — how many slots, how often they are
  withheld, whether lacking one is interesting or infuriating.
- **The synergy claim's payoff**, which is the whole reason the deck exists.

**Unblocked inside §5 even so:** the *slot vocabulary* (the nine
`AssistanceConfig` axes plus `transitionReading`/`endgameReading`), the two-gate
architecture (honesty outer, inventory inner), and the server-held-state
requirement. R7 is about tuning a design whose shape is already forced by C8 and
by the shipped code.

### Gated by R8 — *is the drill loop itself worth wrapping?*

**Everything, in the sense that matters, and nothing, in the sense that this
document costs.** R8 gates *building* the campaign — `BACKLOG:273`'s standing
sequencing ruling: *"the campaign wraps the core loop, so if the loop is wrong
the wrapper is wasted work."*

It does **not** gate writing the design doc, because the doc's most valuable
content is the collision set in §9, and every collision is between an idea that
already exists and a measurement that already landed. Writing it down is how the
cluster stops being reassembled from memory — which is the stated reason the
queue promised the doc in the first place.

---

## 11. Owner rulings to flag (do not decide)

1. **Does inventory persist across campaign runs or reset per run?** (§5) The
   genre says reset; a learning product says accumulate. Largest fork in the
   cluster.
2. **Is the map authored or generated?** (§3) `BACKLOG:316` gestures at
   generation from tracks; C11 works either way.
3. **Does a lost fight become a save node?** (§3) Thesis-native
   (`00-thesis.md:81-89`), genre-contradicting.
4. **Which of the three "rewind budget" ideas is the one the owner means?** (§6)
   Only *how often* collides.
5. **Does "IM/GM boss" survive as a phrase?** (§9 collision 2) The re-cut
   preserves the mechanic and drops the rating language; that is an owner call
   about the product's promise, not an implementer's.
6. **Is `live-marker-quality`'s L1–L6 binding on campaign UI before that RFC is
   accepted?** It is a **draft awaiting cross-review** (`rfc/README.md:10`). If
   the campaign doc cites it as a constraint, it is being treated as binding
   ahead of acceptance.
7. **Does the campaign write a middlegame content commitment?** (§3, §8) 3 of 43
   packs are middlegame, and C2 says that is also the only phase where
   difficulty *must* be authored. A middlegame-centred campaign is a content
   commitment, not a design one.
8. **Does the campaign reopen Q3's mobile verdict?** (C6) `mobile-scope.md` §5
   names the campaign as one of four things that would change its answer, and
   the campaign is a one-board-per-encounter frame. The owner may want to decide
   this *before* the map is designed, since a phone-first map is a different map.

---

## 12. Traceability

Every claim above resolves to one of these.

**Ledger rows** — `design/BACKLOG.md` `:114` (D65), `:121` (D60), `:128-129`
(D51, D52), `:249` (Just Play difficulty), `:272` (build your coach), `:273`
(roguelike posture), `:274` (rewind budget), `:282` (authored declares), `:315`
(encounter unlocks), `:316` (Spire map), `:317` (ceremony), `:318`+`:401`
(ADR-0007), `:371` (time-pressure), `:416` (R3 answered).

**Dossiers**, with the sections this file draws on —

| Dossier | Sections used |
|---|---|
| `practical-difficulty-outside-tablebase.md` (R4) | §1 verdict · §5.3 outcome-class agreement · §6.1 decided rates · §6.2 cross-depth stability · §9 what would change it · §10 what this means for the campaign |
| `human-outcome-coverage-depth.md` (R9) | §1 verdict · §5.1 coverage curve · §5.3 move-level coverage · §6.1 position level · §6.3 engine-tied/human-separated · §7.1 greedy walk · §7.2 population ceiling · §8.1 band dependence · §8.4 on-ramp gap · §10 what this means for the campaign |
| `census-hint-false-positives.md` (R3) | §1 verdict · §3b the T/C/D definition · §5 per-leaf signal rates · §6 selectivity is not a proxy · §7 the RFC's bet |
| `move-primitive-computability.md` (R1/R2) | §1 verdict · §3a cost table · §3c tempo is not mechanical · §4d 98.7% FP · §4f R2 verdict |
| `maia-policy-scalar-stability.md` (R5) | §1 verdict · §3 the 20-repeat probe · §4 the sampler · §6 consequence for `humanConcessionMass` · §7 mode-by-mode reproducibility · §8 two shipped defects · §9 the D35 analogue |
| `mobile-scope.md` (Q3) | §1b the tablet band · §2a compare geometry · §2d verdict table · §5 verdict and what would change it |

Every dossier states its own limits; three that bear directly on this synthesis
and must not be dropped when the design doc is written: R4's corpus is 35
authored theory packs so its out-of-range decided rate is *"a floor, not an
estimate of chess at large"*; R9's middlegame sample is one pack and two
trajectories, so its deep-ply rows rest on 3–6 positions per ply; and R3's
conditions are **necessary, not sufficient**, so its signal rates are ceilings.

**Living design** — `design/00-thesis.md:60-63`, `:76-79`, `:99-102`;
`design/01-training-model.md:81-110` (outcome types), `:112-133` (four modes);
`design/03-product-breadth.md:33-55`, `:93-98`; `design/04-content-architecture.md:178-190`;
`design/05-in-run-experience.md:21-42` (invariants), `:63-95` (ladder),
`:111-151` (forms), `:153-176` (silence), `:442-457` (endgame/middlegame asymmetry).

**RFC** — `rfc/live-marker-quality.md:321-430` (L1–L6 + register), **draft**.

**Code, verified 2026-08-15** —
`packages/runtime/src/assistance.ts:3-14`, `:21-30`;
`packages/runtime/src/types.ts:36-63`, `:104`;
`packages/runtime/src/runtime.ts:341`, `:368`, `:385`, `:416`;
`packages/runtime/src/branch-scale.ts:11-19`, `:40`, `:81-86`;
`packages/runtime/src/structure.ts:22-52`, `:225-247`, `:452`;
`packages/runtime/src/transition.ts:24-66`, `:344`, `:360`;
`packages/runtime/src/objective.ts:69-100`;
`packages/runtime/src/shape-firing.ts:15`;
`packages/runtime/src/endgame.ts:21`;
`packages/runtime/src/phase.ts:28`;
`packages/runtime/src/voice.ts:33`;
`apps/server/src/service.ts:585-589`, `:752-771`;
`apps/server/src/progress.ts:6-7`, `:67`;
`apps/server/src/authored-feedback.ts:21-73`, `:251`;
`apps/server/src/rest.ts:417-423`;
`apps/web/src/lib/router.ts:1-30`;
`apps/web/src/lib/assistance-preference.ts:1-10`;
`apps/web/src/lib/DrillScreen.svelte:136`, `:286`;
`apps/web/src/lib/transition-sentences.ts:9`;
`schemas/drill_pack.schema.json:22-27`, `:64-66`, `:173-186`, `:200-214`, `:877-898`.

**Corpus measurement, 2026-08-15** — `content/drafts/`: 43 packs; phase 23
opening / 14 endgame / 3 middlegame / 3 cross_phase; `opponentPolicy.mode` 25
`theory_strict` / 16 `human_common` / 2 `perfect_tablebase`; 38 carry
`difficulty`; 37 carry `targetElo`.

**`[M]`** — no model knowledge is load-bearing in this file. The Slay-the-Spire
comparison is the owner's own (`BACKLOG:316`), used as a name for a shape rather
than as a claim about that game.
