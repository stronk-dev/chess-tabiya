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
