# Practical difficulty outside the tablebase — the R4 verdict

**Question:** R4, "Can practical difficulty be measured at all outside ≤7 pieces?"
(`planning/campaign-research-queue.md:30`). The experiment was already specified —
`rfc/resistance-spectrum.md:466-480` (§7b) asks for **fixed-depth Stockfish with a cleared
hash** as a middlegame concession classifier, measured for **per-ply cost** and for
**agreement with the tablebase classifier where both exist**, and says of the second
measurement: *"it is the only way to know whether the engine-gated mode is the same
mode."* This dossier runs it.

**What it blocks.** `resistance-spectrum` defines `practical_resistance` — the *annoying*
opponent — as "of the replies that do not concede your own result, play the one that
leaves the learner the greatest measured chance of going wrong" (`:221-223`). Its metric
is `humanConcessionMass`: Maia policy mass over the moves a grounded classifier calls
conceding (`:164-166`). The only admissible classifier in v1 is the tablebase category
(`:180-191`), exact at seven pieces or fewer, so the RFC scopes `annoying` to endgames and
leaves the middlegame version specified-but-unshipped. Separately, every campaign idea in
`planning/campaign-research-queue.md` assumes difficulty is a quantity that exists in
middlegames.

---

## 1. Verdict

**No — not as the same measurement, and the reason is not cost.**

Three findings, each measured, in the order that matters:

1. **The classifier §7b actually specifies does not agree with the truth.** A fixed
   centipawn *window* around the best move — "a move concedes iff it falls outside a fixed
   centipawn window of the best" (`resistance-spectrum.md:470-471`) — reaches a best
   Cohen's κ of **0.577** against the exact tablebase classifier over 2,416 moves in 171
   positions (depth 12, window 200 cp), and its concession *set* matches the tablebase's
   on only **66.1%** of positions `[V]`. It is not the same mode. §5.2.

2. **A different, one-word-changed classifier agrees perfectly — inside the range.**
   Classifying by *outcome class* rather than by distance-to-best — a move concedes iff
   the sign-class of its evaluation at |100| cp differs from the position's — reaches
   **κ = 1.000, accuracy 1.000, concession-set match 1.000** over the same 2,416 moves at
   depth 12 and depth 16, with **zero** false positives and zero false negatives `[V]`.
   Stockfish had no tablebase access (`tbhits 0`, §2), so the agreement is not circular.
   This is a real result and it repairs §7b's specification. §5.3.

3. **It repairs it only where the repair cannot be used.** The property that makes the
   outcome-class classifier exact is that the position *has* an outcome class. In the
   committed corpus, **88.3% of ≤7-piece positions are decided** at that threshold and
   **10.2% of out-of-range positions are** — median |eval| **43 cp**, p90 **100 cp**
   `[V]`. Outside the range the classifier stops measuring outcome-class change (there is
   no class to change) and silently becomes a magnitude filter on an undecided position.
   And it stops being stable: in range, the same concession set is produced at depth 8 and
   depth 12 for **99.4%** of positions and at depth 12 and 16 for **100%**; out of range
   only **39.8%** of positions keep the same set from depth 8 to 12, and no depth pair on
   the whole ladder from 1→2 to 12→16 does better than **53.8%** `[V]`. In range the
   sequence converges to 1.000; out of range it does not converge. §6.

**Cost is real but it is the second problem, not the first.** Full-legal-move MultiPV at
fixed depth over out-of-range positions (mean 31.8 legal moves, n = 284) costs a median
**77 ms** at depth 8, **938 ms** at depth 12, **~9 s** at depth 16 and **~39 s** at depth
20 `[V]`, against the shipped `<500 ms` uncached-opponent budget
(`design/02-product-shape.md:162-163`). Depth 8 fits the budget. Depth 8 is also where the
concession set is least stable. There is no depth that is both affordable and stable
out of range, and no depth at all that is *meaningful* out of range.

**One sentence:** practical difficulty is measurable exactly where positions have
determinate outcomes and only there — inside seven pieces that is 88% of the corpus and
agreement with the exact instrument is perfect, outside it that is 10% and the metric
becomes an unstable magnitude filter wearing the same name — so **bosses whose difficulty
is a measured quantity are endgame-shaped**, and the seven-piece line is a proxy for the
real line, which is *decidedness*.

---

## 2. Method, and what these numbers are not

**Instrument, one only.** Every engine reading in this dossier was taken through the
repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`) driving local
Stockfish, and every tablebase reading through the repo's own `LichessTablebaseSource`
(`apps/server/src/tablebase.ts:17-23`) with categories inverted through the shipped
`invertTablebaseCategory` (`tablebase.ts:11`) exactly as `#perfectTablebase` does
(`opponent-selector.ts:545-549`). No second UCI integration was written; the harness
entry files import the repo's classes by relative path and are bundled with the repo's own
esbuild — the same arrangement grounding wave G1 used
(`planning/content-era/log.md:1509-1515`).

**Harness** (disposable, exploration-gate work under `rfc/0000-rfc-process.md`
§Exploration gate, tied to R4): `tools/r4-difficulty-harness/` — `extract.ts` (corpus →
positions), `probe-sf.ts` (fixed-depth MultiPV probe), `probe-tb.ts` (exact reference),
`probe-maia.ts` (policy-mass availability), `analyze.py` (agreement), `degeneracy.py`
(out-of-range behaviour and cross-depth stability). Summary artifacts and the exact
tablebase reference in `tools/r4-difficulty-harness/out/`; `README.md` there is the
reproduction recipe.

**Engine configuration.** Stockfish 18 (`id name Stockfish 18`, Homebrew arm64), `Threads
1`, `Hash 16`, `MultiPV` set per position to the exact legal-move count, `go depth D` — no
`movetime` anywhere, as §7b requires. **`ucinewgame` and `setoption name Clear Hash` are
sent before every probe** and an `isready` handshake is awaited before the search, so no
transposition table survives from one probe to the next.

**Stockfish had no tablebase access.** `SyzygyPath` is left at its `<empty>` default, no
Syzygy files exist under the Homebrew prefix (`find /opt/homebrew -iname '*.rtbw'` →
nothing), and a depth-16 probe of the Philidor root reports `tbhits 0` `[V]`. The
in-range agreement in §5 is therefore between an NNUE search and Syzygy, not between
Syzygy and itself.

**Honesty limits, stated before the numbers:**

1. **Timings are wall clock on one shared workstation** (Apple Silicon, macOS 25.5.0,
   single Stockfish thread, one harness process at a time). They are a per-probe cost on
   this hardware, not a portable benchmark, and one run was contended by unrelated work —
   §4.1 names which and by how much. The comparison that matters — depth 8 versus depth 20
   on identical positions — is internal and holds regardless of the machine.
2. **The corpus is this repo's 35 committed packs**, not a sample of chess. Its
   out-of-range half is 18 opening packs, 1 middlegame pack and 2 cross-phase trajectories
   — *authored theory lines*, which are balanced by construction. §6.1 says plainly what
   that biases and what it does not.
3. **Agreement is measured per legal move**, treating "concedes" as the positive class,
   and reported as Cohen's κ alongside raw accuracy. Raw accuracy alone is misleading here:
   the tablebase calls only 22.9% of moves conceding, so a classifier that says "nothing
   concedes" scores 0.771 accuracy and κ = 0.
4. **Positions with a single legal move are excluded** from every agreement figure —
   25 of the 196 in-range positions — because there is no classification to make.
5. **Nothing here is a chess claim.** Every number is an instrument reading or an
   agreement rate between two instruments (`AGENTS.md` law 8). Where the two disagree this
   dossier reports the disagreement; it does not adjudicate which is right about the
   position.

---

## 3. The corpus, and where the boundary actually falls

`extract.ts` replays every committed pack in `content/drafts/` from its `start.fen` through
its spine tree and collects every decision position plus every authored deviation anchor,
deduplicated by FEN. Browser test fixtures (`*.browser.json`, including the `resist`
fixture whose own provenance says "never publish as chess content") are excluded.

| | Packs | Unique positions | ≤7 pieces | >7 pieces |
|---|---:|---:|---:|---:|
| endgame | 14 | 228 | **196** | 32 |
| opening | 18 | 128 | 0 | 128 |
| middlegame | 1 | 16 | 0 | 16 |
| cross_phase | 2 | 109 | 0 | 109 |
| **total** | **35** | **481** | **196** | **285** |

`[V]`, reproducible: `node extract.mjs content/drafts positions.json`. **Corpus snapshot:
`content/drafts/` as of 2026-08-15, 35 packs**, taken before the parallel wave-4b additions
(`anti-scandinavian-white`, `scandinavian-mainline-black`) landed. Re-running the harness on
a later tree will report more positions; nothing in §§4–6 turns on the exact count.

Two structural facts follow immediately:

- **The tablebase-range half is entirely endgame** and the out-of-range half is entirely
  not — no opening, middlegame or cross-phase position in the committed corpus is inside
  the range. The boundary and the phase split coincide exactly in this corpus.
- **Branching differs by a factor of 2.5.** In-range positions have a mean of **12.45**
  legal moves; out-of-range positions **31.73** `[V]`. Since the §7b probe sets MultiPV to
  the legal-move count, the out-of-range probe is intrinsically the more expensive one,
  before any depth is chosen.

The exact reference resolved for all 196 in-range positions (Lichess standard tablebase,
one probe each, retried through HTTP 429 backoff). Position categories: **91 win, 85 loss,
20 draw**. Move categories after inversion to the mover's perspective: **1,359 win, 574
draw, 508 loss** `[V]`. **No `cursed-win` or `blessed-loss` appears anywhere in the
corpus**, so the RFC's ten-value lattice (`tablebase.ts:5`), the fifty-move-honouring
three-value collapse and the DTM three-value collapse are *the same reference* over this
data — every agreement figure below is identical under all three, and the fifty-move
boundary the RFC is careful about never fires here.

---

## 4. Per-ply cost, measured

Median wall clock for one complete probe, `MultiPV` = legal-move count, `ucinewgame` +
`Clear Hash` + `isready` before the search. Reset costs a **median 6 ms** at every depth
and is excluded from the `go` column; add it for the per-ply total.

| Depth | in-range `go` median (n=171) | out-of-range `go` median (n=284) | out-of-range p95 | out-of-range max |
|---:|---:|---:|---:|---:|
| 1 | 0.2 ms | 1 ms | 1 ms | 5 ms |
| 2 | 0.5 ms | 2 ms | 4 ms | 6 ms |
| 4 | 1.1 ms | 7 ms | 14 ms | 20 ms |
| 6 | 2.3 ms | 21 ms | 44 ms | 61 ms |
| 8 | 6.9 ms | **77 ms** | 172 ms | 263 ms |
| 12 | 42.8 ms | **938 ms** | 2,076 ms | 2,620 ms |
| 16 | 170.0 ms | **7,660 ms** (n=52, §4.1) | 12,256 ms | 15,498 ms |
| 20 | 3,264 ms (n=3) | **38,929 ms** (n=6, §4.1) | — | 54,648 ms |

`[V]`. The relevant budget is `design/02-product-shape.md:162-163`: "uncached Maia <500 ms
· shallow Stockfish feedback <500 ms · deep analysis async", the same envelope
`docs/engine-workers.md:218-227` measures Maia against (53 ms median, 123 ms max).

**Reading it.** Out of range, depth ≤8 fits the budget with room; depth 12 exceeds it by
1.9× at the median and 5.2× at p95; depth 16 and 20 are not in the same order of
magnitude. In range the whole ladder up to depth 16 fits — which is exactly the region
where an exact, free, single-HTTP-probe classifier already exists.

**And this is the per-position cost, not the per-selection cost.** `resistance-spectrum`
§2c requires one classifier probe *per surviving candidate* per ply, capped at 8
(`:245-252`). A middlegame `practical_resistance` selection would therefore cost up to
**8×** the numbers above — 8 × 77 ms ≈ 620 ms at depth 8, already over budget, and
8 × 938 ms ≈ 7.5 s at depth 12. The single-probe figures are a lower bound on the live
opponent loop by a factor of eight.

### 4.1 The deep end

A 6-position pilot at four depths on out-of-range positions (mean 36.2 legal moves), run
before any other harness process existed, measured `go` medians of **122 ms** (d8),
**1,288 ms** (d12), **8,608 ms** (d16) and **38,929 ms** (d20), with a d20 maximum of
**54,648 ms** `[V]`. A 52-position depth-16 sample confirms d16 at scale: median
**7,660 ms**, p95 **12,256 ms** `[V]`.

**Caveat on the d16 sample specifically.** An unrelated CPU-heavy process on the same
workstation (`balance-harness`, another repository, ~470% CPU) overlapped part of that
run; it was absent during the pilot and during the depth ≤12 runs. The d16 sample should
therefore be read as an upper bound, and the clean pilot median (8,608 ms) as the figure
to trust. They agree to within 12%, which is why the caveat is recorded rather than
treated as a reason to re-run: both are ~17× the budget.

Depth 22 — the repo's own `AUTHORING_PROFILE` for offline pack grounding
(`apps/server/src/sourcing/position-seeds.ts:75`, used by grounding wave G1 for 387 jobs)
— was not probed with full MultiPV; the depth-20 measurement is already **78×** the
interactive budget and settles the affordability question without it.

### 4.2 D35 confirmed, and what the reset costs

`resistance-spectrum.md:410-412` (§4d) records that the shipped `strong_engine` path sends
`go movetime` and that no `ucinewgame` or `Clear Hash` is sent anywhere in the server.
**Re-verified `[V]`:** `grep -rn "ucinewgame\|Clear Hash" apps/server/src/ packages/
workers/` returns **zero matches**, tests included. The shipped strong engine carries its
transposition table across selections and searches on a wall clock.

The reset §7b requires costs a **median 6 ms** per probe, invariant across depth 1→16 and
across both position sets `[V]` — 8% of a depth-8 out-of-range probe, 0.6% of a depth-12
one. **Correctness here is nearly free**; D35 is not a cost trade-off, it is an omission.
A no-reset control run over the in-range set at depth 12 is reported in §7.

---

## 5. Agreement where both classifiers exist

This is the measurement `resistance-spectrum` §7b calls the important one.

**Setup.** 171 in-range positions with ≥2 legal moves, **2,416 legal moves** total.
Reference: `moveConcedes(m) ⟺ invertTablebaseCategory(category(m)) ≠ category(P)` — the
RFC's §1c classifier, computed from the shipped provider. Candidate: two readings of the
same fixed-depth MultiPV probe, so they cost identically.

### 5.1 The base rate

The tablebase calls **22.9%** of legal moves conceding (554 of 2,416) `[V]`. **46.2%** of
in-range positions have *no* conceding move at all — dead-drawn or dead-lost positions
where nothing can change the class. Any accuracy figure below 0.771 is worse than saying
"nothing concedes".

**One quirk of the reference, checked rather than assumed.** `resistance-spectrum` §1c
defines conceding as the inverted category being *different* from the position's, which
would also flag a move that *improves* the class (a draw found in a lost position). Over
this corpus that never happens: **all 554 class-changing moves are worsenings, zero are
improvements** `[V]`. The `≠` formulation is therefore doing no unintended work here, and
the agreement figures are not inflated by it. On a corpus with saveable lost positions it
would need re-checking.

### 5.2 The classifier §7b specifies: a centipawn window — fails

"Keeping every reply within a fixed centipawn window of the best; a move concedes iff it
falls outside the window" (`resistance-spectrum.md:470-471`). Depth 12, window swept:

| Window | accuracy | **κ** | precision | recall | set match |
|---:|---:|---:|---:|---:|---:|
| 50 cp | 0.622 | 0.322 | 0.377 | 1.000 | 0.491 |
| 100 cp | 0.704 | 0.423 | 0.436 | 1.000 | 0.591 |
| **200 cp** | **0.806** | **0.577** | 0.542 | 1.000 | **0.661** |
| 500 cp | 0.822 | 0.526 | 0.595 | 0.702 | 0.538 |

`[V]`. Best κ = **0.577** at 200 cp; the concession set is exactly right on 66.1% of
positions. Cross-depth it is no better: the window-100 concession set is identical at
depth 12 and depth 16 for only **53.8%** of in-range positions `[V]`.

**Why it fails is structural, not a tuning miss.** The window measures *distance from the
best move*; the tablebase measures *change of outcome class*. In a position that is
already lost, every move is a loss and the tablebase says nothing concedes — while the
window flags every move that is not the longest resistance. In a position that is winning
by mate in 6, the window flags every non-mating move even though many still win. No
window width reconciles the two, because they are not measuring the same object.

### 5.3 One word changed: outcome class — agrees exactly

Classify each move's evaluation into {win, draw, loss} at a threshold T and call a move
conceding iff its class differs from the position's (i.e. from the best move's class). Same
probe, same cost, different reading:

| Depth | median `go` | best T | accuracy | **κ** | set match | FP | FN |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0.2 ms | 50 cp | 0.9507 | 0.8671 | 0.877 | 98 | 21 |
| 2 | 0.5 ms | 100 cp | 0.9897 | 0.9708 | 0.924 | 15 | 10 |
| 4 | 1.1 ms | 50 cp | 0.9946 | 0.9848 | 0.953 | 8 | 5 |
| 6 | 2.3 ms | 100 cp | 0.9967 | 0.9907 | 0.988 | 8 | 0 |
| 8 | 6.9 ms | 100 cp | 0.9988 | 0.9965 | 0.994 | 3 | 0 |
| **12** | 42.8 ms | **100 cp** | **1.0000** | **1.0000** | **1.000** | **0** | **0** |
| **16** | 170.0 ms | **100 cp** | **1.0000** | **1.0000** | **1.000** | **0** | **0** |

`[V]`, 171 positions / 2,416 moves at every row. The threshold is not delicate: at depth
12, T = 150 cp gives κ = 0.9988 and T = 50 cp gives κ = 0.9814; it degrades at T ≥ 200
(κ = 0.881) `[V]`.

Two consequences for `resistance-spectrum` specifically:

- **The position's class is recovered perfectly.** Stockfish's own class for the position
  (from the best move's evaluation, |100| cp) equals the tablebase category, coarsened,
  for **171 of 171** positions at depths 8, 12 and 16 `[V]`.
- **§2b's self-preservation gate is safe.** The gate keeps the replies the classifier calls
  non-conceding; an *unsafe admission* is a move the engine gate keeps and the tablebase
  calls conceding — the case where the "annoying" opponent throws the game away. At depth
  ≥12 with T = 100 cp there are **zero** unsafe admissions and the gate is safe on
  **171/171** positions `[V]`. At depth 8 it is safe on 171/171; at depth 6 on 171/171; at
  depth 4 on 166/171 (unsafe-admission rate 0.003); at depth 1 on 159/171 (0.012).

**`DESIGN-GAP:` `rfc/resistance-spectrum.md:470-471` specifies the wrong reading.** The
centipawn-window formulation is the one the RFC would have implemented and it does not
reproduce the exact classifier (κ 0.577). The outcome-class formulation does (κ 1.000). If
§7b is ever drafted, this is the amendment — and it costs nothing, because both readings
come out of the same MultiPV probe.

---

## 6. Outside the range: the same classifier stops measuring the same thing

§5.3 is an in-range result. It cannot be extended by assertion, and this section measures
why not.

### 6.1 Almost nothing out of range is decided

|eval| of the best move, out-of-range positions, n = 284:

| Depth | median | p90 | max | >100 cp | >200 cp | >500 cp |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 38 cp | 108 cp | 723 cp | 11.3% | 8.5% | 5.3% |
| 4 | 42 cp | 95 cp | 608 cp | 9.2% | 4.9% | 1.4% |
| 8 | 46 cp | 106 cp | 579 cp | 12.0% | 4.9% | 1.1% |
| **12** | **43 cp** | **100 cp** | **606 cp** | **10.2%** | **5.3%** | **0.4%** |
| 16 (n=52) | 41 cp | 79 cp | 457 cp | 5.8% | 3.8% | 0.0% |

For contrast, **88.3%** of in-range positions exceed 100 cp at depths 8, 12 and 16 `[V]`,
and the in-range median |eval| is **501 cp** at depth 12 against 43 cp out of range —
a factor of 12. More depth makes the out-of-range picture *more* balanced, not less: the
decided rate falls from 12.0% at depth 8 to 5.8% at depth 16.

So at the threshold that scores κ = 1.000, the position's outcome class is **draw** for
89.8% of out-of-range positions. "A move concedes iff it changes the outcome class" then
degenerates into "a move concedes iff its evaluation leaves ±100 cp" — a magnitude filter
that flags **50.8%** of all legal moves `[V]`. That is a different quantity from the one
validated in §5.3, applied under the same name, with no oracle anywhere to check it
against.

**What the corpus biases and what it does not.** These are authored theory lines, so they
are balanced by construction and the decided-rate is a floor, not an estimate of chess at
large. That cuts one way only: it means *this corpus* cannot supply decided middlegame
positions, not that none exist. The argument does not rest on the rate — it rests on the
fact that **out of range there is no instrument that says whether a position is decided**,
so the classifier cannot even abstain honestly. In range it can: the tablebase says.

### 6.2 It is not stable across depth either

Fraction of positions whose concession set is *identical* at two consecutive depths:

| Depth pair | in-range, class T=100 | out-of-range, class T=100 | out-of-range, window 100 |
|---|---:|---:|---:|
| 1 → 2 | 0.819 | 0.415 | 0.380 |
| 2 → 4 | 0.906 | 0.331 | 0.299 |
| 4 → 6 | 0.965 | 0.292 | 0.349 |
| 6 → 8 | 0.988 | 0.366 | 0.349 |
| 8 → 12 | **0.994** | **0.398** | 0.401 |
| 12 → 16 | **1.000** | 0.538 (n=52) | 0.615 (n=52) |

`[V]`, n = 171 in range and 284 out of range (52 at depth 16). Per-move agreement out of
range is 91–97%, which sounds tolerable and is not: the selector consumes the *set*, and
60% of positions change theirs between depth 8 and depth 12. **In range the sequence
converges monotonically to 1.000; out of range it does not converge at all** — the 1→2
pair (0.415) is no worse than the 8→12 pair (0.398), and the best out-of-range figure
anywhere on the ladder is 0.538.

A metric whose value depends on an arbitrary depth constant, in a regime where no oracle
can adjudicate the constant, is a tuning knob presented as a measurement. That is the
shape `resistance-spectrum` §2f already refuses for authored thresholds
(`:302-308`: "a tuned threshold would be an authored assertion about how hard a position
is — an ungrounded chess claim wearing a number"). The same objection applies to a tuned
*depth*.

---

## 7. Two controls

**Hash carry-over (D35), quantified.** The same 171 in-range positions were re-probed at
depth 12 in sequence with `NO_RESET=1` — no `ucinewgame`, no `Clear Hash` — reproducing
the shipped `strong_engine` state exactly (§4.2). Against the clean-slate run:

- **83.8%** of individual move evaluations differ (2,025 of 2,416) `[V]`;
- the engine's reported best move (MultiPV 1) differs on **89 of 171** positions `[V]`;
- the no-reset search is **25% faster** (median 31.9 ms vs 42.8 ms) — the carry-over is
  doing real work, which is precisely why the numbers move;
- **but the concession set is identical on 171 of 171 positions** and per-move
  classification agrees on 2,416 of 2,416 `[V]`.

Two things follow, and they point in opposite directions. **D35 is real and larger than
its ledger row suggests** — carrying the hash changes five out of six evaluations and the
engine's own top choice on half the positions, so any consumer reading a *score* or a
*best move* off the shipped `strong_engine` path is reading a number that depends on what
was searched before it. **And the outcome-class classifier is robust to it in the endgame**
— the classification is a sign test on a polarized quantity, and hash noise of this size
does not move a ±500 cp evaluation across a ±100 cp line. Out of range, where the median
|eval| is 43 cp, that robustness argument does not hold and was not measured.

**Reference collapse.** Because no `cursed-win`/`blessed-loss` appears in the corpus (§3),
all three candidate references — the full ten-value lattice, the fifty-move-honouring
collapse, and the DTM collapse — produce byte-identical agreement figures. Reported once;
the choice of reference is not doing any work in this dossier and would need re-measuring
on a corpus containing fifty-move-boundary positions.

---

## 8. Maia policy mass — availability, observed (this brushes R5)

`humanConcessionMass` needs two readings, and §5–§6 measured only one. This section
records what the other one does at the same positions. **It is an availability
observation, not R5's answer** — R5 asks about scalar *stability* and owns that question.

**Setup.** The production `maiaDockerSpec` (`apps/server/src/maia.ts`) against the pinned
local image, driven with the exact command shape `opponent-selector.ts:452-466` builds:
`setoption name Elo` / `Temperature 0.8` / `TopP 0.92` / `MultiPV max(8, |legal|)`, then
`position fen <start> moves <full history>` (history reconstructed from each pack's spine,
as the sidecar's `--use-uci-history` requires, `workers/maia/README.md:24-27`), then `go`.
Ten in-range and ten out-of-range positions, bands 1100 / 1500 / 1900, two repeats each:
**120 probes, 0 failures** `[V]`.

| | in-range (n=60) | out-of-range (n=60) |
|---|---:|---:|
| probes returning candidates | 60/60 | 60/60 |
| every candidate carried a `policy` scalar | **60/60** | **60/60** |
| median candidates returned | 5 | **20** |
| median legal moves | 5 | 35 |
| median Σ policy over returned candidates | **1.0000** | **0.9999** (min 0.9891) |
| latency median / max | 144 ms / 335 ms | 167 ms / 421 ms |

Five observations, each with a consequence:

1. **Policy mass is available everywhere tested, at every band, in and out of range**
   `[V]`. The instrument that `humanConcessionMass` needs for its *numerator's weights* is
   not the thing that breaks outside seven pieces. The classifier is.
2. **Maia caps its candidate list at 20** regardless of the requested MultiPV — every
   out-of-range probe returned exactly 20 despite a median of 35 legal moves `[V]`. This
   is the case `resistance-spectrum` §1d anticipates ("mass outside the returned set is
   unmeasured, not zero", `:194-200`), and it is measurable: the returned 20 carry a median
   **99.99%** of the mass, worst case **98.91%**. The absent mass is real and small.
3. **The `Elo` option is advertised** — first contact reports `Elo`, `SelfElo`, `OppoElo`,
   `Temperature`, `TopP`, `MultiPV` `[V]`, matching `workers/maia/README.md:38-40`. This
   answers `resistance-spectrum` **open question 2** empirically: under §3b's mechanism
   `eloHonored` would be **true** for this engine, so band-calibrated fallibility is a
   shipped capability once the check exists, not a shipped claim. `seedHonored` is
   confirmed `false` in the same handshake.
4. **The band knob changes the distribution.** The policy vector differs across
   1100/1500/1900 on **18 of 20** positions `[V]`; the two exceptions are near-forced. The
   option is not decorative.
5. **Repeated identical requests returned byte-identical policy vectors on 60 of 60
   key pairs** `[V]` — 2 repeats, not the 20 that `resistance-spectrum` acceptance
   criterion 5 asks for. This is a signal in R5's favour and **not** a result; recorded
   here so the observation is not lost, and left to R5.

Latency note: at MultiPV 20–42 the median is 144–167 ms against the 53 ms median
`docs/engine-workers.md:218-227` records at MultiPV 8. Still inside the `<500 ms` budget,
but the wider candidate list `practical_resistance` needs is ~3× the documented cost, and
that measurement was taken while the workstation was loaded (§4.1).

---

## 9. What would change the answer

A well-evidenced "no" is only complete if it says what would overturn it. Four things
would, in descending order of plausibility:

1. **A different oracle: human outcomes instead of engine evaluations.** The reason
   §5.3's classifier cannot be validated out of range is that it needs a *result*, and
   engines out of range do not have one. Human games do. The Lichess explorer path already
   shipped in this repo (`docs/runtime-corpus-evidence.md`, `apps/server/src/corpus.ts`)
   returns per-move win/draw/loss counts at a rating band — an empirical result
   distribution over a position, which is exactly the object "practical difficulty" wants
   and is not an engine opinion at all. Its known limits are the reason it is not the
   answer today: opening-only coverage and a 100-game abstention floor
   (`docs/runtime-corpus-evidence.md:34`), plus a query-time population window
   (`corpus.ts:139-144`) that would have to be pinned into the run. **Measuring how far
   explorer coverage actually reaches into middlegame positions is the single highest-value
   follow-up this dossier can name**, and it is a coverage question, not an engine question.
2. **A decidedness gate instead of a piece-count gate.** §5.3 + §6.1 together say the real
   predicate is "does this position have an outcome class", not "does it have ≤7 pieces". A
   mode that probes once, checks |eval| against a threshold, and **refuses by name when the
   position is undecided** would extend `practical_resistance` to decided middlegames — the
   9-piece won endgame, the middlegame that is already +3 — while abstaining honestly
   everywhere else. It would need the abstention rate measured on a corpus that contains
   decided middlegames, which this one does not.
3. **Amortization instead of speed.** The cost figures are per-probe at selection time. A
   pack-authoring-time pre-computation over the authored spine — the shape grounding wave
   G1 already runs at depth 22 (`planning/content-era/log.md:1509-1521`) — moves the whole
   bill offline for authored content, at the price of covering only positions an author
   anticipated. That makes depth 16–20 affordable but does not make the metric mean
   anything more than §6 says it does.
4. **Hardware or a smaller candidate set.** A 10× faster machine moves depth 12 out of
   range from 938 ms to ~94 ms. It does not touch §6.1 or §6.2. This is the option that
   looks like a fix and is not one.

Two things would **not** change it: more depth (§6.2 — it does not converge), and a better
window width (§5.2 — the window is measuring the wrong object at every width).

---

## 10. What this means for the campaign

Answering R4's own framing — *"Every campaign idea assumes difficulty is a quantity. If it
is only measurable in endgames, 'boss encounters' are endgame-only and the design changes
shape"* (`planning/campaign-research-queue.md:30`):

- **A boss whose resistance is a measured quantity is endgame-shaped today**, and more
  precisely *decided-position-shaped*. In the committed corpus those two are the same set.
- **The campaign does not have to be endgame-only**, because difficulty-as-measurement is
  not the only difficulty an encounter can have. A boss can vary the *band* (Maia
  `Elo`), the assistance inventory (`05` §3), the objective, the rewind budget, or the
  opponent mode — none of which needs `humanConcessionMass`. What it cannot do outside a
  decided position is claim a *number*.
- **The honest design move is a named refusal, not a silent fallback.** This is the rule
  `resistance-spectrum` §2e already states for the endgame case (`:275-297`: "the selector
  never falls through to another mode… a `human_common` move presented as practical
  resistance misreports the opponent's objective"). An engine-gated middlegame mode that
  reported a magnitude filter as practical difficulty would be the same misrepresentation
  one boundary out.
- **The design doc R1–R5 earns should carry a difficulty-availability axis**, not a
  difficulty scalar: encounters where difficulty is measured, encounters where it is
  authored, and encounters where it is neither and the challenge comes from the objective.

---

## 11. Residuals

- Depth 22 with full MultiPV was not probed (§4.1) — settled by extrapolation from depth
  20, which is already 78× the budget.
- The out-of-range corpus is 90% undecided positions, so the §6.1 rate is a property of
  authored theory lines and not an estimate of middlegame chess. Option 2 in §9 needs a
  corpus with a meaningful population of decided middlegames; 29 of 284 is not one.
- Maia policy-scalar *stability* is R5's question and `resistance-spectrum` acceptance
  criterion 5. §8 observation 5 saw 60/60 byte-identical repeats at n=2 and stops there;
  the 20-repeat probe is R5's to run.
- The D35 control (§7) shows the outcome-class classifier is robust to hash carry-over
  **in range**, where evaluations are polarized. The same control was not run out of range,
  where the median |eval| is 43 cp and the robustness argument does not hold. If anyone
  revisits an engine-gated middlegame classifier, that control comes first.
- The depth-16 out-of-range sample is 52 of a planned 60 positions; the run was stopped
  once the median had stabilised and the machine was contended (§4.1).
- The learner-side consumer of the metric (`resistance-spectrum` §7a) is untouched here.
  If practical difficulty is only gradable in decided positions, the `resist` grading
  handoff inherits the same boundary.
