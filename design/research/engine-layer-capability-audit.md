# Engine-layer capability audit — what the instruments can do, what we ask for, and what "100%" means

**Question (owner, 2026-08-15):** *"engine let's get it to 100% too."* Restated as a research
question: **what is the engine layer not doing, and what would 100% look like?**

**Scope.** Every instrument the product can consult: Stockfish (`strong_engine`, evidence,
authoring), Maia (`human_common`, `theory_strict`, `practical_resistance`), the Syzygy
tablebase (`perfect_tablebase`, grounding, decidedness), the Lichess explorer/corpus, and the
supervisor/queue machinery underneath them.

**Audit spine.** `rfc/archive/engine-request-contract.md` §3's five obligations — **state**,
**clear**, **bind**, **bound**, **record**. An instrument call that violates one is incomplete
by the repo's own law, so the audit does not need a new standard of its own.

**Law 8 discipline.** Everything below is a claim about *instrument capability* — what an
engine emits, whether a request reaches it, what a number varies with. No claim is made anywhere
that a move is good, that a band plays at a human strength, or that any instrument's output is
chess-true. Where an instrument's output would need validating before a feature could rest on
it, that is named as an unrun experiment, not assumed.

---

## Verdict in one paragraph

The engine layer is not short of *instruments*; it is short of *questions*. All four instruments
return, in a response the product already pays for, at zero marginal cost, a signal that no
shipped consumer reads — Maia's per-move win/draw/loss, Stockfish's ranked alternatives and its
own WDL, the explorer's per-move outcome split, the tablebase's DTZ everywhere except one
ordering call — and in two cases that discarded signal is precisely the object a blocked product
feature needs. The audit found **one live regression that is worse than any
gap on the list**: since commit `43c6c4a` (2026-08-15) **every Maia request in the product runs
at band 1500 regardless of the requested `targetElo`, while recording the requested band as
applied** — measured, reproduced through the repo's own supervisor, and invisible to both gates
by construction. On reproducibility the count of modes with a reproducible *answer* is
**unchanged at three of five** — what improved since R5 is the machinery beneath them
(`enumerate`, `#strongEngine` and the evidence executor moved onto the reset prologue) — but
counting the **record** obligation as well, which is what replay actually needs, §0 reduces it
to **one**. `strong_engine` remains the one mode whose *answer* is irreproducible, now
measured at **27.5% score disagreement between two identical requests** even after the hash fix,
with a fixed-node replacement that is cheaper than the bound it replaces. And the honest answer
on middlegame difficulty is *"authored — unless one cheap experiment succeeds"*: Maia already
emits a band-conditioned per-move win/draw/loss
prediction on 100% of its candidate lines, R9 already established a ground truth to validate it
against for ply ≤ 20, and nobody has run the comparison.

---

## 0. Escalation first — `SelfElo`/`OppoElo` silently override the requested band

`DEFECT — live, shipped, and it defeats R10, D58 and the Just Play difficulty question at once.`

**What the code does.** `OpponentSelector#maia` (`apps/server/src/opponent-selector.ts:493-506`)
builds its command array as: the resolved `Elo`, **then** `SelfElo` and `OppoElo` *at their
advertised defaults*, then `Temperature`, `TopP`, `MultiPV`, `position`, `go`. The pinned image
advertises `SelfElo` and `OppoElo` with `default 1500` `[V]` (handshake captured through the
shipped supervisor this pass and committed at
`tools/engine-capability-harness/out/maia-handshake.identity.json` — reproduced in §2a), so
the emitted array on **every** Maia request is:

```
setoption name Elo value <targetElo>
setoption name SelfElo value 1500      <- overwrites the line above
setoption name OppoElo value 1500      <- overwrites the line above
```

**What it costs, measured.** `tools/engine-capability-harness/probe-band-order.ts` drives the
repo's own `EngineSupervisor` + `maiaDockerSpec` over 12 positions × bands {1000, 1500, 2400} ×
four command orders, 144 probes, everything else held identical `[V]`:

| Arm | Command order | Policy vector changes between band 1000 and 2400 |
|---|---|---:|
| `elo-only` | `Elo <band>` (R10's shape) | **12 / 12** |
| **`shipped`** | **`Elo <band>`, `SelfElo 1500`, `OppoElo 1500` (HEAD)** | **0 / 12** |
| `elo-last` | `SelfElo 1500`, `OppoElo 1500`, `Elo <band>` | **12 / 12** |
| `self-oppo` | `SelfElo <band>`, `OppoElo <band>` | **12 / 12** |

And the shipped arm is not merely frozen — it is frozen *at 1500*: at band 1000 and at band 2400
the shipped arm's policy vector is byte-identical to an `Elo 1500` request on **12/12** positions,
and identical to the same-band `elo-only` request on **0/12** `[V]`. The `self-oppo` arm equals
the `elo-only` arm on **12/12** at all three bands, which identifies the mechanism: **`Elo` is an
alias that writes `SelfElo` and `OppoElo`**, so writing the pair afterwards discards it.

**Consequences, each traceable:**

- Every `human_common`, `theory_strict` and `practical_resistance` selection is conditioned at
  1500. All **63** `targetElo` values in `content/` (1100–1939, per D70's ledger row) collapse to
  one band.
- The selection still records `eloApplied` = the *requested* band (`#maia` returns
  `appliedTargetElo(health, request.policy.targetElo)` at `:488`, which never consults the
  emitted command array). This is a **record** violation of the contract that named itself after
  exactly this failure, and a **state** violation inside a single request — the option whose
  value changes the answer is sent and then unsent by the same request.
- R10's whole result is inert. `MAIA3_BAND_RANGE = {min: 1000, max: 2400}` (`apps/server/src/maia.ts:11`)
  refuses values outside the band it measured, and no value inside it reaches the model.
- The owner's Just Play difficulty question (`design/BACKLOG.md:261`) — *"do we track elo and
  slide it from 1000 to 2000?"* — currently has the answer *"the slider is wired to nothing."*
- D58's fix is undone in a new shape. D58 was *"an Elo-less request inherits the previous
  request's band."* This is *"every request overwrites its own band."*

**Why neither gate caught it.** `apps/server/src/opponent-selector.test.ts:396-406` asserts the
emitted array **exactly as written**, including the two overriding lines, against a fake engine
client — it locks the regression in rather than catching it. The real-engine suite
(`apps/server/src/maia.maia.integration.ts:125`) sends `setoption name Elo value 1800` and
**does not send `SelfElo`/`OppoElo` at all**, so it exercises a command shape the product does
not use `[V]`. This is a fixture-realism failure of exactly the kind the 2026-08-15 planning
entry set out to look for.

**Origin.** `git log -S SelfElo -- apps/server/src/opponent-selector.ts` → a single commit,
`43c6c4a` *"feat: close engine requests over instrument state"*, 2026-08-15 `[V]`. It implements
`rfc/archive/engine-request-contract.md` §8, whose text reads: *"`SelfElo` and `OppoElo` are sent
at their own advertised defaults, which is behaviourally a no-op today."* Measured, it is not a
no-op. The RFC's own hedge is the tell — its ledger row 5 says *"nothing in the repo has ever set
or measured them … an R5-shaped probe would settle it"*, and the RFC shipped the setting without
the probe.

**Smallest correct fix, stated so the wrong one is not attempted.** Do **not** simply drop the
pair — that reintroduces the `state` hole the RFC closed (a previous caller's `SelfElo` would
persist). Send the pair **first** and `Elo` **last**, or better, stop sending `Elo` and set
`SelfElo`/`OppoElo` explicitly to the resolved band; the `self-oppo` arm proves the two are
equivalent (12/12 at three bands). Setting them to *different* values is a separate, unmeasured
capability — see §2, row *asymmetric conditioning*.

**Escalation.** Ledger rows are owner/claude tier and this dossier may not write
`design/BACKLOG.md`. This needs a 🐞 row, an amendment to the D60/D70 rows (which currently read
as closed and are materially reopened by this), and a note on the `engine-request-contract`
archive row. `planning/exploration/log.md` should carry it as the day's escalation.

---

## 1. Method

Three arms, all driven through the repo's own `EngineSupervisor`, `maiaDockerSpec`,
`stockfishPlaySpec` and `EngineRequest` by relative import — **no second UCI integration and no
second command shape exists.** The harness is `tools/engine-capability-harness/`, disposable
under `rfc/0000-rfc-process.md` §Exploration gate, nothing imports it. The position corpus is the
R4 extractor and the R5 stratifier reused verbatim (`tools/r4-difficulty-harness/extract.ts`,
`tools/r5-maia-stability-harness/select.ts`): 37 packs → 740 raw → 510 unique → **51 positions**
across 19 phase × side × piece-count cells.

| Arm | Probe | Population | n |
|---|---|---|---:|
| A | `probe-maia-outputs.ts` — what Maia emits that `candidateLines()` discards | 51 positions × bands {1000, 1500, 1900, 2400}, MultiPV 20 | 204 probes / 3,456 candidate rows |
| B | `probe-band-order.ts` — does the shipped command order still apply the band | 12 positions × 3 bands × 4 command orders | 144 probes |
| C | `probe-sf-budget.ts` — is a reproducible `strong_engine` search bound affordable | 51 positions × 8 search bounds × 2 repeats | 816 probes |

Everything else in this dossier is a **code reading at HEAD**, cited by symbol and line, and a
call-site census over `apps/`, `packages/` and `workers/`.

**Limits.** One host, one pinned image (`chess-tabiya-maia:1e13597`), local Stockfish 18. The
host was running an unrelated container stack throughout, so **latency figures here are upper
bounds and are not comparable to the `engine-request-contract` acceptance run** (which measured
Maia median 173.2 ms); they are used only for *relative* comparisons between arms measured under
the same load. No claim about chess quality at any band, from any instrument, appears anywhere.

---

## 2. The capability matrix

The third column is the point. "Never asked for" means: **no production call site requests it**,
verified by a call-site census over the whole repo, not merely that a feature is missing.

### 2a. Maia (`maia-5m`, pinned `chess-tabiya-maia:1e13597`)

Advertised option table, captured through the shipped supervisor this pass `[V]`:
`Elo`/`SelfElo`/`OppoElo` (spin, default 1500, min 0, max 5000); `MultiPV` (spin, default 5, min
1, max 20); `Temperature`, `TopP` (**type string**, default 1.0).

| Can produce | Currently asked for | **Never asked for** |
|---|---|---|
| Per-move `policy` scalar (raw softmax; the AGPL patch adds it) | ✅ `candidateLines()` reads `policy` (`opponent-selector.ts:241-247`); the only quantitative Maia input in the product | — |
| Sampled `bestmove` under `Temperature`/`TopP` | ✅ `#humanCommon` plays it (`:529`) | `Temperature 0`, which R5 measured makes the sample **35/35 stable**. Deliberately unreached (§5 of the RFC: a modal opponent "would be a different product") — but it is unpublished, not published-and-refused |
| **Per-move `score cp`** on every info line | ❌ never parsed | the whole field |
| **Per-move `wdl` win/draw/loss** on every info line | ❌ never parsed | **the headline gap — §3** |
| Band conditioning via `Elo` | ⚠️ requested, then overwritten (§0) | a band that reaches the model |
| **Asymmetric conditioning: `SelfElo` ≠ `OppoElo`** | ❌ both pinned to 1500 | *"you, rated 1500, against an opponent rated 1900"* — the exact conditioning the product's resistance idea describes, advertised by the instrument, never used, never measured. RFC ledger row 5, still open |
| MultiPV up to 20 | ✅ `#humanCommon` requests `min(20, max(8, legal))`; `#practicalResistance` and `#theoryStrict` likewise, now clamped | — |

`candidateLines()` (`opponent-selector.ts:234-256`) matches three tokens — `multipv`, `pv`,
`policy` — on lines that carry five. Arm A measured `score cp` and `wdl` present on
**3,456 of 3,456** candidate rows (100.00%) `[V]`.

### 2b. Stockfish (`stockfish-play` opponent · `stockfish-analysis` judge · `stockfish-authoring`)

Local Stockfish 18 advertises 20 options `[V]`.

| Can produce | Currently asked for | **Never asked for** |
|---|---|---|
| `bestmove`, `score cp`/`mate`, PV, achieved depth | ✅ opponent (`#strongEngine`, MultiPV 1, `go movetime 100`), evidence (`eval`, `bestline`), authoring (`eval`, `go depth 22`) | — |
| MultiPV up to 256 (advertised `min 1 max 256` `[V]`) | ⚠️ **only `enumerate` (2–8) ever asks for more than 1.** `service.analysis()` accepts `multiPv` 1–8 but its sole client hardcodes `multiPv: 1` (`apps/web/src/lib/api.ts:925`); the evidence spec's configured width is 1; the authoring profile is 1; `sourcing/syzygy.ts:84-85` actively throws if it is not 1 | a ranked alternatives list on the **evidence** path — which is what a compare strip needs and what Q8 found the shipped compare strip does not have |
| **`UCI_ShowWDL`** win/draw/loss | ⚠️ implemented end-to-end (`evidence-queue.ts:337`, `:369-382`; `EvidenceKind` includes `"wdl"`; the run schema and the web sentence layer both handle it) and **enqueued by zero production call sites** — the executor sets `UCI_ShowWDL false` on every real request | the entire `wdl` evidence kind. Dead capability, fully built |
| `go nodes` — a machine-independent search budget | ❌ | **the fix for D35's remaining half** (§4) |
| `searchmoves <list>` — restrict the search to named moves | ❌ | one search that scores the learner's move *and* the spine move against each other, instead of N searches or none |
| `SyzygyPath` / `SyzygyProbeLimit` — local tablebase probing inside the engine | ❌ (docs list local Syzygy files as follow-up work) | the repo instead goes over HTTP to `tablebase.lichess.org` with a 4-deep queue and a hard 7-piece refusal. Stockfish would answer both in-process |
| `UCI_LimitStrength` / `UCI_Elo` / `Skill Level` | ❌ | **deliberate, published refusal** — weakened Stockfish is rejected doctrine (`AGENTS.md` §Rejected) |
| `nodestime`, `Ponder`, `go mate`, `seldepth`, `nps`, `hashfull`, `tbhits` | ❌ | minor; `tbhits` was used once by R4 as a control and is not read in production |

### 2c. Syzygy (hosted `tablebase.lichess.org/standard`)

| Can produce | Currently asked for | **Never asked for** |
|---|---|---|
| Position `category` | ✅ everywhere — `#perfectTablebase` (`:611-612`), `#practicalResistance` root and child (`:629`, `:653`), `branchDecidedness` (`service.ts:1013-1016`), pack validation, the authoring ledger | — |
| Per-move `category` | ✅ the category-preserving filter, and the conceding set for `humanConcessionMass` | — |
| **`dtz` / `precise_dtz`** | ⚠️ **exactly one runtime consumer**: `#perfectTablebase`'s ordering metric (`opponent-selector.ts:616`). The authoring ledger records it (`sourcing/syzygy.ts:164`); nothing in `apps/web` or `packages` reads it at all | **DTZ as a progress or difficulty axis.** `#practicalResistance` — the mode whose entire job is *"how hard is this to convert"* — reads **category only** and ignores DTZ. There is no "how far from conversion are you" signal anywhere in the product |
| `dtm` (where published) | ❌ at runtime (recorded in the authoring ledger) | — |
| The move list itself | ⚠️ `#practicalResistance` sorts the preserving replies **`localeCompare` by UCI** and takes `.slice(0, 4)` (`:637-638`) before scoring them. The four candidates it evaluates are the alphabetically first four, not the four most resistant | a principled candidate cut. Latent while most positions have ≤ 4 preserving replies; a silent quality cap where they do not |

### 2d. Lichess explorer / corpus

The runtime surface is `apps/server/src/corpus.ts`; the authoring surface is
`apps/server/src/sourcing/explorer.ts`. They share `explorerUrl`, which sets `moves=12`,
`topGames=0`, `recentGames=0` (`sourcing/explorer.ts:69-71`); the runtime path overrides
`history=true` (`corpus.ts:39`).

| Can produce | Currently asked for | **Never asked for** |
|---|---|---|
| Position-level `white`/`draws`/`black` | ✅ carried on `CorpusResult` and rendered as three percentages (`apps/web/src/lib/corpus-sentences.ts:15`) | — |
| **Per-move `white`/`draws`/`black`** | ❌ **fetched over the wire and discarded at parse time.** `corpus.ts:61-65` reads `mw`, `md`, `mb` and immediately sums them into `playedCount`, keeping only frequency | **the second headline gap — §3.** This is the object `rfc/archive/resistance-spectrum.md:840-847` says *"practical difficulty actually wants"*, and the object R9 measured as separating **475 of 2,814 (16.9%)** engine-tied move pairs by ≥5 pp |
| Per-move `averageRating` | ❌ (the authoring parser keeps it, `explorer.ts:87`; the runtime parser does not read it) | a within-band skew check |
| Monthly `history` series | ⚠️ requested (`history=true`), parsed, and reduced to **one string**: the newest non-empty month (`corpus.ts:68-79`) | the trend. R9 measured temporal drift at 0.58 pp; the series is paid for on every request and thrown away |
| Rating-band and speed slicing | ✅ `corpusPopulation()` picks exactly one band from `targetElo` | multi-band comparison at one position — the *"this is a trap at 1400 and not at 1800"* reading, which is one extra request |
| `moves` beyond 12, `topGames`, `recentGames`, the masters DB | ❌ | mostly deliberate (per-game data has scope and licence questions, and `teardown-365chess-desk.md` rules `/masters` redundant); the 12-move cap is not deliberate and is unexamined |

### 2e. Supervisor, selector and queue machinery

| Can produce | Currently asked for | **Never asked for** |
|---|---|---|
| The complete advertised option table, retained since `43c6c4a` | ⚠️ **three fields of it**: `MultiPV.max`, the band spin's `min`/`max`/`default`, and whether `Clear Hash` exists | the rest. `EngineHealth.options` exists and `/capabilities` does not publish it — the deployment knows its instruments' contract and does not tell the client |
| Per-engine health, restart count, bounded transcript | ✅ internally | `capabilities.engines` publishes only `stockfish-analysis` and `maia-5m`; **`stockfish-play` is omitted** (`application.ts:311-313`) — the opponent-side engine's identity is unpublished while its profile is. RFC ledger row 1, still open |
| `EngineRequest.afterCommands` | ❌ **zero production callers.** Correct — the `state` obligation replaced it — but the field and its abort-path hazard (D66's mechanism) are still in the type | delete or document as reserved |
| Evidence queue: FIFO, concurrency 2, rewind-aware cancellation, staged results | ✅ | no push channel; no `depth` from any client (every production enqueue uses `movetime`); `kind: "eval"` and `kind: "wdl"` unreachable from HTTP (`rest.ts:1354` rejects anything but `bestline`) |
| Declared-but-unimplemented modes | ✅ `plan_defense`, `human_external` published with checked refusals (`capabilities.ts:22-25`) — this is the pattern the rest of the layer should copy | — |

---

## 3. The two discarded signals, measured

Both are emitted at zero marginal cost inside a response the product already pays for. Both are
discarded by a single parser line. Both are shaped like the thing a blocked feature needs.

### 3a. Maia's per-move win/draw/loss is a second, independent signal — and it is band-conditioned

Arm A, 204 probes / 51 positions / bands {1000, 1500, 1900, 2400} / MultiPV 20 / 3,456 candidate
rows `[V]`:

| Reading | Value |
|---|---|
| Candidate rows carrying `wdl` and `score cp` | **3,456 / 3,456 (100.00%)** |
| Probes where the `wdl`-best move ≠ the `policy`-best move | **120 / 200 (60.0%)** |
| Spearman ρ(policy, wdl expected score) within a probe | median **0.558** (p10 0.236, p90 0.864) |
| Expected-score spread across the listed candidates, within a probe | median **0.191**, min 0.012, max 0.786 |
| … by phase: opening / middlegame / endgame / cross-phase | **0.118 / 0.190 / 0.175 / 0.265** |
| (position, move) pairs whose `wdl` changed between band 1000 and band 2400 | **777 / 779 (99.7%)**, median \|Δ score\| **0.060**, max **0.286** |

Read carefully, that says four things. **(i)** The field is always there. **(ii)** It is not a
restatement of policy — at ρ ≈ 0.56 and 60% argmax disagreement, "what a player at this band is
likely to play" and "how that move is predicted to turn out" are different orderings, which is
the whole reason a difficulty measure could exist. **(iii)** It discriminates *inside the
middlegame*, where R4 says the engine is silent and R9 says the human corpus has run out —
median 19 percentage points of expected score between a position's best and worst listed move.
**(iv)** It moves with the requested band, which is what distinguishes a human-outcome
prediction from a position evaluation.

**What this does not say, and must not be read as saying.** Nothing here establishes that Maia's
`wdl` is *correct*, calibrated, or comparable to a real outcome distribution. It establishes only
that the instrument emits a band-responsive, policy-independent, position-discriminating number
that the product throws away. Whether it is trustworthy is an **unrun experiment**, and R9 has
already built its ground truth (§6, gap 3).

**A methodological warning worth carrying.** The first run of arm A measured this field as
perfectly band-*invariant* (0/864 pairs changed) and the policy vector likewise. That reading was
an artifact of the §0 regression: the harness had faithfully reproduced the shipped command
order, and the shipped command order pins the band. The bug was found *because* a capability
measurement returned an impossible zero. Reproducing the shipped shape exactly is what made the
audit useful; believing its first answer would have made it wrong.

### 3b. The explorer's per-move outcome split is discarded at parse time

`corpus.ts:61-65` reads the three outcome counts off every move in the explorer response and
sums them:

```ts
const mw = count(move.white), md = count(move.draws), mb = count(move.black);
...
const playedCount = mw + md + mb;
moves.push({ san: move.san, uci: move.uci, playedCount, sharePct: pct(playedCount, total) });
```

The split never reaches `CorpusResult`. Everything downstream — the repertoire gap scan
(`repertoire.ts:57`, mass = `item.mass * (reply.playedCount / stats.total)`), the runtime corpus
panel, the client — sees **frequency only**. `[V]` at HEAD.

Three things converge on this line:

- `rfc/archive/resistance-spectrum.md:840-847` names it explicitly: *"the explorer returns
  per-move win/draw/loss counts at a rating band — an empirical result distribution over a
  position, not an engine opinion at all, and it is the object 'practical difficulty' actually
  wants."*
- R9 measured it and found it discriminating: **475 of 2,814 (16.9%)** engine-tied move pairs
  (|Δcp| < 30) separated by ≥ 5 pp significantly, max 22.3 pp, with Pearson(cp, score) of
  −0.079 (`human-outcome-coverage-depth.md`).
- The authoring-side parser two directories away **already keeps it** (`sourcing/explorer.ts:87`)
  and the authoring pipeline already computes `whitePct`/`drawPct`/`blackPct` from it.

So the field is fetched, paid for, parsed, and dropped — and the code that keeps it exists in the
same repo. The scope caveat is R9's, not a new one: this is only available where explorer coverage
is, i.e. **ply ≲ 20 at ≥ 400 games**. Inside that window it is the only real-outcome oracle the
product has, and it is currently unreachable from the runtime.

---

## 4. Reproducibility, per mode, against the five obligations

R5 recorded *"only three of five shipped modes are reproducible."* Verified at HEAD, **the count
is still three of five, and it is now worse than R5 left it.** What genuinely improved is the
machinery, not the modes: `enumerate`, `#strongEngine` and the evidence executor moved onto the
reset prologue and now state their own `MultiPV`, which closed D66 and the *clear* half of D35.
What regressed is the record: **§0 puts a `record` violation on all three Maia modes**, including
the two whose answers R5 certified as reproducible. A mode whose answer is reproducible and whose
record is false is not a mode you can replay from.

"Reproducible" here means: *the same request, on the same instrument, in any process state,
returns the same answer, **and** the record says what was applied.* R5's "three of five" counted
the first clause only. Under the full definition, **§0 reduces it to one.**

| Mode | state | clear | bind | bound | record | Reproducible? |
|---|:--:|:--:|:--:|:--:|:--:|---|
| `perfect_tablebase` | ✅ | n/a | n/a | ✅ (7-piece refusal) | ✅ | **Yes — the only unqualified yes.** Pure function of the probe; deterministic DTZ/UCI ordering; no UCI process involved |
| `theory_strict` | ❌ §0 | n/a (ruled) | ✅ | ✅ | ❌ §0 | **Answer yes, record no.** Seeded sample over the policy vector, which R5 measured bit-stable; but `eloApplied` names a band the request unsent |
| `practical_resistance` | ❌ §0 | n/a (ruled) | ✅ | ✅ | ❌ §0 | **Answer yes, record no.** Same shape. Additional latent hazard: the alphabetical `.slice(0, 4)` (§2c) |
| `human_common` | ❌ §0 | n/a (ruled) | ✅ | ✅ | ❌ §0 | **No, by design** — plays a `torch.multinomial` sample (R5: 34.3% stable). The RFC scopes this out deliberately; replay and the journal supply repeatability. `offWindow` now closes the *candidate-list* record hole; §0 opens a *band* one |
| `strong_engine` | ✅ | ✅ | ✅ | n/a | ✅ | **No — the one *answer*-level hole, and now measured after the fix.** `go movetime 100` (`opponent-selector.ts:556`) is a wall clock: two identical requests on a reset engine disagree on the **score on 27.5% of positions** and on the **best move on 2.0%** (§4a) |

*`clear` reads "n/a (ruled)" on the three Maia modes because `#maia` deliberately passes
`resetSearchState: false` — R5 measured that `ucinewgame` resets the board and history only, the
sidecar is history-conditioned and every request already sends the full history, and the sampler
RNG survives it (`rfc/archive/engine-request-contract.md` §7). That is a ruled exemption, not an
unmet obligation.*

### 4a. `strong_engine`: what the movetime bound costs, and what replaces it

D35's ledger row is explicit: *"DO NOT FLIP: only the hash half landed."* The **clear** obligation
shipped; the wall clock did not. Arm C measures the alternatives on the same 51 positions, two
repeats each, through the shipped `#strongEngine` command shape with `resetSearchState: true`
`[V]`:

| Search bound | Two identical requests agree on **best move** | … on **score** | Latency median / p95 / max | Over 500 ms | Achieved depth (median, range) | Same move as `movetime 100` |
|---|---:|---:|---:|---:|---:|---:|
| **`go movetime 100` (shipped)** | **50 / 51 (98.0%)** | **37 / 51 (72.5%)** | 113.7 / 123.0 / 127.9 ms | 0% | 14 (11–60) | — |
| `go depth 8` | 51 / 51 | 51 / 51 | 19.5 / 38.5 / 55.2 ms | 0% | 8 | 58.8% |
| `go depth 10` | 51 / 51 | 51 / 51 | 27.1 / 86.8 / 115.8 ms | 0% | 10 | 64.7% |
| `go depth 12` | 51 / 51 | 51 / 51 | 55.6 / 184.5 / 422.0 ms | 0% | 12 | 80.4% |
| `go depth 14` | 51 / 51 | 51 / 51 | 122.3 / 307.4 / 342.9 ms | 0% | 14 | 76.5% |
| `go depth 16` | 51 / 51 | 51 / 51 | 308.8 / 614.8 / 769.6 ms | **21.6%** | 16 | 82.4% |
| **`go nodes 50000`** | **51 / 51** | **51 / 51** | **98.0 / 158.4 / 183.3 ms** | **0%** | 14 (10–40) | **84.3%** |
| `go nodes 200000` | 51 / 51 | 51 / 51 | 336.8 / 649.2 / 980.3 ms | **32.4%** | 17 (14–54) | 80.4% |

**Reading, and it is unambiguous.** *(i)* **The shipped bound is still not reproducible after the
hash fix.** Two byte-identical requests, on a reset engine, in the same process, return a
different **score on 14 of 51 positions (27.5%)** and a different **best move on 1 of 51** `[V]`.
That is the residual D35 the ledger row insists on: the clear obligation landed, the wall clock
remains, and it is measurable at the smallest possible scale — same host, same second, no load
change between the two calls. *(ii)* **Every fixed bound is perfectly reproducible** — 51/51 on
both the move and the score, on all six depth and node arms. *(iii)* The best replacement is
**`go nodes 50000`**: it is the only arm that is simultaneously fully reproducible, **cheaper at
the median than the bound it replaces** (98.0 ms vs 113.7 ms), flat in cost (1.9× median-to-max
spread, against fixed depth's 7.6× at depth 12 and a 21.6% budget breach at depth 16), and the
closest match to today's opponent behaviour (**84.3%** same move, and the same median achieved
depth of 14).

The reason node-bounding beats depth-bounding is not reproducibility — both give it — but cost
shape: a node budget spends the same work everywhere, while a depth budget spends whatever the
position demands, which is most on exactly the complex middlegames where the opponent matters
most. Converting `strong_engine` to a node budget is nevertheless a **product** change (it
changes opponent strength) and belongs in an RFC, not a defect fix — which is what
`engine-request-contract` open question 2 already ruled. This dossier supplies the cost curve
that ruling said was missing, and the answer is that the change is affordable in both directions.

### 4b. What is *not* a reproducibility hole, stated so it is not re-litigated

- **`human_common`'s sampler.** By design (`rfc/archive/engine-request-contract.md` §5). A modal
  opponent is a different product. `Temperature 0` exists and is deliberately not offered — but
  it is unpublished rather than published-and-refused, which is the smaller version of the same
  honesty gap (§2a).
- **`seedHonored: false`.** Correct and load-bearing. R5 refused to flip it; nothing here changes
  that.
- **D66.** Closed in substance: every production request now states its own `MultiPV`, so an
  aborted predecessor cannot poison a successor. `afterCommands` survives with zero callers.
- **D67 / D72.** Confirmed open and confirmed correctly diagnosed. `identityFor`
  (`opponent-selector.ts:432-438`) still builds the comparison identity with no `eloApplied`, and
  `sameEngine` still ignores it, so the one-clause fix would still break reuse for every
  band-calibrated run. Note the uncomfortable interaction with §0: while every selection is
  conditioned at 1500, `sameEngine`'s band-indifference is *accidentally correct*, and fixing §0
  is what makes D67 live.

---

## 5. The gaps that block product features

### 5a. The middlegame opponent whose difficulty is real

The constraint is joint and it is real: R4 says measured difficulty needs a **decided** position
(88.3% of ≤7-piece positions, 10.2% of everything else), and R9 says the human-outcome oracle
**stops at ply ~20**. Between those two boundaries — which is where most chess is — the product
today has a band setting and nothing else. That is why `practical_resistance` is endgame-only,
why `resistance-spectrum` shipped three executable policies where the ledger row promised five,
and why the owner's Just Play question has no clean answer.

**The honest answer is "authored" — with one live exception worth testing first.**

What the engine must supply to support *authored* difficulty (i.e. what the author declares and
the runtime must be able to check):

1. **A concession classifier that is not the tablebase.** The measurement machinery is already
   instrument-agnostic: `humanConcessionMass(candidates, concedingMoves)`
   (`packages/runtime/src/practical-difficulty.ts:32-35`) takes an **externally classified**
   conceding set and knows nothing about where it came from `[V]`. `practical_resistance` is
   endgame-only because its *classifier* is the tablebase, not because its *measure* is. An
   author-declared conceding set — "these replies give up the bind" — plugs into the shipped
   function unchanged. That is a much smaller change than the mode's endgame-locking suggests.
2. **A per-move human-choice mass at a stated band, at any ply.** Already shipped and already
   reproducible: R5 measured the policy vector byte-identical over 20 repeats, two containers and
   two widths. Blocked today only by §0.
3. **An honest publication of what was applied.** The `eloApplied` record, once §0 is fixed, plus
   the `plan_defense`-style published refusal for what cannot be measured.
4. **A witness the author can check.** The authoring path can already ask Stockfish for
   `bestline`/`eval` at depth 22; what it cannot do is score *a named set of moves in one search*
   (`searchmoves`, §2b), which is what validating a declared concession set actually needs.

The exception, and it is the reason not to conclude "authored" immediately: **§3a's `wdl`.** It is
band-conditioned, policy-independent, present on every line, and it discriminates in the
middlegame. If it is calibrated, `practical_resistance` extends outside the tablebase with no new
instrument. If it is not, "authored" is the answer and the product should say so and publish the
refusal. The experiment that decides it is cheap and its ground truth already exists — §6, gap 3.

### 5b. The compare strip has no ranked engine alternatives

Q8 measured the shipped compare strip failing axis D worse than the census leaf R3 condemned
(fires on 99.8% of transitions, lift ≈1.01×, median 36 unranked differences between two branches).
Meanwhile the evidence path can ask Stockfish for a ranked MultiPV list and **never does** (§2b) —
the one client hardcodes `multiPv: 1`. This is not proof that ranked alternatives would fix the
compare strip; it is a note that the instrument capability the obvious fix would need is present,
unused, and one integer away.

### 5c. `strong_engine` is not a strong human and cannot be made one

Restated from the ledger row (`design/BACKLOG.md:261`) because the audit confirms it at the
instrument level: above Maia's calibrated band the only opponent available is a different species,
and `UCI_LimitStrength`/`Skill Level` are rejected doctrine. There is no instrument in the layer
that produces IM/GM-like *human* play, and none can be added by asking harder. The phase-aware
composition the ledger row proposes is the honest ceiling, and every instrument it needs already
exists.

---

## 6. What "100%" means, and the ordered gap list

**Definition.** Not "no open defects", and not "every capability used". *The engine layer is at
100% when every capability its instruments publish is either* **(A) reached** *by a request that
satisfies all five obligations and feeds a named product surface,* **(B) published as
deliberately unreached, with the reason,** *or* **(C) named as a measured impossibility.** *And
no capability sits in a fourth state — silently unused, or used without the record saying so.*

That fourth state is where most of this audit's findings live, and it is the same silence the
declared-vs-executable law and the request contract both exist to forbid. The layer's honesty
apparatus already exists and is good — `plan_defense` and `human_external` are published as
declared-and-refused with machine-checked reasons (`capabilities.ts:22-25`). **100% is that
pattern applied to capabilities, not just to modes.**

Under that definition the layer is not close, and the distance is mostly *publication*, not
engineering.

### Ordered by what it unblocks

| # | Gap | Unblocks | Size |
|---|---|---|---|
| **1** | **§0 — the band never reaches the model, and the record says it did** | Every band-calibrated feature; R10's entire result; the Just Play slider; D58's fix; D60/D70's closure | One command-order change + a real-engine test that would have caught it. **Do this first and independently of everything else** |
| **2** | **Explorer per-move outcome split (§3b)** — stop discarding it in `corpus.ts:61-65` | The only real-outcome oracle the product has, inside ply ≲ 20: a per-move *result* reading for the opening/on-ramp lane, an outcome-aware repertoire gap priority, and the compare strip's missing "and how did that turn out for people like you" | ~6 lines in one parser + the consumers that want it. The authoring parser already does it |
| **3** | **Validate Maia's `wdl` against R9's ground truth** (§3a) | Decides whether measured middlegame difficulty exists at all — i.e. whether `practical_resistance` extends outside the tablebase or whether "authored" is the published answer | One R-shaped experiment. Both instruments and both harnesses exist; the overlap window (ply ≤ 20, ≥ 400 games) is exactly R9's population, and R9 already computed the per-move human score for it |
| **4** | **`strong_engine` → `go nodes 50000` (§4a)** | Closes D35's remaining half — measured at **27.5% score disagreement between two identical requests** today; makes the fifth mode reproducible; makes the group reply journal's purity claim true for every mode | A product RFC (it changes opponent strength), with the cost curve now supplied. The candidate replacement is **51/51 reproducible, cheaper at the median than the bound it replaces, and 84.3% behaviour-preserving** |
| **5** | **Publish the option table and the unreached capabilities** | Turns the fourth state into state (B) everywhere: `stockfish-play` in `capabilities.engines`; `Temperature 0`, `UCI_LimitStrength`, `Skill Level`, the masters DB, `topGames`/`recentGames` published as refused-with-reason; `EngineHealth.options` exposed | Small, and it is what makes "100%" checkable rather than rhetorical |
| **6** | **`practical_resistance`'s alphabetical `.slice(0, 4)` (§2c)** | Removes a silent quality cap in the one mode that claims to measure difficulty | Small; needs a principled cut (DTZ is the obvious axis and is already fetched) |
| **7** | **`wdl` evidence kind has zero producers (§2b)** | Either wire it to a surface or delete it. A fully-built, schema-supported, client-rendered capability with no producer is exactly state four | Decide, then small either way |
| **8** | **`searchmoves` and asymmetric `SelfElo`/`OppoElo`** | Cheap validation of authored concession sets; the "you at X against an opponent at Y" conditioning the product describes and has never measured | Research first (RFC ledger row 5 is already open on the second) |
| **9** | **DTZ as a progress axis; the explorer `history` series; per-move `averageRating`; the `moves=12` cap** | Smaller surfaces, all currently paid for and discarded | Each small; none blocking |

### Deliberately **not** reached — state (B), and this dossier endorses it

`UCI_LimitStrength`/`UCI_Elo`/`Skill Level` (weakened Stockfish is rejected doctrine);
`human_common` determinism via `Temperature 0` (a modal opponent is a different product);
per-game explorer data (`topGames`/`recentGames`) and the masters DB (scope and redundancy, per
`teardown-365chess-desk.md`); Stockfish's `Ponder` and `go mate`. **Each of these should be
*published* as refused, which today none of them is.**

### Remains — state (C)

**Measured practical difficulty in the middlegame against a real human population.** R4 and R9
jointly close this: engines are silent on undecided positions, human games run out at ply ~20,
and no instrument in the layer covers the gap with *observed outcomes*. Gap 3 can only convert
this into "measured against a *model's* prediction of human outcomes", which is a weaker and
different claim and must be labelled as such wherever it is rendered. If gap 3 fails, the
product's honest answer for middlegame difficulty is **authored**, and §5a lists what the engine
layer must supply to support that — most of which it already does.

---

## 7. What this pass did not do

- **No production code was touched.** Codex is implementing; every finding here is a reading or a
  measurement.
- **`plan_defense` and `human_external`** were not audited as capabilities — they are declared,
  refused, and unimplemented by design.
- **Browser execution locus** (`executionLocus` in the run schema) is untested; no engine runs in
  the browser today.
- **Latency** was measured on a loaded host and is comparable only within this dossier.
- **No chess claim** is made about any instrument's output at any band, by any of these
  measurements. Law 8 holds throughout: the audit measures what the instruments *do*, never
  whether they are *right*.

## Artifacts

`tools/engine-capability-harness/` — `probe-maia-outputs.ts`, `probe-band-order.ts`,
`probe-sf-budget.ts`, `analyze.py`, and the committed summaries in `out/`. Disposable; nothing
imports it. The analyser is pure: given the same JSONL it rewrites the committed summaries byte
for byte.
