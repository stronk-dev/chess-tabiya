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

## 2026-08-20 — O13 selected the stronger appliance floor for 1.0

- The owner selected R18 Choice C: the 1.0 release contract includes all Choice-A provider-off,
  degradation, data-lifecycle, operations, rights and accessibility requirements plus offline
  tablebase/knowledge support, service-worker update semantics, signed/attested images,
  multi-architecture resource tiers and a complete reverse-proxy deployment.
- Recorded D616 and reconciled O13, the research/execution queues and the 1.0 capability map.
- This is a scope ruling, not release clearance. D605–D615 remain open, F12 must prove the complete
  appliance contract, and `design/02`/`design/03` still require an owner/Claude-on-ruling intent
  amendment under law 5. No product code, schema, authored content or protected design intent
  changed.

## 2026-08-20 — O1–O4 separated configurable evidence primitives from opinionated workflows

- The owner approved a compiled, versioned producer→evidence→consumer manifest. Producer/module
  declarations are primary; joins and shipped state are derived; unexplained orphans fail unless
  explicitly inspector-only, experimental or retired. Recorded D617 and ruled O1.
- The owner approved semantic eligibility before deterministic local selection: learner-facing
  events require typed operands/squares, sign, grounding, exactness/confidence, abstention and
  positive/hard-negative validation. Raw atoms remain available to the inspector; sign supplies no
  valence or grade. Recorded D618. O2 remains partial only for exact family admission.
- The owner clarified that every admitted primitive must remain configurable somewhere, while the
  ordinary product exposes intent modules and opinionated per-workflow presets instead of source
  switches. Theory-only and empty nudges are first-class. Requested exact sight may run pre-commit;
  proactive blunder prevention requires explicit Support and is not the rehearsal default. Session
  ceilings only remove capability and input forms must be equivalent. Recorded D619; O3 is ruled
  and O4 remains partial only for R3-tested names/composition/defaults and later campaign/professional
  scope.
- Reconciled the decision/execution queues and 1.0 capability map. Protected living intent still
  requires an owner/Claude-on-ruling amendment; no RFC or implementation is authorised by this
  planning closeout. No product code, schema or authored content changed; D560 remains active.

## 2026-08-20 — R3 participant arm became executable without flattening rich configuration

- Preregistered a 12-learner, device-stratified protocol covering quiet Just Play, requested
  pre-commit sight, explicit Support/blunder prevention, post-commit drill nudges, theory-only and
  empty states, Review & Retry, the raw inspector, advanced configuration and a suppressive campaign
  ceiling placeholder.
- Success is task behavior rather than stated preference: workflows must start without source
  settings; participants must distinguish sight/theory/evaluation/recommendation; empty and
  unavailable states must be understood; input forms must return identical fact IDs; any move/PV
  leakage or ceiling escalation fails automatically. One-vs-two-fact variants have a predeclared
  retention rule.
- Reconciled the R3 dossier and disposable harness with D619: requested exact pre-commit sight is
  now an owner-ruled research candidate rather than an open boundary. Product defaults, names and
  composition remain unproven until the external runs occur. No product code, schema, protected
  intent or authored content changed; D560 remains active.

## 2026-08-20 — R11 produced the blind packet and refused two false repertoire arms

- Generated 54 legal 12-ply branches over six fixed roots and three strata through the shipped
  Maia path plus independent Stockfish accounting. The randomized reviewer packet contains 42:
  raw Maia, guard 250, pawn ×4 and the weakened-Stockfish negative control.
- The authored-spine arm fell back on 57/72 controlled plies. A frozen book built from 2,519,503
  eligible Lichess blitz games, including 19,214 games reaching a fixed root and 58,147 rooted
  positions, also fell back on 57/72. Both breach the preregistered 25% ceiling and are refused
  before review; recorded D620-D621.
- Preserved and repaired an instrument failure: the first live-explorer call returned HTTP 401 and
  the pilot collapsed it into empty data. The replacement builder aborts on source failure, every
  fallback is explicit, and the offline validator replays all branches and re-derives digests,
  packet eligibility and aggregates. Reconciliation also caught that the first packet digest bound
  filenames but not PGN bytes; the corrected digest binds both. Recorded D622.
- R11 remains external-to-complete: no branch has a human judgement, H5/C5 stay unmet, and no arm
  earns a human-like/coherent/personality label. No product code, schema, protected design intent
  or authored chess content changed; D560 remains active.

## 2026-08-20 — D554's targeted forum sweep replaced every unchecked signal

- Searched all 19 formerly unchecked capability rows and reconciled the register to 22 canonical
  products, 19 capabilities and 29 evidence rows. Of 58 love/hate cells, 38 now carry
  reported/observed evidence and 20 are explicit `not_found` results (8 love, 12 hate); zero remain
  `not_checked`. The misses remain absence-of-evidence, not approval.
- Corrected two routing defects: TryChessLab and ChessLabHQ are unrelated products and now have
  distinct identities; Qchess's praised structured-thinking drill is represented separately from
  time management. D626-D627 close.
- Chessiverse's current Guided Play narrows the competitive claim: it now retains branches, permits
  bot-reply replacement/resampling and joins opening guides to play. The surviving distinction is
  grounded, preserved N-way consequence comparison across shared workflows—not the feature names.
- User evidence supports understandable presets, connected explanation, theory/repertoire
  continuity, fun presentation and low-friction transitions; it rejects premature best-move
  leakage, generic/inaccurate coaching, context-free repetition, unstable types and brittle input.
  This feeds the D619/R3 workflow prototype rather than authorizing product implementation.
- Comparable hands-on remains in R3/R7/R8/R11/R15-R17. No product code, schema, protected design
  intent or authored chess content changed; D560 remains active.

## 2026-08-20 — R3 gained an executable workflow/preset/ceiling prototype

- Found D628 before participant use: the eight-module contract described explicit Support but had
  no blunder-prevention consumer or executable session ceiling. Added a ninth synthetic warning
  module that rejects alternative moves/PVs and may appear only in Just Play Support.
- Added five preset compositions (Quiet, Guide me, Theory only, Support, Analyze) inside six
  workflow contracts. A ceiling is a set intersection and only removes capability; Guided
  Rehearsal/Campaign reject Support and Theory only contains only legal interaction plus cited
  theory.
- Added a responsive static participant artifact with eligible, honest-empty and unavailable-source
  states, advanced module dispositions and keyboard-addressable squares. All chess-like copy is
  labelled synthetic fixture text.
- Seventeen tests pass. Headless visual QA at 1440×1000 and 390×844 exercised Support and
  post-commit Guided paths; expected modules rendered and the phone width stayed exact. One hidden
  result bar was fixed from the rendered screenshot.
- R3 remains external-to-complete: buildability is not nontechnical-player comprehension and no
  preset/default is validated for production. No product code, schema, protected design intent or
  authored chess content changed; D560 remains active.

## 2026-08-20 — R14 campaign closure gained an honest, narrowed owner protocol

- Corrected the authoritative campaign queue's stale “nobody played since 2026-08-12” statement:
  the 2026-08-16 app audit completed/forked/compared a four-ply fixture. The missing evidence is the
  owner playing real content for attention/value, not runtime execution.
- Narrowed R6 to its only open part—a count budget on retries—and R7 to the felt effect of an
  explicitly suppressed module. Existing rewind location/play-out rules and D619 preset/ceiling
  architecture are not reopened.
- Preregistered a three-phase owner pilot with separate R8/R6/R7 probes and refusal criteria. The
  current mechanical filter selects horizons 14/18/40 with 5/7/12 authored deviations; file digests
  are recorded and must be re-derived at session HEAD.
- The protocol remains blocked by D537/D573 and a real admitted R3 packet. It does not use broken
  board interaction or synthetic facts as campaign preference evidence, and it does not authorize
  F10. No product code, schema, protected design intent or authored content changed; D560 remains
  active.

## 2026-08-20 — A3 closed the current detector-family conformance register

- Added a disposable register covering all 18 structural and six transition families, with literal
  code semantics, matcher/reader fidelity, safe disposition and blocker. All 18 structural matchers
  now have an executable positive and hard-negative fixture; all 14 transition leaves have current
  corpus witnesses and exact-count controls.
- Replayed 754 committed transitions from 50 packs / 643 positions. Only 11/18 structural families
  round-trip; three are reader subsets, three lossy and `pawn_count` matcher-only. Every transition
  family is lossy and 0/3,371 observations retain affected squares.
- Verified five generic production sinks consume whole readings rather than a declared family
  version. This closes D629's missing research instrument but admits zero whole families as
  universally learner-facing; inspector and authored-condition uses remain distinct legal homes.
- Recorded D630-D633. The migration-critical result is indirect: `pawn_safe_square` has zero literal
  authored users, yet `outpost` calls it and occurs 23 times across three content documents. A
  literal-token migration census would miss every affected document.
- Updated O2/F1-F3 routes, Gate-F inputs and the 1.0 capability map. No product code, schema,
  protected design intent or authored chess content changed; D560 remains active.

## 2026-08-20 — A4 proved the shared evidence pool does not yet ship

- Added an executable topology register over fourteen production producer paths. It pins runtime
  events, sourcing records, rules refs, packet fields/sentences, capability dispositions,
  standalone Maia/Explorer routes, client capability types and the R3 module/workflow vocabulary.
- The namespaces are not projections under one declared contract: 0/4 runtime event names match
  the seven sourcing kinds, only 2/7 sourcing kinds become recorded readings, and eight free-text
  capability surfaces match 0/7 canonical surface IDs.
- Only four producer paths are renderer-visible. Four more are typed but outside the LLM sentence
  source, three are runtime side channels, two are standalone raw panels and opening identity is
  sourcing-only. Production contains 0/9 R3 module IDs and 0/6 workflow IDs.
- Re-verified the existing defect family rather than duplicating it: D145 owns the sentence
  boundary, D147 corpus absence, D318 the global bestline refusal, D546 the missing producer binding
  and D630 transition operand loss. D634 closes only the missing topology audit.
- Updated O1, F1, B4, Gate F and the 1.0 map with the negative baseline. No product code, schema,
  protected design intent or authored chess content changed; D560 remains active.

## 2026-08-20 — A5 separated technical assistance profiles from learner workflows

- Added an executable mapping from six intended learner workflows to the six shipped technical
  profiles and all nine assistance axes. All unset profiles are byte-identical Quiet mechanics;
  Settings exposes 54 raw controls and the in-run panel six.
- Only Just Play and generic pack play bind directly to one profile. Learn can be pack or position;
  Review and Analyze inherit the source run; Campaign is absent. Production persists no workflow or
  preset identity, so different defaults cannot attach without cross-workflow contamination.
- Re-ran every role/disclosure cell: pack, position and imported permissions remain byte-identical,
  so the ruled real session-kind ceiling has not shipped.
- Found D636: Academy has no profile and falls through to the source run; the primary imported Story
  offers external narration without consulting the imported voice preference.
- Corrected D311 rather than repeating it: Settings now covers all nine axes/54 controls. Arrows,
  Ambient, remount-only loading and indistinguishable sight/evidence overlays remain open.
- Updated O4/O11, F5/F11, B5/B10 and the capability map. R3 participant comprehension and R15 coach
  workflow remain external; no product code, schema, protected design intent or content changed.

## 2026-08-20 — RFC completion was split into lifecycle, current verification and product outcome

- Added the D637/D638 completion harness and `rfc-completion-refresh.md`. All ten root RFC files
  now join the Active table and all 63 archive files join the actual Archive table.
- Repaired a five-row Archive mismatch: four implemented RFCs were visible only in pack-schema
  history, while `expression-census` had an archive-shaped row embedded in that table. The Archive
  table had 58 rows before the repair, not 63.
- Verified every archived body labels itself implemented, contains acceptance criteria, links only
  to existing canonical docs, and has a planning record. This establishes lifecycle closeout; it
  does not retrospectively re-run 63 implementation specifications.
- Preserved the stronger distinction: four archives have a named current per-RFC A0 re-verification,
  while A1 proves only two integrated capability journeys and A3-A5 reject the current evidence and
  workflow core as 1.0-complete.
- Classified the nine active product RFCs: two accepted/unbuilt, one accepted with dirty Stage-1
  work, and six draft/returned. No active product RFC is complete.
- Recorded that feedback-delivery's dirty records still disagree about CR1: the starting
  measurement/log preserves the invalid one-ply 100% result while the later diagnostic measures
  properly-shaped N=8 continuations at 27.6-35.7%. Stage 1 must append/reconcile before landing;
  Stage 2 remains separate and D560's content hold remains active.

## 2026-08-20 — A6 separated missing research from missing authority

- Audited all R1-R19 against O1-O14 and F1-F12 with an executable completeness register.
- Five research nodes are internally complete, four are partial/external, one has an external-ready
  protocol only, and nine are blocked behind named predecessors.
- F1 and F12 are the only architecture-research-ready candidate RFC nodes. F1 waits on protected
  O1 intent plus the shared-register/lifecycle process; F12 waits on the protected O13 Choice-C
  design amendment. Neither needs another broad desk taxonomy before that work.
- F2-F11 remain research-blocked. Their residues are human/workflow claims: detector admission,
  exact guidance defaults, Review Map action, theory transfer, blind bot human-likeness,
  longitudinal coaching, campaign experience, coach/streamer jobs and social trust.
- Closed D639. No product code, schema, protected design intent or authored content changed; D560
  and Gate F remain active.

## 2026-08-20 — the protected-intent delta became a surgical handoff

- Executably pinned five contradictions between ruled O1-O4/O13 planning and protected
  `design/02`-`05`: hosted-only/PWA-open posture, raw selectable evidence, B4/B8/B10 shipped claims,
  rung-0 infallibility, implicit any-form permission and raw per-context default composition.
- Added `intent-amendment-handoff.md` with edits by section, the exact boundaries that must remain
  open, closeout requirements and a copy/paste Claude prompt. Codex did not edit protected intent.
- Priced the five remaining process-RFC owner questions and recommended each draft's minimum
  choice, widening lifecycle parity to the D638 Active/root and Archive/filesystem failure.
- D640 remains open until the owner/Claude amendment lands. F1/F12 remain legally blocked despite
  sufficient architecture research; no RFC or product code was created.

## 2026-08-20 — D641 routed every definitely omitted open row

- Parsed 589 pre-intervention unique ledger ids: 234 closed/rejected and 355 open. The old work
  register still stops at D365-era truth.
- Found 75 open ids with no mention in any living non-log planning document or active product RFC.
  Closed D99 as a stale prevented hazard and assigned the other 74 exactly one primary destination
  in `unrouted-defect-refresh.md`.
- The largest restored groups are F12 appliance (12), R11/F8 bots (9), R12/F9 profile (9), campaign
  (8), F3 migration (7), and R3/F5 assistance (7). This confirms the new research generated real
  work faster than the old global index could absorb it.
- Kept D487 open: 280 other open rows have at least one mention, but no machine proves it is one
  live, non-stale owner. The disposable D641 registry is not allowed to become another global
  hand-written index.
- No product code, protected design, schema or content changed; D560 remains active.

## 2026-08-20 — graduation clearance was split at the content-hold boundary

- Re-derived the accepted RFC's current population: 56 draft documents / 293 entries and 36
  candidate pack documents / 143 entries. Pack schema remains 0.27 and the 0.28 mechanism is absent.
- Found one buildability defect in the accepted text: criterion 13 still requires
  `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE`, which the normative table withdrew into
  `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`; criterion 17 already uses the surviving code.
- Separated mechanism from apply. Feedback Stage 1 lands first; then the corrected schema, lints,
  planner, writer and emitters may implement. The 92-document rewrite/archive waits for a read-only
  mechanical-versus-judgement report and the owner's D560 budget decision.
- Closed D642 with a five-test disposable readiness harness. No product code, schema, protected
  intent or authored content changed; Gate F and D560 remain active.

## 2026-08-20 — Feedback Stage 1 recovered its measurement and hit an acceptance conflict

- Replaced criterion 16's invalid one-ply construction with deterministic eight-ply N=2/4/8
  continuations. N=8 now admits 70/450 (15.6%), below the 90% reopening threshold; the original
  100% result remains recorded as instrument failure.
- Reused the runtime's canonical observation identity, removing the private strip identity D527
  identified. Focused tests remain green.
- Mapped criteria 1–20a and found aggregate verification had not encoded all accepted negatives.
- Reproduced D644: criterion 20 fails on 46/67 projected backing rows because it forbids words in
  authored principle fields C8 requires rendered verbatim. Prepared a narrow author correction;
  no authored content, schema or protected design changed. Stage 2 and D560 remain untouched.

## 2026-08-21 — owner approved the five process-RFC recommendations

- D648 records approval of `shared-resource-registers` Q1/Q2 and
  `rfc-lifecycle-completion` Q1–Q3 exactly as recommended.
- Owner decision is no longer a blocker. Claude must still refresh both drafts against HEAD,
  reconcile their criteria, cross-review them and accept them before implementation begins.
- The same handoff retains the protected O1–O4/O13 intent amendments and explicitly preserves the
  unresolved R3/R7/R8/R15 product questions.
- Execution truth was refreshed: Feedback Stage 1 is landed; graduation's corrected mechanism and
  read-only planner are next after its author correction, while D560 continues to block corpus
  application and Feedback Stage 2.

## 2026-08-21 — the O1-O4/O13 intent amendments landed (claude on the owner's rulings)

- Executed `intent-amendment-handoff.md` as the law-5 claude-on-an-owner-ruling pass. Mirrored,
  did not manufacture: every R3/R7/R8/R15 boundary the packet marks open is preserved as open.
- `design/02-product-shape.md`: O13 Choice C recorded as the 1.0 deployment floor with all nine
  appliance clauses named; the self-hostable appliance is a core supported topology; hosted
  multi-user is retained but no core learner journey may depend on a hosted secret/provider;
  source model and monetization preserved open. Platform is partially ruled: web-first responsive
  PWA is the 1.0 target, native apps outside 1.0; per D649 the screen-reader/physical-device
  release gate is proven by the owner's own devices and use, not recruited participants.
- `design/03-product-breadth.md`: the raw producer list is now the advanced analysis inspector
  inventory; ordinary workflows consume named modules/presets under O1's compiled
  producer→evidence→consumer manifest; LLM wording never selects or grades evidence. Gate rows
  corrected with dated evidence and history retained: B4 negative on A4
  (`design/research/evidence-contract-topology.md`), B8 negative against the Choice-C floor on
  R18 (`design/research/release-platform-audit.md`), B9 qualified on A3
  (`design/research/detector-semantic-conformance.md`), B10 qualified on A5
  (`design/research/workflow-default-conformance.md`). Drill loop and native match untouched;
  Campaign/Coach/Streamer not promoted.
- `design/04-content-architecture.md`: the O1/Gate-F primitive definition (producer, typed
  projections, operands, grounding/exactness/abstention, consumers, compatibility; distinct
  projection identities per A3; machine-readable capability/semantic dependencies;
  `outpost`→`pawn_safe_square` migration case; D560 hold until Gate F + dependency-aware dry-run
  + primitive-complete sacrificial pilot). D531 principle-classification ownership recorded in
  the production model. O5/O6 theory-source and stable-primitive choices left open.
- `design/05-in-run-experience.md`: ladder amendment (source risk, not wiring/significance;
  eligibility precedes selection with the O2 learner-event bar; rarity cannot supply valence;
  O3 deterministic selection), manifest-declared forms replace implicit any-rung-any-form,
  layered configuration (workflow identity/preset separate from source prefs; narrowing
  intersection; Support preset for proactive prevention; first-class empty states; input
  equivalence), guided mode restated as a module composition, R5's measured LLM boundary, and
  open questions 1/4 updated as partially ruled.
- Mirrors reconciled: decision-queue O1-O4/O13 rows now name the amended sections and carry the
  D649 posture; `planning/exploration/gates.md` gained the B9 A3 qualification and a dated
  correction to the stale "B1-B11 all green" headline.
- Stale Feedback Stage 1 planning corrected: dated landed-at-`a64e6c5` notes added to
  `active-rfc-audit.md`, `graduation-clearance-readiness.md`, `rfc-completion-refresh.md` and
  `rfc-graph.md`; `execution-queue.md` was already current.
- NOT done, out of this pass's authority: the D640 ledger-row update in `design/BACKLOG.md`, the
  intent-parity-harness rework, `make verify`, and the five process-RFC recordings (D648's
  cross-review is a separate author action). "Codex runs mechanical instruments" could not be
  traced to D531's text and was left out of `design/04`. Proposed ledger rows start at D650.

## 2026-08-21 — D537/D538/D573 implementation and downstream unblock

- Reproduced current HEAD before editing: A2 remained 4/90 exact live gestures, 15 wrong and 71
  missing; `h2h7` for authored `h2h6` reproduced, and resize remained the positive cache control.
- Added selection-bound Chessground invalidation and a compact objective bound that preserves the
  192 px board inside `.position-column`. The final A2 matrix is 90/90 exact over six packs × five
  viewports × click/drag/touch, including 18/18 at 390×844; zero wrong/missing.
- Added the missing product invariant: every served endgame at desktop/tablet/phone must have a
  hit-testable authored source and send the exact UCI after live remeasurement. Its first run failed
  on `e4c6`, forcing the first redraw one frame earlier before the gate passed.
- Closed D537/D538/D573 and refreshed the capability map, reality audit, A2/R3/R14 queues and
  campaign prerequisite. The board no longer blocks R3 owner-use or R14; a real admitted evidence
  packet and the owner's session still do. Accessibility/F12 remains negative and separate.
- Full closeout is green: `make verify` passed 767 tests / 117 files plus type/scaffold/packaging;
  `make test-browser` passed 26 with one optional Maia test skipped. The first full browser run
  failed seven old workflows because their shared helpers encoded the stale-coordinate assumption;
  remeasuring after selection/pointer-down repaired the tests and made D538 a suite-wide invariant.
- The standalone work-routing audit initially failed on freshly landed D650: the amendment recorded
  the protected-intent residual but routed it nowhere. `decision-queue.md` now names the required
  owner nod without making it, and the four-test routing audit is green again.

## 2026-08-21 — F1 evidence-contract manifest drafted after its process predecessors

- Re-derived the F1 gate against the amended intent, A3 detector conformance and A4 evidence
  topology. The opening conditions are complete: O1-O4 are ruled, `design/03`-`05` mirror them,
  and both shared-resource/lifecycle predecessors are implemented and archived.
- Drafted `rfc/evidence-contract-manifest.md`. Its unit is the fourteen audited producer paths;
  each must expose independently versioned producer/projection declarations and exact consumer
  bindings or an explicit inspector/author/operator/experimental/retired disposition.
- Kept the scope below F2/F5: no detector is declared significant or good/bad, no local selector,
  module, preset, workflow default, theory source or content migration is invented. The LLM remains
  an optional renderer after eligibility and selection, with deterministic provider-off output.
- The draft claims no existing shared-resource lane. Its IDs are an extensible set with per-entry
  versions, and duplicate `(id, version)` declarations fail compilation; no global copied manifest
  version or generated snapshot is introduced.
- Graduation clearance remains separately blocked on its recorded one-line author correction:
  criterion 13 names withdrawn `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE`; the normative table and
  criterion 17 require `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`. D560 still gates corpus apply.
- Next: exact-symbol/buildability and cross-review of F1; only an accepted RFC authorises code.

## 2026-08-21 — F12 split and accessible-board-input drafted

- Refreshed R18 before copying it into an RFC: D614's README defect is closed and D537/D538/D573
  moved the exact live pointer matrix from 4/90 to 90/90. D605-D613 and D615 remain real; keyboard
  move entry and normal Tab traversal are still absent.
- Split Choice C into seven bounded child mechanisms plus one integrated release proof in
  `release-platform/f12-work-order.md`. Independent deployment/data/operations/input work is
  separated from provider health (behind F1), runtime distribution (partly behind F3/F4), and
  offline knowledge/PWA (behind F4).
- Surfaced two owner decisions rather than hiding them in implementation: private-vs-shared
  deletion retention, and the `core` / FOSS `cpu` / optional separately disclosed `accelerated`
  image/resource matrix.
- Drafted `rfc/accessible-board-input.md` as F12-F. One controller owns legal move submission for
  click/drag/touch, keyboard navigation, an assistive semantic grid and SAN/UCI text entry; the
  permanent browser matrix expands from 90 to 150 exact cells. Unmodified Tab returns to focus
  traversal; no evidence or assistance is added.
- No product code, schema, storage, content or protected intent changed. Both drafts require
  buildability/cross-review and acceptance before implementation.

## 2026-08-21 — Choice-C resource tiers ruled

- Owner adopted F12-E's three-tier appliance matrix as proposed: deterministic no-model `core`,
  FOSS Stockfish plus CPU Maia `cpu` as the default full local-opponent appliance, and separately
  labelled/licensed optional GPU `accelerated`.
- No core learner journey may depend on the accelerated image; external providers remain optional.
- The deletion-retention choice remains open pending clarification of its user-visible effects.

## 2026-08-21 — Dependency-aware deletion retention ruled

- Owner adopted F12-B's recommended boundary after its effects were stated: private/solo history and
  learner-only state hard-delete; only authenticated shared dependencies and explicitly published
  artifacts survive as immutable identity-tombstoned records.
- Anonymous share links are revoked and do not retain an otherwise-private run. Retained shared
  runs lose all real writers; private marks and import metadata are removed while the shared move/
  event history remains readable to the other learner.
- The same classifier governs per-run deletion. Both F12 owner choices are now settled and F12-B is
  open for RFC drafting; product behavior is unchanged until an RFC is accepted and implemented.

## 2026-08-21 — F12-B drafted; teacher-surface deletion collision found

- Drafted `rfc/portable-account-data.md`: exhaustive table-to-policy inventory, deterministic
  account bundle, stale-safe previews, private-run erasure, shared/published tombstones and per-run
  deletion. Register/status checks are green after using the implemented discharge grammar.
- Author review found accepted `teacher-surface` §4.1a/criterion 9a pre-revokes a submitted learner's
  teacher grant and expects no grant to survive. That is the opposite of D656, where the current
  authenticated grant is what retains the run for the collaborator. Recorded D657 rather than
  letting two accepted contracts race.
- Landing order is now explicit: `teacher-surface` first for its migration, then F12-B atomically
  inventories its tables and supersedes only its account-deletion outcome. Explicit withdrawal,
  leave, removal, expiry, archive and classroom-delete revocation remain unchanged.

## 2026-08-21 — Graduation-clearance read-only plan landed

- `make graduation-plan` now executes the accepted seven-rule classifier and 17-row hand table over
  all 56 drafts, inventories all 36 candidate documents against the nine emitter templates, and
  prints the mechanical-versus-judgment boundary without writing any artifact.
- The verify guard pins 203 rule suggestions, 17 hand assignments, 141 recognized candidate
  entries, two named non-template exceptions and zero unclassified draft blockers.
- D658 closed after the first run showed six published hand-table labels are file stems rather than
  internal pack ids. Both identities remain visible; the lookup follows the RFC's file-stem key.
- D560 remains active: pack schema stays 0.27 and product clearance code, 92-document mutation,
  sidecar restamping, lane release and RFC archival remain behind Gate F and the owner budget call.

## 2026-08-21 — D651 protected-intent parity closed

- Replaced D640's stale-text detector with six positive contracts reading the amended `design/02`
  through `05`, the Gate-F plan and the B4/B8/B9/B10 mirror in exploration gates.
- The guard checks 30 required amendment anchors, five deliberately preserved open boundaries,
  three amendment-after-history orderings and four measured cross-document gate pairs.
- The old registry's unsupported provider-comprehension “open question” was refused rather than
  carried forward; the approved handoff specifies conformance/fallback, while D649 descopes the
  recruited-participant arm.
- `make intent-parity` is read-only, byte-checks its report, runs under the built-in Node test
  runner and is now a required `make verify` dependency. D651 is closed.

## 2026-08-21 — Wave 6B split on its real gates; F2 drafted

- Re-derived F2/F3 authority after F1 instead of inheriting the paired queue row. F2 is open:
  R1/R2/A3, O2/O3 and F1 are complete. F3 is still closed because its declared gate includes O6,
  which remains blocked by R8/R10 and the owner's Gate-F primitive/re-authoring budget. Recorded
  D680 and corrected the sufficiency memo, execution queue and RFC graph.
- Corrected D660 before it could become product policy. D542/D543's 294× top-two lift remains a
  population-specific diagnostic; the later R2 transfer experiment refused global lift as
  eligibility or ordering authority and established the local legal-alternative denominator as
  the transferable selector. D681 makes the negative guard explicit.
- Drafted `rfc/semantic-evidence-selection.md`: identity-preserving literal events, exact
  event→consumer eligibility, independent irreversibility properties, a parameterised deterministic
  local selector, honest empty output and removal of the exported generic payload constructor.
- The draft makes no learner-visible routing/default choice, schema or migration claim, content
  edit or Gate-F claim. F5 owns production module policies; F3 remains behind O6.
- Next: exact-symbol/buildability review. Implementation remains unauthorized until correction,
  acceptance and an implementing planning directory.

## 2026-08-21 — GitHub verify timeout reproduced and repaired

- Read failed GitHub run 32515030312 rather than inferring from its passing tail. The sole failure
  was `expression-census.test.ts:183`: a second full declaration census took 5.282 s under Node 24
  and hit Vitest's 5 s default; its assertions did not fail.
- Added the same explicit 20 s per-test budget already used by the adjacent whole-tree mutation
  census. This changes no product timeout or census semantics. Recorded D682.
- Local baseline before the repair was green: 125 files / 806 tests; the full `make verify` path
  also passed typecheck, tests and all register/status/intent/manifest/graduation checks.
- Next: run the focused test repeatedly and the complete verify path after the timeout repair.

## 2026-08-21 — D682 local verification complete

- Focused `expression-census.test.ts`: 17/17 green in 36.87 s.
- Full `make verify`: typecheck green; 125 files / 806 tests green; scaffold/packaging, shared
  register, lifecycle status, protected-intent parity, evidence-manifest and graduation-plan checks
  green. GitHub confirmation necessarily waits for a pushed commit; no push was performed.

## 2026-08-21 — F2 first buildability review corrected four false shortcuts

- Direct rules events are now exact declared evidence; only genuinely composed events carry
  derivation inputs. The first draft's universal source-projection field would have forced a
  self-dependency or an invented source.
- The selector denominator is all legal alternatives other than the committed move, including
  alternatives emitting no event. It refuses an incomplete counterfactual population instead of
  treating unavailable provider output as “did not signal.”
- Critical IDs bypass only the minimum/share gate and remain inside finite consumer budgets;
  concurrent overflow is explicit, deterministic rejection rather than hidden budget widening.
- Legacy R2 output and new F2-event output now have separate baselines. The new event set cannot
  claim R2's old 0.79/1.03 volume numbers by inheritance.
- Re-derived the D668 migration at HEAD: 38 direct production call lines across fourteen files
  (six runtime, five server, three web), all owned by the exact-adapter closure.

## 2026-08-21 — CI runtime matched and F2 counterfactual identity corrected

- Re-ran the previously failing expression census inside Node 24 on Linux. All 17 tests passed;
  the exact producerless-error test completed in 4.244 s under the new 20 s whole-tree budget.
  Together with the green 806-test `make verify`, this closes the local/runtime-family evidence for
  D682; an actual hosted check still requires a pushed commit.
- A second F2 buildability read found that `avoided` cannot be a direct committed-edge sign. It is
  defined by absence on the played move plus prevalence over a complete legal-alternative
  population. Recorded D683 and changed the RFC to eleven exact registered derived projections,
  each retaining the signed base family, all supporting alternative events and denominator. This
  preserves F1's renderer/voice authority instead of making a parallel multi-source object.
- Made the initial semantic event boundary exhaustive: 22 direct plus eleven derived version-1
  projection IDs. This prevents an implementer from silently filling the tactic/plan gap inside F2.

## 2026-08-21 — Full Node-24/Linux CI comparison

- Ran the workflow's full typecheck/test path in the amd64 Node 24 Linux image with pinned
  Stockfish under Apple-Silicon emulation. Typecheck passed and 803/806 tests passed; the repaired
  census completed in 4.498 s. Three unrelated 5 s tests crossed their limits only under emulation.
- Compared those exact files to native GitHub run 32515030312: `pack-authoring.test.ts`,
  `application.test.ts` and `feedback-delivery.test.ts` all passed there; the run's sole failure was
  the now-repaired expression census. They are not widened on emulator-only evidence.
- The remaining proof is the real push-triggered GitHub run. No push was performed.

## 2026-08-21 — Hosted CI confirmed; F2 fixture residue found

- Owner reported the pushed workflow green; verify run 32518662865 passed on `fb7a147`. D682 is
  closed with hosted evidence.
- Final F2 buildability review found D684: the R2 imported result retained its digest and output but
  not `/tmp/tabiya-games-head.pgn`. Criterion 10 cannot require a rerun over vanished bytes. Repair
  the bounded CC0 fixture/origin before acceptance; do not weaken “external validation” to a saved
  Markdown number.

## 2026-08-21 — D684 closed with a bounded CC0 fixture

- Downloaded only bytes 0–16,777,215 of the official July 2026 archive and extracted the
  predeclared first twelve legal games in every speed/rating cell.
- The retained 248,593-byte fixture contains 108 games, fills all nine cells, yields 579 decisions,
  and reproduces every original R2 report line after the input digest byte-for-byte.
- Added the extraction helper, source/range/digest manifest and a fixture-integrity test. R2 now
  runs without an environment variable; 3/3 harness tests pass. D684 is closed.

## 2026-08-21 — F2 accepted after buildability and reproducibility repair

The owner directed work to continue after hosted CI passed. With two buildability reviews complete
and D684 closed, `semantic-evidence-selection` is accepted. Its implementation boundary is 22
direct plus eleven derived semantic projections, research-only eligibility/policy, a complete local
alternative selector and D668's source-adapter seal. F5—not F2—still owns learner-visible modules,
thresholds, presets and defaults.

## 2026-08-21 — F2 implementation opened

Created `planning/semantic-evidence-selection/` and moved the accepted RFC to implementing. Landing
order is compiled contract → literal producers → selector/avoidance → D668 seal → integration.
Product modules/defaults, schemas and content remain explicitly out of scope.

## 2026-08-21 — R8 exact theory↔drill architecture complete

- Current join audit: 50 draft packs, 25 shapes, 44 pack→shape refs and 82 pack→principle refs;
  the learner path still drops exact pack identity, includes prospective refs, and offers no
  ShapePanel/Library/Review handoff. D692-D695 record the edges.
- Targeted first-party comparison isolates adjacent Learn/Practice/Retry, exact repertoire-branch
  continuity, in-context hint controls and an open study substrate without importing engine grades.
- The five-check exact prototype preserves source run/node, excludes prospective refs, treats
  no-pack and candidate-only as honest empty, and finds 52 opening records map to 49 position keys
  with three multi-record parent/descendant identities (D696).
- O5 is ready. D697 splits O6's ready capability/migration/budget decision from final pilot
  membership, removing the F3→F7→Gate-F→R10 planning cycle without lifting Gate F or D560.

## 2026-08-21 — O8 bot-policy handoff ready

- Reconciled R11 with D649: mechanical/desk research is complete, recruited review is out of scope,
  and the 42-branch blind packet remains an owner-use instrument rather than an external blocker.
- Preserved H5/C5 as unmet population claims; neither owner use nor mechanical proxies silently
  clear them.
- Prepared `bot-policy/o8-handoff.md`: one versioned policy stack; human baseline, disclosed 250 cp
  guard and measured pawn-heavy profile; controlled/observed/presentation separation; no invented
  repertoire, memory or personality labels. O8 is ready and R13 is the next executable research job.
