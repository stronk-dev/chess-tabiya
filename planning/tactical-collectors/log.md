# Tactical collectors implementation log

Append-only.

## 2026-08-22 — accepted and implementation opened

- Owner accepted the repaired 30-projection research/inspector collector contract after the
  D730/D794 falsification passes and independent Codex buildability review.
- Implementation is bounded to the ten normative production sites plus tests, measurement tooling
  and docs. No schema, content, module, preset, workflow or authorable-vocabulary change is allowed.
- D743, learner-facing promotion and the breadth successor remain explicitly outside this wave.

## 2026-08-22 — exchange/reply/capture foundation checkpoint

- Implemented `legal-exchange@1` as legal recapture-only minimax with the full visited branch tree,
  chosen line, stop decisions, promotion gain and convention units. Permanent controls cover free,
  poisoned, X-ray, off-line pin, along-ray capture-of-pinner, illegal king recapture and promotion.
- Added one exact reply-breadth authority, exact checker/king/ray identities, exchange-filtered
  double attacks, bounded fork survival with literal refuting replies, and pass-convention threats
  with in-check abstention and cleared en-passant state.
- Retained generic capture identity including en passant and repaired the reading plane to accept
  both castling UCI encodings.
- Registered 7 of the RFC's 30 projection identities. The compiled manifest is now 23 producers,
  133 projections, 25 consumers, 179 bindings and 37 semantic events/eligibility rows. Every new
  event remains research-only; threat/fork predicates are inspector-only and no learner module or
  setting was added.
- F1 rejected the RFC's rules-plane derivation contradiction (D827); the identity moved to
  `derived.tactic.fork_survives_reply@1`. D828 records the validation-count sites A1 necessarily
  moves. Focused result: 90 tests green, runtime typecheck green, manifest and semantic checks green.

## 2026-08-22 — castling family checkpoint

- Added exact per-color/wing rights state, current-legality readings with named check/blocked/attacked
  squares, and permanent rights-loss events with `king_moved | rook_moved | rook_captured | castled`
  causes. The split prevents transient illegality from being presented as permanent loss and never
  infers that a player intended to prevent castling.
- Registered 10 of 30 RFC projections. The compiled manifest is now 24 producers, 136 projections,
  25 consumers, 180 bindings and 38 semantic events/eligibility rows.
- Focused result after the second checkpoint: 93 tests green, runtime typecheck green, manifest and
  semantic checks green.

## 2026-08-22 — first middlegame breadth checkpoint

- Repaired the lossy Maia boundary with sibling `human.maia.candidate_wdl@1`: reported candidate
  triples round-trip with move/rank identity, responses without WDL declare absence, and the
  projection remains inspector-only rather than becoming another learner-facing quality score.
- Added legal-exchange-backed loose-piece state. Every non-king opponent piece retains its legal
  capturers, geometric defenders, per-capture exchange tree and separate `enPrise`, `loose` and
  `underDefended` flags; the ceiling remains a local convention fact, not a move grade.
- Added ordered ray state for absolute pins, relative pins, skewers and attack/defence X-rays. The
  slider, blocker, target, complete ray and any exact convention-value comparison survive; the
  lifting-the-slider regression is a permanent negative fixture and no delta event was invented.
- Added `development@1` state and transition evidence. The reading retains role-matched home-minor
  identities; transitions distinguish leaving home (`gained`) from returning (`lost`), while a
  knight on a bishop home square and capture of a home minor are hard negatives. The existing
  role-agnostic phase-band count remains unchanged and its divergence is explicit in the manifest.
- Registered 15 of 30 RFC projections. The compiled manifest is now 24 producers, 141 projections,
  25 consumers, 181 bindings and 39 semantic events/eligibility rows. WDL, loose-piece and ray
  readings remain inspector-only; only the literal development transition joins research selection.
- Focused verification: 40 runtime/semantic tests and 56 affected server/web contract tests green;
  runtime typecheck, manifest check, semantic check and diff hygiene green. No repository-wide
  verification was run for this incremental checkpoint.

## 2026-08-22 — three authoring seams returned, remaining implementation continues

- D829: `space@1` claims a chess-tradition citation that the accepted RFC does not actually carry.
- D830: pawn connectivity never defines how “mutual” support differs from literal one-way pawn
  support, so its pair/chain payload is not implementable without inventing a convention.
- D831: rook-on-seventh retains a king-cutoff fact but never defines the cutoff predicate.
- These three projections are held for an author amendment. They do not block capture
  classification, discovered geometry, trapped/back-rank/mate, promotion pressure or the
  already-defined loose-piece event work.

## 2026-08-22 — derived capture and exact mate checkpoint

- Added `derived.exchange.capture_class@1` as a sealed two-input derivation: the exact capture
  event and the exact `legal-exchange@1` tree must both be present. The resulting
  `positive | equal | negative` value is convention arithmetic, explicitly not a move grade.
- Added a separate exact `mate_in_one@1` reading that enumerates all legal immediate mates and
  retains mover and mated-king identities. It is inspector-only and cannot be inferred from, or
  silently merged into, the later conventional back-rank-susceptibility state.
- Registered 17 of 30 RFC projections. The compiled manifest is now 25 producers, 143 projections,
  25 consumers, 182 bindings and 40 semantic events/eligibility rows.
- Focused verification: 92 affected runtime/server/web tests green; runtime typecheck, manifest
  check, semantic check and diff hygiene green. No repository-wide verification was run.

## 2026-08-22 — discovered-geometry state checkpoint

- Added `rules.tactic.reading.discovered_latency@1` over the already-shipped vacation-ray source.
  It retains the friendly screen, friendly slider, enemy target, full ray, discovered-check flag
  and positive local-exchange tree where applicable. An enemy blocker is a hard negative.
- The projection describes latent geometry only: it does not claim the screen should move, that
  every destination exposes the ray, or that the relation is important. Learner and bot admission
  therefore remain downstream measured decisions.
- Registered 18 of 30 RFC projections. The compiled manifest is now 25 producers, 144 projections,
  25 consumers, 182 bindings and 40 semantic events/eligibility rows.
- Focused verification: 72 affected runtime/server/web tests green; runtime typecheck, manifest
  check, semantic check and diff hygiene green. No repository-wide verification was run.

## 2026-08-22 — trapped and back-rank convention checkpoint

- Added `trapped@1` with the full disclosed local proof: positive opponent captures on the
  current square, every legal destination, capture-destination exchange values and positive
  opponent captures after quiet relocation. In-check positions abstain; immobility alone and the
  RFC's profitable `RxQ` escape do not fire.
- Added `back_rank_susceptible@1` with king identity, every non-back-rank escape and its exact
  own-blocker/attacker reasons, plus enemy heavy-piece access mode and path. Luft, no-heavy and a
  pawn-blocked file are permanent hard negatives. Exact mate-in-one remains independent.
- Registered 20 of 30 RFC projections. The compiled manifest is now 25 producers, 146 projections,
  25 consumers, 182 bindings and 40 semantic events/eligibility rows.
- Focused verification: 74 affected runtime/server/web tests green; runtime typecheck, manifest
  check, semantic check and diff hygiene green. No repository-wide verification was run.

## 2026-08-22 — remaining Wave-A contract audit

- Re-read every one of the ten unimplemented Appendix-A projections against its available source
  bytes. All ten are grouped behind seven author corrections, D829–D835; none is blocked by an
  unknown implementation technique.
- Newly returned: rule-of-the-square arithmetic omits turn/double-step/boundary semantics (D832);
  a generic gained slider ray cannot prove the friendly-screen/enemy-target claim in
  `discovered_executed` (D833); trade completion does not pin immediate adjacency or operands
  (D834); and the loose-piece event tries to compare state readings that describe opposite owners
  before and after every move (D835).
- Previously returned: absent `space@1` tradition citation (D829), undefined pawn mutual-support
  encoding (D830), and undefined rook cutoff predicate (D831).
- Implementation pauses at the honest 20/30 boundary until the accepted RFC is amended. The
  research-complete breadth successor D802 still needs its own independently accepted RFC before
  Wave B code; UX modules, pack vocabulary and bot candidate adapters remain downstream consumers.

## 2026-08-22 — final ten landed; Tactical collector RFC complete

- Added the ten missing Appendix-A identities: pawn connectivity, pawn-island event/avoidance,
  mover-relative loose-piece event/avoidance, rook-on-seventh, `space@1`, immediate trade,
  discovered execution and typed promotion pressure. The compiled inventory is now 30/30.
- The returned seams close at their exact boundaries: connected pairs differ from directed support;
  rook relevance operands never suppress the state; trade requires adjacent captures on one landing
  square; discovered execution joins the before-state latency identity to the gained ray; invalid
  turn clones remain typed absence rather than false. En-passant and promotion-capture trades plus
  color mirrors are permanent fixtures.
- The permanent two-population instrument evaluates production collectors against complete legal
  alternatives. `moved_piece_en_prise` remains negative-primary at 0.25× authored (95% 0.18–0.33)
  and 0.49× imported (0.39–0.59). Exact `double_attack` remains above one at 1.72× authored
  (0.75–2.96) and 1.96× imported (1.30–2.71); the imported interval excludes one while the authored
  interval remains uncertain, so the ruled fallback does not trigger and no universal positive
  prior is claimed.
- Honest zeros remain visible: trapped-piece state is 0/754 on authored played positions;
  promotion-unstoppable is 0/579 on imported played positions; all-reply fork is 0/717 authored.
  Canonical positives/hard negatives prove the predicates can fire. Capture is recorded only as a
  frequency/class census (101/754 authored, 158/579 imported), never assigned a lift.
- Compiled closure is 25 producers / 156 projections / 25 consumers / 188 bindings and
  46 semantic events / 46 eligibility rows / 15 reasons / one selection policy. No content, schema,
  settings, module, preset, workflow or learner-copy bytes changed. D743 opening identity remains
  open under R8/F7; learner admission remains the two explicit Phase-3 discharges.

## 2026-08-22 — correction: implementation complete, archival held

- The preceding entry called the RFC archived before running lifecycle P5. P5 correctly refused an
  archived RFC with two open Phase-3 learner-module discharges. The implementation and all 30
  projections remain complete; `rfc/tactical-collectors.md` stays active with status `implemented`
  until those discharges close. No acceptance result or measurement changed.

- Lifecycle-token clarification after running P5: the active document's token is `awaiting D921`,
  not `implemented`; D921 is the live ledger owner of the collector-to-module amendment. The phrase
  “implementation complete” remains descriptive, not the lifecycle token.

- Further parser clarification: an `awaiting` token points to the RFC's **local discharge id**, not
  the global backlog row. The valid token is therefore `awaiting D1`; D921 remains the global owner.
