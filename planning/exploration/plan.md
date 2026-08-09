# Exploration — the go/kill job

**This is the repo's entry point.** The job: decide whether the chess phase rehearsal
system (see `design/00-thesis.md`) is worth building, and in what shape. Everything else
in the repo serves the questions below.

Question status ladder:
`💡 posed` → `🔬 researching` → `📊 evidence` (dossier landed, gate statuses updated) →
`✅ settled-go` / `⛔ settled-kill` / `🔁 repositioned`

Companion files: `gates.md` (hypotheses H1–H5, kill criteria K1–K10, continuation gates
C1–C7), `log.md` (append-only record). Evidence lands as dossiers in `design/research/`.

## Question ledger

| # | Question | Status | Attached gates |
|---|---|---|---|
| Q1 | Is the integrated rehearsal loop actually novel and valuable? | 💡 | H1–H4, K1–K4, K8 |
| Q2 | Paid vs OSS vs self-hosted-only — what is the product posture? | 💡 | — (decision, evidence-informed) |
| Q3 | Mobile: scope or non-goal? | 💡 | — |
| Q4 | Is semantic phase detection / theory-to-middlegame bridging feasible to author and detect? | 💡 | K7, C6 |
| Q5 | Can Maia-3/corpus opposition stay coherent over 10–20 plies? | 💡 | H5, K5, C5 |
| Q6 | How do we use historical games without the ingestion-first trap? | 💡 | — |
| Q7 | What does a reviewed drill pack cost to author? | 💡 | K10, K7, C6 |
| Q8 | Can feedback beat "Stockfish labels + prose"? | 💡 | K6, C1 |

## Q1 — Novelty and value of the integrated loop

The brief's desk research says no free/self-hosted workflow combines conceptual opening
rehearsal, multi-move middlegame branching, and practical endgame outcomes with good UX
(`archive/brief-v2/02_MARKET_AND_EXISTING_SOLUTIONS.md`, 28-product matrix). The pieces
exist separately: Chess Endgame Training (closest endgame proof), ChessDojo sparring
(closest pedagogy), Noctie (closest paid sparring), Chessable/Listudy (opening recall).

- **What settles it:** hands-on teardowns confirming the gaps are real (not just
  undocumented features), and a working answer to "would *we* use this loop weekly."
- **Next actions** (research queue 1–4): hands-on benchmark Chess Endgame Training
  latency/branching · verify Noctie's takeback/branch persistence and feedback timing ·
  test Chessable bot-from-course-position on strategic chapters · test Chess.com
  Practice for multi-move redo and color switching.
- **Decision gate:** teardowns confirm the gap → Q1 `📊 evidence`; a product already
  does the loop well → 🔁 reposition (what's the residual value?) or ⛔.

## Q2 — Paid vs OSS vs self-hosted-only

The brief's corrected verdict scores "worth building for personal/self-hosted use" 9/10
but "ready-made SaaS business case" 5/10 — two separate questions, deliberately not
collapsed. Licensing pins part of the answer: Stockfish GPLv3, Maia-3 AGPL-3.0, Lichess
dumps CC0; a proprietary hosted product needs legal review, self-hosted OSS is largely
compatible (`archive/brief-v2/08_ENGINE_CORPUS_AND_CONTENT.md`).

- **What settles it:** owner decision, informed by a competitor pricing/positioning pass
  and the licensing item (research queue 10). Not gated on H1–H5 — but a kill on Q1
  moots the SaaS branch.
- **Next actions:** pricing/positioning pass over the paid rows of the competitor
  matrix; licensing decision for UI/chess libraries and Maia deployment.
- **Working default until decided:** build-for-self, OSS-compatible choices, no
  decision that forecloses a paid tier later.

## Q3 — Mobile

The brief excludes mobile-native from v0 three times (scope, vertical slice, non-goals);
client thinking is web-first (chessground). But the brief never examined whether the
*rehearsal loop itself* suits mobile sessions (short, repeatable, tactile) — that's a
product-shape question, not just a scope cut.

- **What settles it:** a UX prototype question — is rewind/branch/compare usable on a
  phone screen, and is mobile-web (PWA) good enough? Deferrable until Q1 shows evidence.
- **Working default:** web-first, responsive; mobile-native remains a non-goal until an
  explicit reversal here.

## Q4 — Semantic phase detection and theory-to-middlegame bridging

The "novel detection mechanisms" question. The brief's answer (`archive/brief-v2/rfcs/
RFC-0005-phase-and-trajectory-engine.md` sketch): don't infer phase from move number;
packs declare semantic boundaries, runtime supplements with deterministic features
(pawn-structure signature, material threshold, queen exchange, tablebase eligibility).
The tempo contract (`archive/brief-v2/04_OPENING_DRILLS.md`) is the sharpest mechanism:
window-open/window-close nodes + luxury-move budget, making "one slow move loses the
race" detectable and drillable.

- **What settles it:** (a) define attack-arrival/timing metrics and validate on reviewed
  Sicilian examples (queue 7); (b) determine the smallest useful deterministic feature
  set (queue 8); (c) hand-author boundaries/windows for 2–3 real packs and see whether
  encoding is tractable (feeds Q7/K7).
- **Decision gate:** timing metrics validate on real examples → `📊 evidence`; if
  authors can't encode windows without excessive custom code → K7 evidence.

## Q5 — Opponent long-horizon coherence

The acknowledged hard part: a move predictor can pick plausible single moves while
producing an incoherent 12-ply plan. The brief proposes a policy mixer (corpus
likelihood + Maia likelihood + plan compatibility + objective-preservation guard +
diversity penalty) but explicitly says: benchmark before inventing a complex planner.

- **What settles it:** evaluate Maia-3 plan coherence over 20 plies at 1600/1800/2000
  (queue 5); compare Maia-3, ChessMimic, and a corpus policy on the same positions
  (queue 6). This is the most experiment-shaped question — it needs a small harness,
  which is *research tooling*, not product code (allowed under the no-code law; log it).
- **Decision gate:** coherence acceptable on raw Maia-3 → strong go signal; acceptable
  only with the mixer → feasibility cost noted; incoherent regardless → K5 evidence,
  and H5 likely fails → the product's opposition story needs rethink.

## Q6 — Historical games without the ingestion-first trap

Corpus role per the brief: evidence and candidate spines, never automatic lessons.
Staged: Stage 0 = Lichess opening explorer API + curated PGNs (no bulk data); Stage 1 =
one streamed month with filters; Stage 2 = targeted historical slices. Causal integrity
rule for trajectories: no stitching a random endgame onto an opening without a real
transition path or explicit authored jump.

- **What settles it:** mostly settled by adopting the staged design; residual question
  is whether Stage 0 (explorer API) suffices for the first three packs' spines.
- **Next action:** none until pack authoring starts (Q7); revisit then.

## Q7 — Content-pack authoring cost

The existential cost question: if a reviewed pack takes too long to make, only a handful
will ever exist (K10). The brief's v0 scope: first packs A (Sicilian timing/move order),
B (Carlsbad or IQP plans), C (practical rook endings); 100–200 reviewed
checkpoints/claims total.

- **What settles it:** author one pack end-to-end on paper (no runtime needed): spine,
  checkpoints, tempo windows, accepted alternatives, feedback claims with evidence refs.
  Time it. Recruit a strong reviewer (queue 9) and measure correction rate (feeds C1).
- **Decision gate:** one pack authored + reviewed with a repeatable workflow →
  `📊 evidence` toward C6; cost explodes → K10/K7 evidence.

## Q8 — Feedback depth beyond the dashboard

The anti-pattern is named: "Stockfish: +0.54 / Maia: 31% play Ne5 / LLM: 'Ne5
centralizes the knight'" is a dashboard, not a drill. The brief's alternative: claims
carry evidence refs + uncertainty; timing/tempo events ("the rook move consumed the only
spare tempo") beat eval deltas.

- **What settles it:** write the feedback for one real branch comparison by hand using
  only the evidence vocabulary (features, timing events, objective states) and have the
  Q7 reviewer judge it (C1's ≥80% acceptance bar). Rides on Q4's feature set and Q7's
  pack.

## Sequencing

1. **Now, parallel-friendly:** Q1 teardowns (queue 1–4) · Q5 Maia harness (queue 5–6) ·
   Q2 licensing/pricing pass (queue 10).
2. **Second wave:** Q4 timing metrics + feature set (queue 7–8) → Q7 author pack A
   (+ recruit reviewer, queue 9) → Q8 feedback trial.
3. **Then:** synthesis into a go/kill/reposition recommendation on Q1; Q2/Q3 owner
   decisions; if go — open the first RFCs per `rfc/0000-rfc-process.md`.

## Deferred and dropped

| Item | State | Why | Revival condition |
|---|---|---|---|
| Position Arena (human vs human from curated position) | 🟡 deferred | Brief phase 5; needs matchmaking; nothing else depends on it | Product build reaches phase 5 |
| Bulk corpus ingestion (Stage 1+) | 🟡 deferred | Ingestion-first is a rejected pattern; Stage 0 suffices for exploration | Q6 revisit shows explorer API insufficient for pack spines |
| Automatic candidate-pack mining | 🟡 deferred | Brief phase 4; depends on validated manual authoring first | C6 met |
| Personal game-history pack recommender | 🟡 deferred | v1's identity error; optional recommender at most | Core product validated and shipped |
