# Work register — every open item has a destination

**Why this file exists.** 2026-08-15 produced eleven landed waves, nine research
dossiers and ~50 new defects. The owner's concern is the right one: *"make sure ALL
of it is properly queued so we don't lose it or defer it."* The ledger holds the
findings; this file holds the **routing**. Every open defect appears exactly once,
with a destination. A row with no destination is a bug in this file.

> **⚠ THIS FILE IS 121 ROWS STALE AND ITS INVARIANT IS FALSE — measured 2026-08-16, [[D487]].**
> It names **78 distinct ids, highest D365**. The ledger is at **D486**. Of the **121** rows above
> D365 it names **zero** — every row created on the project's two highest-output days. By the rule
> stated directly above, this file currently contains **121 bugs**.
>
> **Do not read it as an answer to "what is unscheduled".** The current answer is
> `planning/defect-triage.md`, which routes all 289 open rows, plus `planning/app-reality-check.md`
> for what a user actually sees. **Until this file is DERIVED rather than written, it will go stale
> again** — the invariant below is prose, nothing produces this file, and no `make` target checks
> it. That is the same failure as [[D450]] and [[D477]]: a normative rule with no reader.

**Rule:** nothing is "deferred" here. An item is either **queued** (an RFC owns it),
**owner-gated** (named, with the question), or **unowned** (needs an RFC drafted —
which is itself queued work). There is no fourth state.

## 0. Blocking now

**D64 is the live one.** `fixture-realism` was **implemented** (`4155a10`) while deferring
D64 on a measurement now proved wrong by a seven-character offset — **135 of 341 committed
syzygy entries are manufactured, across six packs carrying `ledger_verified`**, and
`offlineQuery` asserts `status: 200` from a URL no process contacted. The RFC is **not yet
archived**, so D64 can still be scoped into it. **It must not archive with the superseded
measurement standing.**

| Item | Destination |
|---|---|
| ~~**D91**~~ ✅ closed by `0985fa4` (band applied last; real-Maia test proves 1000 ≠ 2400). *Was:* every Maia request runs at band 1500; `Elo` is an alias overwritten by the `SelfElo`/`OppoElo` defaults sent after it | **implemented, pending independent review.** The defaults now precede `Elo`; a real-engine production-selector test proves bands 1000 and 2400 produce different policy vectors |
| **D60 / D70** — the band bound, re-opened because D91 makes it inert | mechanism restored with D91; owner-ledger closure waits for independent review |
| **D58** — an Elo-less Maia request inherits the previous request's band; nine of twelve malformed forms do the same | same file, same fix as D91 — route it into that change or it will be re-found by the next sweep |

## 1. Queued — an accepted or ready RFC owns these

| Items | Owner |
|---|---|
| D69 (tolerance), D47 (pin tests encode content facts), D54 (refusal scanner scope) | `rfc/fixture-realism.md` — READY |
| D52, D53 (unmeasured live markers, free-parameter thresholds) | `rfc/live-marker-quality.md` — LANDED; residuals recorded |
| D61, D62 (vacuous phone assertion, inert tabs) | `rfc/client-surface-floor.md` — READY |
| D65, D66, D67, D71, D72 (handshake discards the option table; abort leaves MultiPV; `sameEngine` band-blind) | `rfc/archive/engine-request-contract.md` — landed; residuals below |

## 2. Unowned — three waves, owner ruling 2026-08-15: *"just make nice waves… as long as we get them all done"*

Each cluster is one RFC. **Two drafts per wave**, because drafting all seven at once
starved the review queue on 2026-08-15 — the failure mode is review throughput, not
drafting capacity. A wave advances when its drafts are cross-reviewed and queued.

**WAVE 1 (drafting now):** A (delivery) + B (engine leverage).
**WAVE 2:** C (content-vocabulary wiring) + D (live-surface honesty).
**WAVE 3:** E (dead vocabulary) + G (process). F is a content wave, not an RFC, and
runs alongside whichever wave has room. **Cluster E's product dispositions landed through
`rfc/archive/format-surface.md`; `rfc/dead-vocabulary.md` owns only the residual, report-only
declaration census.**

**A. Delivery — the Q8 remedy.** D77 (0 of 131 feedback claims can reach a
learner), D78 (compare strip discriminates at 1.01×), D79 (`stated_reasoning`
used by 0 of 145 checkpoints). *Q8's verdict: the remedy is delivery, not
authoring.* **Highest product value of anything unowned.**

**B. Engine leverage.** D87 (one engine output of six is referenceable as a live
condition), D88 (235 machine-validated records anchored to the exact pointer of
the `cost` field; 0 of 275 deviations declare one), plus the audit's never-asked-
for list: Maia's per-move WDL (100% of rows, parsed and discarded, disagrees with
the policy argmax on 60% of probes), the explorer's per-move outcome split
(fetched, then summed away), `go nodes 50000` as the `strong_engine` fix (51/51
reproducible, cheaper than today's bound, 84% move-preserving → closes D35).

**C. Content-vocabulary wiring.** D89 (two grammars, one job, no selection rule —
the re-author already happened once, silently), D90 (`variantOf` never used in
git history), D33 (trajectories cannot be `ledger_verified`), D64
(`offlineQuery` manufactures its own provenance), D38 (two drafts ship a
`follow_theory` leg that can never fire).

**D. Live-surface honesty.** D80 (assistance keyed on governance role, so the
host-seated player gets evidence the guest cannot), D81 (`session.kind` is
decorative), D82 (five assistance contexts, three shipped keys), D83 (missing
attribution line; vote form hardcodes 2 of 8 options).

**E. Dead and no-op vocabulary — owned and disposed.** `rfc/archive/format-surface.md`
owns D84 (`arrows`, classified `unmeasured`), D85
(`SIMULATE_BUDGET_EXCEEDED`, retired), D86 (`retryVariants`, refused with `variantOf` as its
incomplete successor), and D57 (recording disposition); D39 and D40 closed earlier through
`validator-integrity`. `rfc/dead-vocabulary.md` owns the residual declaration census only:
measurement of producers, consumers, refusal sites, and corpus firings without turning zero
into a verdict.

**F. Content fixes — ✅ RAN 2026-08-15 (`41afe00`), re-verified and flowed back 2026-08-16.** *The register called this unlaunched for a day because a content wave has no completion protocol: it shipped its fixes and lost its rows.* **F. Content fixes — a content wave, not an RFC.** D75 (`rook-4v3-same-side`'s
trigger is loose, not its signature), D76 (`fianchetto-g7` arm from the wrong side
of the board), D43, D44, D55, D63.

**G. Process.** D37 (an archived RFC registered `implemented` whose extraction
never shipped) — and the guard already adopted: the completion protocol now
requires the log entry in the archiving commit.

## 3. Owner-gated

| Question | Where |
|---|---|
| The breadth doc's stale residuals and counts (B4, B8, shape count, "Twitch", the events row) | reconciliation gate list; `design/03` is owner tier |
| Whether the campaign deck becomes a **per-lens loadout with a slot budget** (turns 1 build into 278,256 at zero authoring cost) | `design/06` §1, corrected 2026-08-15 |
| Teacher mode | ✅ shipped 2026-08-22 by `rfc/archive/teacher-surface.md`; classroom rosters, assignments, explicit submission consent and bounded review access |

## 4. Content scale — the sequencing the owner set

Vocabulary audit verdict: **content can scale now**; the format is not the
bottleneck (`pack-check` 37/37 clean). Two things land first because they are the
costliest to re-author, and **both are shipped-and-unused rather than missing**:
the tempo layer (required by `04` §2d, used by 0 of 20 opening packs) and the
engine-condition surface (cluster B).

Then the volume, with measured arithmetic: **9 middlegame packs ≈ 9.75 agent-hours**
is the minimum that makes a phase-shaped map possible at all — today every middle
act is `carlsbad-minority-attack`. Spire parity is **56 hours, 64% middlegame**.

## 4a. Authoring-expressiveness cluster — created 2026-08-16

`rfc/vocabulary-wiring.md` open question 9 required *"either a work-register cluster or an
owner-gated row"* before that draft could be accepted, on the grounds that handing items to
*"a later wave"* is not a destination — the failure that RFC-s own §5c warns about, applied to
itself. **Half of Q9 resolved on its own:** per-leg `shapes`/`opponentPolicy` is **D96**, and
`rfc/archive/format-surface.md` — drafted after the question was written — owns and implements it at
pack 0.25.

**This cluster is the other half, and it exists so the remainder has a name rather than a
wave.** Members:

| Item | State |
|---|---|
| **`deviation.planClassId`** — ranked beside D96 by the completeness audit; additive; no register row owns it. `format-surface` names it and explicitly does **not** take it | unowned, **clustered here** |
| **D105** — a `retryVariants` note names a pack that does not exist, and nothing can see it | unowned |
| **D106** — `targetElo` accepted beside `strong_engine` and silently dropped; `format-surface` scoped it out by name | unowned |
| **D127** — the shape library can author a plan success signature the pack layer refuses to grade on | unowned |
| **D86 stage two** — retire `retryVariants` only after `variantOf` can express all retained relations | measured: **2** packs already author `variantOf`; those packs retain **3** `retryVariants` entries the singular relation cannot express. Needs the `variantOf` array widening before retirement |

**Why a cluster and not four rows:** all four are *authoring expressiveness* — an author can
write something the runtime cannot honour, or cannot write something the runtime would
honour. That is one subject, and the three RFCs that touched it each declined it for the same
correct reason: it was not theirs. A cluster is the destination that stops the fifth RFC
declining it too.

**Entry condition for the RFC that takes this:** it must arrive with a measured count of
authored uses per member, because two of the four (`planClassId`, D106) may have **zero**
attested wants — and the repo-s standing attestation bar (*"deferred pending one authored pack
that wants it"*, used by `engine-leverage` for `searchmoves` and by `format-surface` for
per-leg tablebase modes) would then dispose of them without a schema change at all. **Measure
before drafting.**

## 4b. Variants and foreign chess — queued 2026-08-16, deliberately not launched

Owner ideas, ledgered as **D327** (variants in Just Play) and **D328** (westernised xiangqi
and shogi). **Nothing is running on these** — the owner asked for them queued while six waves
are already in flight, and this is where they wait so they are not re-uttered as new.

**Entry condition, and it is one cheap measurement rather than a research programme:**
*where does the chess coupling actually sit?* `positionFromFen` is the single call into
chessops (`Chess.fromSetup(parseFen(fen).unwrap())`), 13 runtime files import chessops, and a
`variant` column already exists in storage. If the branch runtime-s own types are FEN-shaped
only through `Node.fen` and `transposeKey`, and both target games have FEN-like notations
(SFEN, xiangqi FEN), then the shell may be reusable and this is an adapter. If the coupling is
diffuse, D328 is a second product sharing a shell and should be said so out loud. **That
measurement decides the shape of both rows and should precede any drafting.**

**Sequencing note:** D327 tier 1 (Chess960) is the cheapest real member — same pieces, same
rules, tablebase and structural reading intact, and `UCI_Chess960` is already an advertised
Stockfish option (see **D193**). It is the natural probe for the whole cluster, because it
tests the *variant plumbing* without testing the *detector* question at all.

## 4c. Pack shape and time — queued 2026-08-16, not launched

Owner ideas: **D329** (famous-game provenance), **D330** (no time control exists), **D331**
(time as a difficulty axis that misses the power curve). Two waves are still in flight, so
these wait here rather than being re-uttered later as new.

**Ordering, and it is not the order they were raised in.** D329 is the cheapest and most
independent — a `sourceGame` object on `provenance`, one pack-schema lane, no runtime change,
and the `variantOf` precedent already shows the shape. **D330/D331 are one item, not two**, and
should not be drafted until D331 is tested: if time pressure really does degrade assistance
value continuously, it changes the coaching/cheating design that landed 2026-08-16, and a clock
built before that is a clock built against the wrong requirement.

**The entry condition for D330/D331 is an experiment, not a draft.** The claim to test is
narrow and falsifiable: *does a time constraint reduce the usefulness of an item at a given
distance-from-answer?* If it does, time is a legibility-consumption lever and belongs in
`design/05`-s ladder discussion. If it does not, a clock is only an atmosphere feature and
should be priced as such. **`design/06` §5-s refused list already contains "a pursuit clock is
a retry price by another name"** — so whoever takes this must show why a *game* clock is not
that, and the answer is not obvious.

## 5. Research — two states, and the distinction is the standing sequence

**The owner's sequence is breadth → content → ONE play session at the end.** R6, R7 and R8 are
**SCHEDULED at that session**, not blocked on anyone. They are experiential by nature and the
session answers all three at once. *Recorded 2026-08-16 because the coordinator twice described
them as "blocked on the owner", which inverts the agreed sequence and reads as a nag; the owner
had already said "stop asking for play".* Do not re-surface them as pending — they are the last
step, not a waiting one.

| # | Question | State |
|---|---|---|
| R6 | Does a rewind budget preserve or destroy punishment-free experimentation? | scheduled — the play session |
| R7 | What does assistance-as-inventory feel like when you *lack* a rung you need? | scheduled — the play session |
| R8 | Is the drill loop itself worth wrapping? | scheduled — the play session |
| R11 | The conjunction hypothesis (R3's successor) | ✅ **answered `[V]` 2026-08-16 — REFUTED** (`design/research/conjunction-hypothesis.md`, `tools/r11-conjunction-harness/`). A conjunction of two census primitives is worse than either alone on all three of R3's axes: best conjunction **35.7%** precision / **2.73×** discrimination against **69.4%** / **12.64×** for the best single primitive, only 7 of 55 pairs measurable at all, their median lift **0.66×**, and **0 of 7 beat even their own two components**. The premise fails first — given both fired, the *signals* are near-independent, so the **false positives multiply at the same rate the specificity does**. Two consequences: **loadouts are additive, not synergistic** (do not ship synergy discovery — `roguelike-run-design.md` §3 rank 6 pre-named this), and **a lens read before the move is discrimination-inert by construction**, which reclassifies the shape library's 96 signatures and boss-by-census as *selectors*. R3's 89.0% holds at **88.7%**. Successor question raised, not answered: per-move Maia policy mass as a **single** primitive (D283) |
| — | Maia's WDL vs R9's ply-≤20 ground truth | ✅ **answered `[V]` 2026-08-16 — SPLIT** (`design/research/maia-wdl-versus-human-outcome.md`, `tools/maia-wdl-agreement-harness/`). 1,475 Maia probes + 279 Stockfish depth-12 probes against **R9's committed explorer readings reused unchanged** — 5,557 human-decided move pairs, **all of them at ply 0–20**, median ply 7–8. **D236 confirmed structurally** (27,330/27,330 rows sum to 1000 by construction) and extended: `cp == win − loss` on 27,330/27,330, so **`score cp` and `wdl` are one output** and expected score = 0.5 + cp/2000 exactly (D287). **The verdict is conditional**: pooled agreement is WDL **72.2%** vs explorer play counts **76.8%** and Stockfish **84.2%** (floor 50%, measured ceiling 94–99%), so on the whole population the WDL is the weakest instrument — **but split by play-count ratio it inverts**, and where the counts are within 2× the WDL holds **65.1%** while the counts fall to 54.7% and **Maia's own policy head goes to 34.4%, worse than chance** (D288). **It does not reach**: agreement decays **81.2 → 75.3 → 68.8 → 61.2 → 47.9%** by ply bucket while Stockfish over the identical pairs is **flat** — so the decay is the instrument's, not the ground truth's — and what crosses the wall is availability only (D289). `design/06` §2a unchanged; the middlegame stays authored. By-products: path dependence (D290), a band dial that moves without moving toward the band (D291, evidence about [[D324]]), under-dispersion by half (D292), a derivable threshold at \|Δcp\| ≥ 71 costing two-thirds of the population (D293). **Returns to cluster B:** the `capabilities.ts:108` disposition flip and the duplicate `per-move score cp` row (D294) |
| — | **D333/D324: does Maia's band move the RESULT?** | ✅ **answered `[V]` 2026-08-16 — YES, at ≈0.29–0.40 Elo per band point** (`design/research/maia-band-outcome-transfer.md`, `tools/d333-band-outcome-harness/`). **16,660 complete games / 1,049,001 Maia forward passes**, 12 arms, band against band, on a 170-position book cut from the committed pack corpus; paired openings with colours swapped inside every pair, SEs clustered on the opening, **no engine adjudication of any kind**, 0 voids and 0 ply-cap terminations. **Every band gap separates down to 100 points** (1500v1600 −22.1 Elo [−31.8, −12.4], p 7.7e-06) against a same-band control at 0.4956 [0.475, 0.517] p=0.68 and a Temperature positive control at +468 Elo, with a first-ply χ² permutation audit confirming the band reached the model in the games that were counted. **D324's pre-registered ladder PASSES** (0.3069/0.4990/0.6304/0.7652, monotone, all adjacent CIs disjoint) **and settles the wrong question** — it tests ORDER, and the campaign needed SCALE (D342). The scale is the **transfer ratio: 0.289 [0.269, 0.309] over the corpus, 0.400 [0.379, 0.421] at full material** (D335). **Consequences for D332**: the stated 1000→2000 journey is worth **260.7 Elo** and the whole usable range **289.6**, against a coverage requirement of 0.714 derived from D332's own journey — **the denominator survives, its units do not** (D337); a 100-band step is real but below the ±60 resolution of a learner's own 30-game session, so the usable rung is **≈150–208 band points** and `[1000, 2400]` is five to nine rungs, not fourteen (D336). Two edges: **2000→2400 buys +28.9 Elo, CI [−16.7, 74.5], p=0.21** (D338), and **material, not phase, attenuates the dial** — −468.9 Elo at ≥21 pieces vs −72.4 at ≤10, with a 100-step unmeasurable below ten pieces (D339). Symmetric conditioning is not the cause (D343). **By-products:** Maia is seeded at `--seed 42` and the shipped ENTRYPOINT passes none, so `human_common` is reproducible *by process* (D340, correcting the reading of R5 §10); an unseeded parallel harness manufactures duplicate games and reports a zero-variance control (D341); D365's Glicko update must take the calibrated scale, never `targetElo` (D344). **One `DESIGN-GAP:`** on `design/06` §2b — the band ladder now has a magnitude and a material exception, and neither is in the doc |
| Q1b | Do target learners and coaches recognise and want the problem solved? | advisory; re-gates a public push |
| Q1c | Does rehearsal improve learning versus simpler formats? | requires the slice; cannot gate building it |
| Q6 | How do we use historical games without the ingestion-first trap? | open |
| Q9 | Branch growth, navigation, comparison overload, destructive-action mistakes | open — low-fidelity testing |

**Q1b and Q1c are the two where the thesis could be wrong**, and nothing in the 2026-08-15/16
waves touches either. They are advisory rather than blocking by an earlier ruling, but that is a
scheduling decision, not evidence that they are answered.
