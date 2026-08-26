# Semantic collectors promotion race — D963/D1699/D1700 author repair

**Target:** `rfc/semantic-collectors.md` §3.7 and the shared provider-source/F1 RFC created from
`planning/bounded-policy-targets/author-repair-2026-08-26.md`.

**Authority:** `design/research/promotion-race-contract-closure.md` and
`tools/d1699-promotion-race-contract-harness/`. No owner ruling is required. Do not implement the
held ids from this handoff. Amend, cross-review and observe dependency order.

## Semantic-collectors amendment

### Geometry (`derived.pawn.promotion_race_geometry@1`)

- Replace raw-FEN/recomputed inputs with one literal derivation input:
  `rules.pawn.reading.contacts@1`.
- Require a declared/sealed item; join every participant to `passed: true` by exact color, square
  and pawn role. Parse only that retained item's FEN.
- Keep only opposing passed pawns with clear forward paths; preserve side to move, path, initial
  double-push use, arrival moves/ply, ties and `race-arrival@1`.
- Rename `blocked_or_capturable_path_outside_convention` to
  `no_opposing_passed_clear_paths`; the old phrase claims safety from arbitrary pieces that the
  convention does not compute.
- Use the literal row in the dossier: `position_rules/convention/not_applicable`, fact-only,
  inspector-only.
- Permanent false-positive: a2 versus b7 in
  `4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1`.
- Preserve a2 versus h7 arrival plies 9/10 and D909's geometric-outcome inversion.

### Outcome (`derived.pawn.promotion_race_tablebase@1`)

- Add `rules.mobility.reading.legal_moves@1`; immediate-promotion and check operands cannot be
  sourced from geometry/tablebase alone.
- Literal `anyOf` members are exactly:
  1. geometry + legal moves + `recorded.tablebase.result@1`;
  2. geometry + legal moves + `live.syzygy.position_result@1`.
- Geometry, legal map and tablebase source must carry byte-equal canonical full FEN. Cross-position
  same-piece-count input is an invalid join.
- Keep `not_applicable` confidence and the exact tablebase source as sole outcome authority.
- Preserve provider/outside-domain/input abstentions; never map them to refuted, empty or draw.
- Do not implement this id before the live source and projection-effective metadata land.

## Shared provider-source/F1 amendment

- Add `live.syzygy.position_result@1` beside the Stockfish/Maia generic receipts:
  request FEN, source/endpoint identity, retrieval time, request/response digests and parsed
  `TablebasePosition`.
- One constructor must serve direct probe and queue-backed evidence; name a real composition/caller.
- Add projection-effective execution metadata. Producer availability/latency remain the producer's
  own operation defaults; compiled projection alternatives retain their input requirements and
  effective latency, plus a worst case.
- Mixed-provider fixture: `derived.pawn` geometry resolves `[sync]`, tablebase resolves
  `[sync, interactive]`; neither changes the other.
- Apply the same correction to `derived.bounded_target` rather than marking all five outputs local
  or provider.
- Add confidence/availability/latency tests across every `anyOf` member.

## Acceptance additions

- port all six disposable arms;
- declared-input forge/cross-FEN/cross-source/piece-count-only negatives;
- recorded and live same-position positives;
- source absent, outside domain and geometry absent remain distinct;
- geometry payload has zero outcome words;
- D909 population and disagreement rows reproduce through production declarations;
- compiled source graph is set-equal to the literal members above;
- application/source census names the actual live operation;
- semantic catalogue reaches 14/14 only after both ids compile and execute;
- RFC closeout flips D963/D1699/D1700 only to the degree actually shipped and appends the required
  exploration log entry.

## Refusals

- no raw-FEN recomputation beside declared pawn evidence;
- no one-sided `promotion_pressure@1` used as the complete two-runner population;
- no “capturable path” claim beyond enemy-pawn passage convention;
- no FEN-less or piece-count-only Syzygy join;
- no private pawn-specific tablebase source;
- no provider absence as a chess result;
- no producer-wide latency lie in either direction;
- no geometry-as-outcome, recommendation, plan or move grade.
