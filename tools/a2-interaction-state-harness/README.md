# A2 interaction-state correctness harness

**Disposable exploration instrument.** This repairs the measurement shape behind D537-D541 and
K9. It does not change product CSS or chessground integration.

## Predeclared method

Run a clean committed build containing the six served endgame packs. At each of five viewports
(1440×1000, 1366×768, 1280×720, 768×1024 and 390×844), open every pack in a fresh run and exercise:

- `stale_click`: compute both square centres at rest, then click them — the old probe shape;
- `live_click`: select the origin, remeasure the drawn board, then click the drawn destination;
- `live_drag`: remeasure the drawn destination after pointer-down;
- `touch_live`: tap origin, remeasure, tap the drawn destination in a touch-enabled context;
- `resize_recovery`: select, dispatch `resize`, remeasure, then click; and
- `hover`: hover the origin without selecting or moving.

For every move gesture the instrument:

1. independently verifies the pack's intended UCI is legal from its declared start FEN;
2. computes orientation-aware coordinates from the live `cg-board` rectangle;
3. records the board displacement, selected-square marker, caption size, and hit-test result;
4. captures the exact `uci` sent in the first player `POST /runs/:id/moves` request; and
5. compares that UCI with the authored move. It does not infer success from “some ply happened.”

The stale-coordinate arm is a negative control: if it succeeds while live-aim fails, probe and bug
share the same cached geometry, which is D539 rather than product correctness. Hover must submit no
move and must not change board geometry. `resize_recovery` tests the previously observed cache-
invalidation control; it is not a proposed UX.

## Run

Prepare and serve a clean tree with `tools/k9-endgame-latency-harness/rerun-2026-08-17.sh`, then:

```sh
node tools/a2-interaction-state-harness/run.mjs \
  http://127.0.0.1:4182 /tmp/tabiya-a2/packs
```

The output records commit, viewports, pack IDs, intended/submitted UCI, source and destination
hit tests, and every geometry check. Source hit testing was added after the first complete matrix
showed that compact-phone rows could not enter selected state; it diagnoses that observed failure
and is not part of the predeclared outcome test.
