# Maia's policy scalar — the R5 verdict

**Question:** R5, *"Is Maia's policy scalar stable enough to build on?"*
(`planning/campaign-research-queue.md:32`). Unlike R1–R4 and R9 this one verifies a
claim that has **already shipped**. `rfc/archive/resistance-spectrum.md` landed
`practical_resistance` (run schema 0.14, migration 19), whose objective function is
`humanConcessionMass` — the sum of Maia's per-move **policy** mass over the moves a
grounded classifier calls conceding (`packages/runtime/src/practical-difficulty.ts`).
The RFC refused to assert that its Maia input is pure and delivered determinism
**by record** instead: *"the metric's Maia input is not provably pure, and this RFC does
not pretend it is"* (`rfc/archive/resistance-spectrum.md:546-547`). Its acceptance
criterion 5 (`:945-950`) therefore **measures** stability rather than assuming it, at
n = 20, *"whichever way it comes out"*. R4 recorded 60/60 byte-identical repeat pairs at
n = 2 and explicitly declined to call it a discharge
(`design/research/practical-difficulty-outside-tablebase.md:462-464`).

**What this dossier does.** It runs the 20-repeat probe across a spread of positions and
bands, isolates what varies, and follows the variation through to the shipped feature.
The instrument is `tools/r5-maia-stability-harness/` (disposable), which drives the
repo's own `EngineSupervisor`, `maiaDockerSpec`, `OpponentSelector` and
`LichessTablebaseSource` by relative import; `probe-repeat.ts` reproduces
`OpponentSelector #maia` (`apps/server/src/opponent-selector.ts:469-499`) command for
command. No second UCI integration exists here.

---

## 1. Verdict

**Yes — the policy scalar is bit-stable, and that is the least interesting thing this
measurement found.**

Five findings, in the order that matters:

1. **The 20-repeat probe passes without exception.** Over **2,100 probes** — 35 positions
   (opening / middlegame / endgame / cross-phase, both colours, 3–32 pieces, 1–48 legal
   moves, 0–56 plies of history) × bands **1100 / 1500 / 1900** × 20 repeats, zero errors —
   **105 of 105 keys returned a byte-identical `info` block on all 20 repeats** `[V]`.
   Candidate set, candidate order, rank vector, policy vector, policy sum and
   argmax-of-policy were identical on 105/105. Maximum absolute drift **0.0**, maximum
   relative drift **0.0**. §3.

2. **What varies is the `bestmove`, not the policy — and one shipped mode plays the
   `bestmove`.** On the same 2,100 probes the engine's returned `bestmove` was identical
   across 20 repeats on only **36/105 keys (34.3%)**, or **30/99 (30.3%)** once the six
   forced-move keys are removed; the median key returned **3 distinct** bestmoves in 20
   repeats and the worst returned **8**, with the modal move taking a median **65%** share
   `[V]`. `#humanCommon` selects `bestMove(result.lines)`
   (`opponent-selector.ts:502-509`), so **`human_common` is not reproducible** — for a
   reason the RFC never named, since it hedged about the *policy head*. §4.

3. **The by-record determinism is doing real work, and for the other mode.** Read
   plainly: for `practical_resistance` it is belt-and-braces — the objective is a sum and
   an argmax over byte-identical scalars with a fixed summation order, and end-to-end
   repeats through the shipped selector confirm it (§6). For `human_common` — the default
   opponent, and `theory_strict`'s off-spine fallback — the record is the **only** thing
   standing between a rewind and a different opponent move. §7.

4. **`practical_resistance` is broken against the real engine, deterministically.** Over
   **800 end-to-end selections** through the shipped `OpponentSelector` (40 in-range roots
   × 20 repeats, band 1500), **30 of 40 roots (75%) threw an unhandled `TypeError` on all
   20 repeats**, e.g. `measured policy mass cannot exceed 1; received 1.0000000222065422` —
   which `errorResponse` maps to **HTTP 500 `INTERNAL_ERROR`** with an
   `UNHANDLED_SERVER_ERROR` log (`apps/server/src/rest.ts:427-440`) `[V]`. The cause is
   arithmetic, not chess: `humanConcessionMass` guards `measuredMass > 1 + 1e-9`
   (`practical-difficulty.ts:32-34`) while a real float32 softmax over a full legal-move
   set sums to 1 ± ~1e-7. Measured incidence of the overflow itself: **19 of 39 (48.7%)**
   of arm-A keys whose position has ≤ 20 legal moves — i.e. exactly the endgames the mode
   is scoped to — and **0 of 66** where the 20-candidate cap truncates. §8.1.

5. **The Maia path does have a D35-equivalent state carry-over, and `ucinewgame` would
   not fix it.** `#maia` emits `setoption name Elo` only when `policy.targetElo` is
   defined (`opponent-selector.ts:474-480`). A UCI option persists in the process; the
   supervisor keeps one long-lived process. Measured on 6 targets in 6 fresh containers:
   after a **different** position was probed at band 1100, the target probed with no
   `Elo` returned the band-1100 policy vector byte-for-byte, **6/6**; at 1900, **6/6**;
   with no `Elo` ever sent, the advertised default 1500, **6/6** `[V]`. Reproduced through
   the shipped `OpponentSelector`, where the resulting selection records
   `eloApplied` **absent** — which the RFC defines as *"this selection was not
   band-calibrated"* (`rfc/archive/resistance-spectrum.md:507`) — while it was calibrated
   at someone else's band. §9.

**One-sentence answer to R5:** *Yes — Maia's policy scalar is bit-identical across
repeats, bands, request orders, process instances and MultiPV widths, so
`humanConcessionMass` is exactly reproducible; the instability is in the engine's sampled
`bestmove`, which `human_common` plays, and the shipped `practical_resistance` consumer
fails for an unrelated arithmetic reason on 75% of its own domain.*

---

## 2. Method

**Instrument.** `tools/r5-maia-stability-harness/` (disposable, tied to R5, logged). Image
`chess-tabiya-maia:1e13597`; identity recorded on every arm as
`Maia3 / 1e13597c42d4858b7cfd7cfdae01e297263364b2 /
maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, `seedHonored: false`,
`eloHonored: true` `[V]`.

**Position set.** `tools/r4-difficulty-harness/extract.ts` over `content/drafts` yields
510 unique decision positions from 37 packs; `select.ts` stratifies them by
phase × side-to-move × piece-count bucket and takes 2 per cell deterministically →
**35 positions across 19 cells**, piece counts 3–32, legal-move counts 1–48, history
0–56 plies `[V]`.

**Byte-identity means bytes.** Each probe stores the raw `policy` **token text** per
candidate plus a SHA-256 of the whole `info` block. The patch emits `:.12g`
(`workers/maia/patches/maia3-uci-policy-mass.patch:9`) — 12 significant digits, more than
the 9 a float32 needs to round-trip, so identical text implies an identical float32
value `[M]`.

**Arms.**

| Arm | Shape | Probes |
|---|---|---:|
| A | 35 positions × 1100/1500/1900 × 20 repeats, blocked, MultiPV `max(8, legal)` — `practical_resistance`'s request width | 2,100 |
| B | same 35, band 1500, **round-robin** order, **fresh container** | 700 |
| C | same 35, band 1500, **MultiPV 8** — `#humanCommon`'s request width | 700 |
| D | same 35, band 1500, **Temperature 0** — diagnostic, not a shipped configuration | 700 |
| Carry-over | 6 targets × 10 probes, one fresh container per target | 60 |
| Selection (narrow / wide) | shipped `OpponentSelector`, `practical_resistance`, band 1500, fresh selector per repeat, shared tablebase source: 7 roots × 20 and 40 roots × 20 | 940 selections |

The selection arms share one `EngineSupervisor` and one `LichessTablebaseSource` across
repeats — tablebase positives never expire (`docs/tablebase-grounding.md:43`), so the
tablebase input is constant — and build a **fresh** `OpponentSelector` per repeat so the
shipped in-process selection cache (`opponent-selector.ts:392-402`) cannot answer. The
only varying input is Maia.

**Mechanism was read, not inferred.** All source references below are to
`/usr/local/lib/python3.12/site-packages/maia3/uci.py` inside the pinned image `[V]`.

---

## 3. The 20-repeat probe (arm A) — acceptance criterion 5, discharged

2,100 probes, **0 errors**, 105 keys × 20 repeats.

| Property, held identical across all 20 repeats | Keys |
|---|---|
| Whole `info` block, byte-for-byte | **105/105 (100%)** |
| Candidate **set** | 105/105 |
| Candidate **order** (emission order) | 105/105 |
| **Rank** vector (`multipv` per move) | 105/105 |
| **Policy vector** (move → raw token) | 105/105 |
| Policy **sum** | 105/105 |
| **Argmax** of policy | 105/105 |
| `bestmove` | **36/105 (34.3%)** |

Maximum absolute policy drift over all keys: **0.0**. Maximum relative drift: **0.0**
`[V]`. Every candidate on every probe carried a policy scalar (0/105 keys with a missing
scalar), reproducing R4's 120/120 availability finding at 30× the sample.

Three corroborations fall out of the same data `[V]`:

- **The 20-candidate cap is a declared option bound, not an observed accident.**
  `candidateCount == min(20, legalCount)` on **105/105** keys, and the handshake advertises
  `option name MultiPV type spin default 5 min 1 max 20` (`uci.py:369`, with
  `clamp_multipv` at `:213`). R4 §8's empirical cap now has its mechanism.
- **Absent mass, re-measured.** Policy sum over the returned candidates: median
  **0.999625**, minimum **0.979540** — slightly worse in the tail than R4's 98.91% worst
  case, on a wider position set.
- **`Elo` is effective, not merely advertised.** All **35/35** positions returned three
  *distinct* policy vectors across bands 1100/1500/1900.

Incidental: median per-key latency **367.8 ms** at these widths (arm B, on an unloaded
host, **202.8 ms**). This is above `docs/engine-workers.md:232-234`'s 53 ms at MultiPV 8
and above R4's 133–167 ms; all three are single-host readings under different load and
this dossier makes no latency claim.

---

## 4. What varies: the sampler, and only the sampler

The reported `policy` and the returned `bestmove` come from two different lines of the
pinned engine `[V]`:

```
idx = sample_from_logits(logits, self.temperature, self.top_p)   # uci.py:322 -> bestmove
probs = torch.softmax(logits, dim=-1)                            # uci.py:325 -> policy
```

`policy` is the raw legal-masked softmax; it is **not** temperature- or top-p-adjusted.
`sample_from_logits` (`:163-183`) returns `argmax` when `temperature <= 0`, and otherwise
draws with `torch.multinomial(...)` **with no generator argument** — torch's
process-global RNG. The engine advertises only `Elo`, `SelfElo`, `OppoElo`, `Temperature`,
`TopP` and `MultiPV` (`uci.py:360-370`, confirmed by live handshake) — no seed option, so
nothing reseeds it.

Three measurements confirm the mechanism end to end `[V]`:

- **Arm D (Temperature 0, 700 probes).** `bestmove` identical on **35/35** keys, and equal
  to the top-policy move on 35/35. Policy still byte-identical 35/35. The sampler is the
  whole of the variation.
- **Arm A distribution.** Distinct bestmoves in 20 repeats, over all 105 keys: 1 (36 keys,
  6 of which are forced-move positions), 2 (11), 3 (24), 4 (10), 5 (11), 6 (7), 7 (3),
  8 (3). Modal share median
  **0.65**; the modal move is the top-policy move on **87/105 (82.9%)** of keys —
  consistent with sampling from a top-p-truncated distribution rather than with noise.
- **Band effect on stability.** Bestmove stable on 9/33 non-forced keys at band 1100,
  10/33 at 1500, 11/33 at 1900 (mean distinct 3.42 / 3.12 / 2.73) — the higher band is
  more peaked, hence slightly more repeatable. Not a chess claim; a shape-of-distribution
  observation.

**This is by design and it is not a defect.** A human-choice opponent that always played
its modal move would be a different product. The finding is about *reproducibility*, not
about quality.

---

## 5. Controls: order, process, and request width

| Control | Result |
|---|---|
| **Different process instance + different request order** (arm B vs arm A at band 1500) | All **35/35** positions produced the **same** `info` digest in both arms `[V]` |
| **Different MultiPV width** (arm C at 8 vs arm A at `max(8, legal)`, band 1500) | Every shared move's policy token identical: **35/35 positions, 263 shared moves, 0 mismatches** `[V]` |

The first refutes both hidden per-process state and order dependence *in the policy head*:
arm B is a separate container and interleaves every other key between repeats. The second
matters for the metric — a candidate's policy scalar does not change when the requested
width changes, so `humanConcessionMass` at MultiPV 8 and at MultiPV 20 differ only by
truncation, never by renormalisation. (Mechanically: policy comes from the first forward
pass, whose batch is 1 regardless of `multipv`; `uci.py:311-327`.)

**Scope of the control.** Same image, same host, CPU (`torch 2.13.0`, `cuda` unavailable,
14 intra-op threads, verified in the container). Bit-reproducibility under a different
thread count, a different CPU, or a CUDA device is **not** measured and must not be
assumed `[M]`.

---

## 6. Consequence for `humanConcessionMass`

**Zero. The metric is exactly reproducible, and that is now measured rather than argued.**

`humanConcessionMass` sums `candidate.mass` over an externally supplied conceding set
(`practical-difficulty.ts:22-31`). Its inputs are the policy scalars (byte-identical,
§3) in `candidateLines`' rank-sorted order (rank vector identical, §3), so the IEEE-754
partial sums are bit-identical. The end-to-end arm demonstrates this without needing the
argument: **35 of 35** refusing roots reported a byte-identical error message across all
20 repeats, and 30 of those messages **embed the computed `measuredMass` to 17
significant digits** — e.g. `1.0000000222065422`, twenty times, on four child positions
per root `[V]`. That is a bit-identical float64 sum through the shipped code path.

**How much drift it would take.** On the 5 roots that produced a selection, the argmax
margin — the gap between the winning and runner-up `concessionRatio` — was
**3.1e-05, 9.8e-05, 3.8e-04, 4.98e-03 and 7.98e-02** `[V]`. Since `measuredMass ≈ 1`, a
perturbation of the conceding subtotal smaller than the margin cannot flip the choice.
Measured drift is exactly zero, so the useful comparison is the smallest perturbation the
quantity can even *represent*: one float32 ulp on a scalar of order 0.1–0.5 is ~6e-08,
about **500×** below the tightest observed margin of 3.1e-05 `[M]`. There is no drift
regime between "bit-identical" and "large enough to change the played move". For
comparison, a naive argmax over the policy itself would need half the top1−top2 gap,
whose minimum over 99 arm-A keys is **3.33e-04** (p10 0.031, median 0.190).

**A substantive observation about the objective, not about stability.** Those winning
ratios are **0.0003 to 0.083**. The "annoying" opponent is discriminating between replies
after which the learner has well under 1% of policy mass on a class-changing move. The
objective is real and the argmax is decided by small differences between small numbers —
which is precisely why scalar determinism is load-bearing and why the by-record fallback
would have been an uncomfortable place to stand had the answer gone the other way.

---

## 7. Consequence for move selection, mode by mode

| Mode | Where the move comes from | Reproducible? |
|---|---|---|
| `human_common` | Maia's own sampled `bestmove` (`opponent-selector.ts:502-504`) | **No** — 30/99 non-forced keys stable across 20 repeats `[V]` |
| `theory_strict` (on spine) | `sampleWeighted` over the masses, keyed on `(seed, historyHash)` (`:551`) | **Yes**, given §3 — a pure function of byte-identical masses |
| `theory_strict` (off spine) | falls through to `#humanCommon` (`:530-536`) | **No**, inherits the row above |
| `practical_resistance` | argmax over `concessionRatio`, lexicographic tie-break (`:645-648`) | **Yes** — 5/5 selecting roots gave the identical move and the identical ratio vector on 20/20 repeats `[V]` |
| `perfect_tablebase` | pure DTZ/UCI ordering | Yes, unchanged |
| `strong_engine` | `go movetime` with a carried hash | No — D35, already measured by R4 |

**So, plainly: is determinism-by-record doing real work or is it belt-and-braces?**
Both, and the RFC guessed the wrong mode. For `practical_resistance` — the mode §4b was
written to protect — the record is **belt-and-braces**: the objective is deterministic by
construction given §3, and a follow-up could promote it. For `human_common` — which the
RFC did not discuss under §4b at all — the selection cache and the logged selection are
**the only mechanism** producing a repeatable opponent, and they are load-bearing exactly
as written. The honest disposition is not "promote `practical_resistance` and move on";
it is "the hedge was right, the reason was wrong, and the mode that needs it is the
default one."

The record does hold where it is claimed to `[V]`: replay never recomputes.
`opponentMovesFromEvents` reads `event.data.selection` from the log and throws
`opponent commit has no authoritative selection` if a commit is not immediately preceded
by its selection event (`packages/runtime/src/replay.ts:68-83`). No engine call exists on
that path. The in-process cache key is
`(policyConfigDigest, packId, seed, historyHash)` (`opponent-selector.ts:183-187`);
`docs/engine-workers.md:137` still states it without `packId` — stale by one field.

---

## 8. Two shipped defects in `practical_resistance`, found while measuring

### 8.1 `humanConcessionMass`'s tolerance rejects a real softmax → HTTP 500

`practical-difficulty.ts:32-34` throws a `TypeError` when `measuredMass > 1 + 1e-9`. Maia
returns a float32 softmax over the legal moves; when the position has **≤ 20 legal moves**
the 20-candidate cap does not truncate anything and the sum is the whole distribution,
1 ± ~1e-7. Measured on arm A `[V]`:

- keys whose position has ≤ 20 legal moves: **39**; of those, **19 (48.7%)** sum above
  `1 + 1e-9`, maximum excess **9.25e-08** (the excess is symmetric about 1: the smallest
  observed deficit is −1.45e-07);
- keys whose position has > 20 legal moves: **66**; **0** exceed, because truncation
  guarantees a strict shortfall.

A selection measures up to four child positions (`opponent-selector.ts:591-636`), so one
overflowing child is enough. End-to-end, 40 in-range roots × 20 repeats `[V]`:

| Outcome, identical on all 20 repeats | Roots |
|---|---|
| `TypeError` → **HTTP 500 `INTERNAL_ERROR`** | **30/40 (75%)** |
| `PRACTICAL_RESISTANCE_UNDECIDABLE` (correct, named) | 5/40 |
| A selection | 5/40 |

The mode's whole refusal architecture — `PRACTICAL_RESISTANCE_OUT_OF_RANGE`,
`_UNAVAILABLE`, `_UNDECIDABLE` — never gets a turn on three quarters of its own domain.

**Why the suite is green.** Every fixture mass in `opponent-selector.test.ts` is a hand-written
decimal summing to ≤ 1 exactly (`:158-159, :189-190, :301-302, :404-405, :442-443,
:471-472`), and the unit test's own vector sums to 0.95
(`practical-difficulty.test.ts:9-18`). The boundary the guard defends has never been
exercised by a real distribution. This is the same failure shape as D35: a property
asserted about an engine and tested against a fixture that cannot exhibit it.

**Not a specification error.** §1d is explicit that mass outside the returned set is
*unmeasured, not zero*, and the guard's intent — a sum of probabilities cannot exceed 1 —
is right. The tolerance is wrong by about two orders of magnitude for a float32 source.

### 8.2 One abstaining candidate disables the vacuity refusal

```ts
const measured = scored.filter((candidate) => candidate.ratio !== null);
if (measured.length === scored.length && measured.every((candidate) => candidate.ratio === 0)) {
  throw new ServerError("PRACTICAL_RESISTANCE_UNDECIDABLE", "No category-preserving reply leaves measured concession mass");
}
```
(`opponent-selector.ts:638-641`, verbatim)

The gate requires **every** candidate to be measured. If one child position is terminal —
Maia's `score_moves` returns an empty list for a finished game (`uci.py:300-301`), so
`candidateLines` is empty and `humanConcessionMass` abstains with `null`
(`practical-difficulty.ts:21`) — the gate is skipped even when every *measured* ratio is
zero. Control then falls to the sort at `:645-646`, all ratios tie at 0, and the
lexicographic tie-break picks the move.

Observed once, at `7k/4B3/6KN/8/8/8/8/8 w - - 38 20`, on **20/20 repeats** `[V]`:
candidates `e7f6` (abstained, no `concessionRatio`), `g6f5`, `g6f6`, `g6f7` (all
`concessionRatio: 0`); selected **`g6f5`** — the lexicographically least. That is
*"play the alphabetically first legal reply"* under the name `practical_resistance`,
which is verbatim the degradation §2b step 4 was written to prevent
(`rfc/archive/resistance-spectrum.md:319-322`). n = 1 in 47 roots probed, but the code
path is unconditional, so the rate is a function of how often a category-preserving reply
ends the game.

---

## 9. The D35 analogue in the Maia path

D35 is `strong_engine` carrying a transposition table because no `ucinewgame`/`Clear Hash`
is sent (measured by R4 at 83.8% of evaluations changed). Nobody had looked at Maia. There
are **two** carry-overs, neither of which `ucinewgame` would fix — `cmd_ucinewgame` resets
the board and history only, and the options and the RNG survive it (`uci.py:399`) `[V]`.

**(a) The `Elo` option persists, and the record does not say so.** `#maia` emits
`setoption name Elo` only when `policy.targetElo` is defined *and* the engine advertises
the option (`opponent-selector.ts:474-480`); `cmd_setoption` writes `self_elo` and
`oppo_elo` onto the engine object, where they stay until overwritten (`uci.py:383-386`).
Measured on 6 targets, one fresh container each `[V]`:

| Probe | Result |
|---|---|
| Target with **no** `Elo` ever sent | == the target's **band-1500** digest, **6/6** (1500 is the advertised default) |
| Setter position probed at 1100, then target with **no** `Elo` | == the target's **band-1100** digest, **6/6** |
| Setter probed at 1900, then target with **no** `Elo` | == the target's **band-1900** digest, **6/6** |
| Setter probed at 1100, then target **with** `Elo 1900` | == the target's band-1900 digest, **6/6** (the guard works when the option is sent) |

Reproduced through the shipped `OpponentSelector` (`out/elo-record.json`): the no-`Elo`
selection's candidate masses are byte-equal to the leaked band's, and the recorded
identity carries `eloHonored: true` with **`eloApplied` absent** — which
`rfc/archive/resistance-spectrum.md:507` defines as *"this selection was not
band-calibrated"*. The honesty field is wrong by omission `[V]`.

**Reachability.** No committed pack currently triggers it: **35/35** Maia-backed packs in
`content/drafts` + `content/packs` declare `targetElo` `[V]`. But it is a *latent* defect,
not an impossible one — `schemas/drill_pack.schema.json` `$defs/opponentPolicy` requires
only `mode`, and `POST /runs` accepts a position session with
`opponentPolicy: {mode: "human_common"}` and no `targetElo`
(`apps/server/src/rest.ts:315-336`). One such request, and every subsequent Elo-less
request in that server process inherits the last band anyone asked for.

**(b) The sampler's RNG is process-global.** `torch.multinomial` is called with no
generator (`uci.py:180, :183`), so the `bestmove` stream is a function of how many samples
the process has already drawn. This is invisible in the policy — arms A and B prove the
policy is independent of process and order (§5) — but it means `human_common`'s
nondeterminism is not merely per-call randomness: it is *order-* and *process-*dependent
state, the same class of hazard as D35's hash, on a different mechanism.

**(c) A smaller one, for completeness.** In arm C (MultiPV 8, `#humanCommon`'s shape),
**1 probe in 700** returned a `bestmove` that was **not** among the 8 recorded candidates
`[V]` — top-p sampling can reach outside the recorded window. The persisted
`opponent.move_selected.selection` then contains a candidate list that omits the move that
was played, which is an auditability hole in exactly the record §4b relies on. At arm A's
widths (`max(8, legal)`, capped at 20) it happened **0 times in 2,100**.

---

## 10. What this changes

**For `rfc/archive/resistance-spectrum.md` open question 1** — *"Is Maia's policy head
reproducible across identical requests?"* — the answer is **yes**, at n = 20 across 35
positions, 3 bands, 2 process instances, 2 request orders and 2 MultiPV widths. The RFC's
stated consequence (*"a follow-up can promote `practical_resistance` to
determinism-by-construction and record `seedHonored: true`"*, `:995-996`) is now earned on
its first half and must be refused on its second: `seedHonored` is an **engine identity**
field shared by every mode on that engine, and `human_common` on the same engine is
demonstrably not seed-honoring. Promoting the *mode* is sound; flipping the *identity
flag* would make the record less true, not more.

**Proposed ledger rows** (this dossier may not write `design/BACKLOG.md`; claude lands
them):

| # | Row | Kind |
|---|---|---|
| 1 | `humanConcessionMass`'s `1 + 1e-9` tolerance rejects a real float32 softmax → `practical_resistance` returns **HTTP 500 on 75% of in-range roots**, measured; fixture masses cannot exhibit it | 🐞 defect, high |
| 2 | The vacuity gate requires *all* candidates measured, so one terminal child lets `practical_resistance` play the alphabetically-first reply under its own name — the degradation §2b step 4 forbids | 🐞 defect |
| 3 | Maia `Elo` carry-over: an Elo-less request inherits the previous request's band (6/6 measured) and records `eloApplied` absent, i.e. "not band-calibrated", while calibrated at another band. Latent today (35/35 packs declare `targetElo`), reachable via `POST /runs` and the pack schema | 🐞 defect, the D35 analogue |
| 4 | `human_common` may record a candidate list that omits the played move (1/700 at MultiPV 8) — top-p can sample outside the recorded window | 🐞 defect, minor |
| 5 | `docs/engine-workers.md:137` states the selection cache key without `packId` | 📝 doc drift |
| 6 | R5 answered: policy bit-stable, `bestmove` sampled; determinism-by-record is load-bearing for `human_common`, belt-and-braces for `practical_resistance` | ✅ ledger row "Maia policy-scalar stability is unmeasured" (`design/BACKLOG.md:260`) needs its framing corrected — the shipped n=20 probe covered **one** position at **one** band and its ✅ reads as "Maia is stable", which is true of the policy and false of the move |

**No kill-criterion evidence.** R5 is an instrument-stability question and the instrument
is stable. The §8 and §9 defects are implementation defects in shipped consumers, not evidence
against the thesis; they belong in the ledger and the log, not in `gates.md`.

---

## 11. Limits

1. **One host, one image, CPU.** All bit-identity claims hold for
   `chess-tabiya-maia:1e13597` on this machine (torch 2.13.0, CPU, 14 intra-op threads).
   Reduction order in a parallel softmax/matmul can depend on thread count; a deployment
   with a different core count or a CUDA device is **unmeasured** `[M]`.
2. **Resolution.** "Byte-identical" is 12 significant digits of a float32; that is finer
   than a float32 round-trip needs, so the claim is bit-identity — but it is an inference
   about the rendering, not an inspection of the tensor `[M]`.
3. **20 repeats is 20 repeats.** A drift with period > 20 requests per key, or one
   triggered by a state this harness never reached (long uptime, memory pressure, a
   restarted container mid-run), would not show. The supervisor restart path was not
   exercised.
4. **Three bands, one temperature.** Bands 1100/1500/1900 at Temperature 0.8 / TopP 0.92
   (production defaults). Other bands are unmeasured; §3's band-separation result says
   only that these three differ.
5. **The end-to-end selection arm is in-range only**, by construction — the mode refuses
   above seven pieces. 47 roots total across both selection arms.
6. **The 1/700 off-list `bestmove`** is a single observation; its rate is not established.

---

## 12. Reproducing

`tools/r5-maia-stability-harness/README.md` has the exact commands. Summary artifacts are
in `tools/r5-maia-stability-harness/out/`: `stability-summary.json` (all four arms, per-key),
`carryover.json`, `elo-record.json`, `selection-summary.json`. The per-probe JSONL is
regenerable from the committed pack corpus and is not kept.
