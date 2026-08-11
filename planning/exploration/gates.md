# Gates — hypotheses, kill criteria, continuation gates

Lifted from `archive/brief-v2/14_VALIDATION_AND_KILL_CRITERIA.md` into tracked form.
Statuses change only with evidence linked from `design/research/` or a logged owner
ruling; every change gets a `log.md` entry. Thresholds are provisional and must be
preregistered before a formal test.

What must be tested: not that engines work, but that **whole-sequence rehearsal plus
rewind adds value**.

## Core hypotheses

### H1 — Opening continuation

- **Statement:** Players who drill a line through its first characteristic middlegame
  decision understand and execute the opening better than players who stop at line recall.
- **Test design:** move-order-sensitive Sicilian pack; compare line-recall baseline vs
  continuation drill; measure immediately and after delay on a related position.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H2 — Branch comparison

- **Statement:** Playing two alternatives produces better explanation and later choice
  than viewing two engine principal variations.
- **Test design:** same position, played-branches condition vs two-PV viewing condition;
  measure explanation quality and later choice.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H3 — Whole-segment replay

- **Statement:** Redoing 8–20 plies improves timing and plan execution more than
  retrying only the critical move.
- **Test design:** quiet structural pack (Carlsbad or IQP); full-segment replay vs
  one-move retry; measure timing-window failures and plan execution.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H4 — Outcome drilling

- **Statement:** Repeated conversion/hold/save play improves outcome rate on related
  endgames more than solving key-move puzzles.
- **Test design:** rook-endgame outcome pack; full play-out vs key-move puzzles;
  measure conversion/hold/save rate across variants.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H5 — Human opponent model

- **Statement:** Corpus/Maia opposition creates more believable and useful branches
  than weakened Stockfish.
- **Test design:** same reviewed positions and deterministic seeds under Maia-3 variants /
  ChessMimic if runnable / corpus policy / weakened-Stockfish control. Reviewers are blind
  to policy identity and score plan continuity, tactical sanity, objective relevance,
  diversity, and human plausibility over 10–20 plies; the harness also records latency,
  memory, failures, and variance (feeds exploration Q5).
- **Status:** untested · **Evidence:** — · **Verdict:** —

## Kill criteria

**Do not kill because paid products exist.** Kill or radically reposition when evidence
shows any of the following. Evidence for a kill criterion is logged and escalated, never
rationalized away.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| K1 | Opening mode collapses into ordinary spaced repetition | open | — |
| K2 | Users rarely continue past the book boundary | open | — |
| K3 | Users ignore branches and simply restart | open | — |
| K4 | Branch comparison does not improve understanding over engine lines | open | — |
| K5 | Maia/corpus opponents produce incoherent plans over the required horizon | open | — |
| K6 | Explanations remain generic despite curated packs | open | — |
| K7 | Authors cannot reliably encode timing and structure without excessive custom code | open | — |
| K8 | Full-segment replay does not transfer to related positions | open | — |
| K9 | Endgame mode is not materially faster or more usable than Chess Endgame Training | open | — |
| K10 | Pack production cost is so high that only a handful can ever exist | open | — |

## Exploration-to-slice gate

The first experimental vertical-slice RFC may open when all of the following have reached
`📊 evidence` or better, or when an owner ruling explicitly accepts the remaining risk:

| # | Gate | Owned by | Status | Evidence |
|---|---|---|---|---|
| E1 | Competitive teardown confirms meaningful integrated-loop whitespace | Q1a | **met** (owner ruling 2026-08-12: desk evidence sufficient; reopen if contradicted) | `design/research/teardown-cet.md`, `teardown-noctie-desk.md`, `teardown-chessable-desk.md`, `teardown-chesscom-desk.md` |
| E2 | Target learners/coaches recognize the problem and choose the rehearsal loop over plausible alternatives in interview or low-fidelity tests | Q1b | **advisory** (owner ruling 2026-08-12: not slice-blocking for a personal OSS build; re-gates any public push) | — |
| E3 | Authors can declare useful opening→middlegame boundaries and timing windows without automatic phase detection | Q4a, Q7 | unmet | — |
| E4 | At least one runnable opponent policy produces sufficiently believable multi-ply resistance for a slice | Q5 | unmet | — |
| E5 | ~~Low-fi prototype before UI~~ **waived by owner ruling 2026-08-12 ("A")**: comprehension is answered by use in the drill-client slice, iterating the real UI | Q9 | **met by use, qualified**: fork/rewind passed; compare selection, app-shell fit, and missing instructional layer define the follow-up | `planning/drill-client/log.md`, `rfc/drill-client.md` |

**Owner override 2026-08-12** (logged): RFC drafting opened with E1 met, E2 advisory, and E3/E4/E5 accepted as in-flight risk — their experiments run during implementation as validation (E3 inside the pack-format RFC via pack A; E4 via the Maia-harness before the opponent-worker RFC; E5 via low-fi prototype before the UI RFC). This gate originally decided whether the vertical slice was worth specifying. It does not
claim that the learning hypotheses are proven. Disposable research harnesses and UX
prototypes may be created before it under `rfc/0000-rfc-process.md` §Exploration gate.

## Continuation gates

Continue from vertical slice to product build when all of:

| # | Gate | Status | Evidence |
|---|---|---|---|
| C1 | ≥80% of reviewed feedback statements accepted by strong reviewers without material correction | unmet | — |
| C2 | Users complete and compare branches in a majority of Plan Drill sessions | unmet | — |
| C3 | Second-attempt objective performance improves meaningfully | unmet | — |
| C4 | Delayed related-position performance beats the baseline format | unmet | — |
| C5 | Opponent coherence judged acceptable for ≥80% of branches | unmet | — |
| C6 | Pack authors can create a reviewed pack with a documented, repeatable workflow | unmet | — |
| C7 | Endgame restart and response latency feel effectively instant | unmet | — |

These gate **vertical slice → product build**. They are deliberately later than E1–E5:
the brief assumed a slice would be built to test H1–H5, while E1–E5 decide whether
building that slice is justified at all.

## Success metrics (measurement vocabulary for the above)

- **Learning:** second-attempt objective achievement; related-position performance;
  timing-window failure reduction; endgame conversion/hold/save rate across variants;
  ability to state the correct plan without engine terms; retention after several days.
- **Product:** % of users who fork ≥1 branch; % who compare branches; useful replays
  before abandonment; time from pack selection to first move; restart/rewind latency;
  session completion; voluntary return to the same concept.
- **Content quality:** coach agreement with objective and accepted alternatives; factual
  error rate in feedback; frequency of "both moves fine, explanation forced" cases;
  opponent coherence rating; manual fixes per generated candidate pack.
