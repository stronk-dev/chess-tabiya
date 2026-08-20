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

## 2026-08-20 — R3 mechanical/desk presentation arm separated modules from forms

- Landed `design/research/evidence-presentation.md` and the disposable
  `tools/r3-presentation-harness/`. The corpus arm reproduces shipped board lighting over 611
  unique authored-spine positions and 12,236 occupied-square queries.
- Settings expose nine mechanism/source axes for six contexts: 54 primary controls. In-run human
  evidence is raw UCI/mass; system arrows have no renderer; the ambient assistance button has no
  action. Recorded D582-D585 without changing product code.
- Board lighting bypasses R2: a selected occupied square renders median 2 captions, p95 9 and max
  11, with up to 19 drawn marks. The worst query is dominated by eight `line_blockers` plus the
  ineligible `pawn_safe_square` and generic count/reach facts.
- `evidencePacket()` independently bypasses R2 by sending the complete structural list, matching
  plans and authored text to the provider without module identity, eligibility reason or budget.
- An eight-module disposable boundary passes five zero/one/many, abstention, disclosure, consumer
  and move/PV-leakage tests. It separates producer → compiler → module → form → optional
  renderer and keeps pre-commit sight marked as an owner boundary.
- Chessiverse contributes progressive intent and theory↔play linkage but its Full/Peek/Blunder
  Guard defaults conflict with the current commit-first rule. Chess.com contributes guided key
  moments, Retry-before-Show-Moves and visuals bound to explanation text rather than an independent
  evidence query.
- R3 is mechanical/desk done and still external to complete: D537/D573 invalidate the shipped
  gesture baseline, the in-app browser was unavailable, and no nontechnical participants were in
  scope. R7/R8/O4 remain blocked; R5 is the next evidence-core research job. D560 stays active.

## 2026-08-20 — R5 separated optional wording from evidence authority

- Landed `design/research/llm-renderer-contract.md` and the disposable
  `tools/r5-renderer-harness/`. Sixteen synthetic cases compared deterministic rendering, the
  current sentence seam and a typed module seam across `gpt-4o-mini`,
  `claude-sonnet-4-5-20250929` and local `SmolLM2-360M-Instruct`.
- Deterministic rendering retained all 18 proposition groups and passed every gate. The Claude
  sentence arm also passed this one pinned run; the GPT sentence arm falsely asserted no evidence
  in a non-empty case, and shipped `voiceCheck` accepted it.
- Both hosted typed arms parsed and returned admitted fact IDs in 16/16 cases but dropped required
  theory citations; the Claude typed arm also removed a disclosure qualifier. JSON shape and IDs
  therefore do not bind the prose proposition.
- The 360M local typed arm passed parse/ID checks in 1/16 cases and had 15 hard failures; sentence
  mode had three. `voiceCheck` accepted 17/18 local hard failures. Offline operation cannot depend
  on a local generator.
- Recorded D586-D589. The 1.0 boundary is deterministic rendering as normative/self-host fallback,
  with any LLM optional, post-selection and conformance-gated; provenance, disclosure, numbers and
  visual bindings remain deterministic. R5 is done; O4 now waits on R3 only. No product code,
  schema, content or design intent changed; D560 remains active.

## 2026-08-20 — R11 separated played policy from raw Maia mass

- Landed `design/research/bot-policy.md` and the disposable
  `tools/r11-bot-policy-harness/` over the fixed R9/R12 population: 279 positions × bands
  1400/1600/1800, joined to Lichess explorer and every-legal-move Stockfish depth-12 values.
- Discarded the first run after inspecting the pinned engine: emitted `policy` is raw softmax,
  while production `bestmove` applies temperature 0.8 and top-p 0.92. The repaired reconstruction
  predicts 19.84 cp loss / 0.39% severe mass, matching the captured sample at 19.57 / 0.36%; raw
  policy's 59.13 cp was not the bot's played distribution.
- The 250 cp guard passed its mechanical gate with 1.27 cp strengthening and complete removal of
  measured severe mass. Pawn ×4 passed its declared-trait gate at +11.97 pp; forcing/quiet ×3
  failed at +3.02/+2.24 pp. None earns a human-like/coherent/style label.
- Corrected D590: Tabiya's pinned Maia already conditions on history and prior R9 evidence had
  measured the effect. Otter motivates a capability adapter and exposes the remaining clock/time
  gap; it does not diagnose current Maia as position-only. Recorded D593-D596.
- Chessiverse's first-party account separates candidate curation, opening repertoire, measured
  output traits and presentation persona. Its repeat-loss adaptation is roadmap, not shipped fact.
- R11 is mechanical-done and external-to-complete. H5's main claim and C5 remain unmet pending the
  predeclared blinded 10–20-ply branch review. No product code, schema, content or design intent
  changed; D560's content hold remains active.

## 2026-08-20 — R12 found individual habits but refused natural player types

- Froze a 2 GiB compressed prefix of the official July Lichess rated database: 6,599,736 complete
  games over 59 hours, 2,660,480 eligible blitz games and 190 accounts with at least 200 games.
- Measured 36 non-bot accounts × 200 games across three rating bands, with 261,892 exact learner
  decisions and a 2,573,111-game same-band opening reference. Raw identities/traces remain in
  `/private/tmp`.
- Twelve of sixteen literal metrics have persistent short-session floors from 25–200 games.
  Fianchetto-unblock, forcing-choice, non-pawn-capture and reply-breadth refuse.
- The retained vector re-identifies 35/36 accounts across disjoint halves, passes the shuffled and
  rating controls, but every k=4–12 archetype clustering fails (best median ARI 0.417 vs 0.70).
- Recorded D597-D604. Two instrument defects were preserved and repaired: an isolated first pass
  is not a sample floor, and the first fianchetto denominator included its own event (586/586;
  corrected 586/4,473).
- R12 permits continuous habit cards to enter O9, not named types, GM twins or advice. R13 remains
  blocked by R7; the behavioral-identifier result now feeds R18. No product code, schema, content
  or design intent changed; D560 remains active.

## 2026-08-20 — R18 proved the provider-off core and failed the present 1.0 platform floor

- Landed `design/research/release-platform-audit.md`, exact deployment/data/rights results and a
  disposable Chromium DOM/AX/keyboard harness against clean commit `24430fe`.
- A fresh default Compose deployment served 50 packs, completed a rehearsal without any cloud
  credential and recovered the run after restart. The optional engine profile selected a Maia move
  in 0.257 s. This establishes a real provider-off core, not release readiness.
- Stopping Maia left capabilities green; a cached request passed while an uncached request hung
  beyond 10 s. Account deletion removed progress but retained a solo run under `__legacy`; no
  account export, run delete, supported backup/restore or rollback contract exists.
- The accessibility tree exposes one generic non-focusable board with no square semantics or move
  entry. Unmodified Tab is captured for Compare and trapped at the Assistance summary. A2's exact-
  UCI gesture failure therefore remains the stronger input evidence.
- The main image lacks project/source/notices/SBOM surfaces and copies the authoring corpus. The
  5.11 GB Maia image contains 18 CUDA/NVIDIA packages, 15 proprietary/licence-ref, despite the
  measured CPU use. Recorded D605-D615.
- R18 is mechanical/code/desk done negatively. O13 is READY with a minimum coherent 1.0 choice;
  F12 remains required and participant screen-reader/physical-device proof remains external. O5
  and O12 shed only their R18 dependency. No product code, schema, design intent or authored chess
  content changed; D560 stays active.

## 2026-08-20 — the capability watch replaced clone counting with routed evidence

- Landed a checked capability-first register and deterministic summary over the frozen 63-product
  matrix: 21 canonical representatives, 18 capabilities and 25 product-capability evidence rows.
- Every owner-named product is canonicalized. Duplicate Chessiverse matrix rows collapse to one
  product; ChessLab/Qchess identities stay explicit; RepCheck/RookHub is an evidenced alias.
- Eighteen rows are transformations, two direct adopts, two deferrals and three research postures.
  Tabiya is only proven for two rows; 12 are mechanical, seven claimed and four absent. The watch
  routes integration work into existing O/F nodes instead of creating a parallel feature backlog.
- The main result is a refusal of false completeness: 18/25 rows have neither checked love nor
  checked hate evidence. D556 closes because the instrument now exposes that missingness; D554's
  hands-on/forum sweep remains open and targeted to those rows.
- Capability and reality maps, research/execution queues and the coverage matrix are reconciled.
  No product code, design intent, schema or authored content changed; D560 remains active.
