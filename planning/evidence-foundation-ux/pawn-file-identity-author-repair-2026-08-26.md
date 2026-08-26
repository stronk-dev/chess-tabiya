# D1728/D1729 exact pawn-file identity — author handoff

**Inputs:** `design/research/isolated-doubled-pawn-identity.md` and
`tools/d1728-pawn-file-identity-harness/`.

## Required contract

1. Derive one exact per-file group reading from `pawnConnectivityReading`; retain all pawn squares,
   adjacent occupied files, island identity and color-relative front/rear ordering.
2. Derive an exact before/after event from the group reading and source edge. Its signs include
   `membership_changed`; truth-preserving membership changes cannot disappear as `preserved`.
3. Replace the false v1 “identity-preserving” claim for isolated/doubled events by versioning or an
   explicit rich derivation. Do not weaken the global identity promise to fit two poor payloads.
4. Keep weakness, value, target, plan, intention and move grade outside both projections.
5. Preserve current file predicates and authored expression truth until a separately reviewed
   semantic migration requires otherwise.
6. Bind D1711 validation, D1718 exact-subject denominators and D1710 packet emission before any
   learner/Review/bot/style activation.

## Frozen measurements

- isolated file rows → exact pawns: 163→180 authored, 369→408 imported;
- multi-pawn isolated files: 17/163 and 39/369; every one also doubled;
- doubled rows → exact pawns: 98→196 and 180→360; no tripled corpus case, synthetic tripled
  positive required;
- identity-only changed groups: 18 authored, 9 imported;
- cross-subject changed groups: 28/77 authored, 49/109 imported.

## Able-to-fail fixtures

1. Set-equality against both v1 predicate truth sets over both fixed populations.
2. Doubled+isolated `c3,c4` retains both pawns and both booleans.
3. Tripled `c3,c4,c5` retains all three; a two-slot schema fails.
4. A capture that changes a stationary adjacent file names the affected pawns, not the mover.
5. A group membership change with unchanged boolean emits `membership_changed`.
6. A renderer or module that says “weak/bad” from the source record fails.
7. Removing legacy ordinary rendering leaves author predicate results and content digests stable.
