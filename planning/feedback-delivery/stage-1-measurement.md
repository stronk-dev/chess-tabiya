# Feedback delivery — Stage 1 starting measurement

Measured: 2026-08-21 recovery run (deterministic event timestamps remain 2026-08-17). Predicate: the `admittedFeedbackClaimIds` and `projectAuthoredFeedback` implementation landed at `a64e6c5`.

- Claim-bearing packs: 50.
- Claims: 98/196 admitted; 26735/61531 characters admitted.
- Admission-withheld by evidence policy: 98/196 claims; 34796/61531 characters.
- Derived-feature-only explicit self-declared population: 31 claims / 11256 characters.
- Walkthrough populations: single-line 19; learner-branch 14; opponent-branch 17.
- Exhaustion predicate reached: 50/50 packs (100.0%): single-line 19/19; learner-branch 14/14; opponent-branch 17/17.
- Structurally unreachable under C1 because the objective terminates before full-spine coverage: 0 packs / 0 claims (0 otherwise admitted): none. These are failures of predicate reach, not harness exclusions.
- Claim delivery observed after exhaustion: 32/50 packs; 69/98 admitted claims / 18290/26735 admitted characters.
- Admitted but timing-withheld after exhaustion because no released reveal occurrence remained: 29/98 claims.
- Walkthroughs with an authored outcome event: 6/50.
- Last-event `hasWithheldAuthoredContent`: before claim delivery 30/50; after 30/50.
- Opponent-branch method: each authored reply is supplied as the recorded output of the pack's configured opponent policy on a separate rewind attempt; no opponent-dependent pack is silently excluded.

## Same-tree authored-fork strip measurement

- Fork sets: 44/44 measured (skipped 0); column plies past forks: 473.
- Unfiltered candidates: 4029; admitted after CR1: 3463 (86.0%); entries per ply: 7.32.
- Plies with at least one admitted entry: 460/473 (97.3%).
- Admitted entries per fork set: median 72; mean 78.7; max 344.
- Lift = (played-move firing rate) / (within-position mean share of quiet alternatives that also fire): 1.017x; quiet-alternative mean 95.7%.

## Preserved false start

The first instrument gave every column exactly one ply past the fork and reported N=2 23/23, N=4 43/43 and N=8 79/79 admitted (100.0% each). Criterion 16 appeared to reopen CR1. D526's diagnosis proved that construction made common/candidate overlap effectively impossible; these numbers are retained as an instrument failure, not erased.

## Corrected multi-ply construction

Each distinct opener continues deterministically to eight plies through the shipped runtime.

- CR1 N=2: 8/116 entries admitted (6.9%).
- CR1 N=4: 22/229 entries admitted (9.6%).
- CR1 N=8: 70/450 entries admitted (15.6%).

N=8 is below criterion 16's 90% reopening threshold. CR1 remains admitted; this is a volume result, not a quality claim.

Criterion 2a is **vacuous at Stage 1**: the validating bound set is the single Philidor claim.
