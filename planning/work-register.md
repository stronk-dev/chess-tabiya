# Work register — every open item has a destination

**Why this file exists.** 2026-08-15 produced eleven landed waves, nine research
dossiers and ~50 new defects. The owner's concern is the right one: *"make sure ALL
of it is properly queued so we don't lose it or defer it."* The ledger holds the
findings; this file holds the **routing**. Every open defect appears exactly once,
with a destination. A row with no destination is a bug in this file.

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
runs alongside whichever wave has room.

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

**E. Dead and no-op vocabulary.** D84 (`arrows` fully plumbed, no renderer), D85
(`SIMULATE_BUDGET_EXCEEDED` declared, never thrown), D86 (`retryVariants` has no
runtime effect), D39, D40, D57, D59.

**F. Content fixes — a content wave, not an RFC.** D75 (`rook-4v3-same-side`'s
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
| Teacher mode: defer with the stated trigger, or scope it | `broadcast-and-teacher-surfaces.md` |

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
`rfc/format-surface.md` — drafted after the question was written — owns and implements it at
pack 0.25.

**This cluster is the other half, and it exists so the remainder has a name rather than a
wave.** Members:

| Item | State |
|---|---|
| **`deviation.planClassId`** — ranked beside D96 by the completeness audit; additive; no register row owns it. `format-surface` names it and explicitly does **not** take it | unowned, **clustered here** |
| **D105** — a `retryVariants` note names a pack that does not exist, and nothing can see it | unowned |
| **D106** — `targetElo` accepted beside `strong_engine` and silently dropped; `format-surface` scoped it out by name | unowned |
| **D127** — the shape library can author a plan success signature the pack layer refuses to grade on | unowned |

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

## 5. Research still open

R6, R7, R8 (experiential — rewind budget, scarcity, whether the loop rewards
wrapping) · R11 (the conjunction hypothesis, runnable on the existing R3 harness) ·
Q1b, Q1c, Q6, Q9 · validating Maia's WDL against R9's ply-≤20 ground truth.
