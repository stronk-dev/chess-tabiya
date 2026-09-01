# Phase-band value-authority amendment — 2026-09-01

## Input

`design/research/phase-band-and-abstention-contract.md` closes [[D2484]]'s research arm over 804
legal authored positions. The draft value-authority RFC already owned `rules.phase.reading@2`, but
its proposed “retain the current `PhaseReading` payload” would have preserved the measured defect.

## Author amendment

- `rules.phase.reading@2` now carries `PhaseBandReadingV2` rather than the old payload.
- The payload retains FEN, phase, material and undeveloped-minor operands; replaces prose provenance
  with registered `phase-bands@1`; and carries one of five exact decision arms.
- Selected bands carry one boundary and `marginInsideBand`; transition gaps carry both adjacent
  boundaries and positive distance to each.
- The factory computes phase and decision together from one FEN. Callers cannot supply phase,
  reason, margin, boundary or output payload.
- Margin is threshold sensitivity only. Probability, accuracy, move-distance, opening identity and
  provider availability are explicitly out of scope.
- The unlanded `@2` changes in place. No immediate `@3` is created.

## Executable author check

`make evidence-value-authority-author-contract` now requires all five literal arms, their distinct
distance fields, one-operation computation, able-to-fail boundary pairs and the refusal text. It
also fails if the stale byte-compatible/current-`PhaseReading` language returns.

The RFC remains draft and dependency-blocked. This author amendment is not acceptance and
authorizes no production code before the existing fresh independent buildability review.
