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
- **Test design:** same positions under Maia-3 / ChessMimic / corpus policy / weakened
  Stockfish; rate branch believability and coherence over the required horizon
  (feeds exploration Q5).
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

Note the ordering: these gate **vertical slice → product build**. A separate, earlier
gate — opening RFC drafting at all — is the exploration questions in `plan.md` reaching
`📊 evidence` or better on Q1, Q4, and Q5, or an owner ruling. (The brief assumed a
vertical slice would be built to test H1–H5; whether to build even that slice is
exploration's first real decision — see plan.md Q1.)

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
