# Platform alignment log

Append-only. Record research, rulings, RFC transitions, implementation closeout and gate changes.

## 2026-08-20 — Program opened

- Recorded owner ambition and gaps as D555-D562.
- Landed `design/research/integrated-platform-alignment.md`: competitor capability resweep plus
  code audit of LLM guidance, detector semantics, bot policy, player classification, post-game
  story and pack/content coupling.
- Found the current LLM path is constrained sentence rewriting, not theory retrieval; recommended
  an offline, cited knowledge plane with deterministic chess-key retrieval and optional embedding
  reranking, subject to research and owner ruling.
- Confirmed the classifier vocabulary is a present-position census rather than the required
  semantic/multi-ply layer; adding detectors without evidence selection would worsen current noise.
- Confirmed raw Maia policy has no separate personality/repertoire/error/time contract, and player
  style has storage ingredients but no metric/archetype implementation.
- Recorded D555 as the owner's integrated-FOSS breadth ruling and D560 as the owner's active hold on
  scale content. Gate F is the proposed clearance proof; its exact clauses remain amendable.
- Next: reconcile active RFC truth; complete the five missing research dossiers and hands-on
  competitor teardowns; obtain owner rulings; draft RFCs only after the exploration gate.

## 2026-08-20 — Skipper reuse question corrected and routed

- Owner clarified that the proposed scraper is a separate knowledge-building subsystem like the
  existing Frameworks Skipper, not a live scrape inside hint requests.
- Audited Skipper's full executable and knowledge core. Whole-service reuse is refused for the 1.0
  core because it imports Frameworks identity/platform/diagnostic concerns and a generic agent
  policy. Conditional extraction of its crawler/cache/extractor/embedder/store/reranker seam is the
  recommended path.
- `design/research/theory-knowledge-pipeline.md` records the required chess provenance,
  enrichment, validation, bundle and confidence changes.
- Opened a six-arm disposable experiment under `knowledge-retrieval/`; product extraction happens
  only if it beats exact chess keys + FTS on predeclared recall, false-match and abstention gates.

## 2026-08-20 — Bottom-up route to integrated 1.0 made executable

- Expanded D563 from a sequencing statement into five linked program artifacts: an authoritative
  research queue, owner/design decision queue, existing-aware RFC dependency graph, executable
  phase queue and full capability map.
- Separated audit truth (A0–A2), evidence research (R1–R6), learner/review research (R7–R10),
  bots/progression (R11–R14), and professional/social/platform breadth (R15–R19). Every row now
  names a method, exit criterion, blocker and downstream decision rather than only a topic.
- Routed every requested family — evidence, semantic detectors, assistance presets, full analysis,
  theory, drills, Review Map/share, bots, profiles, campaign, coach, streamer, human play,
  tournaments, self-hosting, accessibility, integrations and later federation — through research,
  owner ruling and an RFC node. No capability is silently lost; not all are pre-decided as 1.0.
- Made the immediate frontier explicit: active-RFC truth, capability reality, interaction-state
  measurement, knowledge retrieval, bot policy, release-platform audit and the capability-watch
  instrument. Detector/presentation/profile feature work is correctly blocked behind its inputs.
- Preserved D560's content hold: only disposable/sacrificial pilot work is legal before Gate F;
  scale content remains downstream of stable evidence and pack contracts plus owner acceptance.
- Corrected the old evidence resume prompt through D564 and removed the implication that the owner
  proposed request-time scraping; it now audits a separate builder and immutable runtime bundle.

## 2026-08-20 — A0 closed four invisible-complete RFCs

- Audited all thirteen active product RFCs on four axes: document status, code presence,
  acceptance verification and lifecycle closeout. The audit is
  `planning/platform-alignment/active-rfc-audit.md`.
- Used a clean extraction of committed `e5a3f3f`, excluding the shared dirty feedback Stage 1
  work. Current verification passed 179 focused tests, 53 Stockfish-required engine/opponent
  tests, schema/runtime/server TypeScript, Svelte at 0/0, scaffold and packaging.
- Independently cleared and archived `live-marker-quality`, `dead-vocabulary`, `engine-leverage`
  and `vocabulary-wiring`. The archive count is now 63; this is lifecycle completion, not a claim
  that their capability families meet the integrated 1.0 UX.
- Re-derived historical landing versions rather than treating old acceptance literals as current
  version requirements: engine leverage landed 0.23/0.16/storage 21; vocabulary wiring landed
  0.24. Closed D497/D505 and released the stale register claims.
- Reconciled `graduation-clearance`'s body to the register's accepted state and closed stale D503.
  It remains unbuilt. `teacher-surface` also remains accepted/unbuilt; feedback delivery remains
  accepted and in-flight only in the excluded dirty worktree.
- Six documents remain draft/returned. No process instrument (`register-check`, `status-parity`,
  `work-index`) exists yet, so A0 remains a dated manual audit and those process RFCs still matter.

## 2026-08-20 — A1 traced capability reality end to end

- Audited all 21 integrated-1.0 capability families across four independent links: production
  backend/producer, client consumer, real content or workflow instance, and current hands-on proof.
  Uncommitted feedback-delivery work received no capability credit.
- Classified two families as proven integrations, fourteen as mechanically present, four as
  claimed-only and one as absent. “Proven” is integration reality, not learning efficacy, user
  demand, official-content graduation or a 1.0 scope ruling.
- Corrected the largest stale understatement: native human-v-human play already ships and passes a
  three-context browser episode covering alternating moves, out-of-turn/reveal refusal,
  pause→branch→resume, authorship and single-use friend joining. R17 still owns clocks,
  matchmaking, fair play, moderation, operating cost and whether it belongs in 1.0.
- Confirmed the central overstatement: the evidence registry is not a producer→consumer contract.
  Its eight free-text `surface` values have an empty intersection with the seven canonical client
  surface IDs and the field has no client reader.
- Counted the actual content floor: zero official pack JSON files, 50 served non-browser community
  drafts (all `reviewStatus: draft`) and 25 shape entries. Drafts prove wiring, not Gate F or release
  readiness; D560's content hold remains active.
- Updated the capability map with explicit state tokens and linked
  `capability-reality-audit.md`. R1, R2, R5 and R6 are now unblocked. A2 still gates interaction UX
  evidence because current resting-layout checks do not prove post-gesture board correctness.

## 2026-08-20 — R1 separated atomic facts from semantic chess events

- Landed `design/research/detection-landscape.md` and the disposable
  `tools/detection-landscape-harness/`. The dossier replaces the monolithic-classifier framing
  with six evidence planes: rules/board, transition/bounded consequence, search/engine/tablebase,
  human corpus/model, theory catalogue and authored truth.
- Replayed 50,000 complete records from a digested bounded prefix of the official Lichess CC0
  puzzle export, including the whole solution line, legal alternatives at the first solution move,
  hard-negative IDs and 250 file mirrors. Cheap fork geometry reached 100.0% recall but 32.3%
  precision against the tag; discovered attack 19.7%, hanging piece 7.9% and absolute pin 39.0%.
- Read the official AGPL tagger rather than treating its output as truth. Its semantic rules add
  material, moved-piece safety and functional consequence; `overloading()` is unimplemented and
  the export is automatically tagged then vote-refined. Lichess is now explicitly a disagreement
  corpus, not Tabiya's ontology.
- Recorded D565-D568. The sharp code defect is D566: `pawn_safe_square.safe` ignores its own
  `captureAttackers` collection and legal/path occupancy, so the learner-visible name overclaims
  the computed projection.
- Updated Q4c and B4 without declaring them complete. R1 settles the producer/grounding boundary;
  R2 still owns relevance, sign and admission, R3 presentation, and reader validation remains
  external. No product RFC, product code, schema or content changed.

## 2026-08-20 — R2 separated local distinctiveness from semantic significance

- Landed `design/research/selection-sign-and-significance.md` and the disposable
  `tools/r2-selection-harness/`. The external arm samples 108 rated Lichess games across three
  time controls and three Elo bands at fixed plies; the authored arm covers all 754 current spine
  transitions. Every legal alternative is enumerated, including all four promotion roles.
- The predeclared ≤20%-same-family, cap-two rule cut raw volume from 8.70 to 0.79 entries/decision
  authored and 11.42 to 1.03 imported, raising local specificity from about 18% to above 93% on
  both populations. It retained all 108 predeclared rare rules events.
- The survivor audit refused the shortcut the aggregate invited: `piece_count`,
  `bishop_on_shade` and generic changed counts dominate the selected set. Distinctive does not mean
  significant. The evidence compiler therefore needs semantic eligibility before local
  selection/budget.
- Relation sign is now explicitly separate from valence. The 1,032 authored and 522 imported
  alternative-only relations cannot become “you avoided a mistake” without authored/theory,
  disclosed engine/tablebase or validated semantic-event backing. This corrects D545.
- Recorded D569-D572, completed R2, unblocked R12 research, made O3 ready for a narrow owner
  ruling, and updated Q4c/B4/K6 and the capability/queue surfaces. R3 presentation and
  reader/per-consumer validation remain open. No product RFC, product code, schema or content
  changed; D560's hold remains active.

## 2026-08-20 — A2 repaired the interaction instrument and confirmed two product failures

- Landed `design/research/interaction-state-correctness.md` and the disposable
  `tools/a2-interaction-state-harness/`, measured against clean commit `68b9a98` with all six
  served endgames, five viewports and stale/live click, drag, emulated touch, resize and hover.
- The harness independently validates FEN/UCI legality, reads live orientation and board bounds,
  hit-tests the source/destination and captures the exact request `uci`. Across 90 live gesture
  cells, 4 delivered the authored move, 15 delivered a different legal move and 71 sent nothing.
- The controls isolate D537: stale pre-selection coordinates succeed in 19/30 cells while live
  click succeeds in 1/30; resize recovers all 24/24 desktop/tablet cells. D539's probe-cancellation
  hazard and D541's White-orientation assumption are closed in the new instrument.
- Recorded D573 separately: at 390×844 five of six authored source squares are covered by timeline
  or control regions before selection; the sixth selects, shifts 96 px and still fails. Click,
  drag and touch each deliver 0/6 exact moves, and resize recovers only that sixth pack.
- Updated K9 without changing its state: speed cannot clear it and the repaired usability arm
  remains evidence toward firing, but the causes are named product defects and the owner retains
  the call. A2 is done; R3 is ready for disposable prototype/mechanical work and external for its
  participant exit. No product code, schema, content or design intent changed; D560 remains active.

## 2026-08-20 — R6 answered with a negative Gate-F result

- Landed `design/research/pack-primitive-stability.md` and the disposable
  `tools/r6-pack-stability-harness/`. The bidirectional census covers 27 schema mutations and all
  92 current pack documents without checking out or rewriting historical trees.
- Current syntax is green (92/92 at 0.27), but no document declares a schema/capability requirement.
  All 92 also validate under 0.24 despite 82 later principle references and 436 typed graduation
  entries, proving that schema validity can silently overstate older-runtime compatibility.
- Recorded D574-D578. Schema 0.13 named an invalid artifact and its repaired successor; HEAD's ID
  says 0.27 while its description says 0.25; no reusable pack migration ladder exists.
- Separated migration classes. Evidence relocation and engine-cost stamping are reproducible
  mechanical/instrument work; principle assignment and graduation splitting contain explicit human
  judgments and may not be inferred by a migrator under law 8.
- Four declared families have zero pack witnesses (`engineCondition`, per-leg shapes, per-leg
  opponent policy and prediction), so the corpus is not a primitive-complete pilot.
- R6 narrows O6/F3 to immutable resource artifacts, versioned capability negotiation, pure plan +
  separate apply, semantic-residue refusal and a sacrificial varied pilot. It does not unlock an RFC,
  lift D560 or launch content. Gate F remains failed.

## 2026-08-20 — R4 knowledge retrieval completed negatively

- Ran the predeclared six-arm experiment over 55 licensed/local passages, 106 Skipper chunks and
  144 fixed queries. Exact+FTS beat the strongest semantic arm at recall@5, 97.7% to 94.7%.
- The strongest semantic arm missed both safety exits: 8.3% ineligible top-1 and 66.7% hard-negative
  abstention. Contextualization did not change recall@5 relative to ordinary reranking.
- Source replacement and exact-vector controls passed; source/span/digest reproduction and
  same-dimension embedding-model invalidation failed.
- Closed D564's extraction branch and recorded D579-D581. The separate-builder need remains, but
  its 1.0 shape is typed provenance compilation plus a local exact/FTS artifact, not Skipper,
  pgvector, contextualization or a chess chat agent.
- R8 is now blocked only by R3; O5 remains blocked by R8/R18. No product implementation or content
  changed.
