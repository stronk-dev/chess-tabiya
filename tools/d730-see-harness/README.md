# D730 legal-exchange probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** This harness tests the prerequisite
behind D730/D733/D734/D741 before an RFC chooses an implementation.

The candidate convention is `legal-exchange@1`: after a specified legal capture, both sides may
either stop or make a legal recapture on the same destination square. Each side chooses the branch
that maximizes its own material balance under P=1, N=3, B=3, R=5, Q=9; promotion adds the promoted
piece minus the pawn. The search ends when a side declines or no legal recapture exists.

This is a local exchange convention, not Stockfish evaluation, centipawns, a forced line, or a
claim that the capture is good. Because it enumerates legal moves, pinned recapturers and illegal
king captures are excluded; X-ray recapturers appear after the front piece leaves. It deliberately
ignores zwischenzugs, checks elsewhere, positional compensation and every reply away from the
exchange square.

Predeclared downstream probes:

- `moved_piece_en_prise`: after the played move, the opponent has a legal capture of the moved
  piece whose `legal-exchange@1` result is positive;
- `meaningful_fork`: the moved piece has at least two distinct enemy targets for which its own
  legal capture is positive, with a directly checked king admitted as a target;
- `geometry_fork`: the same moved-piece target count without the exchange filter, retained as the
  control the research is intended to disagree with.

The instrument must contain winning, losing, X-ray and pinned-recapturer fixtures; it must find at
least one position where geometry and the exchange convention disagree; and it reports runtime
plus played-vs-legal-alternative lift on the same authored and sealed imported populations as D723.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d730-see-harness/vitest.config.ts
```

The run writes `output.md`.
