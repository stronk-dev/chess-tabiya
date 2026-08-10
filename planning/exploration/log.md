# Exploration log (append-only)

## 2026-08-09 (claude, session 1) — entry zero

- Reorganized the repo from a single frozen brief package into cloud-clicker-style
  tiers, tuned for the exploratory phase. Decisions made with owner:
  - Full seed: structure + BACKLOG ledger + gates + three re-cut design docs.
  - The brief's RFC-0001..0008 and ADR-0001..0006 stay design-tier in `archive/`;
    `rfc/` Active table starts empty by rule (exploration gate in RFC-0000).
- `archive/brief-v2/` verified at import: 58/58 checksums OK, 0 failures.
- Seeded `plan.md` with Q1–Q8 (owner's stated concerns: novelty, paid vs OSS, mobile,
  UX, modern engines, phase detection feasibility, branching feasibility, historical
  games) and distributed the brief's 10-item research queue across them.
- `gates.md` lifted from `archive/brief-v2/14_VALIDATION_AND_KILL_CRITERIA.md`
  unchanged in substance; added the observation that H1–H5 testing presupposes a
  vertical slice, so "build the slice at all" is itself exploration's first decision.
- Next: Q1 hands-on teardowns and Q5 Maia coherence harness are the highest-signal
  starting points (see plan.md §Sequencing).

## 2026-08-10 (codex, review corrections)

- Reconciled the contradictory RFC gate: E1–E5 now gate the first experimental vertical
  slice; C1–C7 gate slice→product. Scoped disposable research harnesses and UX prototypes
  are explicitly allowed before an RFC.
- Split Q1 into competitive novelty (Q1a), learner/coach problem value (Q1b), and learning
  effect (Q1c), so teardowns cannot stand in for demand or transfer evidence.
- Reframed Q2 as four independent axes: source model, deployment, monetization, and
  content/data rights. Copyleft obligations constrain combinations but do not imply
  "cannot charge."
- Split phase work into author-declared transitions (Q4a), detector assistance (Q4b), and
  optional full automation (Q4c); automatic phase detection is no longer load-bearing for
  curated v0.
- Corrected Chessformer from "Maia alternative" to Maia-3 architecture. Q5 now compares
  runnable policies with identical positions/seeds, blinded review dimensions, resource
  measurements, and a weakened-Stockfish control.
- Added Q9 for branch/rewind/compare comprehension and branch growth. Expanded Q6 to test
  Stage-0 corpus coverage, bias, provenance, and separate rights for moves, annotations,
  metadata, weights, and derived data.
- Clarified the evidence convention: `[V]/[P]/[M]` are lightweight combined evidence
  labels; legal risk is separate; research claims may cite living/archive sources as well
  as URLs. No gate status changed—these are protocol corrections, not new evidence.
- Next: execute the revised first wave in `plan.md` §Sequencing and preregister concrete
  thresholds before changing E1–E5.

## 2026-08-10 (claude, session 1 continued)

- **Owner direction on Q2 (posture):** open source and free if built; self-hosted on
  the owner's home servers; browser-run engines (WASM) where possible; agents on a
  self-hosted LLM or cheap provider. No paid SaaS; no phase fragmentation. Recorded in
  `plan.md` Q2; source-model and content-rights axes remain open.
- **DESIGN-GAP escalated — target band:** owner stated the goal as "take a ~1000 player
  to >2000" (stop blundering, great-over-ok moves, applying strategy, reading opponent
  move intent). `design/00-thesis.md` and the archive scope the initial fit at
  1400–2200, explicitly *past* the blunder stage, and exclude a beginner tactics
  curriculum. Options for the owner: (a) widen scope to include a blunder-stopping/
  board-vision layer; (b) keep the 1400–2200 core and treat 1000–1400 as guided
  on-ramp packs (shorter branches, opponent-intent prompts); (c) accept that the
  1000→~1400 leg is mostly tactics volume served well by existing free tools, and our
  product owns the 1400→2000 leg. Thesis unchanged pending ruling.
- **Dossier landed:** `design/research/competitor-value-props.md` (adopt/conflict/
  not-relevant per competitor; 3 claims upgraded to [V] — WhyThisMove, Noctie, Chess
  Endgame Training). Notables: CET is an MIT PWA proving the free/browser posture
  feasible; WhyThisMove's LLM sidebar confirmed but cloud-routed (OpenRouter) — we
  need a local-LLM path; Noctie's per-move color labels are the ADR-0006 anti-pattern;
  Lucas Chess is the cautionary "free integrated but fragmented mode menu" case;
  DecodeChess possibly defunct (403) — explanation-without-drilling may not retain;
  chessfeed.ai's claimed saved-branch exploration overlaps our core mechanic,
  unverified → added to Q1a verification queue.
- **New ledger rows** (owner ideas): LLM concept-anchoring agent for responsive
  trajectories (retrieval anchors, LLM narrates — inside ADR-0005); position/structure
  embeddings; opponent-intent prompts; browser-run engines.
- Next: unchanged (first wave per `plan.md` §Sequencing) + owner ruling wanted on the
  target-band gap.

## 2026-08-10 (claude, session 1 continued — 2)

- **DESIGN-GAP resolved (target band), owner ruling:** option (b) adopted. Thesis
  amended: the product serves the ~1000→2000+ journey — core band 1400–2000+ as
  designed; 1000–1400 via on-ramp packs (same pack object, three knobs: 2–8-ply
  branches, pack-declared immediate blunder-guard overriding the ADR-0006 default,
  principle/threat objectives; opponent-intent checkpoints first-class). Explicitly
  not a tactics trainer. Note for the future drill-pack RFC: the pack format needs a
  per-pack feedback-policy field.
- **New ledger rows:** on-ramp pack lane (📐 at thesis level); anti-opening packs
  (💡) — owner's lived example: White facing the Caro-Kann Advance (3.e5 enticing but
  hard; c5/f6 breaks, Tal Variation 4.h4). Repertoire trainers drill *your* side of
  *your* openings; nothing drills facing an opening the opponent chose. Candidate
  first pack, owner can dogfood. Four owner-supplied demand-signal sources added as
  R46–R49 (`[P]`, unfetched).
- Observation for Q7: the anti-Caro-Advance pack is a strong pack-A alternative or
  companion — move-order/timing sensitive like the brief's Sicilian candidate, but
  backed by the owner's own recurring pain, which makes review and dogfooding cheap.

## 2026-08-10 (claude, session 1 continued — 3)

- **New ledger row (owner idea): prediction checkpoints** — flip the board at pivotal
  moments, predict the opponent's reply, explain why/why not. Assessed as a checkpoint
  interaction (cheap), not a new mode (expensive); graded against Maia's
  level-conditioned distribution + engine validation, which no surveyed competitor
  does. Sparse placement rule to protect the uninterrupted-consequence stage;
  board-flip ergonomics assigned to the Q9 prototype.

## 2026-08-11 (claude, session 1 continued — 4)

- **Gap sweep at owner request** ("what else is open before we can judge feasibility/
  novelty/value?"). Five untracked areas added to BACKLOG: skill/progress model +
  return loop; time-pressure dimension; pack interop (Lichess-study→pack conversion as
  a K10 lever); open pack format as the ecosystem contribution; small-n evaluation
  methodology (the existing H/C validation design assumes cohorts we won't have —
  must be resolved before preregistering E-gate thresholds).
- Open owner decision points enumerated for the record: Q2 source-model + content-
  rights axes (concrete license choice); first-wave sequencing commitment; E-gate
  threshold preregistration; pack-A choice (Sicilian vs anti-Caro-Advance); vertical
  slice scope (does it include on-ramp/prediction-checkpoint machinery or core loop
  only — recommendation: core loop only).

## 2026-08-11 (claude, session 1 continued — 5)

- Q1a moved from 💡 to 🔬: wrote `design/research/teardown-protocols.md` — four
  hands-on protocols (Chess Endgame Training, Noctie, Chessable, Chess.com Practice),
  each 30–60 min, testing our five loop stages + latency budgets against observed
  behavior, with a cross-product synthesis table that lands the E1 verdict. The
  feature/strengths desk pass is NOT being repeated — the matrix and value-prop
  dossier already cover it; teardowns exist to upgrade [P]→[V].
- Division of labor: CET needs no account (agent-drivable via browser automation with
  owner's setup, or owner-run); Noctie/Chessable/Chess.com need owner accounts —
  owner runs protocol, agent lands the dossier from notes/screenshots.
