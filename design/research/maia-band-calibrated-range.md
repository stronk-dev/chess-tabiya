# Maia's band-calibrated `Elo` range — the R10 verdict

**Question:** R10, *"Over what `Elo` range does Maia actually behave as a band-calibrated
human model, and where does it stop?"* Raised by `design/BACKLOG.md:126` (**D60**,
*"`targetElo` is an unbounded integer"*) and sharpened by `design/BACKLOG.md:114`
(**D70**): `rfc/engine-request-contract.md` §9 ships the *mechanism* for a published
range and a named refusal, but the only bound the instrument itself offers is
`option name Elo type spin default 1500 min 0 max 5000`
(`tools/r4-difficulty-harness/out/maia-availability.json:11`) `[V]` — a UCI spin
formality that **rejects 9000 and accepts 50**, which is D60's own counterexample.
Owner ruling, 2026-08-15: research it rather than configure a number from the repo's
three tested bands — ***"three samples are not a boundary."*** Law 8 forbids the RFC,
its reviewer and claude from asserting Maia's real band from memory, so it had to be
measured.

**What this dossier does.** It sweeps the requested band across `[0, 5000]` and beyond
on a fixed position set, states in advance what "band-calibrated" is going to mean and
why, reports both edges with the evidence for each, reports what the engine does outside
them, and recommends a publishable **deployment bound for this image and this model** —
not a claim about Maia in general, and not a claim about how well the model plays
anywhere inside it.

**Instrument.** `tools/r10-maia-band-range-harness/` (disposable), which drives the
repo's own `EngineSupervisor` (`apps/server/src/engine-supervisor.ts`) and
`maiaDockerSpec` (`apps/server/src/maia.ts`) by relative import and reproduces
`OpponentSelector#maia` (`apps/server/src/opponent-selector.ts:469-499`) command for
command. No second UCI integration exists here; R4's position extractor
(`tools/r4-difficulty-harness/extract.ts`) and R5's stratifier
(`tools/r5-maia-stability-harness/select.ts`) are reused verbatim. Engine identity as
reported by the shipped handshake: `maia-5m` / `Maia3` /
`1e13597c42d4858b7cfd7cfdae01e297263364b2` /
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, `eloHonored: true`,
`seedHonored: false` `[V]`
(`tools/r10-maia-band-range-harness/out/band-sweep-summary.json`, `identity`).

---

## 1. Verdict

**The boundary is not where the output stops changing — the output never stops changing
inside `[0, 5000]` and never changes outside it.** Both edges are somewhere else, and
they are set by two different failures.

Six findings, in the order that matters:

1. **Outside `[0, 5000]` the requested band is silently discarded, exactly.** Eleven
   out-of-range values — `-1000000, -5000, -1000, -100, -1, 5001, 5100, 5500, 9000,
   50000, 1000000` — returned an `info` block **byte-identical** to the clamped endpoint
   on **51 of 51 positions each**, total-variation distance exactly **0.0** `[V]`. A run
   asking for **9000 gets 5000**; a run asking for **−1000 gets 0**. The engine never
   errors and never says so. §4.

2. **Inside `[0, 5000]` the distribution responds everywhere, including 10 Elo from
   either endpoint.** All **50** adjacent 100-Elo steps changed the distribution on
   **50 of 50** non-forced positions (§3's one single-legal-move position is 1.0 by
   construction at every band). At 10-Elo resolution over `[0, 400]` and `[4600, 5000]`,
   **320 of 320** and **320 of 320** step-position pairs changed, minimum TV **0.0032**
   and **0.00086** `[V]`. *Distinguishable adjacent bands* — the obvious
   operationalisation — is therefore satisfied over the **entire advertised range** and
   is not the boundary. §5.

3. **The response is not *ordered* above ≈2400: the trajectory doubles back.** Median
   TV from band 0 peaks at **2500** and then *falls*, to **0.409** at band 5000 versus
   **0.702** at 2500; the per-position peak has median **2600** (p25 **2100**) `[V]`.
   Band 5000 and band 0 — 5000 points apart — are **closer to each other** than either is
   to 2500, on all three measures: TV **0.409** vs 0.702 / 0.787, Spearman **0.303** vs
   0.238 / 0.077, argmax agreement **0.33** vs 0.24 / 0.22. §6.

4. **The candidate list stops carrying the distribution below ≈800 and above ≈3500.**
   Over the 32 positions where the engine's 20-candidate cap actually bites, the median
   listed policy mass is **0.833 at band 0**, **0.990 at 800**, **0.99985 at 2500-2700**,
   **0.981 at 3600**, **0.789 at 5000** `[V]`. The shipped consumer renormalises over
   that list (`opponent-selector.ts:641-643`), so outside `[800, 3500]` it is
   renormalising away more than 1% of the distribution it never saw. §7.

5. **The mechanism, read out of the pinned image, predicts all of it.** `interpolate_elo`
   (`/opt/maia3/maia3/models.py:337-348` in `chess-tabiya-maia:1e13597`) clamps the
   request to `[0, 5000]` and returns `(e/5000)·v₁ + (1 − e/5000)·v₂` over **two**
   learned vectors (`nn.Embedding(1, dim_emb)` each, `:295-296`) `[V]`. The conditioning
   is one straight line segment, linear and injective in the request inside the range and
   **constant outside**. There is no per-band embedding table and nothing in the artifact
   marks where its training data lay. §8.

6. **Recommended publishable bound: `bandRange = { min: 1000, max: 2400 }`** — the widest
   interval on the probed grid that is strictly ordered *and* readable, derived in §11.
   It refuses **nothing that exists**: all **63** `targetElo` declarations in `content/`
   lie in **1100-1939** `[V]`, and the repo's own emitter clamp `[1100, 2000]`
   (`apps/server/src/sourcing/position-seeds.ts:172`) sits strictly inside it. It refuses
   **50** and **9000** — D60's two named values.

**This dossier makes no claim about play quality at any band.** Every statement below is
about whether the instrument's *output distribution* responds to the *request*, which is
what §2 defines and all that was measured.

---

## 2. What "band-calibrated" means here, and why

Stated before measuring, so the measurement could refute it — and it partly did (§5).

Let `L(p, e)` be the candidate list Maia returns for position `p` at requested band `e`
(hard-capped at 20 by the engine — R4,
`design/research/practical-difficulty-outside-tablebase.md:448-452`), and `pol` the
emitted `policy` scalar. The distance is **total variation over the union of two
candidate lists, an unlisted move scored 0**:

```
TV(e₁, e₂) = ½ · Σ_{m ∈ L(p,e₁) ∪ L(p,e₂)} | pol_{e₁}(m) − pol_{e₂}(m) |
```

reported twice — `tvRaw` on the scalars as emitted, and **`tvRenorm`** after each list is
divided by its own listed sum. Every number quoted below is `tvRenorm` unless said
otherwise, because that is the object the shipped consumer computes on:
`practical_resistance` takes `concedingMass / measuredMass`
(`apps/server/src/opponent-selector.ts:641-643`), i.e. it renormalises over the listed
set. The two agree to three decimals wherever listed mass is near 1 and diverge only at
the extremes, which is the truncation effect and is reported (§7) rather than hidden.

**Why TV.** It bounds, over *every* decision rule a consumer could apply to the candidate
list, how often two bands would produce different behaviour — which is exactly what "the
band changed the opponent" has to mean if it is to mean anything mechanical. It is
bounded in `[0, 1]`, needs no distributional assumption, and is defined on distributions
with different supports. **And it has no noise floor here:** R5 measured the emitted
policy scalar as byte-identical across 20 repeats, two containers, two request orders and
two MultiPV widths — 105/105 keys, maximum drift **0.0**
(`design/research/maia-policy-scalar-stability.md:37-40`) `[V]` — so **any** TV > 0
between two grid points is signal, and no repeats were collected here.

**Band-calibrated at `e`** is then three measured properties:

| Leg | Statement | Fails when | Found edge |
|---|---|---|---|
| **1. Resolved** | The distribution at `e` differs from the distribution at the neighbouring probed bands | The request stops reaching the model at all | none inside `[0, 5000]`; total outside |
| **2. Ordered** | Distance grows with band separation: for every pair inside the published range, a wider gap is a longer distance | Two requests far apart are answered more alike than a pair closer together — the model no longer resolves the axis the request is on | the **high** edge |
| **3. Readable** | The candidate list the product consumes still carries the distribution: median listed mass ≥ **0.99** | The consumer's renormalisation is extrapolating over more than 1% of a distribution it never saw | the **low** edge |

Leg 2 is the task's proposed monotonicity operationalisation, kept verbatim. Leg 3 is not
a property of the model but of the **model-plus-contract**: it is chosen because it has a
stated consequence in shipped code — the concession ratio `practical_resistance` ranks on
is accurate to within the unlisted mass, so a 0.99 threshold is a ≤1 percentage-point
guarantee on the number the selector sorts by
(`packages/runtime/src/practical-difficulty.ts:32-51`,
`apps/server/src/opponent-selector.ts:641-643`).

**What none of the three is.** None is a statement that the model *plays like* a human of
rating `e`. That question needs human game data and is not answerable from an engine
transcript; ADR-0005 / Law 8 forbids asserting it from model knowledge. The ledger's
own *"trained at bands ≈1100-1900"* (`design/BACKLOG.md:126`, `:254`) is `[M]` — this
dossier neither confirms nor refutes it, and §8 shows the artifact contains no structure
that would record it.

---

## 3. Method and coverage

| | |
|---|---|
| Image | `chess-tabiya-maia:1e13597` — `workers/maia/Dockerfile` pins upstream commit `1e13597c…` and model revision `b6559de2…` |
| Path | `EngineSupervisor` + `maiaDockerSpec`, command shape copied from `OpponentSelector#maia` (`opponent-selector.ts:469-499`) |
| Positions | **51**, from the **37** packs in `content/drafts` (510 unique decision positions) stratified 3 per cell over 19 cells of phase × side-to-move × piece bucket |
| Coverage | endgame 19 / cross-phase 18 / middlegame 7 / opening 7; **27** white to move, **24** black; **3-32** pieces; **1-47** legal moves; **32** with >20 legal moves |
| Grid | **68** points: uniform 0-5000 step 100 (51), plus 25/50/75 and 4925/4950/4975, plus **11 outside** the advertised range |
| Options | `Elo` sent **explicitly on every probe** (D58 — an `Elo`-less request inherits the previous band, `design/BACKLOG.md:129`); `Temperature 0.8`, `TopP 0.92` (production defaults); `MultiPV 20` everywhere |
| Main sweep | 51 × 68 = **3,468 probes, 0 errors**, median-of-per-band-medians **230.8 ms** (205.1-253.8) |
| Order control | same grid **descending** on 12 positions — **816 probes**, **816/816 byte-identical** to the ascending arm, max TV **0.0** `[V]` |
| Edge resolution | 10-Elo steps over `[0, 400]` and `[4600, 5000]`, 8 positions each — **328 + 328 probes**, 0 errors |
| Malformed values | 5 positions × (4 clean references + 12 two-step sequences) = **140 probes** |
| **Total** | **5,080 probes**, **0 errors** |

`MultiPV 20` is used everywhere because R4 measured the engine's own hard cap at 20 and
R5 measured MultiPV 8 against 20 as bit-identical over the shared moves
(`maia-policy-scalar-stability.md:37-40`); 20 therefore maximises the shared support
without changing any value.

**One position is degenerate by construction and is excluded from per-step counts where
noted:** `5k2/3Q4/8/8/8/8/6K1/8 b - - 7 4` has a single legal move, so its policy is
`1.0` at every band and its TV is 0 at every step `[V]`. It is the sole source of every
`min TV = 0` in the summary.

---

## 4. The low and high stops are hard clamps, and they are silent

Every out-of-range request returns the endpoint's answer **byte for byte**:

| Requested `Elo` | Clamped to | Byte-identical `info` block | max TV |
|---|---|---|---|
| −1000000, −5000, −1000, −100, −1 | **0** | **51 / 51** each | **0.0** |
| 5001, 5100, 5500, **9000**, 50000, 1000000 | **5000** | **51 / 51** each | **0.0** |

`[V]` — `band-sweep-summary.json`, `arms.sweep-asc.clamp`.

Three consequences for `engine-request-contract` §9:

- **The advertised `[0, 5000]` is real as a clamp and empty as a capability claim.** It is
  the interval the model interpolates over (§8), not the interval it was fitted on.
- **A refusal is the only signal that will ever exist.** The engine does not error, warn,
  or report the applied value; the `bestmove` and the whole `info` block for a request at
  9000 are indistinguishable from a request at 5000. Without a server-side bound the run
  record's `eloApplied: 9000` would be *false* and nothing downstream could tell.
- **Malformed values inherit rather than fail.** Priming the engine at 1500 and then
  sending `1500.5`, `2000.0`, `2000.7`, `abc`, an empty value, `2e3`, `0x7d0`, `NaN` or
  `Infinity` leaves the band at **1500** on **5/5 positions each** (`uci.py:383-389`
  wraps `int(value)` in a `try/except ValueError: return`), while `' 2000 '` and `'+2000'`
  are accepted as 2000 and `9007199254740993` clamps to 5000 `[V]`. This is a second
  instance of D58's shape — a silently inherited band — reachable through the *value*
  rather than its absence. **It is not reachable through the shipped server today:** all
  five request boundaries require `Number.isSafeInteger`
  (`rfc/engine-request-contract.md:141-152`), and every safe integer stringifies to plain
  digits. It is recorded because it is the reason the type check may not be relaxed.

---

## 5. Inside the range the model never stops listening — the obvious criterion finds nothing

| Step size | Where | Step-position pairs that changed | Median TV per step | Minimum TV |
|---|---|---|---|---|
| 100 Elo | 0 → 5000, all 50 steps | **2,500 / 2,500** (50 non-forced positions) | 0.012 - 0.113 | 0.0 (the forced position only) |
| 10 Elo | 0 → 400, 40 steps | **320 / 320** | 0.0049 - 0.0152 | **0.0032** |
| 10 Elo | 4600 → 5000, 40 steps | **320 / 320** | 0.0013 - 0.0029 | **0.00086** |

`[V]` — `arms.sweep-asc.adjacent`, `arms.fine-low`, `arms.fine-high`.

**So leg 1 holds over the entire advertised range and fails totally outside it.** A
criterion of the form *"the boundary is where the output stops changing with the request"*
returns the answer `[0, 5000]` — the clamp, and nothing else. Reported as a refutation of
the candidate operationalisation rather than as a result: it is exactly what §8's
mechanism forces, and it is why legs 2 and 3 exist.

Note the shape of the response rate, which is itself informative: the per-100-Elo distance
is **largest at the extremes** (0.113 at 300→400, 0.081 at 3900→4000) and **smallest in
the middle** (0.0141 at 2600→2700, 0.0244 at 1500→1600). The model moves *fastest* where
it is least concentrated.

---

## 6. The high edge — above ≈2400 the trajectory turns around

Median TV from three fixed anchor bands to every grid band `[V]`
(`arms.sweep-asc.anchorCurves`):

| band | from 0 | from 1500 | from 3000 | from 5000 |
|---|---|---|---|---|
| 0 | 0.000 | 0.617 | 0.629 | **0.409** |
| 600 | 0.481 | 0.339 | 0.443 | 0.630 |
| 1000 | 0.560 | 0.141 | 0.343 | 0.683 |
| 1500 | 0.617 | 0.000 | 0.268 | 0.742 |
| 2000 | 0.666 | 0.133 | 0.187 | 0.777 |
| 2400 | 0.702 | 0.221 | 0.138 | **0.793** |
| **2500** | **0.702** | 0.228 | 0.132 | 0.787 |
| 2600 | 0.700 | 0.237 | 0.125 | 0.788 |
| 3000 | 0.629 | 0.254 | 0.000 | 0.741 |
| 3600 | 0.504 | 0.481 | 0.432 | 0.576 |
| 4000 | 0.377 | 0.594 | 0.607 | 0.298 |
| 5000 | **0.409** | 0.742 | 0.741 | 0.000 |

Read the first column: distance from band 0 rises to a peak at **2500** and then falls
back. Read the last: distance from band 5000 peaks at **2400** and falls back. Per
position, the band maximising distance from 0 has median **2600**, p25 **2100**, p75
**3200**; the band maximising distance from 5000 has median **2300**, p25 **1800**
`[V]`.

**The collision, three ways.** TV alone cannot distinguish *"the two ends collapsed onto
the same shape"* from *"both ends are diffuse, so no coordinate carries enough mass for TV
to be large"*. Rank correlation over the shared moves and argmax agreement are scale-free
and settle it `[V]` (`arms.sweep-asc.collisions`):

| band pair | separation | TV | Spearman ρ | argmax agreement |
|---|---|---|---|---|
| **0 vs 5000** | **5000** | **0.409** | **0.303** | **0.33** |
| 0 vs 2500 | 2500 | 0.702 | 0.238 | 0.24 |
| 2500 vs 5000 | 2500 | 0.787 | 0.077 | 0.22 |
| 1000 vs 3000 | 2000 | 0.343 | 0.676 | 0.71 |
| 1100 vs 1900 | 800 | 0.227 | 0.877 | 0.76 |
| 1400 vs 1600 | 200 | 0.054 | 0.984 | 0.96 |

The widest possible pair of requests is answered **more alike** than either is answered
against the middle, on all three. And `1000 vs 3000` — 2000 points apart — is barely more
distant than `1100 vs 1900`, 800 points apart. **The axis compresses above ≈2400 and then
reverses.**

**The interval search.** Searching the 100-Elo grid for the widest interval on which the
median distance grows with separation from *every* band inside it, at **zero** tolerance
`[V]` (`arms.sweep-asc.orderedInterval`):

- largest such interval anywhere: **`[3100, 5000]`** — the far arm, internally ordered but
  built entirely of diffuse distributions (§7);
- largest containing the engine's advertised default 1500: **`[0, 1800]`**;
- with the floor at 1000: **`[1000, 2400]`**.

Tolerance matters and is disclosed: the first violation above 1800 is a decline of
**0.0028** in median TV (the pair `1900↔900`); admitting declines under 0.005 extends the
1500-containing interval to `[0, 2000]`, and under 0.01 to `[0, 2500]`. The genuine
reversal — where the curve peaks rather than merely flattens — is at **2400-2600**.

---

## 7. The low edge — below ≈800 the distribution leaves the window the product reads

Median listed policy mass, over the **32** positions with more than 20 legal moves (where
the engine's 20-candidate cap can bite at all; the other 19 return their whole legal move
set and are trivially 1.0) `[V]` (`arms.sweep-asc.byGroup["legal>20"].perBand`):

| band | 0 | 200 | 400 | 600 | **800** | 1100 | 1500 | 1900 | 2500 | 3200 | **3500** | 3800 | 4400 | 5000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| median listed mass | 0.833 | 0.864 | 0.929 | 0.975 | **0.990** | 0.996 | 0.998 | 0.999 | 0.9999 | 0.9994 | **0.991** | 0.934 | 0.835 | **0.789** |
| median entropy (bits) | 3.99 | 3.88 | 3.70 | 3.19 | 2.88 | 2.71 | 2.49 | 2.04 | 1.36 | 1.74 | — | 3.69 | 4.13 | 4.21 |

Crossings, all contiguous `[V]` (`arms.sweep-asc.massCrossings`, `byGroup`):

| statistic / population | ≥ 0.99 | ≥ 0.999 |
|---|---|---|
| median, 32 truncated positions | **`[800, 3500]`** | `[1800, 3200]` |
| median, all 51 positions | `[600, 3600]` | `[1100, 3400]` |
| p25, 32 truncated positions | `[1100, 3400]` | `[2200, 3000]` |
| minimum, all 51 positions | `[2000, 2900]` | never |

**Consistency with R4.** R4 reported the returned 20 carrying a median **99.99%** of the
mass and a worst case **98.91%** at bands 1100/1500/1900
(`practical-difficulty-outside-tablebase.md:448-452`). This sweep, all 51 positions at
those bands: median **99.90 / 99.96 / 99.98%**, minimum **97.47 / 98.44 / 98.95%** `[V]`.
Same picture on a different position set; R4's three bands all sit inside the readable
window, which is why R4 never saw this edge.

**Why this is the low edge rather than an aesthetic one.** Legs 1 and 2 both survive to
band 0 — the model still resolves 10-Elo differences there (§5) and the distance from
1500 still grows monotonically all the way down (§6's `[0, 1800]`). What fails first at
the bottom is the **contract**: `humanConcessionMass` returns `measuredMass` and the
selector divides by it (`opponent-selector.ts:641-643`), so the unlisted tail is silently
assumed to concede in the same proportion as the listed head. At band 800 that assumption
covers 1% of the distribution; at band 0 it covers **17%**, and the worst single position
**30%**.

---

## 8. The mechanism, read out of the pinned image

Read from `chess-tabiya-maia:1e13597` — the same artifact every probe above ran against
`[V]`:

```python
# /opt/maia3/maia3/models.py:337-348
def interpolate_elo(self, elos):
    upper = 5000
    elos = torch.clamp(elos, 0, upper)
    weight_low  = elos / upper
    weight_high = 1 - weight_low
    elo_emb_low  = self.elo_embedding_low(torch.zeros_like(elos, dtype=torch.long))
    elo_emb_high = self.elo_embedding_high(torch.zeros_like(elos, dtype=torch.long))
    return weight_low.unsqueeze(1) * elo_emb_low + weight_high.unsqueeze(1) * elo_emb_high
```

with `self.elo_embedding_low = nn.Embedding(1, cfg.dim_emb)` and the same for `_high`
(`:295-296`) — **two** learned vectors, not a table of bands. `uci.py:383-389` assigns
`int(value)` to `self_elo`/`oppo_elo` with no range check, `:312-316` passes them
straight into `model(tokens, self_elos, oppo_elos)`, and the advertisement at `:364-366`
prints the same literal `5000` that the clamp uses.

So the whole `Elo` axis of this model is **one straight line segment** between two fixed
points in embedding space, parameterised linearly by `e / 5000`. That is a complete
explanation of §4 and §5: the conditioning input is injective in the request inside the
range, so the output can never stop changing there; it is constant outside, so the output
can never change there. **`min 0 max 5000` is the interpolation domain, not a training
claim** — and the artifact contains no structure that records where the training data
lay, which is precisely why §2's legs are behavioural.

Two further consequences worth carrying into the RFC:

- `Elo`, `SelfElo` and `OppoElo` are three separate scalars (`uci.py:383-389`); the
  shipped path sets only `Elo`, which writes both. Any future use of the asymmetric pair
  inherits the same clamp and the same silent-inheritance behaviour.
- `interpolate_elo` is applied identically to the candidate re-evaluation pass
  (`uci.py:343-351`), so the band conditions the whole returned list, not only the
  `bestmove`.

---

## 9. Both edges, stated

| | Low edge | High edge |
|---|---|---|
| **Where** | **800 - 1000** | **2400 - 2600** |
| **Which leg fails** | **3, readable** — the ≤20-move candidate list stops carrying the distribution the consumer renormalises over | **2, ordered** — the band→distribution trajectory peaks and turns back toward the opposite endpoint |
| **Evidence** | median listed mass over 32 truncated positions: 0.990 at 800, 0.975 at 600, 0.929 at 400, 0.833 at 0; p25 crosses 0.99 at 1100 | median TV from band 0 peaks at 2500; per-position peak median 2600, p25 2100; zero-tolerance ordered interval from a 1000 floor ends at 2400; from a 0 floor, at 1800 |
| **Which legs still hold there** | 1 and 2 hold to band 0 — the model resolves 10 Elo there (min TV 0.0032) and the zero-tolerance ordered interval containing 1500 reaches band 0 | 3 holds to ≈3500 — median listed mass is still **0.991 at 3500** (0.981 at 3600) |
| **Not the edge** | not leg 1: the request still reaches the model | not leg 3: the list is still readable well above it |

The two edges are **not symmetric**, and neither is where the ledger's `[M]` figure of
"≈1100-1900" sits. The measured readable-and-ordered region is wider at the top and
starts lower at the bottom than that figure — while containing it entirely.

---

## 10. What happens outside the edges

Not collapse, not incoherence — a **smooth, still-resolved march toward a fixed diffuse
endpoint**, followed by exact saturation at the clamp.

1. **Between the edge and the advertised endpoint: ordered diffusion.** Entropy climbs
   from **1.21 bits** at band 2500 to **3.66** at band 0 and **4.13** at band 5000;
   median top-1 mass falls from **0.71** to **0.18** and **0.11**; median listed mass
   falls to **0.833** and **0.789** on truncated positions `[V]`. Every step is still
   resolved (§5) — the model is answering a different question, not refusing to answer.

2. **The two endpoints resemble each other.** TV(0, 5000) = **0.409** against
   TV(0, 2500) = 0.702 and TV(2500, 5000) = 0.787; ρ(0, 5000) = **0.303**, the highest of
   the three; argmax agreement **0.33**, also the highest `[V]`. So the far end of the
   axis does not saturate at "the strongest band the model knows" — it returns toward the
   same near-uniform shape the bottom produces. This is the sentence a refusal message can
   safely carry: *outside the published range the returned distribution flattens toward
   the same shape at both ends.*

3. **Past the advertised endpoints: exact saturation.** 51/51 byte-identical at every one
   of eleven out-of-range values, TV exactly 0.0 (§4). Nothing drifts.

4. **No hysteresis and no drift with request order.** The descending control arm
   reproduced the ascending arm on **816 / 816** shared keys, byte for byte, max TV
   **0.0** `[V]`. Combined with R5's bit-identical repeats, the whole surface is a
   function of `(position, band)` alone.

---

## 11. Recommended publishable bound

**`EngineSpec.bandRange = { min: 1000, max: 2400 }`** — a **measured deployment bound for
`chess-tabiya-maia:1e13597` running `maia3-5m@b6559de2…`**, not a claim about Maia.

**Derivation, mechanical** (`arms.sweep-asc.recommendation`, reproducible from the
committed summary): the widest interval on the 100-Elo grid that is **strictly ordered**
(leg 2, zero tolerance) with **both endpoints inside the readable window** (leg 3, median
listed mass ≥ 0.99 over the 32 truncated positions = `[800, 3500]`). The ranked result is
**`[1000, 2400]`** (width 1400), then `[1000, 2300]`, `[1100, 2400]`, `[1400, 2700]`,
`[1800, 3100]` (width 1300 each) `[V]`.

**Under `engine-request-contract` §9 this is `configured`**, intersected with the
engine's `advertised` `[0, 5000]`, giving effective `[1000, 2400]` with
`source: "advertised+configured"` and `advertised` published verbatim beside it. §9's
mechanism needs no change; it needs this number and this justification.

**Sensitivity, disclosed.** The bound moves with the ordering tolerance: at a 0.005
tolerance the maximiser is `[1300, 3000]`, at 0.01 it is `[800, 2500]` / `[1300, 3000]`
`[V]`. `[1000, 2400]` is the **strictest** reading. Every tolerance puts the ceiling in
2400-3000 and the floor in 800-1300.

**What it costs and what it buys:**

- It refuses **nothing that exists**. All **63** `targetElo` values declared across
  `content/` fall in **1100-1939** `[V]`, including the `onramp-00008` pack's 1939 that
  `engine-request-contract.md:158-162` flags as already outside the repo's own authoring
  clamp. The emitter clamp `[1100, 2000]` (`position-seeds.ts:172`) is strictly inside it,
  and that file's disclaimer — *"an authoring convention, not a Maia capability claim"* —
  can now cite a measurement instead of standing alone.
- It refuses **50** and **9000**, the two values D60 names, for two different measured
  reasons: at 50 the top-20 window carries ~84% of the distribution the selector
  renormalises over; at 9000 the engine silently answers as 5000, so the run record would
  otherwise persist a band that was never applied.
- It does **not** claim the model plays like a 1000- or a 2400-rated human anywhere. If a
  surface wants to render the range as a skill scale, that is a separate question with a
  separate evidence bar, and this dossier does not clear it.

**Re-measure when the image or the checkpoint changes.** The bound is derived from
`interpolate_elo`'s two learned vectors in one specific checkpoint; a new revision moves
both edges and the harness re-runs in ~30 minutes.

---

## 12. Limits of this measurement

- **51 positions from one corpus.** All from `content/drafts`; endgames are over-weighted
  (19/51) because the pack corpus is. Per-phase edges agree within the grid step
  on the readable window (0.99-median ceilings: opening **3500**, middlegame **3500**,
  cross-phase **3600**; floors 900 / 900 / 800) `[V]`, but the reversal band does not —
  per-group median peaks run **2550** (cross-phase) to **3300** (middlegame) — and 7
  opening and 7 middlegame positions is thin. The endgame subgroup carries no
  readable-window signal at all: those positions rarely exceed 20 legal moves.
- **One model.** `maia3-5m`. The 23M checkpoint is untested and its interpolation
  endpoints are different vectors.
- **Behavioural, not human-referenced.** Nothing here compares the returned distribution
  to what humans at any rating actually played. R9's explorer instrument could do that
  below ply ~20 (`design/research/human-outcome-coverage-depth.md`) and would be the
  natural follow-up if the owner wants the range rendered as a skill scale.
- **The 0.99 readability threshold is a chosen line**, justified by a stated consequence
  (≤1 pp error in the concession ratio) rather than derived. The 0.999 crossings are in §7
  and the 0.98 / 0.95 crossings in the committed summary, so a different line can be taken
  without re-measuring.
- **Leg 2's zero tolerance is strict.** The 0.0028 decline that ends `[0, 1800]` is not a
  behavioural cliff; the honest high edge is a **zone**, 2400-2600, and 2400 is its
  conservative end.
- **`SelfElo` / `OppoElo` asymmetry unmeasured.** Only the combined `Elo` option — the one
  the shipped path sends — was swept.

---

## 13. Proposed ledger consequences

Recorded here rather than written: this pass is scoped to the dossier and the coverage
matrix, and `design/BACKLOG.md`, `planning/exploration/gates.md` and
`planning/exploration/log.md` are claude's to land.

| Row | Proposed |
|---|---|
| **D60** (`BACKLOG:126`) | Now answerable. The bound is `[1000, 2400]`, measured; flips ✅ when `engine-request-contract` ships `bandRange` with it and the refusal at all five boundaries |
| **D70** (`BACKLOG:114`) | Answered. `advertised [0, 5000]` is the interpolation domain (`models.py:339-340`), not a capability claim; §9's *"published weakness"* is replaced by a measured `configured` bound |
| **D58** (`BACKLOG:129`) | **Widen.** A second reachable shape of the same failure: any `Elo` value the engine's `int()` rejects leaves the previous band in force and reports nothing — **9 of the 12 value forms tested**, 5/5 positions each; two more (`' 2000 '`, `'+2000'`) are silently *accepted* and one clamps. Blocked today only by `Number.isSafeInteger` at all five boundaries — that check is now load-bearing and should be named as such |
| **New 🐞** | *The engine's silence is total.* A clamped or rejected `setoption name Elo` produces no error, no warning and no changed output field. Any `eloApplied` the server records without a range check is unverifiable by construction |
| **New 💡** | *Is the published band range renderable as a skill scale?* §11 explicitly declines it. If any surface wants a slider labelled in Elo, that needs a human-referenced measurement (R9's instrument, below ply ~20), not this one |

---

## 14. Reproduction

`tools/r10-maia-band-range-harness/README.md` carries the exact commands. Summary
artifact: `tools/r10-maia-band-range-harness/out/band-sweep-summary.json`. Per-probe
JSONL is regenerable from the committed pack corpus and is not kept, per the R4/R5
precedent. Total wall time on a 14-core host, arms run one at a time: ~35 minutes.
